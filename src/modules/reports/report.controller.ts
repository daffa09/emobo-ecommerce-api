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
