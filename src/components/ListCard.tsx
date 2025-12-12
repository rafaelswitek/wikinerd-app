import React, { useContext, useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, Share } from "react-native";
import { Text, Avatar, useTheme, Menu } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ListSummary } from "../types/List";
import { AuthContext } from "../context/AuthContext";
import { ListService } from "../services/listService";
import { api } from "../services/api";

interface Props {
  list: ListSummary;
  onPress: () => void;
  onDelete?: (id: string) => void;
  index: number;
}

const CARD_COLORS = ["#312e81", "#064e3b", "#701a75", "#7c2d12", "#1e3a8a"];

export default function ListCard({ list, onPress, onDelete, index }: Props) {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const backgroundColor = CARD_COLORS[index % CARD_COLORS.length];

  const [menuVisible, setMenuVisible] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Estado local para favoritar
  const [isFavorite, setIsFavorite] = useState(list.is_favorite);
  const [favCount, setFavCount] = useState(list.stats.favorites_count);
  const [favLoading, setFavLoading] = useState(false);

  // Atualiza estado local se a prop mudar (ex: ao voltar do details)
  useEffect(() => {
    setIsFavorite(list.is_favorite);
    setFavCount(list.stats.favorites_count);
  }, [list.is_favorite, list.stats.favorites_count]);

  const isOwner = user?.id === list.user.id;

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const handleShare = async () => {
    closeMenu();
    try {
      await Share.share({
        message: `Confira a lista "${list.title}" no WikiNerd!`,
        title: list.title,
      });
    } catch (error) {
      console.log("Erro ao compartilhar", error);
    }
  };

  const handleFavorite = async () => {
    if (favLoading) return;
    setFavLoading(true);

    const prevFav = isFavorite;
    const prevCount = favCount;

    // Atualização Otimista
    setIsFavorite(!prevFav);
    setFavCount(prev => !prevFav ? prev + 1 : prev - 1);

    try {
      await api.post(`/lists/${list.id}/favorite`);
    } catch (error) {
      console.error("Erro ao favoritar", error);
      // Reverte
      setIsFavorite(prevFav);
      setFavCount(prevCount);
    } finally {
      setFavLoading(false);
    }
  };

  const handleDelete = () => {
    closeMenu();
    Alert.alert(
      "Excluir Lista",
      "Tem certeza que deseja excluir esta lista? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            if (loadingDelete) return;
            setLoadingDelete(true);
            try {
              await ListService.deleteList(list.id);
              if (onDelete) onDelete(list.id);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir a lista.");
            } finally {
              setLoadingDelete(false);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{list.stats.items_count} items</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {!list.is_public && <Icon name="lock" size={16} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />}

          {isOwner ? (
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <TouchableOpacity onPress={openMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Icon name="dots-horizontal" size={24} color="white" />
                </TouchableOpacity>
              }
              contentStyle={{ backgroundColor: theme.colors.surface }}
            >
              <Menu.Item onPress={handleShare} title="Compartilhar" leadingIcon="share-variant" />
              <Menu.Item onPress={handleDelete} title="Excluir" leadingIcon="trash-can-outline" titleStyle={{ color: theme.colors.error }} />
            </Menu>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Botão de Favoritar para Não-Donos */}
              <TouchableOpacity onPress={handleFavorite}>
                <Icon name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? "#ef4444" : "white"} />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleShare}>
                <Icon name="share-variant" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.body}>
        {/* Ícone de bookmark decorativo */}
        <Icon name={isFavorite ? "bookmark" : "bookmark-outline"} size={20} color="white" />
        <Text style={styles.title} numberOfLines={2}>
          {list.title}
        </Text>
        <Text style={styles.description} numberOfLines={1}>
          {list.description || "Sem descrição"}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          {list.user.avatar ? (
            <Avatar.Image size={24} source={{ uri: list.user.avatar }} />
          ) : (
            <Avatar.Text size={24} label={list.user.name.charAt(0)} style={{ backgroundColor: theme.colors.primary }} />
          )}
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.userName} numberOfLines={1}>{list.user.name}</Text>
            <Text style={styles.userHandle} numberOfLines={1}>@{list.user.username}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Icon name="heart-outline" size={14} color="rgba(255,255,255,0.7)" />
          {/* Usa o estado local para atualizar imediatamente */}
          <Text style={styles.statText}>{favCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="comment-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.statText}>{list.stats.comments_count}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="eye-outline" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.statText}>{list.stats.views_count}</Text>
        </View>

        <Text style={styles.dateText}>{formatDate(list.updated_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    minHeight: 180,
    justifyContent: "space-between",
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  body: {
    marginTop: 12,
    flex: 1,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  description: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userName: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  userHandle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  statText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    marginLeft: 4
  },
  dateText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    marginLeft: 'auto'
  }
});