/**
 * CLI seed runner: `npm run db:seed`.
 * Currently seeds the in-memory store (prints a summary). When DATABASE_URL is
 * set and PrismaStore is wired, this is where you'd persist the demo data.
 */
import { createSeededStore } from './seed';

async function main() {
  const store = await createSeededStore();
  const users = await store.listUsers();
  const leads = await store.listLeads();
  const demo = await store.getUser('demo-user');
  console.log('✔ Viraliza seed complete');
  console.log(`  users: ${users.length}`);
  console.log(`  links: ${(await store.listLinksByUser('demo-user')).length}`);
  console.log(`  conversions: ${(await store.listConversionsByUser('demo-user')).length}`);
  console.log(`  leads: ${leads.length}`);
  if (demo) console.log(`  demo login: ${demo.email} (referral ${demo.referralCode})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
