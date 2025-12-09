// src/screens/PeopleScreen.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Searchbar, Text, Button, useTheme, Card, Badge } from "react-native-paper";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from "../services/api";
import { Person } from "../types/Person";

export default function PeopleScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchPeople(page);
  }, [page, debouncedTerm]);

  const fetchPeople = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: any = {
        page: pageNum,
        search: debouncedTerm || undefined,
      };

      const response = await api.get("/people", { params });
      const newData = response.data.data;

      if (pageNum === 1) {
        setPeople(newData);
      } else {
        setPeople(prev => [...prev, ...newData]);
      }

      setHasMore(response.data.current_page < response.data.last_page);

    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const renderPersonCard = ({ item }: { item: Person }) => {
    const imageUrl = item.profile_path?.tmdb 
      ? `https://image.tmdb.org/t/p/w185${item.profile_path.tmdb}` 
      : "https://via.placeholder.com/150x225?text=No+Image";

    return (
      <TouchableOpacity 
        style={[styles.cardContainer, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigation.navigate("PersonDetails", { slug: item.slug })}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.cardImage} 
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text variant="titleSmall" numberOfLines={1} style={{ fontWeight: 'bold' }}>{item.name}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{item.known_for_department}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <Button icon="menu" textColor={theme.colors.onSurface} onPress={() => navigation.dispatch(DrawerActions.openDrawer())} compact>
            Menu
          </Button>
          <View style={styles.headerTitleContainer}>
            <Icon name="account-group" size={24} color={theme.colors.primary} style={{ marginRight: 8 }} />
            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Pessoas</Text>
          </View>
          <View style={{ width: 60 }} /> 
        </View>

        <Searchbar
          placeholder="Buscar pessoas..."
          onChangeText={setSearchTerm}
          value={searchTerm}
          style={styles.searchBar}
          inputStyle={{ minHeight: 0 }}
        />
      </View>

      {loading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.id}
          renderItem={renderPersonCard}
          numColumns={3}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 20 }} /> : null}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Nenhuma pessoa encontrada.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, elevation: 4, zIndex: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  searchBar: { height: 48, backgroundColor: 'rgba(255,255,255,0.1)' },
  listContent: { padding: 8 },
  cardContainer: { flex: 1, margin: 4, borderRadius: 8, overflow: 'hidden', elevation: 2, maxWidth: '33.33%' },
  cardImage: { width: '100%', height: 160, backgroundColor: '#ccc' },
  cardContent: { padding: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
});