import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { OFFICE_SEATS } from '../data/constants';
import './Seats.css';

// Конфигурация: Всеки блок има 'top' (горни 3 места) и 'bottom' (долни 3 места)
const ROWS_CONFIG = [
    { id: 1, top: ['377', '376', '375'], bottom: ['380', '379', '378'] },
    { id: 2, top: ['383', '382', '381'], bottom: ['386', '385', '384'] },
    { id: 3, top: ['389', '388', '387'], bottom: ['392', '391', '390'] },
    { id: 4, top: ['395', '394', '393'], bottom: ['398', '397', '396'] }
];

function Seats() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const { data, error } = await supabase
                    .from('employees')
                    .select('*')
                    .eq('is_active', true);

                if (error) throw error;
                setEmployees(data || []);
                setLoading(false);
            } catch (error) {
                console.error('Грешка:', error);
                setLoading(false);
            }
        };

        loadEmployees();

        const subscription = supabase
            .channel('employees_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => loadEmployees())
            .subscribe();

        return () => subscription.unsubscribe();
    }, []);

    // Допълнително обновяване при фокус
    useEffect(() => {
        const handleFocus = () => {
            const loadEmployees = async () => {
                try {
                    const { data, error } = await supabase
                        .from('employees')
                        .select('*')
                        .eq('is_active', true);

                    if (error) throw error;
                    setEmployees(data || []);
                } catch (error) {
                    console.error('Грешка при зареждане на служители:', error);
                }
            };
            loadEmployees();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const seatMap = employees.reduce((acc, emp) => {
        if (emp.seat_number) acc[emp.seat_number] = emp;
        return acc;
    }, {});

    const renderSeat = (seatNum) => {
        const employee = seatMap[seatNum];
        const staticInfo = OFFICE_SEATS.find(s => s.number === seatNum);
        const displayName = employee ? employee.name : (staticInfo ? staticInfo.name : 'Свободно');
        const isEmpty = displayName === 'Свободно';
        
        return (
            <div key={seatNum} className={`office-seat ${isEmpty ? 'empty' : 'occupied'}`}>
                <div className="seat-number">{seatNum}</div>
                <div className="seat-name" title={displayName}>
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
            </div>

            <div className="office-seats-container">
                {ROWS_CONFIG.map((block) => (
                    <div key={block.id} className="seat-block">
                        {/* Горна група (3 места) */}
                        <div className="desk-row">
                            {block.top.map(num => renderSeat(num))}
                        </div>

                        {/* Долна група (3 места) */}
                        <div className="desk-row">
                            {block.bottom.map(num => renderSeat(num))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Seats;
