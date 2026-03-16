import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import { calculateImplantationTotals, type ImplantationItem, type ImplantationProject, type PaymentMode, type Quotation } from '@/entities';
import { ImplantationProjectSchema, ImplantationItemSchema } from '@/entities/agro/implantation/validation';

export interface ImplantationProjectDraft {
  name: string;
  description: string;
  budgetTargetCents: number;
  status: ImplantationProject['status'];
  startDate: string;
  targetEndDate: string;
  notes: string;
}

export interface ImplantationDraft {
  projectId: string;
  group: ImplantationItem['group'];
  name: string;
  description: string;
  priority: ImplantationItem['priority'];
  paymentMode: ImplantationItem['paymentMode'];
  deadline: string;
  notes: string;
}

export interface QuotationDraft {
  supplier: string;
  totalCostCents: number;
  freightCents: number;
  source: string;
  notes: string;
  status: Quotation['status'];
  paymentMode: PaymentMode;
  downPaymentCents: number;
  installments: number;
  installmentValueCents: number;
  firstDueDate: string;
  paymentNotes: string;
}

interface ImplantationState {
  projects: ImplantationProject[];
  items: ImplantationItem[];
  projectDraft: ImplantationProjectDraft;
  draft: ImplantationDraft;
  setProjectDraft: (patch: Partial<ImplantationProjectDraft>) => void;
  clearProjectDraft: () => void;
  addProjectFromDraft: () => string | null;
  updateProject: (id: string, patch: Partial<ImplantationProject>) => void;
  removeProject: (id: string) => void;
  setDraft: (patch: Partial<ImplantationDraft>) => void;
  clearDraft: () => void;
  addFromDraft: () => string | null;
  updateItem: (id: string, patch: Partial<ImplantationItem>) => void;
  removeItem: (id: string) => void;
  addQuotation: (itemId: string, quotation: QuotationDraft) => void;
  updateQuotation: (itemId: string, quotationId: string, patch: Partial<QuotationDraft & Pick<Quotation, 'status'>>) => void;
  removeQuotation: (itemId: string, quotationId: string) => void;
  selectQuotation: (itemId: string, quotationId: string) => void;
}

const today = (): string => new Date().toISOString().slice(0, 10);

const defaultProjectDraft = (): ImplantationProjectDraft => ({
  name: '',
  description: '',
  budgetTargetCents: 0,
  status: 'planejamento',
  startDate: '',
  targetEndDate: '',
  notes: ''
});

const defaultDraft = (projectId = ''): ImplantationDraft => ({
  projectId,
  group: 'solo',
  name: '',
  description: '',
  priority: 'media',
  paymentMode: 'avista',
  deadline: '',
  notes: ''
});

const defaultQuotationDraft = (paymentMode: PaymentMode = 'avista'): QuotationDraft => ({
  supplier: '',
  totalCostCents: 0,
  freightCents: 0,
  source: 'Manual',
  notes: '',
  status: 'recebida',
  paymentMode,
  downPaymentCents: 0,
  installments: 0,
  installmentValueCents: 0,
  firstDueDate: '',
  paymentNotes: ''
});

const normalizeQuotation = (
  quotation: QuotationDraft | (Partial<QuotationDraft> & Pick<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'supplier' | 'totalCostCents' | 'status'>),
  fallbackPaymentMode: PaymentMode,
  fallbackCreatedAt = new Date().toISOString()
): Quotation => {
  return {
    id: 'id' in quotation ? quotation.id : createId(),
    supplier: quotation.supplier.trim(),
    totalCostCents: Math.max(0, Math.round(quotation.totalCostCents)),
    freightCents: Math.max(0, Math.round(quotation.freightCents ?? 0)),
    source: (quotation.source ?? 'Manual').trim() || 'Manual',
    notes: quotation.notes ?? '',
    status: quotation.status,
    createdAt: 'createdAt' in quotation ? quotation.createdAt : fallbackCreatedAt,
    updatedAt: 'updatedAt' in quotation ? quotation.updatedAt : fallbackCreatedAt,
    paymentMode: quotation.paymentMode ?? fallbackPaymentMode,
    downPaymentCents: Math.max(0, Math.round(quotation.downPaymentCents ?? 0)),
    installments: Math.max(0, Math.round(quotation.installments ?? 0)),
    installmentValueCents: Math.max(0, Math.round(quotation.installmentValueCents ?? 0)),
    firstDueDate: quotation.firstDueDate ?? '',
    paymentNotes: quotation.paymentNotes ?? ''
  };
};

const applyQuotationSelection = (item: ImplantationItem, quotationId: string): ImplantationItem => {
  const selectedQuote = item.quotations.find((quote) => quote.id === quotationId);
  if (!selectedQuote) return item;

  return {
    ...item,
    selectedQuotationId: quotationId,
    paymentMode: selectedQuote.paymentMode,
    quotations: item.quotations.map((quote) => ({
      ...quote,
      status: quote.id === quotationId ? 'selecionada' : quote.status === 'selecionada' ? 'recebida' : quote.status,
      updatedAt: quote.id === quotationId ? new Date().toISOString() : quote.updatedAt
    }))
  };
};

const withDraftProjectFallback = (projects: ImplantationProject[], draft: ImplantationDraft): ImplantationDraft => {
  if (draft.projectId || projects.length === 0) return draft;
  return { ...draft, projectId: projects[0].id };
};

const migrateLegacyState = (persistedState: unknown) => {
  const state = (persistedState as Partial<ImplantationState> | undefined) ?? {};
  const items = Array.isArray(state.items) ? state.items : [];
  const currentProjects = Array.isArray(state.projects) ? state.projects : [];

  if (currentProjects.length > 0) {
    return {
      ...state,
      projects: currentProjects,
      projectDraft: state.projectDraft ?? defaultProjectDraft(),
      draft: withDraftProjectFallback(currentProjects, state.draft ?? defaultDraft(currentProjects[0]?.id ?? '')),
      items
    };
  }

  const initialProjectId = createId();
  const initialBudgetCents = calculateImplantationTotals(items as ImplantationItem[]).totalCents;
  const createdAt = new Date().toISOString();
  const initialProject: ImplantationProject = {
    id: initialProjectId,
    name: 'Projeto inicial',
    description: 'Projeto criado automaticamente a partir da implantação existente.',
    budgetTargetCents: initialBudgetCents,
    status: 'planejamento',
    startDate: today(),
    targetEndDate: '',
    notes: '',
    createdAt
  };

  const migratedItems: ImplantationItem[] = items.map((entry) => {
    const item = entry as ImplantationItem & { projectId?: string };
    return {
      ...item,
      projectId: item.projectId ?? initialProjectId,
      quotations: (item.quotations ?? []).map((quotation) =>
        normalizeQuotation(
          {
            ...(quotation as Partial<Quotation>),
            id: quotation.id,
            supplier: quotation.supplier,
            totalCostCents: quotation.totalCostCents,
            status: quotation.status,
            createdAt: quotation.createdAt ?? new Date().toISOString(),
            updatedAt: (quotation as Partial<Quotation>).updatedAt ?? quotation.createdAt ?? new Date().toISOString()
          },
          item.paymentMode,
          quotation.createdAt
        )
      )
    };
  });

  return {
    ...state,
    projects: [initialProject],
    items: migratedItems,
    projectDraft: defaultProjectDraft(),
    draft: withDraftProjectFallback([initialProject], state.draft ?? defaultDraft(initialProjectId))
  };
};

export const useImplantationStore = create<ImplantationState>()(
  persist(
    (set, get) => ({
      projects: [],
      items: [],
      projectDraft: defaultProjectDraft(),
      draft: defaultDraft(),
      setProjectDraft: (patch) =>
        set((state) => {
          // Draft state is local
          return { projectDraft: { ...state.projectDraft, ...patch } };
        }),
      clearProjectDraft: () => set({ projectDraft: defaultProjectDraft() }),
      addProjectFromDraft: () => {
        let createdId: string | null = null;
        set((state) => {
          const draft = state.projectDraft;
          if (!draft.name.trim() || draft.budgetTargetCents <= 0) return state;

          createdId = createId();
          const project: ImplantationProject = {
            id: createdId,
            name: draft.name.trim(),
            description: draft.description.trim(),
            budgetTargetCents: Math.max(0, Math.round(draft.budgetTargetCents)),
            status: draft.status,
            startDate: draft.startDate,
            targetEndDate: draft.targetEndDate,
            notes: draft.notes.trim(),
            createdAt: new Date().toISOString()
          };

          const result = ImplantationProjectSchema.safeParse(project);
          if (!result.success) {
            console.error('Validation failed for addProjectFromDraft:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'implantation_projects',
            action: 'INSERT',
            payload: project
          });

          return {
            projects: [...state.projects, project],
            projectDraft: defaultProjectDraft(),
            draft: withDraftProjectFallback([...state.projects, project], state.draft)
          };
        });
        return createdId;
      },
      updateProject: (id, patch) =>
        set((state) => {
          const current = state.projects.find((p) => p.id === id);
          if (!current) return state;

          const project = {
            ...current,
            ...patch,
            budgetTargetCents:
              patch.budgetTargetCents === undefined ? current.budgetTargetCents : Math.max(0, Math.round(patch.budgetTargetCents))
          };

          const result = ImplantationProjectSchema.safeParse(project);
          if (!result.success) {
            console.error('Validation failed for updateProject:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'implantation_projects',
            action: 'UPDATE',
            payload: project
          });

          return {
            projects: state.projects.map((p) => (p.id === id ? project : p))
          };
        }),
      removeProject: (id) =>
        set((state) => {
          if (state.items.some((item) => item.projectId === id)) return state;
          const target = state.projects.find(p => p.id === id);
          if (!target) return state;

          const remainingProjects = state.projects.filter((project) => project.id !== id);
          const nextProjectId = remainingProjects[0]?.id ?? '';

          useSyncQueueStore.getState().enqueue({
            table: 'implantation_projects',
            action: 'DELETE',
            payload: { id }
          });

          return {
            projects: remainingProjects,
            draft: state.draft.projectId === id ? defaultDraft(nextProjectId) : withDraftProjectFallback(remainingProjects, state.draft)
          };
        }),
      setDraft: (patch) =>
        set((state) => {
          // Draft state is local
          return { draft: { ...state.draft, ...patch } };
        }),
      clearDraft: () => set((state) => ({ draft: defaultDraft(state.projects[0]?.id ?? '') })),
      addFromDraft: () => {
        let createdId: string | null = null;
        set((state) => {
          const draft = state.draft;
          if (!draft.projectId || !draft.name.trim()) return state;
          createdId = createId();

          const item: ImplantationItem = {
            id: createdId,
            projectId: draft.projectId,
            group: draft.group,
            name: draft.name.trim(),
            description: draft.description.trim(),
            priority: draft.priority,
            quotations: [],
            selectedQuotationId: null,
            paymentMode: draft.paymentMode,
            status: 'em_cotacao',
            deadline: draft.deadline,
            notes: draft.notes.trim()
          };

          const result = ImplantationItemSchema.safeParse(item);
          if (!result.success) {
            console.error('Validation failed for addFromDraft (item):', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'implantation_items',
            action: 'INSERT',
            payload: item
          });

          return {
            items: [...state.items, item],
            draft: defaultDraft(draft.projectId)
          };
        });
        return createdId;
      },
      updateItem: (id, patch) =>
        set((state) => {
          const current = state.items.find(i => i.id === id);
          if (!current) return state;

          const next = {
            ...current,
            ...patch,
            projectId: patch.projectId ?? current.projectId
          };

          const result = ImplantationItemSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateItem:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'implantation_items',
            action: 'UPDATE',
            payload: next
          });

          return {
            items: state.items.map((item) => (item.id === id ? next : item))
          };
        }),
      removeItem: (id) =>
        set((state) => {
          const target = state.items.find(i => i.id === id);
          if (!target) return state;

          useSyncQueueStore.getState().enqueue({
            table: 'implantation_items',
            action: 'DELETE',
            payload: { id }
          });

          return { items: state.items.filter((item) => item.id !== id) };
        }),
      addQuotation: (itemId, quotationDraft) =>
        set((state) => {
          const currentItem = state.items.find(i => i.id === itemId);
          if (!currentItem) return state;

          const newQuotation = normalizeQuotation(quotationDraft, quotationDraft.paymentMode);
          const nextItem = {
            ...currentItem,
            quotations: [...currentItem.quotations, newQuotation]
          };

          const result = ImplantationItemSchema.safeParse(nextItem);
          if (!result.success) {
            console.error('Validation failed for addQuotation:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'implantation_items',
            action: 'UPDATE',
            payload: nextItem
          });

          return {
            items: state.items.map((item) => (item.id === itemId ? nextItem : item))
          };
        }),
      updateQuotation: (itemId, quotationId, patch) =>
        set((state) => {
          const nowIso = new Date().toISOString();
          const targetItem = state.items.find(i => i.id === itemId);
          if (!targetItem) return state;

          const nextQuotations = targetItem.quotations.map((quotation) =>
            quotation.id === quotationId
              ? normalizeQuotation(
                  {
                    ...quotation,
                    ...patch,
                    updatedAt: nowIso
                  },
                  targetItem.paymentMode,
                  quotation.createdAt
                )
              : quotation
          );

          let nextItem: ImplantationItem = { ...targetItem, quotations: nextQuotations };

          if (patch.status === 'selecionada') {
            nextItem = applyQuotationSelection(nextItem, quotationId);
          } else if (nextItem.selectedQuotationId === quotationId) {
            const selectedQuote = nextItem.quotations.find((quotation) => quotation.id === quotationId);
            if (selectedQuote) {
              nextItem = { ...nextItem, paymentMode: selectedQuote.paymentMode };
            }
          }

          const result = ImplantationItemSchema.safeParse(nextItem);
          if (!result.success) {
            console.error('Validation failed for updateQuotation:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'implantation_items',
            action: 'UPDATE',
            payload: nextItem
          });

          return {
            items: state.items.map((item) => (item.id === itemId ? nextItem : item))
          };
        }),
      removeQuotation: (itemId, quotationId) =>
        set((state) => {
          const targetItem = state.items.find(i => i.id === itemId);
          if (!targetItem) return state;

          const remainingQuotations = targetItem.quotations.filter((quotation) => quotation.id !== quotationId);
          const removedSelected = targetItem.selectedQuotationId === quotationId;

          let nextItem: ImplantationItem;
          if (!removedSelected) {
            nextItem = { ...targetItem, quotations: remainingQuotations };
          } else {
            nextItem = {
              ...targetItem,
              quotations: remainingQuotations,
              selectedQuotationId: null,
              status: remainingQuotations.length > 0 ? ('negociando' as const) : ('em_cotacao' as const)
            };
          }

          const result = ImplantationItemSchema.safeParse(nextItem);
          if (!result.success) {
            console.error('Validation failed for removeQuotation:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'implantation_items',
            action: 'UPDATE',
            payload: nextItem
          });

          return {
            items: state.items.map((item) => (item.id === itemId ? nextItem : item))
          };
        }),
      selectQuotation: (itemId, quotationId) =>
        set((state) => {
          const targetItem = state.items.find(i => i.id === itemId);
          if (!targetItem) return state;

          const nextItem = applyQuotationSelection(targetItem, quotationId);

          const result = ImplantationItemSchema.safeParse(nextItem);
          if (!result.success) {
            console.error('Validation failed for selectQuotation:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'implantation_items',
            action: 'UPDATE',
            payload: nextItem
          });

          return {
            items: state.items.map((item) => (item.id === itemId ? nextItem : item))
          };
        })
    }),
    {
      name: 'dunamis-farm-os-implantation-v2',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: migrateLegacyState
    }
  )
);

export const implantationStoreDefaults = {
  defaultProjectDraft,
  defaultDraft,
  defaultQuotationDraft
};
