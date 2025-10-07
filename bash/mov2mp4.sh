#!/bin/bash

echo "MOV to MP4 Converter"
echo "==================="

# FFmpeg kontrolü
if ! command -v ffmpeg &> /dev/null; then
    echo "HATA: FFmpeg bulunamadı!"
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
        local output_path="$output_folder/$name.mp4"
    else
        local output_path="$name.mp4"
    fi
    
    echo "Converting: $input_file"
    echo "To: $output_path"
    
    if ffmpeg -i "$input_file" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k "$output_path" -y; then
        echo "✓ Successfully converted: $name.mp4"
        return 0
    else
        echo "✗ Failed to convert: $input_file"
        return 1
    fi
    echo
}

convert_files() {
    local output_folder="converted"
    mkdir -p "$output_folder"
    
    local mov_files=(*.mov)
    local count=0
    
    if [ ${#mov_files[@]} -eq 0 ]; then
        echo "No MOV files found in this directory."
        return 1
    fi
    
    echo "${#mov_files[@]} MOV files found."
    echo "Starting conversion..."
    echo
    
    for file in "${mov_files[@]}"; do
        if convert_single_file "$file" "$output_folder"; then
            ((count++))
        fi
    done
    
    echo ""
    echo "Conversion complete!"
    echo "Files converted: $count"
}

# Ana işlem
if [ $# -gt 0 ]; then
    if [ -e "$1" ]; then
        if [ -d "$1" ]; then
            # Klasör sürükle-bırak
            echo "Processing folder: $1"
            cd "$1"
            convert_files
        else
            # Tekil dosya sürükle-bırak
            echo "Processing single file: $1"
            local_dir=$(dirname "$1")
            filename=$(basename "$1")
            cd "$local_dir"
            convert_single_file "$filename" "$2"
        fi
    else
        echo "ERROR: File or folder not found: $1"
        exit 1
    fi
else
    # Doğrudan çalıştırma
    convert_files
    read -p "Press any key to continue..."
fi
