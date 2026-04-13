# Brique Server (Node.js)

Backend standalone para quando você exportar o projeto do Lovable.

## Setup

```bash
cd server
npm install
cp .env.example .env
# Preencha as variáveis no .env
npm start
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão: 3001) |
| `PIX_KEY_PHONE` | Chave PIX (celular com DDD) |
| `TELEGRAM_BOT_TOKEN` | Token do bot do Telegram (via @BotFather) |
| `TELEGRAM_CHAT_ID` | ID do chat para notificações |

## Endpoints

### `POST /api/pix-qrcode`
Gera o payload PIX EMV/BR Code.

```json
{ "amount": "39.90", "merchantName": "Gustavo Souza", "merchantCity": "Brasil" }
```

### `POST /api/notify-telegram`
Envia notificação de compra via Telegram.

```json
{
  "buyerName": "João",
  "buyerEmail": "joao@email.com",
  "buyerPhone": "(11) 99999-9999",
  "productName": "Grupo Brique",
  "price": "R$ 39,90"
}
```

## Adaptando o frontend

No frontend, troque as chamadas de `supabase.functions.invoke()` por `fetch()`:

```ts
// Antes (Lovable/Supabase):
const { data } = await supabase.functions.invoke('pix-qrcode', { body: {...} });

// Depois (Node.js):
const res = await fetch('http://localhost:3001/api/pix-qrcode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...}),
});
const data = await res.json();
```
