import React from "react";
import { View } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";

export default function ProfileScreen({ navigation }: any) {
    const theme = useTheme();

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
            <Text variant="headlineMedium" style={{ marginBottom: 20, color: theme.colors.onBackground }}>Meu Perfil</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onBackground }}>Nome: Usuário WikiNerd</Text>
            <Text variant="bodyMedium" style={{ marginBottom: 20, color: theme.colors.onBackground }}>Email: usuario@wikinerd.com</Text>

            <Button mode="contained" onPress={() => navigation.goBack()}>
                Voltar
            </Button>
        </View>
    );
}