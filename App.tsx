import React, { useState, useMemo } from "react";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { NavigationContainer, DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeContext } from "./src/context/ThemeContext";

import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import MediaDetailsScreen from "./src/screens/MediaDetailsScreen";

const paperColorsLight = {
  ...MD3LightTheme.colors,
  background: '#ffffff',
  surface: '#f1f5f9',
  surfaceVariant: '#e2e8f0',
  customBackground: '#ffffff',
  customSurface: '#f1f5f9',
};

const paperColorsDark = {
  ...MD3DarkTheme.colors,
  background: '#060d17',
  surface: '#0f172a',
  surfaceVariant: '#1e293b',
  customBackground: '#060d17',
  customSurface: '#0f172a',
};

const paperThemeLight = {
  ...MD3LightTheme,
  colors: paperColorsLight,
};

const paperThemeDark = {
  ...MD3DarkTheme,
  colors: paperColorsDark,
};

const navThemeLight = {
  ...NavDefaultTheme,
  colors: {
    ...NavDefaultTheme.colors,
    primary: paperColorsLight.primary,
    background: paperColorsLight.background,
    card: paperColorsLight.surface,
    text: paperColorsLight.onSurface,
    border: paperColorsLight.outline,
    notification: paperColorsLight.error,
  },
};

const navThemeDark = {
  ...NavDarkTheme,
  colors: {
    ...NavDarkTheme.colors,
    primary: paperColorsDark.primary,
    background: paperColorsDark.background,
    card: paperColorsDark.surface,
    text: paperColorsDark.onSurface,
    border: paperColorsDark.outline,
    notification: paperColorsDark.error,
  },
};

const Stack = createNativeStackNavigator();

export default function App() {
  const [isDark, setIsDark] = useState(true);

  const paperTheme = isDark ? paperThemeDark : paperThemeLight;
  const navTheme = isDark ? navThemeDark : navThemeLight;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const themeContextValue = useMemo(() => ({ isDark, toggleTheme }), [isDark]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <NavigationContainer theme={navTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                  headerShown: true,
                  title: "Meu Perfil",
                  headerStyle: { backgroundColor: navTheme.colors.card },
                  headerTintColor: navTheme.colors.text
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