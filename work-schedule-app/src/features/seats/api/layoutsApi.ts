import type { CreateLayoutPayload, CreateSeatPayload, Layout, Seat, SeatOrderPayload, UpdateLayoutPayload } from '../types';

export interface LayoutsApi {
    getLayouts(): Promise<Layout[]>;
    createLayout(payload: CreateLayoutPayload): Promise<Layout>;
    updateLayout(layoutId: string, payload: UpdateLayoutPayload): Promise<Layout>;
    deleteLayout(layoutId: string): Promise<void>;
    getSeats(layoutId: string): Promise<Seat[]>;
    updateSeatsOrder(layoutId: string, seatsWithPositionIndex: SeatOrderPayload[]): Promise<void>;
    createSeat(layoutId: string, payload: CreateSeatPayload): Promise<Seat>;
    updateSeat(seatId: string, payload: CreateSeatPayload): Promise<Seat>;
    deleteSeat(seatId: string): Promise<void>;
}
