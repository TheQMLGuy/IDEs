# styles.py

STYLESHEET = """
    QMainWindow {
        background-color: #2b2b2b;
    }
    QSplitter::handle {
        background-color: #3c3f41;
    }
    QSplitter::handle:horizontal {
        width: 1px;
    }
    QSplitter::handle:vertical {
        height: 1px;
    }

    /* File Explorer */
    QTreeView {
        background-color: #2b2b2b;
        color: #a9b7c6;
        border: none;
        font-size: 14px;
    }
    QTreeView::item {
        padding: 5px;
    }
    QTreeView::item:selected {
        background-color: #3c3f41;
    }
    QHeaderView::section {
        background-color: #3c3f41;
        color: #a9b7c6;
        padding: 4px;
        border: none;
    }

    /* Tabbed Editor */
    QTabWidget::pane {
        border: none;
    }
    QTabBar::tab {
        background: #3c3f41;
        color: #a9b7c6;
        border: none;
        padding: 8px 15px;
        font-size: 13px;
    }
    QTabBar::tab:selected {
        background: #2b2b2b;
    }
    QTabBar::tab:!selected:hover {
        background: #313335;
    }
    QTabBar::close-button {
        image: url(close.png); /* You'll need a small close icon */
        subcontrol-position: right;
    }
"""