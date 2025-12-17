    import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { api } from "../services/api";
import { EpisodeDetailsResponse, EpisodeDetails } from "../types/TvShow";

export function useEpisodeDetails(slug: string, seasonNumber: number, episodeNumber: number) {
  const [data, setData] = useState<EpisodeDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEpisode();
  }, [slug, seasonNumber, episodeNumber]);

  async function fetchEpisode() {
    setLoading(true);
    try {
      // URL baseada no seu payload: /api/tv-shows/:id/season/:seasonNumber/episode/:episodeNumber
      const response = await api.get<EpisodeDetailsResponse>(
        `/tv-shows/${slug}/season/${seasonNumber}/episode/${episodeNumber}`
      );
      setData(response.data);
    } catch (error) {
      console.error("Erro ao carregar episódio:", error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes do episódio.");
    } finally {
      setLoading(false);
    }
  }

  // Ações de interação (reutilizando a lógica do App)
  const toggleWatched = async () => {
    if (!data?.episode) return;
    
    const isWatched = !!data.episode.watched_date;
    setActionLoading(true);

    try {
      if (isWatched) {
        await api.delete(`/users/episode/${data.episode.id}`);
        // Atualiza estado local otimista ou refetch
        setData(prev => prev ? ({
          ...prev,
          episode: { ...prev.episode, watched_date: null }
        }) : null);
      } else {
        const today = new Date().toISOString().split('T')[0];
        await api.put(`/users/episode`, {
          episode_id: data.episode.id,
          watched_date: today
        });
        setData(prev => prev ? ({
          ...prev,
          episode: { ...prev.episode, watched_date: today }
        }) : null);
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar status.");
    } finally {
      setActionLoading(false);
    }
  };

  const rateEpisode = async (feedback: "liked" | "not_like" | "favorite" | null) => {
    if (!data?.episode) return;
    setActionLoading(true);
    try {
        const today = new Date().toISOString().split('T')[0];
        await api.put(`/users/episode`, {
            episode_id: data.episode.id,
            watched_date: data.episode.watched_date || today,
            feedback: feedback
        });
        
        setData(prev => prev ? ({
            ...prev,
            episode: { 
                ...prev.episode, 
                user_feedback: feedback as any,
                watched_date: prev.episode.watched_date || today
            }
        }) : null);
    } catch (error) {
        Alert.alert("Erro", "Falha ao enviar avaliação.");
    } finally {
        setActionLoading(false);
    }
  };

  return {
    episode: data?.episode,
    previous: data?.previous,
    next: data?.next,
    loading,
    actionLoading,
    toggleWatched,
    rateEpisode
  };
}