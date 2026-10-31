import axios from "axios";
export const API_BASE = import.meta.env.VITE_API_URL || "/api";
export const api = axios.create({ baseURL: API_BASE, timeout: 20000 });
api.interceptors.request.use((c) => {
  const t = sessionStorage.getItem("eveeride.token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
export { rupees, when } from "./format.js";
export const blank = {
  user: { name: "Your workspace", wallet: {}, purchases: 0 },
  available: 0,
  withdrawable: 0,
  pending: 0,
  totals: {},
  recent: [],
  activePlans: [],
  plans: [],
};
