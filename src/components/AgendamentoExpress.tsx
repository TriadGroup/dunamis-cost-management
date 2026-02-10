import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { MessageCircle, Check, AlertCircle, Clock, Copy, Sparkles, Smile } from 'lucide-react';

const WHATSAPP_NUMBER = '5537999833437';

interface ServiceCategory {
  id: string;
  label: string;
  icon: typeof Smile;
  services: string[];
}

const categories: ServiceCategory[] = [
  {
    id: 'sorriso',
    label: 'Lentes & Sorriso',
    icon: Smile,
    services: [
      'Lentes de contato dental',
      'Clareamento dental',
      'Reabilitação/Estética do sorriso',
      'Avaliação do sorriso (planejamento)',
    ],
  },
  {
    id: 'harmonizacao',
    label: 'Harmonização Facial',
    icon: Sparkles,
    services: [
      'Harmonização facial (Full Face)',
      'Botox',
      'Preenchimento',
    ],
  },
];

const dayOptions = ['Hoje', 'Amanhã', 'Esta semana', 'Sábado'];
const periodOptions = ['Manhã', 'Tarde', 'Noite'];
const timeOptions = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

interface AgendamentoExpressProps {
  initialService?: string;
  onServiceChange?: () => void;
}

export const AgendamentoExpress = ({ initialService, onServiceChange }: AgendamentoExpressProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const [activeTab, setActiveTab] = useState('sorriso');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [name, setName] = useState('');
  const [observation, setObservation] = useState('');
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<{ services?: boolean; time?: boolean }>({});

  useEffect(() => {
    if (initialService && !selectedServices.includes(initialService)) {
      setSelectedServices([initialService]);
      // Find which tab has this service
      for (const cat of categories) {
        if (cat.services.includes(initialService)) {
          setActiveTab(cat.id);
          break;
        }
      }
      onServiceChange?.();
    }
  }, [initialService]);

  const objetivoPrincipal = selectedServices.length > 0 ? selectedServices[0] : '—';

  const whatsAppMessage = useMemo(() => {
    const timeStr = customTime.trim() || selectedTime || '—';
    const dayStr = selectedDay || '—';
    const periodStr = selectedPeriod || '—';
    const horarioFinal = customTime.trim() ? customTime.trim() : timeStr;

    return `Olá! Meu nome é ${name.trim() || '—'}. 😊
Quero uma avaliação com a Dra. Vanessa Ribeiro.

Meu objetivo principal: ${objetivoPrincipal}
Procedimentos de interesse: ${selectedServices.length > 0 ? selectedServices.join(', ') : '—'}

Preferência de horário: ${dayStr}, ${periodStr} — ${horarioFinal}
Observação: ${observation.trim() || 'sem observações'}

Pode me orientar sobre disponibilidade e como funciona a avaliação?`;
  }, [selectedServices, selectedDay, selectedPeriod, selectedTime, customTime, name, observation, objetivoPrincipal]);

  const hasTimeSelected = !!(customTime.trim() || selectedTime || (selectedDay && selectedPeriod));
  const isFormValid = selectedServices.length > 0 && hasTimeSelected;

  const toggleService = (serviceName: string) => {
    setErrors((prev) => ({ ...prev, services: false }));
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const handleWhatsApp = () => {
    const newErrors: { services?: boolean; time?: boolean } = {};
    if (selectedServices.length === 0) newErrors.services = true;
    if (!hasTimeSelected) newErrors.time = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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

  const currentCategory = categories.find((c) => c.id === activeTab)!;

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
            Agendamento Express
          </p>
          <h2 className="text-display-md text-foreground mb-3 break-words hyphens-auto">
            Agende em segundos
          </h2>
          <p className="text-body text-muted-foreground">
            Escolha o que deseja e envie sua mensagem via WhatsApp.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-6"
        >
          {/* STEP 1 — Services with tabs */}
          <div className="card-light">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground">
                1. O que você quer melhorar?
              </h3>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                    activeTab === cat.id
                      ? 'bg-secondary text-secondary-foreground'
                      : 'border border-border bg-white hover:border-secondary/50'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {currentCategory.services.map((service) => {
                const isSelected = selectedServices.includes(service);
                return (
                  <button
                    key={service}
                    onClick={() => toggleService(service)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm transition-all duration-200 touch-manipulation ${
                      isSelected
                        ? 'border-secondary bg-secondary text-secondary-foreground'
                        : 'border-border bg-white hover:border-secondary/50'
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
                  Selecione pelo menos 1 opção
                </motion.p>
              )}
            </AnimatePresence>

            {selectedServices.length > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                ✓ {selectedServices.length} selecionado{selectedServices.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* STEP 2 — Time */}
          <div className="card-light">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground">
                2. Quando você prefere?
              </h3>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Dia</p>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((day) => (
                  <button
                    key={day}
                    onClick={() => { setSelectedDay((p) => (p === day ? '' : day)); setErrors((p) => ({ ...p, time: false })); }}
                    className={`px-3 py-2 rounded-full border text-sm transition-all touch-manipulation ${
                      selectedDay === day
                        ? 'border-secondary bg-secondary text-secondary-foreground'
                        : 'border-border bg-white hover:border-secondary/50'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Período</p>
              <div className="flex flex-wrap gap-2">
                {periodOptions.map((period) => (
                  <button
                    key={period}
                    onClick={() => { setSelectedPeriod((p) => (p === period ? '' : period)); setErrors((p) => ({ ...p, time: false })); }}
                    className={`px-3 py-2 rounded-full border text-sm transition-all touch-manipulation ${
                      selectedPeriod === period
                        ? 'border-secondary bg-secondary text-secondary-foreground'
                        : 'border-border bg-white hover:border-secondary/50'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Horário sugerido</p>
              <div className="flex flex-wrap gap-2">
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    onClick={() => { setSelectedTime((p) => (p === time ? '' : time)); setCustomTime(''); setErrors((p) => ({ ...p, time: false })); }}
                    className={`px-3 py-2 rounded-full border text-sm transition-all touch-manipulation ${
                      selectedTime === time && !customTime.trim()
                        ? 'border-secondary bg-secondary text-secondary-foreground'
                        : 'border-border bg-white hover:border-secondary/50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Outro horário</p>
              <input
                type="text"
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  if (e.target.value.trim()) setSelectedTime('');
                  setErrors((p) => ({ ...p, time: false }));
                }}
                placeholder="Ex: quinta às 16h"
                className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all text-sm"
              />
            </div>

            <AnimatePresence>
              {errors.time && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 text-sm text-destructive mt-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Escolha um dia/período ou escreva um horário
                </motion.p>
              )}
            </AnimatePresence>

            {hasTimeSelected && (
              <div className="mt-4 p-3 bg-primary/30 rounded-xl">
                <p className="text-sm font-medium text-foreground flex items-center gap-2 break-words">
                  <Check className="w-4 h-4 text-foreground shrink-0" />
                  {customTime.trim()
                    ? `Horário: ${customTime.trim()}`
                    : `${selectedDay}${selectedPeriod ? ` (${selectedPeriod})` : ''}${selectedTime ? ` às ${selectedTime}` : ''}`}
                </p>
              </div>
            )}
          </div>

          {/* STEP 3 — Optional details */}
          <div className="card-light">
            <h3 className="text-base font-medium text-foreground mb-4">
              3. Seus dados (opcional)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Seu nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como podemos te chamar?"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">Observação</label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value.slice(0, 200))}
                  placeholder="Alguma dúvida ou comentário?"
                  rows={2}
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{observation.length}/200</p>
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
          <p className="text-xs text-muted-foreground text-center">
            <span className="opacity-70">Se o botão do WhatsApp não abrir, use "Copiar mensagem" e cole no app.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};