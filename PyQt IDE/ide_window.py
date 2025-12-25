# ide_window.py

import os
from PyQt6.QtWidgets import (QMainWindow, QSplitter, QWidget, QVBoxLayout,
                             QTabWidget, QTreeView, QFileDialog, QInputDialog, QMessageBox, QMenu)
from PyQt6.QtGui import QAction
from PyQt6.QtCore import Qt, QTimer, QModelIndex, QPoint
from editor_widget import EditorWidget
from preview_runner import PreviewRunner
from file_manager import FileManager
from styles import STYLESHEET
from background_saver import BackgroundSaver  # Import the new saver


class IDEWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("PyQt6 Live IDE")
        self.setGeometry(100, 100, 1800, 900)
        self.project_path = None

        self._create_menu_bar()
        self._setup_ui()
        self._setup_default_project()
        self.setStyleSheet(STYLESHEET)

        # --- NEW: Start the background auto-saver ---
        self.background_saver = BackgroundSaver(self)
        self.background_saver.start()

    def _setup_ui(self):
        # (This function is unchanged)
        main_splitter = QSplitter(Qt.Orientation.Horizontal)
        self.setCentralWidget(main_splitter)
        self.file_explorer = QTreeView()
        self.file_manager = FileManager(self.file_explorer)
        self.file_explorer.doubleClicked.connect(self.open_file_from_explorer)
        self.file_explorer.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.file_explorer.customContextMenuRequested.connect(self.show_explorer_context_menu)
        self.tab_widget = QTabWidget()
        self.tab_widget.setTabsClosable(True)
        self.tab_widget.tabCloseRequested.connect(self.close_tab)
        self.preview_container = QWidget()
        self.preview_layout = QVBoxLayout(self.preview_container)
        main_splitter.addWidget(self.file_explorer)
        main_splitter.addWidget(self.tab_widget)
        main_splitter.addWidget(self.preview_container)
        main_splitter.setSizes([250, 800, 750])
        self.runner = PreviewRunner(self.preview_layout)
        self.debounce_timer = QTimer(self)
        self.debounce_timer.setSingleShot(True)
        self.debounce_timer.timeout.connect(self.run_project_preview)

    def _setup_default_project(self):
        # (This function is unchanged)
        default_project_path = os.path.join(os.getcwd(), "projects")
        os.makedirs(default_project_path, exist_ok=True)
        default_main_file = os.path.join(default_project_path, "main.py")
        if not os.path.exists(default_main_file):
            with open(default_main_file, 'w') as f:
                f.write("# Your main application code goes here\n")
        self.project_path = default_project_path
        self.file_manager.set_root_path(self.project_path)
        self.create_new_tab(default_main_file)

    def run_project_preview(self):
        """Gathers live code from all tabs and runs it from memory."""
        if not self.project_path: return

        live_code = {}
        for i in range(self.tab_widget.count()):
            editor = self.tab_widget.widget(i)
            file_path = editor.property("file_path")
            module_name = os.path.splitext(os.path.basename(file_path))[0]
            live_code[module_name] = editor.text()

        main_module_name = "main" if "main" in live_code else "app"

        if main_module_name in live_code:
            self.runner.run_project(main_module_name, live_code)
        else:
            self.runner.display_error("No 'main.py' or 'app.py' tab is open.")

    # --- Other methods remain unchanged, including the NEW save_all_open_tabs ---

    def save_all_open_tabs(self):
        """Method called by the background thread to save files."""
        for i in range(self.tab_widget.count()):
            editor = self.tab_widget.widget(i)
            # Ensure we get the latest text from the editor thread-safely
            file_path = editor.property("file_path")
            content = editor.text()
            self.file_manager.save_file(file_path, content)
        print("Background save complete.")

    def _create_menu_bar(self):
        menu_bar = self.menuBar()
        file_menu = menu_bar.addMenu("&File")
        open_folder_action = QAction("Open Folder...", self)
        open_folder_action.triggered.connect(self.open_folder)
        file_menu.addAction(open_folder_action)
        save_action = QAction("Save Current File", self)
        save_action.triggered.connect(self.save_current_file)
        save_action.setShortcut("Ctrl+S")
        file_menu.addAction(save_action)

    def open_folder(self):
        path = QFileDialog.getExistingDirectory(self, "Open Folder")
        if path:
            self.project_path = path
            self.file_manager.set_root_path(path)

    def save_current_file(self):
        if self.tab_widget.count() == 0: return
        current_editor = self.tab_widget.currentWidget()
        file_path = current_editor.property("file_path")
        content = current_editor.text()
        if self.file_manager.save_file(file_path, content):
            print(f"Saved: {file_path}")

    def open_file_from_explorer(self, index: QModelIndex):
        file_path = self.file_manager.get_path(index)
        if os.path.isfile(file_path):
            self.create_new_tab(file_path)

    def create_new_tab(self, file_path):
        for i in range(self.tab_widget.count()):
            if self.tab_widget.widget(i).property("file_path") == file_path:
                self.tab_widget.setCurrentIndex(i)
                return
        content = self.file_manager.read_file(file_path)
        if content is not None:
            editor = EditorWidget()
            editor.setText(content)
            editor.setProperty("file_path", file_path)
            editor.textChanged.connect(self.on_text_changed)
            tab_name = os.path.basename(file_path)
            index = self.tab_widget.addTab(editor, tab_name)
            self.tab_widget.setCurrentIndex(index)

    def close_tab(self, index):
        self.tab_widget.removeTab(index)

    def on_text_changed(self):
        self.debounce_timer.start(500)

    def show_explorer_context_menu(self, position: QPoint):
        index = self.file_explorer.indexAt(position)
        menu = QMenu()
        new_file_action = menu.addAction("New File")
        new_folder_action = menu.addAction("New Folder")
        if index.isValid():
            menu.addSeparator()
            rename_action = menu.addAction("Rename")
            delete_action = menu.addAction("Delete")
        action = menu.exec(self.file_explorer.viewport().mapToGlobal(position))
        if action == new_file_action:
            self.create_new_item(index, is_file=True)
        elif action == new_folder_action:
            self.create_new_item(index, is_file=False)
        elif index.isValid() and action == rename_action:
            self.rename_item(index)
        elif index.isValid() and action == delete_action:
            self.delete_item(index)

    def create_new_item(self, index: QModelIndex, is_file: bool):
        path = self.file_manager.get_path(index) if index.isValid() else self.project_path
        if not os.path.isdir(path):
            path = os.path.dirname(path)
        item_type = "file" if is_file else "folder"
        name, ok = QInputDialog.getText(self, f"New {item_type}", f"Enter {item_type} name:")
        if ok and name:
            if is_file:
                self.file_manager.create_file(path, name)
            else:
                self.file_manager.create_folder(path, name)

    def rename_item(self, index: QModelIndex):
        current_name = self.file_manager.model.fileName(index)
        new_name, ok = QInputDialog.getText(self, "Rename", "Enter new name:", text=current_name)
        if ok and new_name and new_name != current_name:
            self.file_manager.rename_item(index, new_name)

    def delete_item(self, index: QModelIndex):
        path = self.file_manager.get_path(index)
        reply = QMessageBox.question(self, 'Delete Item', f"Are you sure you want to delete {os.path.basename(path)}?",
                                     QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if reply == QMessageBox.StandardButton.Yes:
            self.file_manager.delete_item(index)