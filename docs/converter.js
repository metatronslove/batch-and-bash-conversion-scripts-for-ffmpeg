// GitHub Pages için gerekli ayarlar
if (typeof self.SharedArrayBuffer === 'undefined') {
    self.SharedArrayBuffer = ArrayBuffer;
}

let ffmpeg = null;
let isFFmpegLoaded = false;
let ffmpegInitializationStarted = false;// toBlobURL'i import edin (eğer util yüklü değilse, global yapın)
const { toBlobURL } = FFmpegUtil; // Veya global FFmpegUtil varsayın

// Güncellenmiş initFFmpeg
async function initFFmpeg() {
    try {
        showGlobalStatus('FFmpeg yükleniyor...', 'info');
        console.log('FFmpeg yüklenmeye başlıyor...');

        updateProgressBar(0, 'FFmpeg başlatılıyor...');

        // FFmpeg'in yüklenmesini bekle
        console.log('FFmpeg kütüphanesi bekleniyor...');
        const FFmpegLib = await waitForFFmpeg(); // Mevcut fonksiyonunuzu koruyun
        console.log('FFmpeg kütüphanesi yüklendi:', FFmpegLib);

        // Yeni FFmpeg instance'ı oluştur
        ffmpeg = new FFmpegLib();
        
        // Log handler ekle (hata ayıklama için)
        ffmpeg.on('log', ({ message }) => {
            console.log('FFmpeg log:', message);
            // UI'ye ekleyin eğer isterseniz
            showGlobalStatus(message, 'info');
        });

        // Progress handler ekle
        ffmpeg.on('progress', ({ progress }) => {
            const percentage = Math.round(progress * 100);
            updateProgressBar(percentage, `FFmpeg yükleniyor... ${percentage}%`);
        });

        console.log('FFmpeg instance oluşturuldu');

        updateProgressBar(30, 'Core bileşenleri yükleniyor...');

        // Core ve WASM URL'leri (CORS için toBlobURL kullan)
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

        console.log('Core URL:', coreURL);
        console.log('WASM URL:', wasmURL);

        updateProgressBar(60, 'FFmpeg core başlatılıyor...');

        // FFmpeg'i retry ile yükle (eski setTimeout yerine)
        await loadFFmpegWithRetry(3, 5000); // 3 deneme, 5sn aralık

        isFFmpegLoaded = true;
        console.log('FFmpeg başarıyla yüklendi!');
        
        updateProgressBar(100, '✅ Hazır! Artık dönüşüm yapabilirsiniz.');
        showGlobalStatus('✅ FFmpeg başarıyla yüklendi! Artık dönüşüm yapabilirsiniz.', 'success');

        // Butonları etkinleştir (mevcut fonksiyonunuzu koruyun)
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

// Yeni retry fonksiyonu (1602-1606 setTimeout yerine)
async function loadFFmpegWithRetry(attempts = 3, delay = 5000) {
    for (let i = 0; i < attempts; i++) {
        try {
            await ffmpeg.load({
                coreURL: coreURL, // Yukarıdan alınan
                wasmURL: wasmURL
            });
            return; // Başarılı
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

// FFmpeg yüklenene kadar bekleyen fonksiyon
async function waitForFFmpeg() {
    const maxWaitTime = 99999; // 100 saniye gibi
    const startTime = Date.now();
    
    while (typeof FFmpeg === 'undefined') {
        if (Date.now() - startTime > maxWaitTime) {
            throw new Error('FFmpeg kütüphanesi zaman aşımına uğradı');
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return FFmpeg;
}

// Progress bar güncelleme fonksiyonu
function updateProgressBar(percentage, message = '') {
    const progressFill = document.getElementById('ffmpeg-progress-fill');
    const progressText = document.getElementById('ffmpeg-progress-text');
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
        console.log(`Progress bar güncellendi: ${percentage}%`);
    }
    
    if (progressText && message) {
        progressText.textContent = message;
    }
}

// IndexedDB için yardımcı fonksiyonlar
const DB_NAME = 'FFmpegCache';
const DB_VERSION = 1;
const STORE_NAME = 'wasmCache';

// IndexedDB'yi aç
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

// IndexedDB'den veri oku
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

// IndexedDB'ye veri yaz
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

// Gerçek dosya boyutunu öğren - SİZİN EKLEDİĞİNİZ
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
    return 31700000; // Fallback tahmini boyut
}

// Güncellenmiş download fonksiyonu - SİZİN EKLEDİĞİNİZ
async function downloadWithResume(url, onProgress) {
    const CACHE_KEY = `wasm_${btoa(url)}`;
    
    // Önce gerçek dosya boyutunu al
    const totalSize = await getActualFileSize(url);
    if (!totalSize) {
        throw new Error('Dosya boyutu alınamadı');
    }
    
    // Cache kontrolü - GERÇEK boyuta göre
    const cached = await getFromDB(CACHE_KEY);
    if (cached && cached.length === totalSize) {
        console.log('Cache\'den yüklendi - tam boyut:', cached.length);
        onProgress(totalSize, totalSize, 100);
        return cached;
    }
    
    let existingData = new Uint8Array(0);
    let startByte = 0;
    
    // Kısmi indirme varsa devam et
    if (cached && cached.length > 0 && cached.length < totalSize) {
        existingData = cached;
        startByte = cached.length;
        console.log(`Kaldığı yerden devam: ${startByte}/${totalSize} bytes`);
    }
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.timeout = 120000; // 2 dakika
        
        if (startByte > 0) {
            xhr.setRequestHeader('Range', `bytes=${startByte}-`);
        }
        
        let lastSaveTime = 0;
        let lastLoggedPercent = -1;
        
        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                const loaded = startByte + event.loaded;
                const percentage = Math.round((loaded / totalSize) * 100);
                
                // Aynı yüzdeyi tekrar loglamamak için
                if (percentage !== lastLoggedPercent && percentage % 5 === 0) {
                    console.log(`İndirme: ${loaded}/${totalSize} (${percentage}%)`);
                    lastLoggedPercent = percentage;
                }
                
                onProgress(loaded, totalSize, percentage);
                
                // Cache'e ara kaydet
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
                
                // GERÇEK boyut kontrolü
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
        
        xhr.onerror = () => reject(new Error('İndirme başarısız'));
        xhr.ontimeout = () => reject(new Error('İndirme zaman aşımı'));
        
        xhr.send();
    });
}

// Tüm butonları devre dışı bırakan fonksiyon
function disableAllButtons() {
    const buttons = [
        'mp4tomp3Btn', 'mp3tomp4Btn', 'movtomp4Btn', 
        'invertmp4Btn', 'flipmp4Btn', 'mp3tomp4jBtn'
    ];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'FFmpeg Yüklenemedi';
        }
    });
}

function showGlobalStatus(message, type) {
    const globalStatus = document.getElementById('globalStatus');
    globalStatus.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
    globalStatus.style.display = 'block';
    setTimeout(() => { globalStatus.style.display = 'none'; }, type === 'error' ? 10000 : 5000);
}

// fetchFile fonksiyonunu global olarak tanımla
function fetchFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(new Uint8Array(reader.result));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Tab functionality
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// File input handlers
function setupFileInputs() {
    const fileConfigs = [
        { area: 'mp4tomp3Area', input: 'mp4tomp3Input', button: 'mp4tomp3Btn', fileList: 'mp4tomp3FileList', filesContainer: 'mp4tomp3Files' },
        { area: 'mp3tomp4AudioArea', input: 'mp3tomp4AudioInput', button: 'mp3tomp4Btn', fileList: 'mp3tomp4FileList', filesContainer: 'mp3tomp4Files' },
        { area: 'mp3tomp4ImageArea', input: 'mp3tomp4ImageInput' },
        { area: 'movtomp4Area', input: 'movtomp4Input', button: 'movtomp4Btn', fileList: 'movtomp4FileList', filesContainer: 'movtomp4Files' },
        { area: 'invertmp4Area', input: 'invertmp4Input', button: 'invertmp4Btn', fileList: 'invertmp4FileList', filesContainer: 'invertmp4Files' },
        { area: 'flipmp4Area', input: 'flipmp4Input', button: 'flipmp4Btn', fileList: 'flipmp4FileList', filesContainer: 'flipmp4Files' },
        { area: 'mp3tomp4jAudioArea', input: 'mp3tomp4jAudioInput', button: 'mp3tomp4jBtn', fileList: 'mp3tomp4jFileList', filesContainer: 'mp3tomp4jFiles' },
        { area: 'mp3tomp4jImageArea', input: 'mp3tomp4jImageInput' }
    ];

    fileConfigs.forEach(({ area, input, button, fileList, filesContainer }) => {
        const areaElement = document.getElementById(area);
        const inputElement = document.getElementById(input);
        const buttonElement = button ? document.getElementById(button) : null;
        const fileListElement = fileList ? document.getElementById(fileList) : null;
        const filesContainerElement = filesContainer ? document.getElementById(filesContainer) : null;

        if (areaElement && inputElement) {
            areaElement.addEventListener('click', () => inputElement.click());

            areaElement.addEventListener('dragover', (e) => {
                e.preventDefault();
                areaElement.classList.add('dragover');
            });

            areaElement.addEventListener('dragleave', () => {
                areaElement.classList.remove('dragover');
            });

            areaElement.addEventListener('drop', (e) => {
                e.preventDefault();
                areaElement.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    inputElement.files = e.dataTransfer.files;
                    handleFileSelect(inputElement, buttonElement, areaElement, fileListElement, filesContainerElement);
                }
            });

            inputElement.addEventListener('change', () => {
                handleFileSelect(inputElement, buttonElement, areaElement, fileListElement, filesContainerElement);
            });
        }
    });
}

function handleFileSelect(input, button, area, fileList, filesContainer) {
    if (input.files.length > 0) {
        const files = Array.from(input.files);
        
        if (files.length === 1) {
            area.innerHTML = `<p>✅ Seçilen dosya: ${files[0].name}</p>`;
        } else {
            area.innerHTML = `<p>✅ ${files.length} dosya seçildi</p>`;
        }
        
        if (fileList && filesContainer) {
            fileList.style.display = 'block';
            filesContainer.innerHTML = '';
            
            files.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span>${file.name}</span>
                    <span>(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                `;
                filesContainer.appendChild(fileItem);
            });
        }
        
        if (button) {
            if (button.id === 'mp3tomp4Btn' || button.id === 'mp3tomp4jBtn') {
                const audioInput = button.id === 'mp3tomp4Btn' ? 
                    document.getElementById('mp3tomp4AudioInput') : 
                    document.getElementById('mp3tomp4jAudioInput');
                const imageInput = button.id === 'mp3tomp4Btn' ? 
                    document.getElementById('mp3tomp4ImageInput') : 
                    document.getElementById('mp3tomp4jImageInput');
                
                if (button.id === 'mp3tomp4jBtn') {
                    button.disabled = !(audioInput.files.length > 0 && imageInput.files.length > 0);
                } else {
                    button.disabled = !(audioInput.files.length > 0);
                }
            } else {
                button.disabled = false;
            }
        }
    }
}

function logMessage(tab, message, type = 'info') {
    const logger = document.getElementById(tab + 'Logger');
    if (logger) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logger.appendChild(logEntry);
        logger.scrollTop = logger.scrollHeight;
    }
}

// Butonları etkinleştirme fonksiyonu
function enableAllButtons() {
    const buttons = [
        'mp4tomp3Btn', 'mp3tomp4Btn', 'movtomp4Btn', 
        'invertmp4Btn', 'flipmp4Btn', 'mp3tomp4jBtn'
    ];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = false;
            // Buton metinlerini orijinal hallerine döndür
            switch(btnId) {
                case 'mp4tomp3Btn': btn.textContent = 'MP3\'e Dönüştür'; break;
                case 'mp3tomp4Btn': btn.textContent = 'MP4\'e Dönüştür'; break;
                case 'movtomp4Btn': btn.textContent = 'MP4\'e Dönüştür'; break;
                case 'invertmp4Btn': btn.textContent = 'Ters Çevir'; break;
                case 'flipmp4Btn': btn.textContent = 'Ayna Efekti Uygula'; break;
                case 'mp3tomp4jBtn': btn.textContent = 'MP4\'e Dönüştür'; break;
            }
        }
    });
}

// Event listeners
document.getElementById('mp4tomp3Btn').addEventListener('click', () => convertMP4ToMP3());
document.getElementById('mp3tomp4Btn').addEventListener('click', () => convertMP3ToMP4());
document.getElementById('movtomp4Btn').addEventListener('click', () => convertMOVToMP4());
document.getElementById('invertmp4Btn').addEventListener('click', () => invertVideo());
document.getElementById('flipmp4Btn').addEventListener('click', () => flipVideo());
document.getElementById('mp3tomp4jBtn').addEventListener('click', () => convertMP3ToMP4WithImage());

// Dönüşüm fonksiyonları
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
            
            logMessage('mp4tomp3', `İşleniyor: ${file.name}`, 'info');
            
            const fileData = await fetchFile(file);
            await ffmpeg.FS('writeFile', 'input.mp4', fileData);

            await ffmpeg.run('-i', 'input.mp4', '-q:a', '0', '-map', 'a', 'output.mp3');

            const data = await ffmpeg.FS('readFile', 'output.mp3');
            
            const blob = new Blob([data.buffer], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.mp3`;
            a.click();

            logMessage('mp4tomp3', `✅ Başarılı: ${fileName}.mp3 oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / files.length) * 100);
            progressFill.style.width = `${currentProgress}%`;
            progressText.textContent = `Tamamlandı: ${i + 1}/${files.length}`;
            
            URL.revokeObjectURL(url);
            
            // Temizlik
            await ffmpeg.FS('unlink', 'input.mp4');
            await ffmpeg.FS('unlink', 'output.mp3');
        }

        logMessage('mp4tomp3', 'Tüm dönüşümler tamamlandı!', 'success');
        progress.style.display = 'none';
    } catch (error) {
        console.error('Conversion error:', error);
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
        logMessage('mp3tomp4', 'Lütfen önce bir MP3 dosyası seçin', 'error');
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
            
            logMessage('mp3tomp4', `İşleniyor: ${audioFile.name}`, 'info');
            
            const audioData = await fetchFile(audioFile);
            await ffmpeg.FS('writeFile', 'audio.mp3', audioData);

            let ffmpegCommand;
            
            if (imageFile) {
                const imageData = await fetchFile(imageFile);
                const imageExt = imageFile.name.split('.').pop();
                await ffmpeg.FS('writeFile', `image.${imageExt}`, imageData);
                
                ffmpegCommand = [
                    '-loop', '1', 
                    '-i', `image.${imageExt}`,
                    '-i', 'audio.mp3',
                    '-c:v', 'libx264',
                    '-tune', 'stillimage',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-pix_fmt', 'yuv420p',
                    '-shortest',
                    'output.mp4'
                ];
            } else {
                ffmpegCommand = [
                    '-f', 'lavfi',
                    '-i', 'color=black:size=1280x720:rate=30',
                    '-i', 'audio.mp3',
                    '-c:v', 'libx264',
                    '-tune', 'stillimage',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-pix_fmt', 'yuv420p',
                    '-shortest',
                    'output.mp4'
                ];
            }

            await ffmpeg.run(...ffmpegCommand);

            const data = await ffmpeg.FS('readFile', 'output.mp4');
            
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.mp4`;
            a.click();

            logMessage('mp3tomp4', `✅ Başarılı: ${fileName}.mp4 oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / audioFiles.length) * 100);
            progressFill.style.width = `${currentProgress}%`;
            progressText.textContent = `Tamamlandı: ${i + 1}/${audioFiles.length}`;
            
            URL.revokeObjectURL(url);
            
            // Temizlik
            await ffmpeg.FS('unlink', 'audio.mp3');
            if (imageFile) {
                await ffmpeg.FS('unlink', `image.${imageExt}`);
            }
            await ffmpeg.FS('unlink', 'output.mp4');
        }

        logMessage('mp3tomp4', 'Tüm dönüşümler tamamlandı!', 'success');
        progress.style.display = 'none';
    } catch (error) {
        console.error('Conversion error:', error);
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
            
            logMessage('movtomp4', `İşleniyor: ${file.name}`, 'info');
            
            const fileData = await fetchFile(file);
            await ffmpeg.FS('writeFile', 'input.mov', fileData);

            await ffmpeg.run(
                '-i', 'input.mov',
                '-c:v', 'libx264',
                '-crf', '23',
                '-preset', 'medium',
                '-c:a', 'aac',
                '-b:a', '128k',
                'output.mp4'
            );

            const data = await ffmpeg.FS('readFile', 'output.mp4');
            
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.mp4`;
            a.click();

            logMessage('movtomp4', `✅ Başarılı: ${fileName}.mp4 oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / files.length) * 100);
            progressFill.style.width = `${currentProgress}%`;
            progressText.textContent = `Tamamlandı: ${i + 1}/${files.length}`;
            
            URL.revokeObjectURL(url);
            
            // Temizlik
            await ffmpeg.FS('unlink', 'input.mov');
            await ffmpeg.FS('unlink', 'output.mp4');
        }

        logMessage('movtomp4', 'Tüm dönüşümler tamamlandı!', 'success');
        progress.style.display = 'none';
    } catch (error) {
        console.error('Conversion error:', error);
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
            
            logMessage('invertmp4', `İşleniyor: ${file.name}`, 'info');
            
            const fileData = await fetchFile(file);
            await ffmpeg.FS('writeFile', `input.${extension}`, fileData);

            await ffmpeg.run(
                '-i', `input.${extension}`,
                '-vf', 'reverse',
                '-af', 'areverse',
                `output.${extension}`
            );

            const data = await ffmpeg.FS('readFile', `output.${extension}`);
            
            const blob = new Blob([data.buffer], { type: `video/${extension}` });
            const url = URL.createObjectURL(blob);
            
            const reversedName = fileName.split('').reverse().join('');
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reversedName}.${extension}`;
            a.click();

            logMessage('invertmp4', `✅ Başarılı: ${reversedName}.${extension} oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / files.length) * 100);
            progressFill.style.width = `${currentProgress}%`;
            progressText.textContent = `Tamamlandı: ${i + 1}/${files.length}`;
            
            URL.revokeObjectURL(url);
            
            // Temizlik
            await ffmpeg.FS('unlink', `input.${extension}`);
            await ffmpeg.FS('unlink', `output.${extension}`);
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

            const data = await ffmpeg.FS('readFile', `output.${extension}`);
            
            const blob = new Blob([data.buffer], { type: `video/${extension}` });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}_mirrored.${extension}`;
            a.click();

            logMessage('flipmp4', `✅ Başarılı: ${fileName}_mirrored.${extension} oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / files.length) * 100);
            progressFill.style.width = `${currentProgress}%`;
            progressText.textContent = `Tamamlandı: ${i + 1}/${files.length}`;
            
            URL.revokeObjectURL(url);
            
            // Temizlik
            await ffmpeg.FS('unlink', `input.${extension}`);
            await ffmpeg.FS('unlink', `output.${extension}`);
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

            const data = await ffmpeg.FS('readFile', 'output.mp4');
            
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.mp4`;
            a.click();

            logMessage('mp3tomp4j', `✅ Başarılı: ${fileName}.mp4 oluşturuldu`, 'success');
            
            const currentProgress = Math.round(((i + 1) / audioFiles.length) * 100);
            progressFill.style.width = `${currentProgress}%`;
            progressText.textContent = `Tamamlandı: ${i + 1}/${audioFiles.length}`;
            
            URL.revokeObjectURL(url);
            
            // Temizlik
            await ffmpeg.FS('unlink', 'audio.mp3');
            await ffmpeg.FS('unlink', `image.${imageExt}`);
            await ffmpeg.FS('unlink', 'output.mp4');
        }

        logMessage('mp3tomp4j', 'Tüm dönüşümler tamamlandı!', 'success');
        progress.style.display = 'none';
    } catch (error) {
        console.error('Conversion error:', error);
        logMessage('mp3tomp4j', 'Dönüştürme hatası: ' + error.message, 'error');
        progress.style.display = 'none';
    }
}

// Güncellenmiş başlatma fonksiyonu
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM yüklendi, bileşenler ayarlanıyor...');
    
    if (ffmpegInitializationStarted) {
        console.log('FFmpeg zaten yüklenmeye başladı, tekrar başlatılmıyor.');
        return;
    }
    
    ffmpegInitializationStarted = true;
    
    setupTabs();
    setupFileInputs();
    
    // FFmpeg script'i yüklendikten sonra başlat
    if (typeof FFmpeg !== 'undefined') {
        console.log('FFmpeg mevcut, hemen başlatılıyor...');
        initFFmpeg();
    } else {
        console.log('FFmpeg henüz yüklenmedi, bekleniyor...');
		if (!ffmpegInitializationStarted) {
			ffmpegInitializationStarted = true;
			initFFmpeg(); // Direkt çağır
		}
    }
});