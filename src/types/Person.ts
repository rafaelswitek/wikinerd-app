// src/types/Person.ts

export interface Person {
  id: string;
  slug: string;
  name: string;
  profile_path: {
    tmdb: string | null;
  };
  known_for_department: string;
  place_of_birth?: string;
  birthday?: string;
  deathday?: string;
  biography?: string;
  has_movie_cast?: boolean;
  has_movie_crew?: boolean;
  has_tv_show_cast?: boolean;
  has_tv_show_crew?: boolean;
}

export interface PersonCredit {
  id: string;
  slug: string;
  title?: string;
  name?: string; 
  poster_path: {
    tmdb: string | null;
  };
  character?: string;
  job?: string;
  department?: string;
}

export interface PeopleResponse {
  current_page: number;
  last_page: number;
  total: number;
  data: Person[];
}