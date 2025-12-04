// 👑 ERIKA AMANO BOT - A Couple of Cuckoos
// 24/7 WhatsApp Bot
require('dotenv').config();
const express = require('express');
const { Boom } = require('@hapi/boom');
const makeWASocket = require('@whiskeysockets/baileys').default;
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ========== ERIKA'S PERSONALITY ==========
const ERIKA = {
    name: "Erika Amano 👑",
    greetings: [
        "Hmph! You're bothering me?",
        "What is it, commoner?",
        "Don't waste my time...",
        "Oh, it's you. I suppose I have a moment.",
        "If you're looking for Nagi, he's not here."
    ],
    
    roasts: [
        "You're poorer than Nagi's sense of style!",
        "Even Sachi wouldn't date someone like you!",
        "My pet has better manners than you!",
        "Hah! You think you're special? How cute.",
        "You're as useful as a chocolate teapot!",
        "Even Hiro's worst cooking is better than you!",
        "You remind me of my Monday mornings - annoying!",
        "Don't get the wrong idea! I'm just bored!",
        "You're trying so hard it's almost adorable... almost.",
        "My family could buy yours ten times over!"
    ],
    
    affectionate: [
        "N-not that I care or anything...",
        "You're... not completely terrible, I guess.",
        "Fine, I'll pay attention to you. Just this once!",
        "*sigh* You're slightly better than average.",
        "If you keep this up, I might consider you a friend. Maybe."
    ],
    
    reactions: [
        "Hmph!",
        "Tch.",
        "How vulgar.",
        "Typical.",
        "Whatever.",
        "As expected of a commoner.",
        "Don't misunderstand!"
    ]
};

// ========== GEMINI AI SETUP ==========
let geminiAPI = null;
if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiAPI = genAI.getGenerativeModel({ model: "gemini-pro" });
}

// ========== WEB SERVER (FOR UPTIMEROBOT) ==========
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>👑 Erika Amano Bot</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 50px;
                }
                .container {
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 600px;
                    margin: 0 auto;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                h1 {
                    font-size: 2.5em;
                    margin-bottom: 20px;
                }
                .status {
                    color: #4ade80;
                    font-weight: bold;
                    font-size: 1.2em;
                }
                .commands {
                    text-align: left;
                    background: rgba(0,0,0,0.2);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>👑 Erika Amano Bot</h1>
                <p class="status">✅ Bot is running 24/7!</p>
                <p>From "A Couple of Cuckoos" anime</p>
                
                <div class="commands">
                    <h3>📱 WhatsApp Commands:</h3>
                    <p><strong>.erika</strong> - Talk to Erika</p>
                    <p><strong>.roast @user</strong> - Get roasted by Erika</p>
                    <p><strong>.img character</strong> - Search anime images</p>
                    <p><strong>.quote</strong> - Get anime quote</p>
                    <p><strong>.help</strong> - Show all commands</p>
                </div>
                
                <p>Bot is connected to WhatsApp and monitoring this page for uptime.</p>
                <p>Last restart: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `);
});

// Health check endpoint for UptimeRobot
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        bot: 'Erika Amano', 
        anime: 'A Couple of Cuckoos',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.listen(PORT, () => {
    console.log(`👑 Erika server running on port ${PORT}`);
});

// ========== WHATSAPP BOT ==========
let botStatus = "Initializing...";
let qrCodeData = null;

async function connectToWhatsApp() {
    console.log("🔄 Connecting Erika to WhatsApp...");
    botStatus = "Connecting...";
    
    const sock = makeWASocket({
        auth: {
            creds: {},
            keys: {}
        },
        printQRInTerminal: true,
        logger: pino({ level: 'error' }),
        browser: ['Chrome', 'Windows', '10.0.0'],
        markOnlineOnConnect: true
    });

    // QR Code Handler
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCodeData = qr;
            console.log("📱 Scan this QR with WhatsApp:");
            qrcode.generate(qr, { small: true });
            botStatus = "Waiting for QR scan...";
        }
        
        if (connection === 'open') {
            console.log("✅ Erika is connected to WhatsApp!");
            botStatus = "Connected to WhatsApp";
            
            // Send welcome message
            const welcomeMsg = "👑 Erika Amano here! I'm online 24/7!\nType .help for commands";
            await sock.sendMessage(sock.user.id, { text: welcomeMsg });
        }
        
        if (connection === 'close') {
            console.log("❌ Connection closed, reconnecting...");
            botStatus = "Reconnecting...";
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== 401;
            if (shouldReconnect) {
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        }
    });

    // Message Handler
    sock.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            const text = msg.message.conversation || '';
            const sender = msg.key.remoteJid;
            const isGroup = sender.endsWith('@g.us');
            
            console.log(`📨 Message from ${sender}: ${text}`);
            
            // Only respond to commands or mentions
            if (!text.startsWith('.') && !text.toLowerCase().includes('erika')) {
                return;
            }
            
            // ========== COMMANDS ==========
            
            // .help
            if (text.startsWith('.help')) {
                const helpMsg = `👑 *Erika Amano Bot Commands*:
.help - Show this message
.erika - Talk to Erika
.roast @user - Roast someone (Erika style!)
.img [character] - Search anime images
.quote - Random anime quote
.status - Check bot status

*Example*: .img Erika Amano
*Example*: .roast @friend`;
                await sock.sendMessage(sender, { text: helpMsg });
            }
            
            // .erika
            else if (text.startsWith('.erika')) {
                const response = ERIKA.greetings[Math.floor(Math.random() * ERIKA.greetings.length)];
                await sock.sendMessage(sender, { text: response });
            }
            
            // .roast
            else if (text.startsWith('.roast')) {
                const roast = ERIKA.roasts[Math.floor(Math.random() * ERIKA.roasts.length)];
                await sock.sendMessage(sender, { text: `${roast} 👑` });
            }
            
            // .img
            else if (text.startsWith('.img')) {
                const query = text.replace('.img', '').trim();
                if (!query) {
                    await sock.sendMessage(sender, { 
                        text: "Hmph! Tell me what to search! Example: .img Erika Amano" 
                    });
                    return;
                }
                
                if (geminiAPI && process.env.GEMINI_API_KEY) {
                    await sock.sendMessage(sender, { 
                        text: `🔍 Searching images for "${query}"...\n(I need Gemini API setup for full images)` 
                    });
                } else {
                    // Fallback: Google search link
                    const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query + ' anime')}`;
                    await sock.sendMessage(sender, { 
                        text: `Hmph! Here, search yourself:\n${searchUrl}\n\n(Add GEMINI_API_KEY for automatic images)` 
                    });
                }
            }
            
            // .quote
            else if (text.startsWith('.quote')) {
                const quotes = [
                    "People's dreams never end! - Blackbeard",
                    "A lesson without pain is meaningless. - Edward Elric",
                    "Hard work is worthless for those that don't believe in themselves. - Naruto",
                    "Knowing you're different is only the beginning. - L Lawliet"
                ];
                const quote = quotes[Math.floor(Math.random() * quotes.length)];
                await sock.sendMessage(sender, { text: `💬 "${quote}"` });
            }
            
            // .status
            else if (text.startsWith('.status')) {
                await sock.sendMessage(sender, { 
                    text: `👑 *Erika Status*\nStatus: ${botStatus}\nUptime: ${Math.floor(process.uptime() / 60)} minutes\nHost: Railway.app 24/7\nAnime: A Couple of Cuckoos` 
                });
            }
            
            // Just mentioning "Erika"
            else if (text.toLowerCase().includes('erika')) {
                if (Math.random() > 0.7) {
                    const reaction = ERIKA.reactions[Math.floor(Math.random() * ERIKA.reactions.length)];
                    await sock.sendMessage(sender, { text: reaction });
                }
            }
            
        } catch (error) {
            console.error("Error:", error);
        }
    });

    // Connection updates
    sock.ev.on('creds.update', (creds) => {
        console.log("🔐 Credentials updated");
    });
}

// Start everything
connectToWhatsApp();
console.log("👑 Starting Erika Amano WhatsApp Bot...");
