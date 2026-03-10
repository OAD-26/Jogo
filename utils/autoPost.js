const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const config = require('../config');
const db = require('./dbManager');

const postGroupsPath = path.join(__dirname, '../database/postGroups.json');

const quotes = [
    "Success usually comes to those who are too busy to be looking for it.",
    "Believe you can and you're halfway there.",
    "The only way to do great work is to love what you do.",
    "Don't watch the clock; do what it does. Keep going."
];

const initAutoPost = (sock) => {
    // Africa/Lagos Timezone
    const timezone = 'Africa/Lagos';

    // Morning Post - 7:00 AM
    cron.schedule('0 7 * * *', async () => {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        const msg = `🌅 *Good Morning*\n\n"${quote}"\n\nHave a great day everyone ☀️`;
        await sendToAll(sock, msg);
        console.log("Morning post sent");
    }, { timezone });

    // Afternoon Post - 1:00 PM
    cron.schedule('0 13 * * *', async () => {
        const msg = `☀️ *Good Afternoon*\n\nHope your day is going well.\nStay productive and positive.`;
        await sendToAll(sock, msg);
        console.log("Afternoon post sent");
    }, { timezone });

    // Evening Post - 6:00 PM
    cron.schedule('0 18 * * *', async () => {
        const msg = `🌇 *Good Evening*\n\nTake a moment to relax and enjoy the evening.`;
        await sendToAll(sock, msg);
        console.log("Evening post sent");
    }, { timezone });

    // Night Post - 10:00 PM
    cron.schedule('0 22 * * *', async () => {
        const msg = `🌙 *Good Night*\n\nSleep tight and recharge for tomorrow.`;
        await sendToAll(sock, msg);
        console.log("Night post sent");
    }, { timezone });

    // Bot Update (Example: 9:00 AM)
    cron.schedule('0 9 * * *', async () => {
        const msg = `🤖 *JOGO BOT UPDATE*\n\nAll systems running smoothly.\nThank you for using the bot.`;
        await sendToAll(sock, msg);
    }, { timezone });
};

const sendToAll = async (sock, message) => {
    const ownerNumber = config.ownerNumber[0];
    const ownerJid = ownerNumber.includes('@s.whatsapp.net') ? ownerNumber : `${ownerNumber}@s.whatsapp.net`;
    
    // Status
    await sock.sendMessage("status@broadcast", { text: message });
    
    // Owner
    await sock.sendMessage(ownerJid, { text: message });
    
    // Allowed Groups
    const groups = db.read(postGroupsPath);
    if (Array.isArray(groups)) {
        for (const group of groups) {
            try {
                await sock.sendMessage(group, { text: message });
            } catch (e) {
                console.error(`Failed to send auto post to ${group}:`, e.message);
            }
        }
    }
};

module.exports = { initAutoPost, postGroupsPath };
