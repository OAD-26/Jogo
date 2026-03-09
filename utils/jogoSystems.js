const db = require('./dbManager');
const path = require('path');
const arPath = path.join(__dirname, '../database/autoreact.json');
const agPath = path.join(__dirname, '../database/autogreet.json');

const handleAutoReact = async (sock, msg, from, body, isGroup, sender) => {
  let ar = db.read(arPath);
  if (!ar || Object.keys(ar).length === 0) {
    ar = { global: true, probability: 100, emojiPool: ["🔥", "🌋", "💀"], enabledChats: [], disabledChats: [] };
    db.write(arPath, ar);
  }
  
  // Check if specifically disabled for this group
  if (ar.disabledChats?.includes(from)) return;
  
  // Check if globally enabled or specifically enabled
  const isEnabled = ar.global || ar.enabledChats?.includes(from);
  if (!isEnabled) return;
  
  if (Math.random() * 100 > (ar.probability || 100)) return;
  
  const emojis = ar.emojiPool || ["🔥", "🌋", "💀"];
  await sock.sendMessage(from, { 
    react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: msg.key } 
  });
};

const handleAutoGreet = async (sock, msg, from, isGroup, sender, isOwner) => {
  let ag = db.read(agPath);
  const now = Date.now();
  
  // Owner Greet
  if (isOwner && ag.owner?.enabled) {
    if (now - (ag.owner.last || 0) > 86400000) {
      await sock.sendMessage(from, { text: "🔥 *WELCOME BACK MASTER OAD-26* 🔥\n\n_Your domain is expanding..._" }, { quoted: msg });
      ag.owner.last = now;
      db.write(agPath, ag);
    }
  }
  
  // Group Entrance
  if (isGroup && ag.group?.enabled) {
    // Only work if specifically allowed for this group
    if (!ag.group.allowedGroups?.includes(from)) return;
    
    ag.group.chats = ag.group.chats || {};
    if (now - (ag.group.chats[from] || 0) > 86400000) {
      const groupMetadata = await sock.groupMetadata(from);
      const groupName = groupMetadata.subject;
      
      const welcomeMsg = `🌋 *JOGO HAS ENTERED THE DOMAIN* 🌋\n\n` +
                        `📍 *Group:* ${groupName}\n` +
                        `🔥 *Status:* Burning\n` +
                        `💀 *Warning:* Watch your step...`;
                        
      await sock.sendMessage(from, { text: welcomeMsg });
      ag.group.chats[from] = now;
      db.write(agPath, ag);
    }
  }
};
module.exports = { handleAutoReact, handleAutoGreet };
