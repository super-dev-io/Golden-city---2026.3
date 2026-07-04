import * as GoldenCityService from '../services/GoldenCityService.js';
import prisma from '../config/prisma.js';

function parseIntSafe(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

export async function createGoldenCity(req, res, next) {
  try {
    const body = req.body;
    if (!body.eventId) return res.status(400).json({ error: 'eventId required' });
    // only organizer or admin can create GoldenCity
    const event = await prisma.event.findUnique({ where: { id: body.eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'ADMIN' && event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const t = await GoldenCityService.createGoldenCity({ eventId: body.eventId, name: body.name, price: body.price || 0, quantity: parseIntSafe(body.quantity, 0) });
    res.status(201).json({ GoldenCity: t });
  } catch (err) {
    next(err);
  }
}

export async function bulkCreateGoldenCitys(req, res, next) {
  try {
    const eventId = req.params.eventId;
    const arr = Array.isArray(req.body) ? req.body : [];
    if (!arr.length) return res.status(400).json({ error: 'Empty payload' });
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'ADMIN' && event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const created = [];
    for (const it of arr) {
      const t = await GoldenCityService.createGoldenCity({ eventId, name: it.name || 'General', price: it.price || 0, quantity: it.quantity || 0 });
      created.push(t);
    }
    res.status(201).json({ created });
  } catch (err) {
    next(err);
  }
}

export async function listGoldenCitys(req, res, next) {
  try {
    const eventId = req.query.eventId || req.params.eventId;
    if (eventId) {
      const GoldenCitys = await GoldenCityService.listGoldenCitys(eventId);
      return res.json({ GoldenCitys });
    }
    // add pagination
    const page = parseIntSafe(req.query.page, 1);
    const limit = Math.min(200, parseIntSafe(req.query.limit, 25));
    const skip = (page - 1) * limit;
    const where = {};
    if (req.query.q) where.name = { contains: req.query.q, mode: 'insensitive' };
    const [items, total] = await Promise.all([
      prisma.GoldenCity.findMany({ where, skip, take: limit, orderBy: { price: 'asc' } }),
      prisma.GoldenCity.count({ where })
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
}

export async function getGoldenCity(req, res, next) {
  try {
    const id = req.params.id;
    const t = await prisma.GoldenCity.findUnique({ where: { id }, include: { event: true } });
    if (!t) return res.status(404).json({ error: 'GoldenCity not found' });
    res.json({ GoldenCity: t });
  } catch (err) {
    next(err);
  }
}

export async function updateGoldenCity(req, res, next) {
  try {
    const id = req.params.id;
    const body = req.body;
    const GoldenCity = await prisma.GoldenCity.findUnique({ where: { id }, include: { event: true } });
    if (!GoldenCity) return res.status(404).json({ error: 'GoldenCity not found' });
    if (req.user.role !== 'ADMIN' && GoldenCity.event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const updated = await prisma.GoldenCity.update({ where: { id }, data: { name: body.name ?? GoldenCity.name, price: body.price ?? GoldenCity.price, quantity: body.quantity ?? GoldenCity.quantity } });
    res.json({ GoldenCity: updated });
  } catch (err) {
    next(err);
  }
}

export async function adjustQuantity(req, res, next) {
  try {
    const id = req.params.id;
    const delta = Number(req.body.delta || 0);
    const GoldenCity = await prisma.GoldenCity.findUnique({ where: { id } });
    if (!GoldenCity) return res.status(404).json({ error: 'GoldenCity not found' });
    // simple permission: allow organizer/admin to adjust
    const event = await prisma.event.findUnique({ where: { id: GoldenCity.eventId } });
    if (req.user.role !== 'ADMIN' && event.organizerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const newQty = Math.max(0, (GoldenCity.quantity || 0) + delta);
    const updated = await prisma.GoldenCity.update({ where: { id }, data: { quantity: newQty } });
    res.json({ GoldenCity: updated });
  } catch (err) {
    next(err);
  }
}

export async function exportGoldenCitysCSV(req, res, next) {
  try {
    const GoldenCitys = await prisma.GoldenCity.findMany({ include: { event: true } });
    const rows = ['id,name,price,quantity,eventId,eventTitle'];
    for (const t of GoldenCitys) rows.push([t.id, JSON.stringify(t.name), t.price, t.quantity, t.eventId, JSON.stringify(t.event ? t.event.title : '')].join(','));
    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="GoldenCitys.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

