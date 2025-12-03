import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { api } from "../../services/api";

export default function ResetPasswordScreen({ route, navigation }: any) {
  const theme = useTheme();
  const { email: initialEmail } = route.params || {};
  
  const [email, setEmail] = useState(initialEmail || "");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!token || !password || !passwordConfirmation) {
        Alert.alert("Erro", "Preencha todos os campos.");
        return;
    }
    setLoading(true);
    try {
      const response = await api.post("/password/reset", {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation
      });
      Alert.alert("Sucesso", response.data.message);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert("Erro", "Falha ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Redefinir Senha</Text>

      <TextInput label="E-mail" value={email} onChangeText={setEmail} mode="outlined" autoCapitalize="none" style={styles.input} />
      <TextInput label="Token (Código recebido)" value={token} onChangeText={setToken} mode="outlined" autoCapitalize="none" style={styles.input} />
      <TextInput label="Nova Senha" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry style={styles.input} />
      <TextInput label="Confirmar Nova Senha" value={passwordConfirmation} onChangeText={setPasswordConfirmation} mode="outlined" secureTextEntry style={styles.input} />

      <Button mode="contained" onPress={handleReset} loading={loading} style={styles.button}>
        Salvar Nova Senha
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { textAlign: "center", marginBottom: 20, fontWeight: "bold" },
  input: { marginBottom: 12 },
  button: { marginTop: 12, paddingVertical: 6, borderRadius: 8 },
});