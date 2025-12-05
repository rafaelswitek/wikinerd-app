import { useState, useEffect, useMemo } from "react";
import { Alert } from "react-native";
import { api } from "../services/api";
import { Movie, CastMember, CrewMember, Provider, Collection } from "../types/Movie";
import { UserInteraction, MediaImage, MediaVideo } from "../types/Interactions";
import { getRatings } from "../utils/helpers";

export function useMediaDetails(slug: string) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [collectionData, setCollectionData] = useState<{ id: string; name: string; movies: Movie[] } | null>(null);
  
  const [userInteraction, setUserInteraction] = useState<UserInteraction | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [interactionLoading, setInteractionLoading] = useState(false);

  const { normalizedRatings, average } = useMemo(() => getRatings(movie, 'movie'), [movie]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setMovie(null);
      
      try {
        const movieRes = await api.get(`https://api.wikinerd.com.br/api/movies/${slug}`);
        const movieData = movieRes.data;
        setMovie(movieData);

        if (movieData.id) {
          const [providerRes, castRes, crewRes, imagesRes, videosRes] = await Promise.all([
            api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/providers`),
            api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/cast`),
            api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/crew`),
            api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/images`),
            api.get(`https://api.wikinerd.com.br/api/movies/${movieData.id}/videos`),
          ]);

          setProviders(providerRes.data);
          setCast(castRes.data);
          setCrew(crewRes.data);
          setImages(imagesRes.data);
          setVideos(videosRes.data);

          fetchUserInteraction(movieData.id);

          if (movieData.collection?.id) {
            try {
              const collectionRes = await api.get(`https://api.wikinerd.com.br/api/collection/${movieData.collection.id}/movies`);
              setCollectionData(collectionRes.data);
            } catch (err) {
              console.error("Erro ao carregar coleção:", err);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  async function fetchUserInteraction(movieId: string) {
    try {
      const response = await api.get(`/users/movie/${movieId}`);
      setUserInteraction(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.log("Erro ao buscar status do usuário:", error);
      }
    }
  }

  const handleInteraction = async (field: 'status' | 'feedback', value: string) => {
    if (!movie) return;
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
          if (!watchedDate) {
            watchedDate = new Date().toISOString().split('T')[0];
          }
        } else {
          watchedDate = null;
        }
      }
    } else if (field === 'feedback') {
      if (currentFeedback === value) {
        newFeedback = null;
      } else {
        newFeedback = value as any;
        // REGRA: Ao marcar feedback, define automaticamente como assistido
        newStatus = 'watched';
        if (!watchedDate) {
            watchedDate = new Date().toISOString().split('T')[0];
        }
      }
    }

    try {
      if (!newStatus && !newFeedback && userInteraction?.id) {
        await api.delete(`/users/movie/${userInteraction.id}`);
        setUserInteraction(null);
      } else {
        const payload = {
          movie_id: movie.id,
          status: newStatus,
          feedback: newFeedback,
          watched_date: watchedDate
        };
        const response = await api.put('/users/movie', payload);
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
    movie,
    providers,
    cast,
    crew,
    images,
    videos,
    collectionData,
    userInteraction,
    loading,
    interactionLoading,
    normalizedRatings,
    average,
    handleInteraction
  };
}