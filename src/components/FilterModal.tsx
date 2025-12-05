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

  useEffect(() => {
    if (visible) {
      setLocalFilters(currentFilters || {});

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
          <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>Filtros Avançados</Text>
          <IconButton icon="close" onPress={onDismiss} iconColor={theme.colors.onSurface} />
        </View>

        <ScrollView style={styles.content}>
          {/* Seção de Ano Customizada */}
          <List.Accordion title="Ano de Lançamento" titleStyle={{ color: theme.colors.onSurface }} id="year">
            <View style={styles.yearSection}>
              <Text variant="bodySmall" style={{ marginBottom: 8, color: theme.colors.secondary }}>Tipo de busca</Text>
              <SegmentedButtons
                value={yearMode}
                onValueChange={setYearMode}
                buttons={yearModeOptions}
                style={{ marginBottom: 16 }}
                density="small"
              />

              {yearMode === 'specific' && (
                <TextInput
                  label="Digite um ano (ex: 2014)"
                  value={specificYear}
                  onChangeText={setSpecificYear}
                  keyboardType="numeric"
                  mode="outlined"
                  maxLength={4}
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
                    >
                      {decade.label}
                    </Button>
                  ))}
                </View>
              )}

              {yearMode === 'range' && (
                <View style={styles.rangeContainer}>
                  <TextInput
                    label="De"
                    value={rangeStart}
                    onChangeText={setRangeStart}
                    keyboardType="numeric"
                    mode="outlined"
                    style={{ flex: 1 }}
                    maxLength={4}
                  />
                  <Text style={{ marginHorizontal: 8, alignSelf: 'center' }}>até</Text>
                  <TextInput
                    label="Até"
                    value={rangeEnd}
                    onChangeText={setRangeEnd}
                    keyboardType="numeric"
                    mode="outlined"
                    style={{ flex: 1 }}
                    maxLength={4}
                  />
                </View>
              )}
            </View>
          </List.Accordion>
          <Divider />

          {/* Seção de Países */}
          <List.Accordion title="Países de Origem" titleStyle={{ color: theme.colors.onSurface }} id="countries">
            {countryOptions.map((c) => renderCheckboxItem("countries", c))}
          </List.Accordion>
          <Divider />

          {/* Seções Antigas */}
          <List.Accordion title="Gêneros" titleStyle={{ color: theme.colors.onSurface }} id="genres">
            {genreOptions.map((g) => renderCheckboxItem("genres", g))}
          </List.Accordion>
          <Divider />

          <List.Accordion title="Serviços de Streaming" titleStyle={{ color: theme.colors.onSurface }} id="streamings">
            {streamingOptions.map((s) => renderCheckboxItem("streamings", s))}
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
  container: { margin: 20, borderRadius: 8, height: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  content: { flex: 1 },
  yearSection: { padding: 16, backgroundColor: 'rgba(0,0,0,0.02)' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginBottom: 4 },
  rangeContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
  button: { flex: 1 }
});