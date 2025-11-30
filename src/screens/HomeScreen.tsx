// rafaelswitek/wikinerd-app/wikinerd-app-f9a8b7bf7c10e0c0e9bd3a953c314a4bc82f3226/src/screens/HomeScreen.tsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"; 
import MediaTabs from "../components/MediaTabs";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 

const Tab = createBottomTabNavigator(); 

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}> 
      <Tab.Navigator
        initialRouteName="Filmes"
        screenOptions={({ route }) => ({
          headerShown: false, 
          tabBarStyle: { 
              backgroundColor: "#ffffff",
          },
          tabBarActiveTintColor: '#6200ee', 
          tabBarInactiveTintColor: '#6b7280', 
          
          tabBarIcon: ({ color, size }) => {
            // ... (lógica de ícones)
          },
        })}
      >
        // ... (Telás de Tab.Screen)
      </Tab.Navigator>
    </SafeAreaView> 
  );
}