const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const path = require('path');

async function getAuth(sessionName) {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, sessionName));
    return { state, saveCreds };
}

module.exports = { getAuth };