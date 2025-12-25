# main.py

import sys
from PyQt5.QtWidgets import QApplication
from ide_window import IDEWindow

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = IDEWindow()
    window.show()
    sys.exit(app.exec())