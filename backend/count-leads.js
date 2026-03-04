const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.lead.count();
  const leads = await prisma.lead.findMany({
    include: {
      property: { select: { title: true, bank: true } }
    }
  });

  console.log('Total leads:', count);
  console.log('\nLeads:');
  leads.forEach(lead => {
    console.log(`- ${lead.name} (${lead.email}) - ${lead.property?.bank}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
