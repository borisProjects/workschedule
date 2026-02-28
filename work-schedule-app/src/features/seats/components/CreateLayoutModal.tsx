import { useState, type FormEvent, type MouseEvent } from 'react';

type CreateLayoutModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, rows: number, cols: number) => Promise<void>;
};

export const CreateLayoutModal = ({ isOpen, onClose, onCreate }: CreateLayoutModalProps) => {
    const [name, setName] = useState('');
    const [rows, setRows] = useState(2);
    const [cols, setCols] = useState(3);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return;
        onClose();
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        const normalizedName = name.trim();
        if (!normalizedName) {
            setError('Името е задължително.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onCreate(normalizedName, rows, cols);
            setName('');
            setRows(2);
            setCols(3);
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Неуспешно създаване на layout.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2>Създай layout</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Затвори прозореца за създаване на layout">
                        x
                    </button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    <label className="form-label" htmlFor="layout-name">
                        Име
                    </label>
                    <input
                        id="layout-name"
                        className="form-select"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Пример: Екип А 3x5"
                    />

                    <label className="form-label" htmlFor="layout-rows">
                        Редове
                    </label>
                    <input
                        id="layout-rows"
                        type="number"
                        min={1}
                        max={12}
                        className="form-select"
                        value={rows}
                        onChange={(event) => setRows(Number(event.target.value) || 1)}
                    />

                    <label className="form-label" htmlFor="layout-cols">
                        Колони
                    </label>
                    <input
                        id="layout-cols"
                        type="number"
                        min={1}
                        max={12}
                        className="form-select"
                        value={cols}
                        onChange={(event) => setCols(Number(event.target.value) || 1)}
                    />

                    {error && <div className="layout-warning">{error}</div>}

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Отказ
                        </button>
                        <button type="submit" className="btn-save" disabled={isSubmitting || !name.trim()}>
                            {isSubmitting ? 'Създаване...' : 'Създай layout'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
