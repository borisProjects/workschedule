import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';

type EditSeatModalProps = {
    isOpen: boolean;
    layoutName: string;
    initialCode: number;
    initialAssigneeName: string;
    onClose: () => void;
    onSubmit: (code: number, assigneeName: string) => Promise<void>;
};

export const EditSeatModal = ({
    isOpen,
    layoutName,
    initialCode,
    initialAssigneeName,
    onClose,
    onSubmit
}: EditSeatModalProps) => {
    const [seatCode, setSeatCode] = useState(String(initialCode));
    const [assigneeName, setAssigneeName] = useState(initialAssigneeName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSeatCode(String(initialCode));
        setAssigneeName(initialAssigneeName);
        setError(null);
    }, [initialCode, initialAssigneeName, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return;
        onClose();
    };

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
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Неуспешна редакция на място.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
                <div className="modal-header">
                    <h2>Редакция на място - {layoutName}</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Затвори прозореца за редакция на място">
                        x
                    </button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    <label className="form-label" htmlFor="edit-seat-code">
                        Номер на място
                    </label>
                    <input
                        id="edit-seat-code"
                        type="number"
                        min={1}
                        className="form-select"
                        value={seatCode}
                        onChange={(event) => setSeatCode(event.target.value)}
                    />

                    <label className="form-label" htmlFor="edit-seat-assignee">
                        Име на човек (празно = свободно)
                    </label>
                    <input
                        id="edit-seat-assignee"
                        className="form-select"
                        value={assigneeName}
                        onChange={(event) => setAssigneeName(event.target.value)}
                    />

                    {error && <div className="layout-warning">{error}</div>}

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Отказ
                        </button>
                        <button type="submit" className="btn-save" disabled={isSubmitting}>
                            {isSubmitting ? 'Записване...' : 'Запази'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
