import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function computeCRC16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
    crc &= 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

function generatePixPayload(pixKey: string, merchantName: string, merchantCity: string, amount: string, txId: string): string {
  const gui = tlv("00", "br.gov.bcb.pix");
  const key = tlv("01", pixKey);
  const merchantAccountInfo = tlv("26", gui + key);

  let payload = "";
  payload += tlv("00", "01"); // Payload Format Indicator
  payload += merchantAccountInfo;
  payload += tlv("52", "0000"); // Merchant Category Code
  payload += tlv("53", "986"); // Transaction Currency (BRL)
  if (amount && amount !== "0") {
    payload += tlv("54", amount);
  }
  payload += tlv("58", "BR"); // Country Code
  payload += tlv("59", merchantName.substring(0, 25));
  payload += tlv("60", merchantCity.substring(0, 15));
  
  const additionalData = tlv("05", txId.substring(0, 25));
  payload += tlv("62", additionalData);

  // CRC placeholder
  payload += "6304";
  const crc = computeCRC16(payload);
  payload += crc;

  return payload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, merchantName, merchantCity } = await req.json();
    const pixKey = Deno.env.get("PIX_KEY_PHONE") || "";

    if (!pixKey) {
      return new Response(JSON.stringify({ error: "PIX key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format phone: ensure +55 prefix
    const cleanPhone = pixKey.replace(/\D/g, "");
    const formattedKey = cleanPhone.startsWith("55") ? `+${cleanPhone}` : `+55${cleanPhone}`;

    const txId = "GRUPOBRIQUE" + Date.now().toString().slice(-8);
    const payload = generatePixPayload(
      formattedKey,
      merchantName || "Gustavo Souza",
      merchantCity || "Brasil",
      amount || "39.90",
      txId
    );

    return new Response(JSON.stringify({ payload, pixKey: formattedKey }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
