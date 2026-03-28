import { Request, Response } from "express";
import * as pos from "./purchase-order.service";

export const handleCreatePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { receiptUrl, totalItemsOnReceipt, notes, items } = req.body;

    if (!receiptUrl || !totalItemsOnReceipt || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    if (items.length === 0) {
      return res.status(400).json({ message: "PO must have at least one item" });
    }

    const po = await pos.createPurchaseOrder({
      receiptUrl,
      totalItemsOnReceipt,
      notes,
      items,
    });

    res.status(201).json({
      message: "Purchase Order created successfully",
      purchaseOrder: po,
    });
  } catch (error: any) {
    console.error("Purchase Order creation error:", error);
    res.status(500).json({ message: "Failed to create Purchase Order", error: error.message });
  }
};

export const handleListPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const list = await pos.listPurchaseOrders();
    res.status(200).json({ purchaseOrders: list });
  } catch (error: any) {
    console.error("List Purchase Order error:", error);
    res.status(500).json({ message: "Failed to fetch Purchase Orders", error: error.message });
  }
};

export const handleGetPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const po = await pos.getPurchaseOrderById(Number(id));

    if (!po) {
      return res.status(404).json({ message: "Purchase Order not found" });
    }

    res.status(200).json({ purchaseOrder: po });
  } catch (error: any) {
    console.error("Get Purchase Order error:", error);
    res.status(500).json({ message: "Failed to fetch Purchase Order", error: error.message });
  }
};
