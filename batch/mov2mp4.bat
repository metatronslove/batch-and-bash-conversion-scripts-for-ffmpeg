@echo off
setlocal enabledelayedexpansion

echo MOV to MP4 Converter
echo ===================

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
:: FFmpeg kontrolü
where ffmpeg >nul 2>&1
if errorlevel 1 (
    echo HATA: FFmpeg bulunamadi!
    pause
    exit /b 1
)

set "output_folder=converted"
if not exist "%output_folder%" mkdir "%output_folder%"

set /a count=0
set "fileCount=0"
for %%i in (*.mov) do set /a "fileCount+=1"

if %fileCount% equ 0 (
    echo Bu klasorde MOV dosyasi bulunamadi.
    pause
    exit /b 1
)

echo %fileCount% MOV dosyasi bulundu.
echo Donusturme baslatiliyor...
echo.

for %%f in (*.mov) do (
    set "filename=%%~nf"
    set "output_file=%output_folder%\!filename!.mp4"
    
    echo Converting: %%f
    echo To: !output_file!
    
    ffmpeg -i "%%f" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k "!output_file!"
    
    if !errorlevel! equ 0 (
        echo ✓ Successfully converted: !filename!.mp4
        set /a count+=1
    ) else (
        echo ✗ Failed to convert: %%f
    )
    echo.
)

echo.
echo Conversion complete!
echo Files converted: %count%
pause
exit /b 0

:ConvertSingleFile
set "inputFile=%~1"
set "outputFolder=%~2"
set "outputFile=%~n1.mp4"

if not "!outputFolder!"=="" (
    set "outputPath=!outputFolder!\!outputFile!"
) else (
    set "outputPath=!outputFile!"
)

echo Converting: !inputFile!
echo To: !outputPath!

ffmpeg -i "!inputFile!" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k "!outputPath!" -y

if !errorlevel! equ 0 (
    echo ✓ Successfully converted: !outputPath!
) else (
    echo ✗ Failed to convert: !inputFile!
)
echo.
exit /b 0
