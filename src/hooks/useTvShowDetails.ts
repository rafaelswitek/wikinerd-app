import { useState, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { api } from "../services/api";
import { TvShow, Season, Episode } from "../types/TvShow";
import { CastMember, CrewMember, Provider } from "../types/Movie";
import { UserInteraction, MediaImage, MediaVideo } from "../types/Interactions";

export function useTvShowDetails(slug: string) {
  const [tvShow, setTvShow] = useState<TvShow | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  
  const [userInteraction, setUserInteraction] = useState<UserInteraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [seasonLoading, setSeasonLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [slug]);

  async function fetchData() {
    setLoading(true);
    setTvShow(null);
    
    try {
      const showRes = await api.get(`https://api.wikinerd.com.br/api/tv-shows/${slug}`);
      const showData = showRes.data;
      setTvShow(showData);

      if (showData.id) {
        const [providerRes, castRes, crewRes, imagesRes, videosRes] = await Promise.all([
          api.get(`https://api.wikinerd.com.br/api/tv-shows/${showData.id}/providers`).catch(() => ({ data: [] })),
          api.get(`https://api.wikinerd.com.br/api/tv-shows/${showData.id}/cast`).catch(() => ({ data: [] })),
          api.get(`https://api.wikinerd.com.br/api/tv-shows/${showData.id}/crew`).catch(() => ({ data: [] })),
          api.get(`https://api.wikinerd.com.br/api/tv-shows/${showData.id}/images`).catch(() => ({ data: [] })),
          api.get(`https://api.wikinerd.com.br/api/tv-shows/${showData.id}/videos`).catch(() => ({ data: [] })),
        ]);

        setProviders(providerRes.data);
        setCast(castRes.data);
        setCrew(crewRes.data);
        setImages(imagesRes.data);
        setVideos(videosRes.data);

        fetchUserInteraction(showData.id);
        
        // Se a API principal não retornar o status 'watched_date' dos episódios para o usuário logado,
        // pode ser necessário chamar um endpoint específico de seasons aqui ou a API já retorna se o token for enviado.
        // Assumindo que o endpoint principal já traz ou que precisamos recarregar:
        // refreshSeasons(showData.id); 
      }
    } catch (error) {
      console.error("Erro ao carregar dados da série:", error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshSeasons() {
    if (!tvShow?.id) return;
    try {
      // Endpoint hipotético para recarregar apenas temporadas com status atualizado do usuário
      // Ou recarregamos a série inteira se não houver endpoint específico
      const response = await api.get(`https://api.wikinerd.com.br/api/tv-shows/${slug}`);
      if (response.data.seasons) {
        setTvShow(prev => prev ? ({ ...prev, seasons: response.data.seasons }) : null);
      }
    } catch (error) {
      console.log("Erro ao atualizar temporadas", error);
    }
  }

  async function fetchUserInteraction(tvId: string) {
    try {
      const response = await api.get(`/users/tv-show/${tvId}`);
      setUserInteraction(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.log("Erro ao buscar status do usuário:", error);
      }
    }
  }

  const handleInteraction = async (field: 'status' | 'feedback', value: string) => {
    if (!tvShow) return;
    setInteractionLoading(true);

    const currentStatus = userInteraction?.status;
    const currentFeedback = userInteraction?.feedback;

    let newStatus = currentStatus;
    let newFeedback = currentFeedback;
    let watchedDate = userInteraction?.watched_date;

    if (field === 'status') {
      if (currentStatus === value) {
        newStatus = null;
        watchedDate = null;
      } else {
        newStatus = value as any;
        if (value === 'watched') {
          if (!watchedDate) watchedDate = new Date().toISOString().split('T')[0];
        } else {
          watchedDate = null;
        }
      }
    } else if (field === 'feedback') {
      if (currentFeedback === value) {
        newFeedback = null;
      } else {
        newFeedback = value as any;
        newStatus = 'watched';
        if (!watchedDate) watchedDate = new Date().toISOString().split('T')[0];
      }
    }

    try {
      if (!newStatus && !newFeedback && userInteraction?.id) {
        await api.delete(`/users/tv-show/${userInteraction.id}`);
        setUserInteraction(null);
      } else {
        const payload = {
          tv_show_id: tvShow.id,
          status: newStatus,
          feedback: newFeedback,
          watched_date: watchedDate
        };
        const response = await api.put('/users/tv-show', payload);
        setUserInteraction(response.data);
      }
    } catch (error) {
      console.error("Erro ao atualizar interação:", error);
      Alert.alert("Erro", "Não foi possível atualizar sua interação.");
    } finally {
      setInteractionLoading(false);
    }
  };

  const markSeasonWatched = async (seasonId: string) => {
    setSeasonLoading(true);
    try {
        await api.post(`/users/tv-show/season/${seasonId}/watched`);
        await refreshSeasons();
    } catch (error) {
        console.error("Erro ao marcar temporada:", error);
        Alert.alert("Erro", "Falha ao marcar temporada.");
    } finally {
        setSeasonLoading(false);
    }
  };

  const unmarkSeasonWatched = async (seasonId: string) => {
    setSeasonLoading(true);
    try {
        await api.delete(`/users/tv-show/season/${seasonId}/watched`);
        await refreshSeasons();
    } catch (error) {
        console.error("Erro ao desmarcar temporada:", error);
        Alert.alert("Erro", "Falha ao desmarcar temporada.");
    } finally {
        setSeasonLoading(false);
    }
  };

  const toggleEpisodeWatched = async (episodeId: string, isWatched: boolean) => {
    try {
        if (isWatched) {
            await api.delete(`/users/tv-show/episode/${episodeId}/watched`);
        } else {
            await api.post(`/users/tv-show/episode/${episodeId}/watched`);
        }
        await refreshSeasons();
    } catch (error) {
        console.error("Erro ao alternar episódio:", error);
    }
  };

  return {
    tvShow,
    providers,
    cast,
    crew,
    images,
    videos,
    userInteraction,
    loading,
    interactionLoading,
    seasonLoading,
    handleInteraction,
    markSeasonWatched,
    unmarkSeasonWatched,
    toggleEpisodeWatched
  };
}