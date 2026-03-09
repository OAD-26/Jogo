const config = require('./config');
const { handleAutoReact, handleAutoGreet } = require('./utils/jogoSystems');
const { loadCommands } = require('./utils/commandLoader');
const db = require('./utils/dbManager');
const path = require('path');
const agPath = path.join(__dirname, './database/autogreet.json');

let commands;
try { commands = loadCommands(); } catch (e) { commands = new Map(); }

module.exports = {
  handleMessage: async (sock, msg) => {
    try {
      if (!msg.message) return;
      const from = msg.key.remoteJid;
      if (!from || from.includes('@broadcast')) return;
      
      let body = "";
      if (msg.message.conversation) body = msg.message.conversation;
      else if (msg.message.extendedTextMessage) body = msg.message.extendedTextMessage.text;
      
      const sender = msg.key.participant || from;
      const isGroup = from.endsWith('@g.us');
      const isOwner = config.ownerNumber.some(o => o.replace(/[^0-9]/g, '') === sender.split('@')[0].split(':')[0]);

      await handleAutoReact(sock, msg, from, body, isGroup, sender).catch(() => {});
      await handleAutoGreet(sock, msg, from, isGroup, sender, isOwner).catch(() => {});

      // Command Execution
      const bodyClean = body.trim();
      if (bodyClean.startsWith(config.prefix)) {
        const args = bodyClean.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        console.log(`🔥 Command Received: ${commandName} from ${sender}`);

        const settingsPath = path.join(__dirname, './database/groupSettings.json');
        const { handleGreetCommand } = require('./utils/greetingSystem');

        // Smart Greeting Commands
        if (commandName === 'greet') {
            return await handleGreetCommand(sock, msg, from, sender);
        }

        if (['greeton', 'greetoff', 'welcome', 'goodbye'].includes(commandName)) {
            if (!isGroup) return sock.sendMessage(from, { text: "⚠️ This command only works in groups." });
            const isAdmin = isOwner || (await sock.groupMetadata(from)).participants.find(p => p.id === sender)?.admin;
            if (!isAdmin) return sock.sendMessage(from, { text: "💀 This power belongs only to Admins or the Master." });

            let settings = db.read(settingsPath);
            if (!settings[from]) settings[from] = { welcome: true, goodbye: true, greet: true };

            if (commandName === 'greeton') {
                settings[from].greet = true;
                db.write(settingsPath, settings);
                return sock.sendMessage(from, { text: "✅ *AUTO GREETINGS:* ENABLED" });
            }
            if (commandName === 'greetoff') {
                settings[from].greet = false;
                db.write(settingsPath, settings);
                return sock.sendMessage(from, { text: "❌ *AUTO GREETINGS:* DISABLED" });
            }
            
            const action = args[0]?.toLowerCase();
            if (action === 'on') {
                settings[from][commandName] = true;
                db.write(settingsPath, settings);
                return sock.sendMessage(from, { text: `✅ *${commandName.toUpperCase()}:* ENABLED` });
            }
            if (action === 'off') {
                settings[from][commandName] = false;
                db.write(settingsPath, settings);
                return sock.sendMessage(from, { text: `❌ *${commandName.toUpperCase()}:* DISABLED` });
            }
            return sock.sendMessage(from, { text: `❓ *USAGE:*\n.${commandName} on\n.${commandName} off` });
        }

        // Custom Command: .autoreact [on/off/global/group]
        if (commandName === 'autoreact' || commandName === 'ar') {
           const arPath = path.join(__dirname, './database/autoreact.json');
           let ar = db.read(arPath);
           if (!ar.disabledChats) ar.disabledChats = [];
           if (!ar.enabledChats) ar.enabledChats = [];
           
           const action = args[0]?.toLowerCase();
           if (action === 'on' || action === 'all') {
             ar.global = true;
             db.write(arPath, ar);
             return sock.sendMessage(from, { text: "✅ *AUTOREACT:* ENABLED GLOBALLY" });
           } else if (action === 'off') {
             if (args[1]?.toLowerCase() === 'all') {
               ar.global = false;
               ar.enabledChats = [];
               db.write(arPath, ar);
               return sock.sendMessage(from, { text: "❌ *AUTOREACT:* DISABLED GLOBALLY" });
             } else {
               if (!isGroup) return sock.sendMessage(from, { text: "⚠️ Use `.autoreact off all` to disable globally or use this in a group." });
               if (!ar.disabledChats.includes(from)) ar.disabledChats.push(from);
               ar.enabledChats = ar.enabledChats.filter(c => c !== from);
               db.write(arPath, ar);
               return sock.sendMessage(from, { text: "❌ *AUTOREACT:* DISABLED FOR THIS GROUP" });
             }
           } else if (action === 'group' || action === 'enable') {
             if (!isGroup) return sock.sendMessage(from, { text: "⚠️ This command must be used in a group." });
             ar.disabledChats = ar.disabledChats.filter(c => c !== from);
             if (!ar.enabledChats.includes(from)) ar.enabledChats.push(from);
             db.write(arPath, ar);
             return sock.sendMessage(from, { text: "✅ *AUTOREACT:* ENABLED FOR THIS GROUP" });
           }
           return sock.sendMessage(from, { text: "❓ *USAGE:*\n.autoreact all (Global ON)\n.autoreact off all (Global OFF)\n.autoreact group (Enable for this group)\n.autoreact off (Disable for this group)" });
        }

        // Custom Command: .entrance [on/off/allow]
        if (commandName === 'entrance' || commandName === 'greet') {
           let ag = db.read(agPath);
           if (!ag.group) ag.group = { enabled: false, allowedGroups: [], chats: {} };
           
           const action = args[0]?.toLowerCase();
           if (action === 'on') {
             ag.group.enabled = true;
             db.write(agPath, ag);
             return sock.sendMessage(from, { text: "✅ *GROUP ENTRANCE:* ENABLED" });
           } else if (action === 'off') {
             ag.group.enabled = false;
             db.write(agPath, ag);
             return sock.sendMessage(from, { text: "❌ *GROUP ENTRANCE:* DISABLED" });
           } else if (action === 'allow') {
             if (!isGroup) return sock.sendMessage(from, { text: "⚠️ This command must be used in a group." });
             if (!ag.group.allowedGroups) ag.group.allowedGroups = [];
             if (!ag.group.allowedGroups.includes(from)) {
               ag.group.allowedGroups.push(from);
               db.write(agPath, ag);
               return sock.sendMessage(from, { text: "🔥 *DOMAIN EXPANDED:* This group is now allowed." });
             } else {
               return sock.sendMessage(from, { text: "🌋 This group is already part of the domain." });
             }
           } else if (action === 'disallow') {
             if (!isGroup) return sock.sendMessage(from, { text: "⚠️ This command must be used in a group." });
             ag.group.allowedGroups = ag.group.allowedGroups?.filter(g => g !== from) || [];
             db.write(agPath, ag);
             return sock.sendMessage(from, { text: "💀 *DOMAIN RETRACTED:* Group disallowed." });
           }
           return sock.sendMessage(from, { text: "❓ *USAGE:*\n.entrance on\n.entrance off\n.entrance allow\n.entrance disallow" });
        }

        const cmd = commands.get(commandName);
        if (cmd) {
          console.log(`🚀 Executing Command: ${cmd.name}`);
          const ctx = {
            from, sender, isOwner, isGroup,
            reply: (t) => sock.sendMessage(from, { text: t }, { quoted: msg }),
            react: (e) => sock.sendMessage(from, { react: { text: e, key: msg.key } })
          };
          try {
            await cmd.execute(sock, msg, args, ctx);
          } catch (err) {
            console.error(`❌ Command Execution Error (${commandName}):`, err);
            sock.sendMessage(from, { text: "⚠️ An error occurred while executing this command." });
          }
        } else {
           console.log(`❓ Command not found: ${commandName}`);
        }
      }
    } catch (e) { console.error(e); }
  }
};
