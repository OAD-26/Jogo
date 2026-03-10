const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const handler = require('./handler');

let selfPingInterval = null;

async function startBot() {
  try {
    const sessionPath = path.join(__dirname, 'session');
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    
    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('Desktop'),
      auth: state,
      printQRInTerminal: false,
      syncFullHistory: false,
      downloadHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let vtype;
        if (options.readViewOnce) {
            message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined);
            vtype = Object.keys(message.message.viewOnceMessage.message)[0];
            delete message.message.viewOnceMessage.message[vtype].viewOnce;
            message.message = {
                ...message.message.viewOnceMessage.message
            };
        }
        let mtype = Object.keys(message.message)[0];
        let content = await require('@whiskeysockets/baileys').generateForwardMessageContent(message, forceForward);
        let ctype = Object.keys(content)[0];
        let context = {};
        if (mtype != "conversation") context = message.message[mtype].contextInfo;
        content[ctype].contextInfo = {
            ...context,
            ...content[ctype].contextInfo
        };
        const waMessage = await require('@whiskeysockets/baileys').generateWAMessageFromContent(jid, content, options ? {
            ...options,
            ...context,
            userJid: sock.user.id,
            contextInfo: {
                ...context,
                ...options.contextInfo
            }
        } : {});
        await sock.relayMessage(jid, waMessage.message, {
            messageId: waMessage.key.id
        });
        return waMessage;
    };

    sock.ev.on('connection.update', (u) => {
      if (u.qr) {
        console.log('📱 QR Generated');
        qrcode.generate(u.qr, { small: true });
      }
      if (u.connection === 'open') {
        console.log('🔥 JOGO IS ONLINE');
        
        // Connection Success Message
        const ownerNumber = config.ownerNumber[0];
        const ownerJid = ownerNumber.includes('@s.whatsapp.net') ? ownerNumber : `${ownerNumber}@s.whatsapp.net`;
        sock.sendMessage(ownerJid, { text: "✅ *Connection Successful*\n\nHello 👋\nYour WhatsApp is now connected to the bot.\n\nYou can now use all available commands.\n\nType:\n\n.menu\n\nto see the full command list.\n\nEnjoy using the bot 🚀" });

        // Send socket info to parent
        if (process.send) process.send({ type: 'socket', data: sock });
        
        // Initialize Health System
        try {
            const { initHealthSystem } = require('./utils/healthSystem');
            initHealthSystem(sock);
        } catch (e) {
            console.error('HealthSystem Init Error:', e);
        }

        // Initialize Auto Posting System
        try {
            const { initAutoPost } = require('./utils/autoPost');
            initAutoPost(sock);
        } catch (e) {
            console.error('AutoPost Init Error:', e);
        }

        // Initialize Self Ping System
        if (!selfPingInterval) {
          initializeSelfPing(sock);
        }
        
        try {
            const { initAutoGreet } = require('./utils/greetingSystem');
            initAutoGreet(sock);
        } catch (e) {
            console.error('AutoGreet Init Error:', e);
        }
      }
      if (u.connection === 'close') {
        const shouldReconnect = u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) startBot();
      }
    });

    sock.ev.on('group-participants.update', async (update) => {
      try {
          const { handleParticipantsUpdate } = require('./utils/greetingSystem');
          await handleParticipantsUpdate(sock, update);
      } catch (e) {
          console.error('Participants Update Error:', e);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        const msg = messages[0];
        try {
          const { storeMessage } = require('./utils/antiDelete');
          await storeMessage(msg);
        } catch (e) {
          console.error('Store Message Error:', e);
        }
        handler.handleMessage(sock, msg).catch(e => console.error(e));
      }
    });

    sock.ev.on('messages.update', async (update) => {
      try {
        const { handleUpdate } = require('./utils/antiDelete');
        await handleUpdate(sock, update);
      } catch (e) {
        console.error('AntiDelete Update Error:', e);
      }
    });
  } catch (e) { 
    console.error('Bot Error:', e); 
    setTimeout(startBot, 10000); 
  }
}

function initializeSelfPing(sock) {
  const ownerNumber = config.ownerNumber[0];
  const ownerJid = ownerNumber.includes('@s.whatsapp.net') ? ownerNumber : `${ownerNumber}@s.whatsapp.net`;
  
  console.log('🔄 Self-ping system active - keep-alive messages every 5 minutes');
  
  selfPingInterval = setInterval(async () => {
    try {
      await sock.sendMessage(ownerJid, { text: '🔄 *Bot keep-alive check*\n⏰ ' + new Date().toLocaleTimeString() });
    } catch (e) {
      console.error('Self-ping error:', e.message);
    }
  }, 300000); // 5 minutes
}

startBot();

// Cleanup on exit
process.on('SIGINT', () => {
  if (selfPingInterval) clearInterval(selfPingInterval);
  process.exit(0);
});
