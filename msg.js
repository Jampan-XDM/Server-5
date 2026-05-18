const { proto, downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');

/**
 * Download media bila kuandika faili kwenye disk (Memory friendly)
 */
const downloadMedia = async (m) => {
    let type = Object.keys(m)[0];
    let msg = m[type];
    if (type === 'viewOnceMessageV2') {
        msg = m.viewOnceMessageV2.message;
        type = Object.keys(msg)[0];
    }
    const stream = await downloadContentFromMessage(msg, type.replace('Message', ''));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
};

const sms = (conn, m) => {
    if (!m) return m;
    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = m.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net') : (m.isGroup ? m.key.participant : m.key.remoteJid);
    }

    if (m.message) {
        m.type = getContentType(m.message);
        m.msg = (m.type === 'viewOnceMessageV2') ? m.message[m.type].message[getContentType(m.message[m.type].message)] : m.message[m.type];

        // Rahisisha Body ya text
        m.body = m.message.conversation || 
                 m.message.extendedTextMessage?.text || 
                 m.message.imageMessage?.caption || 
                 m.message.videoMessage?.caption || "";

        // Quoted message logic
        m.quoted = m.msg?.contextInfo?.quotedMessage ? m.msg.contextInfo.quotedMessage : null;
        if (m.quoted) {
            m.quoted.type = getContentType(m.quoted);
            m.quoted.msg = m.quoted[m.quoted.type];
            m.quoted.sender = m.msg.contextInfo.participant;
            m.quoted.id = m.msg.contextInfo.stanzaId;
        }
    }

    // --- Shortcuts za JAMPAN XMD ---

    // Kujibu kwa Text
    m.reply = async (text) => {
        return conn.sendMessage(m.chat, { text: text }, { quoted: m });
    };

    // Kuweka Reaction
    m.react = async (emoji) => {
        return conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
    };

    // Ku-download picha/video aliyotuma mtu
    m.download = async () => {
        return await downloadMedia(m.message);
    };

    return m;
};

module.exports = { sms };