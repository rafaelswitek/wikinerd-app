import { useState, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { api } from "../services/api";
import { TvShow } from "../types/TvShow";
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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setTvShow(null);
      
      try {
        const showRes = await api.get(`https://api.wikinerd.com.br/api/tv-shows/${slug}`);
        const showData = showRes.data;
        setTvShow(showData);

        if (showData.id) {
          // Buscando dados complementares em paralelo
          // Assumindo que a API segue o mesmo padrão de filmes para créditos e imagens
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
        }
      } catch (error) {
        console.error("Erro ao carregar dados da série:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  async function fetchUserInteraction(tvId: string) {
    try {
      // Ajuste o endpoint conforme sua API backend para User Interactions de séries
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
    handleInteraction
  };
}