import { Country, Language, Company, Genre, Keyword } from "./Movie";
import { CastMember, CrewMember } from "./Person"; 
import { MediaImage, MediaVideo } from "./Interactions";

export interface Creator {
  id: string;
  name: string;
  slug: string;
  profile_path: { tmdb: string | null } | null;
}

export interface Episode {
  id: string;
  title: string;
  episode_number: number;
  season_number: number;
  overview: string;
  air_date: string;
  runtime: number;
  still_path: { tmdb: string | null };
  rating_tmdb_average: string;
  watched_date?: string | null;
  user_feedback?: 'liked' | 'not_like' | 'favorite' | null;
}

export interface Season {
  id: string;
  title: string;
  season_number: number;
  episode_count?: number;
  poster_path: { tmdb: string | null };
  overview: string;
  air_date?: string;
  rating_tmdb_average: string;
  episodes: Episode[];
}

export interface TvShow {
  id: string;
  slug: string;
  title: string;
  original_title: string;
  poster_path: { tmdb: string | null };
  backdrop_path: { tmdb: string | null };
  adult_content: boolean;
  overview: string;
  number_of_seasons: number;
  number_of_episodes: number;
  rating_tmdb_average: string;
  rating_tmdb_count: number;
  episode_air_date?: string;
  first_air_date?: string;
  certification?: string;
  status: string;
  tagline: string;
  type: string;
  in_production: boolean;
  genres: Genre[];
  companies: Company[];
  countries: Country[];
  languages: Language[];
  keywords: Keyword[];
  creators: Creator[];
  seasons: Season[];
  external_ids: { platform: string; external_id: string }[];
}

export interface EpisodeDetails extends Episode {
  cast: any[]; // ou CastMember[] se tiver o tipo Person definido
  crew: any[]; // ou CrewMember[]
  images: MediaImage[];
  videos: MediaVideo[];
  tv_show: {
    id: string;
    slug: string;
    title: string;
    poster_path: { tmdb: string | null };
    backdrop_path: { tmdb: string | null };
  };
  season: {
    id: string;
    title: string;
    poster_path: { tmdb: string | null };
  };
}

export interface EpisodeDetailsResponse {
  episode: EpisodeDetails;
  previous: Episode | null;
  next: Episode | null;
}