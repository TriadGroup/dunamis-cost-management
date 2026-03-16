import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import { calculateImplantationTotals, type ImplantationItem, type ImplantationProject, type PaymentMode, type Quotation } from '@/entities';

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

const markPending = () => {
  useSyncQueueStore.getState().markPending();
};

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
          markPending();
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
          markPending();
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
          markPending();
          return {
            projects: state.projects.map((project) =>
              project.id === id
                ? {
                    ...project,
                    ...patch,
                    budgetTargetCents:
                      patch.budgetTargetCents === undefined ? project.budgetTargetCents : Math.max(0, Math.round(patch.budgetTargetCents))
                  }
                : project
            )
          };
        }),
      removeProject: (id) =>
        set((state) => {
          if (state.items.some((item) => item.projectId === id)) return state;
          const remainingProjects = state.projects.filter((project) => project.id !== id);
          const nextProjectId = remainingProjects[0]?.id ?? '';
          markPending();
          return {
            projects: remainingProjects,
            draft: state.draft.projectId === id ? defaultDraft(nextProjectId) : withDraftProjectFallback(remainingProjects, state.draft)
          };
        }),
      setDraft: (patch) =>
        set((state) => {
          markPending();
          return { draft: { ...state.draft, ...patch } };
        }),
      clearDraft: () => set((state) => ({ draft: defaultDraft(state.projects[0]?.id ?? '') })),
      addFromDraft: () => {
        let createdId: string | null = null;
        set((state) => {
          const draft = state.draft;
          if (!draft.projectId || !draft.name.trim()) return state;
          createdId = createId();
          markPending();
          return {
            items: [
              ...state.items,
              {
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
              }
            ],
            draft: defaultDraft(draft.projectId)
          };
        });
        return createdId;
      },
      updateItem: (id, patch) =>
        set((state) => {
          markPending();
          return {
            items: state.items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...patch,
                    projectId: patch.projectId ?? item.projectId
                  }
                : item
            )
          };
        }),
      removeItem: (id) =>
        set((state) => {
          markPending();
          return { items: state.items.filter((item) => item.id !== id) };
        }),
      addQuotation: (itemId, quotation) =>
        set((state) => {
          markPending();
          return {
            items: state.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    quotations: [...item.quotations, normalizeQuotation(quotation, quotation.paymentMode)]
                  }
                : item
            )
          };
        }),
      updateQuotation: (itemId, quotationId, patch) =>
        set((state) => {
          const nowIso = new Date().toISOString();
          const nextItems = state.items.map((item) => {
            if (item.id !== itemId) return item;

            const nextQuotations = item.quotations.map((quotation) =>
              quotation.id === quotationId
                ? normalizeQuotation(
                    {
                      ...quotation,
                      ...patch,
                      updatedAt: nowIso
                    },
                    item.paymentMode,
                    quotation.createdAt
                  )
                : quotation
            );

            let nextItem: ImplantationItem = { ...item, quotations: nextQuotations };

            if (patch.status === 'selecionada') {
              nextItem = applyQuotationSelection(nextItem, quotationId);
            } else if (nextItem.selectedQuotationId === quotationId) {
              const selectedQuote = nextItem.quotations.find((quotation) => quotation.id === quotationId);
              if (selectedQuote) {
                nextItem = { ...nextItem, paymentMode: selectedQuote.paymentMode };
              }
            }

            return nextItem;
          });

          markPending();
          return { items: nextItems };
        }),
      removeQuotation: (itemId, quotationId) =>
        set((state) => {
          const nextItems = state.items.map((item) => {
            if (item.id !== itemId) return item;

            const remainingQuotations = item.quotations.filter((quotation) => quotation.id !== quotationId);
            const removedSelected = item.selectedQuotationId === quotationId;

            if (!removedSelected) {
              return { ...item, quotations: remainingQuotations };
            }

            return {
              ...item,
              quotations: remainingQuotations,
              selectedQuotationId: null,
              status: remainingQuotations.length > 0 ? ('negociando' as const) : ('em_cotacao' as const)
            };
          });

          markPending();
          return { items: nextItems };
        }),
      selectQuotation: (itemId, quotationId) =>
        set((state) => {
          const nextItems = state.items.map((item) => (item.id === itemId ? applyQuotationSelection(item, quotationId) : item));
          markPending();
          return { items: nextItems };
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
