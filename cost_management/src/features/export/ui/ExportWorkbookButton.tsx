import { useEffect, useRef, useState } from 'react';
import { exportFarmWorkbook } from '@/features/export/services/ExportService';

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 10L3.5 6M7.5 10L11.5 6M7.5 10V1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ animation: 'spin 0.9s linear infinite' }}
  >
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="16 18" />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </svg>
);

export const ExportWorkbookButton = () => {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleExport = async () => {
    if (status === 'loading') return;
    setStatus('loading');
    try {
      await exportFarmWorkbook();
      setStatus('success');
    } catch (err) {
      console.error('Falha ao exportar planilha', err);
      setStatus('error');
    }
    timeoutRef.current = window.setTimeout(() => setStatus('idle'), 3000);
  };

  const isSuccess = status === 'success';
  const isErr    = status === 'error';
  const isLoading = status === 'loading';

  const label = isLoading ? 'Exportando…' : isSuccess ? 'Baixado!' : isErr ? 'Falhou' : 'Exportar XLSX';
  const icon  = isLoading ? <SpinnerIcon /> : isSuccess ? <CheckIcon /> : <DownloadIcon />;

  const accentColor = isSuccess ? 'var(--color-success, #2e7d32)' : isErr ? 'var(--color-danger, #c62828)' : undefined;

  return (
    <button
      type="button"
      className="ghost-btn"
      onClick={handleExport}
      disabled={isLoading}
      aria-busy={isLoading}
      title="Baixar planilha XLSX completa da operação"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        fontWeight: 500,
        fontSize: '13px',
        color: accentColor,
        transition: 'color 0.2s ease',
        opacity: isLoading ? 0.7 : 1
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};
