const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    DisconnectReason,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");
const fs = require("fs-extra");

const app = express();
const PORT = process.env.PORT || 3000;

// GLOBAL SESSIONS MEMORY
const activeSessions = {}; // Inashikilia soketi za bots zote zinazorun ({ 'main_session': sock, '25567...': sock })
let activeUsers = new Set(); 
const MAX_USERS = 100; 

let settings = {
    autoStatusView: true,
    autoTyping: true,
    mode: 'public',
    ownerNumber: '255674229015'
};

// Hakikisha folda kuu la sessions lipo
fs.ensureDirSync('./sessions');

app.use(express.static(path.join(__dirname, '.')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API ya Pairing (Sasa hivi haifuti Bot Kuu!)
app.get('/pair', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.status(400).send({ error: "Namba inahitajika!" });
    number = number.replace(/[^0-9]/g, '');

    console.log(`📲 Inatengeneza kodi ya kifaa kipya kwa namba: ${number}`);

    // Kama namba hii tayari ipo online au inatengenezewa kodi, ifunge kwanza hiyo sub-session pekee
    if (activeSessions[number]) {
        try { activeSessions[number].end(); } catch (e) {}
        delete activeSessions[number];
    }

    try {
        // Tunatengeneza session folder maalum kwa ajili ya namba hii pekee
        const sessionFolder = `./sessions/${number}`;
        
        // Kama alikuwa amewahi kujaribu lakini hakumaliza, futa folda lake la zamani aanze upya
        if (fs.existsSync(sessionFolder) && !fs.existsSync(`${sessionFolder}/creds.json`)) {
            await fs.remove(sessionFolder);
        }

        // Washa bot kwa ajili ya namba hii na subiri kupokea pairing code
        const code = await startJampanBot(sessionFolder, number);
        res.status(200).send({ code: code });
    } catch (err) {
        console.log("Pairing Error kwa namba " + number + ":", err);
        res.status(500).send({ error: "Server Busy au Error imetokea. Jaribu tena." });
    }
});

// Msikilizaji wa Port na Kufufua Bots zilizopo
app.listen(PORT, async () => {
    console.log(`📡 JAMPAN-XMD Engine Live on Port ${PORT}`);
    
    // 1. Washa Bot Kuu kiotomatiki kama ipo
    if (fs.existsSync('./sessions/main_session/creds.json')) {
        console.log("♻️ Inawasha Bot Kuu (Main Session)...");
        startJampanBot('./sessions/main_session').catch(err => console.log("Main Bot Error:", err));
    } else {
        console.log("⚠️ Main Session haijapatikana bado. Subiri iunganishwe.");
    }

    // 2. Fufua Bots zote za wateja zilizopo kwenye folda la sessions (Auto-Resurrect)
    try {
        const files = await fs.readdir('./sessions');
        for (const file of files) {
            if (file !== 'main_session' && fs.statSync(path.join('./sessions', file)).isDirectory()) {
                if (fs.existsSync(`./sessions/${file}/creds.json`)) {
                    console.log(`♻️ [REBOOT] Inafufua sub-bot ya mtumiaji: ${file}`);
                    startJampanBot(`./sessions/${file}`).catch(e => console.log(`Error kuamsha ${file}:`, e));
                }
            }
        }
    } catch (e) {
        console.log("Error wakati wa kufufua sub-bots:", e);
    }
});

/**
 * CORE ENGINE YA MBELENI (Inakubali Folda Tofauti na Namba)
 */
async function startJampanBot(sessionPath, pairNumber = null) {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const sessionKey = path.basename(sessionPath); // Itakuwa 'main_session' au namba ya simu '255...'

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        keepAliveIntervalMs: 30000,
        defaultQueryTimeoutMs: undefined
    });

    // Hifadhi hii socket kwenye global dictionary yetu ili tuweze kuitofautisha
    activeSessions[sessionKey] = sock;

    sock.ev.on('creds.update', saveCreds);

    return new Promise(async (resolve, reject) => {
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                console.log(`✅ JAMPAN-XMD ONLINE! Session: [${sessionKey}]`);

                try {
                    const myJid = jidNormalizedUser(sock.user.id);

                    // Tuma ujumbe wa kwanza kwenye namba husika iliyofunguliwa
                    await sock.sendMessage(myJid, { text: `✅ *JAMPAN-XMD CONNECTED SUCCESSFULLY*\n\nSession: *${sessionKey}* ipo tayari. Andika .menu` });

                    await delay(3000); 

                    // Tuma ujumbe wa YouTube Channel Promo
                    await sock.sendMessage(myJid, {
                        text: "🚀 *HELLO USER, PLEASE SUBSCRIBE*\n\nhi welcome to JAMPAN-XMD please subscribe my youtube:\n\n🔗 https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt\n\n*Support JAMPAN-XMD Development!*",
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363409292513352@newsletter',
                                newsletterName: 'JAMPAN-XMD UPDATES',
                                serverMessageId: 143
                            }
                        }
                    }, { quoted: { key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' }, message: { conversation: "JAMPAN-XMD IS ONLINE 🚀" } } });

                    // Auto Join Group (Link ikiwa imekufa isivunje kodi)
                    try { 
                        await sock.groupAcceptInvite("KJH675jhgH76ghj"); 
                    } catch (e) {
                        console.log(`[${sessionKey}] Group Join: Link expired.`);
                    }
                } catch (err) {
                    console.log(`⚠️ Ujumbe wa kuanza haukutumwa kwenye [${sessionKey}]: Connection haijatulia.`);
                }
            }

            if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                
                if (reason !== DisconnectReason.loggedOut) {
                    console.log(`♻️ [${sessionKey}] Imekata, Inajaribu kureconnect...`);
                    setTimeout(() => startJampanBot(sessionPath), 5000);
                } else {
                    console.log(`❌ [${sessionKey}] Imefukuzwa (Logged Out). Tunafuta folda la session.`);
                    try {
                        await fs.remove(sessionPath);
                        delete activeSessions[sessionKey];
                    } catch (e) { console.log("Error kufuta folda:", e); }
                }
            }
        });

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const m = chatUpdate.messages[0];
                if (!m || !m.message) return;
                const from = m.key.remoteJid;

                const isGroup = from.endsWith('@g.us');
                const isStatus = from === 'status@broadcast';

                if (!isGroup && !isStatus && !m.key.fromMe) {
                    if (!activeUsers.has(from)) {
                        if (activeUsers.size >= MAX_USERS) return;
                        activeUsers.add(from);
                        console.log(`👥 New User on [${sessionKey}]: ${from}. Total: ${activeUsers.size}/${MAX_USERS}`);
                    }
                }

                if (isStatus && settings.autoStatusView) await sock.readMessages([m.key]);
                if (settings.autoTyping && !m.key.fromMe) await sock.sendPresenceUpdate('composing', from);

                // --- PASSING BOTH SOCK AND SETTINGS TO COMMANDS ---
                try {
                    const { handleCommands } = require('./commands'); 
                    // Muhimu: tunapitisha 'sock' ya kifaa HUSIKA kilichopokea ujumbe
                    await handleCommands(sock, m, settings);
                } catch (cmdError) {
                    console.log(`❌ Error kwenye commands.js ([${sessionKey}]):`, cmdError.message);
                }

            } catch (e) { 
                console.log("Error ya jumla kwenye Upsert:", e); 
            }
        });

        // Pairing Code Generation bila Blockage
        if (pairNumber && !sock.authState.creds.registered) {
            await delay(5000); // Imepunguzwa hadi sekunde 5 ili index.html isisubiri sana
            try {
                const code = await sock.requestPairingCode(pairNumber);
                resolve(code);
            } catch (err) {
                reject(err);
            }
        }
    });
}
