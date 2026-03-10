const config = require('../../config');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'menu',
    alias: ['help', 'h'],
    category: 'general',
    desc: 'Show bot menu',
    execute: async (sock, msg, args, { from, sender, isOwner, reply }) => {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        let menuText = `🌋 *JOGO BOT - DOMAIN EXPANSION* 🌋\n\n`;
        menuText += `👤 *User:* @${sender.split('@')[0]}\n`;
        menuText += `👑 *Owner:* OAD-26\n`;
        menuText += `⏳ *Uptime:* ${hours}h ${minutes}m ${seconds}s\n`;
        menuText += `🔥 *Prefix:* [ ${config.prefix} ]\n\n`;

        menuText += `*📜 SYSTEM COMMANDS*\n`;
        menuText += `│ ∘ ${config.prefix}entrance [on/off] - Toggle Greetings\n`;
        menuText += `│ ∘ ${config.prefix}entrance [allow/disallow] - Group Access\n`;
        menuText += `│ ∘ ${config.prefix}autoreact [on/off] - Toggle Reactions\n`;
        menuText += `╰─══════════════════\n\n`;

        menuText += `*🛡️ ADMIN COMMANDS*\n`;
        menuText += `│ ∘ ${config.prefix}hidetag [text] - Tag all members\n`;
        menuText += `│ ∘ ${config.prefix}kick @user - Remove a member\n`;
        menuText += `╰─══════════════════\n\n`;

        menuText += `*🎮 GENERAL COMMANDS*\n`;
        menuText += `│ ∘ ${config.prefix}menu - Show this list\n`;
        menuText += `│ ∘ ${config.prefix}ping - Check bot speed\n`;
        menuText += `│ ∘ ${config.prefix}uptime - Check bot runtime\n`;
        menuText += `╰─══════════════════\n\n`;

        menuText += `*📚 EDUCATIONAL SERVICES*\n`;
        menuText += `│ ∘ ${config.prefix}explain / .shortnote / .define\n`;
        menuText += `│ ∘ ${config.prefix}ask / .solve / .homework / .study\n`;
        menuText += `│ ∘ ${config.prefix}quiz / .mcq / .test / .jamb\n`;
        menuText += `│ ∘ ${config.prefix}solveimage / .readimage\n`;
        menuText += `│ ∘ ${config.prefix}dailyfact / .wordoftheday\n`;
        menuText += `╰─══════════════════\n\n`;

        menuText += `*👑 OWNER COMMANDS*\n`;
        menuText += `│ ∘ ${config.prefix}restart - Reboot the domain\n`;
        menuText += `│ ∘ ${config.prefix}eval [code] - Execute JS\n`;
        menuText += `╰─══════════════════\n\n`;
        
        menuText += `_🔥 "Don't underestimate humans... they are full of surprises."_`;

        await sock.sendMessage(from, { 
            text: menuText,
            mentions: [sender]
        }, { quoted: msg });
    }
};
