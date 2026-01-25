import axios from "axios";

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
const BASE_URL = "https://api.rajaongkir.com/starter";

const rajaongkir = axios.create({
  baseURL: BASE_URL,
  headers: {
    key: RAJAONGKIR_API_KEY,
  },
});

export const getProvinces = async () => {
  const response = await rajaongkir.get("/province");
  return response.data.rajaongkir.results;
};

export const getCities = async (provinceId?: string) => {
  const response = await rajaongkir.get("/city", {
    params: { province: provinceId },
  });
  return response.data.rajaongkir.results;
};

export const getShippingCost = async (params: {
  origin: string;
  destination: string;
  weight: number;
  courier: string;
}) => {
  const response = await rajaongkir.post("/cost", params);
  return response.data.rajaongkir.results;
};
