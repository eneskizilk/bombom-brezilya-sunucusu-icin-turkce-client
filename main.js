const { app, BrowserWindow, BrowserView, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let windows = new Set(); 

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    process.exit(0);
} else {
    app.on('second-instance', (event, commandLine) => {
        const url = commandLine.find(arg => arg.includes('roadclient://'));
        if (url) oyunaGir(url); 
    });
}

const isPackaged = app.isPackaged;
const baseDir = isPackaged ? process.resourcesPath : __dirname;

const flashPath = path.join(baseDir, 'plugins', 'pepflashplayer32.dll');
app.commandLine.appendSwitch('ppapi-flash-path', flashPath);
app.commandLine.appendSwitch('ppapi-flash-version', '32.0.0.465');

app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-features', 'SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure,OutOfBlinkCors');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disk-cache-size', '104857600'); 

if (isPackaged) app.setAsDefaultProtocolClient('roadclient');
else app.setAsDefaultProtocolClient('roadclient', process.execPath, [path.resolve(__dirname)]);

// ====================================================================
// YEREL DOSYA SUNUCUSU (SWF, XML, PNG VE TRUVA ATI İÇİN ORTAK SUNUCU)
// ====================================================================
http.createServer((req, res) => {
    
    // --- TRUVA ATI: OTOMATİK ÇOKLU DOSYA YAKALAYICI (SWF İNDİRİCİ) ---
    if (req.method === 'POST' && req.url.includes('/save_swf')) {
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const fileName = parsedUrl.searchParams.get('file') || `temiz_${Date.now()}.swf`;

        let body = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', () => {
            const buffer = Buffer.concat(body);
            const klasorYolu = path.join(app.getPath('desktop'), 'Temiz_SWFler');
            if (!fs.existsSync(klasorYolu)) fs.mkdirSync(klasorYolu);
            
            const dosyaYolu = path.join(klasorYolu, fileName);
            fs.writeFileSync(dosyaYolu, buffer);
            console.log(`[+] BAŞARIYLA TEMİZLENDİ VE KAYDEDİLDİ: ${fileName}`);
        });
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
        res.end('ALDIM');
        return;
    }

    // --- CROSSDOMAIN İZNİ ---
    if (req.url.includes('crossdomain.xml')) {
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end('<?xml version="1.0"?><cross-domain-policy><allow-access-from domain="*" /></cross-domain-policy>');
        return;
    }

    // --- YEREL DOSYALARI (SWF/XML/PNG) OYUNA SUNMA ---
    const fileName = req.url.split('?')[0].substring(1); 
    const dosyaYolu = path.join(baseDir, decodeURIComponent(fileName));

    if (fs.existsSync(dosyaYolu)) {
        let cType = 'application/octet-stream';
        if (dosyaYolu.toLowerCase().endsWith('.swf')) cType = 'application/x-shockwave-flash';
        else if (dosyaYolu.toLowerCase().endsWith('.xml')) cType = 'text/xml';
        else if (dosyaYolu.toLowerCase().endsWith('.png')) cType = 'image/png';

        res.writeHead(200, {
            'Content-Type': cType,
            'Access-Control-Allow-Origin': '*'
        });
        res.end(fs.readFileSync(dosyaYolu));
    } else {
        res.writeHead(404);
        res.end();
    }
}).listen(45678);

ipcMain.on('get-base-dir', (event) => { event.returnValue = baseDir; });
ipcMain.on('win-min', (event) => { const w = BrowserWindow.fromWebContents(event.sender); if (w) w.minimize(); });
ipcMain.on('win-max', (event) => { const w = BrowserWindow.fromWebContents(event.sender); if (w?.isMaximized()) w.unmaximize(); else w?.maximize(); });
ipcMain.on('win-close', (event) => { const w = BrowserWindow.fromWebContents(event.sender); if (w) w.close(); });
ipcMain.on('toggle-mute', (event, isMuted) => { const win = BrowserWindow.fromWebContents(event.sender); if (win) { const view = win.getBrowserView(); if (view) view.webContents.setAudioMuted(isMuted); } });
ipcMain.on('set-zoom', (event, scale) => { const win = BrowserWindow.fromWebContents(event.sender); if (win) { const view = win.getBrowserView(); if (view) view.webContents.setZoomFactor(scale); } });
ipcMain.on('take-screenshot', async (event) => { const win = BrowserWindow.fromWebContents(event.sender); if (win) { const view = win.getBrowserView(); if (view) { const image = await view.webContents.capturePage(); const desktop = app.getPath('desktop'); const filename = `Bombom_Zafer_${Date.now()}.png`; fs.writeFileSync(path.join(desktop, filename), image.toPNG()); } } });
ipcMain.on('clear-and-quit', async () => { try { const ses = session.fromPartition('persist:oyunoturum'); await ses.clearStorageData(); await ses.clearCache(); app.quit(); process.exit(0); } catch (err) { app.quit(); process.exit(0); } });

function oyunaGir(gelenVeri) {
    if (!gelenVeri || !gelenVeri.includes('http')) return;
    let asilLink = gelenVeri.substring(gelenVeri.indexOf('http')).replace(/["']/g, '');
    asilLink = asilLink.replace(/^(http\/\/|http:\/)(?![\/])/, 'http://');
    if (asilLink.endsWith('/')) asilLink = asilLink.slice(0, -1);

    console.log("\n=======================================================");
    console.log("[SİSTEM] ÜÇ AŞAMALI MÜKEMMEL RADAR DEVREDE!");
    console.log("=======================================================\n");

    let win = new BrowserWindow({
        width: 1002, height: 748,
        frame: false, transparent: true,
        icon: path.join(baseDir, 'icon.png'),
        webPreferences: { 
            nodeIntegration: false, 
            contextIsolation: true, 
            preload: path.join(__dirname, 'preload.js') 
        }
    });
    
    windows.add(win); 
    win.loadFile('index.html');

    const partitionName = windows.size === 1 ? 'persist:oyunoturum' : `persist:oyunoturum_${Date.now()}`;

    const view = new BrowserView({
        webPreferences: { 
            plugins: true, 
            nodeIntegration: false, 
            contextIsolation: true,
            partition: partitionName,
            webSecurity: false // GÜVENLİK DUVARI KAPALI
        }
    });

    view.webContents.session.clearCache(); 

    // ÖZEL XML HEDEFLERİ
    const hedefler = [
        'TemplateAllList.xml', 'FightSpiritTemplateList.xml', 'ItemStrengthenData.xml',
        'levelReward.xml', 'QuestList.xml', 'ShopItemList.xml', 'LoadUserBox.xml',
        'LoadBoxTemp.xml', 'ShopGoodsShowList.xml', 'MapServerList.xml', 'TitleInfo.xml',
        'Petskillinfo.xml', 'PetTemplateInfo.xml', 'ShopBox.xml', 'NewTitleInfo.xml',
        'ClothPropertyTemplateInfo.xml', 'ConsortiaBufferTemp.xml', 'EngraveSetElementInfo.xml',
        'EngraveSetInfo.xml', 'GmActivityInfo.xml', 'LoadItemsCategory.xml', 'LoadMapsItems.xml',
        'LoadPetFormData.xml', 'LoadPVEItems.xml', 'MountSkillTemplate.xml', 'OneYuanBuyAllGoodsTemplate.xml',
        'Template.xml'
    ];

    // --- GÖRSEL RADAR (SWF, XML, PNG) ---
    view.webContents.session.webRequest.onBeforeRequest(
        { urls: ['*://*/*'] }, 
        (details, callback) => {
            if (details.url.includes('localhost:45678')) return callback({});

            try {
                const urlKucuk = details.url.toLowerCase();
                const temizUrl = details.url.split('?')[0]; 
                const dosyaAdi = temizUrl.substring(temizUrl.lastIndexOf('/') + 1);

                // --- KURAL 1: DİL DOSYASI ZORLAMASI ---
                if (urlKucuk.includes('language.txt') || urlKucuk.includes('language.png') || urlKucuk.includes('language.zip')) {
                    const dilDosyasi = path.join(baseDir, 'language_TURKCE.png');
                    if (fs.existsSync(dilDosyasi)) {
                        console.log(`[RADAR - DİL] Oyun dil dosyası istedi. Türkçe PNG yediriliyor!`);
                        return callback({ redirectURL: `http://localhost:45678/language_TURKCE.png` });
                    }
                }

                // --- KURAL 2: ÖZEL XML HEDEFLERİ (_TURKCE.xml SONEKİ İLE) ---
                for (let hedef of hedefler) {
                    if (urlKucuk.includes(hedef.toLowerCase())) {
                        const ext = path.extname(hedef);
                        const baseName = path.basename(hedef, ext);
                        const turkceDosyaAdi = `${baseName}_TURKCE${ext}`;
                        const dosyaYolu = path.join(baseDir, turkceDosyaAdi);

                        if (fs.existsSync(dosyaYolu)) {
                            console.log(`[RADAR - XML] Özel XML Yakalandı! -> ${turkceDosyaAdi}`);
                            return callback({ redirectURL: `http://localhost:45678/${turkceDosyaAdi}` });
                        }
                    }
                }

                // --- KURAL 3: GENEL SWF/PNG/XML YAKALAYICI ---
                if (dosyaAdi && dosyaAdi.toLowerCase() !== 'icon.png' && (dosyaAdi.toLowerCase().endsWith('.swf') || dosyaAdi.toLowerCase().endsWith('.xml') || dosyaAdi.toLowerCase().endsWith('.png'))) {
                    const genelDosyaYolu = path.join(baseDir, dosyaAdi);
                    
                    if (fs.existsSync(genelDosyaYolu)) {
                        console.log(`[RADAR - GENEL] Yerel Dosya Oyuna Enjekte Ediliyor -> ${dosyaAdi}`);
                        return callback({ redirectURL: `http://localhost:45678/${dosyaAdi}` });
                    }
                }

            } catch(e) {}

            callback({}); // Hiçbir şarta uymazsa orijinal isteği yap!
        }
    );

    view.webContents.on('new-window', (event) => {
        event.preventDefault(); 
    });

    view.webContents.loadURL(asilLink);
    // view.webContents.openDevTools({ mode: 'detach' }); // İstersen açabilirsin

    view.webContents.once('dom-ready', () => {
        win.webContents.send('hide-splash'); 
        
        setTimeout(() => {
            win.setBrowserView(view);
            const bounds = win.getBounds();
            view.setBounds({ x: 4, y: 32, width: bounds.width - 8, height: bounds.height - 36 });
            view.setAutoResize({ width: true, height: true });
        }, 800);
    });

    win.on('closed', () => {
        windows.delete(win);
        if (windows.size === 0) {
            app.quit();
            process.exit(0);
        }
    });
}

app.whenReady().then(() => {
    const url = process.argv.find(a => a.includes('roadclient://'));
    if (url) oyunaGir(url);
    else { app.quit(); process.exit(0); }
});

app.on('window-all-closed', () => {
    app.quit();
    process.exit(0);
});