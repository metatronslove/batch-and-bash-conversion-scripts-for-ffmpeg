#!/bin/bash

echo "MP3 to MP4 Converter"
echo "==================="

# FFmpeg kontrolü
if ! command -v ffmpeg &> /dev/null; then
    echo "ERROR: FFmpeg not found!"
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
    
    echo "Processing: $input_file"
    
    if ffmpeg -loop 1 -i "$cover_image" -i "$input_file" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -r 1 -vf "scale=1280:720" "$output_path" -y; then
        echo "Completed: $output_path"
    else
        echo "ERROR converting $input_file"
    fi
    echo
}

convert_files() {
    # Kapak resmi kontrolü
    local cover_image="ata.jpg"
    if [ ! -f "$cover_image" ]; then
        echo "ERROR: $cover_image not found!"
        echo "Available image files:"
        find . -maxdepth 1 -name "*.jpg" -o -name "*.jpeg" | head -10
        return 1
    fi

    echo "Using $cover_image as cover image"
    echo ""

    local mp3_files=(*.mp3)
    
    for file in "${mp3_files[@]}"; do
        convert_single_file "$file" "$cover_image" ""
    done
    
    echo "All done!"
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
            
            local cover_image="ata.jpg"
            if [ $# -ge 2 ] && [ -f "$2" ]; then
                cover_image="$2"
            fi
            
            if [ ! -f "$cover_image" ]; then
                echo "ERROR: Cover image not found: $cover_image"
                exit 1
            fi
            
            convert_single_file "$filename" "$cover_image" "$3"
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
