import * as React from "react";
import { PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "./src/screens/HomeScreen";
import { SafeAreaProvider } from "react-native-safe-area-context"; 


export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <NavigationContainer>
          <HomeScreen />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}