import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import draMayaraImg from '@/assets/dra-mayara.jpg';

const WHATSAPP_NUMBER = '5513997149974';

export const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="sobre" className="section-dark py-24 md:py-32">
      <div className="container-narrow">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden aspect-[3/4]">
              <img
                src={draMayaraImg}
                alt="Dra. Mayara Paccola — Estética Avançada"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border border-accent/20 rounded-2xl" />
          </motion.div>

          {/* Bio */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-4">
              Sobre
            </p>
            <h2 className="text-display-md text-foreground-light mb-6">
              Dra. Mayara Paccola
            </h2>
            <p className="text-body text-foreground-light/70 mb-6">
              Especialista em Harmonização Facial e Corporal, Rejuvenescimento e Estética Avançada. 
              Com foco em naturalidade e segurança, a Dra. Mayara busca resultados que respeitem 
              a individualidade de cada paciente, sempre com técnica e cuidado.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Foco em naturalidade e harmonia',
                'Técnicas avançadas de rejuvenescimento',
                'Atendimento humanizado e acolhedor',
                'Avaliação 5,0 no Google (120 avaliações)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground-light/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Quero falar com a Dra. Mayara Paccola.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};