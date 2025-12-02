// App.tsx
import * as React from "react";
import { PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import MediaDetailsScreen from "./src/screens/MediaDetailsScreen"; // Importação nova

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ headerShown: true, title: "Meu Perfil" }}
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
  );
}