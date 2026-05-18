const express = require('express');
const router = express.Router();
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    jidNormalizedUser 
} = require('@whiskeysockets/baileys');

// Path za kuhifadhia data
const SESSION_BASE_PATH = './sessions';
const NUMBER_LIST_PATH = './database/numbers.json';

// Kuhakikisha folder zipo
if (!fs.existsSync(SESSION_BASE_PATH)) fs.mkdirSync(SESSION_BASE_PATH);
if (!fs.existsSync('./database')) fs.mkdirSync('./database');

const activeSockets = new Map();

/**
 * JAMPAN-XMD Connection Engine
 */
async function JampanPair(number, res) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionDir = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const socket = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
        },
        printQRInTerminal: false,
        logger: pino({ level: 'fatal' }),
        browser: ["JAMPAN-XMD", "Chrome", "3.0.0"]
    });

    // Kama bot haijaunganishwa, tengeneza Pairing Code
    if (!socket.authState.creds.registered) {
        await delay(1500);
        try {
            const code = await socket.requestPairingCode(sanitizedNumber);
            if (!res.headersSent) {
                res.status(200).send({ 
                    status: 'success', 
                    pair_code: code,
                    message: "Enter this code on your linked devices" 
                });
            }
        } catch (err) {
            console.error("Pairing Error:", err);
            if (!res.headersSent) res.status(500).send({ error: "Failed to get pairing code" });
            return;
        }
    }

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            activeSockets.set(sanitizedNumber, socket);
            console.log(`✅ JAMPAN-XMD Connected: ${sanitizedNumber}`);

            // Hifadhi namba kwenye database yetu ya JSON
            saveNumber(sanitizedNumber);

            // Tuma ujumbe wa pongezi kwa mtumiaji
            await socket.sendMessage(jidNormalizedUser(socket.user.id), { 
                text: `🚀 *JAMPAN-XMD CONNECTED SUCCESSFULLY!*\n\nWelcome to the future of automation.\n\n*Developer:* Kelvin Jampan\n*Status:* Active` 
            });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            if (shouldReconnect) {
                JampanPair(sanitizedNumber, { headersSent: true, send: () => {}, status: () => {} });
            } else {
                activeSockets.delete(sanitizedNumber);
                fs.removeSync(sessionDir);
            }
        }
    });

    return socket;
}

// Msaidizi wa kuhifadhi namba
function saveNumber(num) {
    let numbers = [];
    if (fs.existsSync(NUMBER_LIST_PATH)) {
        numbers = JSON.parse(fs.readFileSync(NUMBER_LIST_PATH, 'utf8'));
    }
    if (!numbers.includes(num)) {
        numbers.push(num);
        fs.writeFileSync(NUMBER_LIST_PATH, JSON.stringify(numbers, null, 2));
    }
}

// --- API ENDPOINTS ---

// 1. Connect New Bot (Pairing)
router.get('/connect', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).send({ error: 'Number is required! (?number=255...)' });

    if (activeSockets.has(number)) {
        return res.status(200).send({ status: 'already_connected', message: 'Bot is already running' });
    }

    await JampanPair(number, res);
});

// 2. Angalia Bot ngapi zipo Online
router.get('/active', (req, res) => {
    res.status(200).send({
        status: 'success',
        total_active: activeSockets.size,
        connected_numbers: Array.from(activeSockets.keys()),
        developer: "Kelvin Jampan"
    });
});

// 3. Ping (System Check)
router.get('/ping', (req, res) => {
    res.status(200).send({
        status: 'active',
        bot_name: 'JAMPAN-XMD',
        uptime: process.uptime()
    });
});

// 4. Logout / Futa Session
router.delete('/logout', async (req, res) => {
    const { number } = req.query;
    if (!number) return res.status(400).send({ error: 'Number is required' });

    const sessionDir = path.join(SESSION_BASE_PATH, `session_${number}`);
    if (activeSockets.has(number)) {
        const sock = activeSockets.get(number);
        sock.logout();
        activeSockets.delete(number);
    }

    if (fs.existsSync(sessionDir)) fs.removeSync(sessionDir);
    res.status(200).send({ status: 'deleted', message: `Session for ${number} removed.` });
});

module.exports = router;