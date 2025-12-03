import React, { useState, useMemo } from "react";
import { PaperProvider, MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from "react-native-paper";
import { NavigationContainer, DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeContext } from "./src/context/ThemeContext";

import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import MediaDetailsScreen from "./src/screens/MediaDetailsScreen";

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavDefaultTheme,
  reactNavigationDark: NavDarkTheme,
});

const CombinedDefaultTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
    customBackground: '#ffffff',
    customSurface: '#f1f5f9',
  },
  fonts: MD3LightTheme.fonts,
};

const CombinedDarkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
    background: '#060d17',
    surface: '#0f172a',
    surfaceVariant: '#1e293b',
    customBackground: '#060d17',
    customSurface: '#0f172a',
  },
  fonts: MD3DarkTheme.fonts,
};

const Stack = createNativeStackNavigator();

export default function App() {
  const [isDark, setIsDark] = useState(true);

  const theme = isDark ? CombinedDarkTheme : CombinedDefaultTheme;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const themeContextValue = useMemo(() => ({ isDark, toggleTheme }), [isDark]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer theme={theme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  headerShown: true,
                  title: "Meu Perfil",
                  headerStyle: { backgroundColor: theme.colors.surface },
                  headerTintColor: theme.colors.onSurface
                }}
              />

              <Stack.Screen
                name="MediaDetails"
                component={MediaDetailsScreen}
                options={{
                  headerShown: true,
                  title: "",
                  headerTransparent: true,
                  headerTintColor: '#fff',
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </ThemeContext.Provider>
  );
}