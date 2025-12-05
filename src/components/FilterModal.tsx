import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Modal, Portal, Text, Button, Checkbox, List, useTheme, Divider, IconButton, TextInput, SegmentedButtons } from "react-native-paper";
import { genreOptions, streamingOptions, certificationOptions, countryOptions, decadeOptions, yearModeOptions } from "../data/filterOptions";

interface FilterModalProps {
  visible: boolean;
  onDismiss: () => void;
  onApply: (filters: any) => void;
  currentFilters: any;
}

export default function FilterModal({ visible, onDismiss, onApply, currentFilters }: FilterModalProps) {
  const theme = useTheme();

  const [localFilters, setLocalFilters] = useState<any>({});

  const [yearMode, setYearMode] = useState<string>("specific");
  const [specificYear, setSpecificYear] = useState("");
  const [selectedDecade, setSelectedDecade] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const [countryQuery, setCountryQuery] = useState("");
  const [streamingQuery, setStreamingQuery] = useState("");

  useEffect(() => {
    if (visible) {
      setLocalFilters(currentFilters || {});

      // Resetar buscas internas ao abrir o modal
      setCountryQuery("");
      setStreamingQuery("");

      if (currentFilters.yearData) {
        setYearMode(currentFilters.yearData.mode);
        setSpecificYear(currentFilters.yearData.specific || "");
        setSelectedDecade(currentFilters.yearData.decade || "");
        setRangeStart(currentFilters.yearData.rangeStart || "");
        setRangeEnd(currentFilters.yearData.rangeEnd || "");
      } else {
        setYearMode("specific");
        setSpecificYear("");
        setSelectedDecade("");
        setRangeStart("");
        setRangeEnd("");
      }
    }
  }, [visible, currentFilters]);

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
    const yearData = {
      mode: yearMode,
      specific: yearMode === 'specific' ? specificYear : null,
      decade: yearMode === 'decade' ? selectedDecade : null,
      rangeStart: yearMode === 'range' ? rangeStart : null,
      rangeEnd: yearMode === 'range' ? rangeEnd : null,
    };

    onApply({ ...localFilters, yearData });
    onDismiss();
  };

  const handleClear = () => {
    setLocalFilters({});
    setSpecificYear("");
    setSelectedDecade("");
    setRangeStart("");
    setRangeEnd("");
    setYearMode("specific");
    setCountryQuery("");
    setStreamingQuery("");
  };

  const filteredCountries = countryOptions.filter(c =>
    c.label.toLowerCase().includes(countryQuery.toLowerCase())
  );

  const filteredStreamings = streamingOptions.filter(s =>
    s.label.toLowerCase().includes(streamingQuery.toLowerCase())
  );

  const renderCheckboxItem = (category: string, item: { id: string; label: string }) => (
    <Checkbox.Item
      key={item.id}
      label={item.label}
      status={localFilters[category]?.includes(item.id) ? "checked" : "unchecked"}
      onPress={() => toggleFilter(category, item.id)}
      labelStyle={{ color: theme.colors.onSurface }}
      color={theme.colors.primary}
      style={{ paddingVertical: 0 }} // Compactar lista
    />
  );

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>Filtros Avançados</Text>
          <IconButton icon="close" onPress={onDismiss} iconColor={theme.colors.onSurface} />
        </View>

        <ScrollView style={styles.content}>
          {/* Seção Ano */}
          <List.Accordion title="Ano de Lançamento" titleStyle={{ color: theme.colors.onSurface }} id="year">
            <View style={styles.yearSection}>
              <SegmentedButtons
                value={yearMode}
                onValueChange={setYearMode}
                buttons={yearModeOptions}
                style={{ marginBottom: 16 }}
                density="small"
              />

              {yearMode === 'specific' && (
                <TextInput
                  label="Ex: 2014"
                  value={specificYear}
                  onChangeText={setSpecificYear}
                  keyboardType="numeric"
                  mode="outlined"
                  maxLength={4}
                  dense
                />
              )}

              {yearMode === 'decade' && (
                <View style={styles.chipContainer}>
                  {decadeOptions.map((decade) => (
                    <Button
                      key={decade.id}
                      mode={selectedDecade === decade.id ? "contained" : "outlined"}
                      onPress={() => setSelectedDecade(decade.id)}
                      style={styles.chip}
                      compact
                      labelStyle={{ fontSize: 12 }}
                    >
                      {decade.label}
                    </Button>
                  ))}
                </View>
              )}

              {yearMode === 'range' && (
                <View style={styles.rangeContainer}>
                  <TextInput label="De" value={rangeStart} onChangeText={setRangeStart} keyboardType="numeric" mode="outlined" style={{ flex: 1 }} maxLength={4} dense />
                  <Text style={{ marginHorizontal: 8, alignSelf: 'center' }}>até</Text>
                  <TextInput label="Até" value={rangeEnd} onChangeText={setRangeEnd} keyboardType="numeric" mode="outlined" style={{ flex: 1 }} maxLength={4} dense />
                </View>
              )}
            </View>
          </List.Accordion>
          <Divider />

          {/* Seção Países com Busca */}
          <List.Accordion title="Países" titleStyle={{ color: theme.colors.onSurface }} id="countries">
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Buscar país..."
                value={countryQuery}
                onChangeText={setCountryQuery}
                mode="outlined"
                dense
                style={styles.searchInput}
                left={<TextInput.Icon icon="magnify" />}
              />
            </View>
            <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled>
              {filteredCountries.map((c) => renderCheckboxItem("countries", c))}
              {filteredCountries.length === 0 && <Text style={styles.emptyText}>Nenhum país encontrado</Text>}
            </ScrollView>
          </List.Accordion>
          <Divider />

          {/* Seção Streaming com Busca */}
          <List.Accordion title="Streaming" titleStyle={{ color: theme.colors.onSurface }} id="streamings">
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Buscar streaming..."
                value={streamingQuery}
                onChangeText={setStreamingQuery}
                mode="outlined"
                dense
                style={styles.searchInput}
                left={<TextInput.Icon icon="magnify" />}
              />
            </View>
            <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled>
              {filteredStreamings.map((s) => renderCheckboxItem("streamings", s))}
              {filteredStreamings.length === 0 && <Text style={styles.emptyText}>Nenhum serviço encontrado</Text>}
            </ScrollView>
          </List.Accordion>
          <Divider />

          <List.Accordion title="Gêneros" titleStyle={{ color: theme.colors.onSurface }} id="genres">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8 }}>
              {genreOptions.map(g => (
                <View key={g.id} style={{ width: '50%' }}>
                  {renderCheckboxItem("genres", g)}
                </View>
              ))}
            </View>
          </List.Accordion>
          <Divider />

          <List.Accordion title="Classificação" titleStyle={{ color: theme.colors.onSurface }} id="classification">
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
  container: { margin: 20, borderRadius: 12, height: '90%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  content: { flex: 1 },
  yearSection: { padding: 16, backgroundColor: 'rgba(0,0,0,0.02)' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginBottom: 4, flexGrow: 1 },
  rangeContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },
  searchInput: { backgroundColor: 'transparent' },
  emptyText: { padding: 16, textAlign: 'center', opacity: 0.6 },
  footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
  button: { flex: 1 }
});