import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Keyboard, TouchableOpacity } from "react-native";
import { Modal, Portal, Text, TextInput, Button, Switch, useTheme, Chip, IconButton, ActivityIndicator, Divider } from "react-native-paper";
import { ListService } from "../services/listService";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: (listId: string) => void;
}

export default function CreateListModal({ visible, onDismiss, onSuccess }: Props) {
  const theme = useTheme();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  
  // Controle de Keywords
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<{name: string}[]>([]);
  const [searchingKeywords, setSearchingKeywords] = useState(false);

  const [loading, setLoading] = useState(false);

  // Efeito para buscar keywords enquanto digita (Debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (keywordInput.trim().length >= 2) {
        setSearchingKeywords(true);
        try {
          const results = await ListService.searchKeywords(keywordInput);
          // Filtra sugestões que já foram adicionadas
          setSuggestions(results.filter(r => !keywords.includes(r.name)));
        } catch (error) {
          console.error("Erro ao buscar keywords", error);
        } finally {
          setSearchingKeywords(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [keywordInput, keywords]);

  const handleSelectKeyword = (word: string) => {
    if (!keywords.includes(word)) {
      setKeywords([...keywords, word]);
    }
    setKeywordInput("");
    setSuggestions([]);
  };

  const removeKeyword = (word: string) => {
    setKeywords(keywords.filter(k => k !== word));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Erro", "O título é obrigatório.");
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const newList = await ListService.createList({
        title,
        description,
        is_public: isPublic,
        keywords
      });
      
      // Limpar formulário
      setTitle("");
      setDescription("");
      setKeywords([]);
      setKeywordInput("");
      setSuggestions([]);
      setIsPublic(true);
      
      onSuccess(newList.id);
      onDismiss();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao criar a lista. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Criar Nova Lista</Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Título da Lista *</Text>
          <TextInput
            mode="outlined"
            placeholder="Ex: Meus filmes favoritos de 2024"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Descrição</Text>
          <TextInput
            mode="outlined"
            placeholder="Descreva sua lista..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Palavras-chave</Text>
          <TextInput
            mode="outlined"
            placeholder="Pesquisar (ex: hero)"
            value={keywordInput}
            onChangeText={setKeywordInput}
            right={searchingKeywords ? <TextInput.Icon icon={() => <ActivityIndicator size={16} />} /> : null}
            style={styles.input}
          />
          
          {/* Lista de Sugestões com Scroll */}
          {suggestions.length > 0 && keywordInput.length > 0 && (
            <ScrollView 
              style={[styles.suggestionsBox, { backgroundColor: theme.colors.elevation.level2, borderColor: theme.colors.outlineVariant }]}
              nestedScrollEnabled={true} // Permite scroll dentro do modal
              keyboardShouldPersistTaps="handled" // Permite clicar na sugestão com teclado aberto
            >
              {suggestions.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleSelectKeyword(item.name)}
                  style={styles.suggestionItem}
                >
                  <Text style={{ color: theme.colors.onSurface }}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {/* Chips selecionados */}
          <View style={styles.chipContainer}>
            {keywords.map(k => (
              <Chip key={k} onClose={() => removeKeyword(k)} style={styles.chip} compact>
                {k}
              </Chip>
            ))}
          </View>

          <View style={styles.switchContainer}>
            <Switch value={isPublic} onValueChange={setIsPublic} color={theme.colors.primary} />
            <Text style={{ marginLeft: 12, fontSize: 16, color: theme.colors.onSurface }}>
              {isPublic ? "Lista Pública" : "Lista Privada"}
            </Text>
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1, marginRight: 8 }}>Cancelar</Button>
          <Button mode="contained" onPress={handleCreate} loading={loading} style={{ flex: 1 }}>Criar Lista</Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: { margin: 16, borderRadius: 12, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  content: { padding: 16 },
  label: { fontWeight: 'bold', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: 'transparent' },
  
  suggestionsBox: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -4,
    maxHeight: 150, // Limita altura para ativar o scroll
    zIndex: 1000,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)'
  },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { marginRight: 4, marginBottom: 4 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 8 },
  footer: { padding: 16, flexDirection: 'row', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }
});