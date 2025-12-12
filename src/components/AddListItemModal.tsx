    import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from "react-native";
import { Modal, Portal, Text, TextInput, Button, useTheme, SegmentedButtons, ActivityIndicator, IconButton, Chip } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ListService } from "../services/listService";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onAdd: (items: any[]) => void;
}

export default function AddListItemModal({ visible, onDismiss, onAdd }: Props) {
  const theme = useTheme();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [mediaType, setMediaType] = useState("movie"); // 'movie' | 'tv'
  const [results, setResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Busca debounced
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        fetchMedia();
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, mediaType]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const data = await ListService.searchMedia(mediaType, searchQuery);
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (item: any) => {
    const isSelected = selectedItems.find(i => i.id === item.id);
    if (isSelected) {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      setSelectedItems(prev => [...prev, { ...item, media_type: mediaType }]);
    }
  };

  const handleSubmit = () => {
    const payload = selectedItems.map(item => ({
      media_id: item.id,
      media_type: item.media_type === 'movie' ? 'movie' : 'tv_show'
    }));
    onAdd(payload);
    setSearchQuery("");
    setSelectedItems([]);
    setResults([]);
    onDismiss();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedItems.find(i => i.id === item.id);
    const poster = item.poster_path?.tmdb ? `https://image.tmdb.org/t/p/w154${item.poster_path.tmdb}` : null;

    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }]} 
        onPress={() => toggleSelection(item)}
      >
        <Image 
          source={{ uri: poster || "https://via.placeholder.com/100" }} 
          style={styles.poster} 
          resizeMode="cover" 
        />
        {isSelected && (
          <View style={[styles.checkBadge, { backgroundColor: theme.colors.primary }]}>
            <Icon name="check" size={16} color="white" />
          </View>
        )}
        <Text style={styles.itemTitle} numberOfLines={2}>{item.title || item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Adicionar Itens à Lista</Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <TextInput
            placeholder="Busque por filmes ou séries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            mode="outlined"
            dense
            left={<TextInput.Icon icon="magnify" />}
          />
        </View>

        {selectedItems.length > 0 && (
          <View style={styles.selectedRow}>
            <Text style={{ fontSize: 12, color: theme.colors.secondary, marginBottom: 4 }}>Selecionados ({selectedItems.length}):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedItems.map(item => (
                <Chip key={item.id} onClose={() => toggleSelection(item)} style={{ marginRight: 8 }} compact>{item.title || item.name}</Chip>
              ))}
            </ScrollView>
          </View>
        )}

        <SegmentedButtons
          value={mediaType}
          onValueChange={setMediaType}
          buttons={[
            { value: 'movie', label: 'Filmes' },
            { value: 'tv', label: 'Séries' },
          ]}
          style={{ marginHorizontal: 16, marginBottom: 8 }}
          density="small"
        />

        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            numColumns={3}
            contentContainerStyle={{ padding: 12 }}
            columnWrapperStyle={{ gap: 8 }}
          />
        )}

        <View style={styles.footer}>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1, marginRight: 8 }}>Cancelar</Button>
          <Button mode="contained" onPress={handleSubmit} disabled={selectedItems.length === 0} style={{ flex: 1 }}>
            Adicionar ({selectedItems.length})
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: { margin: 16, borderRadius: 12, height: '85%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  selectedRow: { paddingHorizontal: 16, marginBottom: 10, maxHeight: 50 },
  card: { flex: 1, marginBottom: 12, position: 'relative', borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.05)', maxWidth: '33%' },
  poster: { width: '100%', height: 140, borderRadius: 6 },
  checkBadge: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  itemTitle: { fontSize: 11, padding: 4, textAlign: 'center' },
  footer: { padding: 16, flexDirection: 'row', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }
});