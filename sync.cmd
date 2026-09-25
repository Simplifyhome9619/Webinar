@echo off
REM Double-click this file to sync shared code from Webinar to Connect and push both.
REM Invokes sync.ps1 with -ExecutionPolicy Bypass so no Windows policy change is needed.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync.ps1"

echo.
pause
