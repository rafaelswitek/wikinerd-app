import React, { useContext } from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import MediaTabs from "../components/MediaTabs";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from "../components/Header";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "react-native-paper";
import { AuthContext } from "../context/AuthContext";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function MainTabs() {
  const theme = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header />
      <Tab.Navigator
        initialRouteName="Filmes"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopWidth: 0,
            elevation: 5,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarIcon: ({ color, size }) => {
            let iconName: string;
            switch (route.name) {
              case 'Filmes': iconName = 'movie'; break;
              case 'Séries': iconName = 'television-box'; break;
              case 'Jogos': iconName = 'gamepad-variant'; break;
              case 'Livros': iconName = 'book-open'; break;
              case 'Outros': iconName = 'dots-horizontal'; break;
              default: iconName = 'help-circle';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Filmes">{() => <MediaTabs mediaType="movies" />}</Tab.Screen>
        <Tab.Screen name="Séries">{() => <MediaTabs mediaType="tv" />}</Tab.Screen>
        <Tab.Screen name="Jogos">{() => <MediaTabs mediaType="games" />}</Tab.Screen>
        <Tab.Screen name="Livros">{() => <MediaTabs mediaType="books" />}</Tab.Screen>
        <Tab.Screen name="Outros">{() => <MediaTabs mediaType="others" />}</Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}

function CustomDrawerContent(props: any) {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { signOut } = useContext(AuthContext);

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: theme.colors.surface }}>
      <DrawerItem
        label="Meu Perfil"
        labelStyle={{ color: theme.colors.onSurface }}
        icon={({ size }) => <Icon name="account" color={theme.colors.onSurface} size={size} />}
        onPress={() => navigation.navigate("Profile")}
      />
      <DrawerItem
        label="Configurações"
        labelStyle={{ color: theme.colors.onSurface }}
        icon={({ size }) => <Icon name="cog" color={theme.colors.onSurface} size={size} />}
        onPress={() => console.log("Configurações")}
      />
      <DrawerItem
        label="Sair"
        labelStyle={{ color: theme.colors.onSurface }}
        icon={({ size }) => <Icon name="logout" color={theme.colors.onSurface} size={size} />}
        onPress={signOut}
      />
    </DrawerContentScrollView>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  return (
    <Drawer.Navigator 
      screenOptions={{ headerShown: false, drawerStyle: { backgroundColor: theme.colors.surface } }} 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
    </Drawer.Navigator>
  );
}