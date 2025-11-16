import { useState, useEffect } from 'react';
import { OFFICE_SEATS } from '../data/constants';
import { supabase } from '../config/supabase';

function Seats() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Зареждане на служителите от базата данни
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
                console.error('Грешка при зареждане на служители:', error);
                setLoading(false);
            }
        };

        loadEmployees();

        // Слушане за промени в employees таблицата за автоматично обновяване
        const subscription = supabase
            .channel('employees_changes')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'employees' 
                }, 
                (payload) => {
                    console.log('Промяна в employees таблицата:', payload);
                    // Презареждане на данните при всяка промяна
                    loadEmployees();
                }
            )
            .subscribe();

        // Почистване на subscription при unmount
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Допълнително обновяване при фокус на страницата (fallback ако Realtime не работи)
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

    // Създаване на map за бързо търсене на служител по номер на място
    const seatToEmployeeMap = employees.reduce((acc, employee) => {
        if (employee.seat_number) {
            acc[employee.seat_number] = employee;
        }
        return acc;
    }, {});

    // Комбиниране на статичните места с данните от базата
    const seatsWithEmployees = OFFICE_SEATS.map(seat => {
        const employee = seatToEmployeeMap[seat.number];
        // Ако има служител в базата с този номер на място, показваме неговото име
        // Иначе показваме "Свободно"
        return {
            ...seat,
            name: employee ? employee.name : 'Свободно'
        };
    });

    // Групиране на местата по group property
    const groupedSeats = seatsWithEmployees.reduce((acc, seat) => {
        const group = seat.group || 1;
        if (!acc[group]) acc[group] = [];
        acc[group].push(seat);
        return acc;
    }, {});

    if (loading) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '3rem' }}>⏳</div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                    Зареждане...
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="content-header">
                <h1>🪑 Офис места</h1>
            </div>

            <div className="office-seats-container">
                {Object.entries(groupedSeats).map(([groupNum, seats]) => (
                    <div key={groupNum} className="office-seats-group">
                        <div className="office-seats-grid">
                            {seats.map((seat, index) => (
                                <div key={index} className="office-seat">
                                    <div className="seat-number">{seat.number}</div>
                                    <div className={seat.name === 'Свободно' ? 'seat-empty' : 'seat-name'}>
                                        {seat.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Seats;


