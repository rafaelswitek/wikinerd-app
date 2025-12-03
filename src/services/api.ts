import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const api = axios.create({
  baseURL: "https://api.wikinerd.com.br/api",
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("@wikinerd:token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});