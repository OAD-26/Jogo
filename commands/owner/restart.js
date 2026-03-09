module.exports = {
    name: 'restart',
    category: 'owner',
    desc: 'Restart the bot process',
    execute: async (sock, msg, args, { isOwner, reply }) => {
        if (!isOwner) return reply('💀 This power belongs only to the Cursed King.');
        await reply('🌋 *Domain Collapsing... Re-igniting in 5 seconds.*');
        setTimeout(() => process.exit(0), 2000);
    }
};
