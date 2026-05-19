
const { proto, delay, getContentType } = require('@whiskeysockets/baileys')
const fs = require('fs')

// Function ya kurahisisha meseji
exports.smsg = (conn, m, store) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = conn.decodeJid(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '')
    }
    // ... functions zingine zinafuata hapa
    return m
}

exports.getGroupAdmins = (participants) => {
    let admins = []
    for (let i of participants) {
        i.admin === "admin" || i.admin === "superadmin" ? admins.push(i.id) : ''
    }
    return admins
}
