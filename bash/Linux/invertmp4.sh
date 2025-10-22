#!/bin/bash

reverse_filename() {
    local filename="$1"
    echo "$filename" | rev
}

convert_single_file() {
    local input_file="$1"
    local output_folder="$2"
    local filename=$(basename -- "$input_file")
    local name="${filename%.*}"
    local extension="${filename##*.}"

    local reversed_name=$(reverse_filename "$name")

    if [ -n "$output_folder" ]; then
        mkdir -p "$output_folder"
        local output_path="$output_folder/$reversed_name.$extension"
    else
        local output_path="$reversed_name.$extension"
    fi

    echo "Girdi:  $input_file"
    echo "Çıktı: $output_path"

    if ffmpeg -i "$input_file" -vf "reverse" -af "areverse" -y "$output_path"; then
        echo "✓ Başarılı: $output_path"
    else
        echo "✗ Hata: İşlem başarısız!"
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
