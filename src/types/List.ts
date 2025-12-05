export interface ListSummary {
  id: string;
  title: string;
  description?: string;
  is_public: boolean;
  stats: {
    items_count: number;
  };
}

export interface AddListItemPayload {
  items: {
    media_id: string;
    media_type: string;
  }[];
}