import { Request, Response } from "express";
import prisma from "../../prisma";
import { sendResponse } from "../../utils/response";

/**
 * Ratakan field profile ke level user — bentuk yang diharapkan UI.
 * `register` ikut diringkas jadi isEmailVerified kalau memang di-select.
 */
const flattenProfile = (user: any) => {
  const { profile, register, ...rest } = user;
  return {
    ...rest,
    ...(register !== undefined && {
      isEmailVerified: register?.isEmailVerified || false,
    }),
    name: profile?.name,
    phone: profile?.phone,
    image: profile?.image,
    address: profile?.address,
    addressNotes: profile?.addressNotes,
    provinceId: profile?.provinceId,
    cityId: profile?.cityId,
    latitude: profile?.latitude,
    longitude: profile?.longitude,
  };
};

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

  return sendResponse(res, 200, "fetch profile success", flattenProfile(user));
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

    return sendResponse(res, 200, "profile updated", flattenProfile(user));
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
