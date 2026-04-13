import { useState } from "react";
import { motion } from "framer-motion";

const productImage = "https://cdn.jsdelivr.net/gh/UnionJSxz/BaseSkin@main/Futuro%20digital%20e%20confian%C3%A7a%20pessoal.png";
import PaymentSidebar from "@/components/PaymentSidebar";

const PRODUCT = {
  name: "Grupo Brique",
  subtitle: "Acesso Exclusivo",
  price: "R$ 39,90",
  
  description:
    "Descubra, na prática, como construir uma renda sólida através da compra e venda de produtos, mesmo começando do zero, aprendendo estratégias testadas, técnicas de negociação e como identificar oportunidades lucrativas no mercado local e online.",
};

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full z-30 bg-background/90 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-5">
          <span className="font-display text-lg font-bold text-foreground tracking-tight">
            Gustavo Souza<span className="text-primary">.</span>
          </span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            Comprar
          </button>
        </div>
      </header>

      <main className="container px-5 md:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[calc(100vh-6rem)]">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col justify-center order-2 lg:order-1 text-center lg:text-left items-center lg:items-start"
          >
            <p className="text-xs text-muted-foreground font-body uppercase tracking-[0.35em] font-semibold mb-4 md:mb-6">
              Acesso Exclusivo
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.05] mb-4 md:mb-6">
              {PRODUCT.name}
            </h1>

            <p className="font-body text-sm leading-relaxed text-muted-foreground max-w-md mb-6 md:mb-10">
              {PRODUCT.description}
            </p>

            <div className="mb-6 md:mb-8">
              <p className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                {PRODUCT.price}
              </p>
            </div>

            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full sm:w-fit px-10 py-4 bg-primary text-primary-foreground font-body font-semibold text-sm tracking-wide rounded-sm hover:opacity-90 transition-opacity"
            >
              Adquirir Agora
            </button>
            <p className="text-xs text-muted-foreground font-body mt-3 flex items-center gap-1.5">
              🔒 Pagamento seguro
            </p>
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
            className="relative order-1 lg:order-2 flex items-center justify-center"
          >
            <img
              src={productImage}
              alt={PRODUCT.name}
              className="w-full max-h-[50vh] sm:max-h-[60vh] lg:max-h-none h-auto rounded object-cover"
              width={896}
              height={1152}
              loading="lazy"
            />
          </motion.div>
        </div>
      </main>

      <PaymentSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        productName={`${PRODUCT.name} — ${PRODUCT.subtitle}`}
        price={PRODUCT.price}
      />
    </div>
  );
};

export default Index;
