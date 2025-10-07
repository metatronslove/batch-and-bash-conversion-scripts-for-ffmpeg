#!/bin/bash

echo "MP4'ten MP3 Dönüştürücü"
echo "======================"

# FFmpeg kontrolü
if ! command -v ffmpeg &> /dev/null; then
    echo "HATA: FFmpeg bulunamadı!"
    echo "Lütfen FFmpeg'i sisteminize kurun."
    exit 1
fi

# Fonksiyonlar
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
    
    if ffmpeg -i "$input_file" -q:a 0 -map a "$output_path" -y -hide_banner -loglevel error; then
        echo "✓ Başarılı: $output_path"
    else
        echo "✗ Hata: $input_file dönüştürülemedi"
    fi
    echo
}

convert_files() {
    local mp4_files=(*.mp4)
    if [ ${#mp4_files[@]} -eq 0 ]; then
        echo "Bu klasörde MP4 dosyası bulunamadı."
        return 1
    fi
    
    echo "${#mp4_files[@]} MP4 dosyası bulundu."
    echo "Dönüştürme başlatılıyor..."
    echo
    
    for file in "${mp4_files[@]}"; do
        convert_single_file "$file" ""
    done
    
    echo "Dönüştürme tamamlandı!"
}

# Ana işlem
if [ $# -gt 0 ]; then
    if [ -e "$1" ]; then
        if [ -d "$1" ]; then
            # Klasör sürükle-bırak
            echo "Klasör işleniyor: $1"
            cd "$1"
            convert_files
        else
            # Tekil dosya sürükle-bırak
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
    # Doğrudan çalıştırma
    convert_files
    read -p "Devam etmek için bir tuşa basın..."
fi
