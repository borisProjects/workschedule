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

    // Ð¡Ð»ÑƒÑˆÐ°Ñ‚ÐµÐ» Ð·Ð° Ð¿Ñ€Ð¾Ð¼ÑÐ½Ð° Ð½Ð° Ñ€Ð°Ð·Ð¼ÐµÑ€Ð° Ð½Ð° Ð¿Ñ€Ð¾Ð·Ð¾Ñ€ÐµÑ†Ð°
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Ð—Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð²ÑÐ¸Ñ‡ÐºÐ¸ ÑÑŠÐ±Ð¸Ñ‚Ð¸Ñ Ñ Ð³Ð»Ð°ÑÐ¾Ð²Ðµ
    const loadEvents = async () => {
        try {
            // ÐžÐ¿Ñ‚Ð¸Ð¼Ð¸Ð·Ð¸Ñ€Ð°Ð½Ð° Ð·Ð°ÑÐ²ÐºÐ°: Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð¼Ðµ ÑÑŠÐ±Ð¸Ñ‚Ð¸ÑÑ‚Ð° Ð¸ Ð³Ð»Ð°ÑÐ¾Ð²ÐµÑ‚Ðµ Ð½Ð°Ð²ÐµÐ´Ð½ÑŠÐ¶
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select(`
                    *,
                    created_by_employee:employees!events_created_by_fkey(name),
                    votes (
                        *,
                        employee:employees(name)
                    )
                `)
                .eq('is_active', true)
                .order('event_date', { ascending: true });

            if (eventsError) throw eventsError;

            // ÐžÐ±Ñ€Ð°Ð±Ð¾Ñ‚Ð²Ð°Ð¼Ðµ Ð´Ð°Ð½Ð½Ð¸Ñ‚Ðµ Ð»Ð¾ÐºÐ°Ð»Ð½Ð¾
            const eventsWithVotes = eventsData.map(event => {
                const votesData = event.votes || [];
                
                const yesCount = votesData.filter(v => v.vote_type === 'yes').length;
                const noCount = votesData.filter(v => v.vote_type === 'no').length;
                const maybeCount = votesData.filter(v => v.vote_type === 'maybe').length;

                // ÐÐ°Ð¼Ð¸Ñ€Ð°Ð¼Ðµ Ð³Ð»Ð°ÑÐ° Ð½Ð° Ñ‚ÐµÐºÑƒÑ‰Ð¸Ñ Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»
                const userVote = votesData.find(v => v.employee_id === user?.id);

                return {
                    ...event,
                    votes: votesData,
                    yesCount,
                    noCount,
                    maybeCount,
                    totalVotes: votesData.length,
                    userVote: userVote?.vote_type || null
                };
            });

            setEvents(eventsWithVotes);
            setLoading(false);
        } catch (error) {
            console.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ñ:', error);
            setError('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ñ');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, [user]);
    const applyVoteLocally = (eventId, nextVoteType) => {
        setEvents((prevEvents) =>
            prevEvents.map((event) => {
                if (event.id !== eventId) return event;

                const existingVoteIndex = event.votes.findIndex((vote) => vote.employee_id === user?.id);
                const nextVotes = [...event.votes];

                if (!nextVoteType) {
                    if (existingVoteIndex >= 0) {
                        nextVotes.splice(existingVoteIndex, 1);
                    }
                } else if (existingVoteIndex >= 0) {
                    nextVotes[existingVoteIndex] = {
                        ...nextVotes[existingVoteIndex],
                        vote_type: nextVoteType
                    };
                } else {
                    nextVotes.push({
                        id: `local-${eventId}-${user.id}`,
                        event_id: eventId,
                        employee_id: user.id,
                        vote_type: nextVoteType,
                        employee: { name: user?.name || 'Вие' }
                    });
                }

                const yesCount = nextVotes.filter((vote) => vote.vote_type === 'yes').length;
                const noCount = nextVotes.filter((vote) => vote.vote_type === 'no').length;
                const maybeCount = nextVotes.filter((vote) => vote.vote_type === 'maybe').length;

                return {
                    ...event,
                    votes: nextVotes,
                    yesCount,
                    noCount,
                    maybeCount,
                    totalVotes: nextVotes.length,
                    userVote: nextVoteType || null
                };
            })
        );
    };

    // Ð”Ð¾Ð±Ð°Ð²ÑÐ½Ðµ Ð½Ð° Ð½Ð¾Ð²Ð¾ ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ
    const handleAddEvent = async (e) => {
        e.preventDefault();
        
        if (!newEvent.title || !newEvent.event_date) {
            setError('ÐœÐ¾Ð»Ñ, Ð¿Ð¾Ð¿ÑŠÐ»Ð½ÐµÑ‚Ðµ Ð²ÑÐ¸Ñ‡ÐºÐ¸ Ð¿Ð¾Ð»ÐµÑ‚Ð°');
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
            console.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð´Ð¾Ð±Ð°Ð²ÑÐ½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ:', error);
            setError('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð´Ð¾Ð±Ð°Ð²ÑÐ½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ');
        }
    };

    // Ð˜Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ
    const handleDeleteEvent = async (eventId) => {
        if (!confirm('Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ Ñ‚Ð¾Ð²Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ?')) {
            return;
        }

        try {
            // ÐŸÑŠÑ€Ð²Ð¾ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð¼Ðµ Ð²ÑÐ¸Ñ‡ÐºÐ¸ Ð³Ð»Ð°ÑÐ¾Ð²Ðµ Ð·Ð° Ñ‚Ð¾Ð²Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ
            const { error: votesError } = await supabase
                .from('votes')
                .delete()
                .eq('event_id', eventId);

            if (votesError) throw votesError;

            // Ð¡Ð»ÐµÐ´ Ñ‚Ð¾Ð²Ð° Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð¼Ðµ ÑÑŠÐ±Ð¸Ñ‚Ð¸ÐµÑ‚Ð¾
            const { error: eventError } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (eventError) throw eventError;

            await loadEvents();
        } catch (error) {
            console.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ:', error);
            setError('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ: ' + error.message);
        }
    };

    // Ð—Ð°Ð¿Ð¾Ñ‡Ð²Ð°Ð½Ðµ Ð½Ð° Ñ€ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð½Ðµ
    const handleStartEdit = (event) => {
        setEditingEvent(event.id);
        setEditForm({
            title: event.title,
            event_date: event.event_date
        });
        setShowAddForm(false); // Ð—Ð°Ñ‚Ð²Ð°Ñ€ÑÐ¼Ðµ Add Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ð° Ð°ÐºÐ¾ Ðµ Ð¾Ñ‚Ð²Ð¾Ñ€ÐµÐ½Ð°
        setError('');
    };

    // ÐžÑ‚ÐºÐ°Ð· Ð¾Ñ‚ Ñ€ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð½Ðµ
    const handleCancelEdit = () => {
        setEditingEvent(null);
        setEditForm({ title: '', event_date: '' });
    };

    // ÐžÐ±Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ
    const handleUpdateEvent = async (e) => {
        e.preventDefault();
        
        if (!editForm.title || !editForm.event_date) {
            setError('ÐœÐ¾Ð»Ñ, Ð¿Ð¾Ð¿ÑŠÐ»Ð½ÐµÑ‚Ðµ Ð²ÑÐ¸Ñ‡ÐºÐ¸ Ð¿Ð¾Ð»ÐµÑ‚Ð°');
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
            console.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð±Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ:', error);
            setError('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð±Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ');
        }
    };

    // Гласуване с toggle функционалност
    const handleVote = async (eventId, voteType) => {
        try {
            const event = events.find((item) => item.id === eventId);
            if (!event || !user?.id) return;

            const currentVote = event.userVote || null;
            if (currentVote === voteType) {
                const { error: deleteError } = await supabase
                    .from('votes')
                    .delete()
                    .eq('event_id', eventId)
                    .eq('employee_id', user.id);
                if (deleteError) throw deleteError;
                applyVoteLocally(eventId, null);
                return;
            }

            const { data: updatedRows, error: updateError } = await supabase
                .from('votes')
                .update({ vote_type: voteType })
                .eq('event_id', eventId)
                .eq('employee_id', user.id)
                .select('id');
            if (updateError) throw updateError;

            if (!updatedRows || updatedRows.length === 0) {
                const { error: insertError } = await supabase
                    .from('votes')
                    .insert([{
                        event_id: eventId,
                        employee_id: user.id,
                        vote_type: voteType
                    }]);
                if (insertError) throw insertError;
            }

            applyVoteLocally(eventId, voteType);
        } catch (error) {
            console.error('Грешка при гласуване:', error);
            setError('Грешка при гласуване');
        }
    };

    // Ð¤Ð¾Ñ€Ð¼Ð°Ñ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð´Ð°Ñ‚Ð°
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('bg-BG', options);
    };

    // ÐŸÑ€Ð¾Ð²ÐµÑ€ÐºÐ° Ð´Ð°Ð»Ð¸ ÑÑŠÐ±Ð¸Ñ‚Ð¸ÐµÑ‚Ð¾ Ðµ Ð¼Ð¸Ð½Ð°Ð»Ð¾
    const isPastEvent = (dateString) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate < today;
    };

    if (loading) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                <div style={{ fontSize: '3rem' }}>â³</div>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                    Ð—Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ñ...
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
                }}>ðŸŽ‰ Ð•Ð²ÐµÐ½Ñ‚Ð¸</h1>
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
                    <span>{showAddForm ? 'ÐžÑ‚ÐºÐ°Ð·' : 'Ð”Ð¾Ð±Ð°Ð²Ð¸ ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ'}</span>
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

            {/* Ð¤Ð¾Ñ€Ð¼ÑƒÐ»ÑÑ€ Ð·Ð° Ð´Ð¾Ð±Ð°Ð²ÑÐ½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ */}
            {showAddForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="card-header">
                        <h2 className="card-title">âž• ÐÐ¾Ð²Ð¾ ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ</h2>
                    </div>
                    <form onSubmit={handleAddEvent} style={{ padding: '1.5rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                Ð˜Ð¼Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸ÐµÑ‚Ð¾
                            </label>
                            <input
                                type="text"
                                value={newEvent.title}
                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="Ð½Ð°Ð¿Ñ€. ÐšÐ¾Ð»ÐµÐ´Ð½Ð° Ð¿Ð°Ñ€Ñ‚Ð¸Ñ‚Ð°, Team Building..."
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
                                Ð”Ð°Ñ‚Ð° Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸ÐµÑ‚Ð¾
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
                            âœ¨ Ð¡ÑŠÐ·Ð´Ð°Ð¹ ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ
                        </button>
                    </form>
                </div>
            )}

            {/* Ð¡Ð¿Ð¸ÑÑŠÐº ÑÑŠÑ ÑÑŠÐ±Ð¸Ñ‚Ð¸Ñ */}
            {events.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>ðŸ“…</div>
                    <h2>ÐÑÐ¼Ð° Ð¿Ñ€ÐµÐ´ÑÑ‚Ð¾ÑÑ‰Ð¸ ÑÑŠÐ±Ð¸Ñ‚Ð¸Ñ</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Ð¡ÑŠÐ·Ð´Ð°Ð¹Ñ‚Ðµ Ð½Ð¾Ð²Ð¾ ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ, Ð·Ð° Ð´Ð° Ð·Ð°Ð¿Ð¾Ñ‡Ð½ÐµÑ‚Ðµ!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {events.map((event) => (
                        <div key={event.id} className="card events-card">
                            <div style={{ padding: '1.5rem' }}>
                                {editingEvent === event.id ? (
                                    // Edit Ñ„Ð¾Ñ€Ð¼Ð°
                                    <form onSubmit={handleUpdateEvent}>
                                        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                                            âœï¸ Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ
                                        </h2>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                                Ð˜Ð¼Ðµ Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸ÐµÑ‚Ð¾
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                placeholder="Ð½Ð°Ð¿Ñ€. ÐšÐ¾Ð»ÐµÐ´Ð½Ð° Ð¿Ð°Ñ€Ñ‚Ð¸Ñ‚Ð°, Team Building..."
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
                                                Ð”Ð°Ñ‚Ð° Ð½Ð° ÑÑŠÐ±Ð¸Ñ‚Ð¸ÐµÑ‚Ð¾
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
                                                ðŸ’¾ Ð—Ð°Ð¿Ð°Ð·Ð¸ Ð¿Ñ€Ð¾Ð¼ÐµÐ½Ð¸Ñ‚Ðµ
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
                                                âœ– ÐžÑ‚ÐºÐ°Ð·
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    // ÐÐ¾Ñ€Ð¼Ð°Ð»ÐµÐ½ Ð¸Ð·Ð³Ð»ÐµÐ´
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
                                                            ÐœÐ¸Ð½Ð°Ð»Ð¾
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
                                                    <span>ðŸ“… {formatDate(event.event_date)}</span>
                                                    <span>ðŸ‘¤ Ð¡ÑŠÐ·Ð´Ð°Ð´ÐµÐ½Ð¾ Ð¾Ñ‚: {event.created_by_employee?.name || 'ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚ÐµÐ½'}</span>
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
                                                    title="Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹ ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ"
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
                                                    title="Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹ ÑÑŠÐ±Ð¸Ñ‚Ð¸Ðµ"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>

                                {/* Ð’Ð¸Ð·ÑƒÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ Ñ Ð´Ð¾Ð½ÑŠÑ‚ Ñ‡Ð°Ñ€Ñ‚ Ð¸ ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ° */}
                                <div style={{ 
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '200px 1fr',
                                    gap: isMobile ? '1.5rem' : '2rem',
                                    marginBottom: '1.5rem',
                                    padding: isMobile ? '1.25rem' : '1.5rem',
                                    background: 'var(--secondary-bg)',
                                    borderRadius: '12px'
                                }}>
                                    {/* Ð”Ð¾Ð½ÑŠÑ‚ Ñ‡Ð°Ñ€Ñ‚ */}
                                    <div style={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                                            {/* Ð”Ð¾Ð½ÑŠÑ‚ Ñ‡Ð°Ñ€Ñ‚ Ñ CSS */}
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
                                                {/* Ð”Ð° (Ð·ÐµÐ»ÐµÐ½) */}
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
                                                {/* ÐÐµ (Ñ‡ÐµÑ€Ð²ÐµÐ½) */}
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
                                                {/* ÐžÐ±Ð¼Ð¸ÑÐ»ÑÐ¼ (Ð¶ÑŠÐ»Ñ‚) */}
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
                                            {/* ÐŸÑ€Ð¾Ñ†ÐµÐ½Ñ‚ Ð² Ñ†ÐµÐ½Ñ‚ÑŠÑ€Ð° */}
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
                                                    Ñ‰Ðµ Ð´Ð¾Ð¹Ð´Ð°Ñ‚
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Ð›ÐµÐ³ÐµÐ½Ð´Ð° */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div>
                                                <span style={{ fontSize: '0.85rem' }}>Ð”Ð°: {event.yesCount}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div>
                                                <span style={{ fontSize: '0.85rem' }}>ÐÐµ: {event.noCount}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                                <span style={{ fontSize: '0.85rem' }}>ÐžÐ±Ð¼Ð¸ÑÐ»ÑÐ¼: {event.maybeCount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ð¡Ð¿Ð¸ÑÑŠÐº Ñ Ð³Ð»Ð°ÑÑƒÐ²Ð°Ñ‰Ð¸Ñ‚Ðµ */}
                                    <div>
                                        <h3 style={{ 
                                            fontSize: '1rem', 
                                            marginBottom: '1rem',
                                            color: 'var(--text)',
                                            fontWeight: '600'
                                        }}>
                                            ðŸ‘¥ ÐšÐ¾Ð¹ ÐºÐ°Ðº Ðµ Ð³Ð»Ð°ÑÑƒÐ²Ð°Ð» ({event.totalVotes} Ð¾Ð±Ñ‰Ð¾)
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
                                                            {vote.employee?.name || 'ÐÐµÐ¸Ð·Ð²ÐµÑÑ‚ÐµÐ½'}
                                                        </span>
                                                        <span style={{ 
                                                            fontSize: '1.2rem',
                                                            color: vote.vote_type === 'yes' ? '#10b981' :
                                                                   vote.vote_type === 'no' ? '#ef4444' : '#f59e0b'
                                                        }}>
                                                            {vote.vote_type === 'yes' ? 'âœ“' :
                                                             vote.vote_type === 'no' ? 'âœ—' : '?'}
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
                                                Ð’ÑÐµ Ð¾Ñ‰Ðµ Ð½ÑÐ¼Ð° Ð³Ð»Ð°ÑÐ¾Ð²Ðµ
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ð‘ÑƒÑ‚Ð¾Ð½Ð¸ Ð·Ð° Ð³Ð»Ð°ÑÑƒÐ²Ð°Ð½Ðµ */}
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
                                                : 'var(--card-bg)',
                                            color: event.userVote === 'yes' ? 'white' : 'var(--text-primary)',
                                            border: event.userVote === 'yes' ? 'none' : '2px solid var(--border-color)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: isMobile ? '1.05rem' : '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.3s ease',
                                            boxShadow: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isMobile) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.25)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <span>âœ“</span> Ð”Ð°
                                    </button>
                                    <button
                                        onClick={() => handleVote(event.id, 'no')}
                                        style={{
                                            padding: isMobile ? '1rem' : '0.75rem',
                                            background: event.userVote === 'no' 
                                                ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                                                : 'var(--card-bg)',
                                            color: event.userVote === 'no' ? 'white' : 'var(--text-primary)',
                                            border: event.userVote === 'no' ? 'none' : '2px solid var(--border-color)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: isMobile ? '1.05rem' : '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.3s ease',
                                            boxShadow: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isMobile) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.25)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <span>âœ—</span> ÐÐµ
                                    </button>
                                    <button
                                        onClick={() => handleVote(event.id, 'maybe')}
                                        style={{
                                            padding: isMobile ? '1rem' : '0.75rem',
                                            background: event.userVote === 'maybe' 
                                                ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                                                : 'var(--card-bg)',
                                            color: event.userVote === 'maybe' ? 'white' : 'var(--text-primary)',
                                            border: event.userVote === 'maybe' ? 'none' : '2px solid var(--border-color)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: isMobile ? '1.05rem' : '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.3s ease',
                                            boxShadow: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isMobile) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.25)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <span>?</span> ÐžÐ±Ð¼Ð¸ÑÐ»ÑÐ¼
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

