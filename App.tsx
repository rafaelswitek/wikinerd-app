import React, { useState, useMemo, useContext } from "react";
import { PaperProvider, MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from "react-native-paper";
import { NavigationContainer, DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeContext } from "./src/context/ThemeContext";
import { AuthProvider, AuthContext } from "./src/context/AuthContext";

import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import MediaDetailsScreen from "./src/screens/MediaDetailsScreen";

import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import PersonDetailsScreen from "./src/screens/PersonDetailsScreen";
import SplashScreen from "./src/screens/SplashScreen";
import ListsScreen from "./src/screens/ListsScreen";
import ListDetailsScreen from "./src/screens/ListDetailsScreen";
import EpisodeDetailsScreen from "./src/screens/EpisodeDetailsScreen";

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavDefaultTheme,
  reactNavigationDark: NavDarkTheme,
});

const paperColorsLight = {
  ...MD3LightTheme.colors,
  primary: '#7c4dff',
  onPrimary: '#ffffff',
  primaryContainer: '#e6e0ff',
  onPrimaryContainer: '#260058',
  background: '#ffffff',
  surface: '#f1f5f9',
  surfaceVariant: '#e2e8f0',
  customBackground: '#ffffff',
  customSurface: '#f1f5f9',
};

const paperColorsDark = {
  ...MD3DarkTheme.colors,
  primary: '#bfbaff',
  onPrimary: '#431d9b',
  primaryContainer: '#6242c7',
  onPrimaryContainer: '#e6e0ff',
  background: '#060d17',
  surface: '#0f172a',
  surfaceVariant: '#1e293b',
  customBackground: '#060d17',
  customSurface: '#0f172a',
};

const paperThemeLight = { ...MD3LightTheme, colors: paperColorsLight };
const paperThemeDark = { ...MD3DarkTheme, colors: paperColorsDark };

const navThemeLight = {
  ...LightTheme,
  colors: {
    ...LightTheme.colors,
    primary: paperColorsLight.primary,
    background: paperColorsLight.background,
    card: paperColorsLight.surface,
    text: paperColorsLight.onSurface,
    border: paperColorsLight.outline,
    notification: paperColorsLight.error,
  },
};

const navThemeDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: paperColorsDark.primary,
    background: paperColorsDark.background,
    card: paperColorsDark.surface,
    text: paperColorsDark.onSurface,
    border: paperColorsDark.outline,
    notification: paperColorsDark.error,
  },
};

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

function AppStack({ theme }: { theme: any }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: "Meu Perfil",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: "Configurações",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text
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
      <Stack.Screen
        name="PersonDetails"
        component={PersonDetailsScreen}
        options={{ title: "Detalhes", headerTransparent: true, headerTintColor: '#fff' }} // Ajuste conforme preferência visual
      />
      <Stack.Screen
        name="Lists"
        component={ListsScreen}
        options={{
          headerShown: true,
          title: "Listas",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text
        }}
      />
      <Stack.Screen
        name="ListDetails"
        component={ListDetailsScreen}
        options={{
          headerShown: true,
          title: "Detalhes da Lista",
          headerStyle: { backgroundColor: theme.colors.card },
          headerTintColor: theme.colors.text
        }}
      />
      <Stack.Screen
        name="EpisodeDetails"
        component={EpisodeDetailsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
    </Stack.Navigator>
  );
}

function NavigationRoot() {
  const { signed, loading } = useContext(AuthContext);
  const { isDark } = useContext(ThemeContext);
  const navTheme = isDark ? navThemeDark : navThemeLight;

  if (loading) return null;

  return (
    <NavigationContainer theme={navTheme}>
      {signed ? <AppStack theme={navTheme} /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(true);

  const paperTheme = isDark ? paperThemeDark : paperThemeLight;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const themeContextValue = useMemo(() => ({ isDark, toggleTheme }), [isDark]);

  return (
    <AuthProvider>
      <ThemeContext.Provider value={themeContextValue}>
        <SafeAreaProvider>
          <PaperProvider theme={paperTheme}>
            <NavigationRoot />
          </PaperProvider>
        </SafeAreaProvider>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}