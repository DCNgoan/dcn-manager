@echo off
title DCN CMS - Trinh quan ly MMO
echo ==========================================
echo    DCN CMS - HE THONG QUAN LY CONG VIEC
echo ==========================================
echo.
echo [*] Dang kiem tra moi truong...
cd /d "%~dp0"
echo [*] Dang khoi dong Server (npm run dev)...
echo [!] Sau khi hien "ready", hay truy cap: http://localhost:3000
echo.
npm run dev
pause
