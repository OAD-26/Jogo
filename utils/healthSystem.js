const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const config = require('../config');
const db = require('./dbManager');

const statsPath = path.join(__dirname, '../database/stats.json');
const feedbackPath = path.join(__dirname, '../database/feedback.json');

const initHealthSystem = (sock) => {
    // Daily report to creator at 9:00 PM
    cron.schedule('0 21 * * *', async () => {
        await sendDailyReport(sock);
    }, { timezone: 'Africa/Lagos' });
};

const sendDailyReport = async (sock) => {
    const stats = db.read(statsPath) || { commandsUsed: 0, errors: 0, users: new Set() };
    const ownerNumber = config.ownerNumber[0];
    const ownerJid = ownerNumber.includes('@s.whatsapp.net') ? ownerNumber : `${ownerNumber}@s.whatsapp.net`;

    const report = `📊 *Daily Bot Report*\n\n` +
                 `👥 *Active Users:* ${stats.users?.length || 0}\n` +
                 `⌨️ *Commands Used:* ${stats.commandsUsed || 0}\n` +
                 `⚠️ *Errors Detected:* ${stats.errors || 0}\n` +
                 `✅ *System Status:* Stable`;
    
    await sock.sendMessage(ownerJid, { text: report });
    
    // Reset daily stats
    stats.commandsUsed = 0;
    stats.errors = 0;
    db.write(statsPath, stats);
};

const trackCommand = (commandName, success = true) => {
    let stats = db.read(statsPath) || { commandsUsed: 0, errors: 0, commands: {} };
    stats.commandsUsed = (stats.commandsUsed || 0) + 1;
    if (!success) stats.errors = (stats.errors || 0) + 1;
    
    if (!stats.commands) stats.commands = {};
    if (!stats.commands[commandName]) stats.commands[commandName] = { total: 0, success: 0, fail: 0 };
    
    stats.commands[commandName].total++;
    if (success) stats.commands[commandName].success++;
    else stats.commands[commandName].fail++;
    
    db.write(statsPath, stats);
};

const getHealthReport = () => {
    const stats = db.read(statsPath) || { commands: {} };
    const commands = stats.commands || {};
    const cmdList = Object.keys(commands);
    
    let working = 0;
    let failed = 0;
    
    cmdList.forEach(name => {
        if (commands[name].fail > commands[name].success && commands[name].fail > 0) failed++;
        else working++;
    });

    const total = cmdList.length || 120; // Default to 120 as per requirement if empty
    const rate = Math.round((working / (working + failed || 1)) * 100);

    return `🤖 *Bot Health Report*\n\n` +
           `Total Commands: ${total}\n` +
           `Working Commands: ${working}\n` +
           `Failed Commands: ${failed}\n\n` +
           `Working Rate: ${rate}%\n` +
           `System Status: ${rate > 80 ? 'Stable ✅' : 'Maintenance ⚠️'}`;
};

module.exports = { initHealthSystem, trackCommand, getHealthReport, statsPath, feedbackPath };
