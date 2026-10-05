import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth.service';
import { decodeJwt } from '../utils/jwt';

const TOKEN_KEY = 'auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);  // { id, role, email, ... }
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);  // true sẽ show splash khi khởi động

  // Khôi phục session khi mở app
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(TOKEN_KEY);
        if (saved) {
          const claims = decodeJwt(saved);
          // Kiểm tra token chưa hết hạn
          if (claims && claims.exp * 1000 > Date.now()) {
            setToken(saved);
            setUser(buildUser(claims));
          } else {
            await AsyncStorage.removeItem(TOKEN_KEY);
          }
        }
      } catch (e) {
        console.warn('AuthContext restore error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password);
    const jwt = res?.result?.token;
    if (!jwt) throw new Error('Không nhận được token từ server');

    const claims = decodeJwt(jwt);
    await AsyncStorage.setItem(TOKEN_KEY, jwt);
    setToken(jwt);
    setUser(buildUser(claims));
    return buildUser(claims);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) await authService.logout(token);
    } catch {
      // Bỏ qua lỗi logout từ server, vẫn xóa local
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
  return ctx;
}

// Chuyển JWT claims thành object user thân thiện
function buildUser(claims) {
  if (!claims) return null;
  return {
    id:    claims.userId ?? claims.sub,
    role:  claims.scope ?? claims.role ?? null,
    email: claims.email ?? null,
  };
}
