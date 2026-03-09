/**
 * Global Configuration for WhatsApp MD Bot
 */

module.exports = {
    // Bot Owner Configuration
    ownerNumber: ['91xxxxxxxxxxx'], // Add your number without + or spaces
    ownerName: ['OAD-26'], // Owner names
    
    // Bot Configuration
    botName: 'JOGO',
    prefix: '.',
    sessionName: 'session',
    sessionID: process.env.SESSION_ID || '',
    newsletterJid: '120363161513685998@newsletter',
    updateZipUrl: 'https://github.com/OAD-26/JOGO-BOT/archive/refs/heads/main.zip',
    
    // Sticker Configuration
    packname: 'JOGO BOT 🔥',
    author: 'OAD-26',
    
    // Bot Behavior
    selfMode: false,
    autoRead: true,
    autoTyping: false,
    autoBio: true,
    autoSticker: true,
    autoReact: false,
    autoReactMode: 'bot',
    autoDownload: false,
    
    // Group Settings Defaults
    defaultGroupSettings: {
      antilink: true,
      antilinkAction: 'delete',
      antitag: true,
      antitagAction: 'delete',
      antiall: false,
      antiviewonce: true,
      antibot: true,
      anticall: true,
      antigroupmention: true,
      antigroupmentionAction: 'delete',
      welcome: true,
      welcomeMessage: '🔥 A new soul enters the volcano. Welcome @user to the domain of *#group*!',
      goodbye: true,
      goodbyeMessage: '🌋 Another weakling has left the flames. Goodbye @user.',
      antiSpam: true,
      antidelete: true,
      nsfw: false,
      detect: true,
      chatbot: false,
      autosticker: true
    },
    
    // API Keys
    apiKeys: {
      openai: '',
      deepai: '',
      remove_bg: ''
    },
    
    // Message Configuration
    messages: {
      wait: '⏳ Concentrating curse energy... Please wait.',
      success: '🔥 Success! The flames have spoken.',
      error: '❌ A glitch in the domain! Error occurred.',
      ownerOnly: '👑 Only OAD-26 can command me.',
      adminOnly: '🛡️ Only high-grade shamans (admins) can use this.',
      groupOnly: '👥 This belongs within a domain (group).',
      privateOnly: '💬 Speak to me in the shadows (private chat).',
      botAdminNeeded: '🤖 I need domain authority (admin) to do this.',
      invalidCommand: '⚠️ You dare command a Special Grade Curse? Type .menu for guidance.'
    },
    
    timezone: 'Asia/Kolkata',
    maxWarnings: 3,
    
    social: {
      github: 'https://github.com/OAD-26',
      instagram: 'https://instagram.com/oad26',
      youtube: 'https://youtube.com/@oad26'
    }
};
