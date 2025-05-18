# WhatsSeven

API para conexão de múltiplos números de WhatsApp e envio de mensagens em massa, usando `whatsapp-web.js`.

## Endpoints

- `GET /qr/:sessionId` - Gera QR code para conexão
- `GET /status/:sessionId` - Retorna o status da sessão
- `POST /send/:sessionId` - Envia mensagem

## Variáveis de ambiente

- `PORT`: porta para rodar a API (ex: 3000)
- `SESSION_PATH`: pasta onde ficam os dados de sessão (ex: ./sessions)