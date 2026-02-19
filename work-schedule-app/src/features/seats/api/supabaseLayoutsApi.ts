import { supabase } from '../../../config/supabase';
import type { LayoutsApi } from './layoutsApi';
import type { CreateLayoutPayload, CreateSeatPayload, Layout, Seat, SeatOrderPayload, UpdateLayoutPayload } from '../types';

type DbLayout = {
    id: string;
    name: string;
    rows: number;
    cols: number;
    is_active?: boolean;
    created_at: string;
    updated_at: string;
};

type DbLayoutItem = {
    id: string;
    layout_id?: string | null;
    seat_number: string;
    position_index: number;
    is_active: boolean;
    created_at: string;
};

type DbEmployee = {
    id: string;
    name: string;
    seat_number: string | null;
    is_active: boolean;
};

const MAIN_LAYOUT_ID = 'office-main';
const EMPLOYEE_CACHE_TTL_MS = 5000;

const parseSeatCode = (value: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const detectMultiLayoutSchemaProbe = async () => {
    const { error } = await supabase.from('seat_layouts').select('id').limit(1);
    if (!error) return true;
    if (error.code === '42P01') return false;
    throw error;
};

let multiLayoutSchemaPromise: Promise<boolean> | null = null;
const detectMultiLayoutSchema = async () => {
    if (!multiLayoutSchemaPromise) {
        multiLayoutSchemaPromise = detectMultiLayoutSchemaProbe();
    }
    return multiLayoutSchemaPromise;
};

let employeesBySeatCache: { value: Map<string, DbEmployee>; expiresAt: number } | null = null;
let employeesBySeatInFlight: Promise<Map<string, DbEmployee>> | null = null;
const invalidateEmployeesBySeatCache = () => {
    employeesBySeatCache = null;
};

const loadEmployeesBySeat = async () => {
    const now = Date.now();
    if (employeesBySeatCache && employeesBySeatCache.expiresAt > now) {
        return employeesBySeatCache.value;
    }

    if (employeesBySeatInFlight) {
        return employeesBySeatInFlight;
    }

    employeesBySeatInFlight = (async () => {
        const { data, error } = await supabase
            .from('employees')
            .select('id,name,seat_number,is_active')
            .eq('is_active', true)
            .not('seat_number', 'is', null);

        if (error) throw error;

        const map = new Map<string, DbEmployee>();
        (data ?? []).forEach((employee) => {
            if (employee.seat_number) {
                map.set(employee.seat_number, employee as DbEmployee);
            }
        });

        employeesBySeatCache = {
            value: map,
            expiresAt: Date.now() + EMPLOYEE_CACHE_TTL_MS
        };

        return map;
    })();

    try {
        return await employeesBySeatInFlight;
    } finally {
        employeesBySeatInFlight = null;
    }
};

const assignEmployeeToSeat = async (seatNumber: string, assigneeName?: string | null) => {
    const normalizedName = assigneeName?.trim();

    const { error: clearSeatError } = await supabase
        .from('employees')
        .update({ seat_number: null })
        .eq('seat_number', seatNumber);

    if (clearSeatError) throw clearSeatError;

    if (!normalizedName) {
        invalidateEmployeesBySeatCache();
        return;
    }

    const { data: existing, error: findError } = await supabase
        .from('employees')
        .select('id,name,seat_number,is_active')
        .eq('name', normalizedName)
        .limit(1)
        .maybeSingle();

    if (findError) throw findError;

    if (existing) {
        const { error: updateError } = await supabase
            .from('employees')
            .update({ seat_number: seatNumber, is_active: true })
            .eq('id', existing.id);

        if (updateError) throw updateError;
        invalidateEmployeesBySeatCache();
        return;
    }

    const { error: insertError } = await supabase.from('employees').insert({
        name: normalizedName,
        seat_number: seatNumber,
        is_active: true
    });

    if (insertError) throw insertError;
    invalidateEmployeesBySeatCache();
};

const clearSeatAssignment = async (seatNumber: string) => {
    const { error } = await supabase
        .from('employees')
        .update({ seat_number: null })
        .eq('seat_number', seatNumber);

    if (error) throw error;
    invalidateEmployeesBySeatCache();
};

const mapLayout = (layout: DbLayout): Layout => ({
    id: layout.id,
    name: layout.name,
    rows: layout.rows,
    cols: layout.cols,
    createdAt: layout.created_at,
    updatedAt: layout.updated_at
});

export const supabaseLayoutsApi: LayoutsApi = {
    async getLayouts() {
        const isMulti = await detectMultiLayoutSchema();

        if (isMulti) {
            const { data, error } = await supabase
                .from('seat_layouts')
                .select('id,name,rows,cols,created_at,updated_at,is_active')
                .eq('is_active', true)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return ((data ?? []) as DbLayout[]).map(mapLayout);
        }

        const { data, error } = await supabase
            .from('seat_layout_items')
            .select('id')
            .eq('is_active', true);

        if (error) throw error;

        const seatCount = data?.length ?? 0;
        const cols = 6;
        const rows = Math.max(1, Math.ceil(Math.max(seatCount, 1) / cols));
        const now = new Date().toISOString();

        return [
            {
                id: MAIN_LAYOUT_ID,
                name: 'Офис',
                rows,
                cols,
                createdAt: now,
                updatedAt: now
            }
        ];
    },

    async createLayout(payload: CreateLayoutPayload) {
        const isMulti = await detectMultiLayoutSchema();
        if (!isMulti) {
            throw new Error('Изпълнете SQL миграцията `SEATS_MULTI_LAYOUTS_SETUP.sql` в Supabase, за да работи създаването на layout.');
        }

        const { data, error } = await supabase
            .from('seat_layouts')
            .insert({
                name: payload.name.trim(),
                rows: payload.rows,
                cols: payload.cols,
                is_active: true
            })
            .select('id,name,rows,cols,created_at,updated_at')
            .single();

        if (error) throw error;
        return mapLayout(data as DbLayout);
    },

    async updateLayout(layoutId: string, payload: UpdateLayoutPayload) {
        const isMulti = await detectMultiLayoutSchema();
        if (!isMulti) {
            throw new Error('Изпълнете SQL миграцията `SEATS_MULTI_LAYOUTS_SETUP.sql` в Supabase, за да работи редакцията на layout.');
        }

        const { data, error } = await supabase
            .from('seat_layouts')
            .update({
                name: payload.name.trim(),
                rows: payload.rows,
                cols: payload.cols,
                updated_at: new Date().toISOString()
            })
            .eq('id', layoutId)
            .select('id,name,rows,cols,created_at,updated_at')
            .single();

        if (error) throw error;
        return mapLayout(data as DbLayout);
    },

    async deleteLayout(layoutId: string) {
        const isMulti = await detectMultiLayoutSchema();
        if (!isMulti) {
            throw new Error('Изтриването на layout изисква multi-layout схема. Първо изпълнете `SEATS_MULTI_LAYOUTS_SETUP.sql`.');
        }

        const { data: seats, error: seatsError } = await supabase
            .from('seat_layout_items')
            .select('seat_number')
            .eq('layout_id', layoutId)
            .eq('is_active', true);

        if (seatsError) throw seatsError;

        const seatNumbers = (seats ?? []).map((row) => row.seat_number);
        if (seatNumbers.length > 0) {
            const { error: clearEmployeesError } = await supabase
                .from('employees')
                .update({ seat_number: null })
                .in('seat_number', seatNumbers);

            if (clearEmployeesError) throw clearEmployeesError;
            invalidateEmployeesBySeatCache();
        }

        const { error } = await supabase.from('seat_layouts').delete().eq('id', layoutId);
        if (error) throw error;
    },

    async getSeats(layoutId: string) {
        const isMulti = await detectMultiLayoutSchema();
        const employeesBySeat = await loadEmployeesBySeat();

        const query = supabase
            .from('seat_layout_items')
            .select('id,layout_id,seat_number,position_index,is_active,created_at')
            .eq('is_active', true)
            .order('position_index', { ascending: true });

        const { data, error } = isMulti ? await query.eq('layout_id', layoutId) : await query;
        if (error) throw error;

        return ((data ?? []) as DbLayoutItem[]).map((item) => {
            const occupant = employeesBySeat.get(item.seat_number);

            return {
                id: item.id,
                code: parseSeatCode(item.seat_number),
                layoutId: isMulti ? layoutId : MAIN_LAYOUT_ID,
                positionIndex: item.position_index,
                assignedUser: occupant ? { id: occupant.id, name: occupant.name } : null,
                status: occupant ? 'occupied' : 'free'
            } as Seat;
        });
    },

    async updateSeatsOrder(layoutId: string, seatsWithPositionIndex: SeatOrderPayload[]) {
        const isMulti = await detectMultiLayoutSchema();

        const temporaryOffset = 10000;

        await Promise.all(
            seatsWithPositionIndex.map(async (item) => {
                const tempQuery = supabase
                    .from('seat_layout_items')
                    .update({ position_index: item.positionIndex + temporaryOffset })
                    .eq('id', item.id);

                const { error: tempError } = isMulti ? await tempQuery.eq('layout_id', layoutId) : await tempQuery;
                if (tempError) throw tempError;
            })
        );

        await Promise.all(
            seatsWithPositionIndex.map(async (item) => {
                const finalQuery = supabase
                    .from('seat_layout_items')
                    .update({ position_index: item.positionIndex })
                    .eq('id', item.id);

                const { error: finalError } = isMulti ? await finalQuery.eq('layout_id', layoutId) : await finalQuery;
                if (finalError) throw finalError;
            })
        );
    },

    async createSeat(layoutId: string, payload: CreateSeatPayload) {
        const code = Number(payload.code);
        if (!Number.isFinite(code) || code <= 0) {
            throw new Error('Невалиден номер на място.');
        }

        const seatNumber = String(code);
        const isMulti = await detectMultiLayoutSchema();

        const { data: duplicate, error: duplicateError } = await supabase
            .from('seat_layout_items')
            .select('id')
            .eq('seat_number', seatNumber)
            .eq('is_active', true)
            .limit(1);

        if (duplicateError) throw duplicateError;
        if ((duplicate ?? []).length > 0) {
            throw new Error(`Място ${seatNumber} вече съществува.`);
        }

        const currentQuery = supabase
            .from('seat_layout_items')
            .select('id,position_index')
            .eq('is_active', true)
            .order('position_index', { ascending: true });

        const { data: current, error: currentError } = isMulti
            ? await currentQuery.eq('layout_id', layoutId)
            : await currentQuery;

        if (currentError) throw currentError;

        const nextPosition = (current ?? []).length;

        const insertPayload: Record<string, unknown> = {
            seat_number: seatNumber,
            position_index: nextPosition,
            is_active: true
        };

        if (isMulti) {
            insertPayload.layout_id = layoutId;
        }

        const { data: inserted, error: insertError } = await supabase
            .from('seat_layout_items')
            .insert(insertPayload)
            .select('id,seat_number,position_index')
            .single();

        if (insertError) throw insertError;

        await assignEmployeeToSeat(seatNumber, payload.assigneeName);

        const { data: employee, error: employeeError } = await supabase
            .from('employees')
            .select('id,name')
            .eq('seat_number', seatNumber)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (employeeError) throw employeeError;

        return {
            id: inserted.id,
            code,
            layoutId: isMulti ? layoutId : MAIN_LAYOUT_ID,
            positionIndex: inserted.position_index,
            assignedUser: employee ? { id: employee.id, name: employee.name } : null,
            status: employee ? 'occupied' : 'free'
        };
    },

    async updateSeat(seatId: string, payload: CreateSeatPayload) {
        const code = Number(payload.code);
        if (!Number.isFinite(code) || code <= 0) {
            throw new Error('Невалиден номер на място.');
        }

        const isMulti = await detectMultiLayoutSchema();
        const { data: currentSeat, error: currentSeatError } = await supabase
            .from('seat_layout_items')
            .select('id,layout_id,seat_number,position_index')
            .eq('id', seatId)
            .single();

        if (currentSeatError) throw currentSeatError;

        const newSeatNumber = String(code);
        const oldSeatNumber = currentSeat.seat_number;
        const layoutId = isMulti ? currentSeat.layout_id ?? MAIN_LAYOUT_ID : MAIN_LAYOUT_ID;

        if (newSeatNumber !== oldSeatNumber) {
            const duplicateQuery = supabase
                .from('seat_layout_items')
                .select('id')
                .eq('seat_number', newSeatNumber)
                .eq('is_active', true)
                .neq('id', seatId)
                .limit(1);

            const { data: duplicate, error: duplicateError } = isMulti
                ? await duplicateQuery.eq('layout_id', currentSeat.layout_id)
                : await duplicateQuery;

            if (duplicateError) throw duplicateError;
            if ((duplicate ?? []).length > 0) {
                throw new Error(`Място ${newSeatNumber} вече съществува.`);
            }
        }

        const { error: updateSeatError } = await supabase
            .from('seat_layout_items')
            .update({ seat_number: newSeatNumber })
            .eq('id', seatId);

        if (updateSeatError) throw updateSeatError;

        if (newSeatNumber !== oldSeatNumber) {
            await clearSeatAssignment(oldSeatNumber);
        }

        await assignEmployeeToSeat(newSeatNumber, payload.assigneeName);

        const { data: employee, error: employeeError } = await supabase
            .from('employees')
            .select('id,name')
            .eq('seat_number', newSeatNumber)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        if (employeeError) throw employeeError;

        return {
            id: seatId,
            code,
            layoutId,
            positionIndex: currentSeat.position_index,
            assignedUser: employee ? { id: employee.id, name: employee.name } : null,
            status: employee ? 'occupied' : 'free'
        };
    },

    async deleteSeat(seatId: string) {
        const { data: seat, error: seatError } = await supabase
            .from('seat_layout_items')
            .select('id,seat_number')
            .eq('id', seatId)
            .single();

        if (seatError) throw seatError;

        const { error: clearEmployeeError } = await supabase
            .from('employees')
            .update({ seat_number: null })
            .eq('seat_number', seat.seat_number);

        if (clearEmployeeError) throw clearEmployeeError;
        invalidateEmployeesBySeatCache();

        const { error: deleteError } = await supabase.from('seat_layout_items').delete().eq('id', seatId);
        if (deleteError) throw deleteError;
    }
};
