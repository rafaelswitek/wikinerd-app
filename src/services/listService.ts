import { api } from "./api";
import { ListSummary, AddListItemPayload } from "../types/List";

export const ListService = {
  getUserLists: async () => {
    const response = await api.get<{ data: ListSummary[] }>("/lists", {
      params: { filter: "mine", per_page: 100 }
    });
    return response.data.data;
  },

  addItemsToList: async (listId: string, payload: AddListItemPayload) => {
    const response = await api.post(`/lists/${listId}/items`, payload);
    return response.data;
  }
};