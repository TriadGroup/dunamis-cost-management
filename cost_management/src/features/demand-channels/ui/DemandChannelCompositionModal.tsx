import { useState } from 'react';
import { useProductionPlanningStore, useDemandChannelsStore, useOnboardingStore } from '@/app/store';
import { CenterModal, MoneyField, NumberField, SmartEmptyState, UiIcon } from '@/shared/ui';
import { formatCurrency, formatUnitLabel } from '@/shared/lib/format';
import type { DemandChannelItem } from '@/entities/agro/demand-channel/types';

interface Props {
  channelId: string;
  onClose: () => void;
}

export const DemandChannelCompositionModal = ({ channelId, onClose }: Props) => {
  const channel = useDemandChannelsStore((state) => state.channels.find(c => c.id === channelId));
  const updateChannel = useDemandChannelsStore((state) => state.updateChannel);
  const crops = useProductionPlanningStore((state) => state.crops);
  const startTour = useOnboardingStore((state) => state.startTour);

  const [items, setItems] = useState<DemandChannelItem[]>(channel?.items || []);
  const [selectedCropId, setSelectedCropId] = useState('');

  if (!channel) return null;

  const handleAddItem = () => {
    if (!selectedCropId) return;
    const crop = crops.find(c => c.id === selectedCropId);
    if (items.some(i => i.cropId === selectedCropId)) return;
    
    setItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        cropId: selectedCropId,
        quantityPerBundle: 1,
        acceptedPriceCents: 0,
        unit: crop?.salesUnit || 'unidade'
      }
    ]);
    setSelectedCropId('');
  };

  const handleRemoveItem = (id: string) => {
    setItems((current) => current.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id: string, partial: Partial<DemandChannelItem>) => {
    setItems((current) => current.map(i => i.id === id ? { ...i, ...partial } : i));
  };

  const handleSave = () => {
    updateChannel(channel.id, { items });
    onClose();
  };

  const totalBundlePriceCents = items.reduce((acc, item) => acc + item.acceptedPriceCents, 0);

  return (
    <CenterModal open={true} title={`Composição: ${channel.name}`} onClose={onClose} onHelp={() => startTour('demand-channels')}>
      <div className="page-stack">
        <p className="modal-note">
          Adicione as culturas que compõem este canal. A receita total do canal será baseada na soma dos preços de todos os itens cadastrados aqui.
        </p>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select 
            className="select-dark" 
            style={{ flex: 1 }}
            value={selectedCropId} 
            onChange={(e) => setSelectedCropId(e.target.value)}
          >
            <option value="">-- Adicionar cultivo ao pacote --</option>
            {crops.filter(c => !items.some(i => i.cropId === c.id)).map(crop => (
              <option key={crop.id} value={crop.id}>{crop.name} {crop.variety && `· ${crop.variety}`}</option>
            ))}
          </select>
          <button 
            type="button" 
            className="cta-btn" 
            disabled={!selectedCropId}
            onClick={handleAddItem}
          >
            Adicionar
          </button>
        </div>

        {items.length === 0 ? (
          <SmartEmptyState 
            title="Pacote vazio" 
            description="Nenhuma cultura adicionada. Este canal usará o 'Preço aceito' geral." 
          />
        ) : (
          <div className="table-lite-wrap">
            <table className="table-lite">
              <thead>
                <tr>
                  <th>Cultura</th>
                  <th>Quantidade</th>
                  <th>Unidade</th>
                  <th>Preço do Item</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const crop = crops.find(c => c.id === item.cropId);
                  
                  return (
                    <tr key={item.id}>
                      <td>{crop?.name || 'Desconhecida'}</td>
                      <td>
                        <NumberField 
                          value={item.quantityPerBundle} 
                          onChange={(e) => handleUpdateItem(item.id, { quantityPerBundle: Number(e.target.value || 0) })} 
                        />
                      </td>
                      <td>
                        <select 
                          className="select-dark" 
                          style={{ width: '100%' }}
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, { unit: e.target.value as any })}
                        >
                          <option value="unidade">Unidade</option>
                          <option value="maco">Maço</option>
                          <option value="caixa">Caixa</option>
                          <option value="bandeja">Bandeja</option>
                          <option value="cabeça">Cabeça</option>
                          <option value="pé">Pé</option>
                          <option value="kg">Kg</option>
                          <option value="muda">Muda</option>
                        </select>
                      </td>
                      <td>
                        <MoneyField 
                          valueCents={item.acceptedPriceCents} 
                          onChange={(cents) => handleUpdateItem(item.id, { acceptedPriceCents: cents })} 
                          ariaLabel={`Preço de ${crop?.name}`}
                        />
                      </td>
                      <td>
                        <button type="button" className="ghost-btn" style={{ padding: '0 8px' }} onClick={() => handleRemoveItem(item.id)}>
                          <UiIcon name="trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold' }}>Soma do Pacote:</td>
                  <td colSpan={2} style={{ fontWeight: 'bold', color: 'var(--color-positive)' }}>
                    {formatCurrency(totalBundlePriceCents)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="wizard-footer" style={{ marginTop: 24 }}>
          <button type="button" className="ghost-btn" onClick={onClose}>Cancelar</button>
          <button type="button" className="cta-btn" onClick={handleSave}>Salvar composição</button>
        </div>
      </div>
    </CenterModal>
  );
};
