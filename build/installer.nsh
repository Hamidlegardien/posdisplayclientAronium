!macro customInstall
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "AroniumPOS Display Client" "$INSTDIR\AroniumPOS Display Client.exe"
!macroend
!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "AroniumPOS Display Client"
!macroend
