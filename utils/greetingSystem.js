const db = require('./dbManager');
const path = require('path');
const cron = require('node-cron');

const settingsPath = path.join(__dirname, '../database/groupSettings.json');

const getGreeting = () => {
    const hour = parseInt(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos", hour: "numeric", hour12: false }));
    if (hour >= 5 && hour < 12) return "🌅 Good Morning";
    if (hour >= 12 && hour < 17) return "☀️ Good Afternoon";
    if (hour >= 17 && hour < 21) return "🌇 Good Evening";
    return "🌙 Good Night and Sleep Tight";
};

const handleGreetCommand = async (sock, msg, from, sender) => {
    const greeting = getGreeting();
    const mention = `@${sender.split('@')[0]}`;
    const text = `🌟 *JOGO BOT GREETING* 🌟\n\n${greeting}, ${mention}\n\nHope you're having a great day in this group.`;
    await sock.sendMessage(from, { text, mentions: [sender] }, { quoted: msg });
};

const handleParticipantsUpdate = async (sock, update) => {
    const { id, participants, action } = update;
    const settings = db.read(settingsPath);
    const groupSettings = settings[id] || {};

    if (action === 'add' && groupSettings.welcome) {
        const metadata = await sock.groupMetadata(id);
        for (const jid of participants) {
            const text = `👋 Welcome @${jid.split('@')[0]}\n\nWelcome to *${metadata.subject}*.\nPlease read the group rules and enjoy your stay.`;
            await sock.sendMessage(id, { text, mentions: [jid] });
        }
    } else if (action === 'remove' && groupSettings.goodbye) {
        const metadata = await sock.groupMetadata(id);
        for (const jid of participants) {
            const text = `😢 Goodbye @${jid.split('@')[0]}\n\nThanks for being part of *${metadata.subject}*.\nWe hope to see you again!`;
            await sock.sendMessage(id, { text, mentions: [jid] });
        }
    }
};

const initAutoGreet = (sock) => {
    const scheduleGreet = (time, messageFunc) => {
        const [hour, minute] = time.split(':');
        cron.schedule(`${minute} ${hour} * * *`, async () => {
            const settings = db.read(settingsPath);
            for (const [groupId, groupSettings] of Object.entries(settings)) {
                if (groupSettings.greet) {
                    try {
                        const message = messageFunc();
                        await sock.sendMessage(groupId, { text: message });
                    } catch (e) {
                        console.error(`Failed to send auto-greet to ${groupId}:`, e);
                    }
                }
            }
        }, { scheduled: true, timezone: "Africa/Lagos" });
    };

    scheduleGreet("07:00", () => "🌅 *Good Morning everyone*\nJogo Bot wishes you a productive day!");
    scheduleGreet("13:00", () => "☀️ *Good Afternoon everyone*\nKeep up the energy!");
    scheduleGreet("18:00", () => "🌇 *Good Evening everyone*\nHope you had a great day!");
    scheduleGreet("22:00", () => "🌙 *Good Night everyone*\nRest well for tomorrow!");
};

module.exports = { handleGreetCommand, handleParticipantsUpdate, initAutoGreet };
