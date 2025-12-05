// src/types/Review.ts

export interface RatingCounts {
  "1": number;
  "2": number;
  "3": number;
  "4": number;
  "5": number;
}

export interface CategoryAverage {
  category: string;
  average: number;
}

export interface ReviewStats {
  overall_average: number;
  total_reviews: number;
  rating_counts: RatingCounts;
  category_averages: CategoryAverage[];
}

export interface UserInfo {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

export interface Review {
  review_id: string;
  user: UserInfo;
  overall_rating: number;
  story_rating?: number;
  acting_rating?: number;
  direction_rating?: number;
  cinematography_rating?: number;
  soundtrack_rating?: number;
  visual_effects_rating?: number;
  comment: string | null;
  has_spoilers: boolean;
  created_at: string;
  updated_at: string;
  useful_count: number;
  not_useful_count: number;
  report_count: number;
}