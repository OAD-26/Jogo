const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const stickerDir = path.join(__dirname, '../stickers');
if (!fs.existsSync(stickerDir)) fs.mkdirSync(stickerDir);

module.exports = {
    saveSticker: async (sock, msg, category, reply) => {
        const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const stickerMsg = msg.message.stickerMessage || quoted?.stickerMessage;

        if (!stickerMsg) return reply("⚠️ Please reply to a sticker with .savesticker <category>");
        
        const catDir = path.join(stickerDir, category);
        if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

        try {
            const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            const fileName = `${Date.now()}.webp`;
            fs.writeFileSync(path.join(catDir, fileName), buffer);
            reply(`✅ Sticker saved to *${category}* pack.`);
        } catch (e) {
            console.error(e);
            reply("❌ Failed to save sticker.");
        }
    },

    sendPack: async (sock, msg, category, from, sender, reply) => {
        const catDir = path.join(stickerDir, category);
        if (!fs.existsSync(catDir)) return reply(`⚠️ Category '*${category}*' not found.`);

        const files = fs.readdirSync(catDir).filter(f => f.endsWith('.webp'));
        if (files.length === 0) return reply(`⚠️ No stickers in '*${category}*' pack.`);

        reply(`🎨 Sending your *${category}* sticker pack privately...`);
        
        for (const file of files) {
            await sock.sendMessage(sender, { sticker: fs.readFileSync(path.join(catDir, file)) });
            await new Promise(r => setTimeout(r, 1000));
        }
    },

    listPacks: (reply) => {
        const cats = fs.readdirSync(stickerDir).filter(f => fs.statSync(path.join(stickerDir, f)).isDirectory());
        if (cats.length === 0) return reply("📦 No sticker packs available.");
        
        let text = "📦 *Available sticker packs:*\n";
        cats.forEach(c => text += `- ${c}\n`);
        reply(text);
    },

    sendSingle: async (sock, category, name, sender, reply) => {
        const catDir = path.join(stickerDir, category);
        if (!fs.existsSync(catDir)) return reply(`⚠️ Category '*${category}*' not found.`);
        
        const files = fs.readdirSync(catDir);
        const file = files.find(f => f.toLowerCase().includes(name.toLowerCase()));
        
        if (!file) return reply(`⚠️ Sticker '*${name}*' not found in pack '*${category}*'.`);
        
        await sock.sendMessage(sender, { sticker: fs.readFileSync(path.join(catDir, file)) });
    }
};
