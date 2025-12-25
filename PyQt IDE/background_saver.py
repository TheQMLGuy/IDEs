# background_saver.py

from PyQt5.QtCore import QThread, pyqtSignal, QObject


class BackgroundSaver(QObject):
    """
    A worker object that runs in a separate thread to save files
    without blocking the main UI.
    """
    save_all_files_signal = pyqtSignal()

    def __init__(self, ide_window, save_interval=5000):  # Save every 5 seconds
        super().__init__()
        self.ide_window = ide_window
        self.save_interval = save_interval
        self._is_running = True

        self.thread = QThread()
        self.moveToThread(self.thread)
        self.thread.started.connect(self.run)
        self.save_all_files_signal.connect(self.ide_window.save_all_open_tabs)

    def start(self):
        """Starts the background thread."""
        self.thread.start()

    def stop(self):
        """Stops the background thread."""
        self._is_running = False
        self.thread.quit()
        self.thread.wait()

    def run(self):
        """The main loop for the background saver."""
        while self._is_running:
            self.save_all_files_signal.emit()
            QThread.msleep(self.save_interval)