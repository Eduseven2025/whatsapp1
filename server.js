const express = require('express');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

const sessions = {};

app.get('/qr/:id', async (req, res) => {
  const id = req.params.id;

  if (sessions[id] && sessions[id].ready) {
    return res.json({ status: 'ready', message: 'Sessão já conectada.' });
  }

  if (!sessions[id]) {
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: id }),
      puppeteer: { headless: true, args: ['--no-sandbox'] }
    });

    sessions[id] = { client, qr: null, ready: false };

    client.on('qr', (qr) => {
      qrcode.toDataURL(qr).then((base64) => {
        sessions[id].qr = base64;
      });
    });

    client.on('ready', () => {
      sessions[id].ready = true;
      console.log(`✅ Sessão ${id} conectada.`);
    });

    client.on('disconnected', () => {
      console.log(`❌ Sessão ${id} desconectada.`);
      delete sessions[id];
    });

    client.initialize();
  }

  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (sessions[id].qr) {
      clearInterval(interval);
      return res.json({ status: 'success', qr: sessions[id].qr });
    }

    if (attempts >= 15) {
      clearInterval(interval);
      return res.json({ status: 'pending', message: 'QR ainda não disponível. Tente novamente.' });
    }
  }, 1000);
});

app.get('/', (req, res) => {
  res.send('Servidor WhatsSeven rodando ✅');
});

app.listen(port, () => {
  console.log(`🟢 Servidor rodando na porta ${port}`);
});
