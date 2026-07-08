import { Request, Response } from "express";
import * as service from "./report.service";

export const getSalesReport = async (req: Request, res: Response) => {
  const { start, end } = req.query;
  const startDate = start ? new Date(start as string) : undefined;
  const endDate = end ? new Date(end as string) : undefined;

  try {
    const data = await service.generateSalesReport(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    res.status(400).send(err.message);
  }
};

export const getIncomingGoodsReport = async (req: Request, res: Response) => {
  const { start, end } = req.query;
  const startDate = start ? new Date(start as string) : undefined;
  const endDate = end ? new Date(end as string) : undefined;

  try {
    const data = await service.generateIncomingGoodsReport(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    res.status(400).send(err.message);
  }
};
export const getOutboundGoodsReport = async (req: Request, res: Response) => {
  const { start, end } = req.query;
  const startDate = start ? new Date(start as string) : undefined;
  const endDate = end ? new Date(end as string) : undefined;

  try {
    const data = await service.generateOutboundGoodsReport(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    res.status(400).send(err.message);
  }
};

export const getCurrentStockReport = async (req: Request, res: Response) => {
  const { start, end } = req.query;
  const startDate = start ? new Date(start as string) : undefined;
  const endDate = end ? new Date(end as string) : undefined;

  try {
    const data = await service.generateCurrentStockReport(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    res.status(400).send(err.message);
  }
};

export const getShippingReport = async (req: Request, res: Response) => {
  const { start, end } = req.query;
  const startDate = start ? new Date(start as string) : undefined;
  const endDate = end ? new Date(end as string) : undefined;

  try {
    const data = await service.generateShippingReport(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    res.status(400).send(err.message);
  }
};

export const getSalesByBrandYearly = async (req: Request, res: Response) => {
  const { year } = req.query;
  const queryYear = year ? parseInt(year as string) : new Date().getFullYear();

  try {
    const data = await service.generateSalesByBrandYearly(queryYear);
    res.json(data);
  } catch (err: any) {
    res.status(400).send(err.message);
  }
};
