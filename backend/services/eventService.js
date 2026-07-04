import prisma from '../config/prisma.js';

export async function createEvent(data, user) {
  // only basic permission: authenticated users can create events
  return prisma.event.create({ data: { title: data.title, description: data.description || '', organizerId: user.id, date: data.date ? new Date(data.date) : null, venue: data.venue || '' } });
}

export async function listEvents() {
  return prisma.event.findMany({ include: { GoldenCitys: true } });
}

export async function getEvent(id) {
  return prisma.event.findUnique({ where: { id }, include: { GoldenCitys: true } });
}
