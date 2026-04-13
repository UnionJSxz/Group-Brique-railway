require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files (após build: npm run build no root)
app.use(express.static(path.join(__dirname, "../dist")));

// ============================================================
// PIX QR Code - Gera payload EMV/BR Code estático
// ============================================================

function computeCRC16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id, value) {
  return id + value.length.toString().padStart(2, "0") + value;
}

function generatePixPayload(pixKey, merchantName, merchantCity, amount, txId) {
  const gui = tlv("00", "br.gov.bcb.pix");
  const key = tlv("01", pixKey);
  const merchantAccountInfo = tlv("26", gui + key);

  let payload = "";
  payload += tlv("00", "01");
  payload += merchantAccountInfo;
  payload += tlv("52", "0000");
  payload += tlv("53", "986");
  if (amount && amount !== "0") {
    payload += tlv("54", amount);
  }
  payload += tlv("58", "BR");
  payload += tlv("59", merchantName.substring(0, 25));
  payload += tlv("60", merchantCity.substring(0, 15));
  payload += tlv("62", tlv("05", txId.substring(0, 25)));
  payload += "6304";
  payload += computeCRC16(payload);
  return payload;
}

app.post("/api/pix-qrcode", (req, res) => {
  try {
    const { amount, merchantName, merchantCity } = req.body;
    const pixKey = process.env.PIX_KEY_PHONE || "";

    if (!pixKey) {
      return res.status(500).json({ error: "PIX key not configured" });
    }

    const cleanPhone = pixKey.replace(/\D/g, "");
    const formattedKey = cleanPhone.startsWith("55")
      ? `+${cleanPhone}`
      : `+55${cleanPhone}`;

    const txId = "GRUPOBRIQUE" + Date.now().toString().slice(-8);
    const payload = generatePixPayload(
      formattedKey,
      merchantName || "Gustavo Souza",
      merchantCity || "Brasil",
      amount || "39.90",
      txId
    );

    res.json({ payload, pixKey: formattedKey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Notificação Telegram - Envia direto para a API do Telegram
// ============================================================

app.post("/api/notify-telegram", async (req, res) => {
  try {
    const { buyerName, buyerEmail, buyerPhone, productName, price } = req.body;

    if (!buyerName || !buyerEmail || !buyerPhone) {
      return res.status(400).json({ error: "Missing buyer information" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken) return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not configured" });
    if (!chatId) return res.status(500).json({ error: "TELEGRAM_CHAT_ID not configured" });

    const message =
      `🛒 *Nova Compra!*\n\n` +
      `📦 *Produto:* ${productName}\n` +
      `💰 *Valor:* ${price}\n\n` +
      `👤 *Nome:* ${buyerName}\n` +
      `📧 *E-mail:* ${buyerEmail}\n` +
      `📱 *Celular:* ${buyerPhone}\n\n` +
      `⏰ ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Start
// ============================================================

// SPA fallback — qualquer rota não-API serve o index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
