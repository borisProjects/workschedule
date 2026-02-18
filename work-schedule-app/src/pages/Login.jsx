import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
    const { login, employees, loading } = useAuth();
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Dropdown states
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedEmployeeData = employees.find(e => e.name === selectedEmployee);

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
                    <div style={{ marginBottom: '1.5rem', position: 'relative' }} ref={dropdownRef}>
                        <div 
                            onClick={() => setIsOpen(!isOpen)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: '2px solid var(--border)',
                                borderRadius: '12px',
                                fontSize: '1rem',
                                background: 'var(--secondary-bg)',
                                color: selectedEmployee ? 'var(--text-primary)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: isOpen ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
                                borderColor: isOpen ? 'var(--primary)' : 'var(--border)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {selectedEmployee ? (
                                    <>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.9rem',
                                            fontWeight: '600'
                                        }}>
                                            {selectedEmployee.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{selectedEmployeeData?.name}</div>
                                            {selectedEmployeeData?.seat_number && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    Място {selectedEmployeeData.seat_number}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <span>-- Избери си герой --</span>
                                )}
                            </div>
                            <i className={`fas fa-chevron-down`} style={{ 
                                transition: 'transform 0.2s ease',
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                color: 'var(--text-secondary)'
                            }}></i>
                        </div>

                        {isOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '110%',
                                left: 0,
                                right: 0,
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                zIndex: 100,
                                overflow: 'hidden',
                                animation: 'fadeIn 0.2s ease'
                            }}>
                                <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        background: 'var(--secondary-bg)',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '8px'
                                    }}>
                                        <i className="fas fa-search" style={{ color: 'var(--text-secondary)' }}></i>
                                        <input
                                            type="text"
                                            placeholder="Търсене..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                width: '100%',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div style={{ 
                                    maxHeight: '250px', 
                                    overflowY: 'auto',
                                    padding: '0.5rem'
                                }}>
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((employee) => (
                                            <div
                                                key={employee.id}
                                                onClick={() => {
                                                    setSelectedEmployee(employee.name);
                                                    setIsOpen(false);
                                                    setError('');
                                                    setSearchTerm('');
                                                }}
                                                style={{
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    transition: 'all 0.2s ease',
                                                    background: selectedEmployee === employee.name ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--secondary-bg)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = selectedEmployee === employee.name ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                                            >
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: 'var(--border)',
                                                    color: 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600'
                                                }}>
                                                    {employee.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{employee.name}</div>
                                                    {employee.seat_number && (
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            Място {employee.seat_number}
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedEmployee === employee.name && (
                                                    <i className="fas fa-check" style={{ marginLeft: 'auto', color: 'var(--primary)' }}></i>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                            Няма намерени служители
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
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
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: selectedEmployee ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s ease',
                            opacity: isLoading ? 0.7 : 1,
                            boxShadow: selectedEmployee ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedEmployee && !isLoading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = selectedEmployee ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none';
                        }}
                    >
                        {isLoading ? '⏳ Влизане...' : 'Влез в системата'}
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

