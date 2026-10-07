@echo off
setlocal
title AI 360
cd /d "%~dp0"

echo.
echo  AI 360 - Local launcher
echo  ----------------------

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js was not found. Install the current Node.js LTS release, then try again.
    echo https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo npm was not found. Reinstall Node.js with npm included, then try again.
    pause
    exit /b 1
)

if not exist "package.json" (
    echo package.json was not found. Keep this script in the AI 360 project folder.
    pause
    exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
    echo Installing project dependencies...
    call npm ci
    if errorlevel 1 (
        echo Dependency installation failed. Check your internet connection and try again.
        pause
        exit /b 1
    )
)

echo.
echo Starting AI 360. Keep this window open while you use the app.
echo Your browser should open automatically.
echo.
call npm run dev -- --open

if errorlevel 1 (
    echo.
    echo AI 360 could not start. Check the messages above.
    pause
)

endlocal
