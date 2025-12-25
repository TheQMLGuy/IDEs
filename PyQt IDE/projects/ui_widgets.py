# ui_widgets.py

from PyQt6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel
from PyQt6.QtGui import QPixmap
from PyQt6.QtCore import Qt

def create_profile_header(name, username):
    """Creates the top part of the profile card with name and username."""
    header_widget = QWidget()
    layout = QVBoxLayout(header_widget)
    layout.setSpacing(0)

    name_label = QLabel(name)
    name_label.setStyleSheet("font-size: 24px; font-weight: bold; color: #E0E0E0;")
    
    username_label = QLabel(username)
    username_label.setStyleSheet("font-size: 16px; color: #888;")

    layout.addWidget(name_label)
    layout.addWidget(username_label)
    
    return header_widget

def create_stats_layout(stats_dict):
    """Creates a horizontal layout for user stats (Followers, Following, etc.)."""
    stats_widget = QWidget()
    layout = QHBoxLayout(stats_widget)
    layout.setContentsMargins(0, 10, 0, 10)
    
    for key, value in stats_dict.items():
        stat_layout = QVBoxLayout()
        value_label = QLabel(value)
        value_label.setStyleSheet("font-size: 18px; font-weight: bold; color: #CDCDCD;")
        value_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        key_label = QLabel(key)
        key_label.setStyleSheet("font-size: 12px; color: #888;")
        key_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        stat_layout.addWidget(value_label)
        stat_layout.addWidget(key_label)
        layout.addLayout(stat_layout)
        
    return stats_widget
