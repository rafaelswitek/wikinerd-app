import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, Image } from "react-native";
import { Text, useTheme, Avatar, IconButton, Divider } from "react-native-paper";
import { ListService } from "../services/listService";
import { ListDetails } from "../types/List";
import MediaCard from "../components/MediaCard";

export default function ListDetailsScreen({ route, navigation }: any) {
  const { id } = route.params;
  const theme = useTheme();
  
  const [list, setList] = useState<ListDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadList();
  }, [id]);

  const loadList = async () => {
    try {
      const data = await ListService.getListDetails(id);
      setList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={[styles.center, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" /></View>;
  }

  if (!list) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={list.items}
        keyExtractor={(item) => item.item_id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 20 }}
        columnWrapperStyle={{ paddingHorizontal: 8 }}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>{list.title}</Text>
            {list.description && <Text style={{ color: theme.colors.secondary, marginTop: 8 }}>{list.description}</Text>}
            
            <View style={styles.metaRow}>
              <View style={styles.userRow}>
                {list.user.avatar ? <Avatar.Image size={24} source={{ uri: list.user.avatar }} /> : <Avatar.Text size={24} label={list.user.name[0]} />}
                <Text style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}>{list.user.name}</Text>
              </View>
              <Text style={{ color: theme.colors.outline }}>{list.items.length} itens</Text>
            </View>

            {list.keywords.length > 0 && (
              <View style={styles.tagsRow}>
                {list.keywords.map(k => (
                  <View key={k} style={[styles.tag, { borderColor: theme.colors.outline }]}>
                    <Text style={{ fontSize: 10, color: theme.colors.secondary }}>{k}</Text>
                  </View>
                ))}
              </View>
            )}
            <Divider style={{ marginVertical: 16 }} />
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ flex: 1, padding: 4 }}>
             <MediaCard media={item.media as any} style={{ width: '100%' }} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 }
});