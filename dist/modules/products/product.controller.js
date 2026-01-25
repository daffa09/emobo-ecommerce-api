"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopSelling = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductsAdmin = exports.getPublicProducts = void 0;
const response_1 = require("~/utils/response");
const service = __importStar(require("./product.service"));
const getPublicProducts = async (_req, res) => {
    const data = await service.listPublicProducts();
    return (0, response_1.sendResponse)(res, 200, "fetch data success", data);
};
exports.getPublicProducts = getPublicProducts;
const getProductsAdmin = async (_req, res) => {
    const data = await service.listProductsForAdmin();
    return (0, response_1.sendResponse)(res, 200, "fetch data success", data);
};
exports.getProductsAdmin = getProductsAdmin;
const createProduct = async (req, res) => {
    const payload = req.body;
    const product = await service.createProduct(payload);
    return (0, response_1.sendResponse)(res, 201, "product created", product);
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const id = Number(req.params.id);
    const product = await service.updateProduct(id, req.body);
    return (0, response_1.sendResponse)(res, 200, "product updated", product);
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const id = Number(req.params.id);
    await service.deleteProduct(id);
    return (0, response_1.sendResponse)(res, 200, "product deleted");
};
exports.deleteProduct = deleteProduct;
const getTopSelling = async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    try {
        const products = await service.getTopSellingProducts(limit);
        return (0, response_1.sendResponse)(res, 200, "fetch data success", products);
    }
    catch (err) {
        return (0, response_1.sendResponse)(res, 400, err.message);
    }
};
exports.getTopSelling = getTopSelling;
