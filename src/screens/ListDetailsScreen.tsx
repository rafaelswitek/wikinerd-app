import React, { useEffect, useState, useCallback, useContext } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { Text, useTheme, Avatar, IconButton, Divider, Menu, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ListService } from "../services/listService";
import { api } from "../services/api";
import { ListDetails } from "../types/List";
import MediaCard from "../components/MediaCard";
import AddListItemModal from "../components/AddListItemModal";
import { AuthContext } from "../context/AuthContext";

export default function ListDetailsScreen({ route, navigation }: any) {
  const { id } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const { user } = useContext(AuthContext);

  const [list, setList] = useState<ListDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Filtros e Ordenação
  const [mediaFilter, setMediaFilter] = useState("all");
  const [sortBy, setSortBy] = useState("user_order"); // Padrão: Personalizado
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  // Menus
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    loadList();
  }, [id, sortBy, order]);

  const loadList = useCallback(async () => {
    try {
      // Chama a API com os parâmetros de ordenação atualizados
      const data = await ListService.getListDetails(id, order, sortBy);
      setList(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível carregar a lista.");
    } finally {
      setLoading(false);
    }
  }, [id, sortBy, order]);

  const handleToggleFavorite = async () => {
    if (favLoading || !list) return;
    setFavLoading(true);

    const oldIsFavorite = list.is_favorite;
    const oldCount = list.stats.favorites_count;

    // Atualização otimista
    setList(prev => prev ? ({
      ...prev,
      is_favorite: !prev.is_favorite,
      stats: {
        ...prev.stats,
        favorites_count: !prev.is_favorite ? prev.stats.favorites_count + 1 : prev.stats.favorites_count - 1
      }
    }) : null);

    try {
      await api.post(`/lists/${id}/favorite`);
    } catch (error) {
      console.error("Erro ao favoritar", error);
      // Reverter em caso de erro
      setList(prev => prev ? ({
        ...prev,
        is_favorite: oldIsFavorite,
        stats: { ...prev.stats, favorites_count: oldCount }
      }) : null);
      Alert.alert("Erro", "Não foi possível realizar a ação.");
    } finally {
      setFavLoading(false);
    }
  };

  const handleSortChange = (value: string) => {
    if (value === sortBy) {
      // Inverte a direção se clicar na mesma opção
      setOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Nova opção, define padrão asc
      setSortBy(value);
      setOrder("asc");
    }
    setShowSortMenu(false);
  };

  // Labels para o botão de ordenação
  const getSortLabel = () => {
    const labels: Record<string, string> = {
      user_order: "Personalizado",
      title: "Título",
      release_date: "Lançamento"
    };
    const label = labels[sortBy] || "Ordenar";
    const arrow = order === 'asc' ? '↑' : '↓';
    return `${label} (${arrow})`;
  };

  const getSortIcon = (itemValue: string) => {
    return sortBy === itemValue
      ? (order === 'asc' ? 'arrow-up' : 'arrow-down')
      : undefined;
  };

  const handleAddItems = async (items: any[]) => {
    try {
      await ListService.addItemsToList(id, { items });
      loadList();
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar itens.");
    }
  };

  const handleRemoveItem = (itemId: string, mediaTitle: string) => {
    Alert.alert("Remover Item", `Deseja remover "${mediaTitle}" da lista?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover", style: "destructive", onPress: async () => {
          try {
            await ListService.removeItemFromList(id, itemId);
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

  const handleDeleteList = () => {
    Alert.alert(
      "Excluir Lista",
      "Tem certeza que deseja apagar esta lista permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (deleteLoading) return;
            setDeleteLoading(true);
            try {
              await ListService.deleteList(id);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir a lista.");
              setDeleteLoading(false);
            }
          }
        }
      ]
    );
  };

  // Verifica se é dono para exibir ações de edição
  const isOwner = user && list && user.id === list.user.id;

  const filteredItems = list?.items.filter(item => {
    if (mediaFilter === "all") return true;
    return item.media_type.toLowerCase().includes(mediaFilter === 'movie' ? 'movie' : 'tv');
  }) || [];

  const getMediaTypeLabel = () => {
    switch (mediaFilter) {
      case 'movie': return 'Filmes';
      case 'tv_show': return 'Séries';
      default: return 'Todos os tipos';
    }
  };

  if (loading && !list) {
    return <View style={[styles.center, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" /></View>;
  }

  if (!list) return null;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>{list.title}</Text>
          <View style={styles.userRow}>
            {list.user.avatar ? <Avatar.Image size={24} source={{ uri: list.user.avatar }} /> : <Avatar.Text size={24} label={list.user.name[0]} />}
            <Text style={{ marginLeft: 8, color: theme.colors.secondary, fontSize: 13 }}>{list.user.name}</Text>
          </View>
        </View>

        {/* Botão de Favoritar (Só aparece se NÃO for o dono) */}
        {!isOwner && (
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.favButton}>
            <Icon
              name={list.is_favorite ? "heart" : "heart-outline"}
              size={28}
              color={list.is_favorite ? theme.colors.error : theme.colors.onSurfaceVariant}
            />
            <Text style={{ fontSize: 10, color: theme.colors.secondary, marginTop: 2 }}>{list.stats.favorites_count}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={{ color: theme.colors.outline, fontSize: 12, marginTop: 12 }}>
        Atualizada em {new Date(list.updated_at).toLocaleDateString()}
      </Text>

      {list.description && <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>{list.description}</Text>}

      {/* Estatísticas */}
      <View style={[styles.statsBox, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{list.stats.items_count}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Itens</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{list.stats.views_count}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Views</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{list.stats.favorites_count}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Likes</Text>
        </View>
      </View>

      {/* Ações do Dono (Adicionar / Excluir) */}
      {isOwner && (
        <View style={styles.ownerActions}>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => setAddModalVisible(true)}
            style={{ flex: 1, marginRight: 8 }}
          >
            Adicionar Item
          </Button>
          <Button
            mode="outlined"
            icon="trash-can-outline"
            onPress={handleDeleteList}
            textColor={theme.colors.error}
            style={{ borderColor: theme.colors.error }}
            loading={deleteLoading}
          >
            Excluir
          </Button>
        </View>
      )}

      {/* Seção de Filtros (Selects) */}
      <View style={styles.filtersContainer}>

        {/* Dropdown Tipo de Mídia */}
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.inputLabel}>Tipo de Mídia</Text>
          <Menu
            visible={showTypeMenu}
            onDismiss={() => setShowTypeMenu(false)}
            anchor={
              <TouchableOpacity
                style={[styles.dropdownBox, { borderColor: theme.colors.outline }]}
                onPress={() => setShowTypeMenu(true)}
              >
                <Text style={{ color: theme.colors.onSurface, fontSize: 13 }} numberOfLines={1}>{getMediaTypeLabel()}</Text>
                <Icon name="chevron-down" size={18} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            }
          >
            <Menu.Item onPress={() => { setMediaFilter("all"); setShowTypeMenu(false); }} title="Todos os tipos" />
            <Menu.Item onPress={() => { setMediaFilter("movie"); setShowTypeMenu(false); }} title="Filmes" />
            <Menu.Item onPress={() => { setMediaFilter("tv_show"); setShowTypeMenu(false); }} title="Séries" />
          </Menu>
        </View>

        {/* Dropdown Ordenar Por (Com Toggle Asc/Desc) */}
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Ordenar por</Text>
          <Menu
            visible={showSortMenu}
            onDismiss={() => setShowSortMenu(false)}
            anchor={
              <TouchableOpacity
                style={[styles.dropdownBox, { borderColor: theme.colors.outline }]}
                onPress={() => setShowSortMenu(true)}
              >
                <Text style={{ color: theme.colors.onSurface, fontSize: 13 }} numberOfLines={1}>{getSortLabel()}</Text>
                <Icon name="chevron-down" size={18} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => handleSortChange("user_order")}
              title="Personalizado"
              leadingIcon={getSortIcon("user_order")}
            />
            <Menu.Item
              onPress={() => handleSortChange("title")}
              title="Título"
              leadingIcon={getSortIcon("title")}
            />
            <Menu.Item
              onPress={() => handleSortChange("release_date")}
              title="Lançamento"
              leadingIcon={getSortIcon("release_date")}
            />
          </Menu>
        </View>

      </View>
      <Divider style={{ marginTop: 16 }} />
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
            {isOwner && (
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: theme.colors.errorContainer }]}
                onPress={() => handleRemoveItem(item.item_id, item.media.title)}
              >
                <Icon name="close" size={14} color={theme.colors.onErrorContainer} />
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {isOwner && (
        <AddListItemModal
          visible={addModalVisible}
          onDismiss={() => setAddModalVisible(false)}
          onAdd={handleAddItems}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },

  favButton: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },

  statsBox: { flexDirection: 'row', borderRadius: 12, padding: 16, marginTop: 20, justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontWeight: 'bold', fontSize: 18 },
  statLabel: { fontSize: 11, marginTop: 2 },

  ownerActions: { flexDirection: 'row', marginTop: 20 },

  filtersContainer: { flexDirection: 'row', marginTop: 20 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4, opacity: 0.8, marginLeft: 2 },
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: 'transparent'
  },

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