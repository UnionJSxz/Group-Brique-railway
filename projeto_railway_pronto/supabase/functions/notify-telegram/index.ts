import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    const { buyerName, buyerEmail, buyerPhone, productName, price } = await req.json();

    if (!buyerName || !buyerEmail || !buyerPhone) {
      return new Response(JSON.stringify({ error: "Missing buyer information" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // First, get bot info to find the admin chat
    // The admin needs to have started a conversation with the bot first
    // We'll use a TELEGRAM_CHAT_ID secret for the admin's chat ID
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (!chatId) throw new Error("TELEGRAM_CHAT_ID is not configured");

    const message = `🛒 *Nova Compra!*\n\n` +
      `📦 *Produto:* ${productName}\n` +
      `💰 *Valor:* ${price}\n\n` +
      `👤 *Nome:* ${buyerName}\n` +
      `📧 *E-mail:* ${buyerEmail}\n` +
      `📱 *Celular:* ${buyerPhone}\n\n` +
      `⏰ ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`;

    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
