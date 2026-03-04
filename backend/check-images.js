const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const imageCount = await prisma.image.count();
  const propertyWithImages = await prisma.property.count({
    where: { images: { some: {} } }
  });
  const totalProperties = await prisma.property.count();

  console.log('Total images:', imageCount);
  console.log('Properties with images:', propertyWithImages);
  console.log('Total properties:', totalProperties);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
