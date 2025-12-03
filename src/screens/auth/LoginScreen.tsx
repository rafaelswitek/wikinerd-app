import React, { useState, useContext } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, TextInput, Button, useTheme, ActivityIndicator } from "react-native-paper";
import { AuthContext } from "../../context/AuthContext";
import { api } from "../../services/api";

export default function LoginScreen({ navigation }: any) {
  const theme = useTheme();
  const { signIn } = useContext(AuthContext);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  async function handleLogin() {
    if (!email || !password) {
        Alert.alert("Erro", "Preencha todos os campos");
        return;
    }

    setLoading(true);
    try {
      const response = await api.post("/login", { email, password });
      await signIn(response.data);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro no Login", "Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>WikiNerd</Text>
      
      <TextInput
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        label="Senha"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        secureTextEntry={secureText}
        right={<TextInput.Icon icon={secureText ? "eye" : "eye-off"} onPress={() => setSecureText(!secureText)} />}
        style={styles.input}
      />

      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotLink}>
        <Text style={{ color: theme.colors.secondary }}>Esqueci minha senha</Text>
      </TouchableOpacity>

      <Button 
        mode="contained" 
        onPress={handleLogin} 
        style={styles.button}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : "Entrar"}
      </Button>

      <View style={styles.footer}>
        <Text style={{ color: theme.colors.onBackground }}>Não tem uma conta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={{ color: theme.colors.primary, fontWeight: "bold" }}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { textAlign: "center", marginBottom: 40, fontWeight: "bold" },
  input: { marginBottom: 16 },
  forgotLink: { alignSelf: "flex-end", marginBottom: 24 },
  button: { paddingVertical: 6, borderRadius: 8 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
});