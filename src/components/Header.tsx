import React from "react";
import { Appbar, useTheme } from "react-native-paper";
import { useNavigation, DrawerActions } from "@react-navigation/native";

export default function Header() {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const _handleNotification = () => {
        console.log("Abrir notificações");
    };

    const _toggleDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
            <Appbar.Action
                icon="menu"
                color={theme.colors.onSurface}
                onPress={_toggleDrawer}
            />
            
            <Appbar.Content title="WikiNerd" titleStyle={{ fontWeight: 'bold', color: '#6200ee' }} />

            <Appbar.Action icon="bell" onPress={_handleNotification} />
        </Appbar.Header>
    );
}