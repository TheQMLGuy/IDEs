from PyQt5.QtGui import QColor, QFont
import os,sys
from PyQt5.Qsci import QsciScintilla, QsciLexerPython

class EditorWidget(QsciScintilla):
    def __init__(self):
        super().__init__()
        self.setUtf8(True)
        self.setLexer(QsciLexerPython())
        self._style_editor()

    def _style_editor(self):
        margin_bg_color = QColor("#252526")
        line_highlight_color = QColor("#2a2d2e")
        caret_color = QColor("#aeafad")

        self.setCaretForegroundColor(caret_color)
        self.setMarginsBackgroundColor(margin_bg_color)
        self.setMarginsForegroundColor(QColor("#858585"))
        self.setBraceMatching(QsciScintilla.BraceMatch.SloppyBraceMatch)
        self.setIndentationsUseTabs(False)
        self.setTabWidth(4)
        self.setIndentationGuides(True)
        self.setAutoIndent(True)
        self.setFolding(QsciScintilla.FoldStyle.PlainFoldStyle)
        self.setEdgeMode(QsciScintilla.EdgeMode.EdgeLine)
        self.setEdgeColumn(80)
        self.setEdgeColor(QColor("#404040"))
        self.setCaretLineVisible(True)
        self.setCaretLineBackgroundColor(line_highlight_color)

        font = QFont("JetBrains Mono", 12)
        if not font.exactMatch():
            font = QFont("Fira Code", 12)
        font.setStyleHint(QFont.StyleHint.Monospace)
        self.setFont(font)
        self.setMarginsFont(font)

        self.setMarginType(1, QsciScintilla.MarginType.NumberMargin)
        self.setMarginWidth(1, "00000")
        self.setMarginLineNumbers(1, True)