import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MessageCircle, Check, AlertCircle, Clock, Copy, Sparkles, User, Scissors } from 'lucide-react';

const WHATSAPP_NUMBER = '5513997149974';

const allServices = [
  'Avaliação personalizada',
  'Botox',
  'Preenchimento',
  'Bioestimulador de colágeno',
  'Ultraformer',
  'Skinbooster',
  'Microagulhamento',
  'Peeling',
  'Laser para rejuvenescimento facial',
  'Lavieen',
  'Endolifting',
  'Lifting temporal não cirúrgico',
  'Intradermoterapia facial',
  'Intradermoterapia corporal',
  'Intradermoterapia capilar',
  'Protocoll',
];

const objetivoOptions = [
  'Rejuvenescimento facial',
  'Harmonização facial',
  'Tratamento corporal',
  'Tratamento capilar',
  'Melhora da qualidade da pele',
  'Outro',
];

const horarioOptions = ['Manhã', 'Tarde', 'Sem preferência'];

interface AgendamentoExpressProps {
  initialService?: string;
  onServiceChange?: () => void;
}

export const AgendamentoExpress = ({ initialService, onServiceChange }: AgendamentoExpressProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [horario, setHorario] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [observation, setObservation] = useState('');
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<{ services?: boolean }>({});

  useEffect(() => {
    if (initialService && !selectedServices.includes(initialService)) {
      setSelectedServices([initialService]);
      onServiceChange?.();
    }
  }, [initialService]);

  const whatsAppMessage = useMemo(() => {
    return `Olá! Meu nome é ${name.trim() || '—'}. Gostaria de agendar uma avaliação com a Dra. Mayara Paccola em Registro/SP. Tenho interesse em: ${selectedServices.length > 0 ? selectedServices.join(', ') : '—'}. Melhor horário: ${horario || '—'}. ${objetivo ? `Objetivo: ${objetivo}. ` : ''}${observation.trim() ? `Observação: ${observation.trim()}.` : ''}`;
  }, [selectedServices, name, horario, objetivo, observation]);

  const isFormValid = selectedServices.length > 0;

  const toggleService = (serviceName: string) => {
    setErrors({});
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const handleWhatsApp = () => {
    if (selectedServices.length === 0) {
      setErrors({ services: true });
      return;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(url, '_blank');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = whatsAppMessage;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="agendar" className="section-light py-16 md:py-24 overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground mb-3">
            Monte seu atendimento
          </p>
          <h2 className="text-display-md text-foreground mb-3 break-words hyphens-auto">
            Agende em segundos
          </h2>
          <p className="text-body text-muted-foreground">
            Selecione os procedimentos e envie sua mensagem via WhatsApp.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-6"
        >
          {/* STEP 1 — Services */}
          <div className="card-light">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground">
                1. O que te interessa?
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {allServices.map((service) => {
                const isSelected = selectedServices.includes(service);
                return (
                  <button
                    key={service}
                    onClick={() => toggleService(service)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-all duration-200 touch-manipulation ${
                      isSelected
                        ? 'border-secondary bg-secondary text-secondary-foreground'
                        : 'border-border bg-card hover:border-secondary/50'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span className="whitespace-nowrap">{service}</span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {errors.services && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 text-sm text-destructive mt-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Selecione pelo menos 1 procedimento
                </motion.p>
              )}
            </AnimatePresence>

            {selectedServices.length > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                ✓ {selectedServices.length} selecionado{selectedServices.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* STEP 2 — Optional details */}
          <div className="card-light">
            <h3 className="text-base font-medium text-foreground mb-4">
              2. Seus dados (opcional)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Seu nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como podemos te chamar?"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Melhor horário</label>
                <div className="flex flex-wrap gap-2">
                  {horarioOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setHorario(horario === opt ? '' : opt)}
                      className={`px-3 py-2 rounded-full border text-sm transition-all touch-manipulation ${
                        horario === opt
                          ? 'border-secondary bg-secondary text-secondary-foreground'
                          : 'border-border bg-card hover:border-secondary/50'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Objetivo principal</label>
                <select
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all text-sm"
                >
                  <option value="">Selecione (opcional)</option>
                  {objetivoOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Observação</label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value.slice(0, 160))}
                  placeholder="Alguma dúvida ou comentário?"
                  rows={2}
                  maxLength={160}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{observation.length}/160</p>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleWhatsApp}
              disabled={!isFormValid}
              className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-secondary text-secondary-foreground font-medium rounded-full transition-all duration-300 text-base ${
                isFormValid ? 'hover:opacity-90 hover:shadow-lg active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              Enviar no WhatsApp
            </button>

            <button
              onClick={handleCopy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-full font-medium text-sm transition-all hover:bg-muted/50"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar mensagem
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Agendamento sujeito à confirmação. Responderemos o mais rápido possível.
          </p>
        </motion.div>
      </div>
    </section>
  );
};