import JSZip from 'jszip';
import { AppSettings } from '../types';

/**
 * Generates an official Windows Microsoft Management Console (.msc) file
 * formatted in standard MMC 3.0 XML specification with web snap-in configuration.
 */
export function generateMscContent(settings?: AppSettings, appUrl?: string): string {
  const currentUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const orgName = settings?.organizationName || 'High Court & District Judiciary';
  const appName = settings?.applicationName || 'Justice Schedule';
  const repHeader = settings?.reportHeader || 'Official Cause List & Proceeding Schedule';

  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  =============================================================================
  Justice Schedule - Microsoft Management Console Document (.msc)
  Court Management & Proceeding Schedule System
  Organization: ${orgName}
  Application: ${appName}
  =============================================================================
-->
<MMC_ConsoleFile ConsoleVersion="3.0" ProgramMode="UserMode">
  <FrameState ShowStatusBar="true">
    <WindowPlacement ShowCommand="SW_SHOWMAXIMIZED">
      <Point Left="40" Top="40"/>
      <Size Width="1280" Height="820"/>
    </WindowPlacement>
  </FrameState>
  <Views>
    <View ID="1" ScopeNode="1">
      <WindowPlacement ShowCommand="SW_SHOWMAXIMIZED"/>
    </View>
  </Views>
  <ScopeTree>
    <Nodes>
      <Node ID="1" Name="${appName} - ${orgName}" ImageIndex="0">
        <SnapIn CLSID="{88DF9D60-8B92-11CE-A58D-00AA00669209}" Name="Web Page">
          <Configuration>
            <URL>${currentUrl}</URL>
            <Title>${appName} Management Console</Title>
            <Organization>${orgName}</Organization>
            <ReportHeader>${repHeader}</ReportHeader>
            <OfflineMode>Enabled</OfflineMode>
          </Configuration>
        </SnapIn>
      </Node>
    </Nodes>
  </ScopeTree>
</MMC_ConsoleFile>
`;
}

/**
 * Triggers a direct download of the .msc console file in browser
 */
export function downloadMscFile(settings?: AppSettings, filename = 'JusticeSchedule.msc'): void {
  const content = generateMscContent(settings);
  triggerBrowserDownload(content, filename, 'application/x-mmc;charset=utf-8');
}

/**
 * Generates a Windows 1-Click Batch Installer (.bat) that sets up the .msc file,
 * creates desktop shortcuts, and registers with Windows Administrative Tools.
 */
export function generateBatInstallerContent(settings?: AppSettings, appUrl?: string): string {
  const currentUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const appName = settings?.applicationName || 'Justice Schedule';
  const orgName = settings?.organizationName || 'High Court & District Judiciary';

  return `@echo off
:: =========================================================================
:: ${appName} - Official Windows Installation & Desktop Setup Script
:: Organization: ${orgName}
:: Target: Microsoft Management Console (.msc) and Desktop Shortcut
:: =========================================================================
title ${appName} - Windows Setup & Console Installer
color 1F

echo =======================================================================
echo          ${appName.toUpperCase()} - COURT MANAGEMENT SYSTEM INSTALLER
echo          ${orgName.toUpperCase()}
echo =======================================================================
echo.
echo Installing ${appName} Console (.msc) and creating Desktop Shortcut...
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\\JusticeSchedule"
set "MSC_FILE=%INSTALL_DIR%\\JusticeSchedule.msc"
set "DESKTOP_SHORTCUT=%USERPROFILE%\\Desktop\\${appName}.lnk"
set "START_MENU=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\${appName}"
set "URL_FILE=%INSTALL_DIR%\\${appName}.url"

:: 1. Create Application Directory
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
)

:: 2. Deploy .msc file (copy local if available, or generate)
if exist "%~dp0JusticeSchedule.msc" (
    copy /y "%~dp0JusticeSchedule.msc" "%MSC_FILE%" >nul
    echo [1/4] Copied bundled JusticeSchedule.msc to %INSTALL_DIR%
) else (
    echo [1/4] Generating JusticeSchedule.msc into %INSTALL_DIR%...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<MMC_ConsoleFile ConsoleVersion="3.0" ProgramMode="UserMode"^>
echo   ^<FrameState ShowStatusBar="true"^>
echo     ^<WindowPlacement ShowCommand="SW_SHOWMAXIMIZED"^>
echo       ^<Point Left="40" Top="40"/^>
echo       ^<Size Width="1280" Height="820"/^>
echo     ^</WindowPlacement^>
echo   ^</FrameState^>
echo   ^<Views^>
echo     ^<View ID="1" ScopeNode="1"^>
echo       ^<WindowPlacement ShowCommand="SW_SHOWMAXIMIZED"/^>
echo     ^</View^>
echo   ^</Views^>
echo   ^<ScopeTree^>
echo     ^<Nodes^>
echo       ^<Node ID="1" Name="${appName} - ${orgName}" ImageIndex="0"^>
echo         ^<SnapIn CLSID="{88DF9D60-8B92-11CE-A58D-00AA00669209}" Name="Web Page"^>
echo           ^<Configuration^>
echo             ^<URL^>${currentUrl}^</URL^>
echo             ^<Title^>${appName} Management Console^</Title^>
echo           ^</Configuration^>
echo         ^</SnapIn^>
echo       ^</Node^>
echo     ^</Nodes^>
echo   ^</ScopeTree^>
echo ^</MMC_ConsoleFile^>
) > "%MSC_FILE%"
)

:: 3. Create Windows URL Shortcut file
(
echo [InternetShortcut]
echo URL=${currentUrl}
echo IconIndex=0
echo IconFile=shell32.dll
) > "%URL_FILE%"

:: 4. Generate Desktop Shortcut pointing to mmc.exe with the .msc document
echo [2/4] Generating Windows Desktop Shortcut...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP_SHORTCUT%'); $s.TargetPath = 'mmc.exe'; $s.Arguments = '\"%MSC_FILE%\"'; $s.Description = '${appName} Judicial Management Console'; $s.IconLocation = 'shell32.dll,261'; $s.Save()"

:: 5. Create Start Menu Program entry
echo [3/4] Registering with Windows Start Menu...
if not exist "%START_MENU%" (
    mkdir "%START_MENU%"
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%START_MENU%\\${appName} Console.lnk'); $s.TargetPath = 'mmc.exe'; $s.Arguments = '\"%MSC_FILE%\"'; $s.Description = '${appName} Management Console'; $s.IconLocation = 'shell32.dll,261'; $s.Save()"

:: 6. Register in Administrative Tools
echo [4/4] Registering in Windows Administrative Tools...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$adminTools = [Environment]::GetFolderPath('CommonAdminTools'); if (Test-Path $adminTools) { try { $ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(\"$adminTools\\${appName} Console.lnk\"); $s.TargetPath = 'mmc.exe'; $s.Arguments = '\"%MSC_FILE%\"'; $s.Description = '${appName} Management Console'; $s.Save() } catch {} }"

echo.
echo =======================================================================
echo               INSTALLATION COMPLETED SUCCESSFULLY!
echo =======================================================================
echo.
echo 1. The ${appName} Console (.msc) is now installed on your PC.
echo 2. A desktop shortcut '${appName}' has been created on your Desktop.
echo 3. Location: %MSC_FILE%
echo.
echo Launching ${appName} Microsoft Management Console now...
timeout /t 2 >nul
start "" mmc.exe "%MSC_FILE%"
`;
}

/**
 * Triggers a direct download of the Windows 1-Click Setup Batch (.bat) file
 */
export function downloadBatInstaller(settings?: AppSettings, filename = 'Install-JusticeSchedule.bat'): void {
  const content = generateBatInstallerContent(settings);
  triggerBrowserDownload(content, filename, 'application/x-bat;charset=utf-8');
}

/**
 * Quick Setup.bat launcher
 */
export function generateSetupLauncherBat(appName = 'Justice Schedule'): string {
  return `@echo off
title ${appName} Setup Launcher
cd /d "%~dp0"
if exist "Install-JusticeSchedule.bat" (
    call "Install-JusticeSchedule.bat"
) else if exist "JusticeSchedule.msc" (
    start "" mmc.exe "%~dp0JusticeSchedule.msc"
) else (
    echo Unable to find installation components in this folder.
    pause
)
`;
}

/**
 * Generates a Windows Internet Shortcut (.url)
 */
export function generateWindowsUrlShortcutContent(appUrl?: string): string {
  const currentUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  return `[InternetShortcut]\nURL=${currentUrl}\nIconIndex=0\nIconFile=shell32.dll\n`;
}

export function downloadWindowsUrlShortcut(settings?: AppSettings, filename = 'JusticeSchedule.url'): void {
  const content = generateWindowsUrlShortcutContent();
  triggerBrowserDownload(content, filename, 'application/x-ms-shortcut;charset=utf-8');
}

/**
 * Generates PowerShell Installer Script (.ps1)
 */
export function generatePowerShellInstallerContent(settings?: AppSettings, appUrl?: string): string {
  const currentUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const appName = settings?.applicationName || 'Justice Schedule';
  const mscXml = generateMscContent(settings, currentUrl);

  return `# =============================================================================
# ${appName} - PowerShell Administrative Console Installer (.msc)
# Run as Administrator or Standard User
# =============================================================================

$ErrorActionPreference = 'SilentlyContinue'
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  ${appName.toUpperCase()} - WINDOWS MANAGEMENT CONSOLE INSTALLER" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Cyan

$InstallDir = "$env:LOCALAPPDATA\\JusticeSchedule"
$MscPath = "$InstallDir\\JusticeSchedule.msc"
$DesktopShortcut = "$([Environment]::GetFolderPath('Desktop'))\\${appName}.lnk"

if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$MscContent = @'
${mscXml}
'@

$MscContent | Out-File -FilePath $MscPath -Encoding utf8 -Force
Write-Host "[+] Installed JusticeSchedule.msc to $MscPath" -ForegroundColor Green

# Create Desktop Shortcut
$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($DesktopShortcut)
$Shortcut.TargetPath = "mmc.exe"
$Shortcut.Arguments = '"' + $MscPath + '"'
$Shortcut.Description = "${appName} Judicial Management Console"
$Shortcut.IconLocation = "shell32.dll,261"
$Shortcut.Save()
Write-Host "[+] Created Desktop Shortcut at $DesktopShortcut" -ForegroundColor Green

Write-Host "Installation Completed! Launching ${appName}..." -ForegroundColor Cyan
Start-Process "mmc.exe" -ArgumentList ('"' + $MscPath + '"')
`;
}

export function downloadPowerShellInstaller(settings?: AppSettings, filename = 'Install-JusticeSchedule.ps1'): void {
  const content = generatePowerShellInstallerContent(settings);
  triggerBrowserDownload(content, filename, 'text/plain;charset=utf-8');
}

/**
 * Windows Startup Autostart script (.bat)
 */
export function generateStartupBat(settings?: AppSettings): string {
  const appName = settings?.applicationName || 'Justice Schedule';
  return `@echo off
title Configure ${appName} Windows Startup
set "MSC_FILE=%LOCALAPPDATA%\\JusticeSchedule\\JusticeSchedule.msc"
set "STARTUP_FOLDER=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"

if not exist "%MSC_FILE%" (
    echo JusticeSchedule.msc is not installed yet. Please run Install-JusticeSchedule.bat first.
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_FOLDER%\\${appName} AutoLaunch.lnk'); $s.TargetPath = 'mmc.exe'; $s.Arguments = '\"%MSC_FILE%\"'; $s.Description = 'Auto-start ${appName} on Windows Login'; $s.Save()"
echo Successfully enabled ${appName} on Windows startup!
pause
`;
}

/**
 * Windows Uninstaller script (.bat)
 */
export function generateUninstallBat(settings?: AppSettings): string {
  const appName = settings?.applicationName || 'Justice Schedule';
  return `@echo off
title Uninstall ${appName}
echo =======================================================================
echo          UNINSTALL ${appName.toUpperCase()}
echo =======================================================================
echo.
set /p CONFIRM="Are you sure you want to remove ${appName} shortcuts and console? (Y/N): "
if /i not "%CONFIRM%"=="Y" exit /b 0

del /f /q "%USERPROFILE%\\Desktop\\${appName}.lnk" 2>nul
del /f /q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\${appName} AutoLaunch.lnk" 2>nul
rmdir /s /q "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\${appName}" 2>nul
rmdir /s /q "%LOCALAPPDATA%\\JusticeSchedule" 2>nul

echo.
echo ${appName} has been successfully uninstalled from your Windows system.
pause
`;
}

/**
 * Generates an Offline Single-File HTML Runner
 */
export function generateOfflineHtml(settings?: AppSettings, appUrl?: string): string {
  const currentUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const appName = settings?.applicationName || 'Justice Schedule';
  const orgName = settings?.organizationName || 'High Court & District Judiciary';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${appName} - Offline Desktop Launcher</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; display: flex; align-items: center; justify-content: center; min-height: 80vh; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px; max-width: 540px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    h1 { margin-top: 0; color: #fbbf24; font-size: 24px; font-family: Georgia, serif; }
    p { color: #cbd5e1; font-size: 14px; line-height: 1.6; }
    .btn { display: inline-block; background: #f59e0b; color: #0f172a; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; margin-top: 16px; }
    .btn:hover { background: #fbbf24; }
    .info { background: #0f172a; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 12px; font-family: monospace; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${appName}</h1>
    <p><strong>${orgName}</strong></p>
    <p>This is the offline desktop launcher for your Justice Schedule system.</p>
    <div class="info">Target Server: ${currentUrl}</div>
    <a href="${currentUrl}" class="btn" target="_blank">Launch Justice Schedule &rarr;</a>
  </div>
</body>
</html>`;
}

/**
 * SQL Schema definition
 */
export function generateSqlSchema(): string {
  return `-- =============================================================================
-- Justice Schedule - Official SQLite Database Schema Definition
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  userId INTEGER PRIMARY KEY AUTOINCREMENT,
  fullName TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'User',
  securityQuestion TEXT NOT NULL,
  securityAnswerHash TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdDate TEXT NOT NULL,
  lastLogin TEXT
);

CREATE TABLE IF NOT EXISTS schedules (
  scheduleId INTEGER PRIMARY KEY AUTOINCREMENT,
  serialNo INTEGER UNIQUE NOT NULL,
  scheduleDate TEXT NOT NULL,
  scheduleTime TEXT NOT NULL,
  venue TEXT NOT NULL,
  description TEXT NOT NULL,
  remarks TEXT,
  createdBy TEXT NOT NULL,
  createdDate TEXT NOT NULL,
  updatedBy TEXT,
  updatedDate TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduleDate);
CREATE INDEX IF NOT EXISTS idx_schedules_venue ON schedules(venue);
CREATE INDEX IF NOT EXISTS idx_schedules_serial ON schedules(serialNo);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
`;
}

/**
 * JSON Package Manifest
 */
export function generatePackageManifest(settings?: AppSettings, appUrl?: string): string {
  const currentUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const appName = settings?.applicationName || 'Justice Schedule';
  const orgName = settings?.organizationName || 'High Court & District Judiciary';

  return JSON.stringify(
    {
      packageName: 'JusticeSchedule-Complete-Installer-Package',
      applicationName: appName,
      organizationName: orgName,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      platform: 'Microsoft Windows (11, 10, 8, 7, Server)',
      serverUrl: currentUrl,
      files: [
        { name: 'Setup.bat', type: 'Batch Setup Launcher', description: 'Double-click to start installation' },
        { name: 'Install-JusticeSchedule.bat', type: 'Windows 1-Click Installer', description: 'Deploys .msc and creates Desktop & Start Menu shortcuts' },
        { name: 'JusticeSchedule.msc', type: 'Microsoft Management Console', description: 'XML-based MMC 3.0 document opened by mmc.exe' },
        { name: 'Install-JusticeSchedule.ps1', type: 'PowerShell Installer', description: 'Automated administrative deployment script' },
        { name: 'Justice Schedule.url', type: 'Windows Shortcut', description: 'Desktop Internet Shortcut to system' },
        { name: 'Offline-Launcher.html', type: 'Standalone HTML', description: 'Browser launcher page' },
        { name: 'Register-Windows-Startup.bat', type: 'Utility Script', description: 'Enables auto-start on Windows login' },
        { name: 'Uninstall-JusticeSchedule.bat', type: 'Utility Script', description: 'Clean removal of console and shortcuts' },
        { name: 'database_schema.sql', type: 'Database Schema', description: 'Complete SQLite SQL schema' },
        { name: 'README-INSTALLATION-INSTRUCTIONS.txt', type: 'Documentation', description: 'Step-by-step setup guide' }
      ]
    },
    null,
    2
  );
}

/**
 * Readme installation guide text
 */
export function generateReadmeInstructions(settings?: AppSettings, appUrl?: string): string {
  const currentUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const appName = settings?.applicationName || 'Justice Schedule';
  const orgName = settings?.organizationName || 'High Court & District Judiciary';

  return `===============================================================================
       ${appName.toUpperCase()} - COMPLETE WINDOWS INSTALLATION & SETUP GUIDE
       ${orgName.toUpperCase()}
===============================================================================

Thank you for downloading the complete Justice Schedule Windows Package.
This package contains all tools required to install and run Justice Schedule
on Windows 11, Windows 10, Windows 8, Windows 7, and Windows Server workstations.

CONTENTS OF THIS PACKAGE:
-------------------------------------------------------------------------------
1. Setup.bat                     - Quick 1-click launcher to run the installation.
2. Install-JusticeSchedule.bat   - Main automated Windows installer.
3. JusticeSchedule.msc           - Microsoft Management Console document (.msc).
4. Install-JusticeSchedule.ps1   - PowerShell installer for IT administrators.
5. Justice Schedule.url          - Windows Desktop Internet Shortcut.
6. Offline-Launcher.html         - Standalone web browser launcher.
7. Register-Windows-Startup.bat  - Adds console auto-start on Windows boot.
8. Uninstall-JusticeSchedule.bat - Uninstaller script.
9. database_schema.sql           - Raw SQLite schema definition.
10. package_manifest.json        - Package metadata and component list.

QUICK INSTALLATION (METHOD 1 - RECOMMENDED):
-------------------------------------------------------------------------------
1. Extract all files from this ZIP into a folder.
2. Double-click "Setup.bat" or "Install-JusticeSchedule.bat".
3. The installer will automatically:
   - Deploy "JusticeSchedule.msc" to %LOCALAPPDATA%\\JusticeSchedule
   - Create a desktop shortcut "Justice Schedule" on your Windows Desktop
   - Add a shortcut in your Windows Start Menu
   - Register the console under Windows Administrative Tools
4. The Justice Schedule Management Console will launch automatically!

MANUAL LAUNCH (METHOD 2 - DIRECT .MSC):
-------------------------------------------------------------------------------
1. Double-click "JusticeSchedule.msc".
2. Windows will automatically open it with "Microsoft Management Console" (mmc.exe).
3. If Windows SmartScreen shows a warning, click "More info" -> "Run anyway".

ACTIVE SERVER TARGET:
-------------------------------------------------------------------------------
Host URL: ${currentUrl}

SUPPORT & MAINTENANCE:
-------------------------------------------------------------------------------
- To uninstall: Double-click "Uninstall-JusticeSchedule.bat".
- To launch on Windows startup: Double-click "Register-Windows-Startup.bat".
===============================================================================
`;
}

/**
 * Builds the entire ZIP package containing all installation files
 * and downloads it straight into the user's Downloads folder!
 */
export async function generateAndDownloadZipBundle(
  settings?: AppSettings,
  filename = 'JusticeSchedule-Complete-Installer.zip',
  appUrl?: string
): Promise<void> {
  const zip = new JSZip();
  const currentUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const appName = settings?.applicationName || 'Justice Schedule';

  // 1. Setup.bat
  zip.file('Setup.bat', generateSetupLauncherBat(appName));

  // 2. Install-JusticeSchedule.bat
  zip.file('Install-JusticeSchedule.bat', generateBatInstallerContent(settings, currentUrl));

  // 3. JusticeSchedule.msc
  zip.file('JusticeSchedule.msc', generateMscContent(settings, currentUrl));

  // 4. Install-JusticeSchedule.ps1
  zip.file('Install-JusticeSchedule.ps1', generatePowerShellInstallerContent(settings, currentUrl));

  // 5. Justice Schedule.url
  zip.file('Justice Schedule.url', generateWindowsUrlShortcutContent(currentUrl));

  // 6. Offline-Launcher.html
  zip.file('Offline-Launcher.html', generateOfflineHtml(settings, currentUrl));

  // 7. Register-Windows-Startup.bat
  zip.file('Register-Windows-Startup.bat', generateStartupBat(settings));

  // 8. Uninstall-JusticeSchedule.bat
  zip.file('Uninstall-JusticeSchedule.bat', generateUninstallBat(settings));

  // 9. database_schema.sql
  zip.file('database_schema.sql', generateSqlSchema());

  // 10. package_manifest.json
  zip.file('package_manifest.json', generatePackageManifest(settings, currentUrl));

  // 11. README-INSTALLATION-INSTRUCTIONS.txt
  zip.file('README-INSTALLATION-INSTRUCTIONS.txt', generateReadmeInstructions(settings, currentUrl));

  // Generate ZIP blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads all individual package files sequentially into the user's Downloads folder
 */
export async function downloadAllIndividualPackages(settings?: AppSettings): Promise<void> {
  const appName = settings?.applicationName || 'Justice Schedule';
  const cleanName = appName.replace(/\s+/g, '');

  // 1. Download complete ZIP bundle
  await generateAndDownloadZipBundle(settings, `${cleanName}-Complete-Installer.zip`);

  // 2. Download .msc file
  setTimeout(() => {
    downloadMscFile(settings, `${cleanName}.msc`);
  }, 400);

  // 3. Download Install .bat file
  setTimeout(() => {
    downloadBatInstaller(settings, `Install-${cleanName}.bat`);
  }, 800);

  // 4. Download Desktop URL shortcut
  setTimeout(() => {
    downloadWindowsUrlShortcut(settings, `${appName}.url`);
  }, 1200);

  // 5. Download Instructions
  setTimeout(() => {
    const readme = generateReadmeInstructions(settings);
    triggerBrowserDownload(readme, `README-INSTALLATION.txt`, 'text/plain;charset=utf-8');
  }, 1600);
}

/**
 * Standard trigger browser download helper
 */
function triggerBrowserDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
