import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MediaTabs from "../components/MediaTabs";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from "../components/Header";

const Tab = createBottomTabNavigator();

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>

      <Header />

      <Tab.Navigator
        initialRouteName="Filmes"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 0,
            elevation: 5,
          },
          tabBarActiveTintColor: '#6200ee',
          tabBarInactiveTintColor: '#6b7280',
          tabBarIcon: ({ color, size }) => {
            let iconName: string;
            switch (route.name) {
              case 'Filmes':
                iconName = 'movie';
                break;
              case 'Séries':
                iconName = 'television-box';
                break;
              case 'Jogos':
                iconName = 'gamepad-variant';
                break;
              case 'Livros':
                iconName = 'book-open';
                break;
              case 'Outros':
                iconName = 'dots-horizontal';
                break;
              default:
                iconName = 'help-circle';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
        })}
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
    </View>
  );
}