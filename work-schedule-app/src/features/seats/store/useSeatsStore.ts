import { arrayMove } from '@dnd-kit/sortable';
import { create } from 'zustand';
import type { LayoutsApi } from '../api/layoutsApi';
import { supabaseLayoutsApi } from '../api/supabaseLayoutsApi';
import type { CreateSeatPayload, Layout, Seat } from '../types';

const api: LayoutsApi = supabaseLayoutsApi;
const emptyToken = (layoutId: string, index: number) => `empty:${layoutId}:${index}`;
const seatToken = (layoutId: string, seatId: string) => `seat:${layoutId}:${seatId}`;
const isEmptyToken = (itemId: string) => itemId.startsWith('empty:');

const buildSlots = (layout: Layout, seats: Seat[]): string[] => {
    const capacity = layout.rows * layout.cols;
    const slots = Array.from({ length: capacity }, (_, index) => emptyToken(layout.id, index));

    seats.forEach((seat) => {
        if (seat.positionIndex >= 0 && seat.positionIndex < capacity) {
            slots[seat.positionIndex] = seatToken(layout.id, seat.id);
        }
    });

    return slots;
};

type SeatsStore = {
    layouts: Layout[];
    seatsByLayout: Record<string, Seat[]>;
    slotsByLayout: Record<string, string[]>;
    loading: boolean;
    error: string | null;
    isCreateModalOpen: boolean;
    editingLayoutId: string | null;
    initialize: () => Promise<void>;
    openCreateModal: () => void;
    closeCreateModal: () => void;
    createLayout: (name: string, rows: number, cols: number) => Promise<void>;
    openEditModal: (layoutId: string) => void;
    closeEditModal: () => void;
    updateLayout: (layoutId: string, name: string, rows: number, cols: number) => Promise<void>;
    deleteLayout: (layoutId: string) => Promise<void>;
    reorderLive: (layoutId: string, activeId: string, overId: string) => void;
    persistOrder: (layoutId: string) => Promise<void>;
    addSeat: (layoutId: string, payload: CreateSeatPayload) => Promise<void>;
    updateSeat: (layoutId: string, seatId: string, payload: CreateSeatPayload) => Promise<void>;
    deleteSeat: (layoutId: string, seatId: string) => Promise<void>;
};

export const useSeatsStore = create<SeatsStore>((set, get) => ({
    layouts: [],
    seatsByLayout: {},
    slotsByLayout: {},
    loading: true,
    error: null,
    isCreateModalOpen: false,
    editingLayoutId: null,

    initialize: async () => {
        set({ loading: true, error: null });

        try {
            const layouts = await api.getLayouts();
            const seatsEntries = await Promise.all(layouts.map(async (layout) => [layout.id, await api.getSeats(layout.id)] as const));

            const seatsByLayout: Record<string, Seat[]> = {};
            const slotsByLayout: Record<string, string[]> = {};

            layouts.forEach((layout) => {
                const seats = seatsEntries.find(([layoutId]) => layoutId === layout.id)?.[1] ?? [];
                seatsByLayout[layout.id] = seats;
                slotsByLayout[layout.id] = buildSlots(layout, seats);
            });

            set({ layouts, seatsByLayout, slotsByLayout, loading: false, error: null });
        } catch (error) {
            set({ loading: false, error: error instanceof Error ? error.message : '?????? ??? ????????? ?? ???????.' });
        }
    },

    openCreateModal: () => set({ isCreateModalOpen: true }),
    closeCreateModal: () => set({ isCreateModalOpen: false }),

    createLayout: async (name, rows, cols) => {
        const layout = await api.createLayout({ name, rows, cols });

        set((state) => ({
            layouts: [...state.layouts, layout],
            seatsByLayout: { ...state.seatsByLayout, [layout.id]: [] },
            slotsByLayout: { ...state.slotsByLayout, [layout.id]: buildSlots(layout, []) },
            isCreateModalOpen: false
        }));
    },

    openEditModal: (layoutId) => set({ editingLayoutId: layoutId }),
    closeEditModal: () => set({ editingLayoutId: null }),

    updateLayout: async (layoutId, name, rows, cols) => {
        const state = get();
        const currentLayout = state.layouts.find((layout) => layout.id === layoutId);
        if (!currentLayout) return;

        const seats = (state.seatsByLayout[layoutId] ?? []).slice().sort((a, b) => a.positionIndex - b.positionIndex);
        const capacity = rows * cols;

        if (seats.length > capacity) {
            throw new Error(`?? ???? ?? ?? ?????? ?? ${rows}x${cols}. ????? ? layout: ${seats.length}.`);
        }

        const normalizedSeats = seats.map((seat, index) => ({ ...seat, positionIndex: index }));

        const updatedLayout = await api.updateLayout(layoutId, { name, rows, cols });
        await api.updateSeatsOrder(layoutId, normalizedSeats.map((seat) => ({ id: seat.id, positionIndex: seat.positionIndex })));

        set((draft) => ({
            layouts: draft.layouts.map((layout) => (layout.id === layoutId ? updatedLayout : layout)),
            seatsByLayout: {
                ...draft.seatsByLayout,
                [layoutId]: normalizedSeats
            },
            slotsByLayout: {
                ...draft.slotsByLayout,
                [layoutId]: buildSlots(updatedLayout, normalizedSeats)
            },
            editingLayoutId: null
        }));
    },

    deleteLayout: async (layoutId) => {
        await api.deleteLayout(layoutId);
        set((state) => {
            const nextLayouts = state.layouts.filter((layout) => layout.id !== layoutId);
            const nextSeatsByLayout = { ...state.seatsByLayout };
            const nextSlotsByLayout = { ...state.slotsByLayout };
            delete nextSeatsByLayout[layoutId];
            delete nextSlotsByLayout[layoutId];

            return {
                layouts: nextLayouts,
                seatsByLayout: nextSeatsByLayout,
                slotsByLayout: nextSlotsByLayout,
                editingLayoutId: state.editingLayoutId === layoutId ? null : state.editingLayoutId
            };
        });
    },

    reorderLive: (layoutId, activeId, overId) => {
        if (activeId === overId) return;

        const slots = get().slotsByLayout[layoutId] ?? [];
        const oldIndex = slots.indexOf(activeId);
        const newIndex = slots.indexOf(overId);

        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

        set((state) => ({
            slotsByLayout: {
                ...state.slotsByLayout,
                [layoutId]: arrayMove(slots, oldIndex, newIndex)
            }
        }));
    },

    persistOrder: async (layoutId) => {
        const state = get();
        const layout = state.layouts.find((item) => item.id === layoutId);
        if (!layout) return;

        const slots = state.slotsByLayout[layoutId] ?? [];
        const seats = state.seatsByLayout[layoutId] ?? [];
        const seatById = new Map(seats.map((seat) => [seatToken(layoutId, seat.id), seat]));

        const reordered = slots
            .map((slotId, positionIndex) => {
                if (isEmptyToken(slotId)) return null;
                const seat = seatById.get(slotId);
                return seat ? { ...seat, positionIndex } : null;
            })
            .filter(Boolean) as Seat[];

        set((draft) => ({
            seatsByLayout: {
                ...draft.seatsByLayout,
                [layoutId]: reordered
            }
        }));

        await api.updateSeatsOrder(layoutId, reordered.map((seat) => ({ id: seat.id, positionIndex: seat.positionIndex })));
    },

    addSeat: async (layoutId, payload) => {
        await api.createSeat(layoutId, payload);
        const layout = get().layouts.find((item) => item.id === layoutId);
        if (!layout) return;

        const seats = await api.getSeats(layoutId);
        set((state) => ({
            seatsByLayout: {
                ...state.seatsByLayout,
                [layoutId]: seats
            },
            slotsByLayout: {
                ...state.slotsByLayout,
                [layoutId]: buildSlots(layout, seats)
            }
        }));
    },

    updateSeat: async (layoutId, seatId, payload) => {
        await api.updateSeat(seatId, payload);
        const layout = get().layouts.find((item) => item.id === layoutId);
        if (!layout) return;

        const seats = await api.getSeats(layoutId);
        set((state) => ({
            seatsByLayout: {
                ...state.seatsByLayout,
                [layoutId]: seats
            },
            slotsByLayout: {
                ...state.slotsByLayout,
                [layoutId]: buildSlots(layout, seats)
            }
        }));
    },

    deleteSeat: async (layoutId, seatId) => {
        await api.deleteSeat(seatId);
        const layout = get().layouts.find((item) => item.id === layoutId);
        if (!layout) return;

        const seats = await api.getSeats(layoutId);
        set((state) => ({
            seatsByLayout: {
                ...state.seatsByLayout,
                [layoutId]: seats
            },
            slotsByLayout: {
                ...state.slotsByLayout,
                [layoutId]: buildSlots(layout, seats)
            }
        }));
    }
}));
