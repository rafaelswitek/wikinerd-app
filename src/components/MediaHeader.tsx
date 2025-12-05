import React from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { Text, useTheme, Button } from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Movie } from "../types/Movie";
import { getCertificationColor, getMediaYear, formatRuntime } from "../utils/helpers";

const { width } = Dimensions.get("window");

interface Props {
  movie: Movie;
  handleShare: () => void;
}

export default function MediaHeader({ movie, handleShare }: Props) {
  const theme = useTheme();
  
  const backdrop = movie.backdrop_path?.tmdb
    ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path.tmdb}`
    : null;
  const poster = movie.poster_path?.tmdb
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path.tmdb}`
    : null;

  return (
    <View style={styles.headerWrapper}>
      {backdrop && <Image source={{ uri: backdrop }} style={styles.backdrop} resizeMode="cover" />}
      <View style={[styles.overlay, { backgroundColor: theme.dark ? 'rgba(6, 13, 23, 0.7)' : 'rgba(255, 255, 255, 0.3)' }]} />
      <View style={styles.headerContent}>
        <Image source={{ uri: poster || undefined }} style={styles.poster} />
        <View style={styles.headerInfo}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>{movie.title}</Text>
          <Text variant="bodyMedium" style={[styles.originalTitle, { color: theme.colors.secondary }]}>{movie.original_title}</Text>
          
          <View style={styles.badgesRow}>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.statusText}>Lançado</Text>
            </View>
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
            mode="outlined"
            icon="share-variant"
            textColor={theme.colors.onBackground}
            style={[styles.actionButton, { borderColor: theme.colors.outline }]}
            onPress={handleShare}
          >
            Compartilhar
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});