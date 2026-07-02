;===============================================================================
; AroniumPOS Display Client v1.1.5 — Inno Setup 6
;===============================================================================
#define AppName      "AroniumPOS Display Client"
#define AppVersion   "1.1.5"
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
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#AppExeName}
CloseApplications=yes
WizardImageFile=wizard_image.bmp
WizardSmallImageFile=wizard_small.bmp

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french";  MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "startup";     Description: "Launch automatically on Windows startup"; GroupDescription: "Options:"

[Files]
Source: "..\dist\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}";           Filename: "{app}\{#AppExeName}"
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#AppName}";   Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#AppName}"; ValueData: """{app}\{#AppExeName}"""; Flags: uninsdeletevalue; Tasks: startup

[Run]
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#AppName}}"; Flags: nowait postinstall skipifsilent

[Code]
procedure ApplyTheme;
begin
  with WizardForm do begin
    Color := $0F0F1E;
    Font.Color := $E2ECF0;
    PageNameLabel.Font.Color  := $00A0E8;
    PageNameLabel.Font.Style  := [fsBold];
    PageDescriptionLabel.Font.Color := $A8A8C0;
    MainPanel.Color  := $0F0F1E;
    InnerPage.Color  := $1A1A2E;
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
  WizardForm.WelcomeLabel2.Font.Color := $A8A8C0;
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  ApplyTheme;
  if CurPageID = wpFinished then
    WizardForm.NextButton.Caption := 'Launch App  →';
end;
