const prisma = new Proxy({}, {
  get() {
    return () => {
      throw new Error('Prisma client removed. Migrate this code to another DB client (e.g., mongoose) and replace Prisma usages.');
    };
  }
});

export default prisma;
export { prisma };
