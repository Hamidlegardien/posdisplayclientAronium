;===============================================================================
; AroniumPOS Display Client — Inno Setup 6
; Pure black amber theme, VSPE for virtual COM ports
;===============================================================================
#define AppName      "AroniumPOS Display Client"
#define AppVersion   "1.1.3"
#define AppPublisher "Hamidlegardien"
#define AppURL       "https://github.com/Hamidlegardien/posdisplayclientAronium"
#define AppExeName   "AroniumPOS Display Client.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
DefaultDirName={autopf}\AroniumPOS\{#AppName}
DefaultGroupName={#AppName}
OutputDir=..\dist-inno
OutputBaseFilename=AroniumPOS-Display-Client-Setup-{#AppVersion}
SetupIconFile=icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#AppExeName}
CloseApplications=yes
WizardImageFile=wizard_image.bmp
WizardSmallImageFile=wizard_small.bmp

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startup";     Description: "Launch automatically on Windows startup"; GroupDescription: "Options:"

[Files]
Source: "..\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "SetupVSPE_64.msi";        DestDir: "{tmp}"; Flags: ignoreversion deleteafterinstall
Source: "com_pair.vspe";           DestDir: "{app}\resources"; Flags: ignoreversion
Source: "install_vspe_ports.ps1";  DestDir: "{app}\resources"; Flags: ignoreversion

[Icons]
Name: "{group}\{#AppName}";           Filename: "{app}\{#AppExeName}"
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#AppName}";   Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#AppName}"; ValueData: """{app}\{#AppExeName}"""; Flags: uninsdeletevalue; Tasks: startup

[Run]
Filename: "{sys}\msiexec.exe"; Parameters: "/i ""{tmp}\SetupVSPE_64.msi"" /qn /norestart"; Flags: waituntilterminated runhidden; StatusMsg: "Installing Virtual Serial Port Emulator..."
Filename: "{sys}\ping.exe"; Parameters: "127.0.0.1 -n 4 -w 1000"; Flags: runhidden waituntilterminated
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File ""{app}\resources\install_vspe_ports.ps1"" -Port1 COM20 -Port2 COM21"; Flags: waituntilterminated runhidden; StatusMsg: "Creating virtual COM pair COM20 <-> COM21..."
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#AppName}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -Command ""$v = Get-ChildItem 'C:\Program Files\Eterlogic.com\VSPE\VspeMulator.exe' -ErrorAction SilentlyContinue | Select-Object -First 1; if ($v) {{ Start-Process $v.FullName -ArgumentList '-silent -destroyall' -Wait -WindowStyle Hidden }}"""; Flags: runhidden waituntilterminated skipifdoesntexist

[Code]
procedure ApplyTheme;
begin
  with WizardForm do begin
    Color := $0F0F1E;
    Font.Color := $E2ECF0;
    PageNameLabel.Font.Color := $00A0E8;
    PageNameLabel.Font.Style := [fsBold];
    PageDescriptionLabel.Font.Color := $A8A0A0;
    MainPanel.Color := $0F0F1E;
    InnerPage.Color := $1A1A2E;
    NextButton.Caption   := 'Continue  →';
    BackButton.Caption   := '←  Back';
    CancelButton.Caption := 'Cancel';
  end;
end;

procedure InitializeWizard;
begin
  ApplyTheme;
  WizardForm.WelcomeLabel1.Font.Color := $00A0E8;
  WizardForm.WelcomeLabel1.Font.Size  := 15;
  WizardForm.WelcomeLabel1.Font.Style := [fsBold];
  WizardForm.WelcomeLabel2.Font.Color := $A8A0A0;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  ApplyTheme;
  if CurPageID = wpFinished then
    WizardForm.NextButton.Caption := 'Launch App  →';
end;
