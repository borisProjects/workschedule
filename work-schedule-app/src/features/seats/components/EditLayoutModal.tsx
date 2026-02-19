import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSeatsStore } from '../store/useSeatsStore';
import { useAuth } from '../../../contexts/AuthContext';

export const EditLayoutModal = () => {
    const { isAdmin } = useAuth();
    const editingLayoutId = useSeatsStore((state) => state.editingLayoutId);
    const layouts = useSeatsStore((state) => state.layouts);
    const seatsByLayout = useSeatsStore((state) => state.seatsByLayout);
    const closeEditModal = useSeatsStore((state) => state.closeEditModal);
    const updateLayout = useSeatsStore((state) => state.updateLayout);
    const deleteLayout = useSeatsStore((state) => state.deleteLayout);

    const layout = useMemo(() => layouts.find((item) => item.id === editingLayoutId) ?? null, [editingLayoutId, layouts]);
    const seatsCount = layout ? (seatsByLayout[layout.id] ?? []).length : 0;

    const [name, setName] = useState('');
    const [rows, setRows] = useState(1);
    const [cols, setCols] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!layout) return;
        setName(layout.name);
        setRows(layout.rows);
        setCols(layout.cols);
        setError(null);
    }, [layout]);

    if (!layout || !isAdmin) {
        return null;
    }

    const capacity = rows * cols;

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!name.trim()) {
            setError('Името е задължително.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await updateLayout(layout.id, name.trim(), rows, cols);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Неуспешна редакция.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = confirm(`Сигурни ли сте, че искате да изтриете layout "${layout.name}"?`);
        if (!confirmed) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await deleteLayout(layout.id);
            closeEditModal();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Неуспешно изтриване.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2>Редакция на layout</h2>
                    <button className="close-btn" onClick={closeEditModal} aria-label="Затвори прозореца за редакция на layout">
                        x
                    </button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    <label className="form-label" htmlFor="edit-layout-name">
                        Име
                    </label>
                    <input
                        id="edit-layout-name"
                        className="form-select"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />

                    <label className="form-label" htmlFor="edit-layout-rows">
                        Редове
                    </label>
                    <input
                        id="edit-layout-rows"
                        type="number"
                        min={1}
                        max={12}
                        className="form-select"
                        value={rows}
                        onChange={(event) => setRows(Number(event.target.value) || 1)}
                    />

                    <label className="form-label" htmlFor="edit-layout-cols">
                        Колони
                    </label>
                    <input
                        id="edit-layout-cols"
                        type="number"
                        min={1}
                        max={12}
                        className="form-select"
                        value={cols}
                        onChange={(event) => setCols(Number(event.target.value) || 1)}
                    />

                    <p className="help-text">
                        Капацитет след промяна: {capacity}. Места в layout: {seatsCount}. Намаляването е блокирано, ако местата са повече от капацитета.
                    </p>

                    {error && <div className="layout-warning">{error}</div>}

                    <div className="modal-footer modal-footer-between">
                        <button type="button" className="btn-danger" onClick={handleDelete} disabled={isSubmitting}>
                            Изтрий layout
                        </button>
                        <div>
                            <button type="button" className="btn-cancel" onClick={closeEditModal}>
                                Отказ
                            </button>
                            <button type="submit" className="btn-save" disabled={isSubmitting}>
                                {isSubmitting ? 'Записване...' : 'Запази layout'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
