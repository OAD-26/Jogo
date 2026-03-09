const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../../config');

module.exports = {
    name: 'vv',
    alias: ['viewonce'],
    category: 'utils',
    desc: 'Retrieve View Once media',
    execute: async (sock, msg, args, { from, sender, isOwner, isGroup, reply }) => {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) return reply('⚠️ Please reply to a View Once image or video with .vv');

        const viewOnce = quoted.viewOnceMessageV2 || quoted.viewOnceMessage;
        if (!viewOnce) return reply('⚠️ Please reply to a View Once image or video with .vv');

        const type = Object.keys(viewOnce.message)[0];
        if (!['imageMessage', 'videoMessage'].includes(type)) return reply('⚠️ Please reply to a View Once image or video with .vv');

        const media = viewOnce.message[type];
        const stream = await downloadContentFromMessage(media, type.replace('Message', ''));
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const senderName = msg.message.extendedTextMessage.contextInfo.participant;
        const pushName = msg.message.extendedTextMessage.contextInfo.quotedMessage.pushName || 'User';
        let groupName = 'Private Chat';
        if (isGroup) {
            const metadata = await sock.groupMetadata(from);
            groupName = metadata.subject;
        }

        const caption = `👁️ *VIEW ONCE RETRIEVED*\n` +
                        `👤 *Sender:* ${pushName}\n` +
                        `📱 *Number:* ${senderName.split('@')[0]}\n` +
                        `👥 *Group:* ${groupName}\n\n` +
                        `⚡ ${isOwner ? 'Retrieved privately by Jogo Bot\nOwner: OAD-26' : 'Retrieved by Jogo Bot'}`;

        if (isOwner) {
            const ownerJid = config.ownerNumber[0].includes('@s.whatsapp.net') ? config.ownerNumber[0] : `${config.ownerNumber[0]}@s.whatsapp.net`;
            await sock.sendMessage(ownerJid, {
                [type.replace('Message', '')]: buffer,
                caption: caption
            });
            await reply('✅ View Once retrieved and sent to your private chat, Master.');
        } else {
            await sock.sendMessage(from, {
                [type.replace('Message', '')]: buffer,
                caption: caption
            }, { quoted: msg });
        }
    }
};
