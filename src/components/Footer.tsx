import { motion } from 'framer-motion';
import { Logo } from './Logo';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="section-dark border-t border-white/10 py-12">
      <div className="container-narrow">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <Logo variant="light" showSubtitle />
            <p className="text-xs text-foreground-light/50 mt-2">
              R. José Antônio de Campos, 480 — Centro, Registro — SP
            </p>
            <p className="text-xs text-foreground-light/50">
              WhatsApp: +55 (13) 99714-9974
            </p>
          </div>

          <p className="text-sm text-foreground-light/50">
            © {currentYear} Dra. Mayara Paccola. Todos os direitos reservados.
          </p>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.8 }}
          className="mt-8 pt-8 border-t border-white/10 text-center space-y-2"
        >
          <p className="text-xs text-foreground-light/40">
            Os resultados dos procedimentos podem variar de pessoa para pessoa.
            As informações contidas neste site são de caráter informativo e não substituem
            a consulta profissional. Agende uma avaliação para um diagnóstico personalizado.
          </p>
          <p className="text-xs text-foreground-light/30">
            Seus dados são usados apenas para contato e agendamento.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};