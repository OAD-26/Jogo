const db = require('./dbManager');
const path = require('path');
const config = require('../config');

const storePath = path.join(__dirname, '../database/messageStore.json');

const storeMessage = async (msg) => {
    try {
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
        
        let store = db.read(storePath);
        if (Array.isArray(store)) store = {}; // Fix if it was initialized as array
        
        const messageID = msg.key.id;
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;
        
        // Extract content and type
        let type = Object.keys(msg.message)[0];
        if (type === 'messageContextInfo') type = Object.keys(msg.message)[1];
        
        let content = '';
        if (type === 'conversation') content = msg.message.conversation;
        else if (type === 'extendedTextMessage') content = msg.message.extendedTextMessage.text;
        else if (type === 'imageMessage') content = msg.message.imageMessage.caption || 'Image';
        else if (type === 'videoMessage') content = msg.message.videoMessage.caption || 'Video';
        else if (type === 'stickerMessage') content = 'Sticker';
        
        store[messageID] = {
            chat: from,
            sender: sender,
            message: msg.message, // Store full message for media forwarding
            content: content,
            type: type
        };

        // Limit store size to 1000 messages to prevent bloat
        const keys = Object.keys(store);
        if (keys.length > 1000) {
            delete store[keys[0]];
        }

        db.write(storePath, store);
    } catch (e) {
        console.error('AntiDelete Store Error:', e);
    }
};

const handleUpdate = async (sock, update) => {
    try {
        for (const up of update) {
            if (up.update.protocolMessage && up.update.protocolMessage.type === 0) {
                const deletedKey = up.update.protocolMessage.key;
                const messageID = deletedKey.id;
                
                const store = db.read(storePath);
                const deletedMsg = store[messageID];
                
                if (!deletedMsg) return;
                if (deletedMsg.sender === sock.user.id.split(':')[0] + '@s.whatsapp.net') return;

                const ownerNumber = config.ownerNumber[0];
                const ownerJid = ownerNumber.includes('@s.whatsapp.net') ? ownerNumber : `${ownerNumber}@s.whatsapp.net`;
                
                let groupName = 'Private Chat';
                if (deletedMsg.chat.endsWith('@g.us')) {
                    try {
                        const metadata = await sock.groupMetadata(deletedMsg.chat);
                        groupName = metadata.subject;
                    } catch (e) {
                        groupName = 'Unknown Group';
                    }
                }

                const reportHeader = `🚨 *DELETED MESSAGE DETECTED*\n\n` +
                                   `👤 *Sender:* ${deletedMsg.sender.split('@')[0]}\n` +
                                   `📱 *Number:* ${deletedMsg.sender.split('@')[0]}\n` +
                                   `👥 *Group:* ${groupName}\n\n` +
                                   `💬 *Message:*`;

                await sock.sendMessage(ownerJid, { text: reportHeader });
                
                // Forward the original message (Baileys handles media if the object is intact)
                await sock.copyNForward(ownerJid, { message: deletedMsg.message, key: deletedKey }, true);
            }
        }
    } catch (e) {
        console.error('AntiDelete Update Error:', e);
    }
};

module.exports = { storeMessage, handleUpdate };
