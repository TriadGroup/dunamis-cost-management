import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Harmonização fica natural?',
    answer: 'Sim. Nosso foco é realçar sua beleza de forma equilibrada, respeitando seus traços e proporções. Nada de exageros — o resultado é pensado para parecer naturalmente bonito.',
  },
  {
    question: 'Como funciona a avaliação?',
    answer: 'Na avaliação, conversamos sobre seus objetivos, analisamos seu perfil (pele, traços, saúde) e montamos um plano personalizado. É o momento para tirar todas as suas dúvidas antes de qualquer procedimento.',
  },
  {
    question: 'Quantas sessões posso precisar?',
    answer: 'Depende do procedimento e do seu objetivo. Alguns tratamentos mostram resultado em sessão única; outros podem precisar de um protocolo com mais sessões. Tudo é explicado na avaliação.',
  },
  {
    question: 'Posso combinar procedimentos?',
    answer: 'Em muitos casos, sim. Combinar procedimentos pode otimizar resultados. A Dra. Mayara avalia cada caso e indica o que faz sentido para você, sempre priorizando segurança.',
  },
  {
    question: 'Tem tempo de recuperação?',
    answer: 'Varia conforme o procedimento. A maioria dos tratamentos oferecidos é minimamente invasiva, com pouco ou nenhum tempo de recuperação. Na avaliação, explicamos tudo em detalhes.',
  },
];

export const FAQ = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="section-light py-24 md:py-32">
      <div className="container-narrow">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Dúvidas Frequentes
          </p>
          <h2 className="text-display-lg text-foreground">
            Perguntas comuns
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 * index }}
              className="border border-border rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left bg-card hover:bg-muted/30 transition-colors"
              >
                <span className="font-display text-lg text-foreground pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: openIndex === index ? 'auto' : 0, opacity: openIndex === index ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-muted-foreground">{faq.answer}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};