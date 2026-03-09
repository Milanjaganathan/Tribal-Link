import { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tl_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tl_access');
    if (token) {
      AuthAPI.profile()
        .then(({ data }) => { setUser(data); localStorage.setItem('tl_user', JSON.stringify(data)); })
        .catch(() => { logout(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await AuthAPI.login({ email, password });
    localStorage.setItem('tl_access', data.access);
    localStorage.setItem('tl_refresh', data.refresh);
    localStorage.setItem('tl_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const { data } = await AuthAPI.register(formData);
    localStorage.setItem('tl_access', data.tokens.access);
    localStorage.setItem('tl_refresh', data.tokens.refresh);
    localStorage.setItem('tl_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    const refresh = localStorage.getItem('tl_refresh');
    if (refresh) AuthAPI.logout({ refresh }).catch(() => {});
    localStorage.removeItem('tl_access');
    localStorage.removeItem('tl_refresh');
    localStorage.removeItem('tl_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
