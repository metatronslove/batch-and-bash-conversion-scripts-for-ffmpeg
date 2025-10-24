#!/bin/bash

echo "MOV to MP4 Converter - Arch Linux (NVIDIA GPU)"

# FFmpeg kontrolü
if ! command -v ffmpeg &> /dev/null; then
    echo "HATA: FFmpeg bulunamadı! sudo pacman -S ffmpeg"
    exit 1
fi

# NVIDIA driver kontrolü
if ! command -v nvidia-smi &> /dev/null; then
    echo "HATA: NVIDIA driver bulunamadı!"
    exit 1
fi

# NVIDIA codec desteği kontrolü
if ! ffmpeg -hide_banner -encoders 2>/dev/null | grep -q "nvenc"; then
    echo "HATA: NVIDIA NVENC codec desteği bulunamadı!"
    echo "Gerekli paket: sudo pacman -S nvidia nvidia-utils"
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

    echo "Dönüştürülüyor: $input_file (NVIDIA GPU kullanılıyor)"

    # NVIDIA GPU ile dönüştürme
    if ffmpeg -hwaccel cuda -hwaccel_output_format cuda -i "$input_file" \
        -c:v h264_nvenc -preset p4 -tune hq -rc vbr -cq 23 -b:v 0 \
        -c:a aac -b:a 128k \
        "$output_path" -y; then
        echo "✓ Başarılı: $name.mp4"
    else
        echo "✗ Hata: $input_file dönüştürülemedi, fallback deneniyor..."
        # Fallback: CPU kullanarak
        if ffmpeg -i "$input_file" -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k "$output_path" -y; then
            echo "✓ Başarılı (CPU): $name.mp4"
        else
            echo "✗ Kritik Hata: $input_file dönüştürülemedi"
        fi
    fi
}

# Performans ayarları
export CUDA_VISIBLE_DEVICES=0  # Hangi GPU kullanılacak (0: birinci GPU)

# Ana işlem
if [ $# -gt 0 ]; then
    if [ -e "$1" ]; then
        if [ -d "$1" ]; then
            echo "Klasör işleniyor: $1"
            cd "$1"
            shopt -s nullglob
            mov_files=(*.mov *.MOV)
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
    echo "Mevcut dizindeki .mov dosyaları işleniyor..."
    shopt -s nullglob
    mov_files=(*.mov *.MOV)
    if [ ${#mov_files[@]} -eq 0 ]; then
        echo "Hiç .mov dosyası bulunamadı!"
        exit 1
    fi
    for file in "${mov_files[@]}"; do
        convert_single_file "$file" "converted"
    done
fi

echo "Dönüştürme işlemi tamamlandı!"