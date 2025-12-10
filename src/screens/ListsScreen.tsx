// src/screens/ListsScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { Text, Searchbar, Button, useTheme, Surface, IconButton } from "react-native-paper";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { ListService } from "../services/listService";
import { ListSummary } from "../types/List";
import ListCard from "../components/ListCard";

type FilterType = 'mine' | 'favorite' | 'community' | 'official';

export default function ListsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<FilterType>("mine");
  const [searchQuery, setSearchQuery] = useState("");
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dashboard Stats (Calculado no front com base nos dados carregados para "Minhas Listas")
  const [stats, setStats] = useState({ items: 0, count: 0, views: 0, likes: 0 });

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ListService.getLists(activeTab, 1, searchQuery);
      setLists(response.data);

      if (activeTab === 'mine') {
        const totalItems = response.data.reduce((acc, curr) => acc + curr.stats.items_count, 0);
        const totalViews = response.data.reduce((acc, curr) => acc + curr.stats.views_count, 0);
        const totalLikes = response.data.reduce((acc, curr) => acc + curr.stats.favorites_count, 0);
        
        setStats({
            count: response.meta.total,
            items: totalItems,
            views: totalViews,
            likes: totalLikes
        });
      }
    } catch (error) {
      console.error("Erro ao buscar listas", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

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
            {label} ({activeTab === key ? lists.length : 0})
        </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {renderTab('mine', 'Minhas Listas')}
                {renderTab('favorite', 'Favoritas')}
                {renderTab('community', 'Comunidade')}
                {renderTab('official', 'Oficiais')}
            </ScrollView>
        </View>

        {/* Dashboard Stats (Only for "Minhas Listas") */}
        {activeTab === 'mine' && !loading && (
            <View style={styles.statsContainer}>
                <View style={styles.statsRow}>
                    {renderStatCard("Total de Itens", stats.items, "Em todas as listas")}
                    {renderStatCard("Listas Criadas", stats.count, "Listas pessoais")}
                </View>
                <View style={[styles.statsRow, { marginTop: 12 }]}>
                    {renderStatCard("Visualizações", stats.views, "Total de views")}
                    {renderStatCard("Curtidas", stats.likes, "Total de favoritos")}
                </View>
            </View>
        )}

        {/* Create New List Placeholder Card */}
        {activeTab === 'mine' && (
             <TouchableOpacity style={[styles.createCard, { borderColor: theme.colors.outlineVariant }]} onPress={() => console.log("Criar")}>
                <Icon name="plus" size={32} color={theme.colors.secondary} />
                <Text style={{ marginTop: 8, fontWeight: 'bold', color: theme.colors.onSurface }}>Criar Nova Lista</Text>
                <Text style={{ textAlign: 'center', fontSize: 11, color: theme.colors.secondary, marginTop: 4, paddingHorizontal: 20 }}>
                    Organize seus conteúdos favoritos em uma nova lista personalizada
                </Text>
             </TouchableOpacity>
        )}

        {/* Lists Grid */}
        <View style={styles.listContainer}>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
            ) : (
                lists.map((list, index) => (
                    <ListCard 
                        key={list.id} 
                        list={list} 
                        index={index}
                        onPress={() => console.log(`Abrir lista ${list.id}`)} 
                    />
                ))
            )}
            {!loading && lists.length === 0 && activeTab !== 'mine' && (
                <Text style={{ textAlign: 'center', marginTop: 40, color: theme.colors.secondary }}>
                    Nenhuma lista encontrada.
                </Text>
            )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { elevation: 4, zIndex: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
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
  listContainer: { paddingHorizontal: 16 }
});