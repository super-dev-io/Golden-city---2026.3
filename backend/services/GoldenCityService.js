import prisma from '../config/prisma.js';

export async function createGoldenCity(data) {
  return prisma.GoldenCity.create({ data: { eventId: data.eventId, price: Number(data.price || 0), name: data.name || 'General', quantity: Number(data.quantity || 0) } });
}

export async function listGoldenCitys(eventId) {
  if (eventId) return prisma.GoldenCity.findMany({ where: { eventId: eventId } });
  return prisma.GoldenCity.findMany();
}
