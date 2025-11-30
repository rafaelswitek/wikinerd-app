export interface Series {
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
  number_of_seasons: number;
  number_of_episodes: number;
  rating_tmdb_average: string;
  episode_air_date: string; 
  certification?: string;
}
