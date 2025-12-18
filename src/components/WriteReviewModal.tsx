import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Modal, Portal, Text, Button, TextInput, useTheme, Switch, SegmentedButtons, Divider, Menu } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import StarRatingInput from "./StarRatingInput";
import { api } from "../services/api";
import { Review } from "../types/Review";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSubmitSuccess: (review: Review) => void;
  mediaId: string;
  mediaTitle: string;
  mediaType?: 'movie' | 'tv' | 'episode';
  seasons?: any[]; // Recebe as temporadas já com os episódios carregados
}

export default function WriteReviewModal({ 
  visible, 
  onDismiss, 
  onSubmitSuccess, 
  mediaId, 
  mediaTitle, 
  mediaType = 'movie', 
  seasons = [] 
}: Props) {
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  // TV Selection State
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [episodesList, setEpisodesList] = useState<any[]>([]);
  const [showSeasonMenu, setShowSeasonMenu] = useState(false);
  const [showEpisodeMenu, setShowEpisodeMenu] = useState(false);

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

  useEffect(() => {
    if (visible) {
      setOverallRating(0);
      setComment("");
      setHasSpoilers(false);
      setSelectedSeason(null);
      setSelectedEpisodeId(null);
      setEpisodesList([]);
      
      // Se for type 'episode', o ID já vem pronto no mediaId
      if (mediaType === 'episode') {
        setSelectedEpisodeId(mediaId);
      }
    }
  }, [visible, mediaId, mediaType]);

  const handleSeasonSelect = (seasonNumber: number) => {
    setSelectedSeason(seasonNumber);
    setShowSeasonMenu(false);
    setSelectedEpisodeId(null); 
    
    // LÓGICA ALTERADA: Busca os episódios na prop 'seasons' localmente
    const seasonData = seasons.find(s => s.season_number === seasonNumber);
    if (seasonData && seasonData.episodes) {
        setEpisodesList(seasonData.episodes);
    } else {
        setEpisodesList([]);
    }
  };

  const handleEpisodeSelect = (episodeId: string) => {
    setSelectedEpisodeId(episodeId);
    setShowEpisodeMenu(false);
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      Alert.alert("Atenção", "Por favor, dê pelo menos uma nota geral.");
      return;
    }

    if (mediaType === 'tv' && !selectedEpisodeId) {
      Alert.alert("Atenção", "Selecione uma temporada e um episódio para avaliar.");
      return;
    }

    setLoading(true);
    try {
      const isMovie = mediaType === 'movie';
      const endpoint = isMovie ? "/users/movie/review" : "/users/episode/review";
      
      const payload: any = {
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

      if (isMovie) {
        payload.movie_id = mediaId;
      } else {
        payload.episode_id = selectedEpisodeId;
      }

      const response = await api.post(endpoint, payload);
      
      Alert.alert("Sucesso", "Avaliação enviada!");
      onSubmitSuccess(response.data.review);
      onDismiss();
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

  const getEpisodeTitle = () => {
    if (!selectedEpisodeId) return "Selecionar Episódio";
    const ep = episodesList.find(e => e.id.toString() === selectedEpisodeId.toString());
    return ep ? `${ep.episode_number}. ${ep.title}` : "Episódio Selecionado";
  }

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Icon name="star" size={20} color="#eab308" />
          <Text variant="titleMedium" style={{ marginLeft: 8, color: theme.colors.onSurface, fontWeight: 'bold', flex: 1 }} numberOfLines={1}>
            Avaliar {mediaTitle}
          </Text>
        </View>

        <ScrollView style={styles.content}>
            {/* Seletores para Série */}
            {mediaType === 'tv' && (
                <View style={styles.selectorsContainer}>
                    <Text style={{ marginBottom: 8, color: theme.colors.secondary }}>Escolha o episódio para avaliar:</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Menu
                            visible={showSeasonMenu}
                            onDismiss={() => setShowSeasonMenu(false)}
                            anchor={
                                <Button mode="outlined" onPress={() => setShowSeasonMenu(true)} style={{ flex: 1 }}>
                                    {selectedSeason ? `Temp ${selectedSeason}` : "Temporada"}
                                </Button>
                            }
                        >
                            {seasons.map(season => (
                                <Menu.Item 
                                    key={season.id} 
                                    onPress={() => handleSeasonSelect(season.season_number)} 
                                    title={season.title} 
                                />
                            ))}
                        </Menu>

                        <Menu
                            visible={showEpisodeMenu}
                            onDismiss={() => setShowEpisodeMenu(false)}
                            anchor={
                                <Button 
                                    mode="outlined" 
                                    onPress={() => setShowEpisodeMenu(true)} 
                                    disabled={!selectedSeason}
                                    style={{ flex: 1 }}
                                >
                                    {selectedEpisodeId ? `Ep ${episodesList.find(e => e.id == selectedEpisodeId)?.episode_number}` : "Episódio"}
                                </Button>
                            }
                        >
                            <ScrollView style={{ maxHeight: 200 }}>
                                {episodesList.map(ep => (
                                    <Menu.Item 
                                        key={ep.id} 
                                        onPress={() => handleEpisodeSelect(ep.id)} 
                                        title={`${ep.episode_number}. ${ep.title}`} 
                                    />
                                ))}
                                {episodesList.length === 0 && (
                                  <Menu.Item title="Sem episódios" disabled />
                                )}
                            </ScrollView>
                        </Menu>
                    </View>
                    {selectedEpisodeId && (
                        <Text style={{ marginTop: 8, fontWeight: 'bold', color: theme.colors.primary, textAlign: 'center' }}>
                           Avaliando: {getEpisodeTitle()}
                        </Text>
                    )}
                    <Divider style={{ marginVertical: 16 }} />
                </View>
            )}

            <SegmentedButtons
                value={activeTab}
                onValueChange={setActiveTab}
                buttons={[
                    { value: 'general', label: 'Geral' },
                    { value: 'detailed', label: 'Detalhada' },
                ]}
                style={{ marginVertical: 16 }}
            />

          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ marginBottom: 8, color: theme.colors.secondary }}>Sua nota geral:</Text>
            <StarRatingInput rating={overallRating} onRate={setOverallRating} size={40} />
          </View>

          {activeTab === 'detailed' && (
            <View style={styles.detailedBox}>
              <Text style={{ marginBottom: 12, fontWeight: 'bold', color: theme.colors.onSurface }}>Critérios:</Text>
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
                    <Text style={{ fontSize: 12, color: theme.colors.error, marginRight: 8 }}>Spoilers?</Text>
                    <Switch value={hasSpoilers} onValueChange={setHasSpoilers} color={theme.colors.error} />
                </View>
            </View>
            
            <TextInput
              mode="outlined"
              placeholder="Escreva sua opinião..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={{ backgroundColor: theme.colors.background }}
            />
            <Text style={{ textAlign: 'right', fontSize: 10, color: theme.colors.secondary, marginTop: 4 }}>
              {comment.length}/500
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button mode="outlined" onPress={onDismiss} style={{ flex: 1, marginRight: 8 }}>Cancelar</Button>
          <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={mediaType === 'tv' && !selectedEpisodeId} style={{ flex: 1 }}>Enviar</Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: { margin: 16, borderRadius: 12, maxHeight: '90%', flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#333' },
  content: { paddingHorizontal: 16 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 4, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  catLabel: { fontWeight: '600' },
  detailedBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 },
  commentSection: { marginBottom: 20 },
  footer: { padding: 16, flexDirection: 'row', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  selectorsContainer: { marginTop: 16 }
});