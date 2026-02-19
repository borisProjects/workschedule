import { memo } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { defaultAnimateLayoutChanges, useSortable, type AnimateLayoutChanges } from '@dnd-kit/sortable';
import type { Seat } from '../types';

type SortableSeatCardProps = {
    id: string;
    seat: Seat | null;
    draggable: boolean;
    editable: boolean;
    showDelete: boolean;
    onDeleteSeat: (seatId: string) => void;
    onEditSeat: (seat: Seat) => void;
};

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
    if (args.isSorting || args.wasDragging) {
        return defaultAnimateLayoutChanges(args);
    }

    return true;
};

export const SortableSeatCard = memo(function SortableSeatCard({
    id,
    seat,
    draggable,
    editable,
    showDelete,
    onDeleteSeat,
    onEditSeat
}: SortableSeatCardProps) {
    const isPlaceholder = seat === null;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: !draggable || isPlaceholder,
        animateLayoutChanges
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 30 : undefined,
        opacity: isDragging ? 0 : 1
    };

    if (isPlaceholder) {
        return (
            <div ref={setNodeRef} style={style} className="seat-slot-placeholder" aria-hidden="true">
                Празен слот
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`office-seat ${seat.status === 'occupied' ? 'occupied' : 'empty'} ${draggable ? 'dragging-enabled' : editable ? 'clickable' : ''}`}
            onClick={() => {
                if (editable && !isDragging) {
                    onEditSeat(seat);
                }
            }}
            {...attributes}
            {...listeners}
        >
            {showDelete && (
                <button
                    className="seat-remove-btn"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onDeleteSeat(seat.id);
                    }}
                    title={`Изтрий място ${seat.code}`}
                >
                    x
                </button>
            )}

            <div className="seat-number">{seat.code}</div>
            <div className="seat-name">{seat.assignedUser?.name ?? 'Свободно'}</div>
            {draggable && <div className="drag-hint">&lt;-&gt;</div>}
        </div>
    );
});
