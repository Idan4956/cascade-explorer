; Cascade Explorer – Windows Shell Integration
; Runs during NSIS install/uninstall to register AutoPlay handlers,
; folder context menu entries, and a Send To shortcut.

!macro customInstall

  ; ── AutoPlay handler registration ──────────────────────────────────────────
  ; This makes Cascade appear in the AutoPlay dialog when a USB drive,
  ; SD card, camera, or Android device is connected.

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\Handlers\CascadeExplorerOpen" \
    "Action" "Open with Cascade Explorer"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\Handlers\CascadeExplorerOpen" \
    "DefaultIcon" "$INSTDIR\Cascade.exe,0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\Handlers\CascadeExplorerOpen" \
    "InvokeProgID" "CascadeExplorer.AutoPlay"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\Handlers\CascadeExplorerOpen" \
    "InvokeVerb" "open"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\Handlers\CascadeExplorerOpen" \
    "Provider" "Cascade Explorer"

  ; Register for USB/SD card storage arrivals
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\EventHandlers\StorageOnArrival" \
    "CascadeExplorerOpen" ""

  ; Register for camera/photo devices
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\EventHandlers\CameraAlbum" \
    "CascadeExplorerOpen" ""

  ; Register for MTP/Android devices (WPD)
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\EventHandlers\WPD\ImageSource" \
    "CascadeExplorerOpen" ""
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\EventHandlers\WPD\ContentSource" \
    "CascadeExplorerOpen" ""

  ; ProgID command that AutoPlay invokes – passes %L (drive root)
  WriteRegStr HKCU "Software\Classes\CascadeExplorer.AutoPlay\shell\open\command" \
    "" '"$INSTDIR\Cascade.exe" "%L"'

  ; ── "Open with Cascade Explorer" on folders and drives ─────────────────────
  WriteRegStr HKCU "Software\Classes\Directory\shell\CascadeExplorer" \
    "" "Open with Cascade Explorer"
  WriteRegStr HKCU "Software\Classes\Directory\shell\CascadeExplorer" \
    "Icon" '"$INSTDIR\Cascade.exe",0'
  WriteRegStr HKCU "Software\Classes\Directory\shell\CascadeExplorer" \
    "Position" "Top"
  WriteRegStr HKCU "Software\Classes\Directory\shell\CascadeExplorer\command" \
    "" '"$INSTDIR\Cascade.exe" "%V"'

  WriteRegStr HKCU "Software\Classes\Drive\shell\CascadeExplorer" \
    "" "Open with Cascade Explorer"
  WriteRegStr HKCU "Software\Classes\Drive\shell\CascadeExplorer" \
    "Icon" '"$INSTDIR\Cascade.exe",0'
  WriteRegStr HKCU "Software\Classes\Drive\shell\CascadeExplorer" \
    "Position" "Top"
  WriteRegStr HKCU "Software\Classes\Drive\shell\CascadeExplorer\command" \
    "" '"$INSTDIR\Cascade.exe" "%V"'

  ; ── Send To shortcut ────────────────────────────────────────────────────────
  CreateShortcut "$SENDTO\Cascade Explorer.lnk" \
    "$INSTDIR\Cascade.exe" "" \
    "$INSTDIR\Cascade.exe" 0

  ; Notify the shell so changes take effect immediately
  System::Call 'shell32.dll::SHChangeNotify(l, l, i, i) v (0x08000000, 0x0000, 0, 0)'

!macroend


!macro customUnInstall

  ; Remove AutoPlay entries
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\Handlers\CascadeExplorerOpen"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\EventHandlers\StorageOnArrival" "CascadeExplorerOpen"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\EventHandlers\CameraAlbum" "CascadeExplorerOpen"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\EventHandlers\WPD\ImageSource" "CascadeExplorerOpen"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\AutoplayHandlers\EventHandlers\WPD\ContentSource" "CascadeExplorerOpen"
  DeleteRegKey HKCU "Software\Classes\CascadeExplorer.AutoPlay"

  ; Remove context menu entries
  DeleteRegKey HKCU "Software\Classes\Directory\shell\CascadeExplorer"
  DeleteRegKey HKCU "Software\Classes\Drive\shell\CascadeExplorer"

  ; Remove Send To shortcut
  Delete "$SENDTO\Cascade Explorer.lnk"

  System::Call 'shell32.dll::SHChangeNotify(l, l, i, i) v (0x08000000, 0x0000, 0, 0)'

!macroend
