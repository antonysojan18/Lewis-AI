Set WshShell = CreateObject("WScript.Shell")

' Starts OmniRoute gateway invisibly if installed
On Error Resume Next
WshShell.Run "cmd /c omniroute", 0, False
WScript.Sleep 2000

' Starts Lewis Background Voice Daemon invisibly
WshShell.Run "python ""D:\Lewis AI\lewis_service.py""", 0, False
