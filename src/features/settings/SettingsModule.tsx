import { useMemo, useState } from 'react';
import { restartIntroTutorial, resetFarmDataAndRestart } from '@/app/store/farmReset';
import { useSyncQueueStore } from '@/app/store';
import { useSetupStore } from '@/app/store/useSetupStore';
import { useFarmSnapshot } from '@/features/dashboard/model/useFarmSnapshot';
import { acceptanceChecklist } from '@/features/settings/acceptanceChecklist';
import { formatDate } from '@/shared/lib/format';
import { CenterModal, DetailCard, ExecutiveCard, StatusChip } from '@/shared/ui';

export const SettingsModule = () => {
  const { kpi, attentionPoints, implantationTotals, economics, channels, continuityByPlan, lots } = useFarmSnapshot();
  const syncStatus = useSyncQueueStore((state) => state.status);
  const lastSyncedAt = useSyncQueueStore((state) => state.lastSyncedAt);
  const isDemo = useSetupStore((state) => state.isDemo);
  const setIsDemo = useSetupStore((state) => state.setIsDemo);
  const [resetModal, setResetModal] = useState<'tutorial' | 'all' | null>(null);

  const handleToggleDemo = () => {
    if (isDemo) {
      if (window.confirm("Deseja sair do MODO TESTE e começar a SALVAR no Supabase?")) {
        setIsDemo(false);
      }
    } else {
      if (window.confirm("Ativar MODO TESTE? Suas alterações NÃO serão salvas no banco de dados.")) {
        setIsDemo(true);
      }
    }
  };

  const checklist = useMemo(() => {
    const computed = [
      kpi.monthlyOutflowCents > 0 && implantationTotals.totalCents > 0,
      implantationTotals.totalCents > 0,
      channels.some((entry) => entry.type === 'kitchen') && channels.some((entry) => entry.type === 'box'),
      channels.some((entry) => entry.type === 'kitchen'),
      true,
      continuityByPlan.length > 0,
      economics.rows.length > 0 && economics.marginByChannel.length > 0,
      lots.length > 0,
      true,
      true,
      true,
      true,
      true,
      syncStatus === 'saved',
      true
    ];

    return acceptanceChecklist.map((label, index) => ({
      id: String(index + 1),
      label,
      done: computed[index] ?? false
    }));
  }, [channels, continuityByPlan.length, economics.marginByChannel.length, economics.rows.length, implantationTotals.totalCents, kpi.monthlyOutflowCents, lots.length, syncStatus]);

  const doneCount = checklist.filter((entry) => entry.done).length;

  return (
    <div className="page-stack">
      <DetailCard title="Ajustes" subtitle="Estado do produto">
        <div className="executive-grid">
          <ExecutiveCard title="Critérios atendidos" value={`${doneCount}/${checklist.length}`} helper="Checklist da fase" tone={doneCount >= checklist.length - 1 ? 'positive' : 'warning'} />
          <ExecutiveCard title="Pontos de atenção" value={String(attentionPoints.length)} helper="Alertas acionáveis" tone={attentionPoints.length > 3 ? 'warning' : 'positive'} />
          <ExecutiveCard title="Status de sincronização" value={syncStatus} helper={`Último save: ${lastSyncedAt ? formatDate(lastSyncedAt) : 'Nunca'}`} tone={syncStatus === 'saved' ? 'positive' : syncStatus === 'pending' ? 'warning' : 'danger'} />
        </div>
      </DetailCard>

      <DetailCard title="Sincronização & Segurança" subtitle="Controle de persistência de dados">
        <div className="settings-reset-card">
          <div className="settings-reset-copy">
            <strong>Modo de Persistência</strong>
            <p>
              {isDemo 
                ? 'Você está no MODO TESTE. Nada está sendo salvo no Supabase. Ideal para simulações.' 
                : 'Você está no MODO PRODUÇÃO. Todas as alterações são salvas automaticamente na nuvem.'}
            </p>
          </div>
          <div className="settings-reset-actions">
            <div className="sync-mode-toggle" style={{ margin: 0, background: 'transparent', border: 'none' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--forest)' }}>
                {isDemo ? 'Ativar Produção' : 'Ativar Teste'}
              </span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={!isDemo} 
                  onChange={handleToggleDemo} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </DetailCard>

      <DetailCard title="Checklist" subtitle="Aceite funcional">
        <div className="table-lite-wrap" data-tour="acceptance-checklist-table">
          <table className="table-lite">
            <thead>
              <tr>
                <th>ID</th>
                <th>Critério</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.label}</td>
                  <td>
                    <StatusChip label={item.done ? 'Atendido' : 'Pendente'} tone={item.done ? 'low' : 'medium'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailCard>

      <DetailCard title="Recomecar" subtitle="Use isso quando quiser corrigir o setup ou zerar a fazenda">
        <div className="settings-reset-card" data-tour="settings-reset-card">
          <div className="settings-reset-copy">
            <strong>O app pode voltar para o comeco sem quebrar a estrutura.</strong>
            <p>
              Se voce so quer corrigir os dados do tutorial, reabra o passo a passo. Se quiser apagar tudo que foi
              lançado e recomecar a operacao do zero, use o reset completo.
            </p>
          </div>

          <div className="settings-reset-actions">
            <button type="button" className="ghost-btn" onClick={() => setResetModal('tutorial')}>
              Refazer tutorial
            </button>
            <button type="button" className="cta-btn settings-danger-btn" onClick={() => setResetModal('all')}>
              Apagar tudo e recomecar
            </button>
          </div>
        </div>
      </DetailCard>

      <CenterModal
        open={resetModal === 'tutorial'}
        title="Refazer tutorial inicial"
        subtitle="Isso reabre o passo a passo para voce corrigir nome da fazenda, culturas, canais e base inicial."
        onClose={() => setResetModal(null)}
        footer={
          <>
            <button type="button" className="ghost-btn" onClick={() => setResetModal(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="cta-btn"
              onClick={() => {
                restartIntroTutorial();
                setResetModal(null);
              }}
            >
              Abrir tutorial
            </button>
          </>
        }
      >
        <div className="settings-reset-modal-copy">
          <p>Os dados atuais ficam visiveis ate voce concluir o tutorial de novo.</p>
          <p>Quando terminar, a base da operacao sera remontada com as respostas novas.</p>
        </div>
      </CenterModal>

      <CenterModal
        open={resetModal === 'all'}
        title="Apagar dados da fazenda"
        subtitle="Isso limpa o que voce lançou e volta o app para o comeco."
        onClose={() => setResetModal(null)}
        footer={
          <>
            <button type="button" className="ghost-btn" onClick={() => setResetModal(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="cta-btn settings-danger-btn"
              onClick={() => {
                setResetModal(null);
                resetFarmDataAndRestart();
              }}
            >
              Apagar tudo
            </button>
          </>
        }
      >
        <div className="settings-reset-modal-copy">
          <p>Isso apaga culturas, planos, compras, estoque, aplicacoes, colheitas e o setup atual.</p>
          <p>O app volta para a tela inicial para voce preencher tudo de novo com os dados corretos.</p>
        </div>
      </CenterModal>
    </div>
  );
};
