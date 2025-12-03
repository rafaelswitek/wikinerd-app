import React, { useContext } from "react";
import { Appbar, useTheme } from "react-native-paper";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { ThemeContext } from "../context/ThemeContext";

export default function Header() {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const { isDark, toggleTheme } = useContext(ThemeContext);

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
            
            <Appbar.Content title="WikiNerd" titleStyle={{ fontWeight: 'bold', color: theme.colors.primary }} />

            <Appbar.Action 
                icon={isDark ? "weather-sunny" : "weather-night"} 
                onPress={toggleTheme} 
                color={theme.colors.onSurface}
            />
            
            <Appbar.Action icon="bell" onPress={_handleNotification} color={theme.colors.onSurface} />
        </Appbar.Header>
    );
}