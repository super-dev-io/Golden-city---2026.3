import * as userService from '../services/userService.js';
import prisma from '../config/prisma.js';

function parseIntSafe(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

export async function me(req, res, next) {
  try {
    const user = await userService.findUserById(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const body = req.body;
    const updated = await prisma.user.update({ where: { id: req.user.id }, data: { name: body.name ?? undefined } });
    res.json({ user: { id: updated.id, email: updated.email, name: updated.name } });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'ADMIN required' });
    const page = parseIntSafe(req.query.page, 1);
    const limit = Math.min(200, parseIntSafe(req.query.limit, 50));
    const skip = (page - 1) * limit;
    const where = {};
    if (req.query.q) where.OR = [{ email: { contains: req.query.q, mode: 'insensitive' } }, { name: { contains: req.query.q, mode: 'insensitive' } }];
    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, select: { id: true, email: true, name: true, role: true }, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where })
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req, res, next) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true, role: true, createdAt: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function promoteUser(req, res, next) {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'ADMIN required' });
    const id = req.params.id;
    await prisma.user.update({ where: { id }, data: { role: 'ADMIN' } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function demoteUser(req, res, next) {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'ADMIN required' });
    const id = req.params.id;
    await prisma.user.update({ where: { id }, data: { role: 'USER' } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const id = req.params.id;
    if (req.user.role !== 'ADMIN' && id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await prisma.booking.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function exportUsersCSV(req, res, next) {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'ADMIN required' });
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } });
    const rows = ['id,email,name,role,createdAt'];
    for (const u of users) rows.push([u.id, u.email, JSON.stringify(u.name || ''), u.role, u.createdAt.toISOString()].join(','));
    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function inviteUser(req, res, next) {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'ADMIN required' });
    const email = req.body.email;
    if (!email) return res.status(400).json({ error: 'email required' });
    const token = signToken({ email, purpose: 'invite' });
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?invite=${token}`;
    // lightweight mock
    // eslint-disable-next-line no-console
    console.log('[invite] ', email, url);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

