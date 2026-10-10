@echo off
title Justice Schedule - Offline Court Management System
echo ========================================================
echo              JUSTICE SCHEDULE LAUNCHER
echo    Offline Court and Justice Schedule Management System
echo ========================================================
echo.

:: Check Node.js installation
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (v18 or higher) to run Justice Schedule offline.
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] First-time setup detected. Installing offline dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed!
        pause
        exit /b 1
    )
)

:: Check if dist build exists; if not, build it
if not exist "dist\" (
    echo [INFO] Building Justice Schedule client bundle...
    call npm run build
)

echo [INFO] Starting local offline server at http://localhost:3000...
echo Initial Administrator Account:
echo   Username: admin
echo   Password: admin123
echo.
echo Press Ctrl+C in this console window to shut down the server.
echo.

start http://localhost:3000

npm start
pause
