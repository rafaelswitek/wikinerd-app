import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { Modal, Portal, Text, Button, Checkbox, ActivityIndicator, useTheme, Divider, IconButton } from "react-native-paper";
import { ListService } from "../services/listService";
import { ListSummary } from "../types/List";

interface AddToListModalProps {
  visible: boolean;
  onDismiss: () => void;
  mediaId: string;
  mediaType: string;
  mediaTitle: string;
}

export default function AddToListModal({ visible, onDismiss, mediaId, mediaType, mediaTitle }: AddToListModalProps) {
  const theme = useTheme();
  
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Carregar listas ao abrir o modal
  useEffect(() => {
    if (visible) {
      loadUserLists();
      setSelectedLists([]); // Limpa seleção anterior ao abrir
    }
  }, [visible]);

  const loadUserLists = async () => {
    setLoading(true);
    try {
      const data = await ListService.getUserLists();
      setLists(data);
    } catch (error) {
      console.error("Erro ao carregar listas", error);
      Alert.alert("Erro", "Não foi possível carregar suas listas.");
    } finally {
      setLoading(false);
    }
  };

  const toggleList = (listId: string) => {
    setSelectedLists(prev => 
      prev.includes(listId) 
        ? prev.filter(id => id !== listId) 
        : [...prev, listId]
    );
  };

  const handleSubmit = async () => {
    if (selectedLists.length === 0) return;

    setSubmitting(true);
    try {
      // Adiciona o item em todas as listas selecionadas (Promise.all para paralelo)
      const promises = selectedLists.map(listId => 
        ListService.addItemsToList(listId, {
          items: [{ media_id: mediaId, media_type: mediaType }]
        })
      );

      await Promise.all(promises);

      Alert.alert("Sucesso", `"${mediaTitle}" foi adicionado às listas selecionadas.`);
      onDismiss();
    } catch (error) {
      console.error("Erro ao adicionar às listas", error);
      Alert.alert("Erro", "Falha ao adicionar o item a algumas listas.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: ListSummary }) => (
    <Checkbox.Item
      label={item.title}
      status={selectedLists.includes(item.id) ? "checked" : "unchecked"}
      onPress={() => toggleList(item.id)}
      color={theme.colors.primary}
      labelStyle={{ textAlign: 'left', color: theme.colors.onSurface }}
      style={{ paddingVertical: 4 }}
    />
  );

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>Adicionar à Lista</Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>
        
        <Text style={{ paddingHorizontal: 16, marginBottom: 8, color: theme.colors.secondary }}>
          Selecione as listas para: {mediaTitle}
        </Text>

        <Divider />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator animating size="large" />
          </View>
        ) : lists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Você ainda não tem listas.</Text>
          </View>
        ) : (
          <FlatList
            data={lists}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            style={styles.list}
          />
        )}

        <Divider />

        <View style={styles.footer}>
          <Button mode="outlined" onPress={onDismiss} style={styles.button} textColor={theme.colors.onSurfaceVariant}>
            Cancelar
          </Button>
          <Button 
            mode="contained" 
            onPress={handleSubmit} 
            style={styles.button} 
            disabled={submitting || selectedLists.length === 0}
            loading={submitting}
          >
            Salvar
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: { margin: 20, borderRadius: 12, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 16, paddingRight: 4, paddingTop: 8 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  list: { flexGrow: 0 },
  footer: { flexDirection: 'row', padding: 16, gap: 12 },
  button: { flex: 1, borderRadius: 8 },
});