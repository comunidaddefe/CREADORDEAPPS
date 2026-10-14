; =====================================================================
; Inno Setup Script: CreadorDeApps (AppCraft Engine)
; Doctrina: ZERO TRUST | ZERO PATCHES | EVIDENCE FIRST
; =====================================================================

#define MyAppName "CreadorDeApps"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "SoluSol"
#define MyAppURL "https://solusol.net"
#define MyAppExeName "electron.exe"

[Setup]
AppId={{D37B4C92-0C87-4E5C-9A52-8CF2A346E201}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=dist-installer
OutputBaseFilename=CreadorDeApps-Setup-{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
CloseApplications=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Runtime de Electron
Source: "node_modules\electron\dist\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; Recursos de la aplicación
Source: "electron.cjs"; DestDir: "{app}\resources\app"; Flags: ignoreversion
Source: "package.json"; DestDir: "{app}\resources\app"; Flags: ignoreversion
Source: "dist\*"; DestDir: "{app}\resources\app\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Parameters: """{app}\resources\app"""
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Parameters: """{app}\resources\app"""; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Parameters: """{app}\resources\app"""; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent