import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Trust } from '@/components/Trust';
import { Procedures } from '@/components/Procedures';
import { HowItWorks } from '@/components/HowItWorks';
import { About } from '@/components/About';
import { AgendamentoExpress } from '@/components/AgendamentoExpress';
import { FAQ } from '@/components/FAQ';
import { Location } from '@/components/Location';
import { Footer } from '@/components/Footer';

const Index = () => {
  const [selectedProcedure, setSelectedProcedure] = useState<string | undefined>();

  const handleSelectProcedure = (procedure: string) => {
    setSelectedProcedure(procedure);
    setTimeout(() => {
      const element = document.querySelector('#agendar');
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleServiceChange = () => {
    setSelectedProcedure(undefined);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Trust />
      <Procedures onSelectProcedure={handleSelectProcedure} />
      <HowItWorks />
      <About />
      <AgendamentoExpress
        initialService={selectedProcedure}
        onServiceChange={handleServiceChange}
      />
      <FAQ />
      <Location />
      <Footer />
    </div>
  );
};

export default Index;