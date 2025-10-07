#!/bin/bash

# Fonksiyonlar
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
    
    # Dosya adını ters çevir
    local reversed_name=$(reverse_filename "$name")
    
    if [ -n "$output_folder" ]; then
        mkdir -p "$output_folder"
        local output_path="$output_folder/$reversed_name.$extension"
    else
        local output_path="$reversed_name.$extension"
    fi
    
    echo "Girdi:  $input_file"
    echo "Çıktı: $output_path"
    echo
    
    echo "Video ve ses ters çevriliyor..."
    if ffmpeg -i "$input_file" -vf "reverse" -af "areverse" -y "$output_path"; then
        echo "✓ İşlem başarıyla tamamlandı: $output_path"
    else
        echo "✗ Hata: İşlem başarısız oldu!"
    fi
    echo
}

convert_files() {
    # FFmpeg kontrolü
    if ! command -v ffmpeg &> /dev/null; then
        echo "Hata: FFmpeg bulunamadı!"
        echo "Lütfen FFmpeg'i sisteminize kurun."
        return 1
    fi
    
    local mp4_files=(*.mp4)
    if [ ${#mp4_files[@]} -eq 0 ]; then
        echo "Bu klasörde MP4 dosyası bulunamadı."
        return 1
    fi
    
    echo "${#mp4_files[@]} MP4 dosyası bulundu."
    echo "Ters çevirme başlatılıyor..."
    echo
    
    for file in "${mp4_files[@]}"; do
        convert_single_file "$file" ""
    done
    
    echo "İşlem tamamlandı!"
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
    # Doğrudan çalıştırma - yardım göster
    echo "Kullanım: $0 [video_dosyasi.mp4|klasor] [cikti_klasoru]"
    echo ""
    echo "Örnekler:"
    echo "  $0 \"benim video.mp4\""
    echo "  $0 \"/path/to/Videolar\" \"/path/to/Ciktilar\""
    echo "  Dosyayı veya klasörü sürükleyip bırakabilirsiniz (bazı ortamlarda)"
    echo ""
    read -p "Devam etmek için bir tuşa basın..."
fi
