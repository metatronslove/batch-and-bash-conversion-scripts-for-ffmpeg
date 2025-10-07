@echo off
setlocal enabledelayedexpansion

:: Argüman kontrolü
set "INPUT_FILE=%~1"
set "COVER_IMAGE=%~2"
set "OUTPUT_FOLDER=%~3"

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
            
            :: Kapak resmi kontrolü
            set "COVER_IMAGE=!COVER_IMAGE!"
            if "!COVER_IMAGE!"=="" (
                set "COVER_IMAGE=ata.jpg"
            )
            
            call :ConvertSingleFile "%~nx1" "!COVER_IMAGE!" "!OUTPUT_FOLDER!"
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
chcp 65001 >nul
echo MP3 to MP4 Converter
echo.

:: FFmpeg kontrolü
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: FFmpeg not found!
    pause
    exit /b 1
)

:: Kapak resmi kontrolü
if not exist "ata.jpg" (
    echo ERROR: ata.jpg not found!
    echo Available image files:
    dir *.jpg *.jpeg 2>nul
    pause
    exit /b 1
)

echo Using ata.jpg as cover image
echo.

for %%A in (*.mp3) do (
    call :ConvertSingleFile "%%A" "ata.jpg" ""
)

echo All done!
pause
exit /b 0

:ConvertSingleFile
set "inputFile=%~1"
set "coverImage=%~2"
set "outputFolder=%~3"
set "outputFile=%~n1.mp4"

if not "!outputFolder!"=="" (
    set "outputPath=!outputFolder!\!outputFile!"
) else (
    set "outputPath=!outputFile!"
)

echo Processing: !inputFile!

ffmpeg -loop 1 -i "!coverImage!" -i "!inputFile!" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -r 1 -vf "scale=1280:720" "!outputPath!" -y

if !errorlevel! equ 0 (
    echo Completed: !outputPath!
) else (
    echo ERROR converting !inputFile!
)
echo.
exit /b 0
