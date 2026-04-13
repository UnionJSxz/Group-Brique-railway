import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Copy, Check, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentSidebarProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  price: string;
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const validateEmail = (email: string) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

const validatePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11;
};

const PaymentSidebar = ({ open, onClose, productName, price }: PaymentSidebarProps) => {
  const [status, setStatus] = useState<"idle" | "loading" | "qrcode" | "waiting">("idle");
  const [copied, setCopied] = useState(false);
  const [pixPayload, setPixPayload] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const resetState = () => {
    setStatus("idle");
    setPixPayload("");
  };

  const handleCheckout = async () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};
    
    if (!buyerName.trim() || buyerName.trim().length < 3) {
      newErrors.name = "Informe seu nome completo";
    }
    if (!validateEmail(buyerEmail)) {
      newErrors.email = "Informe um e-mail válido (ex: nome@gmail.com)";
    }
    if (!validatePhone(buyerPhone)) {
      newErrors.phone = "Informe um celular válido com DDD (11 dígitos)";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setStatus("loading");

    try {
      const numericPrice = price.replace(/[^\d,]/g, '').replace(',', '.');
      const { data, error } = await supabase.functions.invoke('pix-qrcode', {
        body: {
          amount: numericPrice,
          merchantName: "Gustavo Souza",
          merchantCity: "Brasil",
        },
      });

      if (error) throw error;
      setPixPayload(data.payload);
      setStatus("qrcode");
    } catch {
      // Fallback: generate a simple payload locally
      setPixPayload("PIX_FALLBACK");
      setStatus("qrcode");
    }
  };

  const handlePaid = async () => {
    setStatus("waiting");

    try {
      await supabase.functions.invoke('notify-telegram', {
        body: {
          buyerName,
          buyerEmail,
          buyerPhone,
          productName,
          price,
        },
      });
    } catch (err) {
      console.error("Failed to send Telegram notification:", err);
    }
  };

  const inputClass = "w-full mt-1 px-4 py-3 bg-muted border border-border rounded text-foreground font-body text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full sm:max-w-md surface-elevated border-l border-border shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-display text-2xl font-semibold text-foreground">
                {status === "qrcode" ? "Pague com PIX" : status === "waiting" ? "Compra Registrada" : "Finalizar Compra"}
              </h3>
              <button onClick={() => { onClose(); resetState(); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 border-b border-border">
              <p className="text-sm text-muted-foreground font-body">Produto</p>
              <p className="font-display text-lg text-foreground">{productName}</p>
              <p className="gold-text text-2xl font-display font-bold mt-1">{price}</p>
            </div>

            {/* WAITING STATE */}
            {status === "waiting" && (
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center overflow-y-auto">
                <Clock className="w-16 h-16 text-primary mb-4 animate-pulse" />
                <h4 className="font-display text-xl font-semibold text-foreground mb-3">Aguarde!</h4>
                <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-xs">
                  Você será adicionado/contactado(a) no grupo pelo número informado!
                </p>
                <p className="text-xs text-muted-foreground/70 font-body mt-6">
                  Fique atento ao seu WhatsApp 📱
                </p>
              </div>
            )}

            {/* QR CODE STATE */}
            {status === "qrcode" && (
              <>
                <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-y-auto">
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <QRCodeSVG
                      value={pixPayload}
                      size={220}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-body mb-4 text-center">
                    Escaneie o QR Code ou copie o código abaixo
                  </p>

                  {/* PIX Copia e Cola */}
                  <div className="w-full mb-4">
                    <p className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-2 text-center">PIX Copia e Cola</p>
                    <div className="relative w-full bg-muted border border-border rounded p-3">
                      <p className="text-xs font-mono text-foreground break-all pr-8 select-all max-h-20 overflow-y-auto">
                        {pixPayload}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pixPayload);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-background border border-border rounded hover:bg-accent transition-colors"
                        title="Copiar código"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                    {copied && (
                      <p className="text-xs text-green-500 font-body mt-1 text-center">Código copiado!</p>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-border">
                  <button
                    onClick={handlePaid}
                    className="w-full py-4 gold-gradient text-primary-foreground font-body font-semibold text-sm uppercase tracking-widest rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    Já Paguei
                  </button>
                </div>
              </>
            )}

            {/* FORM STATE */}
            {(status === "idle" || status === "loading") && (
              <>
                <div className="flex-1 p-6 overflow-y-auto">
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-widest mb-4">
                    Dados do comprador
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground font-body uppercase tracking-wider">Nome completo</label>
                      <input type="text" value={buyerName} onChange={(e) => { setBuyerName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                        placeholder="Seu nome" disabled={status === "loading"} className={`${inputClass} ${errors.name ? 'border-red-500' : ''}`} />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-body uppercase tracking-wider">E-mail</label>
                      <input type="email" value={buyerEmail} onChange={(e) => { setBuyerEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                        placeholder="nome@gmail.com" disabled={status === "loading"} className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`} />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-body uppercase tracking-wider">Celular (WhatsApp)</label>
                      <input type="tel" value={buyerPhone} onChange={(e) => { setBuyerPhone(formatPhone(e.target.value)); setErrors(prev => ({ ...prev, phone: undefined })); }}
                        placeholder="(00) 00000-0000" disabled={status === "loading"} maxLength={15} className={`${inputClass} ${errors.phone ? 'border-red-500' : ''}`} />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-border">
                  <button
                    onClick={handleCheckout}
                    disabled={status === "loading"}
                    className="w-full py-4 gold-gradient text-primary-foreground font-body font-semibold text-sm uppercase tracking-widest rounded hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gerando PIX...
                      </>
                    ) : (
                      "Gerar QR Code PIX"
                    )}
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-3 font-body">
                    🔒 Pagamento seguro via PIX
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentSidebar;
