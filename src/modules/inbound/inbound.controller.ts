import { Request, Response } from "express";
import * as pos from "./inbound.service";

export const handleCreateinboundTransaction = async (req: Request, res: Response) => {
  try {
    const { receiptUrl, totalItemsOnReceipt, notes, items } = req.body;

    if (!receiptUrl || !totalItemsOnReceipt || !items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    if (items.length === 0) {
      return res.status(400).json({ message: "PO must have at least one item" });
    }

    const po = await pos.createinboundTransaction({
      receiptUrl,
      totalItemsOnReceipt,
      notes,
      items,
    });

    res.status(201).json({
      message: "Inbound Transaction created successfully",
      inboundTransaction: po,
    });
  } catch (error: any) {
    console.error("Inbound Transaction creation error:", error);
    res.status(500).json({ message: "Failed to create Inbound Transaction", error: error.message });
  }
};

export const handleListinboundTransactions = async (req: Request, res: Response) => {
  try {
    const list = await pos.listinboundTransactions();
    res.status(200).json({ inboundTransactions: list });
  } catch (error: any) {
    console.error("List Inbound Transaction error:", error);
    res.status(500).json({ message: "Failed to fetch Inbound Transactions", error: error.message });
  }
};

export const handleGetinboundTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const po = await pos.getinboundTransactionById(id);

    if (!po) {
      return res.status(404).json({ message: "Inbound Transaction not found" });
    }

    res.status(200).json({ inboundTransaction: po });
  } catch (error: any) {
    console.error("Get Inbound Transaction error:", error);
    res.status(500).json({ message: "Failed to fetch Inbound Transaction", error: error.message });
  }
};
