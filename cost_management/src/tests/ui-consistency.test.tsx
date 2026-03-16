import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDemandChannelsStore, useOptionCatalogStore } from '@/app/store';
import { CreatableSelect, MoneyField } from '@/shared/ui';

const resetOptionCatalogStore = () => {
  localStorage.removeItem('dunamis-farm-os-option-catalog-v1');
  useOptionCatalogStore.setState({
    options: useOptionCatalogStore.getInitialState().options
  });
};

const resetDemandChannelsStore = () => {
  localStorage.removeItem('dunamis-farm-os-demand-channels-v3');
  useDemandChannelsStore.setState({
    channels: [],
    scenarios: useDemandChannelsStore.getInitialState().scenarios,
    activeScenarioId: useDemandChannelsStore.getInitialState().activeScenarioId
  });
};

describe('ui consistency', () => {
  beforeEach(() => {
    localStorage.clear();
    resetOptionCatalogStore();
    resetDemandChannelsStore();
  });

  it('allows replacing a money value without ghost digits', async () => {
    const MoneyFieldHarness = () => {
      const [valueCents, setValueCents] = useState(1250);
      return <MoneyField valueCents={valueCents} onChange={setValueCents} ariaLabel="Valor" />;
    };

    render(<MoneyFieldHarness />);

    const input = screen.getByLabelText('Valor') as HTMLInputElement;
    expect(input.value).toBe('12,50');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '3,45' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(input.value).toBe('3,45');
    });
  });

  it('creates a new option inside the dropdown flow', async () => {
    const SelectHarness = () => {
      const [options, setOptions] = useState([{ value: 'unidade', label: 'Unidade' }]);
      const [value, setValue] = useState('');

      return (
        <CreatableSelect
          value={value}
          options={options}
          onChange={setValue}
          onCreate={(label) => {
            const nextValue = label;
            setOptions((current) => [...current, { value: nextValue, label }]);
            return nextValue;
          }}
          createLabel="Criar unidade"
          placeholder="Escolha"
        />
      );
    };

    render(<SelectHarness />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '__create_option__' } });
    fireEvent.change(screen.getByPlaceholderText('Digite a nova opção'), { target: { value: 'Molho' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('Molho');
    });
  });

  it('persists created catalog options for reuse', () => {
    const createdValue = useOptionCatalogStore.getState().addOption('inventory-location', 'Depósito lateral', 'Depósito lateral');
    const options = useOptionCatalogStore.getState().getOptions('inventory-location');

    expect(createdValue).toBe('Depósito lateral');
    expect(options.some((entry) => entry.value === 'Depósito lateral')).toBe(true);

    const persisted = JSON.parse(localStorage.getItem('dunamis-farm-os-option-catalog-v1') || '{}');
    const persistedOptions = persisted.state?.options?.['inventory-location'] ?? [];
    expect(persistedOptions.some((entry: { value: string }) => entry.value === 'Depósito lateral')).toBe(true);
  });

  it('migrates legacy demand values from kg fields into semantic fields', async () => {
    localStorage.setItem(
      'dunamis-farm-os-demand-channels-v3',
      JSON.stringify({
        state: {
          channels: [
            {
              id: 'channel-box',
              type: 'box',
              name: 'Box',
              priority: 1,
              pricingMode: 'unit',
              demandUnit: 'unidade',
              baselineDemandKg: 90,
              scenarioDemandKg: 120,
              enabled: true
            }
          ],
          scenarios: [],
          activeScenarioId: ''
        },
        version: 2
      })
    );

    await useDemandChannelsStore.persist.rehydrate();

    const channel = useDemandChannelsStore.getState().channels[0];
    expect(channel.baselineDemand).toBe(90);
    expect(channel.scenarioDemand).toBe(120);
  });
});
