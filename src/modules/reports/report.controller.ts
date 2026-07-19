import { Request, Response } from "express";
import * as service from "./report.service";
import { asyncHandler } from "../../utils/async-handler";

// Kelima laporan di bawah menerima rentang tanggal yang sama persis,
// yang membedakan cuma fungsi service yang dipanggil.
const rangeReport = (generate: (start?: Date, end?: Date) => Promise<any>) =>
  asyncHandler(async (req: Request, res: Response) => {
    const { start, end } = req.query;
    const data = await generate(
      start ? new Date(start as string) : undefined,
      end ? new Date(end as string) : undefined
    );
    res.json(data);
  });

export const getSalesReport = rangeReport(service.generateSalesReport);
export const getIncomingGoodsReport = rangeReport(service.generateIncomingGoodsReport);
export const getOutboundGoodsReport = rangeReport(service.generateOutboundGoodsReport);
export const getCurrentStockReport = rangeReport(service.generateCurrentStockReport);
export const getShippingReport = rangeReport(service.generateShippingReport);

export const getSalesByBrandYearly = asyncHandler(async (req: Request, res: Response) => {
  const { year } = req.query;
  const data = await service.generateSalesByBrandYearly(
    year ? parseInt(year as string) : new Date().getFullYear()
  );
  res.json(data);
});
