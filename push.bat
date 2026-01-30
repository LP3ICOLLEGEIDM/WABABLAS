@echo off
title WABABLAS AUTO PUSH
echo ==========================================
echo    WABABLAS GITHUB PUSH SYSTEM
echo    (Zero Error & Large File Guard)
echo ==========================================
echo.

:: 1. Add All (Git akan mematuhi .gitignore yang baru)
echo [1/3] Menambahkan file ke antrian...
git add .

:: 2. Commit
echo.
set /p msg="[2/3] Masukkan Pesan Commit (Enter untuk default): "
if "%msg%"=="" set msg="Update WABABLAS: %date% %time%"
git commit -m "%msg%"

:: 3. Push
echo.
echo [3/3] Mengirim ke GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gagal push ke GitHub.
    echo Kemungkinan penyebab: Koneksi internet atau konflik remote.
    echo Coba jalankan: git pull origin main --rebase
) else (
    echo.
    echo [SUKSES] Kode berhasil terkirim!
)

echo.
pause
