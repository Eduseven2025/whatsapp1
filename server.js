const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Guardar clientes por identificador
const clients = {};

// Cria ou retorna cliente existente
function getClient(id) {
  if (!clients[id]) {
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: id }),
      puppeteer: { headless: true }
    });

    client.initialize();

    client.on('qr', (qr) => {
      clients[id].qr = qr;
    });

    client.on('ready', () => {
      clients[id].ready = true;
      console.log(`Cliente ${id} pronto!`);
    });

    client.on('auth_failure', () => {
      console.log(`Falha na autenticação do cliente ${id}`);
      clients[id].ready = false;
    });

    client.on('disconnected', () => {
      console.log(`Cliente ${id} desconectado`);
      clients[id].ready = false;
      client.destroy();
      client.initialize();
    });

    clients[id] = { client, qr: null, ready: false };
  }
  return clients[id];
}

// Endpoint para gerar QRCode para um admin
app.get('/qr/:id', async (req, res) => {
  const id = req.params.id;
  const c = getClient(id);

  if (!c.qr) {
    return res.json({ status: 'pending', message: 'QR code ainda não disponível, aguarde...' });
  }

  try {
    const qrImage = await qrcode.toDataURL(c.qr);
    res.json({ status: 'success', qr: qrImage });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Endpoint para enviar mensagem
app.post('/send/:id', async (req, res) => {
  const id = req.params.id;
  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ status: 'error', error: 'Número e mensagem são obrigatórios' });
  }

  const c = getClient(id);
  if (!c.ready) {
    return res.status(400).json({ status: 'error', error: 'Cliente não está pronto' });
  }

  try {
    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    await c.client.sendMessage(chatId, message);
    res.json({ status: 'success', message: 'Mensagem enviada' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
