import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import { MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

import photo01 from '@/assets/social/photo-02.jpg';
import photo02 from '@/assets/social/photo-03.jpg';
import photo03 from '@/assets/social/photo-04.jpg';
import photo04 from '@/assets/social/photo-05.jpg';
import photo05 from '@/assets/social/photo-06.jpg';
import photo06 from '@/assets/social/photo-07.jpg';
import photo07 from '@/assets/social/photo-08.jpg';
import photo08 from '@/assets/social/photo-09.jpg';
import photo09 from '@/assets/social/photo-10.jpg';
import photo10 from '@/assets/social/photo-11.jpg';

const WHATSAPP_NUMBER = '5513997149974';

const photos = [
  { src: photo01, alt: 'Resultado de procedimento estético — Dra. Mayara Paccola' },
  { src: photo02, alt: 'Resultado de procedimento estético — Dra. Mayara Paccola' },
  { src: photo03, alt: 'Resultado de procedimento estético — Dra. Mayara Paccola' },
  { src: photo04, alt: 'Resultado de procedimento estético — Dra. Mayara Paccola' },
  { src: photo05, alt: 'Resultado de procedimento estético — Dra. Mayara Paccola' },
  { src: photo06, alt: 'Resultado de procedimento estético — Dra. Mayara Paccola' },
  { src: photo07, alt: 'Resultado de procedimento estético — Dra. Mayara Paccola' },
  { src: photo08, alt: 'Resultado de procedimento estético — Dra. Mayara Paccola' },
  { src: photo09, alt: 'Resultado de procedimento estético — Dra. Mayara Paccola' },
  { src: photo10, alt: 'Resultado de procedimento estético — Dra. Mayara Paccola' },
];

const Lightbox = ({ index, onClose, onPrev, onNext }: { index: number; onClose: () => void; onPrev: () => void; onNext: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
      <X className="w-5 h-5" />
    </button>
    <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10">
      <ChevronLeft className="w-5 h-5" />
    </button>
    <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 z-10">
      <ChevronRight className="w-5 h-5" />
    </button>
    <motion.img
      key={index}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      src={photos[index].src}
      alt={photos[index].alt}
      className="max-w-full max-h-[90vh] object-contain rounded-lg"
      onClick={(e) => e.stopPropagation()}
    />
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
      <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">
        {index + 1} / {photos.length}
      </span>
    </div>
  </motion.div>
);

export const Gallery = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => setLightboxIndex((p) => p !== null ? (p - 1 + photos.length) % photos.length : null);
  const nextPhoto = () => setLightboxIndex((p) => p !== null ? (p + 1) % photos.length : null);

  return (
    <>
      <section id="resultados" className="section-light py-24 md:py-32">
        <div className="container-narrow">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <p className="text-sm font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
              Resultados Reais
            </p>
            <h2 className="text-display-lg text-foreground mb-4">
              Transformações <span className="italic">reais</span>
            </h2>
            <p className="text-body text-muted-foreground max-w-xl mx-auto">
              Confira resultados reais de pacientes da Dra. Mayara Paccola.
            </p>
          </motion.div>

          {/* Grid gallery */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {photos.map((photo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
                  i === 0 ? 'md:col-span-2 md:row-span-2' : ''
                }`}
                onClick={() => openLightbox(i)}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                    i === 0 ? 'aspect-square' : 'aspect-square'
                  }`}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Vi os resultados no site e quero agendar uma avaliação com a Dra. Mayara Paccola.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <MessageCircle className="w-5 h-5" />
              Quero uma avaliação
            </a>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Resultados variam e dependem de avaliação individual.
          </p>
        </div>
      </section>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox index={lightboxIndex} onClose={closeLightbox} onPrev={prevPhoto} onNext={nextPhoto} />
        )}
      </AnimatePresence>
    </>
  );
};