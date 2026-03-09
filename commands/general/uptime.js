module.exports = {
    name: 'uptime',
    category: 'general',
    desc: 'Check how long the bot has been running',
    execute: async (sock, msg, args, { reply }) => {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        await reply(`⏳ *Uptime:* ${hours}h ${minutes}m ${seconds}s`);
    }
};
