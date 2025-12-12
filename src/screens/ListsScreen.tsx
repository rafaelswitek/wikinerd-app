// src/screens/ListsScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text, Searchbar, useTheme, Surface } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { ListService } from "../services/listService";
import { ListSummary } from "../types/List";
import ListCard from "../components/ListCard";
import CreateListModal from "../components/CreateListModal";

type FilterType = 'mine' | 'favorite' | 'community' | 'official';

export default function ListsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<FilterType>("mine");
  const [searchQuery, setSearchQuery] = useState("");

  // Estados da Lista e Paginação
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Totais das abas
  const [counts, setCounts] = useState<Record<FilterType, number>>({
    mine: 0,
    favorite: 0,
    community: 0,
    official: 0
  });

  // Stats do Dashboard
  const [stats, setStats] = useState({ items: 0, count: 0, views: 0, likes: 0 });

  const handleCreateSuccess = (listId: string) => {
    // Atualiza a lista atual para mostrar a nova lista se estiver na aba 'mine'
    if (activeTab === 'mine') {
      fetchLists(1, true);
      fetchAllCounts();
    }
    // Navega imediatamente para a tela de detalhes da nova lista
    navigation.navigate("ListDetails", { id: listId });
  };

  // Busca os totais de todas as abas (para o cabeçalho)
  const fetchAllCounts = useCallback(async () => {
    try {
      const types: FilterType[] = ['mine', 'favorite', 'community', 'official'];
      const promises = types.map(type =>
        ListService.getLists(type, 1, searchQuery)
          .then(res => ({ type, total: res.meta.total }))
          .catch(() => ({ type, total: 0 }))
      );

      const results = await Promise.all(promises);

      setCounts(prev => {
        const newCounts = { ...prev };
        results.forEach(res => {
          newCounts[res.type] = res.total;
        });
        return newCounts;
      });
    } catch (error) {
      console.error("Erro ao atualizar contagens", error);
    }
  }, [searchQuery]);

  // Busca a lista principal (com paginação)
  const fetchLists = async (pageNumber: number, shouldRefresh = false) => {
    if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const response = await ListService.getLists(activeTab, pageNumber, searchQuery);
      const newItems = response.data;

      if (shouldRefresh || pageNumber === 1) {
        setLists(newItems);
      } else {
        setLists(prev => [...prev, ...newItems]);
      }

      // Atualiza paginação
      const isLastPage = response.meta.current_page >= response.meta.last_page;
      setHasMore(!isLastPage);

      // Atualiza contador da aba ativa
      setCounts(prev => ({ ...prev, [activeTab]: response.meta.total }));

      // Se for a primeira página de 'mine', atualiza o dashboard
      if (activeTab === 'mine' && pageNumber === 1) {
        const totalItems = newItems.reduce((acc, curr) => acc + curr.stats.items_count, 0);
        const totalViews = newItems.reduce((acc, curr) => acc + curr.stats.views_count, 0);
        const totalLikes = newItems.reduce((acc, curr) => acc + curr.stats.favorites_count, 0);

        setStats({
          count: response.meta.total,
          items: totalItems, // Nota: Soma apenas dos itens carregados na pag 1
          views: totalViews,
          likes: totalLikes
        });
      }

    } catch (error) {
      console.error("Erro ao buscar listas", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Efeito para recarregar quando muda a aba ou busca
  useEffect(() => {
    setPage(1);
    setLists([]);
    fetchLists(1, true);
  }, [activeTab, searchQuery]);

  // Efeito inicial para contadores
  useEffect(() => {
    fetchAllCounts();
  }, [fetchAllCounts]);

  const loadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLists(nextPage);
    }
  };

  const renderStatCard = (label: string, value: number, subLabel: string) => (
    <Surface style={[styles.statCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text style={{ fontSize: 12, color: theme.colors.secondary }}>{label}</Text>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.onSurface, marginVertical: 4 }}>{value}</Text>
      <Text style={{ fontSize: 10, color: theme.colors.outline }}>{subLabel}</Text>
    </Surface>
  );

  const renderTab = (key: FilterType, label: string) => (
    <TouchableOpacity
      onPress={() => setActiveTab(key)}
      style={[
        styles.tabItem,
        activeTab === key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }
      ]}
    >
      <Text style={{
        color: activeTab === key ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
        fontWeight: activeTab === key ? 'bold' : 'normal'
      }}>
        {label} ({counts[key]})
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Search */}
      <Searchbar
        placeholder="Buscar listas..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={{ minHeight: 0 }}
      />

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['mine', 'favorite', 'community', 'official'] as FilterType[]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const labels: Record<string, string> = { mine: 'Minhas Listas', favorite: 'Favoritas', community: 'Comunidade', official: 'Oficiais' };
            return renderTab(item, labels[item]);
          }}
        />
      </View>

      {/* Dashboard Stats (Minhas Listas) */}
      {activeTab === 'mine' && !loading && page === 1 && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            {renderStatCard("Total de Itens", stats.items, "Nesta página")}
            {renderStatCard("Listas Criadas", stats.count, "Total geral")}
          </View>
          <View style={[styles.statsRow, { marginTop: 12 }]}>
            {renderStatCard("Visualizações", stats.views, "Nesta página")}
            {renderStatCard("Curtidas", stats.likes, "Nesta página")}
          </View>
        </View>
      )}

      {/* Create New List Button */}
      {activeTab === 'mine' && (
        <TouchableOpacity style={[styles.createCard, { borderColor: theme.colors.outlineVariant }]} onPress={() => setCreateModalVisible(true)}>
          <Icon name="plus" size={32} color={theme.colors.secondary} />
          <Text style={{ marginTop: 8, fontWeight: 'bold', color: theme.colors.onSurface }}>Criar Nova Lista</Text>
          <Text style={{ textAlign: 'center', fontSize: 11, color: theme.colors.secondary, marginTop: 4, paddingHorizontal: 20 }}>
            Organize seus conteúdos favoritos em uma nova lista personalizada
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const handleDeleteList = useCallback((deletedListId: string) => {
    // Remove da lista atual visualmente
    setLists(prev => prev.filter(item => item.id !== deletedListId));

    // Atualiza o contador da aba atual
    setCounts(prev => ({
      ...prev,
      [activeTab]: Math.max(0, prev[activeTab] - 1)
    }));

    // Se estiver na aba 'mine', atualiza o contador do dashboard também
    if (activeTab === 'mine') {
      setStats(prev => ({
        ...prev,
        count: Math.max(0, prev.count - 1)
      }));
    }
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {loading && page === 1 ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.listItemWrapper}>
              <ListCard
                list={item}
                index={index}
                onPress={() => navigation.navigate("ListDetails", { id: item.id })  }
                onDelete={handleDeleteList} // Passando o callback
              />
            </View>
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 80 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ padding: 20 }} /> : <View style={{ height: 20 }} />
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={{ textAlign: 'center', marginTop: 40, color: theme.colors.secondary }}>
                Nenhuma lista encontrada.
              </Text>
            ) : null
          }
        />
      )}
      <CreateListModal
        visible={createModalVisible}
        onDismiss={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { margin: 16, height: 48, backgroundColor: 'rgba(255,255,255,0.1)' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 8 },
  tabItem: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 8 },
  statsContainer: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 8 },
  createCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  listItemWrapper: { paddingHorizontal: 16 }
});