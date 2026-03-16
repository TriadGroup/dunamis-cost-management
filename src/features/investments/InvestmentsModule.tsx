import { useMemo } from 'react';
import { useInvestmentsStore } from '@/app/store/useInvestmentsStore';
import { useOptionCatalogStore } from '@/app/store/useOptionCatalogStore';
import { calculateInvestmentsSnapshot, deriveInvestmentContract } from '@/entities';
import { formatCurrency, formatNullableMonths } from '@/shared/lib/format';
import { CreatableSelect, DetailCard, ExecutiveCard, MoneyField, NumberField, SmartEmptyState, StatusChip } from '@/shared/ui';

export const InvestmentsModule = () => {
  const contracts = useInvestmentsStore((state) => state.contracts);
  const addContract = useInvestmentsStore((state) => state.addContract);
  const updateContract = useInvestmentsStore((state) => state.updateContract);
  const removeContract = useInvestmentsStore((state) => state.removeContract);
  const investmentCategoryOptions = useOptionCatalogStore((state) => state.getOptions('investment-category'));
  const addCatalogOption = useOptionCatalogStore((state) => state.addOption);

  const snapshot = useMemo(() => calculateInvestmentsSnapshot(contracts), [contracts]);

  return (
    <div className="page-stack">
      <DetailCard
        title="Investimentos e financiamentos"
        subtitle="Capital fora da rotina"
        action={contracts.length > 0 ? <button className="cta-btn" onClick={() => addContract()}>Novo</button> : undefined}
      >
        <div className="executive-grid">
          <ExecutiveCard title="Total comprometido" value={formatCurrency(snapshot.totalCommittedCents)} helper="Soma dos contratos ativos" tone="info" />
          <ExecutiveCard title="Parcela mensal" value={formatCurrency(snapshot.monthlyOutflowCents)} helper="Compromisso fixo" tone="warning" />
          <ExecutiveCard title="Retorno mensal" value={formatCurrency(snapshot.monthlyReturnCents)} helper="Informado por contrato" tone="positive" />
          <ExecutiveCard title="Impacto líquido" value={formatCurrency(snapshot.monthlyNetCents)} helper="Retorno - parcela" tone={snapshot.monthlyNetCents >= 0 ? 'positive' : 'danger'} />
        </div>
      </DetailCard>

      <DetailCard title="Maquinário" subtitle="Payback e compromissos">
        {contracts.length === 0 ? (
          <SmartEmptyState
            title="Nenhum investimento cadastrado"
            description="Cadastre o primeiro contrato para acompanhar parcela, retorno e payback."
            action={<button type="button" className="cta-btn" onClick={() => addContract()}>Adicionar primeiro contrato</button>}
          />
        ) : (
          <div className="page-stack">
            {contracts.map((contract) => {
              const derived = deriveInvestmentContract(contract);
              return (
                <article key={contract.id} className="detail-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem' }}>{contract.assetName}</h4>
                      <p style={{ marginTop: 4, color: '#5f6f64', fontSize: '0.84rem' }}>{contract.assetCategory} · {contract.modality}</p>
                    </div>
                    <StatusChip
                      label={derived.missingReturnForPayback ? 'Payback incompleto' : `Payback ${formatNullableMonths(derived.paybackMonths)}`}
                      tone={derived.missingReturnForPayback ? 'medium' : 'low'}
                    />
                  </div>

                  <div className="section-grid-4" style={{ marginTop: 12 }}>
                    <label>
                      Valor do bem
                      <MoneyField valueCents={contract.assetValueCents} onChange={(nextValueCents) => updateContract(contract.id, { assetValueCents: nextValueCents })} />
                    </label>
                    <label>
                      Entrada
                      <MoneyField valueCents={contract.downPaymentCents} onChange={(nextValueCents) => updateContract(contract.id, { downPaymentCents: nextValueCents })} />
                    </label>
                    <label>
                      Parcelas
                      <NumberField value={contract.installments} onChange={(event) => updateContract(contract.id, { installments: Number(event.target.value || 1) })} suffix="parcelas" />
                    </label>
                    <label>
                      Parcela mensal
                      <MoneyField valueCents={contract.monthlyInstallmentCents} onChange={(nextValueCents) => updateContract(contract.id, { monthlyInstallmentCents: nextValueCents })} />
                    </label>
                  </div>

                  <div className="section-grid-3" style={{ marginTop: 8 }}>
                    <label>
                      Retorno mensal esperado
                      <MoneyField valueCents={contract.expectedMonthlyReturnCents ?? 0} onChange={(nextValueCents) => updateContract(contract.id, { expectedMonthlyReturnCents: nextValueCents })} />
                    </label>
                    <label>
                      Categoria do bem
                      <CreatableSelect
                        value={contract.assetCategory}
                        options={investmentCategoryOptions}
                        placeholder="Escolha a categoria"
                        onChange={(value) => updateContract(contract.id, { assetCategory: value })}
                        onCreate={(label) => addCatalogOption('investment-category', label, label)}
                        createLabel="Criar categoria"
                      />
                    </label>
                    <label>
                      Modalidade
                      <select className="select-dark" value={contract.modality} onChange={(event) => updateContract(contract.id, { modality: event.target.value as typeof contract.modality })}>
                        <option value="avista">À vista</option>
                        <option value="financiamento">Financiamento</option>
                        <option value="consorcio">Consórcio</option>
                      </select>
                    </label>
                    <label className="span-2">
                      Status
                      <select className="select-dark" value={contract.status} onChange={(event) => updateContract(contract.id, { status: event.target.value as typeof contract.status })}>
                        <option value="ativo">Ativo</option>
                        <option value="pendente">Pendente</option>
                        <option value="encerrado">Encerrado</option>
                      </select>
                    </label>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button className="ghost-btn" onClick={() => removeContract(contract.id)}>Remover contrato</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </DetailCard>
    </div>
  );
};
