#!/bin/bash

# srtOmp4.sh - Gelişmiş Altyazılı Video Dönüştürücü

# Varsayılan ayarlar
FONT_SIZE=26
OPACITY="7F"  # %50 opak

# Parametreleri parse et
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--font-size)
            FONT_SIZE="$2"
            shift 2
            ;;
        -o|--opacity)
            OPACITY="$2"
            shift 2
            ;;
        -h|--help)
            echo "Kullanım: $0 [SEÇENEKLER] \"video.mp4\" \"altyazi.srt\""
            echo "Seçenekler:"
            echo "  -f, --font-size BOYUT    Yazı boyutu (varsayılan: 26)"
            echo "  -o, --opacity OPAKLIK    Opaklık değeri (varsayılan: 7F)"
            echo "  -h, --help               Bu yardımı göster"
            exit 0
            ;;
        *)
            if [ -z "$VIDEO_FILE" ]; then
                VIDEO_FILE="$1"
            elif [ -z "$SUBTITLE_FILE" ]; then
                SUBTITLE_FILE="$1"
            fi
            shift
            ;;
    esac
done

# ... (yukarıdaki dosya kontrolü ve işlem kısmı aynı)

# FFmpeg komutunda değişkenleri kullan
ffmpeg -i "$VIDEO_FILE" \
  -vf "subtitles=$SUBTITLE_FILE:force_style='\
        Fontname=Arial,\
        Fontsize=$FONT_SIZE,\
        PrimaryColour=&HFFFFFF,\
        BackColour=&H${OPACITY}000000,\
        BorderStyle=4,\
        Outline=2,\
        Shadow=1,\
        Alignment=2'" \
  -c:a copy \
  -movflags +faststart \
  -y \
  "$OUTPUT_FILE"
