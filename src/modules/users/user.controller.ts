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
      register: {
        select: { isEmailVerified: true }
      },
      createdAt: true,
      profile: {
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
    isEmailVerified: user.register?.isEmailVerified || false,
    createdAt: user.createdAt,
    name: user.profile?.name,
    phone: user.profile?.phone,
    image: user.profile?.image,
    address: user.profile?.address,
    addressNotes: user.profile?.addressNotes,
    provinceId: user.profile?.provinceId,
    cityId: user.profile?.cityId,
    latitude: user.profile?.latitude,
    longitude: user.profile?.longitude,
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
        profile: {
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
        profile: true
      },
    });

    const flatUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      name: user.profile?.name,
      phone: user.profile?.phone,
      image: user.profile?.image,
      address: user.profile?.address,
      addressNotes: user.profile?.addressNotes,
      provinceId: user.profile?.provinceId,
      cityId: user.profile?.cityId,
      latitude: user.profile?.latitude,
      longitude: user.profile?.longitude,
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
      profile: { phone: { not: "" } }
    },
    select: { profile: { select: { phone: true } } }
  });

  if (!admin || !admin.profile) return sendResponse(res, 404, "Admin contact not found");

  return sendResponse(res, 200, "fetch admin contact success", { phone: admin.profile.phone });
};
