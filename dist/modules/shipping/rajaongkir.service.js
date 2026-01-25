"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShippingCost = exports.getCities = exports.getProvinces = void 0;
const axios_1 = __importDefault(require("axios"));
const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
const BASE_URL = "https://api.rajaongkir.com/starter";
const rajaongkir = axios_1.default.create({
    baseURL: BASE_URL,
    headers: {
        key: RAJAONGKIR_API_KEY,
    },
});
const getProvinces = async () => {
    const response = await rajaongkir.get("/province");
    return response.data.rajaongkir.results;
};
exports.getProvinces = getProvinces;
const getCities = async (provinceId) => {
    const response = await rajaongkir.get("/city", {
        params: { province: provinceId },
    });
    return response.data.rajaongkir.results;
};
exports.getCities = getCities;
const getShippingCost = async (params) => {
    const response = await rajaongkir.post("/cost", params);
    return response.data.rajaongkir.results;
};
exports.getShippingCost = getShippingCost;
