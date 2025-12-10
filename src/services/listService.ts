// src/services/listService.ts
import { api } from "./api";
import { ListSummary, AddListItemPayload, ListResponse } from "../types/List";

export const ListService = {
  getUserLists: async () => {
    // Mantendo para compatibilidade com o Modal existente
    const response = await api.get<{ data: ListSummary[] }>("/lists", {
      params: { filter: "mine", per_page: 100 }
    });
    return response.data.data;
  },

  getLists: async (filter: 'mine' | 'favorite' | 'community' | 'official', page = 1, search = "") => {
    const params: any = { filter, page, per_page: 10 };
    if (search) params.search = search;
    
    const response = await api.get<ListResponse>("/lists", { params });
    return response.data;
  },

  addItemsToList: async (listId: string, payload: AddListItemPayload) => {
    const response = await api.post(`/lists/${listId}/items`, payload);
    return response.data;
  }
};