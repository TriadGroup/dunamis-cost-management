import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ClipboardCheck, UserCheck, HeartHandshake, Star, Quote } from 'lucide-react';

const trustCards = [
  { icon: ClipboardCheck, title: 'Avaliação completa', desc: 'Análise detalhada dos seus objetivos e expectativas.' },
  { icon: UserCheck, title: 'Plano personalizado', desc: 'Tratamento sob medida para o resultado que você deseja.' },
  { icon: HeartHandshake, title: 'Acompanhamento', desc: 'Suporte em todas as etapas do seu tratamento.' },
];

const testimonials = [
  { text: 'Atendimento impecável! Me senti segura desde a primeira consulta.', author: 'Paciente' },
  { text: 'Resultado super natural, exatamente o que eu queria.', author: 'Paciente' },
  { text: 'A Dra. Vanessa é muito atenciosa e explica tudo com clareza.', author: 'Paciente' },
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
            Um atendimento pensado para você se sentir segura e bem cuidada.
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

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + 0.1 * i }}
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
      </div>
    </section>
  );
};