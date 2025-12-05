import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import { AuthResponse, UserProfile, AuthContextData } from "../types/Auth";

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    try {
      // Tenta avisar o backend
      // O interceptor vai ignorar se isso der 401 para evitar loop
      await api.post("/logout");
    } catch (error) {
      console.log("Erro ao fazer logout na API (token provavelmente já expirado)", error);
    } finally {
      // Limpeza local mandatória
      await AsyncStorage.removeItem("@wikinerd:token");
      // Importante: garantir que o header seja limpo para futuras requisições (ex: novo login)
      delete api.defaults.headers.Authorization;
      setToken(null);
      setUser(null);
    }
  }, []);

  async function fetchUserProfile() {
    try {
      const response = await api.get("/users");
      setUser(response.data.data);
    } catch (error) {
      console.log("Erro ao buscar perfil:", error);
      throw error;
    }
  }

  // 1. Interceptor para Logout Automático (Refresh/Expiração)
  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Se for 401 E NÃO for a própria chamada de logout, fazemos o logout
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest.url?.includes("/logout")
        ) {
          console.log("Token expirado. Realizando logout local.");

          // Removemos o token do storage imediatamente para evitar que outras chamadas em paralelo tentem usar
          await AsyncStorage.removeItem("@wikinerd:token");

          // Chamamos o signOut para limpar o estado e tentar notificar o back (sem loop)
          await signOut();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [signOut]);

  // 2. Carregamento Inicial (Boot)
  useEffect(() => {
    async function loadStorageData() {
      const storedToken = await AsyncStorage.getItem("@wikinerd:token");

      if (storedToken) {
        api.defaults.headers.Authorization = `Bearer ${storedToken}`;
        setToken(storedToken);

        try {
          const response = await api.get("/users");
          setUser(response.data.data);
        } catch (error) {
          console.log("Erro ao carregar usuário no boot: Token inválido.");
          await signOut(); // Usa o signOut seguro que criamos
        }
      }
      setLoading(false);
    }

    loadStorageData();
  }, [signOut]);

  async function signIn(response: AuthResponse) {
    const { access_token } = response;

    api.defaults.headers.Authorization = `Bearer ${access_token}`;
    await AsyncStorage.setItem("@wikinerd:token", access_token);

    setToken(access_token);

    try {
      await fetchUserProfile();
    } catch (error) {
      console.log("Falha ao buscar perfil pós-login");
    }
  }

  return (
    <AuthContext.Provider value={{
      signed: !!token,
      token,
      user,
      loading,
      signIn,
      signOut,
      updateUserProfile: fetchUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};