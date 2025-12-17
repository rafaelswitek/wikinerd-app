import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { api } from "../services/api";
import { EpisodeDetailsResponse } from "../types/TvShow";

export function useEpisodeDetails(tvShowId: string, seasonNumber: number, episodeNumber: number) {
  const [data, setData] = useState<EpisodeDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEpisode();
  }, [tvShowId, seasonNumber, episodeNumber]);

  async function fetchEpisode() {
    setLoading(true);
    try {
      // 1. Busca os detalhes públicos do episódio
      const response = await api.get<EpisodeDetailsResponse>(
        `/tv-shows/${tvShowId}/season/${seasonNumber}/episode/${episodeNumber}`
      );
      
      const responseData = response.data;

      // 2. Se o episódio existe, busca a interação do usuário (visto/feedback)
      if (responseData.episode?.id) {
        try {
          const interactionRes = await api.get(`/users/episode/${responseData.episode.id}`);
          
          // Mescla os dados de interação no objeto do episódio
          if (interactionRes.data) {
            responseData.episode.watched_date = interactionRes.data.watched_date;
            // Mapeia 'feedback' da API para 'user_feedback' do frontend
            responseData.episode.user_feedback = interactionRes.data.feedback;
          }
        } catch (error: any) {
          // Se der 404, significa que o usuário nunca interagiu (não viu/não avaliou),
          // então mantemos como null. Ignoramos o erro.
          if (error.response?.status !== 404) {
             console.log("Erro ao buscar interação:", error);
          }
        }
      }

      setData(responseData);
    } catch (error) {
      console.error("Erro ao carregar detalhes do episódio:", error);
      Alert.alert("Erro", "Não foi possível carregar o episódio.");
    } finally {
      setLoading(false);
    }
  }

  // Ações de interação (Marcar Visto / Avaliar)
  const toggleWatched = async () => {
    if (!data?.episode) return;
    
    const isWatched = !!data.episode.watched_date;
    setActionLoading(true);

    try {
      if (isWatched) {
        // Remove a visualização
        await api.delete(`/users/episode/${data.episode.id}`);
        
        setData(prev => prev ? ({
          ...prev,
          episode: { ...prev.episode, watched_date: null, user_feedback: null }
        }) : null);
      } else {
        // Marca como visto
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
        
        // A avaliação também garante que o episódio esteja marcado como visto
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