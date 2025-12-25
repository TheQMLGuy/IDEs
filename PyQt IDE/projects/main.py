import sys

from PyQt6.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QLabel

from PyQt6.QtCore import Qt



# --- Local Project Imports ---

# The live preview will automatically handle these imports because of auto-save.

from data_model import get_user_data

from ui_widgets import create_profile_header, create_stats_layout



class UserProfileApp(QMainWindow):

    def __init__(self):

        super().__init__()

        self.setWindowTitle("User Profile")



        # --- Fetch Data ---

        user_data = get_user_data()



        # --- Main Layout ---

        central_widget = QWidget()

        self.setCentralWidget(central_widget)

        main_layout = QVBoxLayout(central_widget)

        main_layout.setAlignment(Qt.AlignmentFlag.AlignTop)

        central_widget.setStyleSheet("background-color: #2b2b2b;")



        # --- Create UI from Components ---

        profile_header = create_profile_header(user_data["name"], user_data["username"])

        bio_label = QLabel(user_data["bio"])

        bio_label.setWordWrap(True)

        bio_label.setStyleSheet("font-size: 14px; color: #B0B0B0; padding-top: 10px;")

        

        stats_widget = create_stats_layout(user_data["stats"])



        # --- Assemble the View ---

        main_layout.addWidget(profile_header)

        main_layout.addWidget(bio_label)

        main_layout.addWidget(stats_widget)





# --- Boilerplate (handled by the IDE) ---

if __name__ == "__main__":

    app = QApplication(sys.argv)

    window = UserProfileApp()

    window.show()

    sys.exit(app.exec())

