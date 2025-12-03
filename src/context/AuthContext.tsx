import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import { AuthResponse } from "../types/Auth";

interface AuthContextData {
  signed: boolean;
  token: string | null;
  loading: boolean;
  signIn: (data: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storedToken = await AsyncStorage.getItem("@wikinerd:token");

      if (storedToken) {
        setToken(storedToken);
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  async function signIn(response: AuthResponse) {
    const { access_token } = response;
    
    await AsyncStorage.setItem("@wikinerd:token", access_token);
    setToken(access_token);
  }

  async function signOut() {
    try {
        await api.post("/logout");
    } catch (error) {
        console.log("Erro ao fazer logout na API", error);
    }
    await AsyncStorage.removeItem("@wikinerd:token");
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!token, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};