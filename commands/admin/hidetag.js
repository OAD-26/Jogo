module.exports = {
    name: 'hidetag',
    alias: ['htag'],
    category: 'admin',
    desc: 'Tag all members in the group',
    execute: async (sock, msg, args, { from, isGroup, reply }) => {
        if (!isGroup) return reply('⚠️ This command only works in groups.');
        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants.map(p => p.id);
        await sock.sendMessage(from, { text: args.join(' ') || '📢 Attention!', mentions: participants });
    }
};
