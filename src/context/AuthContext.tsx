import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import { AuthResponse, UserProfile, AuthContextData } from "../types/Auth";

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      // Erro 401 no logout é esperado se o token já expirou, ignoramos.
    } finally {
      await AsyncStorage.removeItem("@wikinerd:token");
      delete api.defaults.headers.Authorization;
      setToken(null);
      setUser(null);
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get("/users");
      setUser(response.data.data);
    } catch (error) {
      console.log("Erro ao buscar perfil:", error);
      throw error;
    }
  }, []);

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
          !originalRequest.url?.includes("/login") &&
          !originalRequest.url?.includes("/logout")
        ) {
          if (isRefreshing) {
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const response = await api.post("/refresh");
            const { access_token } = response.data;

            await AsyncStorage.setItem("@wikinerd:token", access_token);
            api.defaults.headers.Authorization = `Bearer ${access_token}`;
            setToken(access_token);

            processQueue(null, access_token);

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            console.log("Falha no refresh token. Realizando logout.");
            await signOut();
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
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
      try {
        const storedToken = await AsyncStorage.getItem("@wikinerd:token");

        if (storedToken) {
          api.defaults.headers.Authorization = `Bearer ${storedToken}`;
          setToken(storedToken);
          await fetchUserProfile();
        }
      } catch (error) {
        console.log("Sessão inválida ou erro de rede no boot.");
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, [fetchUserProfile]);

  const signIn = useCallback(async (response: AuthResponse) => {
    const { access_token } = response;

    api.defaults.headers.Authorization = `Bearer ${access_token}`;
    await AsyncStorage.setItem("@wikinerd:token", access_token);
    setToken(access_token);

    try {
      await fetchUserProfile();
    } catch (error) {
      console.log("Falha ao buscar perfil pós-login");
    }
  }, [fetchUserProfile]);

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