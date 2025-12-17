import { useState, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { api } from "../services/api";
import { Movie } from "../types/Movie";
import { TvShow } from "../types/TvShow";
import { UserInteraction, MediaImage, MediaVideo } from "../types/Interactions";
import { getRatings } from "../utils/helpers";

type MediaType = 'movie' | 'tv';

export function useMediaDetails(slug: string, type: MediaType = 'movie') {
  const [media, setMedia] = useState<Movie | TvShow | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [cast, setCast] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [collectionData, setCollectionData] = useState<{ id: string; name: string; movies: Movie[] } | null>(null);

  const [userInteraction, setUserInteraction] = useState<UserInteraction | null>(null);

  const [loading, setLoading] = useState(true);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [seasonLoading, setSeasonLoading] = useState(false);

  const { normalizedRatings, average } = useMemo(() => getRatings(media, type === 'tv' ? 'tv-show' : 'movie'), [media, type]);

  useEffect(() => {
    fetchData();
  }, [slug, type]);

  async function fetchData() {
    setLoading(true);
    setMedia(null);

    try {
      const endpoint = type === 'tv' ? 'tv-shows' : 'movies';
      const response = await api.get(`https://api.wikinerd.com.br/api/${endpoint}/${slug}`);
      const data = response.data;
      setMedia(data);

      if (data.id) {
        const promises = [
          api.get(`https://api.wikinerd.com.br/api/${endpoint}/${data.id}/providers`).catch(() => ({ data: [] })),
          api.get(`https://api.wikinerd.com.br/api/${endpoint}/${data.id}/cast`).catch(() => ({ data: [] })),
          api.get(`https://api.wikinerd.com.br/api/${endpoint}/${data.id}/crew`).catch(() => ({ data: [] })),
          api.get(`https://api.wikinerd.com.br/api/${endpoint}/${data.id}/images`).catch(() => ({ data: [] })),
          api.get(`https://api.wikinerd.com.br/api/${endpoint}/${data.id}/videos`).catch(() => ({ data: [] })),
        ];

        const [providerRes, castRes, crewRes, imagesRes, videosRes] = await Promise.all(promises);

        setProviders(providerRes.data);
        setCast(castRes.data);
        setCrew(crewRes.data);
        setImages(imagesRes.data);
        setVideos(videosRes.data);

        fetchUserInteraction(data.id);

        if (type === 'movie' && data.collection?.id) {
          try {
            const collectionRes = await api.get(`https://api.wikinerd.com.br/api/collection/${data.collection.id}/movies`);
            setCollectionData(collectionRes.data);
          } catch (err) {
            console.log("Erro coleção", err);
          }
        }
      }
    } catch (error) {
      console.error(`Erro ao carregar ${type}:`, error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshSeasons() {
    if (!media?.id || type !== 'tv') return;
    try {
      const response = await api.get(`https://api.wikinerd.com.br/api/tv-shows/${slug}`);
      if (response.data.seasons) {
        setMedia(prev => prev ? ({ ...prev, seasons: response.data.seasons }) : null);
      }
    } catch (error) {
      console.log("Erro ao atualizar temporadas", error);
    }
  }

  async function fetchUserInteraction(id: string) {
    try {
      const endpoint = type === 'tv' ? 'tv-show' : 'movie';
      const response = await api.get(`/users/${endpoint}/${id}`);
      setUserInteraction(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.log("Erro status user:", error);
      }
    }
  }

  const handleInteraction = async (field: 'status' | 'feedback', value: string | null) => {
    if (!media) return;
    setInteractionLoading(true);

    const endpoint = type === 'tv' ? 'tv-show' : 'movie';
    const idField = type === 'tv' ? 'tv_show_id' : 'movie_id';

    const currentStatus = userInteraction?.status;
    const currentFeedback = userInteraction?.feedback;

    let newStatus = currentStatus;
    let newFeedback = currentFeedback;

    let watchedDate = userInteraction?.watched_date;
    let finishedDate = (userInteraction as any)?.finished_date;

    const today = new Date().toISOString().split('T')[0];

    if (field === 'status') {
      if (value === null || currentStatus === value) {
        newStatus = null;
        newFeedback = null;
        
        if (type === 'movie') watchedDate = null;
        if (type === 'tv') finishedDate = null;
      } else {
        newStatus = value as any;

        if (type === 'movie') {
          if (value === 'watched') {
            if (!watchedDate) watchedDate = today;
          } else {
            watchedDate = null;
          }
        } else if (type === 'tv') {
          if (value === 'completed') {
            if (!finishedDate) finishedDate = today;
          } else {
            finishedDate = null;
          }
        }
      }
    } else if (field === 'feedback') {
      if (value === null || currentFeedback === value) {
        newFeedback = null;
      } else {
        newFeedback = value as any;

        if (type === 'movie') {
          newStatus = 'watched';
          if (!watchedDate) watchedDate = today;
        } else {
          if (newStatus !== 'completed') {
            newStatus = 'watching';
          }
        }
      }
    }

    try {
      if (!newStatus && !newFeedback && userInteraction?.id) {
        await api.delete(`/users/${endpoint}/${userInteraction.id}`);
        setUserInteraction(null);
      } else {
        const payload: any = {
          [idField]: media.id,
          status: newStatus,
          feedback: newFeedback,
        };

        if (type === 'movie') {
          payload.watched_date = watchedDate;
        } else {
          payload.finished_date = finishedDate;
        }

        const response = await api.put(`/users/${endpoint}`, payload);
        setUserInteraction(response.data);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar sua interação.");
    } finally {
      setInteractionLoading(false);
    }
  };

  const markSeasonWatched = async (seasonId: string) => {
    if (type !== 'tv') return;
    setSeasonLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.put(`/users/season/${seasonId}`, {
        watched_date: today
      });
      await refreshSeasons();
    } catch (error) {
      Alert.alert("Erro", "Falha ao marcar temporada.");
    } finally {
      setSeasonLoading(false);
    }
  };

  const unmarkSeasonWatched = async (seasonId: string) => {
    if (type !== 'tv') return;
    setSeasonLoading(true);
    try {
      await api.delete(`/users/season/${seasonId}`);
      await refreshSeasons();
    } catch (error) {
      Alert.alert("Erro", "Falha ao desmarcar temporada.");
    } finally {
      setSeasonLoading(false);
    }
  };

  const toggleEpisodeWatched = async (episodeId: string, isWatched: boolean) => {
    if (type !== 'tv') return;
    try {
      if (isWatched) {
        await api.delete(`/users/episode/${episodeId}`);
      } else {
        const today = new Date().toISOString().split('T')[0];
        await api.put(`/users/episode`, {
          episode_id: episodeId,
          watched_date: today
        });
      }
      await refreshSeasons();
    } catch (error) {
      console.error("Erro ao alternar episódio:", error);
    }
  };

  return {
    media,
    providers,
    cast,
    crew,
    images,
    videos,
    collectionData,
    userInteraction,
    loading,
    interactionLoading,
    seasonLoading,
    normalizedRatings,
    average,
    handleInteraction,
    markSeasonWatched,
    unmarkSeasonWatched,
    toggleEpisodeWatched
  };
}