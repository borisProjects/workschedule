import { useState, type FormEvent } from 'react';

type AddSeatModalProps = {
    isOpen: boolean;
    layoutName: string;
    onClose: () => void;
    onSubmit: (code: number, assigneeName: string) => Promise<void>;
};

export const AddSeatModal = ({ isOpen, layoutName, onClose, onSubmit }: AddSeatModalProps) => {
    const [seatCode, setSeatCode] = useState('');
    const [assigneeName, setAssigneeName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        const parsedCode = Number(seatCode);
        if (!Number.isFinite(parsedCode) || parsedCode <= 0) {
            setError('Въведи валиден номер на място.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit(parsedCode, assigneeName.trim());
            setSeatCode('');
            setAssigneeName('');
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Неуспешно добавяне на място.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2>Добави място - {layoutName}</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Затвори прозореца за добавяне на място">
                        x
                    </button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    <label className="form-label" htmlFor="add-seat-code">
                        Номер на място
                    </label>
                    <input
                        id="add-seat-code"
                        type="number"
                        min={1}
                        className="form-select"
                        value={seatCode}
                        onChange={(event) => setSeatCode(event.target.value)}
                        placeholder="Пример: 277"
                    />

                    <label className="form-label" htmlFor="add-seat-assignee">
                        Име на човек (по избор)
                    </label>
                    <input
                        id="add-seat-assignee"
                        className="form-select"
                        value={assigneeName}
                        onChange={(event) => setAssigneeName(event.target.value)}
                        placeholder="Example: Ivan Ivanov"
                    />

                    {error && <div className="layout-warning">{error}</div>}

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Отказ
                        </button>
                        <button type="submit" className="btn-save" disabled={isSubmitting}>
                            {isSubmitting ? 'Добавяне...' : 'Добави място'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
