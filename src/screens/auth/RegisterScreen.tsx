import React, { useState, useContext } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, TextInput, Button, useTheme, ActivityIndicator } from "react-native-paper";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";

export default function RegisterScreen({ navigation }: any) {
  const theme = useTheme();
  const { signIn } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !username || !email || !password || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não conferem");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/register", {
        name,
        username,
        email,
        password,
        password_confirmation: confirmPassword
      });
      await signIn(response.data);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível criar a conta. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>Crie sua conta</Text>

      <TextInput label="Nome Completo" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <TextInput label="Nome de Usuário" value={username} onChangeText={setUsername} mode="outlined" autoCapitalize="none" style={styles.input} />
      <TextInput label="E-mail" value={email} onChangeText={setEmail} mode="outlined" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
      <TextInput label="Senha" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry style={styles.input} />
      <TextInput label="Confirmar Senha" value={confirmPassword} onChangeText={setConfirmPassword} mode="outlined" secureTextEntry style={styles.input} />

      <Button mode="contained" onPress={handleRegister} style={styles.button} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : "Cadastrar"}
      </Button>

      <Button mode="text" onPress={() => navigation.goBack()} style={styles.backButton}>
        Voltar para Login
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  title: { textAlign: "center", marginBottom: 30, fontWeight: "bold" },
  input: { marginBottom: 12 },
  button: { marginTop: 12, paddingVertical: 6, borderRadius: 8 },
  backButton: { marginTop: 12 },
});