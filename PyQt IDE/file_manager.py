# file_manager.py

import os
from PyQt5.QtGui import QFileSystemModel
from PyQt5.QtCore import QDir, QModelIndex
import shutil

class FileManager:
    def __init__(self, tree_view):
        self.tree_view = tree_view
        self.model = QFileSystemModel()
        self.model.setReadOnly(False) # Allow file system modifications
        self.tree_view.setModel(self.model)

        # Hide unnecessary columns
        for i in range(1, self.model.columnCount()):
            self.tree_view.setColumnHidden(i, True)

    def set_root_path(self, path):
        """Sets the root directory for the file explorer."""
        self.root_path = path
        self.tree_view.setRootIndex(self.model.setRootPath(path))

    def get_path(self, index: QModelIndex):
        """Gets the file or directory path for a given model index."""
        return self.model.filePath(index)

    def read_file(self, file_path):
        """Reads the content of a file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            return None

    def save_file(self, file_path, content):
        """Saves content to a file."""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error saving file {file_path}: {e}")
            return False

    def create_file(self, parent_dir_path, name):
        """Creates a new empty file."""
        try:
            path = os.path.join(parent_dir_path, name)
            open(path, 'a').close()
            return True
        except Exception as e:
            print(f"Error creating file {name}: {e}")
            return False

    def create_folder(self, parent_dir_path, name):
        """Creates a new empty folder."""
        try:
            os.makedirs(os.path.join(parent_dir_path, name))
            return True
        except Exception as e:
            print(f"Error creating folder {name}: {e}")
            return False

    def rename_item(self, index: QModelIndex, new_name):
        """Renames a file or folder."""
        self.model.setData(index, new_name)

    def delete_item(self, index: QModelIndex):
        """Deletes a file or folder."""
        path = self.get_path(index)
        if os.path.isdir(path):
            self.model.rmdir(index)
        else:
            self.model.remove(index)