import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";
import { Modal, Portal, Text, Button, TextInput, useTheme, IconButton, Switch, SegmentedButtons, Divider } from "react-native-paper";
import StarRatingInput from "./StarRatingInput";
import { api } from "../services/api";
import { Review } from "../types/Review";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSubmitSuccess: (review: Review) => void;
  movieId: string;
  movieTitle: string;
}

export default function WriteReviewModal({ visible, onDismiss, onSubmitSuccess, movieId, movieTitle }: Props) {
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState('general'); // general | detailed
  const [loading, setLoading] = useState(false);

  // Form State
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hasSpoilers, setHasSpoilers] = useState(false);

  // Detailed State
  const [storyRating, setStoryRating] = useState(0);
  const [actingRating, setActingRating] = useState(0);
  const [directionRating, setDirectionRating] = useState(0);
  const [cinematographyRating, setCinematographyRating] = useState(0);
  const [soundtrackRating, setSoundtrackRating] = useState(0);
  const [visualRating, setVisualRating] = useState(0);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert("Atenção", "Por favor, dê pelo menos uma nota geral.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        movie_id: movieId,
        overall_rating: overallRating,
        story_rating: storyRating > 0 ? storyRating : null,
        acting_rating: actingRating > 0 ? actingRating : null,
        direction_rating: directionRating > 0 ? directionRating : null,
        cinematography_rating: cinematographyRating > 0 ? cinematographyRating : null,
        soundtrack_rating: soundtrackRating > 0 ? soundtrackRating : null,
        visual_effects_rating: visualRating > 0 ? visualRating : null,
        comment: comment.trim() || null,
        has_spoilers: hasSpoilers
      };

      const response = await api.post("/users/movie/review", payload);
      
      Alert.alert("Sucesso", "Avaliação enviada!");
      onSubmitSuccess(response.data.review);
      onDismiss();
      
      // Limpar form
      setOverallRating(0);
      setComment("");
      // ... resetar outros se quiser
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao enviar avaliação.");
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryRow = (label: string, rating: number, setRating: (v: number) => void) => (
    <View style={styles.catRow}>
      <Text style={[styles.catLabel, { color: theme.colors.onSurface }]}>{label}</Text>
      <StarRatingInput rating={rating} onRate={setRating} size={24} />
    </View>
  );

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Icon name="star" size={20} color="#eab308" />
          <Text variant="titleMedium" style={{ marginLeft: 8, color: theme.colors.onSurface, fontWeight: 'bold' }}>
            Avaliar {movieTitle}
          </Text>
        </View>

        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'general', label: 'Avaliação Geral' },
            { value: 'detailed', label: 'Avaliação Detalhada' },
          ]}
          style={{ margin: 16 }}
        />

        <ScrollView style={styles.content}>
          <View style={{ alignItems: 'center', marginVertical: 16 }}>
            <Text style={{ marginBottom: 8, color: theme.colors.secondary }}>Sua avaliação geral:</Text>
            <StarRatingInput rating={overallRating} onRate={setOverallRating} size={40} />
          </View>

          {activeTab === 'detailed' && (
            <View style={styles.detailedBox}>
              <Text style={{ marginBottom: 12, fontWeight: 'bold', color: theme.colors.onSurface }}>Avalie por categoria:</Text>
              {renderCategoryRow("Roteiro", storyRating, setStoryRating)}
              {renderCategoryRow("Atuação", actingRating, setActingRating)}
              {renderCategoryRow("Direção", directionRating, setDirectionRating)}
              {renderCategoryRow("Cinematografia", cinematographyRating, setCinematographyRating)}
              {renderCategoryRow("Trilha Sonora", soundtrackRating, setSoundtrackRating)}
              {renderCategoryRow("Efeitos Visuais", visualRating, setVisualRating)}
            </View>
          )}

          <Divider style={{ marginVertical: 16 }} />

          <View style={styles.commentSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Comentário (opcional)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: theme.colors.error, marginRight: 8 }}>Contém Spoilers?</Text>
                    <Switch value={hasSpoilers} onValueChange={setHasSpoilers} color={theme.colors.error} />
                </View>
            </View>
            
            <TextInput
              mode="outlined"
              placeholder={`Compartilhe sua opinião sobre ${movieTitle}...`}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={{ backgroundColor: theme.colors.background }}
            />
            <Text style={{ textAlign: 'right', fontSize: 10, color: theme.colors.secondary, marginTop: 4 }}>
              {comment.length}/500 caracteres
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1, marginRight: 8 }}>Cancelar</Button>
          <Button mode="contained" onPress={handleSubmit} loading={loading} style={{ flex: 1 }}>Enviar</Button>
        </View>
      </Modal>
    </Portal>
  );
}

import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const styles = StyleSheet.create({
  container: { margin: 16, borderRadius: 12, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#333' },
  content: { paddingHorizontal: 16 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 4, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catLabel: { fontWeight: '600' },
  detailedBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 },
  commentSection: { marginBottom: 20 },
  footer: { padding: 16, flexDirection: 'row', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }
});