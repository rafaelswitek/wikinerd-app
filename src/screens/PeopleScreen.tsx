import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Searchbar, Text, Button, useTheme, Menu } from "react-native-paper";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from "../services/api";
import { Person } from "../types/Person";

const sortOptions = [
  { label: "Nome", id: "name" },
  { label: "Nascimento", id: "birthday" },
  { label: "Falecimento", id: "deathday" },
];

interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
}

export default function PeopleScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [people, setPeople] = useState<Person[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  // Estados de Ordenação
  const [orderBy, setOrderBy] = useState("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchPeople(page === 1 ? 1 : page);
  }, [debouncedTerm, orderBy, direction, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedTerm, orderBy, direction]);

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

      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total
      });

    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && pagination && page < pagination.last_page) {
      setPage(prev => prev + 1);
    }
  };

  const handleSortChange = (value: string) => {
    if (value === orderBy) {
      setDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(value);
      setDirection("desc");
    }
    setSortMenuVisible(false);
  };

  const getSortLabel = () => {
    const opt = sortOptions.find(o => o.id === orderBy);
    return opt ? `${opt.label} (${direction === 'asc' ? '↑' : '↓'})` : 'Ordenar';
  };

  const renderPersonCard = ({ item }: { item: Person }) => {
    const imageUrl = item.profile_path?.tmdb
      ? `https://image.tmdb.org/t/p/w185${item.profile_path.tmdb}`
      : "https://via.placeholder.com/150x225?text=No+Image";

    return (
      <TouchableOpacity
        style={[styles.cardContainer, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigation.navigate("PersonDetails", { title: item.name, slug: item.slug })}
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

      <View style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
        }
      ]}>
        <Searchbar
          placeholder="Buscar pessoas..."
          onChangeText={setSearchTerm}
          value={searchTerm}
          style={styles.searchBar}
          inputStyle={{ minHeight: 0 }}
        />

        <View style={styles.controlsRow}>
          <View style={{ flex: 1 }}>
            <Menu
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={
                <Button
                  icon="sort"
                  mode="outlined"
                  onPress={() => setSortMenuVisible(true)}
                  style={styles.controlButton}
                  textColor={theme.colors.onSurface}
                >
                  {getSortLabel()}
                </Button>
              }
            >
              {sortOptions.map(opt => (
                <Menu.Item
                  key={opt.id}
                  onPress={() => handleSortChange(opt.id)}
                  title={opt.label}
                  leadingIcon={orderBy === opt.id ? (direction === 'asc' ? 'arrow-up' : 'arrow-down') : undefined}
                />
              ))}
            </Menu>
          </View>
        </View>

      </View>

      <View style={styles.headerTop}>,
        {pagination && (
          <View style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 10, fontWeight: 'bold' }}>
              {pagination.total.toLocaleString('pt-BR')} pessoas
            </Text>
          </View>
        )}
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
          onEndReached={loadMore}
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
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 12 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  searchBar: { height: 48, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },

  controlsRow: { flexDirection: 'row' },
  controlButton: { width: '100%', borderRadius: 4, borderColor: 'rgba(255,255,255,0.2)' },

  listContent: { padding: 8 },
  cardContainer: { flex: 1, margin: 4, borderRadius: 8, overflow: 'hidden', elevation: 2, maxWidth: '33.33%' },
  cardImage: { width: '100%', height: 160, backgroundColor: '#ccc' },
  cardContent: { padding: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
});