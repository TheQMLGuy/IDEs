# preview_runner.py

import sys
import ast
import importlib
from importlib.abc import MetaPathFinder, Loader
from importlib.machinery import ModuleSpec
from PyQt6.QtWidgets import QWidget, QMainWindow, QLabel, QVBoxLayout
from PyQt6.QtCore import Qt
from auto_installer import AutoInstaller


class CodeSanitizer(ast.NodeTransformer):
    # (This class is unchanged)
    def visit_Expr(self, node):
        if isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Attribute):
            if node.value.func.attr in ['exec', 'exec_', 'show']: return None
        return self.generic_visit(node)

    def visit_Assign(self, node):
        if isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name):
            if node.value.func.id == 'QApplication': return None
        return self.generic_visit(node)


class InMemoryImporter(MetaPathFinder, Loader):
    # (This class is now more robust)
    def __init__(self, code_dict):
        self.code_dict = code_dict

    def find_spec(self, fullname, path, target=None):
        if fullname in self.code_dict:
            return ModuleSpec(fullname, self, origin=f"<in-memory:{fullname}>", is_package=False)
        return None

    def exec_module(self, module):
        # Sanitize the code before executing it
        tree = ast.parse(self.code_dict[module.__name__])
        sanitizer = CodeSanitizer()
        safe_tree = sanitizer.visit(tree)
        ast.fix_missing_locations(safe_tree)
        # Use compile with a placeholder filename for better error reporting
        safe_code = compile(safe_tree, f"<in-memory:{module.__name__}>", 'exec')
        exec(safe_code, module.__dict__)


class PreviewRunner:
    def __init__(self, preview_layout):
        self.preview_layout = preview_layout
        self.current_widget = None

    def clear_preview(self):
        if self.current_widget:
            self.current_widget.setParent(None)
            self.current_widget.deleteLater()
            self.current_widget = None

    def run_project(self, main_module_name, code_dict):
        self.clear_preview()

        main_code = code_dict.get(main_module_name)
        if main_code is None:
            self.display_error(f"Main module '{main_module_name}' not found.")
            return

        importer = InMemoryImporter(code_dict)

        # --- THE SMART FIX: Manually clear old modules from Python's cache ---
        # This forces Python to re-import our live code every time.
        for module_name in code_dict:
            if module_name in sys.modules:
                del sys.modules[module_name]

        sys.meta_path.insert(0, importer)

        try:
            AutoInstaller.install_missing_modules(main_code)

            # Use importlib to properly load the main module.
            # This will trigger our InMemoryImporter for all local files.
            main_module = importlib.import_module(main_module_name)

            # Now inspect the fully imported module to find the widget
            local_env = main_module.__dict__
            widget_class = None
            for obj in local_env.values():
                if isinstance(obj, type) and issubclass(obj, QMainWindow) and obj is not QMainWindow:
                    widget_class = obj
                    break
                elif isinstance(obj, type) and issubclass(obj, QWidget) and obj is not QWidget:
                    widget_class = obj

            if widget_class:
                widget_instance = widget_class()
                container = self.create_preview_container(widget_instance)
                self.current_widget = container
                self.preview_layout.addWidget(self.current_widget)

        except Exception as e:
            self.display_error(f"Execution Error: {e}")
        finally:
            # CRITICAL: Always remove the custom importer
            if importer in sys.meta_path:
                sys.meta_path.remove(importer)

    def create_preview_container(self, widget_instance):
        # (This function is unchanged)
        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setContentsMargins(0, 0, 0, 0)
        title = widget_instance.windowTitle()
        if title:
            title_label = QLabel(title)
            title_label.setStyleSheet(
                "font-size: 14px; font-weight: bold; color: #a9b7c6; padding: 5px; background-color: #3c3f41;")
            layout.addWidget(title_label)
        layout.addWidget(widget_instance)
        return container

    def display_error(self, message):
        # (This function is unchanged)
        error_label = QLabel(message)
        error_label.setWordWrap(True)
        error_label.setAlignment(Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignLeft)
        error_label.setStyleSheet("color: #E53935; font-size: 14px; padding: 5px;")
        self.current_widget = error_label
        self.preview_layout.addWidget(self.current_widget)