import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { Text, useTheme, Avatar, IconButton, Divider, Menu, Button, SegmentedButtons } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ListService } from "../services/listService";
import { ListDetails } from "../types/List";
import MediaCard from "../components/MediaCard";
import AddListItemModal from "../components/AddListItemModal";

export default function ListDetailsScreen({ route, navigation }: any) {
  const { id } = route.params;
  const theme = useTheme();
  
  const [list, setList] = useState<ListDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  
  // Filtros
  const [mediaFilter, setMediaFilter] = useState("all"); // all, movie, tv_show
  const [sortBy, setSortBy] = useState("title");
  const [order, setOrder] = useState("asc");

  useEffect(() => {
    loadList();
  }, [id, sortBy, order]);

  const loadList = useCallback(async () => {
    try {
      // API suporta ordenação
      const data = await ListService.getListDetails(id, sortBy, order);
      setList(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível carregar a lista.");
    } finally {
      setLoading(false);
    }
  }, [id, sortBy, order]);

  const handleAddItems = async (items: any[]) => {
    try {
      await ListService.addItemsToList(id, { items });
      loadList(); // Recarrega para mostrar novos itens
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar itens.");
    }
  };

  const handleRemoveItem = (itemId: string, mediaTitle: string) => {
    Alert.alert("Remover Item", `Deseja remover "${mediaTitle}" da lista?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: async () => {
          try {
            await ListService.removeItemFromList(id, itemId);
            // Atualiza localmente para ser mais rápido
            setList(prev => prev ? ({
              ...prev,
              items: prev.items.filter(i => i.item_id !== itemId)
            }) : null);
          } catch (error) {
            Alert.alert("Erro", "Não foi possível remover o item.");
          }
        } 
      }
    ]);
  };

  // Filtragem local por tipo de mídia (já que a API retorna tudo)
  const filteredItems = list?.items.filter(item => {
    if (mediaFilter === "all") return true;
    // O tipo na API vem como "App\Models\Movie" ou "App\Models\TvShow\TvShow", então verificamos string
    return item.media_type.toLowerCase().includes(mediaFilter === 'movie' ? 'movie' : 'tv');
  }) || [];

  if (loading && !list) {
    return <View style={[styles.center, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" /></View>;
  }

  if (!list) return null;

  const renderHeader = () => (
    <View style={styles.header}>
      <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>{list.title}</Text>
      
      <View style={styles.metaContainer}>
        <View style={styles.userRow}>
          {list.user.avatar ? <Avatar.Image size={20} source={{ uri: list.user.avatar }} /> : <Avatar.Text size={20} label={list.user.name[0]} />}
          <Text style={{ marginLeft: 8, color: theme.colors.secondary, fontSize: 12 }}>{list.user.name}</Text>
        </View>
        <Text style={{ color: theme.colors.outline, fontSize: 12 }}>Atualizada em {new Date(list.updated_at).toLocaleDateString()}</Text>
      </View>

      {list.description && <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>{list.description}</Text>}

      {/* Estatísticas */}
      <View style={[styles.statsBox, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{list.stats.items_count}</Text>
          <Text style={styles.statLabel}>Itens</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{list.stats.views_count}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{list.stats.favorites_count}</Text>
          <Text style={styles.statLabel}>Likes</Text>
        </View>
      </View>

      {/* Filtros e Ações */}
      <View style={styles.controls}>
        <Button 
          mode="contained" 
          icon="plus" 
          onPress={() => setAddModalVisible(true)}
          style={{ flex: 1, marginRight: 8 }}
        >
          Adicionar Item
        </Button>
        <Button icon="share-variant" mode="outlined" onPress={() => {}}>Compartilhar</Button>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={{ marginBottom: 8, fontWeight: 'bold' }}>Filtros</Text>
        <SegmentedButtons
          value={mediaFilter}
          onValueChange={setMediaFilter}
          buttons={[
            { value: 'all', label: 'Todos' },
            { value: 'movie', label: 'Filmes' },
            { value: 'tv_show', label: 'Séries' },
          ]}
          density="small"
        />
        
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
           <Button 
             mode={sortBy === 'title' ? 'contained-tonal' : 'outlined'} 
             onPress={() => setSortBy('title')} 
             compact
             labelStyle={{ fontSize: 12 }}
           >
             Título
           </Button>
           <Button 
             mode={sortBy === 'release_date' ? 'contained-tonal' : 'outlined'} 
             onPress={() => setSortBy('release_date')} 
             compact
             labelStyle={{ fontSize: 12 }}
           >
             Lançamento
           </Button>
           <IconButton 
             icon={order === 'asc' ? "sort-ascending" : "sort-descending"} 
             size={20} 
             onPress={() => setOrder(prev => prev === 'asc' ? 'desc' : 'asc')} 
             mode="contained"
           />
        </View>
      </View>
      <Divider style={{ marginVertical: 16 }} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.item_id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 40 }}
        columnWrapperStyle={{ paddingHorizontal: 8 }}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={{ flex: 1, padding: 4, position: 'relative' }}>
             <MediaCard media={item.media as any} style={{ width: '100%' }} />
             <TouchableOpacity 
                style={[styles.removeBtn, { backgroundColor: theme.colors.errorContainer }]}
                onPress={() => handleRemoveItem(item.item_id, item.media.title)}
             >
                <Icon name="close" size={14} color={theme.colors.onErrorContainer} />
             </TouchableOpacity>
          </View>
        )}
      />

      <AddListItemModal 
        visible={addModalVisible}
        onDismiss={() => setAddModalVisible(false)}
        onAdd={handleAddItems}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16 },
  metaContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  
  statsBox: { flexDirection: 'row', borderRadius: 8, padding: 12, marginTop: 16, justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontWeight: 'bold', fontSize: 16 },
  statLabel: { fontSize: 10, opacity: 0.7 },

  controls: { flexDirection: 'row', marginTop: 16 },
  
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 3
  }
});