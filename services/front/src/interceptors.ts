import axios from "axios";

const customAxios = axios.create({
  baseURL: import.meta.env.VITE_BACK_BASE_URL,
});

export default customAxios;
