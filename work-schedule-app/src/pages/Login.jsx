import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
    const { login, employees, loading } = useAuth();
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!selectedEmployee) {
            setError('Моля, изберете служител');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await login(selectedEmployee);
        
        if (!result.success) {
            setError(result.error || 'Грешка при влизане');
            setIsLoading(false);
        }
        // Ако е успешно, App.jsx автоматично ще пренасочи към Dashboard
    };


    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ fontSize: '3rem' }}>⏳</div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                    Зареждане...
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            padding: '2rem'
        }}>
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '16px',
                padding: '3rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ 
                        fontSize: '2.5rem', 
                        marginBottom: '0.5rem',
                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        🪰 Work Schedule
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        Изберете вашия профил
                    </p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => {
                                setSelectedEmployee(e.target.value);
                                setError('');
                            }}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '2px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                background: 'var(--secondary-bg)',
                                color: 'var(--text)',
                                cursor: 'pointer',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236366f1' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 1rem center'
                            }}
                        >
                            <option value="">-- Изберете служител --</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.name}>
                                    {employee.name} {employee.seat_number ? `(Място ${employee.seat_number})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            marginBottom: '1rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !selectedEmployee}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: selectedEmployee 
                                ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                                : 'var(--border)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: selectedEmployee ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s ease',
                            opacity: isLoading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (selectedEmployee && !isLoading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 10px 20px rgba(99, 102, 241, 0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        {isLoading ? '⏳ Влизане...' : '🚀 Влез в системата'}
                    </button>
                </form>

                <div style={{ 
                    marginTop: '2rem', 
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem'
                }}>
                    <p>👥 Общо {employees.length} служители</p>
                </div>
            </div>
        </div>
    );
}

export default Login;

