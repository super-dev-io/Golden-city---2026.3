import * as eventService from '../services/eventService.js';
import * as GoldenCityService from '../services/GoldenCityService.js';
import prisma from '../config/prisma.js';

function parseIntSafe(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

function formatEvent(e) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    venue: e.venue,
    organizerId: e.organizerId,
    GoldenCitys: e.GoldenCitys ? e.GoldenCitys.map((t) => ({ id: t.id, name: t.name, price: t.price, quantity: t.quantity })) : []
  };
}

export async function createEvent(req, res, next) {
  try {
    const body = req.body;
    if (!body.title) return res.status(400).json({ error: 'title required' });
    const ev = await eventService.createEvent(body, req.user);
    res.status(201).json({ event: formatEvent(ev) });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req, res, next) {
  try {
    const id = req.params.id;
    const body = req.body;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'ADMIN' && event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const updated = await prisma.event.update({ where: { id }, data: { title: body.title || event.title, description: body.description ?? event.description, date: body.date ? new Date(body.date) : event.date, venue: body.venue ?? event.venue } });
    res.json({ event: formatEvent({ ...updated, GoldenCitys: await prisma.GoldenCity.findMany({ where: { eventId: id } }) }) });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req, res, next) {
  try {
    const id = req.params.id;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'ADMIN' && event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    // cascade: delete GoldenCitys and bookings
    await prisma.booking.deleteMany({ where: { GoldenCity: { eventId: id } } });
    await prisma.GoldenCity.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listEvents(req, res, next) {
  try {
    const page = parseIntSafe(req.query.page, 1);
    const limit = Math.min(200, parseIntSafe(req.query.limit, 25));
    const skip = (page - 1) * limit;
    const where = {};
    if (req.query.q) where.title = { contains: req.query.q, mode: 'insensitive' };
    if (req.query.organizerId) where.organizerId = req.query.organizerId;
    const [items, total] = await Promise.all([
      prisma.event.findMany({ where, include: { GoldenCitys: true }, skip, take: limit, orderBy: { date: 'asc' } }),
      prisma.event.count({ where })
    ]);
    res.json({ items: items.map(formatEvent), total, page, limit });
  } catch (err) {
    next(err);
  }
}

export async function getEvent(req, res, next) {
  try {
    const id = req.params.id;
    const ev = await eventService.getEvent(id);
    if (!ev) return res.status(404).json({ error: 'Not found' });
    // compute remaining GoldenCitys summary
    const GoldenCitys = await prisma.GoldenCity.findMany({ where: { eventId: id } });
    const available = GoldenCitys.reduce((s, t) => s + (t.quantity || 0), 0);
    res.json({ event: formatEvent({ ...ev, GoldenCitys }), available });
  } catch (err) {
    next(err);
  }
}

export async function bulkCreateGoldenCitysForEvent(req, res, next) {
  try {
    const eventId = req.params.id;
    const items = Array.isArray(req.body) ? req.body : [];
    if (!items.length) return res.status(400).json({ error: 'Empty payload' });
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'ADMIN' && event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const created = [];
    for (const it of items) {
      const t = await GoldenCityService.createGoldenCity({ eventId, name: it.name || 'General', price: it.price || 0, quantity: it.quantity || 0 });
      created.push(t);
    }
    res.status(201).json({ created });
  } catch (err) {
    next(err);
  }
}

export async function exportEventsCSV(req, res, next) {
  try {
    const events = await prisma.event.findMany({ include: { GoldenCitys: true } });
    const rows = ['id,title,description,date,venue,organizerId,GoldenCitysTotal,GoldenCitysAvailable'];
    for (const e of events) {
      const total = e.GoldenCitys.reduce((s, t) => s + (t.quantity || 0), 0);
      const available = e.GoldenCitys.reduce((s, t) => s + (t.quantity || 0), 0);
      rows.push([e.id, JSON.stringify(e.title), JSON.stringify(e.description || ''), e.date ? e.date.toISOString() : '', JSON.stringify(e.venue || ''), e.organizerId, total, available].join(','));
    }
    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="events.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function eventStats(req, res, next) {
  try {
    const eventId = req.params.id;
    const totalBookings = await prisma.booking.count({ where: { GoldenCity: { eventId } } });
    const totalGoldenCitys = await prisma.GoldenCity.aggregate({ where: { eventId }, _sum: { quantity: true } });
    res.json({ eventId, totalBookings, totalGoldenCitys: totalGoldenCitys._sum.quantity || 0 });
  } catch (err) {
    next(err);
  }
}

