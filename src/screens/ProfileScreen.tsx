import React from "react";
import { View } from "react-native";
import { Text, Button } from "react-native-paper";

export default function ProfileScreen({ navigation }: any) {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
            <Text variant="headlineMedium" style={{ marginBottom: 20 }}>Meu Perfil</Text>
            <Text variant="bodyMedium">Nome: Usuário WikiNerd</Text>
            <Text variant="bodyMedium" style={{ marginBottom: 20 }}>Email: usuario@wikinerd.com</Text>

            <Button mode="contained" onPress={() => navigation.goBack()}>
                Voltar
            </Button>
        </View>
    );
}