import { useUiPreferencesStore } from '@/app/store/useUiPreferencesStore';
import { useSetupStore } from '@/app/store/useSetupStore';
import { useFarmSnapshot } from '@/features/dashboard/model/useFarmSnapshot';
import { AttentionBanner, DetailCard, ExecutiveCard } from '@/shared/ui';

export const ExecutiveRail = () => {
  const executiveMode = useUiPreferencesStore((state) => state.executiveMode);
  const setExecutiveMode = useUiPreferencesStore((state) => state.setExecutiveMode);
  const identity = useSetupStore((state) => state.identity);
  const profiles = useSetupStore((state) => state.productionProfiles);
  const structures = useSetupStore((state) => state.structures);
  const channels = useSetupStore((state) => state.channels);
  const initialCrops = useSetupStore((state) => state.initialCrops);
  const financialStartingPoints = useSetupStore((state) => state.financialStartingPoints);
  const { attentionPoints, operationStage, operationChecklist, nextAction, dataGaps } = useFarmSnapshot();

  const setupProgress = [
    identity.operationName.trim().length > 0,
    profiles.length > 0,
    structures.length > 0,
    channels.length > 0,
    initialCrops.length > 0,
    financialStartingPoints.length > 0
  ].filter(Boolean).length;

  const setupPct = Math.round((setupProgress / 6) * 100);
  const pendingCount = operationChecklist.filter((item) => !item.done).length;
  const stageLabel =
    operationStage === 'comeco_absoluto'
      ? 'Comecando'
      : operationStage === 'base_montada'
        ? 'Base pronta'
        : operationStage === 'operacao_parcial'
          ? 'Em andamento'
          : 'Conta real ativa';
  const stageHelper =
    operationStage === 'comeco_absoluto'
      ? 'Primeiro monte a base da operacao.'
      : operationStage === 'base_montada'
        ? 'Agora a rotina real precisa entrar.'
        : operationStage === 'operacao_parcial'
          ? 'Falta fechar o que aconteceu no campo.'
          : 'Ja da para comparar o plano com a vida real.';

  return (
    <aside className="executive-rail">
      <DetailCard
        title="Modo"
        subtitle="Executivo ou operacional"
        action={
          <button className={executiveMode ? 'ghost-btn' : 'cta-btn'} onClick={() => setExecutiveMode(!executiveMode)}>
            {executiveMode ? 'Executivo' : 'Operacional'}
          </button>
        }
      >
        <p style={{ fontSize: '0.82rem', color: '#586c5f' }}>
          {executiveMode
            ? 'Foco em síntese e risco para decisão rápida.'
            : 'Foco em edição, histórico e rastreabilidade detalhada.'}
        </p>
      </DetailCard>

      <ExecutiveCard
        title="Base montada"
        value={`${setupPct}%`}
        helper={`${profiles.length || 0} perfil(is), ${structures.length || 0} estrutura(s), ${channels.length || 0} canal(is)`}
        tone={setupPct >= 80 ? 'positive' : 'warning'}
      />

      <ExecutiveCard
        title="Momento da fazenda"
        value={stageLabel}
        helper={stageHelper}
        tone={
          operationStage === 'conta_real_ativa'
            ? 'positive'
            : operationStage === 'operacao_parcial'
              ? 'warning'
              : 'info'
        }
      />

      <DetailCard title="Proximo passo" subtitle="O que faz mais sentido agora">
        <div className="page-stack" style={{ gap: 8 }}>
          <AttentionBanner title={nextAction.label} description={nextAction.description} severity="medium" />
          {pendingCount > 0 ? (
            <AttentionBanner
              title={`${pendingCount} ponto(s) ainda faltando`}
              description={
                dataGaps.length > 0
                  ? `O sistema ainda nao fecha tudo porque faltam ${dataGaps.join(', ').toLowerCase()}.`
                  : 'A operacao ainda esta sendo montada.'
              }
              severity="low"
            />
          ) : null}
          {attentionPoints.slice(0, 3).map((point) => (
            <AttentionBanner key={point.id} title={point.title} description={point.description} severity={point.severity} />
          ))}
        </div>
      </DetailCard>
    </aside>
  );
};
