import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MapPin, Phone, Clock, MessageCircle, Instagram } from 'lucide-react';

const WHATSAPP_NUMBER = '5537999833437';

export const Contact = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="contato" className="section-dark py-24 md:py-32">
      <div className="container-narrow">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-4">
            Contato
          </p>
          <h2 className="text-display-lg text-foreground-light mb-4">
            Venha nos conhecer
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground-light mb-1">Endereço</h3>
                <p className="text-foreground-light/70">
                  [Endereço da clínica]<br />[Cidade — UF]
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground-light mb-1">WhatsApp</h3>
                <p className="text-foreground-light/70">+55 37 99983-3437</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground-light mb-1">Atendimento</h3>
                <p className="text-foreground-light/70">
                  Segunda a Sexta, 8h às 18h<br />Sábados com agendamento
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de agendar uma avaliação com a Dra. Vanessa Ribeiro.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-foreground-light/70 hover:text-foreground-light hover:border-white/40 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          {/* Map placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-card-dark border border-white/10 flex items-center justify-center"
          >
            <div className="text-center text-foreground-light/30">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Mapa em breve</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};