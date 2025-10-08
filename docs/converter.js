var FFmpegUtil = (() => {
  "use strict";
  var e = {
      591: (e, t) => {
        Object.defineProperty(t, "__esModule", {
          value: !0
        }), t.HeaderContentLength = void 0, t.HeaderContentLength = "Content-Length"
      },
      431: (e, t) => {
        Object.defineProperty(t, "__esModule", {
          value: !0
        }), t.ERROR_INCOMPLETED_DOWNLOAD = t.ERROR_RESPONSE_BODY_READER = void 0, t.ERROR_RESPONSE_BODY_READER = new Error("failed to get response body reader"), t.ERROR_INCOMPLETED_DOWNLOAD = new Error("failed to complete download")
      },
      915: function(e, t, o) {
        var r = this && this.__awaiter || function(e, t, o, r) {
          return new(o || (o = Promise))((function(n, i) {
            function d(e) {
              try {
                l(r.next(e))
              } catch (e) {
                i(e)
              }
            }

            function a(e) {
              try {
                l(r.throw(e))
              } catch (e) {
                i(e)
              }
            }

            function l(e) {
              var t;
              e.done ? n(e.value) : (t = e.value, t instanceof o ? t : new o((function(e) {
                e(t)
              }))).then(d, a)
            }
            l((r = r.apply(e, t || [])).next())
          }))
        };
        Object.defineProperty(t, "__esModule", {
          value: !0
        }), t.toBlobURL = t.downloadWithProgress = t.importScript = t.fetchFile = void 0;
        const n = o(431),
          i = o(591);
        t.fetchFile = e => r(void 0, void 0, void 0, (function*() {
          let t;
          if ("string" == typeof e) t = /data:_data\/([a-zA-Z]*);base64,([^"]*)/.test(e) ? atob(e.split(",")[1]).split("").map((e => e.charCodeAt(0))) : yield(yield fetch(e)).arrayBuffer();
          else if (e instanceof URL) t = yield(yield fetch(e)).arrayBuffer();
          else {
            if (!(e instanceof File || e instanceof Blob)) return new Uint8Array;
            t = yield(o = e, new Promise(((e, t) => {
              const r = new FileReader;
              r.onload = () => {
                const {
                  result: t
                } = r;
                t instanceof ArrayBuffer ? e(new Uint8Array(t)) : e(new Uint8Array)
              }, r.onerror = e => {
                var o, r;
                t(Error(`File could not be read! Code=${(null === (r = (null === (o = (null == e ? void 0 : e.target) || void 0 === o ? void 0 : o.error) || void 0 === r ? void 0 : r.code)) || -1)}`))
              }, r.readAsArrayBuffer(o)
            })))
          }
          var o;
          return new Uint8Array(t)
        })), t.importScript = e => r(void 0, void 0, void 0, (function*() {
          return new Promise((t => {
            const o = document.createElement("script"),
              r = () => {
                o.removeEventListener("load", r),
                  t()
              };
            o.src = e, o.type = "text/javascript", o.addEventListener("load", r), document.getElementsByTagName("head")[0].appendChild(o)
          }))
        })), t.downloadWithProgress = (e, t) => r(void 0, void 0, void 0, (function*() {
          var o;
          const r = yield fetch(e);
          let d;
          try {
            const a = parseInt(r.headers.get(i.HeaderContentLength) || "-1"),
              l = null === (o = r.body) || void 0 === o ? void 0 : o.getReader();
            if (!l) throw n.ERROR_RESPONSE_BODY_READER;
            const c = [];
            let s = 0;
            for (;;) {
              const {
                done: o,
                value: r
              } = yield l.read(),
                i = r ? r.length : 0;
              if (o) {
                if (-1 != a && a !== s) throw n.ERROR_INCOMPLETED_DOWNLOAD;
                t && t({
                  url: e,
                  total: a,
                  received: s,
                  delta: i,
                  done: o
                });
                break
              }
              c.push(r), s += i, t && t({
                url: e,
                total: a,
                received: s,
                delta: i,
                done: o
              })
            }
            const f = new Uint8Array(s);
            let u = 0;
            for (const e of c) f.set(e, u), u += e.length;
            d = f.buffer
          } catch (o) {
            console.log("failed to send download progress event: ", o), d = yield r.arrayBuffer(), t && t({
              url: e,
              total: d.byteLength,
              received: d.byteLength,
              delta: 0,
              done: !0
            })
          }
          return d
        })), t.toBlobURL = (e, o, n = !1, i) => r(void 0, void 0, void 0, (function*() {
          const r = n ? yield(0, t.downloadWithProgress)(e, i) : yield(yield fetch(e)).arrayBuffer(),
            d = new Blob([r], {
              type: o
            });
          return URL.createObjectURL(d)
        }))
      }
    },
    t = {};

  function o(r) {
    var n = t[r];
    if (void 0 !== n) return n.exports;
    var i = t[r] = {
      exports: {}
    };
    return e[r].call(i.exports, i, i.exports, o), i.exports
  }
  return o(915)
})();

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
    let progressFill, progressText, progressContainer;

    if (section) {
        progressContainer = document.getElementById(`${section}Progress`);
        progressFill = document.getElementById(`${section}ProgressFill`);
        progressText = document.getElementById(`${section}ProgressText`);
    } else {
        progressContainer = document.getElementById('ffmpeg-progress-container');
        progressFill = document.getElementById('ffmpeg-progress-fill');
        progressText = document.getElementById('ffmpeg-progress-text');
    }
    
    if (progressContainer) {
        progressContainer.style.display = 'block';
    }

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText && message) {
        progressText.textContent = message;
    }

    if (percentage >= 100 && section) {
        setTimeout(() => {
            if (progressContainer) progressContainer.style.display = 'none';
        }, 3000);
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

        ffmpeg = new FFmpegLib.FFmpeg();
        
        ffmpeg.on('log', ({ message }) => {
            console.log('FFmpeg log:', message);
        });

        ffmpeg.on('progress', ({ progress, time }) => {
            const percentage = Math.round(progress * 100);
            updateProgressBar(percentage, `İşleniyor... ${percentage}%`);
        });

        console.log('FFmpeg instance oluşturuldu');

        updateProgressBar(30, 'Core bileşenleri yükleniyor...');

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
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
        list.innerHTML = '';
        Array.from(input.files).forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name;
            list.appendChild(li);
        });
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
        status.classList.remove('hidden');
    }
}

function logMessage(section, message, type = 'info') {
    console.log(`${section.toUpperCase()}: ${message} (${type})`);
    const progressText = document.getElementById(`${section}ProgressText`);
    if (progressText) {
        progressText.textContent = message;
    }
}

async function convertMP4ToMP3() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('mp4tomp3', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const input = document.getElementById('mp4tomp3Input');
    if (!input.files.length) {
        logMessage('mp4tomp3', 'Lütfen önce bir dosya seçin', 'error');
        return;
    }

    const files = Array.from(input.files);
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            const extension = file.name.split('.').pop();
            
            updateProgressBar(0, `İşleniyor: ${file.name}`, 'mp4tomp3');
            
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

            updateProgressBar(100, `✅ Başarılı: ${fileName}.mp3 oluşturuldu`, 'mp4tomp3');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', `input.${extension}`);
            ffmpeg.FS('unlink', 'output.mp3');
        }

        showGlobalStatus('Tüm dönüşümler tamamlandı!', 'success');
    } catch (error) {
        console.error('MP4 to MP3 error:', error);
        logMessage('mp4tomp3', 'Dönüştürme hatası: ' + error.message, 'error');
    }
}

async function convertMP3ToMP4() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('mp3tomp4', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const audioInput = document.getElementById('mp3tomp4AudioInput');
    const imageInput = document.getElementById('mp3tomp4ImageInput');

    if (!audioInput.files.length) {
        logMessage('mp3tomp4', 'Lütfen MP3 dosyası seçin', 'error');
        return;
    }

    const audioFiles = Array.from(audioInput.files);
    const imageFile = imageInput.files[0] || null;
    
    try {
        for (let i = 0; i < audioFiles.length; i++) {
            const audioFile = audioFiles[i];
            const fileName = audioFile.name.replace('.mp3', '');
            
            updateProgressBar(0, `İşleniyor: ${audioFile.name}`, 'mp3tomp4');
            
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
                    '-i', 'audio.mp3',
                    '-c:a', 'aac',
                    '-b:a', '192k',
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

            updateProgressBar(100, `✅ Başarılı: ${fileName}.mp4 oluşturuldu`, 'mp3tomp4');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', 'audio.mp3');
            ffmpeg.FS('unlink', 'output.mp4');
        }

        showGlobalStatus('Tüm dönüşümler tamamlandı!', 'success');
    } catch (error) {
        console.error('MP3 to MP4 error:', error);
        logMessage('mp3tomp4', 'Dönüştürme hatası: ' + error.message, 'error');
    }
}

async function convertMOVToMP4() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('movtomp4', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const input = document.getElementById('movtomp4Input');
    if (!input.files.length) {
        logMessage('movtomp4', 'Lütfen önce bir dosya seçin', 'error');
        return;
    }

    const files = Array.from(input.files);
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            
            updateProgressBar(0, `İşleniyor: ${file.name}`, 'movtomp4');
            
            const fileData = await fetchFile(file);
            await ffmpeg.FS('writeFile', file.name, fileData);

            await ffmpeg.run(
                '-i', file.name,
                '-c:v', 'libx264',
                '-c:a', 'aac',
                'output.mp4'
            );

            const data = ffmpeg.FS('readFile', 'output.mp4');
            
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${fileName}.mp4`;
            a.click();

            updateProgressBar(100, `✅ Başarılı: ${fileName}.mp4 oluşturuldu`, 'movtomp4');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', file.name);
            ffmpeg.FS('unlink', 'output.mp4');
        }

        showGlobalStatus('Tüm dönüşümler tamamlandı!', 'success');
    } catch (error) {
        console.error('MOV to MP4 error:', error);
        logMessage('movtomp4', 'Dönüştürme hatası: ' + error.message, 'error');
    }
}

async function invertVideo() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('invertmp4', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const input = document.getElementById('invertmp4Input');
    if (!input.files.length) {
        logMessage('invertmp4', 'Lütfen önce bir dosya seçin', 'error');
        return;
    }

    const files = Array.from(input.files);
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            const extension = file.name.split('.').pop();
            const reversedName = fileName.split('').reverse().join('');
            
            updateProgressBar(0, `İşleniyor: ${file.name}`, 'invertmp4');
            
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

            updateProgressBar(100, `✅ Başarılı: ${reversedName}.${extension} oluşturuldu`, 'invertmp4');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', `input.${extension}`);
            ffmpeg.FS('unlink', `output.${extension}`);
        }

        showGlobalStatus('Tüm dönüşümler tamamlandı!', 'success');
    } catch (error) {
        console.error('Reverse error:', error);
        logMessage('invertmp4', 'İşlem hatası: ' + error.message, 'error');
    }
}

async function flipVideo() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('flipmp4', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const input = document.getElementById('flipmp4Input');
    if (!input.files.length) {
        logMessage('flipmp4', 'Lütfen önce bir dosya seçin', 'error');
        return;
    }

    const files = Array.from(input.files);
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            const extension = file.name.split('.').pop();
            
            updateProgressBar(0, `İşleniyor: ${file.name}`, 'flipmp4');
            
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

            updateProgressBar(100, `✅ Başarılı: ${fileName}_mirrored.${extension} oluşturuldu`, 'flipmp4');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', `input.${extension}`);
            ffmpeg.FS('unlink', `output.${extension}`);
        }

        showGlobalStatus('Tüm dönüşümler tamamlandı!', 'success');
    } catch (error) {
        console.error('Mirror error:', error);
        logMessage('flipmp4', 'İşlem hatası: ' + error.message, 'error');
    }
}

async function convertMP3ToMP4WithImage() {
    if (!isFFmpegLoaded || !ffmpeg) {
        logMessage('mp3tomp4j', 'FFmpeg henüz hazır değil', 'error');
        return;
    }

    const audioInput = document.getElementById('mp3tomp4jAudioInput');
    const imageInput = document.getElementById('mp3tomp4jImageInput');

    if (!audioInput.files.length || !imageInput.files.length) {
        logMessage('mp3tomp4j', 'Lütfen hem MP3 hem de resim dosyası seçin', 'error');
        return;
    }

    const audioFiles = Array.from(audioInput.files);
    const imageFile = imageInput.files[0];
    
    try {
        for (let i = 0; i < audioFiles.length; i++) {
            const audioFile = audioFiles[i];
            const fileName = audioFile.name.replace('.mp3', '');
            
            updateProgressBar(0, `İşleniyor: ${audioFile.name}`, 'mp3tomp4j');
            
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

            updateProgressBar(100, `✅ Başarılı: ${fileName}.mp4 oluşturuldu`, 'mp3tomp4j');
            
            URL.revokeObjectURL(url);
            
            ffmpeg.FS('unlink', 'audio.mp3');
            ffmpeg.FS('unlink', `image.${imageExt}`);
            ffmpeg.FS('unlink', 'output.mp4');
        }

        showGlobalStatus('Tüm dönüşümler tamamlandı!', 'success');
    } catch (error) {
        console.error('Conversion error:', error);
        logMessage('mp3tomp4j', 'Dönüştürme hatası: ' + error.message, 'error');
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-link');
    const sections = document.querySelectorAll('section');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = tab.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function setupFileInputs() {
    const setupDragAndDrop = (inputId, dragAreaId, fileListId) => {
        const input = document.getElementById(inputId);
        const dragArea = document.getElementById(dragAreaId);

        if (!input || !dragArea || !fileListId) {
            console.error(`Drag and drop setup error: Missing elements for ${inputId}`);
            return;
        }

        const fileList = document.getElementById(fileListId);
        if (!fileList) {
            console.error(`Drag and drop setup error: File list element ${fileListId} not found`);
            return;
        }

        const handleFiles = (files) => {
            input.files = files;
            displayFiles(inputId, fileListId);
        };

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dragArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (['dragenter', 'dragover'].includes(eventName)) {
                    dragArea.classList.add('highlight');
                } else {
                    dragArea.classList.remove('highlight');
                }
            }, false);
        });

        dragArea.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files), false);
        dragArea.addEventListener('click', () => input.click());
        input.addEventListener('change', () => handleFiles(input.files));
    };

    setupDragAndDrop('mp4tomp3Input', 'mp4tomp3DragArea', 'mp4tomp3FileList');
    setupDragAndDrop('mp3tomp4AudioInput', 'mp3tomp4AudioDragArea', 'mp3tomp4AudioFileList');
    setupDragAndDrop('mp3tomp4ImageInput', 'mp3tomp4ImageDragArea', 'mp3tomp4ImageFileList');
    setupDragAndDrop('movtomp4Input', 'movtomp4DragArea', 'movtomp4FileList');
    setupDragAndDrop('invertmp4Input', 'invertmp4DragArea', 'invertmp4FileList');
    setupDragAndDrop('flipmp4Input', 'flipmp4DragArea', 'flipmp4FileList');
    setupDragAndDrop('mp3tomp4jAudioInput', 'mp3tomp4jAudioDragArea', 'mp3tomp4jAudioFileList');
    setupDragAndDrop('mp3tomp4jImageInput', 'mp3tomp4jImageDragArea', 'mp3tomp4jImageFileList');
}

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupFileInputs();
    disableAllButtons();
    initFFmpeg();
});