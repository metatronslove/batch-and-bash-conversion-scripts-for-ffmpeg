#!/bin/bash

echo "MP4'ten MP3 Dönüştürücü - Arch Linux"

if ! command -v ffmpeg &> /dev/null; then
    echo "HATA: FFmpeg bulunamadı! sudo pacman -S ffmpeg"
    exit 1
fi

convert_single_file() {
    local input_file="$1"
    local output_folder="$2"
    local filename=$(basename -- "$input_file")
    local name="${filename%.*}"

    if [ -n "$output_folder" ]; then
        mkdir -p "$output_folder"
        local output_path="$output_folder/$name.mp3"
    else
        local output_path="$name.mp3"
    fi

    echo "Dönüştürülüyor: $input_file -> $output_path"

    if ffmpeg -i "$input_file" -q:a 0 -map a "$output_path" -y; then
        echo "✓ Başarılı: $output_path"
    else
        echo "✗ Hata: $input_file dönüştürülemedi"
    fi
}

# Ana işlem
if [ $# -gt 0 ]; then
    if [ -e "$1" ]; then
        if [ -d "$1" ]; then
            echo "Klasör işleniyor: $1"
            cd "$1"
            shopt -s nullglob
            mp4_files=(*.mp4)
            for file in "${mp4_files[@]}"; do
                convert_single_file "$file" ""
            done
        else
            echo "Tekil dosya işleniyor: $1"
            local_dir=$(dirname "$1")
            filename=$(basename "$1")
            cd "$local_dir"
            convert_single_file "$filename" "$2"
        fi
    else
        echo "HATA: Dosya veya klasör bulunamadı: $1"
        exit 1
    fi
else
    shopt -s nullglob
    mp4_files=(*.mp4)
    for file in "${mp4_files[@]}"; do
        convert_single_file "$file" ""
    done
fi
