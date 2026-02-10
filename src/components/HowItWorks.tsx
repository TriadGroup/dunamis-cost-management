import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ClipboardList, FileText, ShieldCheck } from 'lucide-react';

const steps = [
  { icon: ClipboardList, number: '01', title: 'Avaliação personalizada', desc: 'Entendemos seus objetivos e analisamos seu perfil completo.' },
  { icon: FileText, number: '02', title: 'Plano de cuidados', desc: 'Montamos o plano com procedimentos e orientações sob medida.' },
  { icon: ShieldCheck, number: '03', title: 'Acompanhamento seguro', desc: 'Realizamos o procedimento e fazemos o acompanhamento com segurança.' },
];

export const HowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="como-funciona" className="section-light py-24 md:py-32">
      <div className="container-narrow">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Como funciona
          </p>
          <h2 className="text-display-lg text-foreground">
            3 passos para o seu <span className="italic">resultado</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 * i }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/30 flex items-center justify-center mx-auto mb-5">
                <step.icon className="w-7 h-7 text-foreground" />
              </div>
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-accent mb-2 block">
                Passo {step.number}
              </span>
              <h3 className="font-display text-xl font-medium text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};