import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ClipboardCheck, UserCheck, HeartHandshake, Star, Quote } from 'lucide-react';

const WHATSAPP_NUMBER = '5513997149974';

const trustCards = [
  { icon: ClipboardCheck, title: 'Avaliação personalizada', desc: 'Análise detalhada dos seus objetivos, pele e traços faciais.' },
  { icon: UserCheck, title: 'Plano de cuidados', desc: 'Procedimentos e orientações sob medida para o seu perfil.' },
  { icon: HeartHandshake, title: 'Acompanhamento seguro', desc: 'Suporte e acompanhamento em todas as etapas.' },
];

const testimonials = [
  { text: 'Com certeza uma das melhores profissionais da área...', author: 'Carol Capoani' },
  { text: 'Profissional maravilhosa, ótimo atendimento e os melhores resultados!', author: 'Fernanda Rafaela Freitas' },
  { text: 'Todas que fazem parte da equipe estão de parabéns!', author: 'Joseilla Merielli Paggi Giavarotti' },
];

export const Trust = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="confianca" className="section-light py-24 md:py-32">
      <div className="container-narrow">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-display-lg text-foreground mb-4">
            Confiança em cada <span className="italic">detalhe</span>
          </h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto">
            Clínica especializada em Harmonização Facial e Corporal, Rejuvenescimento e Estética Avançada.
          </p>
        </motion.div>

        {/* Trust cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-20">
          {trustCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="card-light text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/30 flex items-center justify-center mx-auto mb-4">
                <card.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="font-display text-xl font-medium text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Rating badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 bg-card rounded-full px-6 py-3 shadow-[var(--shadow-soft)] border border-border/50">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-sm font-medium text-foreground">5,0</span>
            <span className="text-sm text-muted-foreground">(120 avaliações no Google)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">5/5 Facebook · 3 votos</p>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 + 0.1 * i }}
              className="card-light relative"
            >
              <Quote className="w-6 h-6 text-secondary/30 absolute top-6 right-6" />
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground font-display italic mb-4">"{t.text}"</p>
              <p className="text-sm text-muted-foreground">— {t.author}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de agendar uma avaliação com a Dra. Mayara Paccola em Registro/SP.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            Agendar avaliação
          </a>
        </div>
      </div>
    </section>
  );
};