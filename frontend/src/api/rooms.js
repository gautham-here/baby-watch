import { http } from "./http";

export const roomsApi = {
  list: () => http.get("/rooms"),
  get: (id) => http.get(`/rooms/${id}`),
  ack: (id) => http.post(`/rooms/${id}/acknowledge`),
  insights: () => http.get("/insights")
};
