// src/services/listService.ts
import { api } from "./api";
import { ListSummary, AddListItemPayload, ListResponse, CreateListPayload, ListDetails } from "../types/List";

export const ListService = {
  getUserLists: async () => {
    // Mantendo para compatibilidade com o Modal existente
    const response = await api.get<{ data: ListSummary[] }>("/lists", {
      params: { filter: "mine", per_page: 100 }
    });
    return response.data.data;
  },

  getLists: async (filter: 'mine' | 'favorite' | 'community' | 'official', page = 1, search = "") => {
    const params: any = { page, per_page: 10 };

    if (search) params.search = search;

    // Ajuste da lógica de filtros conforme as rotas especificadas
    switch (filter) {
      case 'mine':
        params.filter = 'mine';
        break;
      case 'favorite':
        params.filter = 'favorites';
        break;
      case 'official':
        params.filter = 'official';
        break;
      case 'community':
        // Comunidade usa a rota base /lists sem parametro filter
        break;
    }

    const response = await api.get<ListResponse>("/lists", { params });
    return response.data;
  },

  addItemsToList: async (listId: string, payload: AddListItemPayload) => {
    const response = await api.post(`/lists/${listId}/items`, payload);
    return response.data;
  },

  createList: async (payload: CreateListPayload) => {
    const response = await api.post("/lists", payload);
    return response.data.data; // Retorna a lista criada
  },

  deleteList: async (listId: string) => {
    await api.delete(`/lists/${listId}`);
  },

  getListDetails: async (id: string) => {
    const response = await api.get<{ data: ListDetails }>(`/lists/${id}`, {
      params: { order: 'desc', sortBy: 'title' }
    });
    return response.data.data;
  },

  searchKeywords: async (query: string) => {
    if (!query) return [];
    const response = await api.get<{ name: string }[]>("/keywords", {
      params: { search: query.toLowerCase() }
    });
    return response.data;
  },
};