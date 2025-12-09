import React, { useContext } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator, DrawerContentComponentProps, useDrawerStatus } from "@react-navigation/drawer";
import { useNavigation } from "@react-navigation/native";
import { Text, Avatar, useTheme, Divider } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import MediaTabs from "../components/MediaTabs";
import Header from "../components/Header";
import { AuthContext } from "../context/AuthContext";
import MoviesScreen from "./MoviesScreen";
import PeopleScreen from "./PeopleScreen";

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function MainTabs() {
  const theme = useTheme();
  const isDrawerOpen = useDrawerStatus() === 'open';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        style={theme.dark ? "light" : "dark"}
        backgroundColor={isDrawerOpen ? theme.colors.surface : theme.colors.background}
        translucent
      />

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
              // case 'Jogos': iconName = 'gamepad-variant'; break;
              // case 'Livros': iconName = 'book-open'; break;
              // case 'Outros': iconName = 'dots-horizontal'; break;
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Filmes">{() => <MediaTabs mediaType="movies" />}</Tab.Screen>
        <Tab.Screen name="Séries">{() => <MediaTabs mediaType="tv" />}</Tab.Screen>
        {/* <Tab.Screen name="Jogos">{() => <MediaTabs mediaType="games" />}</Tab.Screen>
        <Tab.Screen name="Livros">{() => <MediaTabs mediaType="books" />}</Tab.Screen>
        <Tab.Screen name="Outros">{() => <MediaTabs mediaType="others" />}</Tab.Screen> */}
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
        backgroundColor: active ? theme.colors.secondaryContainer : 'transparent'
      }}
    >
      <Icon
        name={icon}
        size={22}
        color={active ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant}
        style={{ width: 32 }}
      />
      <Text style={{
        flex: 1,
        color: active ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant,
        fontSize: 15
      }}>
        {label}
      </Text>

      {isComingSoon && (
        <View style={{
          backgroundColor: theme.colors.tertiaryContainer,
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}>
          <Text style={{ color: theme.colors.onTertiaryContainer, fontSize: 10, fontWeight: 'bold' }}>Em Breve</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const theme = useTheme();
  const { navigation } = props;
  const { user, signOut } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const styles = {
    container: { flex: 1, backgroundColor: theme.colors.surface },
    card: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.outlineVariant,
    },
    textPrimary: { color: theme.colors.onSurfaceVariant },
    textSecondary: { color: theme.colors.onSurfaceDisabled || theme.colors.outline },
    iconColor: theme.colors.onSurfaceVariant
  };

  return (
    <View style={styles.container}>

      <View style={{
        marginHorizontal: 16,
        marginBottom: 16,
        marginTop: Math.max(insets.top, 20) + 10,
        padding: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: styles.card.backgroundColor,
        borderColor: styles.card.borderColor
      }}>
        {user?.avatar ? (
          <Avatar.Image size={40} source={{ uri: user.avatar }} style={{ backgroundColor: theme.colors.primary }} />
        ) : (
          <Avatar.Text size={40} label={user?.name?.charAt(0) || "U"} style={{ backgroundColor: theme.colors.primary }} />
        )}

        <TouchableOpacity style={{ marginLeft: 12, flex: 1 }} onPress={() => navigation.navigate("Profile")}>
          <Text style={{ color: theme.colors.onSurface, fontWeight: 'bold', fontSize: 14 }}>{user?.name || "Visitante"}</Text>
          <Text style={{ color: styles.textSecondary.color, fontSize: 12 }}>@{user?.username || "usuario"}</Text>
        </TouchableOpacity>
      </View>

      <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

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
        <CustomDrawerItem label="Pessoas" icon="account-group-outline" onPress={() => navigation.navigate("PeopleList")} />

        <DrawerSectionTitle title="Social" />
        <CustomDrawerItem label="Comunidade" icon="account-voice" isComingSoon />

        <DrawerSectionTitle title="Eventos" />
        <CustomDrawerItem label="Prêmios" icon="medal-outline" isComingSoon />

        <DrawerSectionTitle title="Pessoal" />
        <CustomDrawerItem label="Perfil" icon="account-outline" onPress={() => navigation.navigate("Profile")} />
        <CustomDrawerItem label="Configurações" icon="cog-outline" onPress={() => navigation.navigate("Settings")} />
        <View style={{ marginTop: 20, paddingHorizontal: 16, paddingBottom: 20 + insets.bottom }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              borderWidth: 1,
              borderRadius: 8,
              backgroundColor: styles.card.backgroundColor,
              borderColor: styles.card.borderColor
            }}
            onPress={signOut}
          >
            <Icon name="logout" size={20} color={theme.colors.error} />
            <Text style={{ color: theme.colors.error, marginLeft: 12, fontWeight: '500' }}>Sair</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: theme.colors.surface, width: '80%' },
        drawerType: 'front'
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />

      <Drawer.Screen
        name="MoviesCatalog"
        component={MoviesScreen}
      />

      <Drawer.Screen
        name="PeopleList"
        component={PeopleScreen}
        options={{ headerShown: false }}
      />
    </Drawer.Navigator>
  );
}