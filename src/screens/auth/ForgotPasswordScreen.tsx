import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, TextInput, Button, useTheme } from "react-native-paper";
import { api } from "../../services/api";

export default function ForgotPasswordScreen({ navigation }: any) {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleForgot() {
    if (!email) return;
    setLoading(true);
    try {
      const response = await api.post("/password/forgot", { email });
      Alert.alert("Sucesso", response.data.message);
      navigation.navigate("ResetPassword", { email }); 
    } catch (error) {
      Alert.alert("Erro", "Não foi possível solicitar a recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>Recuperar Senha</Text>
      <Text style={{ color: theme.colors.secondary, marginBottom: 20, textAlign: 'center' }}>
        Digite seu e-mail para receber as instruções.
      </Text>

      <TextInput
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <Button mode="contained" onPress={handleForgot} loading={loading} style={styles.button}>
        Enviar
      </Button>
      
      <Button mode="text" onPress={() => navigation.goBack()} style={styles.backButton}>Voltar</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { textAlign: "center", marginBottom: 10, fontWeight: "bold" },
  input: { marginBottom: 16 },
  button: { paddingVertical: 6, borderRadius: 8 },
  backButton: { marginTop: 12 },
});