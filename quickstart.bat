@echo off
REM Hardware Shop Management System - Quick Start for Windows

color 0a
cls

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   Hardware Shop Management System - Quick Start        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo OK: Node.js is installed

REM Install dependencies
echo.
echo [2/4] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    echo.
    pause
    exit /b 1
)
echo OK: Dependencies installed

REM Check .env file
echo.
echo [3/4] Checking configuration...
if not exist ".env" (
    echo ERROR: .env file not found
    echo.
    pause
    exit /b 1
)
echo OK: .env file found

REM Start server
echo.
echo [4/4] Starting server...
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   Server is starting on http://localhost:3000          ║
echo ║   Press Ctrl+C to stop the server                      ║
echo ║   Open http://localhost:3000 in your web browser       ║
echo ╚════════════════════════════════════════════════════════╝
echo.

call npm start

pause
