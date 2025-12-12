import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Searchbar, Text, Button, useTheme, Menu, Divider } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { api } from "../services/api";
import MediaCard from "./MediaCard";
import FilterModal from "./FilterModal";
import { Movie } from "../types/Movie";
import { sortOptions } from "../data/filterOptions";

interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
}

export default function UserWatchlist() {
  const theme = useTheme();
  const navigation = useNavigation();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [filters, setFilters] = useState<any>({});

  const [orderBy, setOrderBy] = useState("release_date");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchUserMovies(page === 1 ? 1 : page);
  }, [debouncedTerm, filters, orderBy, direction, page]);

  // Reseta página ao mudar filtros
  useEffect(() => {
    setPage(1);
  }, [debouncedTerm, filters, orderBy, direction]);

  const fetchUserMovies = async (pageNumber: number) => {
    if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: any = {
        page: pageNumber,
        per_page: 21,
        status: 'want_to_watch',
        search: debouncedTerm || undefined,
        order_by: orderBy,
        direction: direction,
      };

      if (filters.genres?.length) params['genres[]'] = filters.genres;
      if (filters.streamings?.length) params['providers[]'] = filters.streamings;
      if (filters.classification?.length) params['certification[]'] = filters.classification;
      if (filters.countries?.length) params['countries[]'] = filters.countries;

      if (filters.yearData) {
        const { mode, specific, decade, rangeStart, rangeEnd } = filters.yearData;
        if (mode === 'specific' && specific) params['year'] = specific;
        else if (mode === 'decade' && decade) params['year'] = decade.endsWith('s') ? decade : `${decade}s`;
        else if (mode === 'range' && rangeStart && rangeEnd) params['year'] = `${rangeStart}-${rangeEnd}`;
      }

      const response = await api.get("/users/movie", { params });

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
      console.error("Erro ao buscar watchlist:", error);
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
    const label = opt ? opt.label : 'Ordenar';
    return `${label} (${direction === 'asc' ? '↑' : '↓'})`;
  };

  const hasActiveFilters = () => {
    const hasArrays = ['genres', 'streamings', 'classification', 'countries'].some(
      key => filters[key] && filters[key].length > 0
    );
    const hasYear = filters.yearData && (filters.yearData.specific || filters.yearData.decade || (filters.yearData.rangeStart && filters.yearData.rangeEnd));
    return hasArrays || hasYear;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Searchbar
          placeholder="Buscar na minha lista..."
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
            Filtros {hasActiveFilters() ? '•' : ''}
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

        {pagination && (
          <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 8, marginLeft: 4 }}>
            {pagination.total} filmes encontrados
          </Text>
        )}
      </View>

      {loading && page === 1 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <MediaCard
                media={item}
                style={{ width: '100%', marginRight: 0 }}
              />
            </View>
          )}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 20 }} /> : <View style={{ height: 20 }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Icon name="bookmark-outline" size={48} color={theme.colors.outline} />
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
                Nenhum filme na sua lista "Quero Ver".
              </Text>
            </View>
          }
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onDismiss={() => setFilterModalVisible(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        currentFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, elevation: 4, zIndex: 1 },
  searchBar: { marginBottom: 12, height: 48, backgroundColor: 'rgba(255,255,255,0.1)' },
  controlsRow: { flexDirection: 'row', gap: 10 },
  controlButton: { flex: 1, borderRadius: 4, borderColor: 'rgba(255,255,255,0.2)' },
  listContent: { padding: 8 },
  columnWrapper: { justifyContent: 'flex-start' },
  cardWrapper: { width: '33.33%', padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
});