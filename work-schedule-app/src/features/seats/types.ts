export type SeatStatus = 'occupied' | 'free';

export type AssignedUser = {
    id: string;
    name: string;
};

export type Layout = {
    id: string;
    name: string;
    rows: number;
    cols: number;
    createdAt: string;
    updatedAt: string;
};

export type Seat = {
    id: string;
    code: number;
    layoutId: string;
    positionIndex: number;
    assignedUser?: AssignedUser | null;
    status: SeatStatus;
};

export type CreateLayoutPayload = {
    name: string;
    rows: number;
    cols: number;
};

export type UpdateLayoutPayload = {
    name: string;
    rows: number;
    cols: number;
};

export type CreateSeatPayload = {
    code: number;
    assigneeName?: string | null;
};

export type SeatOrderPayload = {
    id: string;
    positionIndex: number;
};
