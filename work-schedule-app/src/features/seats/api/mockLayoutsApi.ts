import type { LayoutsApi } from './layoutsApi';
import type { CreateLayoutPayload, CreateSeatPayload, Layout, Seat, SeatOrderPayload, UpdateLayoutPayload } from '../types';

const LAYOUTS_KEY = 'seats.layouts.v1';
const SEATS_KEY = 'seats.items.v1';

const nowIso = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const seedLayouts = (): Layout[] => {
    const createdAt = nowIso();

    return [
        { id: 'layout-2x3', name: 'Екип 1', rows: 2, cols: 3, createdAt, updatedAt: createdAt },
        { id: 'layout-2x4', name: 'Екип 2', rows: 2, cols: 4, createdAt, updatedAt: createdAt },
        { id: 'layout-1x4', name: 'Екип 3', rows: 1, cols: 4, createdAt, updatedAt: createdAt }
    ];
};

const seedSeats = (): Seat[] => {
    const users = ['Ivan Ivanov', 'Maria Petrova', 'Georgi Kolev', 'Nikolay Todorov', 'Ani Stefanova'];
    const base: Seat[] = [];

    for (let code = 275; code <= 292; code += 1) {
        const layoutId = code <= 280 ? 'layout-2x3' : code <= 288 ? 'layout-2x4' : 'layout-1x4';
        const positionIndex = layoutId === 'layout-2x3' ? code - 275 : layoutId === 'layout-2x4' ? code - 281 : code - 289;
        const isOccupied = code % 3 !== 0;

        base.push({
            id: createId('seat'),
            code,
            layoutId,
            positionIndex,
            assignedUser: isOccupied ? { id: `user-${code}`, name: users[code % users.length] } : null,
            status: isOccupied ? 'occupied' : 'free'
        });
    }

    return base;
};

const readLayouts = (): Layout[] => {
    const raw = localStorage.getItem(LAYOUTS_KEY);
    if (raw) return JSON.parse(raw) as Layout[];

    const layouts = seedLayouts();
    localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts));
    return layouts;
};

const readSeats = (): Seat[] => {
    const raw = localStorage.getItem(SEATS_KEY);
    if (raw) return JSON.parse(raw) as Seat[];

    const seats = seedSeats();
    localStorage.setItem(SEATS_KEY, JSON.stringify(seats));
    return seats;
};

const writeLayouts = (layouts: Layout[]) => localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts));
const writeSeats = (seats: Seat[]) => localStorage.setItem(SEATS_KEY, JSON.stringify(seats));

const withLatency = async <T,>(value: T): Promise<T> => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return value;
};

export const mockLayoutsApi: LayoutsApi = {
    async getLayouts() {
        return withLatency(readLayouts().sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    },

    async createLayout(payload: CreateLayoutPayload) {
        const layouts = readLayouts();
        const createdAt = nowIso();
        const layout: Layout = {
            id: createId('layout'),
            name: payload.name.trim(),
            rows: payload.rows,
            cols: payload.cols,
            createdAt,
            updatedAt: createdAt
        };

        writeLayouts([...layouts, layout]);
        return withLatency(layout);
    },

    async updateLayout(layoutId: string, payload: UpdateLayoutPayload) {
        const layouts = readLayouts();
        let updatedLayout: Layout | null = null;

        const nextLayouts = layouts.map((layout) => {
            if (layout.id !== layoutId) return layout;
            updatedLayout = { ...layout, ...payload, name: payload.name.trim(), updatedAt: nowIso() };
            return updatedLayout;
        });

        if (!updatedLayout) throw new Error('Layout not found.');
        writeLayouts(nextLayouts);
        return withLatency(updatedLayout);
    },

    async deleteLayout(layoutId: string) {
        writeLayouts(readLayouts().filter((layout) => layout.id !== layoutId));
        writeSeats(readSeats().filter((seat) => seat.layoutId !== layoutId));
        await withLatency(undefined);
    },

    async getSeats(layoutId: string) {
        const seats = readSeats().filter((seat) => seat.layoutId === layoutId).sort((a, b) => a.positionIndex - b.positionIndex);
        return withLatency(seats);
    },

    async updateSeatsOrder(layoutId: string, seatsWithPositionIndex: SeatOrderPayload[]) {
        const byId = new Map(seatsWithPositionIndex.map((item) => [item.id, item.positionIndex]));
        const nextSeats = readSeats().map((seat) => {
            if (seat.layoutId !== layoutId) return seat;
            const positionIndex = byId.get(seat.id);
            return positionIndex === undefined ? seat : { ...seat, positionIndex };
        });

        writeSeats(nextSeats);
        await withLatency(undefined);
    },

    async createSeat(layoutId: string, payload: CreateSeatPayload) {
        const layouts = readLayouts();
        const layout = layouts.find((item) => item.id === layoutId);
        if (!layout) throw new Error('Layout не е намерен.');

        const seats = readSeats();
        const current = seats.filter((seat) => seat.layoutId === layoutId);
        const capacity = layout.rows * layout.cols;
        if (current.length >= capacity) throw new Error('Layout-ът е пълен. Премахнете място преди да добавите ново.');

        const code = Number(payload.code);
        if (!Number.isFinite(code)) throw new Error('Невалиден номер на място.');
        if (seats.some((seat) => seat.code === code)) throw new Error('Номерът на мястото вече съществува.');

        const usedPositions = new Set(current.map((seat) => seat.positionIndex));
        let positionIndex = 0;
        while (usedPositions.has(positionIndex)) positionIndex += 1;

        const seat: Seat = {
            id: createId('seat'),
            code,
            layoutId,
            positionIndex,
            assignedUser: payload.assigneeName?.trim() ? { id: createId('user'), name: payload.assigneeName.trim() } : null,
            status: payload.assigneeName?.trim() ? 'occupied' : 'free'
        };

        writeSeats([...seats, seat]);
        return withLatency(seat);
    },

    async updateSeat(seatId: string, payload: CreateSeatPayload) {
        const seats = readSeats();
        const current = seats.find((seat) => seat.id === seatId);
        if (!current) throw new Error('Мястото не е намерено.');

        const code = Number(payload.code);
        if (!Number.isFinite(code) || code <= 0) throw new Error('Невалиден номер на място.');
        if (seats.some((seat) => seat.id !== seatId && seat.code === code)) throw new Error('Номерът на мястото вече съществува.');

        const nextSeats = seats.map((seat) =>
            seat.id === seatId
                ? {
                      ...seat,
                      code,
                      assignedUser: payload.assigneeName?.trim()
                          ? {
                                id: seat.assignedUser?.id ?? createId('user'),
                                name: payload.assigneeName.trim()
                            }
                          : null,
                      status: payload.assigneeName?.trim() ? 'occupied' : 'free'
                  }
                : seat
        );

        writeSeats(nextSeats);
        const updated = nextSeats.find((seat) => seat.id === seatId);
        if (!updated) throw new Error('Мястото не е намерено.');
        return withLatency(updated);
    },

    async deleteSeat(seatId: string) {
        writeSeats(readSeats().filter((seat) => seat.id !== seatId));
        await withLatency(undefined);
    }
};
