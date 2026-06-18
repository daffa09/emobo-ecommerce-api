import prisma from "../../prisma";

export const getAllConditions = async () => {
  return await prisma.condition.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const getConditionById = async (id: string) => {
  const condition = await prisma.condition.findUnique({ where: { id } });
  if (!condition) throw new Error("Condition not found");
  return condition;
};

export const createCondition = async (data: { name: string }) => {
  if (!data.name) throw new Error("Condition name is required");
  const existing = await prisma.condition.findUnique({ where: { name: data.name } });
  if (existing) throw new Error("Condition already exists");
  return await prisma.condition.create({ data });
};

export const updateCondition = async (id: string, data: { name?: string }) => {
  const condition = await prisma.condition.findUnique({ where: { id } });
  if (!condition) throw new Error("Condition not found");
  
  if (data.name && data.name !== condition.name) {
    const existing = await prisma.condition.findUnique({ where: { name: data.name } });
    if (existing) throw new Error("Condition already exists");
  }

  return await prisma.condition.update({
    where: { id },
    data,
  });
};

export const deleteCondition = async (id: string) => {
  const condition = await prisma.condition.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!condition) throw new Error("Condition not found");
  if (condition._count.products > 0) {
    throw new Error("Cannot delete condition. It has associated products.");
  }
  return await prisma.condition.delete({ where: { id } });
};
