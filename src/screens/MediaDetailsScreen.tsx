import React, { useState, useContext, useEffect } from "react"; // Adicionado useContext
import { ScrollView, View, StyleSheet, StatusBar, TouchableOpacity, Linking, Modal, FlatList, Share, Image, Dimensions, Alert } from "react-native";
import { Text, ActivityIndicator, Chip, Divider, useTheme, Button } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useMediaDetails } from "../hooks/useMediaDetails";
import { getCertificationColor, formatCurrency, formatRuntime, formatDate, getSocialData } from "../utils/helpers";
import { Provider } from "../types/Movie";
import { MediaImage } from "../types/Interactions";
import { AuthContext } from "../context/AuthContext"; // Importação do Contexto

import MediaCard from "../components/MediaCard";
import AddToListModal from "../components/AddToListModal";
import MediaHeader from "../components/MediaHeader";
import MediaActionButtons from "../components/MediaActionButtons";
import ReviewStatsCard from "../components/ReviewStats";
import ReviewCard from "../components/ReviewCard";
import WriteReviewModal from "../components/WriteReviewModal";
import ShareReviewModal from "../components/ShareReviewModal";
import { Review, ReviewStats } from "../types/Review";
import { api } from "../services/api";

const { width, height } = Dimensions.get("window");

export default function MediaDetailsScreen({ route }: any) {
  const { slug } = route.params;
  const theme = useTheme();

  // Pegamos o usuário logado para usar na criação da review local
  const { user } = useContext(AuthContext);

  const {
    movie, providers, cast, crew, images, videos, collectionData,
    userInteraction, loading, interactionLoading, normalizedRatings, average,
    handleInteraction
  } = useMediaDetails(slug);

  const [activeTab, setActiveTab] = useState<"about" | "cast" | "crew" | "videos" | "images" | "reviews">("about");
  const [selectedImage, setSelectedImage] = useState<MediaImage | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [showAllProviders, setShowAllProviders] = useState(false);

  // Reviews States
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [writeModalVisible, setWriteModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [justCreatedReview, setJustCreatedReview] = useState<Review | null>(null);

  const openImageModal = (image: MediaImage) => { setSelectedImage(image); setIsImageModalVisible(true); };
  const closeImageModal = () => { setIsImageModalVisible(false); setSelectedImage(null); };

  const handleShare = async () => {
    if (!movie) return;
    try {
      await Share.share({
        message: `Confira "${movie.title}" no WikiNerd!\nhttps://wikinerd.com.br/filmes/${slug}`,
        url: `https://wikinerd.com.br/filmes/${slug}`,
        title: `WikiNerd: ${movie.title}`
      });
    } catch (error: any) { console.log("Erro ao compartilhar:", error.message); }
  };

  const handleShareExistingReview = (reviewToShare: Review) => {
    // Reutilizamos o estado justCreatedReview pois ele serve como "review selecionada para o modal"
    setJustCreatedReview(reviewToShare);
    setShareModalVisible(true);
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

  // --- Lógica de Reviews ---

  const fetchReviewsData = async (page = 1) => {
    if (!movie?.id) return;
    if (page === 1) setReviewsLoading(true);

    try {
      const promises: Promise<any>[] = [
        api.get(`https://api.wikinerd.com.br/api/movies/${movie.id}/reviews?page=${page}`)
      ];

      if (page === 1) {
        promises.push(api.get(`https://api.wikinerd.com.br/api/movies/${movie.id}/reviews/stats`));
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
  }, [activeTab, movie]);

  const handleDeleteReview = (id: string) => {
    Alert.alert("Excluir", "Deseja realmente excluir sua avaliação?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/users/movie/review/${id}`);
            setReviews(prev => prev.filter(r => r.review_id !== id));
          } catch (error) {
            Alert.alert("Erro", "Não foi possível excluir a avaliação.");
          }
        }
      }
    ]);
  };

  const handleReviewSuccess = (newReview: any) => {
    // Aqui usamos o 'user' do AuthContext para garantir que temos nome e avatar
    // Se 'user' for null (improvável se estiver logado), usamos um fallback seguro
    const currentUserInfo = user || {
      id: newReview.user_id,
      name: "Usuário",
      username: "usuario",
      avatar: null
    };

    const fullReview: Review = {
      ...newReview,
      review_id: newReview.id,
      user: currentUserInfo,
      feedback_counts: { useful: 0, not_useful: 0, report: 0, total: 0 },
      user_feedback: null
    };

    setReviews(prev => [fullReview, ...prev]);

    setJustCreatedReview(fullReview);
    setTimeout(() => setShareModalVisible(true), 500);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onBackground }}>Filme não encontrado.</Text>
      </View>
    );
  }

  // Helpers de Equipe
  const getCrewByJob = (jobs: string[]) => crew.filter(c => jobs.includes(c.job.job)).map(c => c.name).join(", ");
  const photography = getCrewByJob(["Director of Photography", "Cinematography"]);
  const music = getCrewByJob(["Original Music Composer", "Music"]);
  const producers = crew.filter(c => c.job.job === "Producer").slice(0, 3).map(c => c.name).join(", ");

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

        <MediaHeader movie={movie} handleShare={handleShare} />

        <MediaActionButtons
          userInteraction={userInteraction}
          onInteraction={handleInteraction}
          onAddList={() => setListModalVisible(true)}
          loading={interactionLoading}
        />

        <View style={styles.genresContainer}>
          {movie.genres?.map((g) => (
            <Chip key={g.id} style={[styles.genreChip, { backgroundColor: theme.colors.surfaceVariant }]} textStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>{g.name}</Chip>
          ))}
        </View>

        <View style={[styles.section, { borderTopColor: theme.colors.outlineVariant }]}>
          <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
            {renderTabButton("about", "Sobre")}
            {renderTabButton("cast", "Elenco")}
            {renderTabButton("crew", "Equipe")}
            {renderTabButton("images", "Imagens")}
            {renderTabButton("videos", "Vídeos")}
            {renderTabButton("reviews", "Reviews")}
          </View>

          {activeTab === "about" && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Sinopse</Text>
              <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant }]}>{movie.overview}</Text>

              {collectionData && (
                <View style={styles.innerSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Filmes da Coleção</Text>
                  <Text style={[styles.providerSubTitle, { marginBottom: 8, color: theme.colors.secondary }]}>{collectionData.name}</Text>
                  <FlatList
                    data={collectionData.movies}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <MediaCard media={item} />}
                    contentContainerStyle={{ paddingVertical: 8 }}
                  />
                </View>
              )}

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

              <View style={styles.innerSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Informações Técnicas</Text>
                <View style={styles.techGrid}>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>País de Origem</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>Estados Unidos</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Orçamento</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{formatCurrency(movie.budget)}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Bilheteria</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{formatCurrency(movie.revenue)}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Status</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{movie.status}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Lançamento</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{formatDate(movie.release_date)}</Text></View>
                  <View style={styles.techItem}><Text style={[styles.techLabel, { color: theme.colors.secondary }]}>Duração</Text><Text style={[styles.techValue, { color: theme.colors.onBackground }]}>{formatRuntime(movie.runtime)}</Text></View>
                </View>
              </View>

              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Classificação Etária</Text>
                <View style={styles.contentRow}>
                  <View style={[styles.largeCertBadge, { backgroundColor: movie.certification ? getCertificationColor(movie.certification) : "#666" }]}>
                    <Text style={styles.largeCertText}>{movie.certification || "?"}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>ClassInd</Text>
                    <Text style={[styles.infoSubtitle, { color: theme.colors.secondary }]}>{movie.certification ? `${movie.certification} anos` : "Não informado"}</Text>
                  </View>
                  <View style={[styles.countryBadge, { backgroundColor: theme.colors.surfaceVariant }]}><Text style={[styles.countryText, { color: theme.colors.onSurfaceVariant }]}>Brasil</Text></View>
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
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Principais Créditos</Text>
                {photography && (<View style={styles.crewRow}><View style={styles.iconCircle}><Icon name="filmstrip" size={20} color="#3b82f6" /></View><View style={styles.crewInfo}><Text style={[styles.infoSubtitle, { color: theme.colors.secondary }]}>Fotografia</Text><Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>{photography}</Text></View></View>)}
                {music && (<><Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} /><View style={styles.crewRow}><View style={styles.iconCircle}><Icon name="music-note" size={20} color="#3b82f6" /></View><View style={styles.crewInfo}><Text style={[styles.infoSubtitle, { color: theme.colors.secondary }]}>Trilha Sonora</Text><Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>{music}</Text></View></View></>)}
                {producers && (<><Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} /><View style={styles.crewRow}><View style={styles.iconCircle}><Icon name="account-group" size={20} color="#3b82f6" /></View><View style={styles.crewInfo}><Text style={[styles.infoSubtitle, { color: theme.colors.secondary }]}>Produção</Text><Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>{producers}</Text></View></View></>)}
              </View>

              <View style={[styles.cardContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Links Externos</Text>
                {movie.external_ids?.map((item) => {
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

              {movie.keywords && movie.keywords.length > 0 && (
                <View style={styles.innerSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Palavras-chave</Text>
                  <View style={styles.keywordContainer}>
                    {movie.keywords.map(k => (<View key={k.id} style={[styles.keywordBadge, { borderColor: theme.colors.outline }]}><Text style={[styles.keywordText, { color: theme.colors.onBackground }]}>{k.name}</Text></View>))}
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === "cast" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Elenco Principal</Text>
              {cast.map((person) => (
                <View key={person.id} style={[styles.personRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                  <Image source={{ uri: person.profile_path?.tmdb ? `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` : undefined }} style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]} />
                  <View style={styles.personInfo}>
                    <Text style={[styles.personName, { color: theme.colors.onBackground }]}>{person.name}</Text>
                    <Text style={[styles.personRole, { color: theme.colors.secondary }]}>{person.character}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === "crew" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Equipe Técnica</Text>
              {crew.map((person) => (
                <View key={person.id + person.job.job} style={[styles.personRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                  <Image source={{ uri: person.profile_path?.tmdb ? `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` : undefined }} style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]} />
                  <View style={styles.personInfo}>
                    <Text style={[styles.personName, { color: theme.colors.onBackground }]}>{person.name}</Text>
                    <Text style={[styles.personRole, { color: theme.colors.secondary }]}>{person.job.job}</Text>
                    <Text style={[styles.personDept, { color: theme.colors.tertiary }]}>{person.job.department}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === "images" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Imagens</Text>
              {images.length === 0 && <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>Nenhuma imagem encontrada.</Text>}
              <View style={styles.imagesGrid}>
                {images.map((img) => (
                  <TouchableOpacity key={img.id} style={[styles.galleryImageContainer, { backgroundColor: theme.colors.surfaceVariant }]} onPress={() => openImageModal(img)} activeOpacity={0.8}>
                    <Image source={{ uri: `https://image.tmdb.org/t/p/w500${img.file_path}` }} style={styles.galleryImage} resizeMode="cover" />
                    <View style={styles.imageBadge}><Text style={styles.imageBadgeText}>{img.type ? img.type.charAt(0).toUpperCase() + img.type.slice(1) : 'Imagem'}</Text></View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeTab === "videos" && (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Vídeos</Text>
              {videos.length === 0 && <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>Nenhum vídeo disponível no momento.</Text>}
              {videos.map((vid) => (
                <TouchableOpacity key={vid.id} style={[styles.videoItem, { backgroundColor: theme.colors.surface }]} onPress={() => vid.site === "YouTube" && Linking.openURL(`https://www.youtube.com/watch?v=${vid.key}`)}>
                  <Image source={{ uri: `https://img.youtube.com/vi/${vid.key}/0.jpg` }} style={[styles.videoThumbnail, { backgroundColor: theme.colors.surfaceVariant }]} />
                  <View style={styles.videoInfo}>
                    <Text style={[styles.videoName, { color: theme.colors.onSurface }]} numberOfLines={2}>{vid.name}</Text>
                    <Text style={[styles.videoType, { color: theme.colors.secondary }]}>{vid.type}</Text>
                  </View>
                  <Icon name="play-circle-outline" size={32} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "reviews" && (
            <View style={{ minHeight: 300 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onBackground, marginBottom: 0 }]}>Avaliações dos Usuários</Text>
                <Button
                  mode="contained"
                  onPress={() => setWriteModalVisible(true)}
                  compact
                  buttonColor="#3b82f6"
                >
                  Escrever Avaliação
                </Button>
              </View>

              {reviewsLoading && reviewsPage === 1 ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
              ) : (
                <>
                  {reviewStats && <ReviewStatsCard stats={reviewStats} />}
                  
                  {reviews.length === 0 ? (
                    <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 20 }]}>
                      Seja o primeiro a avaliar este filme!
                    </Text>
                  ) : (
                    reviews.map((review) => (
                      <ReviewCard 
                        key={review.review_id} 
                        review={review} 
                        onDelete={handleDeleteReview}
                        onShare={handleShareExistingReview} // PASSANDO A FUNÇÃO AQUI
                      />
                    ))
                  )}

                  {hasMoreReviews && (
                    <Button
                      mode="outlined"
                      style={{ marginTop: 16, borderColor: theme.colors.outline }}
                      textColor={theme.colors.onSurface}
                      onPress={handleLoadMoreReviews}
                      loading={reviewsLoading}
                    >
                      Carregar mais avaliações
                    </Button>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAIS */}

      <Modal visible={isImageModalVisible} transparent={true} onRequestClose={closeImageModal} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseArea} activeOpacity={1} onPress={closeImageModal}>
            {selectedImage && (
              <Image source={{ uri: `https://image.tmdb.org/t/p/original${selectedImage.file_path}` }} style={styles.fullscreenImage} resizeMode="contain" />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
              <Icon name="close-circle" size={40} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>

      {movie && (
        <AddToListModal
          visible={listModalVisible}
          onDismiss={() => setListModalVisible(false)}
          mediaId={movie.id}
          mediaType="movie"
          mediaTitle={movie.title}
        />
      )}

      {movie && (
        <WriteReviewModal
          visible={writeModalVisible}
          onDismiss={() => setWriteModalVisible(false)}
          onSubmitSuccess={handleReviewSuccess}
          movieId={movie.id}
          movieTitle={movie.title}
        />
      )}

      {movie && justCreatedReview && (
        <ShareReviewModal
          visible={shareModalVisible}
          onDismiss={() => setShareModalVisible(false)}
          movie={movie}
          review={justCreatedReview}
        />
      )}
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
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: 8, marginBottom: 16, flexWrap: 'wrap', rowGap: 4 },
  tabActive: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, fontWeight: 'bold', overflow: 'hidden' },
  tabInactive: { paddingVertical: 6, paddingHorizontal: 12 },
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
  scoreBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  scoreText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  bigScore: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  divider: { marginVertical: 12 },
  crewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  crewInfo: { flex: 1 },
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
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryImageContainer: { width: (width - 40) / 2, height: 120, borderRadius: 4, marginBottom: 8, position: 'relative', overflow: 'hidden' },
  galleryImage: { width: '100%', height: '100%' },
  imageBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  imageBadgeText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
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
});