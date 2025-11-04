import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

function Admin() {
    const { user, isAdmin } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ name: '', seat_number: '', seat_group: 1 });
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', seat_number: '', seat_group: 1 });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Проверка дали потребителят е admin
    if (!isAdmin) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
                <h2>Нямате достъп</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Само администратори имат достъп до тази страница.
                </p>
            </div>
        );
    }

    // Зареждане на всички служители
    const loadEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('name');

            if (error) throw error;
            setEmployees(data || []);
            setLoading(false);
        } catch (error) {
            console.error('Грешка при зареждане на служители:', error);
            setError('Грешка при зареждане на служители');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    // Добавяне на нов служител
    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newEmployee.name) {
            setError('Моля, въведете име на служителя');
            return;
        }

        try {
            const seatNumber = newEmployee.seat_number?.trim() || null;
            const seatGroup = seatNumber ? (newEmployee.seat_group || null) : null;
            
            const { error } = await supabase
                .from('employees')
                .insert([{
                    name: newEmployee.name.trim(),
                    seat_number: seatNumber,
                    seat_group: seatGroup,
                    is_active: true
                }]);

            if (error) throw error;

            setNewEmployee({ name: '', seat_number: '', seat_group: 1 });
            setShowAddForm(false);
            setSuccess('Служителят е добавен успешно!');
            await loadEmployees();
            
            // Скрыване на success съобщението след 3 секунди
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Грешка при добавяне на служител:', error);
            setError('Грешка при добавяне на служител: ' + error.message);
        }
    };

    // Започване на редактиране
    const handleStartEdit = (employee) => {
        setEditingEmployee(employee.id);
        setEditForm({
            name: employee.name,
            seat_number: employee.seat_number || '',
            seat_group: employee.seat_group || 1
        });
        setShowAddForm(false);
        setError('');
        setSuccess('');
    };

    // Отказ от редактиране
    const handleCancelEdit = () => {
        setEditingEmployee(null);
        setEditForm({ name: '', seat_number: '', seat_group: 1 });
    };

    // Обновяване на служител
    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!editForm.name.trim()) {
            setError('Моля, въведете име на служителя');
            return;
        }

        try {
            const seatNumber = editForm.seat_number?.trim() || null;
            const seatGroup = seatNumber ? (editForm.seat_group || null) : null;

            const { error } = await supabase
                .from('employees')
                .update({
                    name: editForm.name.trim(),
                    seat_number: seatNumber,
                    seat_group: seatGroup
                })
                .eq('id', editingEmployee);

            if (error) throw error;

            setEditingEmployee(null);
            setEditForm({ name: '', seat_number: '', seat_group: 1 });
            setSuccess('Служителят е обновен успешно!');
            await loadEmployees();
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Грешка при обновяване на служител:', error);
            setError('Грешка при обновяване на служител: ' + error.message);
        }
    };

    // Премахване на служител (hard delete - напълно изтриване)
    const handleDeleteEmployee = async (employeeId, employeeName) => {
        if (!confirm(`Сигурни ли сте, че искате да изтриете "${employeeName}" напълно от системата?\n\nТова действие е необратимо!`)) {
            return;
        }

        try {
            // Първо изтриваме всички гласове на служителя
            const { error: votesError } = await supabase
                .from('votes')
                .delete()
                .eq('employee_id', employeeId);

            if (votesError) throw votesError;

            // Изтриваме събитията създадени от служителя (ако има)
            // Забележка: В таблицата има ON DELETE CASCADE, но все пак изтриваме експлицитно
            const { error: eventsError } = await supabase
                .from('events')
                .delete()
                .eq('created_by', employeeId);

            if (eventsError) throw eventsError;

            // След това изтриваме самия служител
            const { error: employeeError } = await supabase
                .from('employees')
                .delete()
                .eq('id', employeeId);

            if (employeeError) throw employeeError;

            setSuccess(`Служителят "${employeeName}" е изтрит напълно от системата!`);
            await loadEmployees();
            
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Грешка при изтриване на служител:', error);
            setError('Грешка при изтриване на служител: ' + error.message);
        }
    };

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
                <h1>👑 Администрация</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        background: showAddForm 
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                            : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        color: 'white',
                        padding: '0.875rem 1.75rem',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <i className={`fas fa-${showAddForm ? 'times' : 'plus'}`}></i>
                    {showAddForm ? 'Отказ' : 'Добави служител'}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    marginBottom: '1.5rem'
                }}>
                    {error}
                </div>
            )}

            {success && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    color: '#10b981',
                    marginBottom: '1.5rem'
                }}>
                    {success}
                </div>
            )}

            {/* Формуляр за добавяне */}
            {showAddForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="card-header">
                        <h2 className="card-title">➕ Добавяне на нов служител</h2>
                    </div>
                    <form onSubmit={handleAddEmployee} style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Име на служителя *
                            </label>
                            <input
                                type="text"
                                value={newEmployee.name}
                                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                placeholder="напр. Иван Петров"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '2px solid var(--border)',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    background: 'var(--secondary-bg)',
                                    color: 'var(--text)'
                                }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Номер на място (опционално)
                                </label>
                                <input
                                    type="text"
                                    value={newEmployee.seat_number}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, seat_number: e.target.value })}
                                    placeholder="напр. 348 или остави празно"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid var(--border)',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        background: 'var(--secondary-bg)',
                                        color: 'var(--text)'
                                    }}
                                />
                                <p style={{ 
                                    fontSize: '0.85rem', 
                                    color: 'var(--text-secondary)', 
                                    marginTop: '0.25rem',
                                    fontStyle: 'italic'
                                }}>
                                    Оставете празно ако няма офис място
                                </p>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Група на място
                                </label>
                                <select
                                    value={newEmployee.seat_group}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, seat_group: parseInt(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid var(--border)',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        background: 'var(--secondary-bg)',
                                        color: 'var(--text)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value={1}>Група 1</option>
                                    <option value={2}>Група 2</option>
                                    <option value={3}>Група 3</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            ✨ Добави служител
                        </button>
                    </form>
                </div>
            )}

            {/* Списък със служители */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">👥 Служители ({employees.length} общо)</h2>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    {employees.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👥</div>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Няма служители в системата
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {employees.map((employee) => (
                                editingEmployee === employee.id ? (
                                    // Edit форма
                                    <div key={employee.id} className="card" style={{ marginBottom: '0.75rem' }}>
                                        <form onSubmit={handleUpdateEmployee} style={{ padding: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                                                ✏️ Редактиране на служител
                                            </h3>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                    Име на служителя *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    placeholder="напр. Иван Петров"
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        border: '2px solid var(--border)',
                                                        borderRadius: '8px',
                                                        fontSize: '1rem',
                                                        background: 'var(--secondary-bg)',
                                                        color: 'var(--text)'
                                                    }}
                                                />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                        Номер на място (опционално)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.seat_number}
                                                        onChange={(e) => setEditForm({ ...editForm, seat_number: e.target.value })}
                                                        placeholder="напр. 348 или остави празно"
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem',
                                                            border: '2px solid var(--border)',
                                                            borderRadius: '8px',
                                                            fontSize: '1rem',
                                                            background: 'var(--secondary-bg)',
                                                            color: 'var(--text)'
                                                        }}
                                                    />
                                                    <p style={{ 
                                                        fontSize: '0.85rem', 
                                                        color: 'var(--text-secondary)', 
                                                        marginTop: '0.25rem',
                                                        fontStyle: 'italic'
                                                    }}>
                                                        Оставете празно ако няма офис място
                                                    </p>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                        Група на място
                                                    </label>
                                                    <select
                                                        value={editForm.seat_group}
                                                        onChange={(e) => setEditForm({ ...editForm, seat_group: parseInt(e.target.value) })}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.75rem',
                                                            border: '2px solid var(--border)',
                                                            borderRadius: '8px',
                                                            fontSize: '1rem',
                                                            background: 'var(--secondary-bg)',
                                                            color: 'var(--text)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value={1}>Група 1</option>
                                                        <option value={2}>Група 2</option>
                                                        <option value={3}>Група 3</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button
                                                    type="submit"
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.875rem',
                                                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '1rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    💾 Запази промените
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.875rem',
                                                        background: 'var(--border)',
                                                        color: 'var(--text)',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '1rem',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    ✖ Отказ
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    // Нормален изглед
                                    <div
                                        key={employee.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            background: 'var(--secondary-bg)',
                                            borderRadius: '8px',
                                            borderLeft: '3px solid var(--primary)'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                                                {employee.name}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                {employee.seat_number 
                                                    ? `Място ${employee.seat_number}${employee.seat_group ? ` • Група ${employee.seat_group}` : ''}`
                                                    : 'Няма офис място'
                                                }
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleStartEdit(employee)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--primary)',
                                                    cursor: 'pointer',
                                                    padding: '0.5rem',
                                                    fontSize: '1.2rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                title="Редактирай служителя"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    padding: '0.5rem',
                                                    fontSize: '1.2rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                title="Изтрий служителя напълно"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Admin;

