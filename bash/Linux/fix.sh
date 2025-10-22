#!/bin/bash
echo "Script'ler düzeltiliyor..."

for script in *.sh; do
    if [ -f "$script" ]; then
        echo "Düzeltiliyor: $script"
        # CRLF'yi LF'ye çevir
        sed -i 's/\r$//' "$script"
        # Çalıştırma izni ver
        chmod +x "$script"
    fi
done

echo "Tamamlandı! Script'ler şimdi çalışmalı."