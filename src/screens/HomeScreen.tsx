import React, { useContext } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator, DrawerContentComponentProps } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { Text, Avatar, useTheme, Divider } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MediaTabs from "../components/MediaTabs";
import Header from "../components/Header";
import { AuthContext } from "../context/AuthContext";
import MoviesScreen from "./MoviesScreen";

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
            let iconName: string = 'help-circle';
            switch (route.name) {
              case 'Filmes': iconName = 'movie'; break;
              case 'Séries': iconName = 'television-box'; break;
              case 'Jogos': iconName = 'gamepad-variant'; break;
              case 'Livros': iconName = 'book-open'; break;
              case 'Outros': iconName = 'dots-horizontal'; break;
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

const DrawerSectionTitle = ({ title }: { title: string }) => {
  const theme = useTheme();
  return (
    <Text style={{
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      fontSize: 16,
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 16
    }}>
      {title}
    </Text>
  );
};

interface DrawerItemProps {
  label: string;
  icon: string;
  isComingSoon?: boolean;
  onPress?: () => void;
  active?: boolean;
}

const CustomDrawerItem = ({ label, icon, isComingSoon, onPress, active }: DrawerItemProps) => {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: active ? 'rgba(98, 0, 238, 0.1)' : 'transparent'
      }}
    >
      <Icon name={icon} size={22} color={theme.colors.onSurfaceVariant} style={{ width: 32 }} />
      <Text style={{ flex: 1, color: theme.colors.onSurfaceVariant, fontSize: 15 }}>{label}</Text>

      {isComingSoon && (
        <View style={{
          backgroundColor: '#3f2c1d', 
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderWidth: 1,
          borderColor: '#8c4d16'
        }}>
          <Text style={{ color: '#ff9800', fontSize: 10, fontWeight: 'bold' }}>Em Breve</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const { navigation } = props;
  const { user, signOut } = useContext(AuthContext);

  return (
    <View style={{ flex: 1, backgroundColor: '#02060e' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>WikiNerd</Text>
        </View>
      </View>

      <View style={{ marginHorizontal: 16, marginBottom: 16, padding: 12, backgroundColor: '#0f172a', borderRadius: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' }}>
        {user?.avatar ? (
          <Avatar.Image size={40} source={{ uri: user.avatar }} style={{ backgroundColor: theme.colors.primary }} />
        ) : (
          <Avatar.Text size={40} label={user?.name?.charAt(0) || "U"} style={{ backgroundColor: theme.colors.primary }} />
        )}

        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{user?.name || "Visitante"}</Text>
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>@{user?.username || "usuario"}</Text>
        </View>
      </View>

      <Divider style={{ backgroundColor: '#1e293b' }} />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <DrawerSectionTitle title="Mídia" />
        <CustomDrawerItem
          label="Início"
          icon="home-outline"
          onPress={() => navigation.navigate("MainTabs")}
        />

        <CustomDrawerItem
          label="Filmes"
          icon="movie-search-outline"
          onPress={() => navigation.navigate("MoviesCatalog")}
        />
        <CustomDrawerItem label="Séries" icon="television" onPress={() => navigation.navigate("MainTabs", { screen: "Séries" })} />
        <CustomDrawerItem label="Jogos" icon="controller" isComingSoon />
        <CustomDrawerItem label="Música" icon="music-note-eighth" isComingSoon />
        <CustomDrawerItem label="Livros" icon="book-open-page-variant" isComingSoon />
        <CustomDrawerItem label="YouTube" icon="youtube" isComingSoon />
        <CustomDrawerItem label="Podcasts" icon="podcast" isComingSoon />
        <CustomDrawerItem label="Pessoas" icon="account-group-outline" onPress={() => { }} />

        <DrawerSectionTitle title="Social" />
        <CustomDrawerItem label="Comunidade" icon="account-voice" isComingSoon />

        <DrawerSectionTitle title="Eventos" />
        <CustomDrawerItem label="Prêmios" icon="medal-outline" isComingSoon />

        <DrawerSectionTitle title="Pessoal" />
        <CustomDrawerItem label="Perfil" icon="account-outline" onPress={() => navigation.navigate("Profile")} />
        <CustomDrawerItem label="Configurações" icon="cog-outline" onPress={() => console.log("Config")} />

        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderWidth: 1,
              borderColor: '#1e293b',
              borderRadius: 8,
              backgroundColor: '#0f172a'
            }}
            onPress={signOut}
          >
            <Icon name="logout" size={20} color="white" />
            <Text style={{ color: 'white', marginLeft: 12, fontWeight: '500' }}>Sair</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: '#02060e', width: '80%' },
        drawerType: 'front'
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />

      <Drawer.Screen
        name="MoviesCatalog"
        component={MoviesScreen}
      />
    </Drawer.Navigator>
  );
}