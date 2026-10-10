/**
 * PrismaStore — production DataStore backed by Postgres via Prisma Client.
 *
 * Excluded from the default typecheck (see tsconfig `exclude`) because
 * `@prisma/client` is generated per-project. Enable it in apps/web by:
 *   DATABASE_URL=...  &&  npx prisma generate
 * then swapping `store` for `new PrismaStore(prisma)` in apps/web/src/lib/store.ts.
 *
 * The mapping below is intentionally explicit: it documents how the in-memory
 * shape maps onto the relational schema.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientLike = any;

import type { AffiliateLink, Conversion, User, WalletEntry } from '@viraliza/core';
import type { DataStore } from './store';

export class PrismaStore implements DataStore {
  constructor(private readonly prisma: PrismaClientLike) {}

  async createUser(input: Parameters<DataStore['createUser']>[0]): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        id: input.id,
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        referralCode: input.referralCode,
        referredById: input.referredBy,
        plan: input.plan ?? 'free',
        affiliateTags: input.affiliateTags ?? {},
      },
    });
    return mapUser(row);
  }

  async getUser(id: string): Promise<User | null> {
    return mapUserOrNull(await this.prisma.user.findUnique({ where: { id } }));
  }
  async getUserByEmail(email: string): Promise<User | null> {
    return mapUserOrNull(await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } }));
  }
  async getUserByPhone(phone: string): Promise<User | null> {
    return mapUserOrNull(await this.prisma.user.findFirst({ where: { phone } }));
  }
  async getUserByReferralCode(code: string): Promise<User | null> {
    return mapUserOrNull(await this.prisma.user.findUnique({ where: { referralCode: code } }));
  }
  async updateUser(id: string, patch: Partial<User>): Promise<User | null> {
    const row = await this.prisma.user.update({ where: { id }, data: patch as never });
    return mapUser(row);
  }
  async listUsers(): Promise<User[]> {
    return (await this.prisma.user.findMany()).map(mapUser);
  }

  async createLink(input: Parameters<DataStore['createLink']>[0]): Promise<AffiliateLink> {
    const row = await this.prisma.affiliateLink.create({ data: { ...input } });
    return { ...row } as AffiliateLink;
  }
  async getLinkByCode(code: string): Promise<AffiliateLink | null> {
    return (await this.prisma.affiliateLink.findUnique({ where: { code } })) as AffiliateLink | null;
  }
  async listLinksByUser(userId: string): Promise<AffiliateLink[]> {
    return (await this.prisma.affiliateLink.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })) as AffiliateLink[];
  }
  async countActiveLinks(userId: string): Promise<number> {
    return this.prisma.affiliateLink.count({ where: { userId } });
  }
  async incrementLinkClicks(code: string): Promise<void> {
    await this.prisma.affiliateLink.update({ where: { code }, data: { clicks: { increment: 1 } } });
  }
  async applyConversionToLink(linkId: string, netCommissionCents: number): Promise<void> {
    await this.prisma.affiliateLink.update({
      where: { id: linkId },
      data: { conversions: { increment: 1 }, earningsCents: { increment: netCommissionCents } },
    });
  }

  async createConversion(input: Parameters<DataStore['createConversion']>[0]): Promise<Conversion> {
    const row = await this.prisma.conversion.create({ data: { ...input } });
    return { ...row } as Conversion;
  }
  async listConversionsByUser(userId: string): Promise<Conversion[]> {
    return (await this.prisma.conversion.findMany({ where: { userId } })) as Conversion[];
  }
  async listConversions(): Promise<Conversion[]> {
    return (await this.prisma.conversion.findMany()) as Conversion[];
  }

  async addWalletEntry(entry: Parameters<DataStore['addWalletEntry']>[0]): Promise<WalletEntry> {
    const row = await this.prisma.walletEntry.create({ data: { ...entry } });
    if (entry.amountCents > 0) {
      await this.prisma.user.update({
        where: { id: entry.userId },
        data: {
          balanceCents: { increment: entry.amountCents },
          ...(entry.type === 'commission' || entry.type === 'referral_bonus'
            ? { lifetimeEarningsCents: { increment: entry.amountCents } }
            : {}),
        },
      });
    }
    return { ...row } as WalletEntry;
  }
  async listWalletByUser(userId: string): Promise<WalletEntry[]> {
    return (await this.prisma.walletEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })) as WalletEntry[];
  }

  async upsertLead(input: Parameters<DataStore['upsertLead']>[0]) {
    return this.prisma.lead.upsert({
      where: { phone: input.phone },
      create: { ...input },
      update: { name: input.name, userId: input.userId, optedIn: input.optedIn, lastSeen: new Date() },
    });
  }
  async getLeadByPhone(phone: string) {
    return this.prisma.lead.findUnique({ where: { phone } });
  }
  async listLeads() {
    return this.prisma.lead.findMany();
  }
  async recordClick(input: Parameters<DataStore['recordClick']>[0]) {
    const event = await this.prisma.clickEvent.create({ data: { ...input } });
    await this.incrementLinkClicks(input.linkCode);
    return event;
  }

  async upsertSubscription(input: Parameters<DataStore['upsertSubscription']>[0]) {
    return this.prisma.subscription.upsert({
      where: { userId: input.userId },
      create: { ...input },
      update: { plan: input.plan, status: input.status, currentPeriodEnd: input.currentPeriodEnd },
    });
  }
  async getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({ where: { userId } });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    referralCode: row.referralCode,
    referredBy: row.referredById ?? undefined,
    plan: row.plan,
    balanceCents: row.balanceCents,
    lifetimeEarningsCents: row.lifetimeEarningsCents,
    createdAt: row.createdAt?.toISOString?.() ?? row.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUserOrNull(row: any): User | null {
  return row ? mapUser(row) : null;
}
