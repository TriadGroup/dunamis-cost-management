import { motion } from 'framer-motion';
import { ChevronDown, MessageCircle, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-vanessa.jpg';

const WHATSAPP_NUMBER = '5537999833437';

export const Hero = () => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImage} alt="Sorriso harmonioso e natural" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
      </div>

      <div className="relative z-10 container-narrow text-center text-foreground-light pt-20 pb-32">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-sm md:text-base font-medium tracking-[0.2em] uppercase text-primary mb-6"
        >
          Dra. Vanessa Ribeiro
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-display-xl text-foreground-light mb-6"
        >
          Sorriso harmônico.
          <br />
          <span className="italic">Presença forte.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-body-lg text-foreground-light/80 max-w-2xl mx-auto mb-10"
        >
          Harmonização Facial & Lentes — naturalidade com técnica e cuidado.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button onClick={() => scrollToSection('#agendar')} className="btn-primary text-base">
            <MessageCircle className="w-5 h-5" />
            Agendar avaliação
          </button>
          <button onClick={() => scrollToSection('#procedimentos')} className="btn-secondary-dark text-base">
            Ver procedimentos
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-10 text-sm text-foreground-light/60"
        >
          Atendimento personalizado • foco em naturalidade • resultados reais
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer"
        onClick={() => scrollToSection('#confianca')}
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <ChevronDown className="w-6 h-6 text-foreground-light/60" />
        </motion.div>
      </motion.div>
    </section>
  );
};