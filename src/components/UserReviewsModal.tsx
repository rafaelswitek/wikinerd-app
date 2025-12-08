import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, RefreshControl } from "react-native";
import { Modal, Portal, Text, IconButton, useTheme, ActivityIndicator, Divider, Chip } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { api } from "../services/api";
import ReviewStatsCard from "./ReviewStats";
import { ReviewStats } from "../types/Review";

const { width } = Dimensions.get("window");

interface UserReviewsModalProps {
  visible: boolean;
  onDismiss: () => void;
  mediaType: "movies" | "tv_shows" | string;
}

interface ReviewItemData {
  review_id: string;
  overall_rating: number;
  comment: string | null;
  created_at: string;
  has_spoilers: boolean;
  story_rating?: number;
  acting_rating?: number;
  direction_rating?: number;
  cinematography_rating?: number;
  soundtrack_rating?: number;
  visual_effects_rating?: number;
  movie?: {
    id: string;
    title: string;
    poster_path: { tmdb: string | null };
    release_date: string;
  };
  episode?: {
    id: string;
    title: string;
    season_number: number;
    episode_number: number;
    still_path: { tmdb: string | null };
    air_date: string;
    tv_show: {
      id: string;
      title: string;
      poster_path: { tmdb: string | null };
    };
  };
}

export default function UserReviewsModal({ visible, onDismiss, mediaType }: UserReviewsModalProps) {
  const theme = useTheme();
  
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<ReviewItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const isMovie = mediaType === "movies";
  const isTv = mediaType === "tv_shows";

  const getEndpoints = () => {
    if (isMovie) {
      return {
        list: "/users/movie/reviews",
        stats: "/users/movie/reviews/stats"
      };
    }
    return {
      list: "/users/episode/reviews",
      stats: "/users/episode/reviews/stats"
    };
  };

  const fetchInitialData = async () => {
    setLoading(true);
    setPage(1);
    const endpoints = getEndpoints();
    
    try {
      const [statsRes, listRes] = await Promise.all([
        api.get(endpoints.stats),
        api.get(endpoints.list, { params: { page: 1 } })
      ]);

      setStats(statsRes.data);
      setReviews(listRes.data.data);
      setHasMore(listRes.data.meta.current_page < listRes.data.meta.last_page);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMoreReviews = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    
    const endpoints = getEndpoints();
    const nextPage = page + 1;

    try {
      const response = await api.get(endpoints.list, { params: { page: nextPage } });
      setReviews(prev => [...prev, ...response.data.data]);
      setHasMore(response.data.meta.current_page < response.data.meta.last_page);
      setPage(nextPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (visible && (isMovie || isTv)) {
      fetchInitialData();
    }
  }, [visible, mediaType]);

  const renderStars = (rating: number) => (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={i <= Math.round(rating) ? "star" : "star-outline"} size={12} color="#eab308" />
      ))}
    </View>
  );

  const renderReviewItem = ({ item }: { item: ReviewItemData }) => {
    let imageUrl = null;
    let title = "";
    let subtitle = "";
    let date = "";

    if (item.movie) {
      if (item.movie.poster_path?.tmdb) imageUrl = `https://image.tmdb.org/t/p/w154${item.movie.poster_path.tmdb}`;
      title = item.movie.title;
      date = item.movie.release_date ? item.movie.release_date.split("-")[0] : "";
    } else if (item.episode) {
      if (item.episode.still_path?.tmdb) {
        imageUrl = `https://image.tmdb.org/t/p/w300${item.episode.still_path.tmdb}`;
      } else if (item.episode.tv_show.poster_path?.tmdb) {
        imageUrl = `https://image.tmdb.org/t/p/w154${item.episode.tv_show.poster_path.tmdb}`;
      }
      title = item.episode.tv_show.title;
      subtitle = `T${item.episode.season_number}:E${item.episode.episode_number} - ${item.episode.title}`;
      date = item.episode.air_date ? new Date(item.episode.air_date).toLocaleDateString("pt-BR") : "";
    }

    const categories = [
      { label: "Roteiro", value: item.story_rating },
      { label: "Atuação", value: item.acting_rating },
      { label: "Direção", value: item.direction_rating },
      { label: "Cinematografia", value: item.cinematography_rating },
      { label: "Trilha", value: item.soundtrack_rating },
      { label: "Visual", value: item.visual_effects_rating },
    ].filter(c => c.value != null && c.value > 0);

    return (
      <View style={[styles.reviewCard, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: imageUrl || "https://via.placeholder.com/100" }} 
            style={isTv ? styles.episodeImage : styles.movieImage} 
            resizeMode="cover"
          />
          <View style={styles.headerInfo}>
            <Text style={[styles.mediaTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={[styles.mediaSubtitle, { color: theme.colors.secondary }]} numberOfLines={1}>{subtitle}</Text> : null}
            
            <View style={styles.ratingRow}>
              <View style={[styles.ratingBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                <Icon name="star" size={12} color={theme.colors.primary} />
                <Text style={{ fontWeight: 'bold', fontSize: 12, marginLeft: 4, color: theme.colors.onPrimaryContainer }}>{item.overall_rating}</Text>
              </View>
              {date ? <Text style={{ fontSize: 11, color: theme.colors.secondary, marginLeft: 8 }}>{date}</Text> : null}
            </View>
          </View>
        </View>

        {categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {categories.map((cat, idx) => (
              <View key={idx} style={[styles.catChip, { borderColor: theme.colors.outline }]}>
                <Text style={{ fontSize: 9, color: theme.colors.secondary }}>{cat.label}</Text>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.colors.onSurface, marginLeft: 4 }}>{cat.value}</Text>
              </View>
            ))}
          </View>
        )}

        {item.comment && (
          <View style={styles.commentBox}>
             <Text style={[styles.commentText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
               "{item.comment}"
             </Text>
          </View>
        )}

        <View style={styles.footerRow}>
          <Text style={{ fontSize: 10, color: theme.colors.outline }}>
            Avaliado em {new Date(item.created_at).toLocaleDateString("pt-BR")}
          </Text>
          {item.has_spoilers && (
            <View style={[styles.spoilerBadge, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={{ fontSize: 8, color: theme.colors.onErrorContainer, fontWeight: 'bold' }}>SPOILER</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>
            Minhas Reviews: {isMovie ? "Filmes" : "Séries"}
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" />
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.review_id}
            renderItem={renderReviewItem}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={stats ? <View style={{ marginBottom: 16 }}><ReviewStatsCard stats={stats} /></View> : null}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchInitialData} />}
            onEndReached={fetchMoreReviews}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 10 }} /> : <View style={{ height: 20 }} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="comment-text-outline" size={48} color={theme.colors.outline} />
                <Text style={{ marginTop: 12, color: theme.colors.secondary }}>Nenhuma avaliação encontrada.</Text>
              </View>
            }
          />
        )}
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: { margin: 16, borderRadius: 12, height: '90%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: 'rgba(128,128,128,0.1)' },
  listContent: { padding: 16 },
  reviewCard: { borderRadius: 8, padding: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  movieImage: { width: 50, height: 75, borderRadius: 4, backgroundColor: '#ccc' },
  episodeImage: { width: 80, height: 45, borderRadius: 4, backgroundColor: '#ccc' },
  headerInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  mediaTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  mediaSubtitle: { fontSize: 12, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  catChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2 },
  commentBox: { marginBottom: 12 },
  commentText: { fontStyle: 'italic', fontSize: 13, lineHeight: 18 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  spoilerBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
});