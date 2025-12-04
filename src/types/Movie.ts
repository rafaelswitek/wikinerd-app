
export interface Genre {
  id: string;
  slug: string;
  name: string;
}

export interface Keyword {
  id: string;
  name: string;
}

export interface Provider {
  id: string;
  name: string;
  logo_path: {
    tmdb: string;
  };
  type: "buy" | "rent" | "flatrate";
  display_priority: number;
}

export interface ExternalId {
  platform: string;
  external_id: string;
}

export interface Collection {
  id: string;
  name: string;
  poster_path: {
    tmdb: string | null;
  };
  backdrop_path: {
    tmdb: string | null;
  };
}

export interface Movie {
  id: string;
  slug: string;
  title: string;
  original_title: string;
  poster_path: {
    tmdb: string | null;
  };
  backdrop_path: {
    tmdb: string | null;
  };
  overview: string;
  runtime: number;
  rating_tmdb_average: string;
  rating_tmdb_count?: number;
  release_date: string;
  certification?: string;
  budget?: string;
  revenue?: string;
  tagline?: string;
  status?: string;
  genres?: Genre[];
  keywords?: Keyword[];
  external_ids?: ExternalId[];
  collection?: Collection;
}

export interface CastMember {
  id: string;
  name: string;
  character: string;
  profile_path: {
    tmdb: string | null;
  };
}

export interface CrewMember {
  id: string;
  name: string;
  job: {
    job: string;
    department: string;
  };
  profile_path: {
    tmdb: string | null;
  };
}

export interface MoviesResponse {
  current_page: number;
  data: Movie[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}