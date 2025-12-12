// src/types/List.ts

import { Movie } from "./Movie";
import { TvShow } from "./TvShow";

export interface ListStats {
  items_count: number;
  views_count: number;
  favorites_count: number;
  comments_count: number;
}

export interface ListUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

export interface ListSummary {
  id: string;
  title: string;
  description?: string;
  is_public: boolean;
  is_official: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  keywords: string[];
  stats: ListStats;
  user: ListUser;
}

export interface AddListItemPayload {
  items: {
    media_id: string;
    media_type: string;
  }[];
}

export interface ListResponse {
  data: ListSummary[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export interface CreateListPayload {
  title: string;
  description?: string;
  is_public: boolean;
  keywords?: string[];
}

export interface ListItem {
  item_id: string;
  user_order: number;
  media_type: string;
  media: Movie | TvShow;
}

export interface ListDetails extends ListSummary {
  items: ListItem[];
}