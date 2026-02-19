import { useEffect } from 'react';
import { TeamLayoutSection } from './components/TeamLayoutSection';
import { CreateLayoutModal } from './components/CreateLayoutModal';
import { EditLayoutModal } from './components/EditLayoutModal';
import { useSeatsStore } from './store/useSeatsStore';
import { useAuth } from '../../contexts/AuthContext';
import '../../pages/Seats.css';

export const SeatsScreen = () => {
    const { isAdmin } = useAuth();
    const initialize = useSeatsStore((state) => state.initialize);
    const loading = useSeatsStore((state) => state.loading);
    const error = useSeatsStore((state) => state.error);
    const layouts = useSeatsStore((state) => state.layouts);
    const isCreateModalOpen = useSeatsStore((state) => state.isCreateModalOpen);
    const openCreateModal = useSeatsStore((state) => state.openCreateModal);
    const closeCreateModal = useSeatsStore((state) => state.closeCreateModal);
    const createLayout = useSeatsStore((state) => state.createLayout);

    useEffect(() => {
        initialize();
    }, [initialize]);

    if (loading) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                Зареждане на местата...
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', padding: '4rem' }}>
                {error}
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="content-header">
                <div>
                    <h1>Офис места</h1>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                        Всички layouts са видими едновременно. Местата могат да се разместват във всяка секция.
                    </p>
                </div>
                {isAdmin && (
                    <div className="layout-controls">
                        <button className="layout-btn" onClick={openCreateModal}>
                            Създай layout
                        </button>
                    </div>
                )}
            </div>

            <div className="team-layouts-list">
                {layouts.map((layout) => (
                    <TeamLayoutSection key={layout.id} layoutId={layout.id} />
                ))}
            </div>

            {isAdmin && <CreateLayoutModal isOpen={isCreateModalOpen} onClose={closeCreateModal} onCreate={createLayout} />}
            <EditLayoutModal />
        </div>
    );
};

export default SeatsScreen;
