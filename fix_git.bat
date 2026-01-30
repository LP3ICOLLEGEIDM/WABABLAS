@echo off
title WABABLAS GIT REPAIR
echo ==========================================
echo    MEMPERBAIKI ERROR FILE BESAR
echo ==========================================
echo.

:: 1. Mundur langkah (Undo commit terakhir yang menyimpan file besar)
echo [1/5] Membatalkan commit bermasalah...
git reset --soft HEAD~3 >nul 2>&1

:: 2. Bersihkan Cache (Memaksa git melupakan file yang sudah di-add)
echo [2/5] Membersihkan antrian memori...
git rm -r --cached . >nul 2>&1

:: 3. Add Ulang (Sekarang Git akan patuh pada .gitignore)
echo [3/5] Menambahkan ulang file (Melewati node_modules)...
git add .

:: 4. Commit Baru
echo [4/5] Membuat paket baru yang bersih...
git commit -m "Re-init: Clean Setup without large files"

:: 5. Force Push (Paksa masuk ke GitHub)
echo [5/5] Mengirim ke GitHub...
git push -f origin main

echo.
echo ==========================================
if %errorlevel% neq 0 (
    echo [GAGAL] Masih ada kendala.
) else (
    echo [SUKSES] BERHASIL! File besar sudah dibuang dari antrian.
)
echo ==========================================
pause
