module.exports = {
    name: 'eval',
    category: 'owner',
    desc: 'Execute JavaScript code',
    execute: async (sock, msg, args, { isOwner, reply }) => {
        if (!isOwner) return;
        try {
            let evaled = await eval(args.join(' '));
            if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
            await reply(evaled);
        } catch (err) {
            await reply(String(err));
        }
    }
};
