#!/bin/bash

echo "MOV to MP4 Converter - Arch Linux"

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
        local output_path="$output_folder/$name.mp4"
    else
        local output_path="$name.mp4"
    fi

    echo "Dönüştürülüyor: $input_file"

    if ffmpeg -i "$input_file" -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k "$output_path" -y; then
        echo "✓ Başarılı: $name.mp4"
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
            mov_files=(*.mov)
            for file in "${mov_files[@]}"; do
                convert_single_file "$file" "converted"
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
    mov_files=(*.mov)
    for file in "${mov_files[@]}"; do
        convert_single_file "$file" "converted"
    done
fi
