import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import { calculateInventoryBalance, getLotStatusFromBalance, type InventoryLot, type InventoryProduct, type StockMovement } from '@/entities';

interface InventoryState {
  products: InventoryProduct[];
  lots: InventoryLot[];
  movements: StockMovement[];
  addProduct: (item?: Partial<InventoryProduct>) => string;
  updateProduct: (id: string, patch: Partial<InventoryProduct>) => void;
  removeProduct: (id: string) => void;
  addLot: (item?: Partial<InventoryLot>) => string;
  updateLot: (id: string, patch: Partial<InventoryLot>) => void;
  removeLot: (id: string) => void;
  addMovement: (item?: Partial<StockMovement>) => string;
  removeMovement: (id: string) => void;
  getAvailableLotsByProduct: (productId: string) => InventoryLot[];
}

const defaultProduct = (): InventoryProduct => ({
  id: createId(),
  name: 'Novo insumo',
  commercialName: '',
  category: 'outro',
  defaultUnit: 'unidade',
  notes: '',
  active: true
});

const defaultLot = (): InventoryLot => ({
  id: createId(),
  productId: '',
  purchaseId: null,
  code: `EST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 999)}`,
  receivedAt: new Date().toISOString().slice(0, 10),
  quantityReceived: 0,
  quantityAvailable: 0,
  unit: 'unidade',
  unitCostCents: 0,
  expirationDate: '',
  locationName: 'Galpão principal',
  status: 'ativo',
  notes: ''
});

const defaultMovement = (): StockMovement => ({
  id: createId(),
  inventoryLotId: '',
  movementType: 'entrada',
  quantity: 0,
  unit: 'unidade',
  occurredAt: new Date().toISOString().slice(0, 10),
  targetType: 'geral',
  targetId: null,
  reason: '',
  notes: ''
});

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      products: [],
      lots: [],
      movements: [],
      addProduct: (item) => {
        const next = { ...defaultProduct(), ...item, id: createId() };
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { products: [...state.products, next] };
        });
        return next.id;
      },
      updateProduct: (id, patch) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { products: state.products.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)) };
        }),
      removeProduct: (id) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { products: state.products.filter((entry) => entry.id !== id) };
        }),
      addLot: (item) => {
        const next = { ...defaultLot(), ...item, id: createId() };
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { lots: [...state.lots, next] };
        });
        return next.id;
      },
      updateLot: (id, patch) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          const nextLots = state.lots.map((entry) => {
            if (entry.id !== id) return entry;
            const merged = { ...entry, ...patch };
            const quantityAvailable = calculateInventoryBalance(merged, state.movements);
            return {
              ...merged,
              quantityAvailable,
              status: getLotStatusFromBalance(merged, state.movements)
            };
          });
          return { lots: nextLots };
        }),
      removeLot: (id) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { lots: state.lots.filter((entry) => entry.id !== id), movements: state.movements.filter((entry) => entry.inventoryLotId !== id) };
        }),
      addMovement: (item) => {
        const next = { ...defaultMovement(), ...item, id: createId() };
        set((state) => {
          useSyncQueueStore.getState().markPending();
          const nextMovements = [...state.movements, next];
          const nextLots = state.lots.map((lot) =>
            lot.id === next.inventoryLotId
              ? {
                  ...lot,
                  quantityAvailable: calculateInventoryBalance(lot, nextMovements),
                  status: getLotStatusFromBalance(lot, nextMovements)
                }
              : lot
          );
          return { movements: nextMovements, lots: nextLots };
        });
        return next.id;
      },
      removeMovement: (id) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          const nextMovements = state.movements.filter((entry) => entry.id !== id);
          const nextLots = state.lots.map((lot) => ({
            ...lot,
            quantityAvailable: calculateInventoryBalance(lot, nextMovements),
            status: getLotStatusFromBalance(lot, nextMovements)
          }));
          return { movements: nextMovements, lots: nextLots };
        }),
      getAvailableLotsByProduct: (productId) =>
        get().lots.filter((lot) => lot.productId === productId && lot.quantityAvailable > 0 && lot.status !== 'vencido')
    }),
    {
      name: 'dunamis-farm-agro-inventory-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
