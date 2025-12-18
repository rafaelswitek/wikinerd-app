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

export interface FeedbackCounts {
  useful: number;
  not_useful: number;
  report: number;
  total: number;
}

export interface ReviewEpisode {
  id: number;
  name: string;
  season_number: number;
  episode_number: number;
  still_path?: string | null;
}

export interface Review {
  review_id: string;
  user: UserInfo;
  movie_id: string;
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
  
  feedback_counts: FeedbackCounts;
  user_feedback: 'useful' | 'not_useful' | 'report' | null;

  episode?: ReviewEpisode;
}