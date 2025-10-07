#!/bin/bash

echo "MP3 to MP4 Converter with Album Art"
echo "==================================="

# FFmpeg kontrolü
if ! command -v ffmpeg &> /dev/null; then
    echo "ERROR: FFmpeg bulunamadı!"
    exit 1
fi

# Fonksiyonlar
convert_single_file() {
    local input_file="$1"
    local cover_image="$2"
    local output_folder="$3"
    local filename=$(basename -- "$input_file")
    local name="${filename%.*}"
    
    if [ -n "$output_folder" ]; then
        mkdir -p "$output_folder"
        local output_path="$output_folder/$name.mp4"
    else
        local output_path="$name.mp4"
    fi
    
    echo "İşleniyor: $input_file"
    
    # Kapak resmi kontrolü
    local temp_cover=""
    if [ -z "$cover_image" ]; then
        if ffmpeg -i "$input_file" -an -vcodec copy "cover_temp.jpg" -y &> /dev/null; then
            cover_image="cover_temp.jpg"
            temp_cover="cover_temp.jpg"
        fi
    fi
    
    if [ -n "$cover_image" ] && [ -e "$cover_image" ]; then
        echo "Kapak resmi bulundu, MP4 oluşturuluyor..."
        ffmpeg -loop 1 -i "$cover_image" -i "$input_file" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "$output_path" -y
    else
        echo "Kapak resmi bulunamadı, varsayılan yöntem kullanılıyor..."
        ffmpeg -i "$input_file" -c:a aac -b:a 192k -f lavfi -i color=black:size=1280x720 -shortest -c:v libx264 "$output_path" -y
    fi
    
    # Geçici dosyayı temizle
    [ -n "$temp_cover" ] && rm -f "$temp_cover"
    
    if [ $? -eq 0 ]; then
        echo "Tamamlandı: $output_path"
    else
        echo "Hata: $input_file dönüştürülemedi"
    fi
    echo
}

convert_files() {
    local mp3_files=(*.mp3)
    if [ ${#mp3_files[@]} -eq 0 ]; then
        echo "Bu klasörde MP3 dosyası bulunamadı."
        return 1
    fi
    
    echo "${#mp3_files[@]} MP3 dosyası bulundu."
    echo "Dönüştürme başlatılıyor..."
    echo
    
    for file in "${mp3_files[@]}"; do
        convert_single_file "$file" "" ""
    done
    
    echo "Tüm dosyalar dönüştürüldü!"
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
            convert_single_file "$filename" "$2" "$3"
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
