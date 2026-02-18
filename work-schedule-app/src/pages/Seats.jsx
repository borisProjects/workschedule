import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import './Seats.css';

const DEFAULT_LAYOUT_ORDER = [
    '277', '276', '275', '280', '279', '278',
    '283', '282', '281', '286', '285', '284',
    '289', '288', '287', '292', '291', '290',
    '295', '294', '293', '298', '297', '296'
];

const createDefaultLayout = () =>
    DEFAULT_LAYOUT_ORDER.map((seatNumber, index) => ({
        id: `default-${seatNumber}`,
        seat_number: seatNumber,
        position_index: index,
        is_active: true,
        is_temp: true
    }));

const chunkBySix = (items) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += 6) {
        chunks.push(items.slice(i, i + 6));
    }
    return chunks;
};

function Seats() {
    const { isAdmin } = useAuth();

    const [employees, setEmployees] = useState([]);
    const [layoutItems, setLayoutItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [layoutFeatureAvailable, setLayoutFeatureAvailable] = useState(true);

    const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
    const [hasUnsavedLayoutChanges, setHasUnsavedLayoutChanges] = useState(false);
    const [newSeatNumber, setNewSeatNumber] = useState('');
    const [draggedSeatId, setDraggedSeatId] = useState(null);

    const [selectedSeat, setSelectedSeat] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [assigneeId, setAssigneeId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const subscriptionRef = useRef(null);
    const timeoutRef = useRef(null);

    const normalizedLayout = useMemo(
        () => [...layoutItems].sort((a, b) => (a.position_index ?? 0) - (b.position_index ?? 0)),
        [layoutItems]
    );

    const seatMap = useMemo(() => {
        return employees.reduce((acc, emp) => {
            if (emp.seat_number) acc[emp.seat_number] = emp;
            return acc;
        }, {});
    }, [employees]);

    const groupedLayout = useMemo(() => {
        return chunkBySix(normalizedLayout);
    }, [normalizedLayout]);

    const loadEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error('Грешка при зареждане на служители:', error);
        }
    };

    const loadLayout = async () => {
        try {
            const { data, error } = await supabase
                .from('seat_layout_items')
                .select('*')
                .eq('is_active', true)
                .order('position_index', { ascending: true });

            if (error) {
                const missingTable =
                    error.code === '42P01' ||
                    String(error.message || '').toLowerCase().includes('seat_layout_items');

                if (missingTable) {
                    setLayoutFeatureAvailable(false);
                    setLayoutItems(createDefaultLayout());
                    return;
                }

                throw error;
            }

            setLayoutFeatureAvailable(true);
            if (!data || data.length === 0) {
                setLayoutItems(createDefaultLayout());
            } else {
                setLayoutItems(data);
            }
        } catch (error) {
            console.error('Грешка при зареждане на layout:', error);
            setLayoutItems(createDefaultLayout());
        }
    };

    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([loadEmployees(), loadLayout()]);
        setLoading(false);
    };

    const debouncedLoadEmployees = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            loadEmployees();
        }, 800);
    };

    useEffect(() => {
        loadAllData();

        subscriptionRef.current = supabase
            .channel('employees_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, debouncedLoadEmployees)
            .subscribe();

        return () => {
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const resetLayoutDraft = async () => {
        setHasUnsavedLayoutChanges(false);
        setDraggedSeatId(null);
        await loadLayout();
    };

    const startLayoutEdit = () => {
        if (!isAdmin || !layoutFeatureAvailable) return;
        setIsLayoutEditMode(true);
        setHasUnsavedLayoutChanges(false);
    };

    const cancelLayoutEdit = async () => {
        setIsLayoutEditMode(false);
        setNewSeatNumber('');
        await resetLayoutDraft();
    };

    const saveLayoutChanges = async () => {
        if (!layoutFeatureAvailable) return;

        try {
            const payload = normalizedLayout.map((seat, index) => ({
                seat_number: seat.seat_number,
                position_index: index,
                is_active: true
            }));

            const { error } = await supabase
                .from('seat_layout_items')
                .upsert(payload, { onConflict: 'seat_number' });

            if (error) throw error;

            setHasUnsavedLayoutChanges(false);
            setIsLayoutEditMode(false);
            setNewSeatNumber('');
            await loadLayout();
        } catch (error) {
            console.error('Грешка при запис на layout:', error);
            alert('Възникна грешка при записване на layout-а.');
        }
    };

    const reorderLayout = (fromSeatId, toSeatId) => {
        if (!fromSeatId || !toSeatId || fromSeatId === toSeatId) return;

        const draft = [...normalizedLayout];
        const fromIndex = draft.findIndex((item) => item.id === fromSeatId);
        const toIndex = draft.findIndex((item) => item.id === toSeatId);

        if (fromIndex < 0 || toIndex < 0) return;

        const [moved] = draft.splice(fromIndex, 1);
        draft.splice(toIndex, 0, moved);

        setLayoutItems(
            draft.map((item, index) => ({
                ...item,
                position_index: index
            }))
        );
        setHasUnsavedLayoutChanges(true);
    };

    const handleDragStart = (seatId) => {
        if (!isLayoutEditMode) return;
        setDraggedSeatId(seatId);
    };

    const handleDragOver = (event) => {
        if (!isLayoutEditMode) return;
        event.preventDefault();
    };

    const handleDrop = (seatId) => {
        if (!isLayoutEditMode) return;
        reorderLayout(draggedSeatId, seatId);
        setDraggedSeatId(null);
    };

    const handleAddSeat = () => {
        if (!isLayoutEditMode) return;

        const normalized = newSeatNumber.trim();
        if (!normalized) {
            alert('Въведи номер на място.');
            return;
        }

        const alreadyExists = normalizedLayout.some((seat) => seat.seat_number === normalized);
        if (alreadyExists) {
            alert('Това място вече съществува.');
            return;
        }

        const nextIndex = normalizedLayout.length;
        const newSeat = {
            id: `temp-${Date.now()}-${normalized}`,
            seat_number: normalized,
            position_index: nextIndex,
            is_active: true,
            is_temp: true
        };

        setLayoutItems([...normalizedLayout, newSeat]);
        setNewSeatNumber('');
        setHasUnsavedLayoutChanges(true);
    };

    const handleRemoveSeat = async (seatNumber) => {
        if (!isLayoutEditMode) return;

        const confirmed = confirm(`Сигурни ли сте, че искате да премахнете място ${seatNumber}?`);
        if (!confirmed) return;

        const occupant = seatMap[seatNumber];

        try {
            if (occupant) {
                const { error: clearEmployeeError } = await supabase
                    .from('employees')
                    .update({ seat_number: null, seat_group: null })
                    .eq('seat_number', seatNumber);

                if (clearEmployeeError) throw clearEmployeeError;
            }

            const existingSeat = normalizedLayout.find((seat) => seat.seat_number === seatNumber && !seat.is_temp);
            if (existingSeat) {
                const { error: deleteError } = await supabase
                    .from('seat_layout_items')
                    .delete()
                    .eq('id', existingSeat.id);

                if (deleteError) throw deleteError;
            }

            const updated = normalizedLayout
                .filter((seat) => seat.seat_number !== seatNumber)
                .map((seat, index) => ({ ...seat, position_index: index }));

            setLayoutItems(updated);
            setHasUnsavedLayoutChanges(true);
        } catch (error) {
            console.error('Грешка при премахване на място:', error);
            alert('Възникна грешка при премахване на мястото.');
        }
    };

    const handleSeatClick = (seatNum) => {
        if (isLayoutEditMode) return;

        const currentOccupant = seatMap[seatNum];
        setSelectedSeat(seatNum);
        setAssigneeId(currentOccupant ? currentOccupant.id : '');
        setShowModal(true);
    };

    const handleSaveAssignment = async () => {
        if (!selectedSeat) return;
        setIsSubmitting(true);

        try {
            const { error: clearError } = await supabase
                .from('employees')
                .update({ seat_number: null })
                .eq('seat_number', selectedSeat);

            if (clearError) throw clearError;

            if (assigneeId) {
                const { error: updateError } = await supabase
                    .from('employees')
                    .update({ seat_number: selectedSeat })
                    .eq('id', assigneeId);

                if (updateError) throw updateError;
            }

            setShowModal(false);
            await loadEmployees();
        } catch (error) {
            console.error('Грешка при запис:', error);
            alert('Възникна грешка при записване на мястото.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSeat = (seat) => {
        const employee = seatMap[seat.seat_number];
        const isEmpty = !employee;

        return (
            <div
                key={seat.id}
                className={`office-seat ${isEmpty ? 'empty' : 'occupied'} ${isLayoutEditMode ? 'dragging-enabled' : 'clickable'}`}
                onClick={() => handleSeatClick(seat.seat_number)}
                title={isLayoutEditMode ? 'Drag & drop за преместване' : `Кликни за редакция на място ${seat.seat_number}`}
                draggable={isLayoutEditMode}
                onDragStart={() => handleDragStart(seat.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(seat.id)}
                onDragEnd={() => setDraggedSeatId(null)}
            >
                {isLayoutEditMode && (
                    <button
                        className="seat-remove-btn"
                        onClick={(event) => {
                            event.stopPropagation();
                            handleRemoveSeat(seat.seat_number);
                        }}
                        title={`Премахни място ${seat.seat_number}`}
                    >
                        ×
                    </button>
                )}

                <div className="seat-number">{seat.seat_number}</div>
                <div className="seat-name">{employee ? employee.name : 'Свободно'}</div>
                {isLayoutEditMode && <div className="drag-hint">⇅</div>}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                ⏳ Зареждане...
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="content-header">
                <div>
                    <h1>🪑 Офис места</h1>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        {isLayoutEditMode
                            ? 'Редакция на layout: drag & drop, добавяне, премахване.'
                            : 'ℹ️ Можете да кликнете върху място, за да промените кой седи там.'}
                    </p>
                </div>

                {isAdmin && layoutFeatureAvailable && (
                    <div className="layout-controls">
                        {!isLayoutEditMode ? (
                            <button className="layout-btn" onClick={startLayoutEdit}>
                                <i className="fas fa-pen"></i> Редакция на layout
                            </button>
                        ) : (
                            <>
                                <button className="layout-btn layout-btn-secondary" onClick={cancelLayoutEdit}>
                                    Отказ
                                </button>
                                <button
                                    className="layout-btn"
                                    onClick={saveLayoutChanges}
                                    disabled={!hasUnsavedLayoutChanges}
                                >
                                    Запази layout
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {!layoutFeatureAvailable && (
                <div className="layout-warning">
                    Custom layout таблицата липсва. Изпълни `SEATS_LAYOUT_SETUP.sql`, за да активираш drag & drop конфигуриране.
                </div>
            )}

            {isLayoutEditMode && (
                <div className="layout-edit-panel">
                    <input
                        type="text"
                        value={newSeatNumber}
                        onChange={(e) => setNewSeatNumber(e.target.value)}
                        placeholder="Нов номер на място"
                    />
                    <button onClick={handleAddSeat}>Добави място</button>
                </div>
            )}

            <div className="office-seats-container">
                {groupedLayout.map((block, blockIndex) => (
                    <div key={`block-${blockIndex}`} className="seat-block">
                        <div className="desk-row">{block.slice(0, 3).map(renderSeat)}</div>
                        <div className="desk-row">{block.slice(3, 6).map(renderSeat)}</div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Редакция на място {selectedSeat}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <label className="form-label">Служител на това място:</label>
                            <select className="form-select" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                                <option value="">-- Свободно --</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name}{' '}
                                        {emp.seat_number && emp.seat_number !== selectedSeat ? `(в момента на ${emp.seat_number})` : ''}
                                    </option>
                                ))}
                            </select>
                            <p className="help-text">
                                * Изберете "Свободно", за да махнете текущия човек.
                                <br />* Ако изберете човек, който вече има място, той ще бъде преместен тук.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>
                                Отказ
                            </button>
                            <button className="btn-save" onClick={handleSaveAssignment} disabled={isSubmitting}>
                                {isSubmitting ? 'Записване...' : 'Запази'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Seats;
