// src/types/Interactions.ts

export interface UserInteraction {
  id: string;
  user_id: string;
  movie_id: string;
  watched_date: string | null;
  status: 'watched' | 'want_to_watch' | null;
  feedback: 'liked' | 'not_like' | 'favorite' | null;
  created_at: string;
  updated_at: string;
}

export interface MediaImage {
  id: string;
  file_path: string;
  aspect_ratio: string;
  height: number;
  width: number;
  type: string;
}

export interface MediaVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}