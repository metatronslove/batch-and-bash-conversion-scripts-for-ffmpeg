@echo off
setlocal enabledelayedexpansion
:: MP4 Horizontal Mirror / Drag&Drop / Folder Support / Optional Args

echo MP4 Horizontal Mirror (Flip)
echo ============================

:: FFmpeg kontrolü
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo HATA: FFmpeg bulunamadi!
    echo Lutfen FFmpeg'i sistem PATH'ine ekleyin veya bu klasore kopyalayin.
    pause
    exit /b 1
)

:: Argüman kontrolü
set "INPUT_FILE=%~1"
set "OUTPUT_FOLDER=%~2"

if not "!INPUT_FILE!"=="" (
    if exist "!INPUT_FILE!" (
        if "!INPUT_FILE:~-1!"=="\" (
            :: Klasör sürükle-bırak
            echo Klasor isleniyor: !INPUT_FILE!
            pushd "!INPUT_FILE!"
            call :ConvertFiles
            popd
        ) else (
            :: Tekil dosya sürükle-bırak
            echo Tekil dosya isleniyor: !INPUT_FILE!
            pushd "%~dp1"
            if not "!OUTPUT_FOLDER!"=="" (
                if not exist "!OUTPUT_FOLDER!" mkdir "!OUTPUT_FOLDER!"
            )
            call :ConvertSingleFile "%~nx1" "!OUTPUT_FOLDER!"
            popd
        )
    ) else (
        echo HATA: Dosya veya klasor bulunamadi: !INPUT_FILE!
        pause
        exit /b 1
    )
) else (
    :: Doğrudan çalıştırma
    call :ConvertFiles
)

exit /b 0

:ConvertFiles
set "fileCount=0"
for %%i in (*.mp4) do set /a "fileCount+=1"

if %fileCount% equ 0 (
    echo Bu klasorde MP4 dosyasi bulunamadi.
    pause
    exit /b 1
)

echo %fileCount% MP4 dosyasi bulundu.
echo Yatay mirror islemi baslatiliyor...
echo.

for %%i in (*.mp4) do (
    call :ConvertSingleFile "%%i" ""
)
echo Islem tamamlandi!
pause
exit /b 0

:ConvertSingleFile
set "inputFile=%~1"
set "outputFolder=%~2"
set "outputFile=%~n1_flipped.mp4"

if not "!outputFolder!"=="" (
    set "outputPath=!outputFolder!\!outputFile!"
) else (
    set "outputPath=!outputFile!"
)

echo Isleniyor: !inputFile! -> !outputPath!
ffmpeg -i "!inputFile!" -vf "hflip" -c:a copy "!outputPath!" -y -hide_banner -loglevel error

if !errorlevel! equ 0 (
    echo ✓ Basarili: !outputPath!
) else (
    echo ✗ Hata: !inputFile! islenemedi
)
echo.
exit /b 0
