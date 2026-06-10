import { Request, Response } from "express";
import prisma from "../../prisma";
import { sendResponse } from "../../utils/response";

export const getProfile = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
      biodata: {
        select: {
          name: true,
          phone: true,
          image: true,
          address: true,
          addressNotes: true,
          provinceId: true,
          cityId: true,
          latitude: true,
          longitude: true,
        }
      }
    },
  });

  if (!user) return sendResponse(res, 404, "User not found");

  const flatUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
    name: user.biodata?.name,
    phone: user.biodata?.phone,
    image: user.biodata?.image,
    address: user.biodata?.address,
    addressNotes: user.biodata?.addressNotes,
    provinceId: user.biodata?.provinceId,
    cityId: user.biodata?.cityId,
    latitude: user.biodata?.latitude,
    longitude: user.biodata?.longitude,
  };

  return sendResponse(res, 200, "fetch profile success", flatUser);
};

export const updateProfile = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.id;
  const { name, phone, image, address, addressNotes, provinceId, cityId, latitude, longitude } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        biodata: {
          upsert: {
            create: {
              name: name || "User",
              phone: phone || "",
              image, address, addressNotes, provinceId, cityId,
              latitude: latitude !== undefined ? parseFloat(latitude) : null,
              longitude: longitude !== undefined ? parseFloat(longitude) : null,
            },
            update: {
              name, phone, image, address, addressNotes, provinceId, cityId,
              ...(latitude !== undefined ? { latitude: parseFloat(latitude) } : {}),
              ...(longitude !== undefined ? { longitude: parseFloat(longitude) } : {}),
            }
          }
        }
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        biodata: true
      },
    });

    const flatUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      name: user.biodata?.name,
      phone: user.biodata?.phone,
      image: user.biodata?.image,
      address: user.biodata?.address,
      addressNotes: user.biodata?.addressNotes,
      provinceId: user.biodata?.provinceId,
      cityId: user.biodata?.cityId,
      latitude: user.biodata?.latitude,
      longitude: user.biodata?.longitude,
    };

    return sendResponse(res, 200, "profile updated", flatUser);
  } catch (err: any) {
    return sendResponse(res, 400, err.message);
  }
};

export const getAdminContact = async (_req: Request, res: Response) => {
  const admin = await prisma.user.findFirst({
    where: { 
      role: "ADMIN",
      biodata: { phone: { not: "" } }
    },
    select: { biodata: { select: { phone: true } } }
  });

  if (!admin || !admin.biodata) return sendResponse(res, 404, "Admin contact not found");

  return sendResponse(res, 200, "fetch admin contact success", { phone: admin.biodata.phone });
};
