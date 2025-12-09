// src/screens/PeopleScreen.tsx

import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Searchbar, Text, Button, useTheme, Menu, IconButton, Divider } from "react-native-paper";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from "../services/api";
import { Person } from "../types/Person";

// Opções de ordenação conforme a imagem
const sortOptions = [
  { label: "Padrão", value: undefined },
  { label: "Nome", value: "name" },
  { label: "Nascimento", value: "birthday" },
  { label: "Falecimento", value: "deathday" },
];

export default function PeopleScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Estados de Paginação e Busca
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  // Estados de Ordenação
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [menuVisible, setMenuVisible] = useState(false);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Efeito para recarregar quando mudar filtros ou página
  useEffect(() => {
    fetchPeople(page === 1 ? 1 : page);
  }, [page, debouncedTerm, orderBy, direction]);

  // Resetar página ao mudar ordenação
  useEffect(() => {
    setPage(1);
  }, [orderBy, direction]);

  const fetchPeople = async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: any = {
        page: pageNum,
        search: debouncedTerm || undefined,
        order_by: orderBy,
        direction: direction,
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

  // Helpers de Ordenação
  const toggleDirection = () => {
    setDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSortSelect = (value: string | undefined) => {
    setOrderBy(value);
    setMenuVisible(false);
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(o => o.value === orderBy);
    return option ? option.label : "Padrão";
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

        {/* BARRA DE ORDENAÇÃO */}
        <View style={styles.sortContainer}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button 
                  mode="outlined" 
                  onPress={() => setMenuVisible(true)} 
                  contentStyle={{ justifyContent: 'space-between' }}
                  style={{ borderColor: theme.colors.outline }}
                  textColor={theme.colors.onSurface}
                  icon="sort"
                >
                  Ordenado por: {getCurrentSortLabel()}
                </Button>
              }
            >
              {sortOptions.map((opt) => (
                <Menu.Item 
                  key={opt.label} 
                  onPress={() => handleSortSelect(opt.value)} 
                  title={opt.label}
                  leadingIcon={orderBy === opt.value ? "check" : undefined}
                />
              ))}
            </Menu>
          </View>

          <IconButton
            icon={direction === 'asc' ? "sort-ascending" : "sort-descending"}
            mode="outlined"
            iconColor={theme.colors.onSurface}
            onPress={toggleDirection}
            style={{ borderColor: theme.colors.outline, margin: 0 }}
          />
        </View>

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
  searchBar: { height: 48, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  sortContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listContent: { padding: 8 },
  cardContainer: { flex: 1, margin: 4, borderRadius: 8, overflow: 'hidden', elevation: 2, maxWidth: '33.33%' },
  cardImage: { width: '100%', height: 160, backgroundColor: '#ccc' },
  cardContent: { padding: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
});