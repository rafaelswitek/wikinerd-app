import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import { AuthResponse, UserProfile, AuthContextData } from "../types/Auth";

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserProfile() {
    try {
      const response = await api.get("/users");
      setUser(response.data.data);
    } catch (error) {
      console.log("Erro ao buscar perfil:", error);
    }
  }

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
          console.log("Erro ao carregar usuário no boot:", error);
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

    await fetchUserProfile();
  }

  async function signOut() {
    try {
      await api.post("/logout");
    } catch (error) {
      console.log("Erro ao fazer logout na API", error);
    }
    await AsyncStorage.removeItem("@wikinerd:token");
    setToken(null);
    setUser(null);
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