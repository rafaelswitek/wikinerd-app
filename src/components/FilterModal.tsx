import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Modal, Portal, Text, Button, Checkbox, List, useTheme, Divider, IconButton } from "react-native-paper";
import { genreOptions, streamingOptions, certificationOptions } from "../data/filterOptions";

interface FilterModalProps {
  visible: boolean;
  onDismiss: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

export default function FilterModal({ visible, onDismiss, onApply, currentFilters }: FilterModalProps) {
  const theme = useTheme();
  const [localFilters, setLocalFilters] = useState(currentFilters || {});

  const toggleFilter = (category: string, value: string) => {
    setLocalFilters((prev: any) => {
      const categoryList = prev[category] || [];
      if (categoryList.includes(value)) {
        return { ...prev, [category]: categoryList.filter((item: string) => item !== value) };
      } else {
        return { ...prev, [category]: [...categoryList, value] };
      }
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onDismiss();
  };

  const handleClear = () => {
    setLocalFilters({});
  };

  const renderCheckboxItem = (category: string, item: { id: string; label: string }) => (
    <Checkbox.Item
      key={item.id}
      label={item.label}
      status={localFilters[category]?.includes(item.id) ? "checked" : "unchecked"}
      onPress={() => toggleFilter(category, item.id)}
      labelStyle={{ color: theme.colors.onSurface }}
      color={theme.colors.primary}
    />
  );

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>Filtros</Text>
          <IconButton icon="close" onPress={onDismiss} iconColor={theme.colors.onSurface} />
        </View>

        <ScrollView style={styles.content}>
          <List.Accordion title="Gêneros" titleStyle={{ color: theme.colors.onSurface }} id="1">
            {genreOptions.map((g) => renderCheckboxItem("genres", g))}
          </List.Accordion>
          <Divider />

          <List.Accordion title="Serviços de Streaming" titleStyle={{ color: theme.colors.onSurface }} id="2">
            {streamingOptions.map((s) => renderCheckboxItem("streamings", s))}
          </List.Accordion>
          <Divider />

          <List.Accordion title="Classificação" titleStyle={{ color: theme.colors.onSurface }} id="3">
            {certificationOptions.map((c) => renderCheckboxItem("classification", c))}
          </List.Accordion>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
          <Button mode="outlined" onPress={handleClear} style={styles.button}>Limpar</Button>
          <Button mode="contained" onPress={handleApply} style={styles.button}>Aplicar</Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: { margin: 20, borderRadius: 8, height: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  content: { flex: 1 },
  footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
  button: { flex: 1 }
});