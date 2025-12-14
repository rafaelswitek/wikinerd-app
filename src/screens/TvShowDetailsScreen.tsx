import React, { useState, useContext, useEffect, useMemo } from "react";
import { ScrollView, View, StyleSheet, StatusBar, TouchableOpacity, Linking, Modal, Share, Image, Dimensions, FlatList, TextInput } from "react-native";
import { Text, ActivityIndicator, Chip, useTheme, Button, Divider, Menu } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTvShowDetails } from "../hooks/useTvShowDetails";
import { getCertificationColor, getSocialData } from "../utils/helpers";
import { Country, Language } from "../types/Movie";
import { MediaImage } from "../types/Interactions";
import { AuthContext } from "../context/AuthContext";

import AddToListModal from "../components/AddToListModal";
import MediaHeader from "../components/MediaHeader";
import MediaActionButtons from "../components/MediaActionButtons";
import EpisodeItem from "../components/EpisodeItem";
import { Review, ReviewStats } from "../types/Review";
import { api } from "../services/api";
import ReviewStatsCard from "../components/ReviewStats";
import ReviewCard from "../components/ReviewCard";
import WriteReviewModal from "../components/WriteReviewModal";
import ShareReviewModal from "../components/ShareReviewModal";

const { width, height } = Dimensions.get("window");

export default function TvShowDetailsScreen({ route }: any) {
  const { slug } = route.params;
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const {
    tvShow, providers, cast, crew, images, videos,
    userInteraction, loading, interactionLoading, seasonLoading,
    handleInteraction, markSeasonWatched, unmarkSeasonWatched, toggleEpisodeWatched
  } = useTvShowDetails(slug);

  const [activeTab, setActiveTab] = useState<"about" | "episodes" | "cast" | "crew" | "images" | "videos" | "reviews">("about");
  const [selectedImage, setSelectedImage] = useState<MediaImage | null>(null);

  // Estados Episódios
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [showSeasonMenu, setShowSeasonMenu] = useState(false);

  // Estados Busca Elenco/Equipe
  const [castSearch, setCastSearch] = useState("");
  const [crewSearch, setCrewSearch] = useState("");

  // Estados Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [justCreatedReview, setJustCreatedReview] = useState<Review | null>(null);
  const [filterReviewSeason, setFilterReviewSeason] = useState<number | 'all'>('all');
  const [filterReviewEpisode, setFilterReviewEpisode] = useState<number | 'all'>('all');

  // Modais
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [showAllProviders, setShowAllProviders] = useState(false);

  const openImageModal = (image: any) => { setSelectedImage(image); setIsImageModalVisible(true); };
  const closeImageModal = () => { setIsImageModalVisible(false); setSelectedImage(null); };

  const handleShare = async () => {
    if (!tvShow) return;
    try {
      await Share.share({
        message: `Confira "${tvShow.title}" no WikiNerd!\nhttps://wikinerd.com.br/series/${slug}`,
        url: `https://wikinerd.com.br/series/${slug}`,
        title: `WikiNerd: ${tvShow.title}`
      });
    } catch (error: any) { console.log("Erro ao compartilhar:", error.message); }
  };

  const renderTabButton = (key: typeof activeTab, label: string) => (
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

  // Dados filtrados
  const filteredCast = useMemo(() => {
    if (!castSearch) return cast;
    return cast.filter(c => c.name.toLowerCase().includes(castSearch.toLowerCase()) || c.character.toLowerCase().includes(castSearch.toLowerCase()));
  }, [cast, castSearch]);

  const filteredCrew = useMemo(() => {
    if (!crewSearch) return crew;
    return crew.filter(c => c.name.toLowerCase().includes(crewSearch.toLowerCase()) || c.job.toLowerCase().includes(crewSearch.toLowerCase()));
  }, [crew, crewSearch]);

  const currentSeason = useMemo(() => {
    return tvShow?.seasons.find(s => s.season_number === selectedSeasonNumber);
  }, [tvShow, selectedSeasonNumber]);

  const isSeasonFullyWatched = useMemo(() => {
    if (!currentSeason?.episodes || currentSeason.episodes.length === 0) return false;
    return currentSeason.episodes.every(ep => !!ep.watched_date);
  }, [currentSeason]);

  // Lógica de Reviews (simplificada baseada na de filmes, adaptada para filtros)
  const fetchReviewsData = async (page = 1) => {
    if (!tvShow?.id) return;
    if (page === 1) setReviewsLoading(true);

    try {
      let url = `https://api.wikinerd.com.br/api/movies/${tvShow.id}/reviews?page=${page}`; // Usando endpoint genérico ou específico de série se houver
      // Nota: Ajuste a URL para endpoint de reviews de séries se for diferente no seu backend, ex: /tv-shows/:id/reviews
      // O web usa getTVShowReviews, assumindo endpoint similar
      url = `https://api.wikinerd.com.br/api/tv-shows/${tvShow.id}/reviews?page=${page}`;

      const promises: Promise<any>[] = [api.get(url)];
      if (page === 1) promises.push(api.get(`https://api.wikinerd.com.br/api/tv-shows/${tvShow.id}/reviews/stats`));

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

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) fetchReviewsData();
  }, [activeTab]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (filterReviewSeason !== 'all' && r.episode?.season_number !== filterReviewSeason) return false;
      if (filterReviewEpisode !== 'all' && r.episode?.episode_number !== filterReviewEpisode) return false;
      return true;
    });
  }, [reviews, filterReviewSeason, filterReviewEpisode]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!tvShow) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text>Série não encontrada.</Text>
      </View>
    );
  }

  const creators = tvShow.creators?.map(c => c.name).join(", ");
  const sortedSeasons = [...(tvShow.seasons || [])].sort((a, b) => a.season_number - b.season_number);

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

        <MediaHeader media={tvShow} handleShare={handleShare} />

        <MediaActionButtons
          userInteraction={userInteraction}
          onInteraction={handleInteraction}
          onAddList={() => setListModalVisible(true)}
          loading={interactionLoading}
        />

        <View style={styles.genresContainer}>
          {tvShow.genres?.map((g) => (
            <Chip key={g.id} style={[styles.genreChip, { backgroundColor: theme.colors.surfaceVariant }]} textStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>{g.name}</Chip>
          ))}
        </View>

        <View style={[styles.section, { borderTopColor: theme.colors.outlineVariant }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
            {renderTabButton("about", "Sobre")}
            {renderTabButton("episodes", "Episódios")}
            {renderTabButton("cast", "Elenco")}
            {renderTabButton("crew", "Equipe")}
            {renderTabButton("images", "Imagens")}
            {renderTabButton("videos", "Vídeos")}
            {renderTabButton("reviews", "Avaliações")}
          </ScrollView>

          {activeTab === "about" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Sinopse</Text>
              <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant }]}>{tvShow.overview || "Sem sinopse."}</Text>

              {creators && (
                <View style={{ marginTop: 20 }}>
                  <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Criadores</Text>
                  <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant }]}>{creators}</Text>
                </View>
              )}

              <View style={styles.innerSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Informações da Série</Text>
                <View style={styles.techGrid}>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>País de Origem</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.countries && tvShow.countries.length > 0 ? tvShow.countries.map((c: Country) => c.name).join(', ') : "Desconhecido"}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Idioma Original</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.languages && tvShow.languages.length > 0 ? tvShow.languages.map((l: Language) => l.name).join(', ') : "Desconhecido"}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Temporadas</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.number_of_seasons}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Episódios</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.number_of_episodes}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Status</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.status}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Tipo</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{tvShow.type}</Text></View>
                </View>
              </View>

              <View style={styles.innerSection}>
                <View style={styles.providersHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Onde Assistir</Text>
                  {remainingOptionsCount > 0 && (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAllProviders(!showAllProviders)}>
                      <View style={[styles.seeMoreBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                        <Text style={[styles.seeMoreText, { color: theme.colors.onSurface }]}>
                          {showAllProviders ? "Mostrar menos" : `Ver mais ${remainingOptionsCount} opç${remainingOptionsCount > 1 ? 'ões' : 'ão'}`}
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
                  <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>Nenhum serviço de streaming encontrado.</Text>
                )}
              </View>

              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Classificação Etária</Text>
                <View style={styles.contentRow}>
                  <View style={[styles.largeCertBadge, { backgroundColor: tvShow.certification ? getCertificationColor(tvShow.certification) : "#666" }]}>
                    <Text style={styles.largeCertText}>{tvShow.certification || "?"}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>ClassInd</Text>
                    <Text style={[styles.infoSubtitle, { color: theme.colors.secondary }]}>{tvShow.certification ? `${tvShow.certification} anos` : "Não informado"}</Text>
                  </View>
                  <View style={[styles.countryBadge, { backgroundColor: theme.colors.surfaceVariant }]}><Text style={[styles.countryText, { color: theme.colors.onSurfaceVariant }]}>Brasil</Text></View>
                </View>
              </View>

              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Links Externos</Text>
                {tvShow.external_ids?.map((item) => {
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

              {tvShow.keywords && tvShow.keywords.length > 0 && (
                <View style={styles.innerSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Palavras-chave</Text>
                  <View style={styles.keywordContainer}>
                    {tvShow.keywords.map(k => (<View key={k.id} style={[styles.keywordBadge, { borderColor: theme.colors.outline }]}><Text style={[styles.keywordText, { color: theme.colors.onBackground }]}>{k.name}</Text></View>))}
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === "episodes" && (
            <View>
              <View style={styles.seasonHeader}>
                <Menu
                  visible={showSeasonMenu}
                  onDismiss={() => setShowSeasonMenu(false)}
                  anchor={
                    <Button mode="outlined" onPress={() => setShowSeasonMenu(true)} icon="chevron-down" contentStyle={{ flexDirection: 'row-reverse' }}>
                      {currentSeason ? currentSeason.title : "Selecionar Temporada"}
                    </Button>
                  }
                >
                  {sortedSeasons.map(season => (
                    <Menu.Item
                      key={season.id}
                      onPress={() => { setSelectedSeasonNumber(season.season_number); setShowSeasonMenu(false); }}
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
                currentSeason.episodes.map(episode => (
                  <EpisodeItem
                    key={episode.id}
                    episode={episode}
                    serieSlug={slug}
                    onToggleWatched={toggleEpisodeWatched}
                  />
                ))
              ) : (
                <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.secondary }}>Nenhum episódio encontrado.</Text>
              )}
            </View>
          )}

          {activeTab === "cast" && (
            <View>
              <TextInput
                style={[styles.searchInput, { color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant }]}
                placeholder="Buscar ator ou personagem..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={castSearch}
                onChangeText={setCastSearch}
              />
              <View style={styles.gridContainer}>
                {filteredCast.map(person => (
                  <View key={`${person.id}-${person.character}`} style={styles.gridItem}>
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
              <TextInput
                style={[styles.searchInput, { color: theme.colors.onSurface, backgroundColor: theme.colors.surfaceVariant }]}
                placeholder="Buscar membro da equipe..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={crewSearch}
                onChangeText={setCrewSearch}
              />
              <View style={styles.gridContainer}>
                {filteredCrew.map(person => (
                  <View key={`${person.id}-${person.job}`} style={styles.gridItem}>
                    <Image source={{ uri: person.profile_path?.tmdb ? `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` : undefined }} style={styles.gridImage} />
                    <Text numberOfLines={1} style={[styles.gridName, { color: theme.colors.onSurface }]}>{person.name}</Text>
                    <Text numberOfLines={1} style={[styles.gridRole, { color: theme.colors.secondary }]}>{person.job}</Text>
                    <Text numberOfLines={1} style={[styles.personDept, { color: theme.colors.tertiary }]}>{person.department}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === "images" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Imagens</Text>
              {images.length === 0 && <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>Nenhuma imagem encontrada.</Text>}
              <View style={styles.imagesGrid}>
                {images.map((img) => (
                  <TouchableOpacity key={img.id} style={[styles.galleryImageContainer, { backgroundColor: theme.colors.surfaceVariant }]} onPress={() => openImageModal(img)}>
                    <Image source={{ uri: `https://image.tmdb.org/t/p/w500${img.file_path}` }} style={styles.galleryImage} resizeMode="cover" />
                    <View style={styles.imageBadge}><Text style={styles.imageBadgeText}>{img.type ? img.type.charAt(0).toUpperCase() + img.type.slice(1) : 'Imagem'}</Text></View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeTab === "videos" && (
            <View>
              {videos.map((vid) => (
                <TouchableOpacity key={vid.id} style={[styles.videoItem, { backgroundColor: theme.colors.surface }]} onPress={() => vid.site === "YouTube" && Linking.openURL(`https://www.youtube.com/watch?v=${vid.key}`)}>
                  <Image source={{ uri: `https://img.youtube.com/vi/${vid.key}/0.jpg` }} style={[styles.videoThumbnail, { backgroundColor: theme.colors.surfaceVariant }]} />
                  <View style={styles.videoInfo}>
                    <Text style={[styles.videoName, { color: theme.colors.onSurface }]} numberOfLines={2}>{vid.name}</Text>
                    <Text style={[styles.videoType, { color: theme.colors.secondary }]} numberOfLines={2}>{vid.type}</Text>
                  </View>
                  <Icon name="play-circle" size={30} color={theme.colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "reviews" && (
            <View>
              {reviewStats && <ReviewStatsCard stats={reviewStats} />}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.onBackground }}>Avaliações</Text>
                {/* Botão de filtro simplificado ou implementar modal de filtros aqui */}
              </View>

              {filteredReviews.length === 0 ? (
                <Text style={{ textAlign: 'center', color: theme.colors.secondary }}>Nenhuma avaliação encontrada.</Text>
              ) : (
                filteredReviews.map(review => (
                  <ReviewCard key={review.review_id} review={review} />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL IMAGEM */}
      <Modal visible={isImageModalVisible} transparent={true} onRequestClose={closeImageModal}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}><Icon name="close" size={30} color="#fff" /></TouchableOpacity>
          {selectedImage && <Image source={{ uri: `https://image.tmdb.org/t/p/original${selectedImage.file_path}` }} style={styles.fullscreenImage} resizeMode="contain" />}
        </View>
      </Modal>

      {tvShow && <AddToListModal visible={listModalVisible} onDismiss={() => setListModalVisible(false)} mediaId={tvShow.id} mediaType="tv" mediaTitle={tvShow.title} />}
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
  tabBar: { flexDirection: 'row', marginBottom: 16 },
  tabActive: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, fontWeight: 'bold', marginRight: 8, overflow: 'hidden' },
  tabInactive: { paddingVertical: 6, paddingHorizontal: 12, marginRight: 8 },
  seasonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  searchInput: { padding: 10, borderRadius: 8, marginBottom: 16 },
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
  countryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  countryText: { fontSize: 10 },
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
  personRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, paddingBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  personInfo: { flex: 1 },
  personName: { fontSize: 16, fontWeight: 'bold' },
  personRole: { fontSize: 14 },
  personDept: { fontSize: 12 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 16, alignItems: 'center' },
  gridImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 4, backgroundColor: '#333' },
  gridName: { fontWeight: 'bold', fontSize: 14 },
  gridRole: { fontSize: 12 },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryImageContainer: { width: (width - 40) / 3, height: 80, borderRadius: 4, marginBottom: 4 },
  galleryImage: { width: '100%', height: '100%' },
  imageBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  imageBadgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  modalCloseArea: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  fullscreenImage: { width: width, height: height },
  closeButton: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  videoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 8, borderRadius: 8 },
  videoThumbnail: { width: 100, height: 60, borderRadius: 4, marginRight: 10 },
  videoInfo: { flex: 1 },
  videoName: { fontWeight: 'bold', fontSize: 12 },
  videoType: { fontSize: 12 },
  metaText: { fontSize: 12 },
  seasonCard: { flexDirection: 'row', marginBottom: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1 },
  seasonPoster: { width: 100, height: 150 },
  seasonInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  seasonTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  seasonMeta: { fontSize: 12, marginBottom: 8 },
  seasonOverview: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  seasonRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { fontSize: 12, fontWeight: 'bold' }
});