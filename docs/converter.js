if (typeof self.SharedArrayBuffer === 'undefined') {
    self.SharedArrayBuffer = ArrayBuffer;
}

let ffmpeg = null;
let isFFmpegLoaded = false;
let ffmpegInitializationStarted = false;
let coreURL, wasmURL;

const { fetchFile, toBlobURL } = FFmpegUtil;

async function waitForFFmpeg() {
    const maxWaitTime = 60000;
    const startTime = Date.now();
    
    while (typeof FFmpeg === 'undefined') {
        if (Date.now() - startTime > maxWaitTime) {
            throw new Error('FFmpeg kütüphanesi zaman aşımına uğradı');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return FFmpeg;
}

function updateProgressBar(percentage, message = '', section = null) {
    let progressFill, progressText;
    if (section) {
        progressFill = document.getElementById(`${section}ProgressFill`);
        progressText = document.getElementById(`${section}ProgressText`);
    } else {
        progressFill = document.getElementById('ffmpeg-progress-fill');
        progressText = document.getElementById('ffmpeg-progress-text');
    }
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
        console.log(`Progress bar güncellendi: ${percentage}%${section ? ' (' + section + ')' : ''}`);
    }
    
    if (progressText && message) {
        progressText.textContent = message;
    }
}

const DB_NAME = 'FFmpegCache';
const DB_VERSION = 1;
const STORE_NAME = 'wasmCache';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

async function getFromDB(key) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    } catch (error) {
        console.log('DB read error:', error);
        return null;
    }
}

async function setToDB(key, value) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    } catch (error) {
        console.log('DB write error:', error);
    }
}

async function getActualFileSize(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
            const size = parseInt(response.headers.get('Content-Length'));
            console.log(`Gerçek dosya boyutu: ${size} bytes (${(size/1024/1024).toFixed(2)}MB)`);
            return size;
        }
    } catch (error) {
        console.log('HEAD isteği başarısız, tahmini boyut kullanılacak:', error);
    }
    return 31700000;
}

async function downloadWithResume(url, onProgress) {
    const CACHE_KEY = `wasm_${btoa(url)}`;
    
    const totalSize = await getActualFileSize(url);
    if (!totalSize) {
        throw new Error('Dosya boyutu alınamadı');
    }
    
    const cached = await getFromDB(CACHE_KEY);
    if (cached && cached.length === totalSize) {
        console.log('Cache\'den yüklendi - tam boyut:', cached.length);
        onProgress(totalSize, totalSize, 100);
        return cached;
    }
    
    let existingData = new Uint8Array(0);
    let startByte = 0;
    
    if (cached && cached.length > 0 && cached.length < totalSize) {
        existingData = cached;
        startByte = cached.length;
        console.log(`Kaldığı yerden devam: ${startByte}/${totalSize} bytes`);
    }
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.timeout = 120000;
        
        if (startByte > 0) {
            xhr.setRequestHeader('Range', `bytes=${startByte}-`);
        }
        
        let lastSaveTime = 0;
        let lastLoggedPercent = -1;
        
        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const loaded = startByte + event.loaded;
                const percentage = Math.round((loaded / totalSize) * 100);
                
                if (percentage !== lastLoggedPercent && percentage % 5 === 0) {
                    console.log(`İndirme: ${loaded}/${totalSize} (${percentage}%)`);
                    lastLoggedPercent = percentage;
                }
                
                onProgress(loaded, totalSize, percentage);
                
                const currentTime = Date.now();
                if (currentTime - lastSaveTime > 2000 && xhr.response) {
                    const currentData = new Uint8Array(startByte + event.loaded);
                    if (existingData.length > 0) {
                        currentData.set(existingData);
                    }
                    currentData.set(new Uint8Array(xhr.response), startByte);
                    setToDB(CACHE_KEY, currentData);
                    lastSaveTime = currentTime;
                }
            }
        };
        
        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 206) {
                let finalData;
                
                if (startByte > 0) {
                    finalData = new Uint8Array(existingData.length + xhr.response.byteLength);
                    finalData.set(existingData);
                    finalData.set(new Uint8Array(xhr.response), existingData.length);
                } else {
                    finalData = new Uint8Array(xhr.response);
                }
                
                if (finalData.length === totalSize) {
                    setToDB(CACHE_KEY, finalData);
                    console.log('✅ İndirme tamamlandı - doğru boyut:', finalData.length);
                    resolve(finalData);
                } else {
                    console.error(`❌ Eksik dosya: ${finalData.length} / ${totalSize} bytes`);
                    reject(new Error(`Eksik dosya: ${finalData.length} / ${totalSize} bytes`));
                }
            } else {
                reject(new Error(`HTTP hatası: ${xhr.status}`));
            }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Timeout'));
        xhr.send();
    });
}

async function initFFmpeg() {
    try {
        showGlobalStatus('FFmpeg yükleniyor...', 'info');
        console.log('FFmpeg yüklenmeye başlıyor...');

        updateProgressBar(0, 'FFmpeg başlatılıyor...');

        console.log('FFmpeg kütüphanesi bekleniyor...');
        const FFmpegLib = await waitForFFmpeg();
        console.log('FFmpeg kütüphanesi yüklendi:', FFmpegLib);

        ffmpeg = new FFmpegLib();
        
        ffmpeg.on('log', ({ message }) => {
            console.log('FFmpeg log:', message);
            showGlobalStatus(message, 'info');
        });

        ffmpeg.on('progress', ({ progress }) => {
            const percentage = Math.round(progress * 100);
            updateProgressBar(percentage, `FFmpeg yükleniyor... ${percentage}%`);
        });

        console.log('FFmpeg instance oluşturuldu');

        updateProgressBar(30, 'Core bileşenleri yükleniyor...');

        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
        coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

        console.log('Core URL:', coreURL);
        console.log('WASM URL:', wasmURL);

        updateProgressBar(60, 'FFmpeg core başlatılıyor...');

        await loadFFmpegWithRetry(3, 5000);

        isFFmpegLoaded = true;
        console.log('FFmpeg başarıyla yüklendi!');
        
        updateProgressBar(100, '✅ Hazır! Artık dönüşüm yapabilirsiniz.');
        showGlobalStatus('✅ FFmpeg başarıyla yüklendi! Artık dönüşüm yapabilirsiniz.', 'success');

        enableAllButtons();

        setTimeout(() => {
            const progressContainer = document.getElementById('ffmpeg-progress-container');
            if (progressContainer) progressContainer.style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error('FFmpeg yükleme hatası:', error);
        updateProgressBar(0, '❌ Yükleme başarısız!');
        showGlobalStatus(`FFmpeg yüklenirken hata: ${error.message}. Sayfayı yenileyin veya internetinizi kontrol edin.`, 'error');
        disableAllButtons();
    }
}

async function loadFFmpegWithRetry(attempts = 3, delay = 5000) {
    for (let i = 0; i < attempts; i++) {
        try {
            await ffmpeg.load({
                coreURL,
                wasmURL
            });
            return;
        } catch (error) {
            console.error(`Yükleme denemesi ${i + 1} başarısız:`, error);
            if (i < attempts - 1) {
                showGlobalStatus(`Yükleme başarısız, tekrar denenecek... (${i + 1}/${attempts})`, 'error');
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error('FFmpeg yüklenemedi - birden fazla deneme başarısız.');
}

function displayFiles(inputId, listId) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);
    if (input && list) {
        input.addEventListener('change', () => {
            list.innerHTML = '';
            Array.from(input.files).forEach(file => {
                const li = document.createElement('li');
                li.textContent = file.name;
                list.appendChild(li);
            });
        });
    } else {
        console.error(`displayFiles error: Input ${inputId} or list ${listId} not found`);
    }
}

function enableAllButtons() {
    const buttons = [
        'mp4tomp3Btn',
        'mp3tomp4Btn',
        'movtomp4Btn',
        'invertmp4Btn',
        'flipmp4Btn',
        'mp3tomp4jBtn'
    ];
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = false;
    });
}

function disableAllButtons() {
    const buttons = [
        'mp4tomp3Btn',
        'mp3tomp4Btn',
        'movtomp4Btn',
        'invertmp4Btn',
        'flipmp4Btn',
        'mp3tomp4jBtn'
    ];
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });
}

function showGlobalStatus(message, type = 'info') {
    const status = document.getElementById('globalStatus');
    if (status) {
        status.textContent = message;
        status.className = `status-message ${type}`;
        status.style.display = 'block';
    } else {
        console.log('Global status elementi bulunamadı');
    }
}

function logMessage(section, message, type = 'info') {
    console.log(`${section.toUpperCase()}: ${message} (${type})`);
    const progressText = document.getElementById(`${section}ProgressText`);
    if (progressText) {
        progressText.textContent = message;
    }
    showGlobalStatus(message, type);
}

async function convertMP4ToMP3() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('mp4tomp3', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const input = document.getElementById('mp4tomp3Input');
    const progress = document.getElementById('mp4tomp3Progress');
    const progressFill = document.getElementById('mp4tomp3ProgressFill');
    const progressText = document.getElementById('mp4tomp3ProgressText');

    if (!input.files.length) {
        logMessage('mp4tomp3', 'Lütfen önce bir dosya seçin', 'error');
        return;
    }

    const files = Array.from(input.files);
    
    try {
        progress.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'İşleniyor...';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            const extension = file.name.split('.').pop();
            
            logMessage('mp4tomp3', `İşleniyor: ${file.name}`, 'info');
            
            const fileData = await fetchFile(file);
            await ffmpeg.FS('writeFile', `input.${extension}`, fileData);

            await ffmpeg.run(
                '-i', `input.${extension}`,
                '-vn',
                '-acodec', 'libmp3lame',
                '-q:a', '2',
                'output.mp3'
            );

            const data = ffmpeg.FS('readFile', 'output.mp3');
            
            const blob = new Blob([data.buffer], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.mp3`;
            a.click();

            logMessage('mp4tomp3', `✅ Başarılı: ${fileName}.mp3 oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / files.length) * 100);
            updateProgressBar(currentProgress, `Tamamlandı: ${i + 1}/${files.length}`, 'mp4tomp3');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', `input.${extension}`);
            ffmpeg.FS('unlink', 'output.mp3');
        }

        logMessage('mp4tomp3', 'Tüm dönüşümler tamamlandı!', 'success');
        progress.style.display = 'none';
    } catch (error) {
        console.error('MP4 to MP3 error:', error);
        logMessage('mp4tomp3', 'Dönüştürme hatası: ' + error.message, 'error');
        progress.style.display = 'none';
    }
}

async function convertMP3ToMP4() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('mp3tomp4', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const audioInput = document.getElementById('mp3tomp4AudioInput');
    const imageInput = document.getElementById('mp3tomp4ImageInput');
    const progress = document.getElementById('mp3tomp4Progress');
    const progressFill = document.getElementById('mp3tomp4ProgressFill');
    const progressText = document.getElementById('mp3tomp4ProgressText');

    if (!audioInput.files.length) {
        logMessage('mp3tomp4', 'Lütfen MP3 dosyası seçin', 'error');
        return;
    }

    const audioFiles = Array.from(audioInput.files);
    const imageFile = imageInput.files[0] || null;
    
    try {
        progress.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'İşleniyor...';

        for (let i = 0; i < audioFiles.length; i++) {
            const audioFile = audioFiles[i];
            const fileName = audioFile.name.replace('.mp3', '');
            
            logMessage('mp3tomp4', `İşleniyor: ${audioFile.name}`, 'info');
            
            const audioData = await fetchFile(audioFile);
            await ffmpeg.FS('writeFile', 'audio.mp3', audioData);

            if (imageFile) {
                const imageData = await fetchFile(imageFile);
                const imageExt = imageFile.name.split('.').pop();
                await ffmpeg.FS('writeFile', `image.${imageExt}`, imageData);
                
                await ffmpeg.run(
                    '-loop', '1',
                    '-i', `image.${imageExt}`,
                    '-i', 'audio.mp3',
                    '-c:v', 'libx264',
                    '-tune', 'stillimage',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-pix_fmt', 'yuv420p',
                    '-shortest',
                    '-r', '1',
                    '-vf', 'scale=1280:720',
                    'output.mp4'
                );

                ffmpeg.FS('unlink', `image.${imageExt}`);
            } else {
                await ffmpeg.run(
                    '-f', 'lavfi',
                    '-i', 'color=c=black:s=1280x720:r=1',
                    '-i', 'audio.mp3',
                    '-c:v', 'libx264',
                    '-tune', 'stillimage',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-pix_fmt', 'yuv420p',
                    '-shortest',
                    'output.mp4'
                );
            }

            const data = ffmpeg.FS('readFile', 'output.mp4');
            
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.mp4`;
            a.click();

            logMessage('mp3tomp4', `✅ Başarılı: ${fileName}.mp4 oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / audioFiles.length) * 100);
            updateProgressBar(currentProgress, `Tamamlandı: ${i + 1}/${audioFiles.length}`, 'mp3tomp4');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', 'audio.mp3');
            ffmpeg.FS('unlink', 'output.mp4');
        }

        logMessage('mp3tomp4', 'Tüm dönüşümler tamamlandı!', 'success');
        progress.style.display = 'none';
    } catch (error) {
        console.error('MP3 to MP4 error:', error);
        logMessage('mp3tomp4', 'Dönüştürme hatası: ' + error.message, 'error');
        progress.style.display = 'none';
    }
}

async function convertMOVToMP4() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('movtomp4', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const input = document.getElementById('movtomp4Input');
    const progress = document.getElementById('movtomp4Progress');
    const progressFill = document.getElementById('movtomp4ProgressFill');
    const progressText = document.getElementById('movtomp4ProgressText');

    if (!input.files.length) {
        logMessage('movtomp4', 'Lütfen önce bir dosya seçin', 'error');
        return;
    }

    const files = Array.from(input.files);
    
    try {
        progress.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'İşleniyor...';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            const extension = file.name.split('.').pop();
            
            logMessage('movtomp4', `İşleniyor: ${file.name}`, 'info');
            
            const fileData = await fetchFile(file);
            await ffmpeg.FS('writeFile', file.name, fileData);

            await ffmpeg.run(
                '-i', file.name,
                '-c:v', 'copy',
                '-c:a', 'aac',
                `output_${fileName}.mp4`
            );

            const data = ffmpeg.FS('readFile', `output_${fileName}.mp4`);
            
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `output_${fileName}.mp4`;
            a.click();

            logMessage('movtomp4', `✅ Başarılı: output_${fileName}.mp4 oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / files.length) * 100);
            updateProgressBar(currentProgress, `Tamamlandı: ${i + 1}/${files.length}`, 'movtomp4');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', file.name);
            ffmpeg.FS('unlink', `output_${fileName}.mp4`);
        }

        logMessage('movtomp4', 'Tüm dönüşümler tamamlandı!', 'success');
        progress.style.display = 'none';
    } catch (error) {
        console.error('MOV to MP4 error:', error);
        logMessage('movtomp4', 'Dönüştürme hatası: ' + error.message, 'error');
        progress.style.display = 'none';
    }
}

async function invertVideo() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('invertmp4', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const input = document.getElementById('invertmp4Input');
    const progress = document.getElementById('invertmp4Progress');
    const progressFill = document.getElementById('invertmp4ProgressFill');
    const progressText = document.getElementById('invertmp4ProgressText');

    if (!input.files.length) {
        logMessage('invertmp4', 'Lütfen önce bir dosya seçin', 'error');
        return;
    }

    const files = Array.from(input.files);
    
    try {
        progress.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'İşleniyor...';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            const extension = file.name.split('.').pop();
            const reversedName = fileName.split('').reverse().join('');
            
            logMessage('invertmp4', `İşleniyor: ${file.name}`, 'info');
            
            const fileData = await fetchFile(file);
            await ffmpeg.FS('writeFile', `input.${extension}`, fileData);

            await ffmpeg.run(
                '-i', `input.${extension}`,
                '-vf', 'reverse',
                '-af', 'areverse',
                `output.${extension}`
            );

            const data = ffmpeg.FS('readFile', `output.${extension}`);
            
            const blob = new Blob([data.buffer], { type: `video/${extension}` });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reversedName}.${extension}`;
            a.click();

            logMessage('invertmp4', `✅ Başarılı: ${reversedName}.${extension} oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / files.length) * 100);
            updateProgressBar(currentProgress, `Tamamlandı: ${i + 1}/${files.length}`, 'invertmp4');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', `input.${extension}`);
            ffmpeg.FS('unlink', `output.${extension}`);
        }

        logMessage('invertmp4', 'Tüm dönüşümler tamamlandı!', 'success');
        progress.style.display = 'none';
    } catch (error) {
        console.error('Reverse error:', error);
        logMessage('invertmp4', 'İşlem hatası: ' + error.message, 'error');
        progress.style.display = 'none';
    }
}

async function flipVideo() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('flipmp4', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const input = document.getElementById('flipmp4Input');
    const progress = document.getElementById('flipmp4Progress');
    const progressFill = document.getElementById('flipmp4ProgressFill');
    const progressText = document.getElementById('flipmp4ProgressText');

    if (!input.files.length) {
        logMessage('flipmp4', 'Lütfen önce bir dosya seçin', 'error');
        return;
    }

    const files = Array.from(input.files);
    
    try {
        progress.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'İşleniyor...';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            const extension = file.name.split('.').pop();
            
            logMessage('flipmp4', `İşleniyor: ${file.name}`, 'info');
            
            const fileData = await fetchFile(file);
            await ffmpeg.FS('writeFile', `input.${extension}`, fileData);

            await ffmpeg.run(
                '-i', `input.${extension}`,
                '-vf', 'hflip',
                '-c:a', 'copy',
                `output.${extension}`
            );

            const data = ffmpeg.FS('readFile', `output.${extension}`);
            
            const blob = new Blob([data.buffer], { type: `video/${extension}` });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}_mirrored.${extension}`;
            a.click();

            logMessage('flipmp4', `✅ Başarılı: ${fileName}_mirrored.${extension} oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / files.length) * 100);
            updateProgressBar(currentProgress, `Tamamlandı: ${i + 1}/${files.length}`, 'flipmp4');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', `input.${extension}`);
            ffmpeg.FS('unlink', `output.${extension}`);
        }

        logMessage('flipmp4', 'Tüm dönüşümler tamamlandı!', 'success');
        progress.style.display = 'none';
    } catch (error) {
        console.error('Mirror error:', error);
        logMessage('flipmp4', 'İşlem hatası: ' + error.message, 'error');
        progress.style.display = 'none';
    }
}

async function convertMP3ToMP4WithImage() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('mp3tomp4j', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const audioInput = document.getElementById('mp3tomp4jAudioInput');
    const imageInput = document.getElementById('mp3tomp4jImageInput');
    const progress = document.getElementById('mp3tomp4jProgress');
    const progressFill = document.getElementById('mp3tomp4jProgressFill');
    const progressText = document.getElementById('mp3tomp4jProgressText');

    if (!audioInput.files.length || !imageInput.files.length) {
        logMessage('mp3tomp4j', 'Lütfen hem MP3 hem de resim dosyası seçin', 'error');
        return;
    }

    const audioFiles = Array.from(audioInput.files);
    const imageFile = imageInput.files[0];
    
    try {
        progress.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'İşleniyor...';

        for (let i = 0; i < audioFiles.length; i++) {
            const audioFile = audioFiles[i];
            const fileName = audioFile.name.replace('.mp3', '');
            
            logMessage('mp3tomp4j', `İşleniyor: ${audioFile.name}`, 'info');
            
            const audioData = await fetchFile(audioFile);
            const imageData = await fetchFile(imageFile);
            const imageExt = imageFile.name.split('.').pop();
            
            await ffmpeg.FS('writeFile', 'audio.mp3', audioData);
            await ffmpeg.FS('writeFile', `image.${imageExt}`, imageData);

            await ffmpeg.run(
                '-loop', '1',
                '-i', `image.${imageExt}`,
                '-i', 'audio.mp3',
                '-c:v', 'libx264',
                '-tune', 'stillimage',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-shortest',
                '-r', '1',
                '-vf', 'scale=1280:720',
                'output.mp4'
            );

            const data = ffmpeg.FS('readFile', 'output.mp4');
            
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.mp4`;
            a.click();

            logMessage('mp3tomp4j', `✅ Başarılı: ${fileName}.mp4 oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / audioFiles.length) * 100);
            updateProgressBar(currentProgress, `Tamamlandı: ${i + 1}/${audioFiles.length}`, 'mp3tomp4j');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', 'audio.mp3');
            ffmpeg.FS('unlink', `image.${imageExt}`);
            ffmpeg.FS('unlink', 'output.mp4');
        }

        logMessage('mp3tomp4j', 'Tüm dönüşümler tamamlandı!', 'success');
        progress.style.display = 'none';
    } catch (error) {
        console.error('Conversion error:', error);
        logMessage('mp3tomp4j', 'Dönüştürme hatası: ' + error.message, 'error');
        progress.style.display = 'none';
    }
}

function setupTabs() {
    console.log('Tabs ayarlandı');
}

function setupFileInputs() {
    console.log('File inputs ayarlandı');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM yüklendi, bileşenler ayarlanıyor...');
    
    if (ffmpegInitializationStarted) {
        console.log('FFmpeg zaten yüklenmeye başladı, tekrar başlatılmıyor.');
        return;
    }
    
    ffmpegInitializationStarted = true;
    
    setupTabs();
    setupFileInputs();
    
    displayFiles('mp4tomp3Input', 'mp4tomp3Files');
    displayFiles('mp3tomp4AudioInput', 'mp3tomp4Files');
    displayFiles('movtomp4Input', 'movtomp4Files');
    displayFiles('invertmp4Input', 'invertmp4Files');
    displayFiles('flipmp4Input', 'flipmp4Files');
    displayFiles('mp3tomp4jAudioInput', 'mp3tomp4jFiles');

    const buttons = [
        { id: 'mp4tomp3Btn', handler: convertMP4ToMP3 },
        { id: 'mp3tomp4Btn', handler: convertMP3ToMP4 },
        { id: 'movtomp4Btn', handler: convertMOVToMP4 },
        { id: 'invertmp4Btn', handler: invertVideo },
        { id: 'flipmp4Btn', handler: flipVideo },
        { id: 'mp3tomp4jBtn', handler: convertMP3ToMP4WithImage }
    ];

    buttons.forEach(({ id, handler }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', handler);
        } else {
            console.error(`Button with ID ${id} not found`);
        }
    });

    initFFmpeg();
});