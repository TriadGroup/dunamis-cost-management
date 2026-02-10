import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, User, Scissors, MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '5513997149974';

const tabs = [
  {
    id: 'facial',
    label: 'Facial',
    icon: Sparkles,
    procedures: [
      { name: 'Botox', tagline: 'Suavidade nas expressões', bullets: ['Aplicação precisa e cuidadosa', 'Aparência descansada e natural'] },
      { name: 'Preenchimento', tagline: 'Volume e contorno com delicadeza', bullets: ['Produtos de alta qualidade', 'Harmonia com os traços do rosto'] },
      { name: 'Bioestimulador de colágeno', tagline: 'Firmeza e rejuvenescimento', bullets: ['Estímulo natural do colágeno', 'Resultado progressivo e duradouro'] },
      { name: 'Skinbooster', tagline: 'Hidratação profunda', bullets: ['Melhora da qualidade da pele', 'Mais viço e luminosidade'] },
      { name: 'Microagulhamento', tagline: 'Renovação celular', bullets: ['Estímulo de colágeno e elastina', 'Pele mais uniforme e saudável'] },
      { name: 'Peeling', tagline: 'Renovação e uniformidade', bullets: ['Tratamento de manchas e textura', 'Pele renovada e luminosa'] },
      { name: 'Laser para rejuvenescimento facial', tagline: 'Tecnologia avançada', bullets: ['Tratamento preciso e eficaz', 'Rejuvenescimento com segurança'] },
      { name: 'Lavieen', tagline: 'Tecnologia coreana', bullets: ['Tratamento de melasma e manchas', 'Resultados desde as primeiras sessões'] },
      { name: 'Lifting temporal não cirúrgico', tagline: 'Efeito lifting sem cirurgia', bullets: ['Procedimento minimamente invasivo', 'Reposicionamento dos tecidos faciais'] },
      { name: 'Endolifting', tagline: 'Sustentação e firmeza', bullets: ['Tecnologia a laser', 'Flacidez facial e corporal'] },
      { name: 'Intradermoterapia facial', tagline: 'Nutrição direta para a pele', bullets: ['Vitaminas e ativos injetáveis', 'Revitalização profunda'] },
    ],
  },
  {
    id: 'corporal',
    label: 'Corporal',
    icon: User,
    procedures: [
      { name: 'Ultraformer', tagline: 'Ultrassom microfocado', bullets: ['Lifting sem cirurgia', 'Firmeza e contorno corporal'] },
      { name: 'Intradermoterapia corporal', tagline: 'Tratamento localizado', bullets: ['Redução de gordura localizada', 'Melhora de celulite'] },
      { name: 'Protocoll', tagline: 'Protocolo personalizado', bullets: ['Combinação de técnicas avançadas', 'Resultado otimizado'] },
    ],
  },
  {
    id: 'capilar',
    label: 'Capilar',
    icon: Scissors,
    procedures: [
      { name: 'Intradermoterapia capilar', tagline: 'Fortalecimento dos fios', bullets: ['Nutrientes direto no couro cabeludo', 'Combate à queda e afinamento'] },
    ],
  },
];

interface ProceduresProps {
  onSelectProcedure: (procedure: string) => void;
}

export const Procedures = ({ onSelectProcedure }: ProceduresProps) => {
  const [activeTab, setActiveTab] = useState('facial');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  const buildWhatsAppUrl = (procedureName: string) => {
    const msg = `Olá! Gostaria de saber mais sobre ${procedureName} com a Dra. Mayara Paccola em Registro/SP.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <section id="procedimentos" className="section-dark py-24 md:py-32 overflow-hidden">
      <div className="container-narrow">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-accent mb-4">
            Procedimentos
          </p>
          <h2 className="text-display-lg text-foreground-light mb-4">
            Encontre o cuidado <span className="italic">ideal</span>
          </h2>
          <p className="text-body text-foreground-light/70 max-w-xl mx-auto">
            Cada procedimento é adaptado às suas necessidades. Resultados variam e dependem de avaliação individualizada.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-white/20 text-foreground-light/70 hover:border-white/40'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Procedure cards */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid sm:grid-cols-2 gap-6"
        >
          {currentTab.procedures.map((proc, i) => (
            <motion.div
              key={proc.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="card-dark flex flex-col"
            >
              <h3 className="font-display text-xl text-foreground-light mb-1">{proc.name}</h3>
              <p className="text-sm text-accent mb-4 italic">{proc.tagline}</p>
              <ul className="space-y-2 mb-6 flex-grow">
                {proc.bullets.map((b) => (
                  <li key={b} className="text-sm text-foreground-light/70 flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-accent mt-2 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onSelectProcedure(proc.name)}
                  className="text-sm text-accent font-medium hover:underline"
                >
                  Quero avaliar →
                </button>
                <a
                  href={buildWhatsAppUrl(proc.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-light/50 hover:text-foreground-light/80 inline-flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};