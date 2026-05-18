const { proto, getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { smsg, getGroupAdmins, formatp, taggz } = require('./lib/myfunc');
const config = require('./config');

const prefix = config.PREFIX || '.';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ================================
// RUNTIME FORMATTER
// ================================
const runtime = (seconds) => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return (
        (d > 0 ? d + 'd ' : '') +
        (h > 0 ? h + 'h ' : '') +
        (m > 0 ? m + 'm ' : '') +
        s + 's'
    );
};

// ================================
// STYLED REPLY (MODERN & FORWARDED)
// ================================
const replyWithStyle = async (sock, jid, text, m) => {
    try {
        await sock.sendMessage(
            jid,
            {
                text: text,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363409292513352@newsletter',
                        serverMessageId: 144,
                        newsletterName: 'JAMPAN-XMD OFFICIAL'
                    },
                    externalAdReply: {
                        title: '🚀 JAMPAN-XMD V3',
                        body: 'Kelvin Jampan | Dev Tech',
                        thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                        sourceUrl: 'https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt',
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        showAdAttribution: true
                    }
                }
            },
            { quoted: m }
        );

        await sock.sendMessage(
            jid,
            {
                audio: { url: 'https://files.catbox.moe/vmc7k3.mp3' },
                mimetype: 'audio/mpeg',
                ptt: false
            },
            { quoted: m }
        );
    } catch (e) {
        console.log('Reply Error:', e.message);
    }
};

// ================================
// MAIN COMMAND HANDLER
// ================================
const handleCommands = async (sock, m, settings) => {
    try {
        if (!m || !m.message) return;

        const remoteJid = m.key.remoteJid || '';
        const sender = m.key.participant || remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const isOwner = sender.includes(settings.ownerNumber) || m.key.fromMe;

        // --- FETCH ADMINS IF GROUP ---
        let groupAdmins = [];
        let isAdmin = false;
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(remoteJid);
                groupAdmins = groupMetadata.participants.filter(v => v.admin !== null).map(v => v.id);
                isAdmin = groupAdmins.includes(sender);
            } catch (e) {
                groupAdmins = [];
                isAdmin = false;
            }
        }

        // --- MESSAGE TYPE & BODY ---
        const messageType = Object.keys(m.message)[0];
        let body = '';
        if (messageType === 'conversation') body = m.message.conversation;
        else if (messageType === 'extendedTextMessage') body = m.message.extendedTextMessage.text;
        else if (messageType === 'imageMessage') body = m.message.imageMessage.caption;
        else if (messageType === 'videoMessage') body = m.message.videoMessage.caption;

        if (!body) return;

        // --- FUNCTION REACT ---
        const react = async (emoji) => {
            try {
                await sock.sendMessage(remoteJid, {
                    react: { text: emoji, key: m.key }
                });
            } catch (err) {
                console.log('Reaction Error:', err.message);
            }
        };

        // --- AUTO PRESENCE ---
        if (settings.autoTyping) await sock.sendPresenceUpdate('composing', remoteJid);
        if (settings.autoRecord) await sock.sendPresenceUpdate('recording', remoteJid);

        // --- COMMAND LOGIC CHECK ---
        if (!body.startsWith(prefix)) return;

        const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();
        const args = body.slice(prefix.length).trim().split(/ +/).slice(1);
        const text = args.join(' ');

        if (settings.mode === 'private' && !isOwner) return;

        // ================================
        // START MAIN SWITCH COMMANDS
        // ================================
        switch (command) {

            // ================================
            // RUNTIME COMMAND
            // ================================
            case 'runtime':
            case 'rtime': {
                await react('⏱️');
                const uptime = runtime(process.uptime());
                await replyWithStyle(sock, remoteJid, `⏰ Bot Runtime: ${uptime}\n\nJAMPAN-XMD is active and more updates are coming soon.\n\nI LOVE YOU ❤️`, m);
            }
            break;

            // ================================
            // ALIVE COMMAND
            // ================================
            case 'alive': {
                await react('✅');
                await replyWithStyle(sock, remoteJid, '✅ JAMPAN-XMD is active and running successfully!', m);
            }
            break;

            // ================================
            // OWNER & CREATOR INFO
            // ================================
            case 'owner':
            case 'me':
            case 'dev': {
                await react('👑');
                await sock.sendMessage(remoteJid, {
                    contacts: {
                        displayName: 'Kelvin Jampan',
                        contacts: [{
                            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Kelvin Jampan\nTEL;type=CELL;type=VOICE;waid=255674229015:+255674229015\nEND:VCARD`
                        }]
                    }
                }, { quoted: m });
                await replyWithStyle(sock, remoteJid, '👑 Owner: Kelvin Jampan\n📞 Contact: wa.me/255674229015\n🌐 Site: https://jampanbot.vercel.app', m);
            }
            break;

// ================================
// ⚡ PREMIUM ANONYMOUS MENU
// ================================
case 'menu':
case 'help':
case 'use': {

    await react('⚡');

    const uptime = runtime(process.uptime());

    const menuText = `
┏━━━━━━━━━━━━━━━━━━━┓
┃  ⚡ 𝐉𝐀𝐌𝐏𝐀𝐍-𝐗𝐌𝐃 ⚡
┗━━━━━━━━━━━━━━━━━━━┛

> ☠️ Anonymous Multi Device
> 👑 Developer : Kelvin Jampan
> 🚀 Status : Active
> ⏱ Runtime : ${uptime}
> 📡 Prefix : [ ${prefix} ]

╭──────────────⬣
> 🚀 SYSTEM NODE
╰──────────────⬣
> ${prefix}alive
> ${prefix}ping
> ${prefix}runtime
> ${prefix}repo
> ${prefix}mode
> ${prefix}setprefix
> ${prefix}autotyping
> ${prefix}autorec
> ${prefix}broadcast
> ${prefix}waite
> ${prefix}toeveryone
> ${prefix}heroku

╭──────────────⬣
> 🧠 AI SYSTEM
╰──────────────⬣
> ${prefix}ai
> ${prefix}gpt
> ${prefix}gemini
> ${prefix}chatgpt
> ${prefix}define
> ${prefix}say
> ${prefix}coffee

╭──────────────⬣
> ☠️ HACK TERMINAL
╰──────────────⬣
> ${prefix}hack
> ${prefix}matrix
> ${prefix}darkweb
> ${prefix}system
> ${prefix}anonymous

╭──────────────⬣
> 📥 DOWNLOAD CENTER
╰──────────────⬣
> ${prefix}ytmp3
> ${prefix}ytmp4
> ${prefix}play
> ${prefix}tt
> ${prefix}fb
> ${prefix}ig

╭──────────────⬣
> ⚙️ GROUP SECURITY
╰──────────────⬣
> ${prefix}tagall
> ${prefix}link
> ${prefix}welcome
> ${prefix}goodbye
> ${prefix}antipromote
> ${prefix}antidemote

╭──────────────⬣
> 🎨 MEDIA TOOLS
╰──────────────⬣
> ${prefix}sticker
> ${prefix}s
> ${prefix}take
> ${prefix}steal
> ${prefix}photo
> ${prefix}enhance
> ${prefix}hd
> ${prefix}vv

╭──────────────⬣
> 👑 OWNER & INFO
╰──────────────⬣
> ${prefix}owner
> ${prefix}support
> ${prefix}script
> ${prefix}vision
> ${prefix}love

┏━━━━━━━━━━━━━━━━━━━┓
> ⚡ SIGNAL CONNECTED
> ☠️ Anonymous node active
┗━━━━━━━━━━━━━━━━━━━┛
`;

    await sock.sendMessage(remoteJid, {
        image: {
            url: 'https://files.catbox.moe/fzjhed.png'
        },
        caption: menuText,
        contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterName: 'JAMPAN-XMD OFFICIAL',
                newsletterJid: '120363409292513352@newsletter',
            },
            externalAdReply: {
                title: '⚡ JAMPAN-XMD CONTROL PANEL',
                body: 'Fast • Secure • Anonymous',
                thumbnailUrl: 'https://files.catbox.moe/fzjhed.png',
                sourceUrl: 'https://jampanbot.vercel.app',
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: true
            }
        }
    }, { quoted: m });

}
break;

            // ================================
            // ENHANCE IMAGE / HD
            // ================================
            case 'enhance':
            case 'hd': {
                try {
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const isImg = messageType === 'imageMessage' || quotedMsg?.imageMessage;

                    if (!isImg) return await replyWithStyle(sock, remoteJid, '❌ Reply to an image and type .enhance', m);

                    await react('🪄');
                    const mediaMessage = quotedMsg?.imageMessage || m.message.imageMessage;
                    const filePath = await sock.downloadAndSaveMediaMessage(mediaMessage);

                    await replyWithStyle(sock, remoteJid, '⏳ Enhancing image quality to HD...', m);

                    await sock.sendMessage(remoteJid, {
                        image: { url: filePath },
                        caption: '✨ Enhanced by JAMPAN-XMD'
                    }, { quoted: m });

                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to enhance image.', m);
                }
            }
            break;

            // ================================
            // VIEW ONCE OPENER
            // ================================
            case 'vv':
            case 'viewonce': {
                try {
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const vo = quotedMsg?.viewOnceMessageV2 || quotedMsg?.viewOnceMessageV2Extension;

                    if (!vo) return await replyWithStyle(sock, remoteJid, '❌ Reply to a View Once message!', m);

                    await react('👀');
                    const media = vo.message.imageMessage || vo.message.videoMessage || vo.message.audioMessage;
                    const filePath = await sock.downloadAndSaveMediaMessage(media);

                    if (vo.message.imageMessage) {
                        await sock.sendMessage(remoteJid, { image: { url: filePath }, caption: media.caption || '' }, { quoted: m });
                    } else if (vo.message.videoMessage) {
                        await sock.sendMessage(remoteJid, { video: { url: filePath }, caption: media.caption || '' }, { quoted: m });
                    } else if (vo.message.audioMessage) {
                        await sock.sendMessage(remoteJid, { audio: { url: filePath }, mimetype: 'audio/mp4', ptt: false }, { quoted: m });
                    }

                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to open View Once message.', m);
                }
            }
            break;

            // ================================
            // SETTINGS COMMANDS (OWNER)
            // ================================
            case 'autotyping': {
                if (!isOwner) return await react('❌');
                settings.autoTyping = args[0] === 'on';
                await replyWithStyle(sock, remoteJid, `✅ Auto Typing is now ${settings.autoTyping ? 'ON' : 'OFF'}`, m);
            }
            break;

            case 'autorec': {
                if (!isOwner) return await react('❌');
                settings.autoRecord = args[0] === 'on';
                await replyWithStyle(sock, remoteJid, `✅ Auto Record is now ${settings.autoRecord ? 'ON' : 'OFF'}`, m);
            }
            break;

            case 'mode': {
                if (!isOwner) return await react('❌');
                const newMode = args[0]?.toLowerCase();
                if (newMode !== 'public' && newMode !== 'private') return await replyWithStyle(sock, remoteJid, `❌ Use: ${prefix}mode public/private`, m);
                settings.mode = newMode;
                await react('✅');
                await replyWithStyle(sock, remoteJid, `✅ Bot mode changed to *${newMode.toUpperCase()}*`, m);
            }
            break;

            case 'setprefix': {
                if (!isOwner) return await react('❌');
                const newPrefix = args[0];
                if (!newPrefix) return await replyWithStyle(sock, remoteJid, `❌ Example: ${prefix}setprefix #`, m);
                config.PREFIX = newPrefix; // Ina-update kwenye runtime config
                await react('✅');
                await replyWithStyle(sock, remoteJid, `✅ Prefix changed to: ${newPrefix}`, m);
            }
            break;

            // ================================
            // ADVANCED AI CHAT WITH MEMORY
            // ================================
            case 'ai':
            case 'gpt':
            case 'gemini':
            case 'chatgpt': {
                try {
                    await react('🧠');
                    const aiText = args.join(' ');
                    if (!aiText) return await replyWithStyle(sock, remoteJid, `❌ Please ask something.\n\nExample: ${prefix}ai who is Kelvin Jampan?`, m);

                    if (!global.userChats) global.userChats = {};
                    if (!global.userChats[remoteJid]) global.userChats[remoteJid] = [];

                    global.userChats[remoteJid].push(`User: ${aiText}`);
                    if (global.userChats[remoteJid].length > 10) global.userChats[remoteJid].shift();

                    const userHistory = global.userChats[remoteJid].join('\n');
                    const systemPrompt = `You are JAMPAN-XMD, a smart WhatsApp bot created by Kelvin Jampan from Tanzania.\nWebsite: https://jampanbot.vercel.app\nChat naturally like a human using English or Kiswahili.\nHistory:\n${userHistory}`;

                    const response = await axios.post(
                        'https://api.openai.com/v1/chat/completions',
                        {
                            model: 'gpt-4o-mini',
                            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: aiText }],
                            temperature: 0.7
                        },
                        { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
                    );

                    const botResponse = response.data.choices[0].message.content;
                    global.userChats[remoteJid].push(`Bot: ${botResponse}`);
                    await replyWithStyle(sock, remoteJid, botResponse, m);
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ OpenAI is busy or API key is missing.', m);
                }
            }
            break;

            // ================================
            // TEXT TO SPEECH (SAY)
            // ================================
            case 'say': {
                try {
                    await react('🗣️');
                    const googleTTS = require('google-tts-api');
                    const ttsText = args.join(' ');
                    if (!ttsText) return await replyWithStyle(sock, remoteJid, '❌ Enter text to speak.', m);

                    const audioUrl = googleTTS.getAudioUrl(ttsText, { lang: 'sw', slow: false });
                    await sock.sendMessage(remoteJid, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to generate audio.', m);
                }
            }
            break;

            // ================================
            // VCF EXPORT
            // ================================
            case 'vcf': {
                try {
                    if (!isGroup) return await replyWithStyle(sock, remoteJid, '❌ Group only command.', m);
                    await react('📇');

                    const metadata = await sock.groupMetadata(remoteJid);
                    const participants = metadata.participants;
                    let vcfContent = '';

                    participants.forEach((p) => {
                        const number = p.id.split('@')[0];
                        vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:JAMPAN | ${number}\nTEL;TYPE=CELL:+${number}\nEND:VCARD\n`;
                    });

                    await sock.sendMessage(remoteJid, {
                        document: Buffer.from(vcfContent),
                        mimetype: 'text/vcard',
                        fileName: 'JampanContacts.vcf',
                        caption: `✅ Exported ${participants.length} contacts`
                    }, { quoted: m });
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to export contacts.', m);
                }
            }
            break;

            // ================================
            // PROFILE PICTURE RETRIEVER
            // ================================
            case 'pp':
            case 'profilepic': {
                try {
                    await react('📸');
                    let targetUser = remoteJid;
                    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;

                    if (mentioned && mentioned.length > 0) targetUser = mentioned[0];
                    else if (m.message?.extendedTextMessage?.contextInfo?.participant) targetUser = m.message.extendedTextMessage.contextInfo.participant;

                    const ppUrl = await sock.profilePictureUrl(targetUser, 'image').catch(() => null);
                    if (!ppUrl) return await replyWithStyle(sock, remoteJid, '❌ User has no profile picture.', m);

                    await sock.sendMessage(remoteJid, {
                        image: { url: ppUrl },
                        caption: `📸 Profile Picture\n\nUser: @${targetUser.split('@')[0]}\n\nRetrieved by JAMPAN-XMD`,
                        mentions: [targetUser]
                    }, { quoted: m });
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to fetch profile picture.', m);
                }
            }
            break;

            // ================================
            // PING & SPEED TEST (WITH PROGRESS BAR)
            // ================================
            case 'ping': {
                try {
                    await react('🚀');
                    const startTime = Date.now();
                    const pingMsg = await sock.sendMessage(remoteJid, { text: '⚡ Pinging JAMPAN-XMD...' }, { quoted: m });

                    const progressSteps = [
                        { bar: '▰▱▱▱▱▱▱▱▱▱', percent: '10%' },
                        { bar: '▰▰▰▰▱▱▱▱▱▱', percent: '40%' },
                        { bar: '▰▰▰▰▰▰▰▱▱▱', percent: '70%' },
                        { bar: '▰▰▰▰▰▰▰▰▰▰', percent: '100%' }
                    ];

                    for (const step of progressSteps) {
                        await delay(200);
                        await sock.sendMessage(remoteJid, { text: `${step.bar} ${step.percent}`, edit: pingMsg.key });
                    }

                    const latency = Date.now() - startTime;
                    let quality = 'EXCELLENT', emoji = '🟢';
                    if (latency > 100 && latency < 300) { quality = 'GOOD'; emoji = '🟡'; }
                    else if (latency >= 300) { quality = 'FAIR'; emoji = '🟠'; }

                    const finalText = `━━━━━━━━━━━━━━━━━━━━\n┃ ⚡ PING RESULT ⚡\n━━━━━━━━━━━━━━━━━━━━\n\n🏓 Ping Completed!\n⚡ Speed: ${latency}ms\n${emoji} Quality: ${quality}\n🕒 Time: ${new Date().toLocaleTimeString()}\n\n━━━━━━━━━━━━━━━━━━━━\n┃ 🤖 JAMPAN-XMD 🚀\n━━━━━━━━━━━━━━━━━━━━`;

                    await sock.sendMessage(remoteJid, {
                        image: { url: 'https://files.catbox.moe/fzjhed.png' },
                        caption: finalText,
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: { newsletterName: 'kelvin - jampan-Ai', newsletterJid: '120363409292513352@newsletter' }
                        }
                    }, { quoted: m });
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Ping failed.', m);
                }
            }
            break;

            // ================================
            // STICKER GENERATOR
            // ================================
            case 'sticker':
            case 's': {
                try {
                    await react('✨');
                    const { Sticker, StickerTypes } = require('wa-sticker-formatter');
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    const mediaMessage = quotedMsg?.imageMessage || quotedMsg?.videoMessage || m.message?.imageMessage || m.message?.videoMessage;

                    if (!mediaMessage) return await replyWithStyle(sock, remoteJid, "❌ Reply to image/video!", m);

                    const media = await sock.downloadMediaMessage(quotedMsg ? { message: quotedMsg } : m);
                    const sticker = new Sticker(media, {
                        pack: "JAMPAN-XMD",
                        author: "Kelvin Jampan",
                        type: args.includes('-c') ? StickerTypes.CROPPED : StickerTypes.FULL,
                        quality: 70
                    });

                    await sock.sendMessage(remoteJid, { sticker: await sticker.toBuffer() }, { quoted: m });
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to create sticker.', m);
                }
            }
            break;

            // ================================
            // STEAL / TAKE STICKER METADATA
            // ================================
            case 'take':
            case 'steal': {
                try {
                    await react('📸');
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    if (!quotedMsg?.stickerMessage) return await replyWithStyle(sock, remoteJid, '❌ Reply to a sticker.', m);

                    const { Sticker, StickerTypes } = require('wa-sticker-formatter');
                    const mediaPath = await sock.downloadAndSaveMediaMessage(quotedMsg.stickerMessage);
                    const packName = args.join(' ') || 'JAMPAN-XMD';

                    const sticker = new Sticker(mediaPath, {
                        pack: packName,
                        author: "Kelvin Jampan",
                        type: StickerTypes.CROPPED,
                        quality: 70
                    });

                    await sock.sendMessage(remoteJid, { sticker: await sticker.toBuffer() }, { quoted: m });
                    if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to change sticker metadata.', m);
                }
            }
            break;

            // ================================
            // STICKER TO PHOTO
            // ================================
            case 'photo': {
                try {
                    await react('🖼️');
                    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                    if (!quotedMsg?.stickerMessage) return await replyWithStyle(sock, remoteJid, '❌ Reply to a sticker.', m);

                    const stickerPath = await sock.downloadAndSaveMediaMessage(quotedMsg.stickerMessage);
                    const outputPath = `${stickerPath}.png`;
                    const { exec } = require('child_process');

                    exec(`ffmpeg -i "${stickerPath}" "${outputPath}"`, async (err) => {
                        if (err) return await replyWithStyle(sock, remoteJid, '❌ Failed to convert sticker. Hakikisha ffmpeg imesakinishwa.', m);

                        await sock.sendMessage(remoteJid, { image: fs.readFileSync(outputPath), caption: '✅ Converted by JAMPAN-XMD' }, { quoted: m });
                        if (fs.existsSync(stickerPath)) fs.unlinkSync(stickerPath);
                        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    });
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to convert sticker.', m);
                }
            }
            break;

            // ================================
            // GITHUB LOOKUP
            // ================================
            case "github":
            case "gh": {
                if (!args[0]) return await replyWithStyle(sock, remoteJid, `❌ Example: ${prefix}github KelvinJampan`, m);
                await react("📃");
                try {
                    const response = await axios.get(`https://api.github.com/users/${args[0]}`);
                    const data = response.data;
                    const githubText = `╭━━〔 GITHUB INFO 〕━━⬣\n┃ 👤 Name: ${data.name || "N/A"}\n┃ 🔖 Username: ${data.login}\n┃ 👥 Followers: ${data.followers}\n┃ 📦 Repos: ${data.public_repos}\n┃ 🌍 Location: ${data.location || "N/A"}\n┃ 🔗 ${data.html_url}\n╰━━━━━━━━━━━━━━━━━━⬣`;
                    await sock.sendMessage(remoteJid, { image: { url: data.avatar_url }, caption: githubText }, { quoted: m });
                } catch (e) {
                    await replyWithStyle(sock, remoteJid, "❌ GitHub user not found!", m);
                }
            }
            break;

            // ================================
            // DICTIONARY (DEFINE)
            // ================================
            case 'define': {
                try {
                    await react('📚');
                    const term = args.join(' ');
                    if (!term) return await replyWithStyle(sock, remoteJid, `📖 Example:\n${prefix}define hello`, m);

                    const response = await axios.get(`https://api.giftedtech.my.id/api/tools/define?apikey=gifted&term=${encodeURIComponent(term)}`);
                    const results = response.data?.result;

                    if (!results || !Array.isArray(results) || results.length === 0) return await replyWithStyle(sock, remoteJid, `❌ No definition found for: ${term}`, m);

                    let replyText = `───〔 📚 DEFINITION 〕───\n📌 Term: ${term.toUpperCase()}\n\n`;
                    results.slice(0, 2).forEach((def, index) => {
                        replyText += `🧠 Meaning ${index + 1}:\n${def.definition || 'No definition'}\n\n`;
                        if (def.example) replyText += `💡 Example:\n${def.example}\n\n`;
                    });
                    replyText += `━━━━━━━━━━━━━━\n🤖 Generated by JAMPAN-XMD`;
                    await replyWithStyle(sock, remoteJid, replyText, m);
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to fetch definition.', m);
                }
            }
            break;

            // ================================
            // COFFEE & JAMPAN TRIVIA
            // ================================
            case 'coffee': {
                try {
                    await react('☕');
                    const jampanFacts = [
                        'JAMPAN-XMD is an advanced AI bot created by Kelvin Jampan 🤖',
                        'Kelvin Jampan built this bot for WhatsApp automation 🚀',
                        'JAMPAN-XMD receives continuous updates ⚡',
                        'Kelvin Jampan is a developer, gamer and creator 👑'
                    ];
                    const randomFact = jampanFacts[Math.floor(Math.random() * jampanFacts.length)];
                    await sock.sendMessage(remoteJid, {
                        image: { url: 'https://coffee.alexflipnote.dev/random' },
                        caption: `☕ Enjoy your coffee!\n\n💡 Did you know?\n${randomFact}\n\n🤖 Powered by JAMPAN-XMD`
                    }, { quoted: m });
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to fetch coffee image.', m);
                }
            }
            break;

            // ================================
            // PERSONALITY TRiggers
            // ================================
            case 'kelvin':
            case 'kevin':
            case 'jampan':
            case 'maneno': {
                const reactions = ['😎', '🔥', '🚀', '👑', '💎'];
                const replies = [
                    'Hello! Kelvin Jampan is online 😎',
                    '🚀 Welcome to JAMPAN-XMD',
                    '🔥 JAMPAN-XMD is active!',
                    '👑 Powered by Kelvin Jampan'
                ];
                await react(reactions[Math.floor(Math.random() * reactions.length)]);
                await sock.sendMessage(remoteJid, {
                    text: replies[Math.floor(Math.random() * replies.length)],
                    mentions: [sender],
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        externalAdReply: { title: 'JAMPAN-XMD', body: 'Kelvin Jampan', thumbnailUrl: 'https://files.catbox.moe/fzjhed.png', sourceUrl: 'https://jampanbot.vercel.app', mediaType: 1 }
                    }
                }, { quoted: m });
            }
            break;

            case 'love': {
                await react('❤️');
                await replyWithStyle(sock, remoteJid, '❤️ You became the most important person in my life.', m);
            }
            break;

            case 'vision': {
                await react('🔎');
                await replyWithStyle(sock, remoteJid, '❤️ Our mission is making WhatsApp automation fun and smart.', m);
            }
            break;

            case 'script': {
                await react('📜');
                await replyWithStyle(sock, remoteJid, `┏━━━━━━━━━━━━━━\n┃ JAMPAN-XMD\n┃ STATUS: ACTIVE\n┗━━━━━━━━━━━━━━\n\n👑 Creator:\nKelvin Jampan\n\n📢 Channel:\nhttps://whatsapp.com/channel/0029Vb7fTNf3QxS8A6rbBB3S\n\n© JAMPAN-XMD`, m);
            }
            break;

            case 'support':
            case 'channel': {
                await react('📢');
                await replyWithStyle(sock, remoteJid, '📢 Official Channel:\nhttps://whatsapp.com/channel/0029Vb7fTNf3QxS8A6rbBB3S', m);
            }
            break;

            case 'heroku': {
                await react('🚀');
                await replyWithStyle(sock, remoteJid, '🚀 JAMPAN-XMD is running on Heroku successfully.', m);
            }
            break;

            // ================================
            // GROUP MANAGEMENT COMMANDS
            // ================================
            case "tagall": {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "❌ Group only command!", m);
                await react("📢");
                const metadata = await sock.groupMetadata(remoteJid);
                const participants = metadata.participants;
                let teks = `📢 *TAG ALL*\n\n`;
                for (let mem of participants) { teks += `👤 @${mem.id.split("@")[0]}\n`; }
                await sock.sendMessage(remoteJid, { text: teks, mentions: participants.map(v => v.id) }, { quoted: m });
            }
            break;

            case "link": {
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "❌ Group only!", m);
                await react("🔗");
                const code = await sock.groupInviteCode(remoteJid);
                await replyWithStyle(sock, remoteJid, `🔗 https://chat.whatsapp.com/${code}`, m);
            }
            break;

            case 'welcome':
            case 'goodbye':
            case 'antipromote':
            case 'antidemote': {
                try {
                    if (!isGroup) return await replyWithStyle(sock, remoteJid, '❌ Group only command.', m);
                    if (!isAdmin && !isOwner) return await replyWithStyle(sock, remoteJid, '❌ Admin or Owner only command.', m);

                    const option = args[0]?.toLowerCase();
                    if (option !== 'on' && option !== 'off') return await replyWithStyle(sock, remoteJid, `❌ Example:\n.${command} on`, m);

                    if (!settings.groupEvents) settings.groupEvents = {};
                    if (!settings.groupEvents[remoteJid]) settings.groupEvents[remoteJid] = {};

                    settings.groupEvents[remoteJid][command] = option === 'on';
                    await react(option === 'on' ? '✅' : '❌');

                    await replyWithStyle(sock, remoteJid, `🚀 JAMPAN-XMD EVENT UPDATE\n\n📢 Event: ${command.toUpperCase()}\n⚙️ Status: ${option.toUpperCase()}\n\n🤖 Powered by JAMPAN-XMD`, m);
                } catch (err) {
                    console.log(err);
                    await replyWithStyle(sock, remoteJid, '❌ Failed to update event.', m);
                }
            }
            break;

            // ==========================================
            // YOUTUBE & STRATEGIC BROADCAST COMMANDS
            // ==========================================
case 'broadcast': {
    if (!isOwner) return await replyWithStyle(sock, remoteJid, '❌ This command is only available for the bot owner.', m);

    try {
        const groups = Object.keys(await sock.groupFetchAllParticipating());

        await replyWithStyle(
            sock,
            remoteJid,
            `📢 Starting YouTube promotion broadcast to ${groups.length} groups...`,
            m
        );

        const promoCaption = `
╭━━〔 🎬 JAMPAN XMD CHANNEL 〕━━⬣
┃
┃ 🚀 Want to learn:
┃ • WhatsApp Bot Development
┃ • Termux Tricks
┃ • Web Development
┃ • Baileys & Pair Code Systems
┃ • Advanced Bot Features
┃
┃ 🔥 Subscribe to my official
┃ YouTube channel now and level up!
┃
┃ 👑 Channel: *Jampani XMD*
┃
┃ 📌 Tap the image below to open
┃ the YouTube channel directly.
┃
╰━━━━━━━━━━━━━━⬣
`;

        for (let jid of groups) {

            await sock.sendMessage(jid, {
                image: {
                    url: 'https://i.imgur.com/8amqBSN.jpeg'
                },
                caption: promoCaption,
                contextInfo: {
                    externalAdReply: {
                        title: '🎥 JAMPAN XMD OFFICIAL',
                        body: 'Bots • Termux • Coding • Tutorials',
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://i.imgur.com/8amqBSN.jpeg',
                        sourceUrl: 'https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt'
                    }
                }
            });

            await delay(3500); // Anti-ban delay
        }

        await replyWithStyle(
            sock,
            remoteJid,
            '✅ YouTube promotion broadcast completed successfully!',
            m
        );

    } catch (err) {
        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Broadcast failed. Please check logs.',
            m
        );
    }
}
break;

case 'waite': {
    if (!isOwner) return await replyWithStyle(sock, remoteJid, '❌ Owner only command.', m);

    try {

        const chats = await sock.chats.all();

        await replyWithStyle(
            sock,
            remoteJid,
            `🚀 Sending deploy access to ${chats.length} users...`,
            m
        );

        for (let user of chats) {

            if (!user.id.endsWith('@s.whatsapp.net')) continue;

            await sock.sendMessage(user.id, {
                text: `⚡ *JAMPAN-XMD is active*\n\n> Tap below to deploy 🚀`,
                contextInfo: {
                    externalAdReply: {
                        title: '🚀 TAP TO DEPLOY',
                        body: 'Fast • Secure • Anonymous',
                        mediaType: 1,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://i.imgur.com/8amqBSN.jpeg',
                        sourceUrl: 'https://jampanbot.vercel.app'
                    }
                }
            });

            await delay(2500); // Anti-ban safety
        }

        await replyWithStyle(
            sock,
            remoteJid,
            '✅ Deploy broadcast completed successfully.',
            m
        );

    } catch (err) {
        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Failed to send deploy access.',
            m
        );
    }
}
break;

            case 'toeveryone': {
                if (!isOwner) return await replyWithStyle(sock, remoteJid, '❌ Owner only command.', m);
                if (!isGroup) return await replyWithStyle(sock, remoteJid, "Tumia command hii ndani ya Group husika!", m);

                try {
                    const groupMetadata = await sock.groupMetadata(remoteJid);
                    const participants = groupMetadata.participants;
                    await replyWithStyle(sock, remoteJid, `🚀 Mchakato umeanza! Inatuma ujumbe inbox kwa members ${participants.length}...`, m);

                    const dmText = `Habari, mimi ni *JAMPAN-XMD Bot*. Naomba nikuombe sekunde chache unisupport kijana mwenzako kwa kusubscribe channel yangu ya YouTube:\n\n👉 https://youtube.com/@jampani-xmd?si=oLPtRqYf1h1ygSzt\n\nTafadhali nisaidie kusubscribe, asante sana! 🙏✨`;

                    for (let mem of participants) {
                        if (mem.id === sock.user.id || mem.id.includes(sock.user.id.split(':')[0])) continue;
                        try {
                            await sock.sendMessage(mem.id, { text: dmText });
                            await delay(5000); // Delay thabiti ya sekunde 5 kuzuia WhatsApp ban
                        } catch (e) {
                            console.log(`Ujumbe haukwenda kwa: ${mem.id}`);
                        }
                    }
                    await replyWithStyle(sock, remoteJid, "✅ Kazi imekamilika! Kila member ametumiwa ujumbe inbox.", m);
                } catch (err) {
                    console.log(err);
                }
            }
            break;
            
case 'repo': {
    try {

        await sock.sendMessage(remoteJid, {
            text: `
╭━━〔 🤖 JAMPAN-XMD SYSTEM 〕━━⬣
┃
┃ ⚡ Bot Name : JAMPAN-XMD
┃ 👑 Owner : Kelvin Jampan
┃ 🚀 Status : Active & Online
┃
┃ > Anonymous deployment access enabled
┃
┃ 🔗 Tap below to deploy instantly
┃
╰━━━━━━━━━━━━━━━━⬣
`,
            contextInfo: {
                externalAdReply: {
                    title: '🚀 JAMPAN-XMD DEPLOY',
                    body: 'Fast • Free • Secure',
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnailUrl: 'https://i.imgur.com/8amqBSN.jpeg',
                    sourceUrl: 'https://jampanbot.vercel.app'
                }
            }
        }, { quoted: m });

    } catch (err) {
        console.log(err);

        await replyWithStyle(
            sock,
            remoteJid,
            '❌ Repo command failed.',
            m
        );
    }
}
break;

            // placeholders kwa zile graphic templates ulizotaja kwenye menu lakini hazina api bado
            case 'hacker': case 'dragonball': case 'naruto': case 'wall': case 'summer': case 'neonlight':
            case 'greenneon': case 'glitch': case 'devil': case 'boom': case 'water': case 'snow':
            case 'transformer': case 'thunder': case 'harrypotter': case 'whitegold': case 'thor':
            case 'neon': case 'gold': case 'purple': case 'arena': case 'write': case 'meme': case 'url': {
                await replyWithStyle(sock, remoteJid, `⚠️ Template ya Graphic au API ya command hii (.${command}) inahitaji unganisho la API key ya nje. Itawekwa sawa hivi karibuni!`, m);
            }
            break;

case 'hack': {

await react('☠️')

await replyWithStyle(sock, remoteJid, `
╭━━〔 ☠️ HACK NODE 〕━━⬣
┃
┃ ⚡ Accessing target...
┃ 💻 Injecting payload...
┃ 📡 Bypassing firewall...
┃ 🔓 Root access granted
┃
╰━━〔 JAMPAN-XMD 〕━━⬣
`, m)

}
break;



case 'matrix': {

await react('🧠')

await replyWithStyle(sock, remoteJid, `
1010101010101010

⚡ MATRIX NODE ACTIVE

> Anonymous signal connected...
> Identity hidden successfully.

☠️ JAMPAN-XMD
`, m)

}
break;



case 'darkweb': {

await react('🌑')

await replyWithStyle(sock, remoteJid, `
╭━━〔 🌑 DARK WEB 〕━━⬣
┃
┃ ☠️ Hidden tunnel connected
┃ 📡 Private node active
┃ 🔥 Anonymous access granted
┃
╰━━〔 SYSTEM ONLINE 〕━━⬣
`, m)

}
break;



case 'system': {

await react('⚡')

await replyWithStyle(sock, remoteJid, `
╭━━〔 ⚡ SYSTEM INFO 〕━━⬣
┃
┃ 💻 CPU : ONLINE
┃ 📡 NETWORK : STABLE
┃ 🔥 STATUS : ACTIVE
┃ 🚀 MODE : PUBLIC
┃ ☠️ SECURITY : ENABLED
┃
╰━━〔 JAMPAN-XMD 〕━━⬣
`, m)

}
break;



case 'anonymous': {

await react('👤')

await replyWithStyle(sock, remoteJid, `
☠️ Anonymous mode enabled

> Identity masked successfully.
> Signal encrypted.

⚡ JAMPAN-XMD
`, m)

}
break;

            // ================================
            // DEFAULT SWITCH CASE
            // ================================
            default:
                break;
        }
    } catch (err) {
        console.log('Critical Commands Error:', err);
    }
};

// ================================
// EXPORTS
// ================================
module.exports = {
    handleCommands,
    runtime,
    replyWithStyle,
    delay
};
