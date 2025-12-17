import React, { useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Text, useTheme, IconButton, Menu, Divider } from "react-native-paper";
import { Episode } from "../types/TvShow";
import { formatDate } from "../utils/helpers";

interface Props {
  episode: Episode;
  onToggleWatched: (id: string, isWatched: boolean) => void;
  onRate: (id: string, feedback: "liked" | "not_like" | "favorite" | null) => void;
  serieSlug: string;
}

export default function EpisodeItem({ episode, onToggleWatched, onRate, serieSlug }: Props) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const isWatched = !!episode.watched_date;
  
  // Recupera o feedback injetado pelo hook (se existir)
  const feedback = (episode as any).feedback; 

  const getFeedbackIcon = () => {
    switch(feedback) {
      case 'liked': return 'thumb-up';
      case 'not_like': return 'thumb-down';
      case 'favorite': return 'heart';
      default: return 'star-outline';
    }
  };

  const getFeedbackColor = () => {
    switch(feedback) {
      case 'liked': return theme.colors.primary;
      case 'not_like': return theme.colors.error;
      case 'favorite': return '#E91E63';
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const handleRate = (value: "liked" | "not_like" | "favorite" | null) => {
    setMenuVisible(false);
    onRate(episode.id, value);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: episode.still_path?.tmdb ? `https://image.tmdb.org/t/p/w300${episode.still_path.tmdb}` : undefined }}
          style={[styles.image, { backgroundColor: theme.colors.surfaceVariant }]}
          resizeMode="cover"
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
        
        <Text style={[styles.overview, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
            {episode.overview || "Sem descrição."}
        </Text>
      </View>

      <View style={[styles.actionsContainer, { borderColor: theme.colors.outline }]}>
        <TouchableOpacity 
          style={[styles.actionButton, { borderBottomWidth: 1, borderColor: theme.colors.outlineVariant }]}
          onPress={() => onToggleWatched(episode.id, isWatched)}
          activeOpacity={0.7}
        >
          <IconButton 
              icon={isWatched ? "eye-check" : "eye-outline"} 
              iconColor={isWatched ? theme.colors.primary : theme.colors.onSurfaceVariant}
              size={24}
              style={{ margin: 0 }}
          />
        </TouchableOpacity>

        <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchorPosition="bottom"
            anchor={
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => setMenuVisible(true)}
                    activeOpacity={0.7}
                >
                    <IconButton 
                        icon={getFeedbackIcon()} 
                        iconColor={getFeedbackColor()}
                        size={24}
                        style={{ margin: 0 }}
                    />
                </TouchableOpacity>
            }
        >
            <Menu.Item onPress={() => handleRate("liked")} title="Gostei" leadingIcon="thumb-up" />
            <Menu.Item onPress={() => handleRate("not_like")} title="Não gostei" leadingIcon="thumb-down" />
            <Menu.Item onPress={() => handleRate("favorite")} title="Amei" leadingIcon="heart" />
            {feedback && (
                <>
                    <Divider />
                    <Menu.Item onPress={() => handleRate(null)} title="Remover" leadingIcon="close" />
                </>
            )}
        </Menu>
      </View>
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
    height: 120, // Aumentado para acomodar melhor os dois botões verticalmente
  },
  imageContainer: {
    width: 120, // Ajustado para equilibrar o layout
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
  actionsContainer: {
    width: 60, // Largura suficiente para o toque
    borderLeftWidth: 1,
    height: '100%',
  },
  actionButton: {
    flex: 1, // Ocupa exatamente 50% da altura cada
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  }
});