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
  release_date: string;
}
