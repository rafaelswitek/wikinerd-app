import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import MediaTabs from "../components/MediaTabs";
import { SafeAreaView } from "react-native-safe-area-context";

const Tab = createMaterialTopTabNavigator();

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: "#ffffff" },
          tabBarIndicatorStyle: { backgroundColor: "#6200ee" },
          tabBarLabelStyle: { fontWeight: "bold" },
          lazy: true,
        }}
      >
        <Tab.Screen name="Filmes">
          {() => <MediaTabs mediaType="movies" />}
        </Tab.Screen>

        <Tab.Screen name="Séries">
          {() => <MediaTabs mediaType="tv" />}
        </Tab.Screen>

        <Tab.Screen name="Jogos">
          {() => <MediaTabs mediaType="games" />}
        </Tab.Screen>

        <Tab.Screen name="Livros">
          {() => <MediaTabs mediaType="books" />}
        </Tab.Screen>

        <Tab.Screen name="Outros">
          {() => <MediaTabs mediaType="others" />}
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
  );
}