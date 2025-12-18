import React, { useState, useContext, useEffect, useMemo } from "react";
import { View, ScrollView, StyleSheet, Image, Dimensions, TouchableOpacity, StatusBar, Linking, Modal, TextInput, Alert } from "react-native";
import { Text, useTheme, ActivityIndicator, IconButton, Button, Divider, Menu, Surface } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useEpisodeDetails } from "../hooks/useEpisodeDetails";
import { formatDate, getMediaImageUrl, getMediaYear, getRatings } from "../utils/helpers";
import { AuthContext } from "../context/AuthContext";
import { api } from "../services/api";

import ReviewStatsCard from "../components/ReviewStats";
import ReviewCard from "../components/ReviewCard";
import WriteReviewModal from "../components/WriteReviewModal";
import ShareReviewModal from "../components/ShareReviewModal";

import { Review, ReviewStats } from "../types/Review";
import { MediaImage } from "../types/Interactions";

const { width, height } = Dimensions.get("window");

export default function EpisodeDetailsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useContext(AuthContext);

  const { slug, seasonNumber, episodeNumber } = route.params;

  const {
    episode, previous, next, loading, actionLoading,
    toggleWatched, rateEpisode
  } = useEpisodeDetails(slug, seasonNumber, episodeNumber);

  const [activeTab, setActiveTab] = useState("about");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MediaImage | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  const [castSearch, setCastSearch] = useState("");
  const [crewSearch, setCrewSearch] = useState("");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [justCreatedReview, setJustCreatedReview] = useState<Review | null>(null);

  const navigateToEpisode = (ep: any) => {
    setActiveTab("about");
    setReviews([]);
    setReviewStats(null);
    setReviewsPage(1);

    navigation.replace("EpisodeDetails", {
      slug,
      seasonNumber: ep.season_number,
      episodeNumber: ep.episode_number
    });
  };

  const openImageModal = (image: MediaImage) => { setSelectedImage(image); setIsImageModalVisible(true); };
  const closeImageModal = () => { setIsImageModalVisible(false); setSelectedImage(null); };

  const fetchReviewsData = async (page = 1) => {
    if (!episode?.id) return;
    if (page === 1) setReviewsLoading(true);

    try {
      const promises: Promise<any>[] = [
        api.get(`https://api.wikinerd.com.br/api/episodes/${episode.id}/reviews?page=${page}`)
      ];

      if (page === 1) {
        promises.push(api.get(`https://api.wikinerd.com.br/api/episodes/${episode.id}/reviews/stats`));
      }

      const results = await Promise.all(promises);
      const reviewsResponse = results[0].data;

      if (page === 1) {
        setReviews(reviewsResponse.data);
        if (results[1]) setReviewStats(results[1].data);
      } else {
        setReviews(prev => [...prev, ...reviewsResponse.data]);
      }

      setHasMoreReviews(reviewsResponse.meta.current_page < reviewsResponse.meta.last_page);
      setReviewsPage(page);

    } catch (error) {
      console.log("Erro ao carregar reviews do episódio", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleLoadMoreReviews = () => {
    if (!reviewsLoading && hasMoreReviews) {
      fetchReviewsData(reviewsPage + 1);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0 && episode) {
      fetchReviewsData();
    }
  }, [activeTab, episode]);

  const handleDeleteReview = (id: string) => {
    Alert.alert("Excluir", "Deseja realmente excluir sua avaliação?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/users/episode/review/${id}`);
            setReviews(prev => prev.filter(r => r.review_id !== id));
            if (episode?.id) {
              api.get(`https://api.wikinerd.com.br/api/episodes/${episode.id}/reviews/stats`)
                .then(res => setReviewStats(res.data));
            }
          } catch (error) {
            Alert.alert("Erro", "Não foi possível excluir a avaliação.");
          }
        }
      }
    ]);
  };

  const handleReviewSuccess = (newReview: any) => {
    const currentUserInfo = user || { id: newReview.user_id, name: "Usuário", username: "usuario", avatar: null };
    const fullReview: Review = { ...newReview, review_id: newReview.id, user: currentUserInfo, feedback_counts: { useful: 0, not_useful: 0, report: 0, total: 0 }, user_feedback: null };
    setReviews(prev => [fullReview, ...prev]);

    if (episode?.id) {
      api.get(`https://api.wikinerd.com.br/api/episodes/${episode.id}/reviews/stats`).then(res => setReviewStats(res.data));
    }
    setJustCreatedReview(fullReview);
    setTimeout(() => setShareModalVisible(true), 500);
  };

  const handleShareExistingReview = (reviewToShare: Review) => {
    setJustCreatedReview(reviewToShare);
    setShareModalVisible(true);
  };

  const filteredCast = useMemo(() => {
    if (!episode?.cast) return [];
    if (!castSearch) return episode.cast;
    return episode.cast.filter((c: any) => c.name.toLowerCase().includes(castSearch.toLowerCase()) || c.character.toLowerCase().includes(castSearch.toLowerCase()));
  }, [episode, castSearch]);

  const filteredCrew = useMemo(() => {
    if (!episode?.crew) return [];
    if (!crewSearch) return episode.crew;
    return episode.crew.filter((c: any) => c.name.toLowerCase().includes(crewSearch.toLowerCase()) || c.job.toLowerCase().includes(crewSearch.toLowerCase()));
  }, [episode, crewSearch]);

  const directors = useMemo(() => {
    if (!episode?.crew) return [];
    return episode.crew.filter((c: any) => c.job === "Director");
  }, [episode]);

  const writers = useMemo(() => {
    if (!episode?.crew) return [];
    return episode.crew.filter((c: any) => c.job === "Writer" || c.job === "Screenplay");
  }, [episode]);

  const { normalizedRatings, average } = useMemo(() => {
    return getRatings(episode, 'tv');
  }, [episode]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!episode) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onBackground }}>Episódio não encontrado.</Text>
      </View>
    );
  }

  const isWatched = !!episode.watched_date;
  const feedback = episode.user_feedback;

  const getFeedbackIcon = () => {
    switch (feedback) {
      case 'liked': return 'thumb-up';
      case 'not_like': return 'thumb-down';
      case 'favorite': return 'star';
      default: return 'star-outline';
    }
  };

  const getFeedbackColor = () => {
    switch (feedback) {
      case 'liked': return '#22c55e';
      case 'not_like': return '#ef4444';
      case 'favorite': return '#eab308';
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const renderTabButton = (key: string, label: string) => (
    <TouchableOpacity onPress={() => setActiveTab(key)}>
      <Text style={[
        key === activeTab ? styles.tabActive : styles.tabInactive,
        {
          backgroundColor: key === activeTab ? theme.colors.surfaceVariant : 'transparent',
          color: key === activeTab ? theme.colors.onSurface : theme.colors.onSurfaceVariant
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <View style={styles.imageHeader}>
          <Image
            source={{ uri: episode.still_path?.tmdb ? `https://image.tmdb.org/t/p/w780${episode.still_path.tmdb}` : undefined }}
            style={styles.backdrop}
            resizeMode="cover"
          />
          <View style={styles.overlay} />

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.showTitle}>{episode.tv_show.title}</Text>
            <Text style={styles.episodeTitle}>{episode.title}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={styles.seasonBadge}>
              <Text style={styles.seasonText}>S{episode.season_number} E{episode.episode_number}</Text>
            </View>
            <Text style={[styles.metaText, { color: theme.colors.secondary }]}>
              {formatDate(episode.air_date)} • {episode.runtime} min
            </Text>
          </View>

          {user ? (
            <View style={[styles.actionsRow, { borderColor: theme.colors.outlineVariant }]}>
              <Button
                mode={isWatched ? "contained" : "outlined"}
                onPress={toggleWatched}
                loading={actionLoading}
                icon={isWatched ? "check" : "eye-outline"}
                style={{ flex: 1, marginRight: 8 }}
              >
                {isWatched ? "Visto" : "Marcar Visto"}
              </Button>

              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon={getFeedbackIcon()}
                    iconColor={getFeedbackColor()}
                    mode="outlined"
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                <Menu.Item onPress={() => { setMenuVisible(false); rateEpisode("liked"); }} title="Gostei" leadingIcon="thumb-up" />
                <Menu.Item onPress={() => { setMenuVisible(false); rateEpisode("not_like"); }} title="Não gostei" leadingIcon="thumb-down" />
                <Menu.Item onPress={() => { setMenuVisible(false); rateEpisode("favorite"); }} title="Favorito" leadingIcon="star" />
                <Divider />
                <Menu.Item onPress={() => { setMenuVisible(false); rateEpisode(null); }} title="Remover" leadingIcon="close" />
              </Menu>
            </View>
          ) : (
            <View style={styles.container}>
              <Surface style={[styles.guestContainer, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
                <View style={styles.guestIconContainer}>
                  <Icon name="account-lock-outline" size={24} color={theme.colors.onSecondaryContainer} />
                </View>

                <View style={styles.guestTextContainer}>
                  <Text variant="titleSmall" style={{ fontWeight: 'bold', color: theme.colors.onSecondaryContainer }}>
                    Faça login para interagir
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.8 }}>
                    Marque como assistido, avalie e crie listas.
                  </Text>
                </View>

                <Button
                  mode="contained"
                  compact
                  onPress={() => navigation.navigate("Login")}
                  style={{ marginLeft: 8 }}
                >
                  Entrar
                </Button>
              </Surface>
            </View>
          )}

          <View style={[styles.section, { borderTopColor: theme.colors.outlineVariant, marginTop: 0 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
              {renderTabButton("about", "Sobre")}
              {renderTabButton("cast", "Elenco")}
              {renderTabButton("crew", "Equipe")}
              {renderTabButton("images", "Imagens")}
              {renderTabButton("videos", "Vídeos")}
              {renderTabButton("reviews", "Avaliações")}
            </ScrollView>

            {activeTab === "about" && (
              <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Sinopse</Text>
                <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant }]}>
                  {episode.overview || "Sem descrição disponível."}
                </Text>

                <View style={styles.crewContainer}>
                  {directors.length > 0 && (
                    <View style={styles.crewItem}>
                      <Text style={[styles.crewLabel, { color: theme.colors.secondary }]}>Direção</Text>
                      <Text style={{ color: theme.colors.onSurface }}>{directors.map((d: any) => d.name).join(", ")}</Text>
                    </View>
                  )}
                  {writers.length > 0 && (
                    <View style={styles.crewItem}>
                      <Text style={[styles.crewLabel, { color: theme.colors.secondary }]}>Roteiro</Text>
                      <Text style={{ color: theme.colors.onSurface }}>{writers.map((w: any) => w.name).join(", ")}</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                  <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Notas da Crítica</Text>
                  {normalizedRatings.map((item) => (
                    <TouchableOpacity key={item.platform} style={styles.contentRow} onPress={() => Linking.openURL(item.link)} disabled={item.link === '#'} activeOpacity={0.7}>
                      <View style={[styles.scoreBox, { backgroundColor: item.color, marginRight: 12, minWidth: 48, alignItems: 'center' }]}>
                        <Text style={styles.scoreText}>{item.platform === 'Rotten Tomatoes' || item.platform === 'Metacritic' ? item.rating.toFixed(0) + '%' : item.rating.toFixed(1)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>{item.label}</Text>
                        <Text style={[styles.infoSubtitle, { color: theme.colors.secondary }]}>{item.status}</Text>
                      </View>
                      <Icon name="open-in-new" size={20} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  ))}
                  {normalizedRatings.length > 0 && <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />}
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.infoSubtitle, { color: theme.colors.secondary }]}>Média da Crítica</Text>
                    <Text style={[styles.bigScore, { color: theme.colors.onSurface }]}>{average ? `${average}/5` : '-'}</Text>
                  </View>
                </View>

                <View style={styles.navContainer}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    {previous && (
                      <Button
                        mode="outlined"
                        onPress={() => navigateToEpisode(previous)}
                        icon="arrow-left"
                        compact
                      >
                        Anterior
                      </Button>
                    )}
                  </View>
                  <View style={{ flex: 1, paddingLeft: 8 }}>
                    {next && (
                      <Button
                        mode="outlined"
                        onPress={() => navigateToEpisode(next)}
                        icon="arrow-right"
                        contentStyle={{ flexDirection: 'row-reverse' }}
                        compact
                      >
                        Próximo
                      </Button>
                    )}
                  </View>
                </View>
              </View>
            )}

            {activeTab === "cast" && (
              <View>
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant }]}
                  placeholder="Buscar elenco..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={castSearch}
                  onChangeText={setCastSearch}
                />
                <View style={styles.gridContainer}>
                  {filteredCast.map((person: any) => (
                    <View key={person.id + person.character} style={styles.gridItem}>
                      {person.profile_path?.tmdb ? (
                        <Image source={{ uri: `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` }} style={styles.gridImage} />
                      ) : (
                        <View style={[styles.gridImage, { justifyContent: 'center', alignItems: 'center' }]}>
                          <Icon name="account" size={40} color={theme.colors.onSurfaceVariant} />
                        </View>
                      )}
                      <Text numberOfLines={1} style={[styles.gridName, { color: theme.colors.onSurface }]}>{person.name}</Text>
                      <Text numberOfLines={1} style={[styles.gridRole, { color: theme.colors.secondary }]}>{person.character}</Text>
                    </View>
                  ))}
                  {filteredCast.length === 0 && <Text style={{ color: theme.colors.secondary }}>Nenhum membro do elenco encontrado.</Text>}
                </View>
              </View>
            )}

            {activeTab === "crew" && (
              <View>
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant }]}
                  placeholder="Buscar equipe..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={crewSearch}
                  onChangeText={setCrewSearch}
                />
                <View style={styles.gridContainer}>
                  {filteredCrew.map((person: any) => (
                    <View key={person.id + person.job + person.name} style={styles.gridItem}>
                      {person.profile_path?.tmdb ? (
                        <Image source={{ uri: `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` }} style={styles.gridImage} />
                      ) : (
                        <View style={[styles.gridImage, { justifyContent: 'center', alignItems: 'center' }]}>
                          <Icon name="account-cog" size={40} color={theme.colors.onSurfaceVariant} />
                        </View>
                      )}
                      <Text numberOfLines={1} style={[styles.gridName, { color: theme.colors.onSurface }]}>{person.name}</Text>
                      <Text numberOfLines={1} style={[styles.gridRole, { color: theme.colors.secondary }]}>{person.job}</Text>
                    </View>
                  ))}
                  {filteredCrew.length === 0 && <Text style={{ color: theme.colors.secondary }}>Nenhum membro da equipe encontrado.</Text>}
                </View>
              </View>
            )}

            {activeTab === "images" && (
              <View style={styles.imagesGrid}>
                {episode.images?.map((img: MediaImage, idx: number) => (
                  <TouchableOpacity key={img.id || idx} style={styles.galleryImageContainer} onPress={() => openImageModal(img)}>
                    <Image source={{ uri: `https://image.tmdb.org/t/p/w500${img.file_path}` }} style={styles.galleryImage} />
                  </TouchableOpacity>
                ))}
                {(!episode.images || episode.images.length === 0) && <Text style={{ color: theme.colors.secondary }}>Nenhuma imagem disponível.</Text>}
              </View>
            )}

            {activeTab === "videos" && (
              <View>
                {episode.videos?.map((vid: any) => (
                  <TouchableOpacity key={vid.id} style={[styles.videoItem, { backgroundColor: theme.colors.surface }]} onPress={() => vid.site === "YouTube" && Linking.openURL(`https://www.youtube.com/watch?v=${vid.key}`)}>
                    <Image source={{ uri: `https://img.youtube.com/vi/${vid.key}/0.jpg` }} style={styles.videoThumbnail} />
                    <View style={styles.videoInfo}>
                      <Text style={[styles.videoName, { color: theme.colors.onSurface }]}>{vid.name}</Text>
                      <Text style={[styles.videoType, { color: theme.colors.secondary }]}>{vid.type}</Text>
                    </View>
                    <Icon name="play-circle" size={30} color={theme.colors.primary} />
                  </TouchableOpacity>
                ))}
                {(!episode.videos || episode.videos.length === 0) && <Text style={{ color: theme.colors.secondary }}>Nenhum vídeo disponível.</Text>}
              </View>
            )}

            {activeTab === "reviews" && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground, marginBottom: 0 }]}>Avaliações</Text>
                  {user && (
                    <Button mode="contained" onPress={() => setWriteModalVisible(true)} compact>Escrever</Button>
                  )}
                </View>

                {reviewStats && <ReviewStatsCard stats={reviewStats} />}

                {reviews.map(review => (
                  <ReviewCard key={review.review_id} review={review} onDelete={handleDeleteReview} onShare={handleShareExistingReview} />
                ))}

                {reviews.length === 0 && !reviewsLoading && (
                  <Text style={{ textAlign: 'center', marginVertical: 20, color: theme.colors.secondary }}>Seja o primeiro a avaliar este episódio!</Text>
                )}

                {hasMoreReviews && <Button mode="outlined" onPress={handleLoadMoreReviews} loading={reviewsLoading}>Carregar mais</Button>}
              </View>
            )}

          </View>
        </View>
      </ScrollView>

      <Modal visible={isImageModalVisible} transparent={true} onRequestClose={closeImageModal} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={closeImageModal}>
            {selectedImage && <Image source={{ uri: `https://image.tmdb.org/t/p/original${selectedImage.file_path}` }} style={styles.fullscreenImage} resizeMode="contain" />}
            <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}><Icon name="close-circle" size={40} color="rgba(255,255,255,0.8)" /></TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>

      {episode && <WriteReviewModal
        visible={writeModalVisible}
        onDismiss={() => setWriteModalVisible(false)}
        onSubmitSuccess={handleReviewSuccess}
        mediaId={episode.id}
        mediaTitle={`S${episode.season_number}E${episode.episode_number}: ${episode.title}`}
        mediaType="episode"
      />}

      {episode && justCreatedReview && <ShareReviewModal
        visible={shareModalVisible}
        onDismiss={() => setShareModalVisible(false)}
        title={`${episode.tv_show.title} | ${episode.title}`}
        subtitle={`S${episode.season_number}E${episode.episode_number} • ${getMediaYear(episode)}`}
        image={getMediaImageUrl(episode.still_path)}
        review={justCreatedReview}
      />}

    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageHeader: {
    height: 250,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  headerContent: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  showTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  episodeTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  seasonBadge: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  seasonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  metaText: {
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
    marginBottom: 16,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  // Crew
  crewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  crewItem: {
    marginRight: 24,
    marginBottom: 8,
  },
  crewLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Ratings Card Styles
  cardContainer: { marginHorizontal: 0, marginTop: 24, borderRadius: 8, padding: 16, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  contentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  scoreBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  scoreText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  infoTitle: { fontWeight: 'bold', fontSize: 14 },
  infoSubtitle: { fontSize: 12 },
  divider: { marginVertical: 12 },
  bigScore: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },

  // Tab Styles
  tabBar: { flexDirection: 'row', marginBottom: 16, paddingHorizontal: 4 },
  tabActive: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, fontWeight: 'bold', marginRight: 8, overflow: 'hidden' },
  tabInactive: { paddingVertical: 6, paddingHorizontal: 12, marginRight: 8 },

  // Grid Styles
  searchInput: { padding: 10, borderRadius: 8, marginBottom: 16 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 16, alignItems: 'center' },
  gridImage: { width: '100%', height: 180, borderRadius: 8, marginBottom: 4, backgroundColor: '#333', resizeMode: 'cover' },
  gridName: { fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  gridRole: { fontSize: 12, textAlign: 'center' },

  // Images Tab
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryImageContainer: { width: (width - 48) / 3, height: 80, borderRadius: 4, marginBottom: 4 },
  galleryImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 4 },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalCloseArea: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  fullscreenImage: { width: width, height: height },
  closeButton: { position: 'absolute', top: 50, right: 25, zIndex: 10 },

  // Video Styles
  videoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderRadius: 8, padding: 8 },
  videoThumbnail: { width: 120, height: 68, borderRadius: 4 },
  videoInfo: { flex: 1, marginLeft: 12 },
  videoName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  videoType: { fontSize: 12 },

  guestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  guestIconContainer: {
    marginRight: 12,
  },
  guestTextContainer: {
    flex: 1,
  },
});