import axios from "axios";

export const api = {
  get: (url: string) => axios.get(url),
};
