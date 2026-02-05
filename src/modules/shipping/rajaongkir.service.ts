import axios from "axios";

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
const BASE_URL = "https://rajaongkir.komerce.id/api/v1";

const rajaongkir = axios.create({
  baseURL: BASE_URL,
  headers: {
    "key": RAJAONGKIR_API_KEY,
  },
});

export const getProvinces = async () => {
  const response = await rajaongkir.get("/destination/province");
  const provinces = response.data.data || response.data;
  
  // Normalize to expected format for frontend
  return provinces.map((p: any) => ({
    province_id: String(p.province_id || p.id),
    province: p.province || p.province_name || p.name,
  }));
};


export const getCities = async (provinceId?: string) => {
  if (!provinceId) {
    return [];
  }
  const response = await rajaongkir.get(`/destination/city/${provinceId}`);
  const cities = response.data.data || response.data;
  
  // Map to expected format for frontend
  return cities.map((city: any) => ({
    city_id: String(city.city_id || city.id),
    province_id: String(city.province_id || provinceId),
    city_name: city.city_name || city.name,
    type: city.type || "Kota",
    postal_code: city.postal_code || "",
  }));
};

export const getShippingCost = async (params: {
  origin: string;
  destination: string;
  weight: number;
  courier: string;
}) => {
  console.log("Calculating shipping cost with params:", params);
  
  const response = await rajaongkir.post(
    "/calculate/domestic-cost",
    new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      weight: params.weight.toString(),
      courier: params.courier,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  
  console.log("Shipping cost API response:", JSON.stringify(response.data, null, 2));
  
  // Handle Komerce API response format
  const results = response.data.data || response.data;
  
  // Normalize response to match expected format
  // Komerce returns: { service: "REG", description: "...", cost: 15000, etd: "2-3 Hari" }
  if (Array.isArray(results)) {
    return results.map((item: any) => ({
      service: item.service,
      description: item.description || item.name || "",
      cost: [{
        value: typeof item.cost === 'number' ? item.cost : (item.cost?.[0]?.value || 0),
        etd: item.etd || "",
        note: item.note || "",
      }],
    }));
  }
  
  return [];
};
