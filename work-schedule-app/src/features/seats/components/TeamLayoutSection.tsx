import { useMemo, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MeasuringStrategy,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragOverEvent,
    type DragStartEvent
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSeatsStore } from '../store/useSeatsStore';
import { SortableSeatCard } from './SortableSeatCard';
import { AddSeatModal } from './AddSeatModal';
import { EditSeatModal } from './EditSeatModal';
import type { Seat } from '../types';
import { useAuth } from '../../../contexts/AuthContext';

type TeamLayoutSectionProps = {
    layoutId: string;
};

const isEmptyToken = (id: string) => id.startsWith('empty:');
const seatToken = (layoutIdValue: string, seatId: string) => `seat:${layoutIdValue}:${seatId}`;

export const TeamLayoutSection = ({ layoutId }: TeamLayoutSectionProps) => {
    const { isAdmin } = useAuth();

    const layout = useSeatsStore(useCallback((state) => state.layouts.find((item) => item.id === layoutId) ?? null, [layoutId]));
    const seats = useSeatsStore(useCallback((state) => state.seatsByLayout[layoutId] ?? [], [layoutId]));
    const slots = useSeatsStore(useCallback((state) => state.slotsByLayout[layoutId] ?? [], [layoutId]));
    const reorderLive = useSeatsStore((state) => state.reorderLive);
    const persistOrder = useSeatsStore((state) => state.persistOrder);
    const openEditModal = useSeatsStore((state) => state.openEditModal);
    const addSeat = useSeatsStore((state) => state.addSeat);
    const updateSeat = useSeatsStore((state) => state.updateSeat);
    const deleteSeat = useSeatsStore((state) => state.deleteSeat);

    const [activeSeatToken, setActiveSeatToken] = useState<string | null>(null);
    const [isAddSeatOpen, setIsAddSeatOpen] = useState(false);
    const [editingSeat, setEditingSeat] = useState<Seat | null>(null);

    const seatByToken = useMemo(() => new Map(seats.map((seat) => [seatToken(layoutId, seat.id), seat])), [layoutId, seats]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        if (!isAdmin) return;
        const id = String(event.active.id);
        if (isEmptyToken(id)) return;
        setActiveSeatToken(id);
    }, [isAdmin]);

    const handleDragOver = useCallback(
        (event: DragOverEvent) => {
            if (!isAdmin || !event.over) return;

            const activeId = String(event.active.id);
            const overId = String(event.over.id);
            if (activeId === overId) return;

            reorderLive(layoutId, activeId, overId);
        },
        [isAdmin, layoutId, reorderLive]
    );

    const handleDragEnd = useCallback(async () => {
        if (!isAdmin) return;
        setActiveSeatToken(null);
        try {
            await persistOrder(layoutId);
        } catch (error) {
            console.error('Грешка при запазване на подредбата:', error);
            alert('Подредбата не беше запазена. Моля, опитайте отново.');
        }
    }, [isAdmin, layoutId, persistOrder]);

    const handleDragCancel = useCallback(() => {
        setActiveSeatToken(null);
    }, []);

    const handleOpenEdit = useCallback(() => {
        if (!isAdmin) return;
        openEditModal(layoutId);
    }, [isAdmin, layoutId, openEditModal]);

    const handleOpenAddSeat = useCallback(() => {
        if (!isAdmin) return;
        setIsAddSeatOpen(true);
    }, [isAdmin]);

    const handleCloseAddSeat = useCallback(() => {
        setIsAddSeatOpen(false);
    }, []);

    const handleAddSeat = useCallback(
        async (code: number, assigneeName: string) => {
            await addSeat(layoutId, { code, assigneeName });
            setIsAddSeatOpen(false);
        },
        [addSeat, layoutId]
    );

    const handleEditSeat = useCallback((seat: Seat) => {
        if (!isAdmin) return;
        setEditingSeat(seat);
    }, [isAdmin]);

    const handleCloseEditSeat = useCallback(() => {
        setEditingSeat(null);
    }, []);

    const handleUpdateSeat = useCallback(
        async (code: number, assigneeName: string) => {
            if (!editingSeat) return;
            await updateSeat(layoutId, editingSeat.id, { code, assigneeName });
            setEditingSeat(null);
        },
        [editingSeat, layoutId, updateSeat]
    );

    const handleDeleteSeat = useCallback(
        async (seatId: string) => {
            if (!isAdmin) return;
            const confirmed = confirm('Сигурни ли сте, че искате да изтриете това място от layout-а?');
            if (!confirmed) return;
            await deleteSeat(layoutId, seatId);
        },
        [deleteSeat, isAdmin, layoutId]
    );

    if (!layout) return null;

    const capacity = layout.rows * layout.cols;
    const canAddSeat = seats.length < capacity;
    const activeSeat = activeSeatToken ? seatByToken.get(activeSeatToken) ?? null : null;

    const overlayContent = (
        <DragOverlay adjustScale={false} dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
            {activeSeat ? (
                <div className={`office-seat ${activeSeat.status === 'occupied' ? 'occupied' : 'empty'}`}>
                    <div className="seat-number">{activeSeat.code}</div>
                    <div className="seat-name">{activeSeat.assignedUser?.name ?? 'Свободно'}</div>
                </div>
            ) : null}
        </DragOverlay>
    );

    return (
        <section className="team-layout-section" aria-label={layout.name}>
            <header className="team-layout-header">
                <div>
                    <h2 className="team-layout-title">{layout.name}</h2>
                    <p className="team-layout-meta">
                        {layout.rows} x {layout.cols} ({seats.length}/{capacity})
                    </p>
                </div>

                {isAdmin && (
                    <div className="team-layout-actions">
                        <button className="layout-btn layout-btn-secondary" onClick={handleOpenEdit}>
                            Редакция
                        </button>
                        <button className="layout-btn layout-btn-secondary" onClick={handleOpenAddSeat} disabled={!canAddSeat}>
                            Добави място
                        </button>
                    </div>
                )}
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                measuring={{
                    droppable: {
                        strategy: MeasuringStrategy.Always
                    }
                }}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableContext items={slots} strategy={rectSortingStrategy}>
                    <div className="office-grid" style={{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)` }}>
                        {slots.map((slotId) => (
                            <SortableSeatCard
                                key={slotId}
                                id={slotId}
                                seat={seatByToken.get(slotId) ?? null}
                                draggable={isAdmin}
                                editable={isAdmin}
                                showDelete={isAdmin}
                                onDeleteSeat={handleDeleteSeat}
                                onEditSeat={handleEditSeat}
                            />
                        ))}
                    </div>
                </SortableContext>
                {typeof document !== 'undefined' ? createPortal(overlayContent, document.body) : overlayContent}
            </DndContext>

            {isAdmin && (
                <AddSeatModal
                    isOpen={isAddSeatOpen}
                    layoutName={layout.name}
                    onClose={handleCloseAddSeat}
                    onSubmit={handleAddSeat}
                />
            )}

            {isAdmin && editingSeat && (
                <EditSeatModal
                    isOpen={Boolean(editingSeat)}
                    layoutName={layout.name}
                    initialCode={editingSeat.code}
                    initialAssigneeName={editingSeat.assignedUser?.name ?? ''}
                    onClose={handleCloseEditSeat}
                    onSubmit={handleUpdateSeat}
                />
            )}
        </section>
    );
};
