import React, { useState, useContext, useEffect, useMemo } from "react";
import { ScrollView, View, StyleSheet, StatusBar, TouchableOpacity, Linking, Modal, FlatList, Share, Image, Dimensions, TextInput, Alert } from "react-native";
import { Text, ActivityIndicator, Chip, Divider, useTheme, Button, Menu } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useMediaDetails } from "../hooks/useMediaDetails";
import { getCertificationColor, formatCurrency, getSocialData } from "../utils/helpers";
import { Country, Language } from "../types/Movie";
import { MediaImage } from "../types/Interactions";
import { AuthContext } from "../context/AuthContext";
import { api } from "../services/api";

import MediaCard from "../components/MediaCard";
import AddToListModal from "../components/AddToListModal";
import MediaHeader from "../components/MediaHeader";
import MediaActionButtons from "../components/MediaActionButtons";
import ReviewStatsCard from "../components/ReviewStats";
import ReviewCard from "../components/ReviewCard";
import WriteReviewModal from "../components/WriteReviewModal";
import ShareReviewModal from "../components/ShareReviewModal";
import EpisodeItem from "../components/EpisodeItem";
import { Review, ReviewStats } from "../types/Review";

const { width, height } = Dimensions.get("window");

export default function MediaDetailsScreen({ route }: any) {
  const { slug, type = 'movie' } = route.params;
  const isTv = type === 'tv';
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const {
    media, providers, cast, crew, images, videos, collectionData,
    userInteraction, loading, interactionLoading, seasonLoading, normalizedRatings, average,
    handleInteraction, markSeasonWatched, unmarkSeasonWatched, toggleEpisodeWatched, rateEpisode
  } = useMediaDetails(slug, type);

  const [activeTab, setActiveTab] = useState("about");
  const [selectedImage, setSelectedImage] = useState<MediaImage | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [showAllProviders, setShowAllProviders] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [justCreatedReview, setJustCreatedReview] = useState<Review | null>(null);

  // Filtros Reviews
  const [filterReviewSeason, setFilterReviewSeason] = useState<number | 'all'>('all');
  const [filterReviewEpisode, setFilterReviewEpisode] = useState<number | 'all'>('all');

  // Search Cast/Crew
  const [castSearch, setCastSearch] = useState("");
  const [crewSearch, setCrewSearch] = useState("");

  // TV Specific
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [showSeasonMenu, setShowSeasonMenu] = useState(false);

  const openImageModal = (image: MediaImage) => { setSelectedImage(image); setIsImageModalVisible(true); };
  const closeImageModal = () => { setIsImageModalVisible(false); setSelectedImage(null); };

  const handleShare = async () => {
    if (!media) return;
    const urlType = isTv ? 'series' : 'filmes';
    try {
      await Share.share({
        message: `Confira "${media.title}" no WikiNerd!\nhttps://wikinerd.com.br/${urlType}/${slug}`,
        url: `https://wikinerd.com.br/${urlType}/${slug}`,
        title: `WikiNerd: ${media.title}`
      });
    } catch (error: any) { console.log("Erro ao compartilhar:", error.message); }
  };

  const handleShareExistingReview = (reviewToShare: Review) => {
    setJustCreatedReview(reviewToShare);
    setShareModalVisible(true);
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

  const availableSections = [
    { title: "Streaming", data: providers.filter(p => p.type === 'flatrate'), type: "flatrate" },
    { title: "Comprar", data: providers.filter(p => p.type === 'buy'), type: "buy" },
    { title: "Alugar", data: providers.filter(p => p.type === 'rent'), type: "rent" }
  ].filter(s => s.data.length > 0);
  const remainingOptionsCount = Math.max(0, availableSections.length - 1);

  const fetchReviewsData = async (page = 1) => {
    if (!media?.id) return;
    if (page === 1) setReviewsLoading(true);

    try {
      const endpoint = isTv ? 'tv-shows' : 'movies';
      const promises: Promise<any>[] = [
        api.get(`https://api.wikinerd.com.br/api/${endpoint}/${media.id}/reviews?page=${page}`)
      ];

      if (page === 1) {
        promises.push(api.get(`https://api.wikinerd.com.br/api/${endpoint}/${media.id}/reviews/stats`));
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
      console.log("Erro ao carregar reviews", error);
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
    if (activeTab === 'reviews' && reviews.length === 0) {
      fetchReviewsData();
    }
  }, [activeTab, media]);

  const handleDeleteReview = (id: string) => {
    const endpoint = isTv ? 'tv-show' : 'movie';
    Alert.alert("Excluir", "Deseja realmente excluir sua avaliação?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/users/${endpoint}/review/${id}`);
            setReviews(prev => prev.filter(r => r.review_id !== id));
            if (media?.id) {
              const ep = isTv ? 'tv-shows' : 'movies';
              api.get(`https://api.wikinerd.com.br/api/${ep}/${media.id}/reviews/stats`)
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

    if (media?.id) {
      const ep = isTv ? 'tv-shows' : 'movies';
      api.get(`https://api.wikinerd.com.br/api/${ep}/${media.id}/reviews/stats`).then(res => setReviewStats(res.data));
    }
    setJustCreatedReview(fullReview);
    setTimeout(() => setShareModalVisible(true), 500);
  };

  // Helpers de Equipe/Elenco Filtrados
  const filteredCast = useMemo(() => {
    if (!castSearch) return cast;
    return cast.filter(c => c.name.toLowerCase().includes(castSearch.toLowerCase()) || c.character.toLowerCase().includes(castSearch.toLowerCase()));
  }, [cast, castSearch]);

  const filteredCrew = useMemo(() => {
    if (!crewSearch) return crew;
    return crew.filter(c => c.name.toLowerCase().includes(crewSearch.toLowerCase()) || (isTv ? c.job : c.job.job).toLowerCase().includes(crewSearch.toLowerCase()));
  }, [crew, crewSearch]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!media) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onBackground }}>Conteúdo não encontrado.</Text>
      </View>
    );
  }

  const currentSeason = isTv ? (media as any).seasons?.find((s: any) => s.season_number === selectedSeasonNumber) : null;
  const sortedSeasons = isTv ? [...((media as any).seasons || [])].sort((a: any, b: any) => a.season_number - b.season_number) : [];

  const isSeasonFullyWatched = currentSeason?.episodes?.length > 0
    ? currentSeason.episodes.every((ep: any) => !!ep.watched_date)
    : false;

  const getCrewByJob = (jobs: string[]) => {
    if (isTv) {
      return crew.filter(c => jobs.includes(c.job)).slice(0, 5).map(c => c.name).join(", ");
    }
    return crew.filter(c => jobs.includes(c.job.job)).map(c => c.name).join(", ");
  }
  const photography = getCrewByJob(["Director of Photography", "Cinematography"]);
  const music = getCrewByJob(["Original Music Composer", "Music"]);
  const producers = crew.filter(c => c.job.job === "Producer").slice(0, 3).map(c => c.name).join(", ");
  const directors = getCrewByJob(["Director"]);
  const writers = getCrewByJob(["Screenplay", "Writer", "Story"]);
  const creators = isTv ? (media as any).creators?.map((c: any) => c.name).join(", ") : null;

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

        <MediaHeader media={media} handleShare={handleShare} />

        <MediaActionButtons
          userInteraction={userInteraction}
          onInteraction={handleInteraction}
          onAddList={() => setListModalVisible(true)}
          loading={interactionLoading}
          isTv={isTv}
        />

        <View style={styles.genresContainer}>
          {media.genres?.map((g) => (
            <Chip key={g.id} style={[styles.genreChip, { backgroundColor: theme.colors.surfaceVariant }]} textStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>{g.name}</Chip>
          ))}
        </View>

        <View style={[styles.section, { borderTopColor: theme.colors.outlineVariant }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
            {renderTabButton("about", "Sobre")}
            {isTv && renderTabButton("episodes", "Episódios")}
            {renderTabButton("cast", "Elenco")}
            {renderTabButton("crew", "Equipe")}
            {renderTabButton("images", "Imagens")}
            {renderTabButton("videos", "Vídeos")}
            {renderTabButton("reviews", "Avaliações")}
          </ScrollView>

          {activeTab === "about" && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Sinopse</Text>
              <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant }]}>{media.overview || "Sem sinopse."}</Text>

              {isTv && creators && (
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 4 }]}>Criação</Text>
                  <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant }]}>{creators}</Text>
                </View>
              )}

              {directors.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 4 }]}>Direção</Text>
                  <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant }]}>{directors}</Text>
                </View>
              )}

              {writers.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.sectionTitle, { fontSize: 16, marginBottom: 4 }]}>Roteiro</Text>
                  <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant }]}>{writers}</Text>
                </View>
              )}

              <View style={styles.innerSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Informações Técnicas</Text>
                <View style={styles.techGrid}>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>País de Origem</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{media.countries?.map((c: Country) => c.name).join(', ') || "N/A"}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Idioma Original</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{media.languages?.map((l: Language) => l.name).join(', ') || "N/A"}</Text></View>
                  {!isTv && (
                    <>
                      <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Orçamento</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{formatCurrency((media as any).budget)}</Text></View>
                      <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Bilheteria</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{formatCurrency((media as any).revenue)}</Text></View>
                    </>
                  )}
                  {isTv && (
                    <>
                      <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Temporadas</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{(media as any).number_of_seasons}</Text></View>
                      <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Episódios</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{(media as any).number_of_episodes}</Text></View>
                    </>
                  )}
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Status</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{media.status}</Text></View>
                  {!isTv && (
                    <>
                      <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Conteúdo Adulto</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{media.adult_content ? 'Sim' : 'Não'}</Text></View>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.innerSection}>
                <View style={styles.providersHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Onde Assistir</Text>
                  {remainingOptionsCount > 0 && (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAllProviders(!showAllProviders)}>
                      <View style={[styles.seeMoreBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                        <Text style={[styles.seeMoreText, { color: theme.colors.onSurface }]}>
                          {showAllProviders ? "Mostrar menos" : `Ver mais ${remainingOptionsCount} opções`}
                        </Text>
                        <Icon name={showAllProviders ? "chevron-up" : "chevron-down"} size={16} color={theme.colors.onSurface} style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                {availableSections.length > 0 ? (
                  availableSections.map((section, index) => {
                    if (index === 0 || showAllProviders) {
                      return (
                        <View key={section.type} style={{ marginBottom: 16 }}>
                          <Text style={[styles.providerSubTitle, { color: theme.colors.secondary }]}>{section.title}</Text>
                          <View style={styles.providersGrid}>
                            {section.data.map((prov, idx) => (
                              <View key={`${prov.id}-${prov.type}-${idx}`} style={styles.providerItem}>
                                <Image source={{ uri: `https://image.tmdb.org/t/p/w92${prov.logo_path.tmdb}` }} style={styles.providerLogo} />
                                <Text style={[styles.providerName, { color: theme.colors.onBackground }]} numberOfLines={2}>{prov.name}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })
                ) : (
                  <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>Nenhum serviço encontrado.</Text>
                )}
              </View>

              {collectionData && (
                <View style={styles.innerSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Filmes da Coleção</Text>
                  <Text style={[styles.providerSubTitle, { marginBottom: 8, color: theme.colors.secondary }]}>{collectionData.name}</Text>
                  <FlatList
                    data={collectionData.movies.filter(m => m.id !== media.id)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <MediaCard media={item} />}
                    contentContainerStyle={{ paddingVertical: 8 }}
                  />
                </View>
              )}

              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Classificação Etária</Text>
                <View style={styles.contentRow}>
                  <View style={[styles.largeCertBadge, { backgroundColor: media.certification ? getCertificationColor(media.certification) : "#666" }]}>
                    <Text style={styles.largeCertText}>{media.certification || "?"}</Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>ClassInd</Text>
                    <Text style={[styles.infoSubtitle, { color: theme.colors.secondary }]}>{media.certification ? `${media.certification} anos` : "Não informado"}</Text>
                  </View>
                </View>
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

              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Links Externos</Text>
                {media.external_ids?.map((item) => {
                  const { icon, color, label, url } = getSocialData(item.platform);
                  return (
                    <TouchableOpacity key={item.platform} style={styles.linkRow} onPress={() => Linking.openURL(`${url}${item.external_id}`)}>
                      <View style={[styles.linkIconBox, { backgroundColor: color }]}>
                        <Icon name={icon} size={16} color="white" />
                      </View>
                      <Text style={[styles.linkText, { color: theme.colors.onSurface }]}>{label}</Text>
                      <Icon name="open-in-new" size={16} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {media.keywords && media.keywords.length > 0 && (
                <View style={styles.innerSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Palavras-chave</Text>
                  <View style={styles.keywordContainer}>
                    {media.keywords.map(k => (<View key={k.id} style={[styles.keywordBadge, { borderColor: theme.colors.outline }]}><Text style={[styles.keywordText, { color: theme.colors.onBackground }]}>{k.name}</Text></View>))}
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === "episodes" && isTv && (
            <View>
              <View style={styles.seasonHeader}>
                <Menu
                  visible={showSeasonMenu}
                  onDismiss={() => setShowSeasonMenu(false)}
                  anchor={
                    <Button 
                        mode="outlined" 
                        onPress={() => setShowSeasonMenu(true)} 
                        icon="chevron-down" 
                        contentStyle={{ flexDirection: 'row-reverse' }}
                    >
                      {currentSeason ? currentSeason.title : "Selecionar Temporada"}
                    </Button>
                  }
                >
                  {sortedSeasons.map((season: any) => (
                    <Menu.Item
                      key={season.id}
                      onPress={() => { 
                        setShowSeasonMenu(false); 
                        setTimeout(() => setSelectedSeasonNumber(season.season_number), 250);
                      }}
                      title={season.title}
                    />
                  ))}
                </Menu>

                {user && currentSeason && (
                  <Button
                    mode="contained"
                    compact
                    onPress={() => isSeasonFullyWatched ? unmarkSeasonWatched(currentSeason.id) : markSeasonWatched(currentSeason.id)}
                    loading={seasonLoading}
                    buttonColor={isSeasonFullyWatched ? theme.colors.error : theme.colors.primary}
                  >
                    {isSeasonFullyWatched ? "Desmarcar Todos" : "Marcar Todos"}
                  </Button>
                )}
              </View>

              {currentSeason?.episodes?.length ? (
                currentSeason.episodes.map((episode: any) => (
                  <EpisodeItem
                    key={episode.id}
                    episode={episode}
                    serieSlug={slug}
                    onToggleWatched={toggleEpisodeWatched}
                    onRate={rateEpisode}
                  />
                ))
              ) : (
                <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.secondary }}>Nenhum episódio encontrado.</Text>
              )}
            </View>
          )}

          {activeTab === "cast" && (
            <View>
              <TextInput style={[styles.searchInput, { color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant }]} placeholder="Buscar..." placeholderTextColor={theme.colors.onSurfaceVariant} value={castSearch} onChangeText={setCastSearch} />
              <View style={styles.gridContainer}>
                {filteredCast.map(person => (
                  <View key={person.id + person.character} style={styles.gridItem}>
                    <Image source={{ uri: person.profile_path?.tmdb ? `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` : undefined }} style={styles.gridImage} />
                    <Text numberOfLines={1} style={[styles.gridName, { color: theme.colors.onSurface }]}>{person.name}</Text>
                    <Text numberOfLines={1} style={[styles.gridRole, { color: theme.colors.secondary }]}>{person.character}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === "crew" && (
            <View>
              <TextInput style={[styles.searchInput, { color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant }]} placeholder="Buscar..." placeholderTextColor={theme.colors.onSurfaceVariant} value={crewSearch} onChangeText={setCrewSearch} />
              <View style={styles.gridContainer}>
                {filteredCrew.map(person => (
                  <View key={person.id + (isTv ? person.job : person.job.job)} style={styles.gridItem}>
                    <Image source={{ uri: person.profile_path?.tmdb ? `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` : undefined }} style={styles.gridImage} />
                    <Text numberOfLines={1} style={[styles.gridName, { color: theme.colors.onSurface }]}>{person.name}</Text>
                    <Text numberOfLines={1} style={[styles.gridRole, { color: theme.colors.secondary }]}>{isTv ? person.job : person.job.job}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === "images" && (
            <View style={styles.imagesGrid}>
              {images.map((img) => (
                <TouchableOpacity key={img.id} style={styles.galleryImageContainer} onPress={() => openImageModal(img)}>
                  <Image source={{ uri: `https://image.tmdb.org/t/p/w500${img.file_path}` }} style={styles.galleryImage} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "videos" && (
            <View>
              {videos.map((vid) => (
                <TouchableOpacity key={vid.id} style={[styles.videoItem, { backgroundColor: theme.colors.surface }]} onPress={() => vid.site === "YouTube" && Linking.openURL(`https://www.youtube.com/watch?v=${vid.key}`)}>
                  <Image source={{ uri: `https://img.youtube.com/vi/${vid.key}/0.jpg` }} style={styles.videoThumbnail} />
                  <View style={styles.videoInfo}>
                    <Text style={[styles.videoName, { color: theme.colors.onSurface }]}>{vid.name}</Text>
                    <Text style={[styles.videoType, { color: theme.colors.secondary }]}>{vid.type}</Text>
                  </View>
                  <Icon name="play-circle" size={30} color={theme.colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "reviews" && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground, marginBottom: 0 }]}>Avaliações</Text>
                <Button mode="contained" onPress={() => setWriteModalVisible(true)} compact>Escrever</Button>
              </View>

              {reviewStats && <ReviewStatsCard stats={reviewStats} />}

              {reviews.map(review => {
                if (filterReviewSeason !== 'all' && review.episode?.season_number !== filterReviewSeason) return null;
                return <ReviewCard key={review.review_id} review={review} onDelete={handleDeleteReview} onShare={handleShareExistingReview} />;
              })}

              {hasMoreReviews && <Button mode="outlined" onPress={handleLoadMoreReviews} loading={reviewsLoading}>Carregar mais</Button>}
            </View>
          )}
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

      {media && <AddToListModal visible={listModalVisible} onDismiss={() => setListModalVisible(false)} mediaId={media.id} mediaType={isTv ? "tv" : "movie"} mediaTitle={media.title} />}
      {media && <WriteReviewModal visible={writeModalVisible} onDismiss={() => setWriteModalVisible(false)} onSubmitSuccess={handleReviewSuccess} movieId={media.id} movieTitle={media.title} />}
      {media && justCreatedReview && <ShareReviewModal visible={shareModalVisible} onDismiss={() => setShareModalVisible(false)} movie={media as any} review={justCreatedReview} />}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  genresContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  genreChip: { height: 32 },
  section: { padding: 16, borderTopWidth: 1, marginTop: 16 },
  innerSection: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  bodyText: { lineHeight: 22, textAlign: 'justify' },
  tabBar: { flexDirection: 'row', marginBottom: 16, paddingHorizontal: 4 },
  tabActive: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, fontWeight: 'bold', marginRight: 8, overflow: 'hidden' },
  tabInactive: { paddingVertical: 6, paddingHorizontal: 12, marginRight: 8 },
  providersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  seeMoreBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  seeMoreText: { fontSize: 12, fontWeight: 'bold' },
  providerSubTitle: { fontSize: 14, marginBottom: 12 },
  providersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  providerItem: { width: 60, alignItems: 'center', marginBottom: 8 },
  providerLogo: { width: 50, height: 50, borderRadius: 8, marginBottom: 4, backgroundColor: '#333' },
  providerName: { fontSize: 10, textAlign: 'center', height: 30 },
  cardContainer: { marginHorizontal: 0, marginTop: 24, borderRadius: 8, padding: 16, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  contentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  largeCertBadge: { width: 40, height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  largeCertText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  infoTitle: { fontWeight: 'bold', fontSize: 14 },
  infoSubtitle: { fontSize: 12 },
  scoreBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  scoreText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  bigScore: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  divider: { marginVertical: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  linkIconBox: { width: 24, height: 24, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  linkText: { flex: 1, fontWeight: '500' },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  techItem: { width: '50%', paddingRight: 8 },
  techLabel: { fontSize: 12, marginBottom: 2 },
  techValue: { fontSize: 14, fontWeight: '500' },
  keywordContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordBadge: { backgroundColor: 'transparent', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  keywordText: { fontSize: 12 },
  searchInput: { padding: 10, borderRadius: 8, marginBottom: 16 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 16, alignItems: 'center' },
  gridImage: { width: '100%', height: 180, borderRadius: 8, marginBottom: 4, backgroundColor: '#333', resizeMode: 'cover' },
  gridName: { fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  gridRole: { fontSize: 12, textAlign: 'center' },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryImageContainer: { width: (width - 48) / 3, height: 80, borderRadius: 4, marginBottom: 4 },
  galleryImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 4 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalCloseArea: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  fullscreenImage: { width: width, height: height },
  closeButton: { position: 'absolute', top: 50, right: 25, zIndex: 10 },
  videoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderRadius: 8, padding: 8 },
  videoThumbnail: { width: 120, height: 68, borderRadius: 4 },
  videoInfo: { flex: 1, marginLeft: 12 },
  videoName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  videoType: { fontSize: 12 },
  metaText: { fontSize: 12 },
  seasonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
});