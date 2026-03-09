# JOGO BOT - WhatsApp MD Bot

## Overview
A WhatsApp multi-device bot built with the Baileys library. This is a backend-only Node.js application with no frontend — it runs as a persistent process and communicates via WhatsApp.

## Architecture
- **Runtime**: Node.js 20
- **Entry point**: `index.js`
- **WhatsApp library**: @whiskeysockets/baileys
- **Database**: Simple JSON-based file store (session folder)
- **Config**: `config.js` — edit bot name, owner number, prefix, and behavior settings

## Project Structure
- `index.js` — Main bot entry point, handles WhatsApp connection
- `config.js` — All bot configuration (owner, prefix, behavior flags)
- `handler.js` — Message routing and command handling
- `database.js` — Persistent data storage
- `commands/` — All bot commands organized by category (admin, ai, anime, fun, general, media, owner, textmaker, utility)
- `utils/` — Helper utilities (converter, sticker, cleanup, etc.)

## Setup & Running
The bot runs as a console workflow (`node index.js`). On first run, it displays a QR code in the console that must be scanned with WhatsApp to authenticate.

### Session Authentication
- **QR Code**: Scan from the console on first run — session saved to `./session/` folder
- **Session ID**: Set `SESSION_ID` environment variable with a `JOGOBot!...` formatted session string to restore a session without QR scanning

## Configuration
Edit `config.js` to customize:
- `ownerNumber` — Bot owner's phone number(s)
- `prefix` — Command prefix (default: `.`)
- `botName` — Display name
- `sessionName` — Session folder name (default: `session`)
- `apiKeys` — Optional API keys (OpenAI, DeepAI, Remove.bg)

## Environment Variables
- `SESSION_ID` — Optional: Pre-encoded session string to skip QR scan

## Workflow
- **Start application**: `node index.js` (console output type)
