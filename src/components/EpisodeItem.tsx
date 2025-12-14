import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Text, useTheme, IconButton } from "react-native-paper";
import { Episode } from "../types/TvShow";
import { formatDate } from "../utils/helpers";

interface Props {
  episode: Episode;
  onToggleWatched: (id: string, isWatched: boolean) => void;
  serieSlug: string;
}

export default function EpisodeItem({ episode, onToggleWatched, serieSlug }: Props) {
  const theme = useTheme();
  const isWatched = !!episode.watched_date;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: episode.still_path?.tmdb ? `https://image.tmdb.org/t/p/w300${episode.still_path.tmdb}` : undefined }}
          style={[styles.image, { backgroundColor: theme.colors.surfaceVariant }]}
        />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
            <Text style={[styles.episodeNumber, { color: theme.colors.secondary }]}>
                S{episode.season_number} E{episode.episode_number}
            </Text>
            <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
                {formatDate(episode.air_date)}
            </Text>
        </View>
        
        <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {episode.title}
        </Text>
        
        <Text style={[styles.overview, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
            {episode.overview || "Sem descrição."}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: isWatched ? theme.colors.primary : 'transparent', borderColor: isWatched ? theme.colors.primary : theme.colors.outline }]}
        onPress={() => onToggleWatched(episode.id, isWatched)}
      >
        <IconButton 
            icon={isWatched ? "eye-off" : "eye"} 
            iconColor={isWatched ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
            size={20}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    height: 100,
  },
  imageContainer: {
    width: 140,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  episodeNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overview: {
    fontSize: 11,
    lineHeight: 16,
  },
  actionButton: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
  }
});