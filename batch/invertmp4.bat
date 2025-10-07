@echo off
setlocal enabledelayedexpansion

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
    :: Doğrudan çalıştırma - yardım göster
    echo Kullanım: %~nx0 "video_dosyasi.mp4" [cikti_klasoru]
    echo.
    echo Ornekler:
    echo   %~nx0 "benim video.mp4"
    echo   %~nx0 "C:\Videolar" "C:\Ciktilar"
    echo   Dosyayi veya klasoru surukleyip birakabilirsiniz.
    echo.
    pause
    exit /b 1
)

exit /b 0

:ConvertFiles
:: FFmpeg kontrolü
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo Hata: FFmpeg bulunamadi!
    echo Lutfen FFmpeg'i sistem PATH'ine ekleyin.
    pause
    exit /b 1
)

set "fileCount=0"
for %%i in (*.mp4) do set /a "fileCount+=1"

if %fileCount% equ 0 (
    echo Bu klasorde MP4 dosyasi bulunamadi.
    pause
    exit /b 1
)

echo %fileCount% MP4 dosyasi bulundu.
echo Ters cevirme baslatiliyor...
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
set "file_name=%~n1"

:: Dosya adını ters çevir
set "output_name="
for /l %%i in (0,1,1000) do (
    set "char=!file_name:~%%i,1!"
    if "!char!"=="" goto :reverse_done
    set "output_name=!char!!output_name!"
)
:reverse_done

set "outputFile=!output_name!.mp4"

if not "!outputFolder!"=="" (
    set "outputPath=!outputFolder!\!outputFile!"
) else (
    set "outputPath=!outputFile!"
)

echo Girdi:  !inputFile!
echo Cikti: !outputPath!
echo.

echo Video ve ses ters ceviriliyor...
ffmpeg -i "!inputFile!" -vf "reverse" -af "areverse" -y "!outputPath!"

if !errorlevel! equ 0 (
    echo ✓ Islem basariyla tamamlandi: !outputPath!
) else (
    echo ✗ Hata: Islem basarisiz oldu!
)
echo.
exit /b 0
