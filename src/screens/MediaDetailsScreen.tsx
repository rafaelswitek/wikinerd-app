import React, { useEffect, useState, useMemo } from "react";
import { ScrollView, View, Image, StyleSheet, Dimensions, StatusBar, TouchableOpacity, Linking, Modal, FlatList, Share, Alert } from "react-native";
import { Text, ActivityIndicator, Chip, Button, Divider, useTheme } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from "../services/api";
import { CastMember, CrewMember, Movie, Provider } from "../types/Movie";
import { getCertificationColor, getMediaYear } from "../utils/helpers";
import MediaCard from "../components/MediaCard";

const { width, height } = Dimensions.get("window");

// --- Interfaces ---

interface MediaImage {
  id: string;
  file_path: string;
  aspect_ratio: string;
  height: number;
  width: number;
  type: string;
}

interface MediaVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

interface CollectionResponse {
  id: string;
  name: string;
  overview: string;
  poster_path: { tmdb: string | null };
  backdrop_path: { tmdb: string | null };
  movies: Movie[];
}

interface ProviderSection {
  title: string;
  data: Provider[];
  type: "flatrate" | "buy" | "rent";
}

interface UserInteraction {
  id: string;
  user_id: string;
  movie_id: string;
  watched_date: string | null;
  status: 'watched' | 'want_to_watch' | null;
  feedback: 'liked' | 'not_like' | 'favorite' | null;
  created_at: string;
  updated_at: string;
}

// --- Lógica de Ratings ---

type RatingKey =
  | 'rating_rotten_average'
  | 'rating_metacritic_average'
  | 'rating_imdb_average'
  | 'rating_tmdb_average'
  | 'rating_letterboxd_average';

type NormalizedRating = {
  platform: string;
  label: string;
  rating: number;
  normalized: number;
  color: string;
  status: string;
  link: string;
};

const RATING_COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  gray: '#6b7280',
};

const getRatings = (movie: any | null, type: string): { normalizedRatings: NormalizedRating[], average: number | null } => {
  if (!movie) {
    return { normalizedRatings: [], average: null };
  }

  const platforms = [
    { key: 'rating_rotten_average' as RatingKey, label: 'Rotten Tomatoes', linkKey: 'rottentomatoes' },
    { key: 'rating_metacritic_average' as RatingKey, label: 'Metacritic', linkKey: 'metacritic' },
    { key: 'rating_imdb_average' as RatingKey, label: 'IMDb', linkKey: 'imdb' },
    { key: 'rating_tmdb_average' as RatingKey, label: 'TMDb', linkKey: 'tmdb' },
    { key: 'rating_letterboxd_average' as RatingKey, label: 'Letterboxd', linkKey: 'letterboxd' },
  ];

  const normalizedRatings: NormalizedRating[] = [];
  let totalNormalized = 0;
  let validRatingsCount = 0;

  platforms.forEach(platform => {
    const rawValue = movie[platform.key];

    if (rawValue) {
      const value = parseFloat(rawValue);
      let color = RATING_COLORS.gray;
      let status = 'Not Rated';
      let normalizedValue = 0;

      switch (platform.label) {
        case 'Rotten Tomatoes':
          normalizedValue = value / 20;
          if (value >= 75) { color = RATING_COLORS.green; status = 'Certified Fresh'; }
          else if (value >= 60) { color = RATING_COLORS.red; status = 'Fresh'; }
          else { color = RATING_COLORS.gray; status = 'Rotten'; }
          break;
        case 'Metacritic':
          normalizedValue = value / 20;
          if (value >= 75) { color = RATING_COLORS.green; status = 'Generally Favorable'; }
          else if (value >= 50) { color = RATING_COLORS.yellow; status = 'Mixed or Average'; }
          else { color = RATING_COLORS.red; status = 'Generally Unfavorable'; }
          break;
        case 'IMDb':
        case 'TMDb':
          normalizedValue = value / 2;
          if (normalizedValue >= 4) { color = RATING_COLORS.green; status = 'Favorable'; }
          else if (normalizedValue >= 2.5) { color = RATING_COLORS.yellow; status = 'Mixed'; }
          else { color = RATING_COLORS.red; status = 'Unfavorable'; }
          break;
        case 'Letterboxd':
          normalizedValue = value;
          if (value >= 4) { color = RATING_COLORS.green; status = 'Favorable'; }
          else if (value >= 2.5) { color = RATING_COLORS.yellow; status = 'Mixed'; }
          else { color = RATING_COLORS.red; status = 'Unfavorable'; }
          break;
      }

      const linkId = movie.external_ids?.find((ext: any) => ext.platform === platform.linkKey)?.external_id;
      let linkUrl = "#";

      if (linkId) {
        if (platform.label === 'Rotten Tomatoes') linkUrl = `https://www.rottentomatoes.com/${type == 'movie' ? 'm' : 'tv'}/${linkId}`;
        else if (platform.label === 'Metacritic') linkUrl = `https://www.metacritic.com/${type == 'movie' ? 'movie' : 'tv'}/${linkId}`;
        else if (platform.label === 'IMDb') linkUrl = `https://www.imdb.com/title/${linkId}`;
        else if (platform.label === 'TMDb') linkUrl = `https://www.themoviedb.org/${type == 'movie' ? 'movie' : 'tv'}/${linkId}`;
        else if (platform.label === 'Letterboxd') linkUrl = `https://letterboxd.com/${type == 'movie' ? 'film' : 'film'}/${linkId}`;
      }

      normalizedRatings.push({
        platform: platform.label,
        label: platform.label,
        rating: value,
        normalized: normalizedValue,
        color,
        status,
        link: linkUrl
      });

      totalNormalized += normalizedValue;
      validRatingsCount++;
    }
  });

  const average = validRatingsCount > 0 ? parseFloat((totalNormalized / validRatingsCount).toFixed(1)) : null;
  return { normalizedRatings, average };
};

// -------------------------------------

export default function MediaDetailsScreen({ route }: any) {
  const { slug } = route.params;
  const theme = useTheme();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [videos, setVideos] = useState<MediaVideo[]>([]);

  // Estado para interação do usuário
  const [userInteraction, setUserInteraction] = useState<UserInteraction | null>(null);
  const [interactionLoading, setInteractionLoading] = useState(false);

  const [collectionData, setCollectionData] = useState<CollectionResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "cast" | "crew" | "videos" | "images" | "reviews">("about");

  const [selectedImage, setSelectedImage] = useState<MediaImage | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [showAllProviders, setShowAllProviders] = useState(false);

  // Calcula ratings usando useMemo
  const { normalizedRatings, average } = useMemo(() => getRatings(movie, 'movie'), [movie]);

  useEffect(() => {
    setMovie(null);
    setCollectionData(null);
    setUserInteraction(null);
    setLoading(true);
    setShowAllProviders(false);

    async function fetchData() {
      try {
        const movieRes = await api.get(`https://api.wikinerd.com.br/api/movies/${slug}`);
        const movieData = movieRes.data;
        setMovie(movieData);

        if (movieData.id) {
          const [providerRes, castRes, crewRes, imagesRes, videosRes] = await Promise.all([
            api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/providers`),
            api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/cast`),
            api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/crew`),
            api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/images`),
            api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/videos`),
          ]);

          setProviders(providerRes.data);
          setCast(castRes.data);
          setCrew(crewRes.data);
          setImages(imagesRes.data);
          setVideos(videosRes.data);

          // Buscar interação do usuário com este filme
          fetchUserInteraction(movieData.id);

          if (movieData.collection?.id) {
            try {
              const collectionRes = await api.get(`https://api.wikinerd.com.br/api/collection/${movieData.collection.id}/movies`);
              setCollectionData(collectionRes.data);
            } catch (err) {
              console.error("Erro ao carregar coleção:", err);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  async function fetchUserInteraction(movieId: string) {
    try {
      const response = await api.get(`/users/movie/${movieId}`);
      setUserInteraction(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.log("Erro ao buscar status do usuário:", error);
      }
      // Se 404, usuário ainda não interagiu, estado fica null
    }
  }

  const handleInteraction = async (
    field: 'status' | 'feedback',
    value: string
  ) => {
    if (!movie) return;
    setInteractionLoading(true);

    const currentStatus = userInteraction?.status;
    const currentFeedback = userInteraction?.feedback;

    let newStatus = currentStatus;
    let newFeedback = currentFeedback;
    let watchedDate = userInteraction?.watched_date;

    if (field === 'status') {
      // Toggle status
      if (currentStatus === value) {
        newStatus = null;
        watchedDate = null;
      } else {
        newStatus = value as any;
        if (value === 'watched') {
          // Se marcou como visto, define data de hoje se não houver
          if (!watchedDate) {
            watchedDate = new Date().toISOString().split('T')[0];
          }
        } else {
          // Se marcou "quero ver", limpa a data
          watchedDate = null;
        }
      }
    } else if (field === 'feedback') {
      // Toggle feedback
      if (currentFeedback === value) {
        newFeedback = null;
      } else {
        newFeedback = value as any;

        // REGRA: Ao marcar feedback, define automaticamente como assistido
        newStatus = 'watched';
        if (!watchedDate) {
          watchedDate = new Date().toISOString().split('T')[0];
        }
      }
    }

    try {
      // Se o usuário removeu todos os status, deletamos a interação
      if (!newStatus && !newFeedback && userInteraction?.id) {
        await api.delete(`/users/movie/${userInteraction.id}`);
        setUserInteraction(null);
      } else {
        // Caso contrário, atualizamos/criamos via PUT
        const payload = {
          movie_id: movie.id,
          status: newStatus,
          feedback: newFeedback,
          watched_date: watchedDate
        };
        const response = await api.put('/users/movie', payload);
        setUserInteraction(response.data);
      }
    } catch (error) {
      console.error("Erro ao atualizar interação:", error);
      Alert.alert("Erro", "Não foi possível atualizar sua interação.");
    } finally {
      setInteractionLoading(false);
    }
  };

  const openImageModal = (image: MediaImage) => {
    setSelectedImage(image);
    setIsModalVisible(true);
  };

  const closeImageModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
  };

  const handleShare = async () => {
    if (!movie) return;

    const deepLink = `https://wikinerd.com.br/filmes/${slug}`;
    const message = `Confira "${movie.title}" no WikiNerd!\n${deepLink}`;

    try {
      await Share.share({
        message: message,
        url: deepLink,
        title: `WikiNerd: ${movie.title}`
      });
    } catch (error: any) {
      console.log("Erro ao compartilhar:", error.message);
    }
  };

  const streamingProviders = providers.filter(p => p.type === 'flatrate');
  const buyProviders = providers.filter(p => p.type === 'buy');
  const rentProviders = providers.filter(p => p.type === 'rent');

  const availableSections: ProviderSection[] = [];
  if (streamingProviders.length > 0) availableSections.push({ title: "Streaming", data: streamingProviders, type: "flatrate" });
  if (buyProviders.length > 0) availableSections.push({ title: "Comprar", data: buyProviders, type: "buy" });
  if (rentProviders.length > 0) availableSections.push({ title: "Alugar", data: rentProviders, type: "rent" });

  const remainingOptionsCount = Math.max(0, availableSections.length - 1);

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

  const backdrop = movie.backdrop_path?.tmdb
    ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path.tmdb}`
    : null;
  const poster = movie.poster_path?.tmdb
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path.tmdb}`
    : null;

  const getCrewByJob = (jobs: string[]) => {
    return crew.filter(c => jobs.includes(c.job.job)).map(c => c.name).join(", ");
  };
  const photography = getCrewByJob(["Director of Photography", "Cinematography"]);
  const music = getCrewByJob(["Original Music Composer", "Music"]);
  const producers = crew.filter(c => c.job.job === "Producer").slice(0, 3).map(c => c.name).join(", ");

  const formatCurrency = (value?: string) => {
    if (!value || value === "0") return "-";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
  };
  const formatRuntime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const getSocialData = (platform: string) => {
    switch (platform) {
      case 'imdb': return { icon: 'movie-open', color: '#F5C518', label: 'IMDb', url: 'https://www.imdb.com/title/' };
      case 'tmdb': return { icon: 'movie-roll', color: '#01B4E4', label: 'TMDb', url: 'https://www.themoviedb.org/movie/' };
      case 'facebook': return { icon: 'facebook', color: '#1877F2', label: 'Facebook', url: 'https://www.facebook.com/' };
      case 'twitter': return { icon: 'twitter', color: '#1DA1F2', label: 'Twitter', url: 'https://twitter.com/' };
      case 'instagram': return { icon: 'instagram', color: '#E1306C', label: 'Instagram', url: 'https://instagram.com/' };
      case 'wikidata': return { icon: 'barcode-scan', color: '#999', label: 'Wikidata', url: 'https://www.wikidata.org/wiki/' };
      default: return { icon: 'web', color: '#fff', label: platform, url: '' };
    }
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

  const renderProviderGrid = (data: Provider[]) => (
    <View style={styles.providersGrid}>
      {data.map((prov, index) => (
        <View key={`${prov.id}-${prov.type}-${index}`} style={styles.providerItem}>
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w92${prov.logo_path.tmdb}` }}
            style={styles.providerLogo}
          />
          <Text style={[styles.providerName, { color: theme.colors.onBackground }]} numberOfLines={2}>
            {prov.name}
          </Text>
        </View>
      ))}
    </View>
  );

  // Helper para cores e estilos dos botões
  const getButtonProps = (isActive: boolean, activeColor: string) => ({
    mode: isActive ? "contained" : "outlined" as "contained" | "outlined",
    buttonColor: isActive ? activeColor : undefined,
    textColor: isActive ? "white" : theme.colors.onSurfaceVariant,
    style: [styles.gridButton, !isActive && { borderColor: theme.colors.outline }]
  });

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.colors.background} />

        <View style={styles.headerWrapper}>
          {backdrop && <Image source={{ uri: backdrop }} style={styles.backdrop} resizeMode="cover" />}
          <View style={[styles.overlay, { backgroundColor: theme.dark ? 'rgba(6, 13, 23, 0.7)' : 'rgba(255, 255, 255, 0.3)' }]} />
          <View style={styles.headerContent}>
            <Image source={{ uri: poster || undefined }} style={styles.poster} />
            <View style={styles.headerInfo}>
              <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>{movie.title}</Text>
              <Text variant="bodyMedium" style={[styles.originalTitle, { color: theme.colors.secondary }]}>{movie.original_title}</Text>
              <View style={styles.badgesRow}>
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.primary }]}><Text style={styles.statusText}>Lançado</Text></View>
                <Text style={[styles.metaText, { color: theme.colors.onBackground }]}>📅 {getMediaYear(movie)}</Text>
                <Text style={[styles.metaText, { color: theme.colors.onBackground }]}>🕒 {formatRuntime(movie.runtime)}</Text>
                {movie.certification && (
                  <View style={[styles.certBadge, { backgroundColor: getCertificationColor(movie.certification) }]}>
                    <Text style={styles.certText}>{movie.certification}</Text>
                  </View>
                )}
              </View>

              {movie.tagline && <Text style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>"{movie.tagline}"</Text>}

              <View style={styles.ratingRow}>
                <Icon name="star" size={20} color="#4285F4" />
                <Text style={[styles.ratingScore, { color: '#4285F4' }]}> {Number(movie.rating_tmdb_average).toFixed(1)}</Text>
                <Text style={[styles.ratingCount, { color: theme.colors.secondary }]}> ({movie.rating_tmdb_count})</Text>
              </View>

              <Button
                {...getButtonProps(userInteraction?.status === 'want_to_watch', theme.colors.primary)}
                icon={userInteraction?.status === 'want_to_watch' ? "bookmark" : "bookmark-outline"}
                onPress={() => handleInteraction('status', 'want_to_watch')}
                loading={interactionLoading}
                style={[styles.actionButton, userInteraction?.status !== 'want_to_watch' && { borderColor: theme.colors.outline }]}
              >
                Quero Ver
              </Button>
            </View>
          </View>
        </View>

        <View style={styles.actionsBar}>
          <Button
            {...getButtonProps(userInteraction?.status === 'watched', '#0ea5e9')}
            icon="check"
            onPress={() => handleInteraction('status', 'watched')}
          >
            Assistido
          </Button>
          <Button
            {...getButtonProps(userInteraction?.feedback === 'liked', '#22c55e')}
            icon="thumb-up"
            onPress={() => handleInteraction('feedback', 'liked')}
          >
            Gostei
          </Button>
        </View>
        <View style={[styles.actionsBar, { marginTop: 8 }]}>
          <Button
            {...getButtonProps(userInteraction?.feedback === 'not_like', '#ef4444')}
            icon="thumb-down"
            onPress={() => handleInteraction('feedback', 'not_like')}
          >
            Não Gostei
          </Button>
          <Button
            {...getButtonProps(userInteraction?.feedback === 'favorite', '#eab308')}
            icon={userInteraction?.feedback === 'favorite' ? "star" : "star-outline"}
            onPress={() => handleInteraction('feedback', 'favorite')}
          >
            Favorito
          </Button>
        </View>

        {/* Botão de Compartilhar */}
        <View style={[styles.actionsBar, { marginTop: 8 }]}>
          <Button
            mode="outlined"
            icon="share-variant"
            textColor={theme.colors.onSurfaceVariant}
            style={[styles.gridButton, { borderColor: theme.colors.outline }]}
            onPress={handleShare}
          >
            Compartilhar
          </Button>
        </View>

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
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowAllProviders(!showAllProviders)}
                    >
                      <View style={[styles.seeMoreBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                        <Text style={[styles.seeMoreText, { color: theme.colors.onSurface }]}>
                          {showAllProviders ? "Mostrar menos" : `Ver mais ${remainingOptionsCount} opç${remainingOptionsCount > 1 ? 'ões' : 'ão'}`}
                        </Text>
                        <Icon
                          name={showAllProviders ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={theme.colors.onSurface}
                          style={{ marginLeft: 4 }}
                        />
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
                          {renderProviderGrid(section.data)}
                        </View>
                      );
                    }
                    return null;
                  })
                ) : (
                  <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                    Nenhum serviço de streaming encontrado.
                  </Text>
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
                  <TouchableOpacity
                    key={item.platform}
                    style={styles.contentRow}
                    onPress={() => Linking.openURL(item.link)}
                    disabled={item.link === '#'}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.scoreBox, { backgroundColor: item.color, marginRight: 12, minWidth: 48, alignItems: 'center' }]}>
                      <Text style={styles.scoreText}>
                        {item.platform === 'Rotten Tomatoes' || item.platform === 'Metacritic'
                          ? item.rating.toFixed(0) + '%'
                          : item.rating.toFixed(1)}
                      </Text>
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
                  <Text style={[styles.bigScore, { color: theme.colors.onSurface }]}>
                    {average ? `${average}/5` : '-'}
                  </Text>
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
                    <TouchableOpacity
                      key={item.platform}
                      style={styles.linkRow}
                      onPress={() => Linking.openURL(`${url}${item.external_id}`)}
                    >
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
                  <Image
                    source={{ uri: person.profile_path?.tmdb ? `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` : undefined }}
                    style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]}
                  />
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
                  <Image
                    source={{ uri: person.profile_path?.tmdb ? `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` : undefined }}
                    style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]}
                  />
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
                  <TouchableOpacity
                    key={img.id}
                    style={[styles.galleryImageContainer, { backgroundColor: theme.colors.surfaceVariant }]}
                    onPress={() => openImageModal(img)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w500${img.file_path}` }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageBadge}>
                      <Text style={styles.imageBadgeText}>
                        {img.type ? img.type.charAt(0).toUpperCase() + img.type.slice(1) : 'Imagem'}
                      </Text>
                    </View>
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
                <TouchableOpacity
                  key={vid.id}
                  style={[styles.videoItem, { backgroundColor: theme.colors.surface }]}
                  onPress={() => vid.site === "YouTube" && Linking.openURL(`https://www.youtube.com/watch?v=${vid.key}`)}
                >
                  <Image
                    source={{ uri: `https://img.youtube.com/vi/${vid.key}/0.jpg` }}
                    style={[styles.videoThumbnail, { backgroundColor: theme.colors.surfaceVariant }]}
                  />
                  <View style={styles.videoInfo}>
                    <Text style={[styles.videoName, { color: theme.colors.onSurface }]} numberOfLines={2}>{vid.name}</Text>
                    <Text style={[styles.videoType, { color: theme.colors.secondary }]}>{vid.type}</Text>
                  </View>
                  <Icon name="play-circle-outline" size={32} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === "reviews" && <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>Nenhuma avaliação disponível no momento.</Text>}

        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={closeImageModal}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseArea}
            activeOpacity={1}
            onPress={closeImageModal}
          >
            {selectedImage && (
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/original${selectedImage.file_path}` }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
              <Icon name="close-circle" size={40} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  headerWrapper: { position: "relative", width: width },
  backdrop: { width: width, height: 450, opacity: 0.6 },
  overlay: { ...StyleSheet.absoluteFillObject },
  headerContent: { position: 'absolute', bottom: 20, left: 16, right: 16, flexDirection: 'row', alignItems: 'flex-end' },
  poster: { width: 120, height: 180, borderRadius: 8, marginRight: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerInfo: { flex: 1, justifyContent: 'flex-end' },
  title: { fontWeight: "bold", marginBottom: 2 },
  originalTitle: { marginBottom: 8 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  metaText: { fontSize: 12 },
  certBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  certText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  tagline: { fontStyle: 'italic', fontSize: 12, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ratingScore: { fontWeight: 'bold', fontSize: 16 },
  ratingCount: { fontSize: 12 },
  actionButton: { borderRadius: 4, width: '100%' },
  actionsBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  gridButton: { flex: 1, borderRadius: 4 },
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

  cardContainer: {
    marginHorizontal: 0,
    marginTop: 24,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1
  },
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

  iconCircleSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

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
  galleryImageContainer: {
    width: (width - 40) / 2,
    height: 120,
    borderRadius: 4,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  imageBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 25,
    zIndex: 10,
  },

  videoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderRadius: 8, padding: 8 },
  videoThumbnail: { width: 120, height: 68, borderRadius: 4 },
  videoInfo: { flex: 1, marginLeft: 12 },
  videoName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  videoType: { fontSize: 12 },
});