import React, { useState } from "react";
import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Text, useTheme, IconButton, Menu, Divider, ActivityIndicator } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Episode } from "../types/TvShow";
import { formatDate } from "../utils/helpers";

interface Props {
  episode: Episode;
  onToggleWatched: (id: string, isWatched: boolean) => Promise<void>;
  onRate: (id: string, feedback: "liked" | "not_like" | "favorite" | null) => Promise<void>;
  serieSlug: string;
  user?: any;
}

export default function EpisodeItem({ episode, onToggleWatched, onRate, serieSlug, user }: Props) {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [menuVisible, setMenuVisible] = useState(false);

  const [isWatchLoading, setIsWatchLoading] = useState(false);
  const [isRateLoading, setIsRateLoading] = useState(false);

  const isWatched = !!episode.watched_date;
  const feedback = episode.user_feedback as "liked" | "not_like" | "favorite" | null;

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

  const handleToggleWatched = async () => {
    try {
      setIsWatchLoading(true);
      await onToggleWatched(episode.id, isWatched);
    } finally {
      setIsWatchLoading(false);
    }
  };

  const handleRate = async (value: "liked" | "not_like" | "favorite" | null) => {
    setMenuVisible(false);
    try {
      setIsRateLoading(true);
      await onRate(episode.id, value);
    } finally {
      setIsRateLoading(false);
    }
  };

  const handlePress = () => {
    navigation.navigate("EpisodeDetails", {
      title: `S${episode.season_number}E${episode.episode_number}: ${episode.title}`,
      slug: serieSlug,
      seasonNumber: episode.season_number,
      episodeNumber: episode.episode_number
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
      <TouchableOpacity
        style={styles.mainTouchable}
        onPress={handlePress}
        activeOpacity={0.7}
      >
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

          <Text style={[styles.overview, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
            {episode.overview || "Sem descrição."}
          </Text>
        </View>
      </TouchableOpacity>

      {user && (
        <View style={[styles.actionsContainer, { borderColor: theme.colors.outlineVariant }]}>
          <View style={styles.actionButtonWrapper}>
            {isWatchLoading ? (
              <ActivityIndicator size={20} color={theme.colors.primary} />
            ) : (
              <IconButton
                icon={isWatched ? "eye-check" : "eye-outline"}
                iconColor={isWatched ? theme.colors.primary : theme.colors.onSurfaceVariant}
                size={22}
                onPress={handleToggleWatched}
                style={styles.iconButton}
              />
            )}
          </View>

          <Divider style={{ width: '70%', alignSelf: 'center' }} />

          <View style={styles.actionButtonWrapper}>
            {isRateLoading ? (
              <ActivityIndicator size={20} color={getFeedbackColor()} />
            ) : (
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchorPosition="bottom"
                contentStyle={{ marginTop: 0 }}
                anchor={
                  <TouchableOpacity
                    onPress={() => setMenuVisible(true)}
                    activeOpacity={0.6}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <View pointerEvents="none">
                      <IconButton
                        icon={getFeedbackIcon()}
                        iconColor={getFeedbackColor()}
                        size={22}
                        style={styles.iconButton}
                      />
                    </View>
                  </TouchableOpacity>
                }
              >
                <Menu.Item onPress={() => handleRate("liked")} title="Gostei" leadingIcon="thumb-up" />
                <Menu.Item onPress={() => handleRate("not_like")} title="Não gostei" leadingIcon="thumb-down" />
                <Menu.Item onPress={() => handleRate("favorite")} title="Favorito" leadingIcon="heart" />
                {feedback && (
                  <>
                    <Divider />
                    <Menu.Item onPress={() => handleRate(null)} title="Remover" leadingIcon="close" />
                  </>
                )}
              </Menu>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 104,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mainTouchable: {
    flex: 1,
    flexDirection: 'row',
  },
  imageContainer: {
    width: 70,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  episodeNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 11,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  overview: {
    fontSize: 11,
    lineHeight: 15,
  },
  actionsContainer: {
    width: 48,
    borderLeftWidth: 1,
    height: '100%',
    justifyContent: 'space-between',
  },
  actionButtonWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    margin: 0,
  }
});