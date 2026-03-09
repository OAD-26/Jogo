const express = require('express');
const { fork } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let botSocket = null;

app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>JOGO BOT</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background: linear-gradient(135deg, #1a1a1a 0%, #2d1a00 50%, #1a1a1a 100%);
            color: #ff4500; 
            font-family: 'Arial', sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh;
            overflow: hidden;
          }
          .container { 
            border: 3px solid #ff4500; 
            padding: 50px 80px;
            border-radius: 20px; 
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(45, 26, 0, 0.8) 100%);
            box-shadow: 0 0 40px #ff4500, inset 0 0 20px rgba(255, 69, 0, 0.1);
            text-align: center;
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { box-shadow: 0 0 40px #ff4500, inset 0 0 20px rgba(255, 69, 0, 0.1); }
            50% { box-shadow: 0 0 60px #ff4500, inset 0 0 30px rgba(255, 69, 0, 0.2); }
          }
          h1 { 
            font-size: 4rem; 
            margin: 0 0 10px 0; 
            text-transform: uppercase; 
            letter-spacing: 8px;
            text-shadow: 0 0 20px #ff4500;
            font-weight: bold;
          }
          .emoji { 
            font-size: 5rem; 
            margin-bottom: 20px;
            display: block;
          }
          p { 
            font-size: 1.8rem; 
            margin: 15px 0;
            font-weight: 600;
          }
          .status { 
            color: #00ff00; 
            text-shadow: 0 0 10px #00ff00;
          }
          .info {
            margin-top: 30px;
            font-size: 1.2rem;
            color: #ffaa00;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="emoji">🌋</span>
          <h1>JOGO BOT</h1>
          <p>Domain Expansion: <span class="status">ACTIVE</span></p>
          <p>Owner: OAD-26</p>
          <p>Port: ${PORT}</p>
          <div class="info">
            <p>🔥 Flames Ignite 🔥</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/status', (req, res) => {
  res.status(200).json({ 
    bot: 'JOGO',
    owner: 'OAD-26',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Express server running on port ${PORT}`);
  console.log(`🌋 JOGO BOT is ready to dominate the domain`);
  
  const startBot = () => {
    const bot = fork(path.join(__dirname, 'bot.js'));
    bot.on('message', (msg) => {
      if (msg.type === 'socket') botSocket = msg.data;
    });
    bot.on('exit', (code) => {
      console.log(`🌋 Bot exited (${code}). Restarting in 5s...`);
      setTimeout(startBot, 5000);
    });
  };
  startBot();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  if (err.code !== 'EADDRINUSE') {
    console.error('Uncaught Exception:', err);
  }
});
