const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_PATH = process.env.SESSION_PATH || './sessions';

app.use(express.json());

const clients = {};

const createClient = async (sessionId) => {
    const sessionDir = path.join(SESSION_PATH, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: sessionDir }),
        puppeteer: { headless: true, args: ['--no-sandbox'] }
    });

    clients[sessionId] = { client, ready: false };

    client.on('qr', async (qr) => {
        const qrImage = await qrcode.toDataURL(qr);
        clients[sessionId].qr = qrImage;
    });

    client.on('ready', () => {
        clients[sessionId].ready = true;
    });

    client.initialize();
};

app.get('/qr/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    if (!clients[sessionId]) await createClient(sessionId);
    setTimeout(() => {
        res.send(clients[sessionId].qr || 'Aguardando QR...');
    }, 3000);
});

app.get('/status/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const status = clients[sessionId]?.ready ? 'CONNECTED' : 'NOT_CONNECTED';
    res.send({ status });
});

app.post('/send/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { number, message } = req.body;
    if (!clients[sessionId] || !clients[sessionId].ready) {
        return res.status(400).send({ error: 'Sessão não conectada' });
    }
    try {
        await clients[sessionId].client.sendMessage(number + '@c.us', message);
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log('Servidor rodando na porta ' + PORT);
});