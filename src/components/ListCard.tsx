// src/components/ListCard.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Avatar, useTheme, IconButton } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ListSummary } from "../types/List";

interface Props {
  list: ListSummary;
  onPress: () => void;
  index: number;
}

// Cores baseadas no print para dar variedade
const CARD_COLORS = ["#312e81", "#064e3b", "#701a75", "#7c2d12", "#1e3a8a"];

export default function ListCard({ list, onPress, index }: Props) {
  const theme = useTheme();
  const backgroundColor = CARD_COLORS[index % CARD_COLORS.length];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
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
        <View style={{ flexDirection: 'row' }}>
            {!list.is_public && <Icon name="lock" size={16} color="rgba(255,255,255,0.7)" style={{ marginRight: 8 }} />}
            <Icon name="dots-horizontal" size={20} color="white" />
        </View>
      </View>

      <View style={styles.body}>
        <Icon name={list.is_favorite ? "bookmark" : "bookmark-outline"} size={20} color="white" />
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
            <Text style={styles.statText}>{list.stats.favorites_count}</Text>
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
    alignItems: "flex-start",
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