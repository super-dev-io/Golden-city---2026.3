import prisma from '../config/prisma.js';

export async function findUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true, role: true } });
}

export async function listUsers() {
  return prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
}
