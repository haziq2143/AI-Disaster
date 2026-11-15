@echo off
title Evacu8 - Sistem Tanggap Darurat Bencana
echo ========================================================
echo         EVACU8 - SISTEM TANGGAP DARURAT BENCANA
echo ========================================================
echo.

:: 1. Cek instalasi Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang di komputer ini!
    echo Silakan unduh dan pasang Node.js di: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Cek dan unduh otomatis semua library dependensi
if not exist "node_modules\" (
    echo [1/2] Folder node_modules belum ada. Mengunduh semua library...
    call npm install
) else (
    echo [1/2] Memastikan seluruh dependensi library terpasang dan mutakhir...
    call npm install
)

if %errorlevel% neq 0 (
    echo [ERROR] Gagal mengunduh dependensi npm.
    pause
    exit /b 1
)

:: 3. Jalankan aplikasi
echo.
echo [2/2] Menjalankan server aplikasi di http://127.0.0.1:3000 ...
echo Tekan Ctrl + C untuk menghentikan server.
echo ========================================================
echo.

call npm run dev
pause
