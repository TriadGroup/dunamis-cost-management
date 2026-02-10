import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Como funciona a avaliação?',
    answer: 'Na avaliação, conversamos sobre seus objetivos, analisamos seu perfil facial e dental, e montamos um plano personalizado. É o momento para tirar todas as suas dúvidas.',
  },
  {
    question: 'Dói? Tem tempo de recuperação?',
    answer: 'Depende do procedimento. Muitos são minimamente invasivos e com pouco desconforto. Na avaliação, explicamos tudo sobre o processo e a recuperação do procedimento escolhido.',
  },
  {
    question: 'Quanto tempo dura?',
    answer: 'A duração varia conforme o procedimento. Lentes podem durar muitos anos com bons cuidados. Harmonizações faciais têm durações variáveis. Cada caso é avaliado individualmente.',
  },
  {
    question: 'Fica natural?',
    answer: 'Naturalidade é nosso foco principal. Trabalhamos respeitando os traços e proporções de cada paciente, buscando harmonia e equilíbrio — nunca exageros.',
  },
  {
    question: 'Como é o planejamento do sorriso/lentes?',
    answer: 'Utilizamos planejamento digital para simular o resultado antes de iniciar. Assim você participa das decisões e tem uma prévia do resultado final.',
  },
  {
    question: 'Como posso agendar e quais horários?',
    answer: 'Basta usar o formulário de agendamento express nesta página ou clicar em "Agendar no WhatsApp". Atendemos de segunda a sexta, e sábados com agendamento prévio.',
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
                className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-muted/30 transition-colors"
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