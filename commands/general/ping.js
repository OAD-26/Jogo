module.exports = {
    name: 'ping',
    category: 'general',
    desc: 'Check bot latency',
    execute: async (sock, msg, args, { reply }) => {
        const start = Date.now();
        await reply('🔥 *Expanding Domain...*');
        const end = Date.now();
        await reply(`🌋 *BOOM!* Latency: ${end - start}ms`);
    }
};
