import { useMemo } from 'react';
import { adjustedItemValue } from '@/entities/finance/calculations';
import type { Category } from '@/entities/finance/types';
import { formatCurrency, toCents } from '@/shared/lib/format';
import { Card } from '@/shared/ui/Card';
import { SliderField } from '@/shared/ui/SliderField';
import { useAppStore } from '@/app/store/useAppStore';

const typeOptions = [
  { value: 'cost', label: 'Custo' },
  { value: 'investment', label: 'Investimento' },
  { value: 'revenue', label: 'Receita' }
] as const;

const recurrenceOptions = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' }
] as const;

interface CategorySectionProps {
  category: Category;
}

const CategorySection = ({ category }: CategorySectionProps) => {
  const items = useAppStore((state) => state.data.items.filter((item) => item.categoryId === category.id));
  const actions = useAppStore((state) => state.actions);

  const categoryTotal = useMemo(
    () => items.reduce((acc, item) => acc + adjustedItemValue(item, category), 0),
    [items, category]
  );

  return (
    <Card
      title={category.name}
      subtitle={`Subtotal ajustado ${formatCurrency(categoryTotal)}`}
      action={
        <button
          className="rounded-lg border border-fern-900/20 px-2 py-1 text-xs text-fern-800"
          onClick={() => actions.addItem(category.id)}
        >
          + Item
        </button>
      }
      className="space-y-4"
    >
      <div className="space-y-2 rounded-xl border border-fern-900/10 bg-fern-50/60 p-3">
        <div className="flex items-center gap-2">
          <input
            value={category.name}
            onChange={(event) => actions.updateCategory(category.id, { name: event.target.value })}
            className="w-full rounded-lg border border-fern-900/20 bg-white px-2 py-1 text-sm"
          />
          <button
            onClick={() => actions.removeCategory(category.id)}
            className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700"
          >
            Remover
          </button>
        </div>
        <SliderField
          label="Slider da categoria"
          value={category.categorySliderPct}
          onChange={(value) => actions.setCategorySlider(category.id, value)}
        />
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const adjusted = adjustedItemValue(item, category);
          return (
            <div key={item.id} className="space-y-3 rounded-xl border border-fern-900/10 bg-white p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={item.name}
                  onChange={(event) => actions.updateItem(item.id, { name: event.target.value })}
                  className="rounded-lg border border-fern-900/20 px-2 py-1 text-sm"
                />
                <select
                  value={item.type}
                  onChange={(event) => actions.updateItem(item.id, { type: event.target.value as typeof item.type })}
                  className="rounded-lg border border-fern-900/20 px-2 py-1 text-sm"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.baseValueCents / 100}
                  onChange={(event) => actions.updateItem(item.id, { baseValueCents: toCents(Number(event.target.value || 0)) })}
                  className="rounded-lg border border-fern-900/20 px-2 py-1 text-sm"
                />
                <select
                  value={item.recurrence}
                  onChange={(event) => actions.updateItem(item.id, { recurrence: event.target.value as typeof item.recurrence })}
                  className="rounded-lg border border-fern-900/20 px-2 py-1 text-sm"
                >
                  {recurrenceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={item.notes}
                onChange={(event) => actions.updateItem(item.id, { notes: event.target.value })}
                placeholder="Observacoes"
                rows={2}
                className="w-full rounded-lg border border-fern-900/20 px-2 py-1 text-sm"
              />

              <SliderField
                label={`Slider item | Ajustado ${formatCurrency(adjusted)}`}
                value={item.itemSliderPct}
                onChange={(value) => actions.setItemSlider(item.id, value)}
              />

              <button onClick={() => actions.removeItem(item.id)} className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                Remover item
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const PlanningPanel = () => {
  const categories = useAppStore((state) => state.data.categories);
  const actions = useAppStore((state) => state.actions);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-fern-900">Planejamento com sliders</h2>
        <button
          className="rounded-xl bg-fern-800 px-3 py-2 text-sm font-semibold text-fern-50"
          onClick={() => actions.addCategory('Nova categoria')}
        >
          + Categoria
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {categories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
};
