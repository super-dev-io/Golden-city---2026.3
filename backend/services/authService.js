import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';
import { signToken } from '../utils/jwt.js';

export async function registerUser({ email, password, name }) {
  if (!email || !password) throw new Error('Email and password required');
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, password: hashed, name, role: 'USER' } });
  return user;
}

export async function loginUser({ email, password }) {
  if (!email || !password) throw new Error('Email and password required');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error('Invalid credentials');
  const token = signToken({ id: user.id, email: user.email });
  return { token, user };
}
