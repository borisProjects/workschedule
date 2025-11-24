import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { OFFICE_SEATS } from '../data/constants';
import { useAuth } from '../contexts/AuthContext';
import './Seats.css';

// Конфигурация: Всеки блок има 'top' (горни 3 места) и 'bottom' (долни 3 места)
const ROWS_CONFIG = [
    { id: 1, top: ['377', '376', '375'], bottom: ['380', '379', '378'] },
    { id: 2, top: ['383', '382', '381'], bottom: ['386', '385', '384'] },
    { id: 3, top: ['389', '388', '387'], bottom: ['392', '391', '390'] },
    { id: 4, top: ['395', '394', '393'], bottom: ['398', '397', '396'] }
    ];

function Seats() {
    const { isAdmin } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State за модален прозорец
    const [selectedSeat, setSelectedSeat] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [assigneeId, setAssigneeId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Функция за зареждане на служители
    const loadEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            setEmployees(data || []);
            setLoading(false);
        } catch (error) {
            console.error('Грешка:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();

        const subscription = supabase
            .channel('employees_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => loadEmployees())
            .subscribe();

        return () => subscription.unsubscribe();
    }, []);

    // Обновяване при фокус
    useEffect(() => {
        const handleFocus = () => loadEmployees();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // Map за бърз достъп до данните за мястото
    const seatMap = employees.reduce((acc, emp) => {
        if (emp.seat_number) acc[emp.seat_number] = emp;
        return acc;
    }, {});

    // Обработка на клик върху място
    const handleSeatClick = (seatNum) => {
        // Позволяваме редакция само ако е админ
        // Може да добавим и проверка за ширина на екрана (window.innerWidth > 1024), 
        // но обикновено админ правата са достатъчни.
        if (!isAdmin) return;

        const currentOccupant = seatMap[seatNum];
        setSelectedSeat(seatNum);
        setAssigneeId(currentOccupant ? currentOccupant.id : ''); // Ако има човек, го избираме по подразбиране
        setShowModal(true);
    };

    // Запазване на промените
    const handleSaveAssignment = async () => {
        if (!selectedSeat) return;
        setIsSubmitting(true);

        try {
            // 1. Първо освобождаваме мястото от когото и да било (ако има такъв)
            // Това предотвратява дублиране или грешки, ако някой друг е там
            const { error: clearError } = await supabase
                .from('employees')
                .update({ seat_number: null })
                .eq('seat_number', selectedSeat);

            if (clearError) throw clearError;

            // 2. Ако е избран човек (assigneeId не е празен string), го слагаме на мястото
            if (assigneeId) {
                // Първо проверяваме дали този човек вече няма друго място, за да не го дублираме?
                // Supabase update просто ще смени seat_number-а му, така че старият му seat_number (ако е имал) ще се "освободи" автоматично при update-а.
                // Обаче, за по-чисто, update-ваме само него.
                
                const { error: updateError } = await supabase
                    .from('employees')
                    .update({ seat_number: selectedSeat })
                    .eq('id', assigneeId);

                if (updateError) throw updateError;
            }

            // Успех -> затваряме модала и презареждаме (Realtime ще го хване, но за всеки случай)
            setShowModal(false);
            loadEmployees();
        } catch (error) {
            console.error('Грешка при запис:', error);
            alert('Възникна грешка при записване на мястото.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSeat = (seatNum) => {
        const employee = seatMap[seatNum];
        const staticInfo = OFFICE_SEATS.find(s => s.number === seatNum);
        const displayName = employee ? employee.name : (staticInfo ? staticInfo.name : 'Свободно');
        const isEmpty = displayName === 'Свободно';
        
        return (
            <div 
                key={seatNum} 
                className={`office-seat ${isEmpty ? 'empty' : 'occupied'} ${isAdmin ? 'clickable' : ''}`}
                onClick={() => handleSeatClick(seatNum)}
                title={isAdmin ? `Кликни за редакция на място ${seatNum}` : ''}
            >
                <div className="seat-number">{seatNum}</div>
                <div className="seat-name">
                    {displayName}
                </div>
            </div>
        );
    };

    if (loading) return <div className="fade-in" style={{ textAlign: 'center', padding: '4rem' }}>⏳ Зареждане...</div>;

    return (
        <div className="fade-in">
            <div className="content-header">
                <h1>🪑 Офис места</h1>
                {isAdmin && <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>ℹ️ Като администратор можете да кликнете върху място, за да промените кой седи там.</p>}
            </div>

            <div className="office-seats-container">
                {ROWS_CONFIG.map((block) => (
                    <div key={block.id} className="seat-block">
                        <div className="desk-row">
                            {block.top.map(num => renderSeat(num))}
                        </div>
                        <div className="desk-row">
                            {block.bottom.map(num => renderSeat(num))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal за Assign */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Редакция на място {selectedSeat}</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <label className="form-label">Служител на това място:</label>
                            <select 
                                className="form-select"
                                value={assigneeId} 
                                onChange={(e) => setAssigneeId(e.target.value)}
                            >
                                <option value="">-- Свободно --</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} {emp.seat_number && emp.seat_number !== selectedSeat ? `(в момента на ${emp.seat_number})` : ''}
                                    </option>
                                ))}
                            </select>
                            <p className="help-text">
                                * Изберете "Свободно", за да махнете текущия човек. 
                                <br/>
                                * Ако изберете човек, който вече има място, той ще бъде преместен тук.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>Отказ</button>
                            <button 
                                className="btn-save" 
                                onClick={handleSaveAssignment}
                                disabled={isSubmitting}
                            >
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
