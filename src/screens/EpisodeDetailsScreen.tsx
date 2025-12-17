import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Image, Dimensions, TouchableOpacity, StatusBar } from "react-native";
import { Text, useTheme, ActivityIndicator, IconButton, Button, Divider, Menu, Avatar } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useEpisodeDetails } from "../hooks/useEpisodeDetails";
import { formatDate } from "../utils/helpers";

const { width } = Dimensions.get("window");

export default function EpisodeDetailsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Parâmetros recebidos da navegação
  const { slug, seasonNumber, episodeNumber } = route.params;

  const {
    episode, previous, next, loading, actionLoading,
    toggleWatched, rateEpisode
  } = useEpisodeDetails(slug, seasonNumber, episodeNumber);

  const [menuVisible, setMenuVisible] = useState(false);

  // Navegar para outro episódio (substitui a tela atual na pilha ou dá push)
  const navigateToEpisode = (ep: any) => {
    navigation.replace("EpisodeDetails", {
      slug,
      seasonNumber: ep.season_number,
      episodeNumber: ep.episode_number
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!episode) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onBackground }}>Episódio não encontrado.</Text>
      </View>
    );
  }

  // Filtrar equipe principal
  const directors = episode.crew.filter((c: any) => c.job === "Director");
  const writers = episode.crew.filter((c: any) => c.job === "Writer" || c.job === "Screenplay");

  const isWatched = !!episode.watched_date;
  const feedback = episode.user_feedback;

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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Image */}
      <View style={styles.imageHeader}>
        <Image
          source={{ uri: episode.still_path?.tmdb ? `https://image.tmdb.org/t/p/w780${episode.still_path.tmdb}` : undefined }}
          style={styles.backdrop}
          resizeMode="cover"
        />
        <View style={styles.overlay} />

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Title Info over Image */}
        <View style={styles.headerContent}>
          <Text style={styles.showTitle}>{episode.tv_show.title}</Text>
          <Text style={styles.episodeTitle}>{episode.title}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Meta Data Row */}
        <View style={styles.metaRow}>
          <View style={styles.seasonBadge}>
            <Text style={styles.seasonText}>S{episode.season_number} E{episode.episode_number}</Text>
          </View>
          <Text style={[styles.metaText, { color: theme.colors.secondary }]}>
            {formatDate(episode.air_date)} • {episode.runtime} min
          </Text>
        </View>

        {/* Actions Row */}
        <View style={[styles.actionsRow, { borderColor: theme.colors.outlineVariant }]}>
          <Button
            mode={isWatched ? "contained" : "outlined"}
            onPress={toggleWatched}
            loading={actionLoading}
            icon={isWatched ? "check" : "eye-outline"}
            style={{ flex: 1, marginRight: 8 }}
          >
            {isWatched ? "Visto" : "Marcar Visto"}
          </Button>

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon={getFeedbackIcon()}
                iconColor={getFeedbackColor()}
                mode="outlined"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item onPress={() => { setMenuVisible(false); rateEpisode("liked"); }} title="Gostei" leadingIcon="thumb-up" />
            <Menu.Item onPress={() => { setMenuVisible(false); rateEpisode("not_like"); }} title="Não gostei" leadingIcon="thumb-down" />
            <Menu.Item onPress={() => { setMenuVisible(false); rateEpisode("favorite"); }} title="Favortio" leadingIcon="star" />
            <Divider />
            <Menu.Item onPress={() => { setMenuVisible(false); rateEpisode(null); }} title="Remover" leadingIcon="close" />
          </Menu>
        </View>

        {/* Overview */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Sinopse</Text>
        <Text style={[styles.bodyText, { color: theme.colors.onSurfaceVariant }]}>
          {episode.overview || "Sem descrição disponível."}
        </Text>

        {/* Crew Highlight */}
        <View style={styles.crewContainer}>
          {directors.length > 0 && (
            <View style={styles.crewItem}>
              <Text style={[styles.crewLabel, { color: theme.colors.secondary }]}>Direção</Text>
              <Text style={{ color: theme.colors.onSurface }}>{directors.map((d: any) => d.name).join(", ")}</Text>
            </View>
          )}
          {writers.length > 0 && (
            <View style={styles.crewItem}>
              <Text style={[styles.crewLabel, { color: theme.colors.secondary }]}>Roteiro</Text>
              <Text style={{ color: theme.colors.onSurface }}>{writers.map((w: any) => w.name).join(", ")}</Text>
            </View>
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navContainer}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            {previous && (
              <Button
                mode="outlined"
                onPress={() => navigateToEpisode(previous)}
                icon="arrow-left"
                compact
              >
                Anterior
              </Button>
            )}
          </View>
          <View style={{ flex: 1, paddingLeft: 8 }}>
            {next && (
              <Button
                mode="outlined"
                onPress={() => navigateToEpisode(next)}
                icon="arrow-right"
                contentStyle={{ flexDirection: 'row-reverse' }}
                compact
              >
                Próximo
              </Button>
            )}
          </View>
        </View>

        <Divider style={{ marginVertical: 20 }} />

        {/* Guest Stars / Cast */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Elenco do Episódio</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castList}>
          {episode.cast.map((person: any) => (
            <View key={person.id + person.character} style={styles.castCard}>
              {person.profile_path?.tmdb ? (
                <Image
                  source={{ uri: `https://image.tmdb.org/t/p/w185${person.profile_path.tmdb}` }}
                  style={styles.castImage}
                />
              ) : (
                <View style={[styles.castImage, { backgroundColor: theme.colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
                  <Icon name="account" size={30} color={theme.colors.onSurfaceVariant} />
                </View>
              )}
              <Text numberOfLines={1} style={[styles.castName, { color: theme.colors.onSurface }]}>{person.name}</Text>
              <Text numberOfLines={1} style={[styles.castChar, { color: theme.colors.secondary }]}>{person.character}</Text>
            </View>
          ))}
        </ScrollView>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageHeader: {
    height: 250,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    // Gradiente sutil simulado
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  headerContent: {
    padding: 16,
    paddingBottom: 24,
    // Fundo gradiente seria ideal aqui, mas usando sólido/transparente para simplificar
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  showTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  episodeTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16, // Sobreposição leve
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  seasonBadge: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  seasonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  metaText: {
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
    marginBottom: 16,
  },
  crewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  crewItem: {
    marginRight: 24,
    marginBottom: 8,
  },
  crewLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  castList: {
    paddingVertical: 8,
  },
  castCard: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
  },
  castImage: {
    width: 80,
    height: 80,
    borderRadius: 40, // Circular
    marginBottom: 8,
  },
  castName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  castChar: {
    fontSize: 10,
    textAlign: 'center',
  },
});