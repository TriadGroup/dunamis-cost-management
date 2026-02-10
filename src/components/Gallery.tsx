import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { Smile, Sparkles, MessageCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

// Photo imports
import photo01 from '@/assets/photos/photo-01.jpg';
import photo02 from '@/assets/photos/photo-02.jpg';
import photo03 from '@/assets/photos/photo-03.jpg';
import photo04 from '@/assets/photos/photo-04.jpg';
import photo05 from '@/assets/photos/photo-05.jpg';
import photo06 from '@/assets/photos/photo-06.jpg';
import photo07 from '@/assets/photos/photo-07.jpg';
import photo08 from '@/assets/photos/photo-08.jpg';
import photo09 from '@/assets/photos/photo-09.jpg';
import photo10 from '@/assets/photos/photo-10.jpg';

const WHATSAPP_NUMBER = '5537999833437';

interface PhotoItem {
  src: string;
  label: string;
  type: 'result' | 'before-after';
  category: 'sorriso' | 'harmonizacao';
  alt: string;
  featured?: boolean;
  featuredDesc?: string;
}

const photos: PhotoItem[] = [
  { src: photo01, label: 'Lentes de contato', type: 'before-after', category: 'sorriso', alt: 'Antes e depois de lentes de contato dental', featured: true, featuredDesc: 'Lentes de contato dental com transformação completa do sorriso' },
  { src: photo02, label: 'Lentes — resultado', type: 'result', category: 'sorriso', alt: 'Resultado de lentes de contato dental' },
  { src: photo03, label: 'Lentes — resultado', type: 'result', category: 'sorriso', alt: 'Close-up de lentes de contato dental' },
  { src: photo04, label: 'Lentes — resultado', type: 'result', category: 'sorriso', alt: 'Sorriso com lentes de contato dental' },
  { src: photo05, label: 'Lentes — antes/depois', type: 'before-after', category: 'sorriso', alt: 'Antes e depois de lentes de contato dental', featured: true, featuredDesc: 'Clareamento e alinhamento com lentes cerâmicas' },
  { src: photo06, label: 'Lentes masculinas', type: 'before-after', category: 'sorriso', alt: 'Antes e depois de lentes de contato dental masculino', featured: true, featuredDesc: 'Lentes de contato dental — resultado masculino' },
  { src: photo07, label: 'Detalhe clínico', type: 'result', category: 'sorriso', alt: 'Detalhe clínico de lentes de contato dental' },
  { src: photo08, label: 'Harmonização Facial', type: 'before-after', category: 'harmonizacao', alt: 'Antes e depois de harmonização facial', featured: true, featuredDesc: 'Harmonização facial completa — equilíbrio e naturalidade' },
  { src: photo09, label: 'Lentes — antes/depois', type: 'before-after', category: 'sorriso', alt: 'Antes e depois de lentes de contato dental', featured: true, featuredDesc: 'Estética do sorriso — resultado natural' },
  { src: photo10, label: 'Lentes — resultado', type: 'result', category: 'sorriso', alt: 'Resultado de lentes de contato dental' },
];

// Lightbox component
const Lightbox = ({ photo, onClose }: { photo: PhotoItem; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <button
      onClick={onClose}
      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
    >
      <X className="w-5 h-5" />
    </button>
    <motion.img
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      src={photo.src}
      alt={photo.alt}
      className="max-w-full max-h-[90vh] object-contain rounded-lg"
      onClick={(e) => e.stopPropagation()}
    />
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
      <span className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">
        {photo.label}
      </span>
    </div>
  </motion.div>
);

export const Gallery = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [activeTab, setActiveTab] = useState<'sorriso' | 'harmonizacao'>('sorriso');
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const filtered = photos.filter((p) => p.category === activeTab);
  const beforeAfterPhotos = filtered.filter((p) => p.type === 'before-after');
  const allPhotos = filtered;
  const featuredPhotos = photos.filter((p) => p.featured);

  const nextSlide = () => setCarouselIndex((p) => (p + 1) % featuredPhotos.length);
  const prevSlide = () => setCarouselIndex((p) => (p - 1 + featuredPhotos.length) % featuredPhotos.length);

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
          </motion.div>

          {/* Tabs */}
          <div className="flex justify-center gap-3 mb-10">
            <button
              onClick={() => setActiveTab('sorriso')}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === 'sorriso'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'border border-border bg-white hover:border-secondary/50'
              }`}
            >
              <Smile className="w-4 h-4" />
              Sorrisos
            </button>
            <button
              onClick={() => setActiveTab('harmonizacao')}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === 'harmonizacao'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'border border-border bg-white hover:border-secondary/50'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Harmonização Facial
            </button>
          </div>

          {/* Before/After Section */}
          {beforeAfterPhotos.length > 0 && (
            <motion.div
              key={activeTab + '-ba'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-12"
            >
              <h3 className="font-display text-xl text-foreground mb-6 text-center">Antes & Depois</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {beforeAfterPhotos.map((photo, i) => (
                  <motion.div
                    key={photo.src}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.1 * i }}
                    className="relative rounded-2xl overflow-hidden cursor-pointer group"
                    onClick={() => setLightboxPhoto(photo)}
                  >
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="absolute bottom-3 left-3 text-xs font-medium bg-white/90 text-foreground px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Mosaic Gallery */}
          <motion.div
            key={activeTab + '-grid'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-12"
          >
            <h3 className="font-display text-xl text-foreground mb-6 text-center">Galeria</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {allPhotos.map((photo, i) => (
                <motion.div
                  key={photo.src + i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.05 * i }}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
                    i === 0 ? 'md:row-span-2' : ''
                  }`}
                  onClick={() => setLightboxPhoto(photo)}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                      i === 0 ? 'aspect-[3/4] md:h-full' : 'aspect-square'
                    }`}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute bottom-3 left-3 text-xs font-medium bg-white/90 text-foreground px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Featured Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="font-display text-xl text-foreground mb-6 text-center">Casos em destaque</h3>
            <div className="relative">
              <div className="overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                >
                  {featuredPhotos.map((photo, i) => (
                    <div key={i} className="w-full flex-shrink-0">
                      <div
                        className="relative cursor-pointer"
                        onClick={() => setLightboxPhoto(photo)}
                      >
                        <img
                          src={photo.src}
                          alt={photo.alt}
                          className="w-full aspect-[4/3] object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <span className="text-xs font-medium tracking-wider uppercase text-accent">
                            {photo.category === 'sorriso' ? 'Lentes & Sorriso' : 'Harmonização Facial'}
                          </span>
                          <h4 className="font-display text-2xl text-white mt-1">{photo.label}</h4>
                          <p className="text-sm text-white/80 mt-1">{photo.featuredDesc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center hover:bg-white transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center hover:bg-white transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex justify-center gap-2 mt-4">
                {featuredPhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === carouselIndex ? 'bg-secondary w-6' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Vi os resultados no site e quero uma avaliação com a Dra. Vanessa Ribeiro.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <MessageCircle className="w-5 h-5" />
                Quero uma avaliação no WhatsApp
              </a>
            </div>
          </motion.div>

          <p className="text-xs text-muted-foreground text-center">
            Resultados variam e dependem de avaliação individual.
          </p>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxPhoto && (
        <Lightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
      )}
    </>
  );
};