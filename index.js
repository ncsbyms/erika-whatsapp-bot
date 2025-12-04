// Erika Amano Bot - Koyeb Optimized
const express = require('express');
const { Boom } = require('@hapi/boom');
const makeWASocket = require('@whiskeysockets/baileys').default;
const pino = require('pino');
const qrcode = require('qrcode-terminal');

// Erika Personality
const ERIKA = {
    roasts: [
        "Hmph! You're as clueless as Nagi!",
        "Even Sachi wouldn't be this annoying!",
        "My butler is more interesting than you!",
        "Don't get the wrong idea! I'm just bored!",
        "You're trying so hard it's cute... NOT!"
    ]
};

// Web server for Koyeb health checks
const app = express();
app.get('/', (req, res) => res.send('👑 Erika Amano Bot - Koyeb 24/7'));
app.get('/health', (req, res) => res.json({ status: 'online', bot: 'Erika' }));

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`✅ Erika server running on port ${PORT}`);
});

// WhatsApp Bot
async function connectWhatsApp() {
    console.log('🔗 Connecting to WhatsApp...');
    
    const sock = makeWASocket({
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ['Chrome', 'Windows', '10.0.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        
        if (qr) {
            console.log('📱 Scan QR with WhatsApp:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'open') {
            console.log('✅ Connected! Erika is online 24/7 on Koyeb!');
        }
        
        if (connection === 'close') {
            console.log('🔄 Reconnecting in 5s...');
            setTimeout(connectWhatsApp, 5000);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        
        const text = msg.body?.toLowerCase() || '';
        const sender = msg.key.remoteJid;
        
        // Commands
        if (text.startsWith('.help')) {
            await sock.sendMessage(sender, {
                text: `👑 *Erika Amano Bot* (24/7 on Koyeb)\n\n.help - Show this\n.erika - Talk to me\n.roast - Get roasted\n.img [name] - Search images\n.status - Bot status`
            });
        }
        
        if (text.startsWith('.erika')) {
            await sock.sendMessage(sender, {
                text: "Hmph! What do you want, commoner? 👑"
            });
        }
        
        if (text.startsWith('.roast')) {
            const roast = ERIKA.roasts[Math.floor(Math.random() * ERIKA.roasts.length)];
            await sock.sendMessage(sender, { text: roast });
        }
        
        if (text.startsWith('.img')) {
            const query = text.replace('.img', '').trim();
            if (query) {
                await sock.sendMessage(sender, {
                    text: `🔍 Searching for "${query}"...\n(Image search needs Gemini API key)`
                });
            }
        }
        
        if (text.startsWith('.status')) {
            await sock.sendMessage(sender, {
                text: `👑 *Erika Status*\n✅ Online 24/7\n🏠 Host: Koyeb.com\n💾 RAM: 256MB Free\n⚡ vCPU: 2 cores\n🔗 Always connected!`
            });
        }
    });
}

// Start bot
connectWhatsApp();
console.log('👑 Starting Erika Amano Bot on Koyeb...');
