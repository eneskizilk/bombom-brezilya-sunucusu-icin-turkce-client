const baseDir = window.api.getBaseDir();

function getImgUrl(filename) {
    const safeBase = baseDir.replace(/\\/g, '/');
    return `file:///${safeBase}/${filename === 'icon.png' ? '' : 'cmn/'}${filename}`;
}

// RESİMLERİ ENJEKTE ET (Eğer element yoksa hata vermez)
const splashLogo = document.getElementById('splash-logo');
if(splashLogo) splashLogo.src = getImgUrl('logo.png');

document.documentElement.style.setProperty('--bg-wnd', `url('${getImgUrl('oyun_bk_wnd.png')}')`);
document.documentElement.style.setProperty('--bg-min', `url('${getImgUrl('oyun_min.png')}')`);
document.documentElement.style.setProperty('--bg-max', `url('${getImgUrl('game_restore.png')}')`);
document.documentElement.style.setProperty('--bg-close', `url('${getImgUrl('oyun_kapat.png')}')`);

const iconLeft = document.getElementById('icon-left');
if(iconLeft) iconLeft.style.backgroundImage = `url('${getImgUrl('icon.png')}')`;

const qMark = document.getElementById('q-mark');
if(qMark) qMark.src = getImgUrl('pic-question.png');

// PENCERE KONTROLLERİ
document.getElementById('btn-min')?.addEventListener('click', () => window.api.winMin());
document.getElementById('btn-max')?.addEventListener('click', () => window.api.winMax());
document.getElementById('btn-close')?.addEventListener('click', () => window.api.winClose());
document.getElementById('btn-temizle')?.addEventListener('click', () => {
    if(confirm("Çerezler temizlenip oyun kapatılacak?")) window.api.clearAndQuit();
});

// GERÇEK ZOOM 
let currentZoom = 1.0;
document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    currentZoom += 0.1;
    window.api.setZoom(currentZoom);
});
document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    currentZoom = Math.max(0.3, currentZoom - 0.1);
    window.api.setZoom(currentZoom);
});

// SES KONTROL (MUTE)
let isMuted = false;
document.getElementById('btn-mute')?.addEventListener('click', (e) => {
    isMuted = !isMuted;
    e.target.innerText = isMuted ? '🔇' : '🔊';
    window.api.toggleMute(isMuted);
});

// EKRAN GÖRÜNTÜSÜ AL
document.getElementById('btn-ss')?.addEventListener('click', () => {
    window.api.takeScreenshot();
});

// YÜKLEME EKRANINI UÇURAN TETİKLEYİCİ
window.api.onHideSplash(() => {
    const splashScreen = document.getElementById('splash-screen');
    if(splashScreen) {
        splashScreen.classList.add('loaded');
        setTimeout(() => {
            splashScreen.remove();
        }, 1000);
    }
});