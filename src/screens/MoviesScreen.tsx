import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Searchbar, Text, Button, useTheme, Menu } from "react-native-paper";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from "../services/api";
import MediaCard from "../components/MediaCard";
import FilterModal from "../components/FilterModal";
import { Movie } from "../types/Movie";
import { sortOptions } from "../data/filterOptions";

interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
}

export default function MoviesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  
  // Estados de Dados
  const [movies, setMovies] = useState<Movie[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Estados de Filtro e Busca
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [filters, setFilters] = useState<any>({});
  const [orderBy, setOrderBy] = useState("rating");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // Estados de UI
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Carregar filmes
  useEffect(() => {
    fetchMovies(page === 1 ? 1 : page);
  }, [debouncedTerm, filters, orderBy, direction, page]); // Adicionei page aqui

  // Resetar página ao mudar filtros (exceto a própria página)
  useEffect(() => {
    setPage(1);
  }, [debouncedTerm, filters, orderBy, direction]);

  const fetchMovies = async (pageNumber: number) => {
    if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: any = {
        page: pageNumber,
        per_page: 21,
        search: debouncedTerm || undefined,
        year: filters.year,
        order_by: orderBy,
        direction: direction,
      };

      if (filters.genres?.length) params['genres[]'] = filters.genres;
      if (filters.streamings?.length) params['providers[]'] = filters.streamings;
      if (filters.classification?.length) params['certification[]'] = filters.classification;

      const response = await api.get("/movies", { params });
      
      if (pageNumber === 1) {
        setMovies(response.data.data);
      } else {
        setMovies((prev) => [...prev, ...response.data.data]);
      }
      
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total
      });

    } catch (error) {
      console.error("Erro ao buscar filmes:", error);
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
        setDirection(direction === "asc" ? "desc" : "asc");
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* Header Customizado */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerTop}>
             <Button icon="menu" textColor={theme.colors.onSurface} onPress={() => navigation.dispatch(DrawerActions.openDrawer())} compact>
                Menu
             </Button>
             <View style={styles.headerTitleContainer}>
                <Icon name="filmstrip" size={24} color={theme.colors.primary} style={{ marginRight: 8 }} />
                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Filmes</Text>
             </View>
             {pagination && (
                <View style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 10, fontWeight: 'bold' }}>
                        {pagination.total > 1000 ? (pagination.total / 1000).toFixed(0) + 'k' : pagination.total}
                    </Text>
                </View>
             )}
        </View>

        <Searchbar
          placeholder="Buscar filmes..."
          onChangeText={setSearchTerm}
          value={searchTerm}
          style={styles.searchBar}
          inputStyle={{ minHeight: 0 }}
        />
        
        <View style={styles.controlsRow}>
          <Button 
            icon="filter-variant" 
            mode="outlined" 
            onPress={() => setFilterModalVisible(true)}
            style={styles.controlButton}
            textColor={theme.colors.onSurface}
          >
            Filtros {(Object.keys(filters).length > 0 && Object.values(filters).some((v: any) => v.length > 0)) ? '•' : ''}
          </Button>

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

      {/* Lista de Filmes */}
      {loading ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
                {/* Ajuste na largura do MediaCard via props ou style direto se necessário */}
                <MediaCard media={item} />
            </View>
          )}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 20 }} /> : null}
          ListEmptyComponent={
            <View style={styles.center}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Nenhum filme encontrado.</Text>
            </View>
          }
        />
      )}

      <FilterModal 
        visible={filterModalVisible}
        onDismiss={() => setFilterModalVisible(false)}
        onApply={(newFilters) => {
            setFilters(newFilters);
        }}
        currentFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 12, elevation: 4, zIndex: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  searchBar: { marginBottom: 12, height: 48, backgroundColor: 'rgba(255,255,255,0.1)' },
  controlsRow: { flexDirection: 'row', gap: 10 },
  controlButton: { flex: 1, borderRadius: 4, borderColor: 'rgba(255,255,255,0.2)' },
  listContent: { padding: 8 },
  columnWrapper: { justifyContent: 'flex-start' }, // Removi gap fixo para controlar melhor com cardWrapper
  cardWrapper: { width: '33.33%', padding: 4 }, // Distribuição em 3 colunas
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
});