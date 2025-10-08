const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
});

// FFmpeg yükleme fonksiyonu
async function loadFFmpegWithRetry(attempts = 3, delay = 3000) {
  const statusElement = document.getElementById('ffmpeg-status');
  statusElement.innerText = 'FFmpeg yükleniyor...';

  for (let i = 0; i < attempts; i++) {
    try {
      await ffmpeg.load();
      statusElement.innerText = 'FFmpeg yüklendi!';
      console.log('FFmpeg başarıyla yüklendi');
      enableButtons(); // Düğmeleri etkinleştir
      return;
    } catch (error) {
      console.error(`Deneme ${i + 1} başarısız:`, error);
      if (i < attempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  statusElement.classList.add('error');
  statusElement.innerText = 'FFmpeg yüklenemedi. Lütfen sayfayı yenileyin veya başka bir tarayıcı deneyin.';
  throw new Error('FFmpeg yüklenemedi');
}

// Düğmeleri etkinleştir
function enableButtons() {
  document.getElementById('mp4-to-mp3-btn').disabled = false;
  document.getElementById('mp3-to-mp4-btn').disabled = false;
  document.getElementById('mov-to-mp4-btn').disabled = false;
  document.getElementById('video-reverse-btn').disabled = false;
  document.getElementById('video-mirror-btn').disabled = false;
  document.getElementById('mp3-to-mp4-image-btn').disabled = false;
}

// Dosya seçildiğinde listele
function displayFiles(inputId, listId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  input.addEventListener('change', () => {
    list.innerHTML = '';
    Array.from(input.files).forEach(file => {
      const li = document.createElement('li');
      li.textContent = file.name;
      list.appendChild(li);
    });
  });
}

// MP4 → MP3 dönüştürme
async function convertMp4ToMp3() {
  const input = document.getElementById('mp4-to-mp3-input');
  const progress = document.getElementById('mp4-to-mp3-progress');
  progress.style.display = 'block';
  progress.innerText = 'İşleniyor...';

  for (const file of input.files) {
    try {
      ffmpeg.FS('writeFile', file.name, await fetchFile(file));
      await ffmpeg.run('-i', file.name, '-vn', '-acodec', 'mp3', `output_${file.name}.mp3`);
      const data = ffmpeg.FS('readFile', `output_${file.name}.mp3`);
      const blob = new Blob([data.buffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `output_${file.name}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('MP4 → MP3 hatası:', error);
      progress.classList.add('error');
      progress.innerText = 'Dönüştürme başarısız!';
    }
  }
  progress.style.display = 'none';
}

// MOV → MP4 dönüştürme
async function convertMovToMp4() {
  const input = document.getElementById('mov-to-mp4-input');
  const progress = document.getElementById('mov-to-mp4-progress');
  progress.style.display = 'block';
  progress.innerText = 'İşleniyor...';

  for (const file of input.files) {
    try {
      ffmpeg.FS('writeFile', file.name, await fetchFile(file));
      await ffmpeg.run('-i', file.name, '-c:v', 'copy', '-c:a', 'aac', `output_${file.name}.mp4`);
      const data = ffmpeg.FS('readFile', `output_${file.name}.mp4`);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `output_${file.name}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('MOV → MP4 hatası:', error);
      progress.classList.add('error');
      progress.innerText = 'Dönüştürme başarısız!';
    }
  }
  progress.style.display = 'none';
}

// Olay dinleyicilerini ekle
document.addEventListener('DOMContentLoaded', () => {
  // Dosya seçimlerini göster
  displayFiles('mp4-to-mp3-input', 'mp4-to-mp3-files');
  displayFiles('mp3-to-mp4-audio', 'mp3-to-mp4-files');
  displayFiles('mov-to-mp4-input', 'mov-to-mp4-files');
  displayFiles('video-reverse-input', 'video-reverse-files');
  displayFiles('video-mirror-input', 'video-mirror-files');
  displayFiles('mp3-to-mp4-image-audio', 'mp3-to-mp4-image-files');

  // Dönüştürme düğmeleri
  document.getElementById('mp4-to-mp3-btn').addEventListener('click', convertMp4ToMp4);
  document.getElementById('mov-to-mp4-btn').addEventListener('click', convertMovToMp4);

  // FFmpeg'yi yükle
  loadFFmpegWithRetry();
});