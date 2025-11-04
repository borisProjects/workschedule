import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth трябва да се използва в AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);

    // Зареждане на служителите от Supabase
    const loadEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('is_active', true)
                .order('name');
            
            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error('Грешка при зареждане на служителите:', error);
        }
    };

    // Зареждане на потребителя от localStorage при стартиране
    useEffect(() => {
        const loadUser = async () => {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                setUser(userData);
            }
            await loadEmployees();
            setLoading(false);
        };
        
        loadUser();
    }, []);

    // Влизане в системата
    const login = async (employeeName) => {
        try {
            // Намиране на служителя в базата данни
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('name', employeeName)
                .eq('is_active', true)
                .single();

            if (error) throw error;

            if (data) {
                // Обновяване на last_login
                await supabase
                    .from('employees')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', data.id);

                // Запазване на потребителя
                setUser(data);
                localStorage.setItem('currentUser', JSON.stringify(data));
                return { success: true, user: data };
            }

            return { success: false, error: 'Служителят не е намерен' };
        } catch (error) {
            console.error('Грешка при влизане:', error);
            return { success: false, error: error.message };
        }
    };

    // Излизане от системата
    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    // Проверка дали потребителят е admin
    const isAdmin = user?.name === 'Юлия Любенова' || user?.name === 'Борис Иванов';

    const value = {
        user,
        loading,
        employees,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};


