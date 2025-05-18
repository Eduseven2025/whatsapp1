const express = require('express');
const { create } = require('venom-bot');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

const sessions = {};

app.get('/qr/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;

  if (sessions[sessionId] && sessions[sessionId].ready) {
    return res.json({ status: 'ready', message: 'Sessão já está conectada.' });
  }

  if (!sessions[sessionId]) {
    sessions[sessionId] = { ready: false, qr: null };

    create({
      session: sessionId,
      headless: true,
      useChrome: true,
      disableSpins: true,
      browserArgs: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    .then((client) => {
      sessions[sessionId].ready = true;
      sessions[sessionId].client = client;
      console.log(`✅ Sessão ${sessionId} conectada.`);
    })
    .catch((error) => {
      console.error(`❌ Erro ao iniciar sessão ${sessionId}:`, error);
    });
  }

  let tentativas = 0;
  const intervalo = setInterval(() => {
    tentativas++;
    const qrPath = path.resolve(`tokens/${sessionId}/Default/qr-code.png`);
    if (fs.existsSync(qrPath)) {
      clearInterval(intervalo);
      const image = fs.readFileSync(qrPath, { encoding: 'base64' });
      res.json({ status: 'success', qr: image });
    } else if (tentativas > 15) {
      clearInterval(intervalo);
      res.json({ status: 'pending', message: 'QR code ainda não disponível, aguarde...' });
    }
  }, 1000);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
