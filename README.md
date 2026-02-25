# Video Converter Tools

**Çapraz platform video ve ses dönüştürme araçları - Cross-platform video and audio conversion tools**

---

## 📋 İçindekiler / Table of Contents
- [Özellikler / Features](#özellikler--features)
- [Scriptler / Scripts](#scriptler--scripts)
- [Kurulum / Installation](#kurulum--installation)
- [Kullanım / Usage](#kullanım--usage)
- [Örnekler / Examples](#örnekler--examples)
- [Gereksinimler / Requirements](#gereksinimler--requirements)

---

## 🚀 Özellikler / Features

### 🇹🇷 Türkçe
- **Çapraz Platform**: Windows Batch ve Linux Bash script desteği
- **Esnek Kullanım**: Tekil dosya, klasör veya doğrudan çalıştırma
- **Sürükle-Bırak Desteği**: Dosya veya klasörleri script üzerine sürükleyip bırakın
- **Toplu İşleme**: Bir klasördeki tüm dosyaları otomatik dönüştürme
- **Opsiyonel Argümanlar**: Gelişmiş kullanım için komut satırı argümanları
- **Hata Yönetimi**: Detaylı hata mesajları ve FFmpeg kontrolü

### 🇬🇧 English
- **Cross-Platform**: Windows Batch and Linux Bash script support
- **Flexible Usage**: Single file, folder, or direct execution
- **Drag & Drop Support**: Drag and drop files or folders onto scripts
- **Batch Processing**: Automatically convert all files in a folder
- **Optional Arguments**: Command-line arguments for advanced usage
- **Error Handling**: Detailed error messages and FFmpeg checks

---

## 📜 Scriptler / Scripts

### 🔄 MP4 to MP3
**🇹🇷 Türkçe**: MP4 videolardan ses çıkararak MP3 formatına dönüştürür  
**🇬🇧 English**: Extracts audio from MP4 videos and converts to MP3 format  
**Dosyalar / Files**: `batch/mp42mp3.bat`, `bash/mp42mp3.sh`

### 🎵 MP3 to MP4
**🇹🇷 Türkçe**: MP3 dosyalarını kapak resimli MP4 videolara dönüştürür  
**🇬🇧 English**: Converts MP3 files to MP4 videos with cover art  
**Dosyalar / Files**: `batch/mp32mp4.bat`, `bash/mp32mp4.sh`

### 🔄 Invert MP4
**🇹🇷 Türkçe**: Videoları ve sesi ters çevirir, dosya adını da tersine çevirir  
**🇬🇧 English**: Reverses video and audio, also reverses filename  
**Dosyalar / Files**: `batch/invertmp4.bat`, `bash/invertmp4.sh`

### 🎬 MOV to MP4
**🇹🇷 Türkçe**: MOV dosyalarını yüksek kaliteli MP4 formatına dönüştürür  
**🇬🇧 English**: Converts MOV files to high-quality MP4 format  
**Dosyalar / Files**: `batch/mov2mp4.bat`, `bash/mov2mp4.sh`

### 🖼️ MP3 to MP4 with Static Image
**🇹🇷 Türkçe**: MP3'leri sabit resim arka planlı MP4'lere dönüştürür (varsayılan: ata.jpg)  
**🇬🇧 English**: Converts MP3s to MP4s with static image background (default: ata.jpg)  
**Dosyalar / Files**: `batch/mp32mp4j.bat`, `bash/mp32mp4j.sh`

### 🪞 MP4 Horizontal Mirror (Flip)
**🇹🇷 Türkçe**: Video görüntüsünü yatay olarak ayna efekti uygular  
**🇬🇧 English**: Applies horizontal mirror (flip) effect to video  
**Dosyalar / Files**: `batch/flipmp4.bat`, `bash/flipmp4.sh`

---

## ⚙️ Kurulum / Installation

### FFmpeg Kurulumu / FFmpeg Installation

#### 🪟 Windows
**🇹🇷 Türkçe**:
1. **Scoop ile (önerilen)**:
   ```cmd
   scoop install ffmpeg
   ```
2. **Chocolatey ile**:
   ```cmd
   choco install ffmpeg
   ```
3. **Manuel kurulum**:
   - [FFmpeg resmi sitesinden](https://ffmpeg.org/download.html) indirin
   - ZIP'i açın ve `bin` klasörünü sistem PATH'ine ekleyin

**🇬🇧 English**:
1. **Using Scoop (recommended)**:
   ```cmd
   scoop install ffmpeg
   ```
2. **Using Chocolatey**:
   ```cmd
   choco install ffmpeg
   ```
3. **Manual installation**:
   - Download from [FFmpeg official site](https://ffmpeg.org/download.html)
   - Extract ZIP and add `bin` folder to system PATH

#### 🐧 Linux
**Debian/Ubuntu**:
```bash
sudo apt update && sudo apt install ffmpeg
```

**CentOS/RHEL**:
```bash
sudo yum install ffmpeg
# veya / or
sudo dnf install ffmpeg
```

**Arch Linux**:
```bash
sudo pacman -S ffmpeg
```

**Fedora**:
```bash
sudo dnf install ffmpeg
```

---

## 🎯 Kullanım / Usage

### 🪟 Windows
**🇹🇷 Türkçe**:
1. Batch dosyalarını istediğiniz klasöre kopyalayın
2. FFmpeg'in kurulu olduğundan emin olun
3. Script'i çift tıklayın VEYA dosya/klasörü script üzerine sürükleyip bırakın

**🇬🇧 English**:
1. Copy batch files to your desired folder
2. Ensure FFmpeg is installed
3. Double-click script OR drag and drop file/folder onto script

### 🐧 Linux
**🇹🇷 Türkçe**:
1. Bash scriptlerini indirin
2. Çalıştırma izni verin:
   ```bash
   chmod +x bash/*.sh
   ```
3. Script'i çalıştırın:
   ```bash
   ./bash/mp42mp3.sh
   ```

**🇬🇧 English**:
1. Download bash scripts
2. Make executable:
   ```bash
   chmod +x bash/*.sh
   ```
3. Run script:
   ```bash
   ./bash/mp42mp3.sh
   ```

---

## 📝 Kullanım Senaryoları / Usage Scenarios

### 1. Doğrudan Çalıştırma / Direct Execution
**🇹🇷 Türkçe**: Script'i çift tıklayın (Windows) veya terminalden çalıştırın (Linux). Bulunduğu klasördeki tüm uygun dosyaları dönüştürür.  
**🇬🇧 English**: Double-click script (Windows) or run from terminal (Linux). Converts all suitable files in current folder.

### 2. Tekil Dosya Dönüştürme / Single File Conversion
**🇹🇷 Türkçe**: Dosyayı script üzerine sürükleyip bırakın.  
**🇬🇧 English**: Drag and drop file onto script.

### 3. Klasör Dönüştürme / Folder Conversion
**🇹🇷 Türkçe**: Klasörü script üzerine sürükleyip bırakın, klasördeki tüm uygun dosyalar dönüştürülür.  
**🇬🇧 English**: Drag and drop folder onto script, all suitable files in folder will be converted.

### 4. Komut Satırından Gelişmiş Kullanım / Advanced Command Line Usage

#### Windows
```cmd
mp42mp3.bat "video.mp4" "output_folder"
mp32mp4.bat "song.mp3" "cover.jpg" "output_folder"
invertmp4.bat "video.mp4" "output_folder"
mov2mp4.bat "video.mov" "output_folder"
mp32mp4j.bat "song.mp3" "custom_image.jpg" "output_folder"
flipmp4.bat "video.mp4" "output_folder"
```

#### Linux
```bash
./mp42mp3.sh "video.mp4" "output_folder"
./mp32mp4.sh "song.mp3" "cover.jpg" "output_folder"
./invertmp4.sh "video.mp4" "output_folder"
./mov2mp4.sh "video.mov" "output_folder"
./mp32mp4j.sh "song.mp3" "custom_image.jpg" "output_folder"
./flipmp4.sh "video.mp4" "output_folder"
```

---

## 🔧 Örnekler / Examples

### 🇹🇷 Türkçe Örnekler
```bash
# Mevcut klasördeki tüm MP4'leri MP3'e çevir
./mp42mp3.sh

# Tekil MOV dosyası dönüştürme
./mov2mp4.sh "/yol/video.mov"

# MP3'ü özel kapak resmi ile MP4'e çevir
./mp32mp4j.sh "sarki.mp3" "kapak_resmi.jpg" "/cikti/klasoru"

# Video'ya ayna efekti uygula
./flipmp4.sh "video.mp4"

# Klasördeki tüm videoları ters çevir
./invertmp4.sh "/yol/videolar/"
```

### 🇬🇧 English Examples
```bash
# Convert all MP4 files in current folder to MP3
./mp42mp3.sh

# Convert single MOV file
./mov2mp4.sh "/path/to/video.mov"

# Convert MP3 to MP4 with custom cover image
./mp32mp4j.sh "song.mp3" "cover_image.jpg" "/output/folder"

# Apply mirror effect to video
./flipmp4.sh "video.mp4"

# Reverse all videos in folder
./invertmp4.sh "/path/to/videos/"
```

---

## 📊 Parametre Tablosu / Parameter Table

| Script | Girdi / Input | Çıktı / Output | Özel Parametreler / Special Parameters |
|--------|---------------|----------------|--------------------------------------|
| **mp42mp3** | MP4 | MP3 | - |
| **mp32mp4** | MP3 | MP4 | Kapak resmi / Cover image |
| **invertmp4** | MP4 | MP4 (ters / reversed) | - |
| **mov2mp4** | MOV | MP4 | - |
| **mp32mp4j** | MP3 | MP4 | Resim dosyası / Image file |
| **flipmp4** | MP4 | MP4 (ayna / mirrored) | - |

---

## ⚠️ Gereksinimler / Requirements

### 🇹🇷 Türkçe
- **FFmpeg** (zorunlu / mandatory)
- **Bash** (Linux için / for Linux)
- **Windows Command Prompt** (Windows için / for Windows)
- **Yeterli disk alanı** / Sufficient disk space

### 🇬🇧 English
- **FFmpeg** (mandatory)
- **Bash** (for Linux)
- **Windows Command Prompt** (for Windows)
- **Sufficient disk space**

---

## 💡 Notlar / Notes

### 🇹🇷 Türkçe
- Tüm script'ler hata kontrolleri içerir
- FFmpeg kurulu değilse uyarı verir ve çıkar
- Dönüştürme işlemi sırasında detaylı log gösterir
- Geçici dosyalar otomatik temizlenir
- Büyük dosyalar için yeterli disk alanı olduğundan emin olun

### 🇬🇧 English
- All scripts include error checking
- Warns and exits if FFmpeg is not installed
- Shows detailed logs during conversion
- Temporary files are automatically cleaned
- Ensure sufficient disk space for large files

---

## 🤝 Katkıda Bulunma / Contributing

**🇹🇷 Türkçe**:
1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/özellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/özellik`)
5. Pull Request oluşturun

**🇬🇧 English**:
1. Fork the project
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 Lisans / License

Bu proje MIT lisansı altında lisanslanmıştır.  
This project is licensed under the MIT License.

---

## ⚡ Hızlı Başlangıç / Quick Start

### 🪟 Windows
```cmd
# MP4'ten MP3'e dönüştür
mp42mp3.bat

# MOV'dan MP4'e dönüştür  
mov2mp4.bat

# Video'yu ters çevir
invertmp4.bat
```

### 🐧 Linux
```bash
# Script'lere çalıştırma izni ver
chmod +x bash/*.sh

# MP4'ten MP3'e dönüştür
./mp42mp3.sh

# Video'ya ayna efekti uygula
./flipmp4.sh

# MP3'ü MP4'e dönüştür
./mp32mp4.sh
```

**🇹🇷 Türkçe**: Script'leri kullanmaya başlamak için FFmpeg'in kurulu olduğundan emin olun ve istediğiniz script'i çalıştırın!  
**🇬🇧 English**: Make sure FFmpeg is installed and run your desired script to get started!

## ☕ Destek Olun / Support

Projemi beğendiyseniz, bana bir kahve ısmarlayarak destek olabilirsiniz!

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/metatronslove)

Teşekkürler! 🙏

