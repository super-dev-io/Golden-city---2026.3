import * as authService from '../services/authService.js';
import prisma from '../config/prisma.js';
import { signToken, verifyToken } from '../utils/jwt.js';
import bcrypt from 'bcrypt';

function sendEmailMock({ to, subject, text }) {
  // lightweight mock for development: log to console
  // eslint-disable-next-line no-console
  console.log('[email mock] to=', to, 'subject=', subject, 'text=', text);
  return Promise.resolve({ ok: true });
}

function validateRegister(body) {
  const errors = [];
  if (!body.email || !body.password) errors.push('email and password required');
  if (body.password && body.password.length < 6) errors.push('password min length 6');
  return errors;
}

export async function register(req, res, next) {
  try {
    const errors = validateRegister(req.body);
    if (errors.length) return res.status(400).json({ errors });
    const user = await authService.registerUser(req.body);
    await sendEmailMock({ to: user.email, subject: 'Welcome to Kicksy', text: 'Thanks for joining Kicksy' });
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { token, user } = await authService.loginUser(req.body);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    // token-based auth handled by middleware when used; this endpoint can also accept Authorization header
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
    const token = auth.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, email: true, name: true, role: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !oldPassword || !newPassword) return res.status(400).json({ error: 'email, oldPassword and newPassword required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ changed: true });
  } catch (err) {
    next(err);
  }
}

export async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(200).json({ ok: true }); // don't reveal existence
    const token = signToken({ id: user.id, purpose: 'reset' });
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await sendEmailMock({ to: email, subject: 'Reset your password', text: `Reset link: ${url}` });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword required' });
    const decoded = verifyToken(token);
    if (!decoded || decoded.purpose !== 'reset') return res.status(400).json({ error: 'Invalid token' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: decoded.id }, data: { password: hashed } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function adminListSessions(req, res, next) {
  try {
    // mock sessions listing; in real app sessions store needed
    if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ error: 'ADMIN required' });
    // return lightweight pseudo-sessions
    const sessions = [
      { userId: 'user_1', lastActive: new Date(), agent: 'web' },
      { userId: 'user_2', lastActive: new Date(Date.now() - 1000 * 60 * 60), agent: 'mobile' }
    ];
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  // stateless JWT logout is a client-side operation; suggest token removal
  res.json({ ok: true, message: 'Remove token on client to logout' });
}

