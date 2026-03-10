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

        // Health & Feedback Commands
        if (['botcheck', 'botdetails', 'botstatus', 'feedback', 'comment', 'creator'].includes(commandName)) {
            const health = require('./utils/healthSystem');
            const reply = (t) => sock.sendMessage(from, { text: t }, { quoted: msg });

            if (commandName === 'botcheck') {
                return reply(health.getHealthReport());
            } else if (commandName === 'botdetails') {
                const stats = db.read(health.statsPath) || { commands: {} };
                let failedCmds = Object.keys(stats.commands || {}).filter(name => stats.commands[name].fail > stats.commands[name].success);
                let report = `📊 *Bot Detailed Report*\n\nModules Active:\n• AI System\n• Educational System\n• JAMB System\n• Sticker System\n• Anti Delete System\n\nFailed Commands:\n${failedCmds.length ? failedCmds.join('\n') : 'None'}`;
                return reply(report);
            } else if (commandName === 'botstatus') {
                const uptime = process.uptime();
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const stats = db.read(health.statsPath) || {};
                let status = `📡 *Bot Status*\n\nUptime: ${hours}h ${minutes}m\nCommands Loaded: ${commands.size}\nConnected Users: ${stats.users?.length || 1}\nActive Groups: ${isGroup ? '1+' : '0'}`;
                return reply(status);
            } else if (commandName === 'feedback' || commandName === 'comment') {
                if (!args[0]) return reply(`⚠️ Usage: .${commandName} <message>`);
                const feedback = db.read(health.feedbackPath) || [];
                feedback.push({ user: sender, type: commandName, message: args.join(' '), time: new Date() });
                db.write(health.feedbackPath, feedback);
                
                const ownerNumber = config.ownerNumber[0];
                const ownerJid = ownerNumber.includes('@s.whatsapp.net') ? ownerNumber : `${ownerNumber}@s.whatsapp.net`;
                await sock.sendMessage(ownerJid, { text: `📩 *New Bot ${commandName.toUpperCase()}*\n\nUser: ${sender.split('@')[0]}\nMessage: ${args.join(' ')}` });
                return reply("✅ Thank you for your feedback! It has been sent to the creator.");
            } else if (commandName === 'creator') {
                return reply(`👤 *Creator Information*\n\nName: OAD-26\nContact: +2349138385352\nEmail: oad262626@gmail.com\n\nFor feedback or issues please use:\n.feedback <message>`);
            }
        }

        // Auto Post Commands
        if (['allowpost', 'removepost', 'listpostgroups'].includes(commandName)) {
            const postGroupsPath = path.join(__dirname, './database/postGroups.json');
            let groups = db.read(postGroupsPath);
            if (!Array.isArray(groups)) groups = [];

            if (commandName === 'allowpost') {
                if (!isGroup) return sock.sendMessage(from, { text: "⚠️ This command must be used in a group." });
                if (!groups.includes(from)) {
                    groups.push(from);
                    db.write(postGroupsPath, groups);
                    return sock.sendMessage(from, { text: "✅ This group is now allowed for automatic posts." });
                } else {
                    return sock.sendMessage(from, { text: "🌋 This group is already allowed." });
                }
            } else if (commandName === 'removepost') {
                if (!isGroup) return sock.sendMessage(from, { text: "⚠️ This command must be used in a group." });
                groups = groups.filter(g => g !== from);
                db.write(postGroupsPath, groups);
                return sock.sendMessage(from, { text: "⛔ Automatic posts disabled in this group." });
            } else if (commandName === 'listpostgroups') {
                let text = "📋 *Allowed Groups for Auto Post:*\n";
                for (let g of groups) text += `- ${g}\n`;
                return sock.sendMessage(from, { text: text });
            }
        }

        // Sticker System Commands
        if (['savesticker', 'stickerpack', 'liststickers', 'sticker'].includes(commandName)) {
            const ss = require('./utils/stickerSystem');
            const reply = (t) => sock.sendMessage(from, { text: t }, { quoted: msg });
            
            if (commandName === 'savesticker') {
                if (!args[0]) return reply("⚠️ Usage: .savesticker <category>");
                return await ss.saveSticker(sock, msg, args[0], reply);
            } else if (commandName === 'stickerpack') {
                if (!args[0]) return reply("⚠️ Usage: .stickerpack <category>");
                return await ss.sendPack(sock, msg, args[0], from, sender, reply);
            } else if (commandName === 'liststickers') {
                return ss.listPacks(reply);
            } else if (commandName === 'sticker') {
                if (!args[0] || !args[1]) return reply("⚠️ Usage: .sticker <category> <name>");
                return await ss.sendSingle(sock, args[0], args[1], sender, reply);
            }
        }

        if (['explain', 'shortnote', 'brief', 'define', 'summary', 'mention', 'example', 'facts', 'history', 'uses', 'ask', 'solve', 'homework', 'study', 'lesson', 'quiz', 'mcq', 'test', 'solveimage', 'readimage', 'jamb', 'jambanswer', 'jambsolve', 'jambrandom', 'dailyfact', 'wordoftheday', 'sciencefact', 'mathsolve', 'translate', 'grammarcheck', 'paraphrase'].includes(commandName)) {
            const edu = require('./commands/education/edu');
            return await edu.execute(sock, msg, args, { from, sender, isOwner, isGroup, reply: (t) => sock.sendMessage(from, { text: t }, { quoted: msg }) });
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
            const { trackCommand } = require('./utils/healthSystem');
            await cmd.execute(sock, msg, args, ctx);
            trackCommand(commandName, true);
          } catch (err) {
            const { trackCommand } = require('./utils/healthSystem');
            trackCommand(commandName, false);
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
