import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

function Events() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', event_date: '' });
    const [editingEvent, setEditingEvent] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', event_date: '' });
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Слушател за промяна на размера на прозореца
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Зареждане на всички събития с гласове
    const loadEvents = async () => {
        try {
            // Зареждаме събитията
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select(`
                    *,
                    created_by_employee:employees!events_created_by_fkey(name)
                `)
                .eq('is_active', true)
                .order('event_date', { ascending: true });

            if (eventsError) throw eventsError;

            // За всяко събитие зареждаме гласовете
            const eventsWithVotes = await Promise.all(
                (eventsData || []).map(async (event) => {
                    // Зареждаме всички гласове за това събитие
                    const { data: votesData, error: votesError } = await supabase
                        .from('votes')
                        .select('*, employee:employees(name)')
                        .eq('event_id', event.id);

                    if (votesError) throw votesError;

                    // Преброяваме гласовете
                    const yesCount = votesData?.filter(v => v.vote_type === 'yes').length || 0;
                    const noCount = votesData?.filter(v => v.vote_type === 'no').length || 0;
                    const maybeCount = votesData?.filter(v => v.vote_type === 'maybe').length || 0;

                    // Намираме гласа на текущия потребител
                    const userVote = votesData?.find(v => v.employee_id === user?.id);

                    return {
                        ...event,
                        votes: votesData || [],
                        yesCount,
                        noCount,
                        maybeCount,
                        totalVotes: (votesData?.length || 0),
                        userVote: userVote?.vote_type || null
                    };
                })
            );

            setEvents(eventsWithVotes);
            setLoading(false);
        } catch (error) {
            console.error('Грешка при зареждане на събития:', error);
            setError('Грешка при зареждане на събития');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, [user]);

    // Добавяне на ново събитие
    const handleAddEvent = async (e) => {
        e.preventDefault();
        
        if (!newEvent.title || !newEvent.event_date) {
            setError('Моля, попълнете всички полета');
            return;
        }

        try {
            const { error } = await supabase
                .from('events')
                .insert([{
                    title: newEvent.title,
                    event_date: newEvent.event_date,
                    created_by: user.id
                }]);

            if (error) throw error;

            setNewEvent({ title: '', event_date: '' });
            setShowAddForm(false);
            setError('');
            await loadEvents();
        } catch (error) {
            console.error('Грешка при добавяне на събитие:', error);
            setError('Грешка при добавяне на събитие');
        }
    };

    // Изтриване на събитие
    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Сигурни ли сте, че искате да изтриете това събитие?')) {
            return;
        }

        try {
            // Първо изтриваме всички гласове за това събитие
            const { error: votesError } = await supabase
                .from('votes')
                .delete()
                .eq('event_id', eventId);

            if (votesError) throw votesError;

            // След това изтриваме събитието
            const { error: eventError } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (eventError) throw eventError;

            await loadEvents();
        } catch (error) {
            console.error('Грешка при изтриване на събитие:', error);
            setError('Грешка при изтриване на събитие: ' + error.message);
        }
    };

    // Започване на редактиране
    const handleStartEdit = (event) => {
        setEditingEvent(event.id);
        setEditForm({
            title: event.title,
            event_date: event.event_date
        });
        setShowAddForm(false); // Затваряме Add формата ако е отворена
        setError('');
    };

    // Отказ от редактиране
    const handleCancelEdit = () => {
        setEditingEvent(null);
        setEditForm({ title: '', event_date: '' });
    };

    // Обновяване на събитие
    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        
        if (!editForm.title || !editForm.event_date) {
            setError('Моля, попълнете всички полета');
            return;
        }

        try {
            const { error } = await supabase
                .from('events')
                .update({
                    title: editForm.title,
                    event_date: editForm.event_date
                })
                .eq('id', editingEvent);

            if (error) throw error;

            setEditingEvent(null);
            setEditForm({ title: '', event_date: '' });
            setError('');
            await loadEvents();
        } catch (error) {
            console.error('Грешка при обновяване на събитие:', error);
            setError('Грешка при обновяване на събитие');
        }
    };

    // Гласуване с toggle функционалност
    const handleVote = async (eventId, voteType) => {
        try {
            // Проверяваме дали вече има глас
            const { data: existingVote } = await supabase
                .from('votes')
                .select('*')
                .eq('event_id', eventId)
                .eq('employee_id', user.id)
                .single();

            if (existingVote) {
                // Ако натискаме същия бутон отново - премахваме гласа (toggle off)
                if (existingVote.vote_type === voteType) {
                    const { error } = await supabase
                        .from('votes')
                        .delete()
                        .eq('id', existingVote.id);

                    if (error) throw error;
                } else {
                    // Ако натискаме различен бутон - обновяваме гласа
                    const { error } = await supabase
                        .from('votes')
                        .update({ vote_type: voteType })
                        .eq('id', existingVote.id);

                    if (error) throw error;
                }
            } else {
                // Ако няма глас, създаваме нов
                const { error } = await supabase
                    .from('votes')
                    .insert([{
                        event_id: eventId,
                        employee_id: user.id,
                        vote_type: voteType
                    }]);

                if (error) throw error;
            }

            await loadEvents();
        } catch (error) {
            console.error('Грешка при гласуване:', error);
            setError('Грешка при гласуване');
        }
    };

    // Форматиране на дата
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('bg-BG', options);
    };

    // Проверка дали събитието е минало
    const isPastEvent = (dateString) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate < today;
    };

    if (loading) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '3rem' }}>⏳</div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                    Зареждане на събития...
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ 
            paddingBottom: isMobile ? 'calc(100px + env(safe-area-inset-bottom))' : '0',
            minHeight: isMobile ? '100vh' : 'auto'
        }}>
            <div className="content-header" style={{ 
                display: 'flex', 
                justifyContent: isMobile ? 'center' : 'space-between', 
                alignItems: 'center',
                marginBottom: '2rem',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '1.25rem' : '1rem'
            }}>
                <h1 style={{ 
                    margin: 0,
                    fontSize: isMobile ? '1.75rem' : '2rem',
                    textAlign: isMobile ? 'center' : 'left'
                }}>🎉 Евенти</h1>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        background: showAddForm 
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                            : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        color: 'white',
                        padding: isMobile ? '1rem 1.5rem' : '0.875rem 1.75rem',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: isMobile ? '1.05rem' : '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.625rem',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap',
                        width: isMobile ? '100%' : 'auto',
                        maxWidth: isMobile ? '400px' : 'none'
                    }}
                    onMouseEnter={(e) => {
                        if (!isMobile) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isMobile) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                        }
                    }}
                >
                    <i className={`fas fa-${showAddForm ? 'times' : 'plus'}`} style={{ fontSize: '1.1rem' }}></i>
                    <span>{showAddForm ? 'Отказ' : 'Добави събитие'}</span>
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

            {/* Формуляр за добавяне на събитие */}
            {showAddForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="card-header">
                        <h2 className="card-title">➕ Ново събитие</h2>
                    </div>
                    <form onSubmit={handleAddEvent} style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Име на събитието
                            </label>
                            <input
                                type="text"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="напр. Коледна партита, Team Building..."
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
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Дата на събитието
                            </label>
                            <input
                                type="date"
                                value={newEvent.event_date}
                                onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
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
                            ✨ Създай събитие
                        </button>
                    </form>
                </div>
            )}

            {/* Списък със събития */}
            {events.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📅</div>
                    <h2>Няма предстоящи събития</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Създайте ново събитие, за да започнете!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {events.map((event) => (
                        <div key={event.id} className="card">
                            <div style={{ padding: '1.5rem' }}>
                                {editingEvent === event.id ? (
                                    // Edit форма
                                    <form onSubmit={handleUpdateEvent}>
                                        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                                            ✏️ Редактиране на събитие
                                        </h2>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                Име на събитието
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                placeholder="напр. Коледна партита, Team Building..."
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
                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                Дата на събитието
                                            </label>
                                            <input
                                                type="date"
                                                value={editForm.event_date}
                                                onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
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
                                ) : (
                                    // Нормален изглед
                                    <>
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'flex-start',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <h2 style={{ 
                                                    fontSize: '1.5rem', 
                                                    marginBottom: '0.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    {event.title}
                                                    {isPastEvent(event.event_date) && (
                                                        <span style={{ 
                                                            fontSize: '0.75rem',
                                                            padding: '0.25rem 0.5rem',
                                                            background: 'var(--border)',
                                                            borderRadius: '4px',
                                                            color: 'var(--text-secondary)'
                                                        }}>
                                                            Минало
                                                        </span>
                                                    )}
                                                </h2>
                                                <div style={{ 
                                                    color: 'var(--text-secondary)', 
                                                    fontSize: '0.9rem',
                                                    display: 'flex',
                                                    gap: '1rem',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    <span>📅 {formatDate(event.event_date)}</span>
                                                    <span>👤 Създадено от: {event.created_by_employee?.name || 'Неизвестен'}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleStartEdit(event)}
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
                                                    title="Редактирай събитие"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
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
                                                    title="Изтрий събитие"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>

                                {/* Визуализация с донът чарт и статистика */}
                                <div style={{ 
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '200px 1fr',
                                    gap: isMobile ? '1.5rem' : '2rem',
                                    marginBottom: '1.5rem',
                                    padding: isMobile ? '1.25rem' : '1.5rem',
                                    background: 'var(--secondary-bg)',
                                    borderRadius: '12px'
                                }}>
                                    {/* Донът чарт */}
                                    <div style={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                                            {/* Донът чарт с CSS */}
                                            <svg width="150" height="150" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                                {/* Background circle */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="none"
                                                    stroke="var(--border)"
                                                    strokeWidth="20"
                                                />
                                                {/* Да (зелен) */}
                                                {event.totalVotes > 0 && (
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        fill="none"
                                                        stroke="#10b981"
                                                        strokeWidth="20"
                                                        strokeDasharray={`${(event.yesCount / event.totalVotes) * 251.2} 251.2`}
                                                        strokeDashoffset="0"
                                                    />
                                                )}
                                                {/* Не (червен) */}
                                                {event.totalVotes > 0 && event.noCount > 0 && (
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        fill="none"
                                                        stroke="#ef4444"
                                                        strokeWidth="20"
                                                        strokeDasharray={`${(event.noCount / event.totalVotes) * 251.2} 251.2`}
                                                        strokeDashoffset={`-${(event.yesCount / event.totalVotes) * 251.2}`}
                                                    />
                                                )}
                                                {/* Обмислям (жълт) */}
                                                {event.totalVotes > 0 && event.maybeCount > 0 && (
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        fill="none"
                                                        stroke="#f59e0b"
                                                        strokeWidth="20"
                                                        strokeDasharray={`${(event.maybeCount / event.totalVotes) * 251.2} 251.2`}
                                                        strokeDashoffset={`-${((event.yesCount + event.noCount) / event.totalVotes) * 251.2}`}
                                                    />
                                                )}
                                            </svg>
                                            {/* Процент в центъра */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ 
                                                    fontSize: '1.8rem', 
                                                    fontWeight: '800',
                                                    color: '#10b981'
                                                }}>
                                                    {event.totalVotes > 0 
                                                        ? Math.round((event.yesCount / event.totalVotes) * 100)
                                                        : 0}%
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    ще дойдат
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Легенда */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                                                <span style={{ fontSize: '0.85rem' }}>Да: {event.yesCount}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
                                                <span style={{ fontSize: '0.85rem' }}>Не: {event.noCount}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                                <span style={{ fontSize: '0.85rem' }}>Обмислям: {event.maybeCount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Списък с гласуващите */}
                                    <div>
                                        <h3 style={{ 
                                            fontSize: '1rem', 
                                            marginBottom: '1rem',
                                            color: 'var(--text)',
                                            fontWeight: '600'
                                        }}>
                                            👥 Кой как е гласувал ({event.totalVotes} общо)
                                        </h3>
                                        {event.votes.length > 0 ? (
                                            <div style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: '0.5rem',
                                                maxHeight: isMobile ? '150px' : '200px',
                                                overflowY: 'auto',
                                                paddingRight: '0.5rem'
                                            }}>
                                                {event.votes.map((vote, idx) => (
                                                    <div 
                                                        key={idx}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '0.5rem 0.75rem',
                                                            background: 'var(--card-bg)',
                                                            borderRadius: '6px',
                                                            borderLeft: `3px solid ${
                                                                vote.vote_type === 'yes' ? '#10b981' :
                                                                vote.vote_type === 'no' ? '#ef4444' : '#f59e0b'
                                                            }`
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '0.9rem' }}>
                                                            {vote.employee?.name || 'Неизвестен'}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '1.2rem',
                                                            color: vote.vote_type === 'yes' ? '#10b981' :
                                                                   vote.vote_type === 'no' ? '#ef4444' : '#f59e0b'
                                                        }}>
                                                            {vote.vote_type === 'yes' ? '✓' :
                                                             vote.vote_type === 'no' ? '✗' : '?'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ 
                                                textAlign: 'center', 
                                                padding: '2rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                Все още няма гласове
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Бутони за гласуване */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                                    gap: '0.75rem'
                                }}>
                                    <button
                                        onClick={() => handleVote(event.id, 'yes')}
                                        style={{
                                            padding: isMobile ? '1rem' : '0.75rem',
                                            background: event.userVote === 'yes' 
                                                ? 'linear-gradient(135deg, #10b981, #059669)' 
                                                : 'var(--secondary-bg)',
                                            color: event.userVote === 'yes' ? 'white' : 'var(--text)',
                                            border: event.userVote === 'yes' ? 'none' : '2px solid var(--border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: isMobile ? '1.05rem' : '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <span>✓</span> Да
                                    </button>
                                    <button
                                        onClick={() => handleVote(event.id, 'no')}
                                        style={{
                                            padding: isMobile ? '1rem' : '0.75rem',
                                            background: event.userVote === 'no' 
                                                ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                                                : 'var(--secondary-bg)',
                                            color: event.userVote === 'no' ? 'white' : 'var(--text)',
                                            border: event.userVote === 'no' ? 'none' : '2px solid var(--border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: isMobile ? '1.05rem' : '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <span>✗</span> Не
                                    </button>
                                    <button
                                        onClick={() => handleVote(event.id, 'maybe')}
                                        style={{
                                            padding: isMobile ? '1rem' : '0.75rem',
                                            background: event.userVote === 'maybe' 
                                                ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                                                : 'var(--secondary-bg)',
                                            color: event.userVote === 'maybe' ? 'white' : 'var(--text)',
                                            border: event.userVote === 'maybe' ? 'none' : '2px solid var(--border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: isMobile ? '1.05rem' : '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <span>?</span> Обмислям
                                    </button>
                                </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Events;

