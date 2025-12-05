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
      await api.post("/logout");
    } catch (error) {
      console.log("Erro ao fazer logout na API", error);
    } finally {
      await AsyncStorage.removeItem("@wikinerd:token");
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

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !originalRequest.url?.includes("/refresh") &&
          !originalRequest.url?.includes("/login")
        ) {
          originalRequest._retry = true;

          try {
            const response = await api.post("/refresh");
            const { access_token } = response.data;

            await AsyncStorage.setItem("@wikinerd:token", access_token);
            api.defaults.headers.Authorization = `Bearer ${access_token}`;
            setToken(access_token);

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            
            return api(originalRequest);
          } catch (refreshError) {
            console.log("Falha no refresh token. Realizando logout.");
            await signOut();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [signOut]);

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
          console.log("Erro ao carregar usuário no boot.");
        }
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

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