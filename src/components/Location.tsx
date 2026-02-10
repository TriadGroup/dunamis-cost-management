import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MapPin, Phone, Clock, MessageCircle, Navigation } from 'lucide-react';

const WHATSAPP_NUMBER = '5513997149974';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de agendar uma avaliação com a Dra. Mayara Paccola em Registro/SP.')}`;
const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=R.+José+Antônio+de+Campos,+480+-+Centro,+Registro+-+SP,+11900-000';

export const Location = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="localizacao" className="section-dark py-24 md:py-32">
      <div className="container-narrow">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-4">
            Localização
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
                  R. José Antônio de Campos, 480 — Centro<br />Registro — SP, 11900-000
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground-light mb-1">WhatsApp</h3>
                <p className="text-foreground-light/70">+55 (13) 99714-9974</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground-light mb-1">Horário</h3>
                <p className="text-foreground-light/70">
                  Fechado · Abre ter. às 09:00
                </p>
                <p className="text-foreground-light/50 text-sm mt-1">
                  Atendimento com horário marcado. Confirme disponibilidade no WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary-dark text-sm"
              >
                <Navigation className="w-4 h-4" />
                Abrir no Maps
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Chamar no WhatsApp
              </a>
              <a
                href="tel:+5513997149974"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/20 text-foreground-light/70 rounded-full text-sm font-medium transition-all hover:border-white/40 hover:text-foreground-light"
              >
                <Phone className="w-4 h-4" />
                Ligar
              </a>
            </div>
          </motion.div>

          {/* Map embed */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden border border-white/10"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3645.5!2d-47.8441!3d-24.4871!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sR.+Jos%C3%A9+Ant%C3%B4nio+de+Campos%2C+480+-+Centro%2C+Registro+-+SP!5e0!3m2!1spt-BR!2sbr!4v1700000000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização da clínica"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};