import React, { useEffect, useState } from "react";
import { ScrollView, View, Image, StyleSheet, Dimensions, StatusBar, TouchableOpacity, Linking } from "react-native";
import { Text, ActivityIndicator, Chip, Button, Divider } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { api } from "../services/api";
import { Movie, Provider, CrewMember } from "../types/Movie";
import { getCertificationColor, getMediaYear } from "../utils/helpers";

const { width } = Dimensions.get("window");

export default function MediaDetailsScreen({ route }: any) {
  const { slug } = route.params;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const movieRes = await api.get(`https://api.wikinerd.com.br/api/movies/${slug}`);
        const movieData = movieRes.data;
        setMovie(movieData);

        if (movieData.id) {
          const providerRes = await api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/providers`);
          setProviders(providerRes.data);

          const creditsRes = await api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/credits`);
          setCrew(creditsRes.data.crew || []);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "white" }}>Filme não encontrado.</Text>
      </View>
    );
  }

  const backdrop = movie.backdrop_path?.tmdb
    ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path.tmdb}`
    : null;
  const poster = movie.poster_path?.tmdb
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path.tmdb}`
    : null;

  const uniqueProviders = providers.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
  const streamingProviders = uniqueProviders.filter(p => p.type === 'flatrate');
  const rentBuyProviders = uniqueProviders.filter(p => p.type === 'buy' || p.type === 'rent');
  const displayProviders = streamingProviders.length > 0 ? streamingProviders : rentBuyProviders;
  const providerLabel = streamingProviders.length > 0 ? "Streaming" : "Aluguel / Compra";

  const getCrewByJob = (jobs: string[]) => {
    return crew.filter(c => jobs.includes(c.job)).map(c => c.name).join(", ");
  };
  const photography = getCrewByJob(["Director of Photography", "Cinematography"]);
  const music = getCrewByJob(["Original Music Composer", "Music"]);
  const producers = crew.filter(c => c.job === "Producer").slice(0, 3).map(c => c.name).join(", ");

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

  const tmdbScore = Number(movie.rating_tmdb_average);
  const starScore = (tmdbScore / 2).toFixed(1);

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

  const collectionImage = movie.collection?.poster_path?.tmdb
    ? `https://image.tmdb.org/t/p/w500${movie.collection.poster_path.tmdb}`
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="light-content" backgroundColor="#060d17" />

      <View style={styles.headerWrapper}>
        {backdrop && <Image source={{ uri: backdrop }} style={styles.backdrop} resizeMode="cover" />}
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Image source={{ uri: poster || undefined }} style={styles.poster} />
          <View style={styles.headerInfo}>
            <Text variant="headlineSmall" style={styles.title}>{movie.title}</Text>
            <Text variant="bodyMedium" style={styles.originalTitle}>{movie.original_title}</Text>
            <View style={styles.badgesRow}>
              <View style={styles.statusBadge}><Text style={styles.statusText}>Lançado</Text></View>
              <Text style={styles.metaText}>📅 {getMediaYear(movie)}</Text>
              <Text style={styles.metaText}>🕒 {formatRuntime(movie.runtime)}</Text>
              {movie.certification && (
                <View style={[styles.certBadge, { backgroundColor: getCertificationColor(movie.certification) }]}>
                  <Text style={styles.certText}>{movie.certification}</Text>
                </View>
              )}
            </View>

            {movie.tagline && <Text style={styles.tagline}>"{movie.tagline}"</Text>}

            <View style={styles.ratingRow}>
              <Icon name="star" size={20} color="#4285F4" />
              <Text style={styles.ratingScore}> {Number(movie.rating_tmdb_average).toFixed(1)}</Text>
              <Text style={styles.ratingCount}> ({movie.rating_tmdb_count})</Text>
            </View>

            <Button mode="outlined" icon="bookmark-outline" textColor="white" style={styles.actionButton} onPress={() => { }}>Quero Ver</Button>
          </View>
        </View>
      </View>

      <View style={styles.actionsBar}>
        <Button mode="contained" icon="check" buttonColor="#0ea5e9" style={styles.gridButton}>Assistido</Button>
        <Button mode="contained" icon="thumb-up" buttonColor="#22c55e" style={styles.gridButton}>Gostei</Button>
      </View>
      <View style={[styles.actionsBar, { marginTop: 8 }]}>
        <Button mode="outlined" icon="thumb-down" textColor="#cbd5e1" style={[styles.gridButton, { borderColor: '#334155' }]}>Não Gostei</Button>
        <Button mode="outlined" icon="star-outline" textColor="#cbd5e1" style={[styles.gridButton, { borderColor: '#334155' }]}>Favorito</Button>
      </View>

      <View style={styles.genresContainer}>
        {movie.genres?.map((g) => (
          <Chip key={g.id} style={styles.genreChip} textStyle={{ color: '#cbd5e1', fontSize: 12 }}>{g.name}</Chip>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.tabBar}>
          <Text style={styles.tabActive}>Sobre</Text>
          <Text style={styles.tabInactive}>Elenco</Text>
          <Text style={styles.tabInactive}>Vídeos</Text>
          <Text style={styles.tabInactive}>Reviews</Text>
        </View>

        <Text style={styles.sectionTitle}>Sinopse</Text>
        <Text style={styles.bodyText}>{movie.overview}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.providersHeader}>
          <Text style={styles.sectionTitle}>Onde Assistir</Text>
          <TouchableOpacity><View style={styles.seeMoreBadge}><Text style={styles.seeMoreText}>Ver opções ▾</Text></View></TouchableOpacity>
        </View>
        <Text style={styles.providerSubTitle}>{providerLabel}</Text>
        <View style={styles.providersGrid}>
          {displayProviders.length > 0 ? (
            displayProviders.map((prov) => (
              <View key={`${prov.id}-${prov.type}`} style={styles.providerItem}>
                <Image source={{ uri: `https://image.tmdb.org/t/p/w92${prov.logo_path.tmdb}` }} style={styles.providerLogo} />
                <Text style={styles.providerName} numberOfLines={2}>{prov.name}</Text>
              </View>
            ))
          ) : (<Text style={styles.metaText}>Nenhum serviço encontrado.</Text>)}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Técnicas</Text>
        <View style={styles.techGrid}>
          <View style={styles.techItem}><Text style={styles.techLabel}>País de Origem</Text><Text style={styles.techValue}>Estados Unidos</Text></View>
          <View style={styles.techItem}><Text style={styles.techLabel}>Orçamento</Text><Text style={styles.techValue}>{formatCurrency(movie.budget)}</Text></View>
          <View style={styles.techItem}><Text style={styles.techLabel}>Bilheteria</Text><Text style={styles.techValue}>{formatCurrency(movie.revenue)}</Text></View>
          <View style={styles.techItem}><Text style={styles.techLabel}>Status</Text><Text style={styles.techValue}>{movie.status}</Text></View>
          <View style={styles.techItem}><Text style={styles.techLabel}>Lançamento</Text><Text style={styles.techValue}>{formatDate(movie.release_date)}</Text></View>
          <View style={styles.techItem}><Text style={styles.techLabel}>Duração</Text><Text style={styles.techValue}>{formatRuntime(movie.runtime)}</Text></View>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Classificação Etária</Text>
        <View style={styles.contentRow}>
          <View style={[styles.largeCertBadge, { backgroundColor: movie.certification ? getCertificationColor(movie.certification) : "#666" }]}>
            <Text style={styles.largeCertText}>{movie.certification || "?"}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>ClassInd</Text>
            <Text style={styles.infoSubtitle}>{movie.certification ? `${movie.certification} anos` : "Não informado"}</Text>
          </View>
          <View style={styles.countryBadge}><Text style={styles.countryText}>Brasil</Text></View>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Notas da Crítica</Text>
        <View style={styles.contentRow}>
          <View style={[styles.scoreBox, { backgroundColor: tmdbScore >= 7 ? "#22c55e" : tmdbScore >= 5 ? "#eab308" : "#ef4444" }]}>
            <Text style={styles.scoreText}>{tmdbScore.toFixed(1)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>TMDb</Text>
            <Text style={styles.infoSubtitle}>{tmdbScore >= 7 ? "Favorável" : "Misto"}</Text>
          </View>
          <Icon name="open-in-new" size={20} color="#94a3b8" />
        </View>
        <Divider style={styles.divider} />
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.infoSubtitle}>Média da Crítica</Text>
          <Text style={styles.bigScore}>{(tmdbScore / 2).toFixed(1)}/5</Text>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Equipe Técnica</Text>
        {photography && (<View style={styles.crewRow}><View style={styles.iconCircle}><Icon name="filmstrip" size={20} color="#3b82f6" /></View><View style={styles.crewInfo}><Text style={styles.infoSubtitle}>Fotografia</Text><Text style={styles.infoTitle}>{photography}</Text></View></View>)}
        {music && (<><Divider style={styles.divider} /><View style={styles.crewRow}><View style={styles.iconCircle}><Icon name="music-note" size={20} color="#3b82f6" /></View><View style={styles.crewInfo}><Text style={styles.infoSubtitle}>Trilha Sonora</Text><Text style={styles.infoTitle}>{music}</Text></View></View></>)}
        {producers && (<><Divider style={styles.divider} /><View style={styles.crewRow}><View style={styles.iconCircle}><Icon name="account-group" size={20} color="#3b82f6" /></View><View style={styles.crewInfo}><Text style={styles.infoSubtitle}>Produção</Text><Text style={styles.infoTitle}>{producers}</Text></View></View></>)}
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.cardTitle}>Links Externos</Text>
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
              <Text style={styles.linkText}>{label}</Text>
              <Icon name="open-in-new" size={16} color="#94a3b8" />
            </TouchableOpacity>
          );
        })}
      </View>

      {movie.collection && (
        <View style={styles.section}>
          <View style={styles.providersHeader}>
            <Text style={styles.sectionTitle}>Filmes da Coleção</Text>
            <TouchableOpacity><View style={styles.iconCircleSmall}><Icon name="menu" size={16} color="#cbd5e1" /></View></TouchableOpacity>
          </View>

          <View style={styles.collectionContainer}>
            <Image
              source={{ uri: collectionImage || undefined }}
              style={styles.collectionImage}
              resizeMode="cover"
            />
            <View style={styles.collectionOverlay}>
              <View style={styles.arrowButton}><Icon name="chevron-left" size={24} color="#64748b" /></View>
              <View style={{ flex: 1 }} />
              <View style={styles.arrowButton}><Icon name="chevron-right" size={24} color="#e2e8f0" /></View>
            </View>
            <View style={styles.collectionTitleContainer}>
              <Text style={styles.collectionTitleText} numberOfLines={2}>
                {movie.collection.name}
              </Text>
            </View>
          </View>
        </View>
      )}

      {movie.keywords && movie.keywords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Palavras-chave</Text>
          <View style={styles.keywordContainer}>
            {movie.keywords.map(k => (<View key={k.id} style={styles.keywordBadge}><Text style={styles.keywordText}>{k.name}</Text></View>))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060d17" },
  loadingContainer: { flex: 1, backgroundColor: "#060d17", justifyContent: "center", alignItems: "center" },

  headerWrapper: { position: "relative", width: width },
  backdrop: { width: width, height: 450, opacity: 0.6 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6, 13, 23, 0.6)' },
  headerContent: { position: 'absolute', bottom: 20, left: 16, right: 16, flexDirection: 'row', alignItems: 'flex-end' },
  poster: { width: 120, height: 180, borderRadius: 8, marginRight: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerInfo: { flex: 1, justifyContent: 'flex-end' },
  title: { color: "#fff", fontWeight: "bold", marginBottom: 2 },
  originalTitle: { color: "#94a3b8", marginBottom: 8 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 },
  statusBadge: { backgroundColor: '#3b82f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  metaText: { color: '#e2e8f0', fontSize: 12 },
  certBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  certText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  tagline: { color: '#cbd5e1', fontStyle: 'italic', fontSize: 12, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  ratingScore: { color: '#4285F4', fontWeight: 'bold', fontSize: 16 },
  ratingCount: { color: '#94a3b8', fontSize: 12 },
  actionButton: { borderColor: '#475569', borderRadius: 4, width: '100%' },
  actionsBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  gridButton: { flex: 1, borderRadius: 4 },
  genresContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  genreChip: { backgroundColor: '#1e293b', height: 32 },
  section: { padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b', marginTop: 16 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  bodyText: { color: '#cbd5e1', lineHeight: 22, textAlign: 'justify' },

  tabBar: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 4, borderRadius: 8, marginBottom: 16 },
  tabActive: { backgroundColor: '#1e293b', color: 'white', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, fontWeight: 'bold', overflow: 'hidden' },
  tabInactive: { color: '#94a3b8', paddingVertical: 6, paddingHorizontal: 12 },

  providersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  seeMoreBadge: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  seeMoreText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },
  providerSubTitle: { color: '#94a3b8', fontSize: 14, marginBottom: 12 },
  providersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  providerItem: { width: 60, alignItems: 'center', marginBottom: 8 },
  providerLogo: { width: 50, height: 50, borderRadius: 8, marginBottom: 4, backgroundColor: '#333' },
  providerName: { color: '#e2e8f0', fontSize: 10, textAlign: 'center', height: 30 },

  cardContainer: {
    backgroundColor: '#0f172a',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  contentRow: { flexDirection: 'row', alignItems: 'center' },
  largeCertBadge: { width: 40, height: 40, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  largeCertText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  infoTitle: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  infoSubtitle: { color: '#94a3b8', fontSize: 12 },
  countryBadge: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  countryText: { color: '#cbd5e1', fontSize: 10 },
  scoreBox: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  scoreText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  bigScore: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  divider: { backgroundColor: '#334155', marginVertical: 12 },
  crewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(59, 130, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  crewInfo: { flex: 1 },

  linkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  linkIconBox: { width: 24, height: 24, borderRadius: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  linkText: { color: 'white', flex: 1, fontWeight: '500' },

  iconCircleSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  collectionContainer: { position: 'relative', borderRadius: 8, overflow: 'hidden', height: 380, backgroundColor: '#000' },
  collectionImage: { width: '100%', height: '100%', opacity: 0.8 },
  collectionOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  arrowButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  collectionTitleContainer: { position: 'absolute', top: 20, left: 0, right: 0, alignItems: 'center' },
  collectionTitleText: { color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 },

  techGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 },
  techItem: { width: '50%', paddingRight: 8 },
  techLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 2 },
  techValue: { color: 'white', fontSize: 14, fontWeight: '500' },
  keywordContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordBadge: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  keywordText: { color: '#e2e8f0', fontSize: 12 },
});