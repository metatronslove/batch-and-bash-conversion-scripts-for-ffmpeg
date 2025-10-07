@echo off
setlocal enabledelayedexpansion

echo MP3 to MP4 Converter with Album Art
echo.

:: FFmpeg kontrolü
where ffmpeg >nul 2>&1
if errorlevel 1 (
    echo ERROR: FFmpeg bulunamadi!
    pause
    exit /b 1
)

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
set "fileCount=0"
for %%i in (*.mp3) do set /a "fileCount+=1"

if %fileCount% equ 0 (
    echo Bu klasorde MP3 dosyasi bulunamadi.
    pause
    exit /b 1
)

echo %fileCount% MP3 dosyasi bulundu.
echo Donusturme baslatiliyor...
echo.

for %%i in (*.mp3) do (
    call :ConvertSingleFile "%%i" "" ""
)
echo Tum dosyalar donusturuldu!
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

echo Isleniyor: !inputFile!

:: Kapak resmi kontrolü
if "!coverImage!"=="" (
    ffmpeg -i "!inputFile!" -an -vcodec copy "cover_temp.jpg" -y >nul 2>&1
    set "coverImage=cover_temp.jpg"
)

if exist "!coverImage!" (
    echo Kapak resmi bulundu, MP4 olusturuluyor...
    ffmpeg -loop 1 -i "!coverImage!" -i "!inputFile!" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "!outputPath!" -y
) else (
    echo Kapak resmi bulunamadi, varsayilan yontem kullaniliyor...
    ffmpeg -i "!inputFile!" -c:a aac -b:a 192k -f lavfi -i color=black:size=1280x720 -shortest -c:v libx264 "!outputPath!" -y
)

if exist "cover_temp.jpg" del "cover_temp.jpg"

if !errorlevel! equ 0 (
    echo Tamamlandi: !outputPath!
) else (
    echo Hata: !inputFile! donusturulemedi
)
echo.
exit /b 0
