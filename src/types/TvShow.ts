import { Country, Language, Company, Genre, Keyword } from "./Movie";

export interface Creator {
  id: string;
  name: string;
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
}

export interface Season {
  id: string;
  title: string;
  season_number: number;
  episode_count?: number; // Opcional, pois o JSON traz o array de episódios direto
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
  overview: string;
  number_of_seasons: number;
  number_of_episodes: number;
  rating_tmdb_average: string;
  rating_tmdb_count: number;
  episode_air_date?: string; // Data do próximo episódio ou último
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
  external_ids?: { platform: string; external_id: string }[];
}