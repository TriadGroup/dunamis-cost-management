import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import { 
  calculateInventoryBalance, 
  getLotStatusFromBalance, 
  type InventoryLot, 
  type InventoryProduct, 
  type StockMovement 
} from '@/entities';
import { 
  InventoryProductSchema, 
  InventoryLotSchema, 
  StockMovementSchema 
} from '@/entities/finance/inventory/validation';

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
        const result = InventoryProductSchema.safeParse(next);
        if (!result.success) {
          console.error('Validation failed for addProduct:', result.error.format());
          return next.id;
        }

        set((state) => {
          useSyncQueueStore.getState().enqueue({
            table: 'inventory_products',
            action: 'INSERT',
            payload: next
          });
          return { products: [...state.products, next] };
        });
        return next.id;
      },
      updateProduct: (id, patch) =>
        set((state) => {
          const updated = state.products.find((p) => p.id === id);
          if (!updated) return state;

          const next = { ...updated, ...patch };
          const result = InventoryProductSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateProduct:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'inventory_products',
            action: 'UPDATE',
            payload: next
          });
          return { products: state.products.map((entry) => (entry.id === id ? next : entry)) };
        }),
      removeProduct: (id) =>
        set((state) => {
          useSyncQueueStore.getState().enqueue({
            table: 'inventory_products',
            action: 'DELETE',
            payload: { id }
          });
          return { products: state.products.filter((entry) => entry.id !== id) };
        }),
      addLot: (item) => {
        const next = { ...defaultLot(), ...item, id: createId() };
        const result = InventoryLotSchema.safeParse(next);
        if (!result.success) {
          console.error('Validation failed for addLot:', result.error.format());
          return next.id;
        }

        set((state) => {
          useSyncQueueStore.getState().enqueue({
            table: 'inventory_lots',
            action: 'INSERT',
            payload: next
          });
          return { lots: [...state.lots, next] };
        });
        return next.id;
      },
      updateLot: (id, patch) =>
        set((state) => {
          const updated = state.lots.find((l) => l.id === id);
          if (!updated) return state;

          const merged = { ...updated, ...patch };
          const quantityAvailable = calculateInventoryBalance(merged, state.movements);
          const status = getLotStatusFromBalance(merged, state.movements);
          const next = { ...merged, quantityAvailable, status };

          const result = InventoryLotSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateLot:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'inventory_lots',
            action: 'UPDATE',
            payload: next
          });

          return { 
            lots: state.lots.map((entry) => (entry.id === id ? next : entry)) 
          };
        }),
      removeLot: (id) =>
        set((state) => {
          useSyncQueueStore.getState().enqueue({
            table: 'inventory_lots',
            action: 'DELETE',
            payload: { id }
          });
          return { lots: state.lots.filter((entry) => entry.id !== id), movements: state.movements.filter((entry) => entry.inventoryLotId !== id) };
        }),
      addMovement: (item) => {
        const next = { ...defaultMovement(), ...item, id: createId() };
        const result = StockMovementSchema.safeParse(next);
        if (!result.success) {
          console.error('Validation failed for addMovement:', result.error.format());
          return next.id;
        }

        set((state) => {
          useSyncQueueStore.getState().enqueue({
            table: 'stock_movements',
            action: 'INSERT',
            payload: next
          });
          
          const nextMovements = [...state.movements, next];
          const nextLots = state.lots.map((lot) => {
            if (lot.id !== next.inventoryLotId) return lot;
            
            const updatedLot = {
              ...lot,
              quantityAvailable: calculateInventoryBalance(lot, nextMovements),
              status: getLotStatusFromBalance(lot, nextMovements)
            };

            // SYNC the lot update too
            useSyncQueueStore.getState().enqueue({
              table: 'inventory_lots',
              action: 'UPDATE',
              payload: updatedLot
            });

            return updatedLot;
          });
          
          return { movements: nextMovements, lots: nextLots };
        });
        return next.id;
      },
      removeMovement: (id) =>
        set((state) => {
          const movementToRemove = state.movements.find(m => m.id === id);
          if (!movementToRemove) return state;

          useSyncQueueStore.getState().enqueue({
            table: 'stock_movements',
            action: 'DELETE',
            payload: { id }
          });

          const nextMovements = state.movements.filter((entry) => entry.id !== id);
          const nextLots = state.lots.map((lot) => {
            if (lot.id !== movementToRemove.inventoryLotId) return lot;

            const updatedLot = {
              ...lot,
              quantityAvailable: calculateInventoryBalance(lot, nextMovements),
              status: getLotStatusFromBalance(lot, nextMovements)
            };

            // SYNC the lot update too
            useSyncQueueStore.getState().enqueue({
              table: 'inventory_lots',
              action: 'UPDATE',
              payload: updatedLot
            });

            return updatedLot;
          });

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
