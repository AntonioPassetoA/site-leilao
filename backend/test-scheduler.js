const { cleanExpiredProperties, scheduler } = require('./src/services/scheduler');

async function test() {
  console.log('Testing scheduler functions...\n');

  // Test cleanup
  console.log('1. Testing cleanExpiredProperties:');
  const cleanResult = await cleanExpiredProperties();
  console.log('   Result:', cleanResult);

  // Test stats
  console.log('\n2. Testing logStats:');
  await scheduler.logStats();

  console.log('\n3. Scheduler jobs configured:');
  const status = scheduler.getStatus();
  status.jobs.forEach(job => {
    console.log(`   - ${job.name}: ${job.description} (${job.schedule})`);
  });

  console.log('\nDone!');
  process.exit(0);
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
