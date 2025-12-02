import React, { useState } from "react";
import { Appbar, Menu, Divider, useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

export default function Header() {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const [visible, setVisible] = useState(false);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    const _handleNotification = () => {
        console.log("Abrir notificações");
    };

    const _handleProfile = () => {
        closeMenu();
        navigation.navigate("Profile");
    };

    const _handleSettings = () => {
        console.log("Ir para Configurações");
        closeMenu();
    };

    const _handleLogout = () => {
        console.log("Sair");
        closeMenu();
    };

    return (
        <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
            <Appbar.Content title="WikiNerd" titleStyle={{ fontWeight: 'bold', color: '#6200ee' }} />

            <Appbar.Action icon="bell" onPress={_handleNotification} />

            <Menu
                visible={visible}
                onDismiss={closeMenu}
                anchor={
                    <Appbar.Action
                        icon="dots-vertical"
                        color={theme.colors.onSurface}
                        onPress={openMenu}
                    />
                }
                anchorPosition="bottom"
            >
                <Menu.Item
                    leadingIcon="account"
                    onPress={_handleProfile}
                    title="Meu Perfil"
                />
                <Menu.Item
                    leadingIcon="cog"
                    onPress={_handleSettings}
                    title="Configurações"
                />
                <Divider />
                <Menu.Item
                    leadingIcon="logout"
                    onPress={_handleLogout}
                    title="Sair"
                />
            </Menu>
        </Appbar.Header>
    );
}