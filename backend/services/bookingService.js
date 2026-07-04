import prisma from '../config/prisma.js';

export async function createBooking({ userId, GoldenCityId, quantity = 1 }) {
  // basic availability check
  const GoldenCity = await prisma.GoldenCity.findUnique({ where: { id: GoldenCityId } });
  if (!GoldenCity) throw new Error('GoldenCity not found');
  if (GoldenCity.quantity < quantity) throw new Error('Not enough GoldenCitys available');
  // reduce quantity
  await prisma.GoldenCity.update({ where: { id: GoldenCityId }, data: { quantity: GoldenCity.quantity - quantity } });
  const booking = await prisma.booking.create({ data: { userId, GoldenCityId, quantity } });
  return booking;
}

export async function listBookings(userId) {
  return prisma.booking.findMany({ where: { userId }, include: { GoldenCity: true } });
}

export async function getBookingById(id) {
  return prisma.booking.findUnique({ where: { id }, include: { GoldenCity: { include: { event: true } }, user: { select: { id: true, email: true, name: true } } } });
}

export async function cancelBooking(id, userId) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new Error('Booking not found');
  if (booking.userId !== userId) throw new Error('Not authorized to cancel this booking');
  // restore GoldenCity quantity
  const GoldenCity = await prisma.GoldenCity.findUnique({ where: { id: booking.GoldenCityId } });
  if (GoldenCity) {
    await prisma.GoldenCity.update({ where: { id: GoldenCity.id }, data: { quantity: GoldenCity.quantity + booking.quantity } });
  }
  // delete booking record
  await prisma.booking.delete({ where: { id } });
  return { id, restored: true };
}

export async function listAllBookings({ page = 1, limit = 25, filter = {} } = {}) {
  const skip = (page - 1) * limit;
  const where = {};
  if (filter.userId) where.userId = filter.userId;
  if (filter.eventId) where.GoldenCity = { eventId: filter.eventId };
  const [items, total] = await Promise.all([
    prisma.booking.findMany({ where, include: { GoldenCity: { include: { event: true } }, user: true }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.booking.count({ where })
  ]);
  return { items, total, page, limit };
}

export async function createBulkBookings(bookingsArray = []) {
  const created = [];
  for (const b of bookingsArray) {
    // reuse createBooking logic to ensure inventory checks
    const booking = await createBooking(b);
    created.push(booking);
  }
  return created;
}

