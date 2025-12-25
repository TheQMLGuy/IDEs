Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Set working directory to script folder
WshShell.CurrentDirectory = FSO.GetParentFolderName(WScript.ScriptFullName)

' Full Python path (adjust if needed)
pythonPath = "C:\Users\YourName\AppData\Local\Programs\Python\Python311\python.exe"

' Full main.py path
scriptPath = """C:\Github Repos\PyQt IDE\main.py"""

' Run silently (0 = hidden)
WshShell.Run """" & pythonPath & """ " & scriptPath, 0, False
