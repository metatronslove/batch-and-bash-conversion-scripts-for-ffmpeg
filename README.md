# Video Converter Tools

Çapraz platform video ve audio dönüştürme scriptleri. Windows batch ve Linux bash scriptleri içerir.

## Özellikler

- **Çapraz Platform**: Windows ve Linux desteği
- **Esnek Kullanım**: Tekil dosya, klasör veya doğrudan çalıştırma
- **Sürükle-Bırak Desteği**: Dosya veya klasörleri script üzerine sürükleyip bırakın
- **Opsiyonel Argümanlar**: Gelişmiş kullanım için komut satırı argümanları

## Scriptler

### MP4 to MP3
- MP4 videolarından ses çıkararak MP3'e dönüştürür
- **Dosyalar**: `batch/mp42mp3.bat`, `bash/mp42mp3.sh`

### MP3 to MP4
- MP3 dosyalarını kapak resimli MP4 videolara dönüştürür
- **Dosyalar**: `batch/mp32mp4.bat`, `bash/mp32mp4.sh`

### Invert MP4
- Videoları ve sesi ters çevirir, dosya adını da tersine çevirir
- **Dosyalar**: `batch/invertmp4.bat`, `bash/invertmp4.sh`

### MOV to MP4
- MOV dosyalarını MP4 formatına dönüştürür
- **Özellikler**: 
  - H.264 video codec, AAC audio codec
  - CRF 23 kalite, medium preset
  - `converted` klasörüne kaydeder
- **Dosyalar**: `batch/mov2mp4.bat`, `bash/mov2mp4.sh`

### MP3 to MP4 with Static Image
- MP3'leri sabit resimli MP4'lere dönüştürür
- **Özellikler**:
  - Varsayılan olarak `ata.jpg` kullanır
  - 1280x720 çözünürlük
  - 1 FPS, still image optimize
- **Dosyalar**: `batch/mp32mp4j.bat`, `bash/mp32mp4j.sh`

## Kurulum

### FFmpeg Kurulumu

#### Windows
1. **Scoop ile (önerilen)**:
   ```cmd
   scoop install ffmpeg
