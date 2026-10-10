import { randomUUID } from 'node:crypto';
import type { AffiliateLink, Conversion, User, WalletEntry } from '@viraliza/core';
import type {
  ClickEvent,
  CreateConversionInput,
  CreateLinkInput,
  CreateUserInput,
  DataStore,
  Lead,
  Subscription,
} from './store';

const now = () => new Date().toISOString();

/**
 * In-memory DataStore. Zero setup, resets on restart — perfect for dev, demos
 * and CI. Production uses PrismaStore against Postgres.
 */
export class MemoryStore implements DataStore {
  private users = new Map<string, User>();
  private usersByEmail = new Map<string, string>();
  private usersByPhone = new Map<string, string>();
  private usersByReferral = new Map<string, string>();
  private links = new Map<string, AffiliateLink>();
  private linksByCode = new Map<string, string>();
  private conversions = new Map<string, Conversion>();
  private wallet = new Map<string, WalletEntry>();
  private leads = new Map<string, Lead>();
  private clicks: ClickEvent[] = [];
  private subscriptions = new Map<string, Subscription>();

  // ── Users ────────────────────────────────────────────────────────────────
  async createUser(input: CreateUserInput & { referralCode: string; id?: string }): Promise<User> {
    const user: User = {
      id: input.id ?? randomUUID(),
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      referralCode: input.referralCode,
      referredBy: input.referredBy,
      plan: input.plan ?? 'free',
      balanceCents: 0,
      lifetimeEarningsCents: 0,
      createdAt: now(),
    };
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
    if (user.phone) this.usersByPhone.set(user.phone, user.id);
    this.usersByReferral.set(user.referralCode, user.id);
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
  async getUserByEmail(email: string): Promise<User | null> {
    const id = this.usersByEmail.get(email.toLowerCase());
    return id ? this.users.get(id) ?? null : null;
  }
  async getUserByPhone(phone: string): Promise<User | null> {
    const id = this.usersByPhone.get(phone);
    return id ? this.users.get(id) ?? null : null;
  }
  async getUserByReferralCode(code: string): Promise<User | null> {
    const id = this.usersByReferral.get(code);
    return id ? this.users.get(id) ?? null : null;
  }
  async updateUser(id: string, patch: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...patch, id: user.id };
    this.users.set(id, updated);
    return updated;
  }
  async listUsers(): Promise<User[]> {
    return [...this.users.values()];
  }

  // ── Links ────────────────────────────────────────────────────────────────
  async createLink(input: CreateLinkInput & { id?: string }): Promise<AffiliateLink> {
    const link: AffiliateLink = {
      id: input.id ?? randomUUID(),
      code: input.code,
      userId: input.userId,
      productId: input.productId,
      marketplace: input.marketplace,
      title: input.title,
      imageUrl: input.imageUrl,
      destinationUrl: input.destinationUrl,
      whatsappShareUrl: input.whatsappShareUrl,
      providerShortUrl: input.providerShortUrl,
      clicks: 0,
      conversions: 0,
      earningsCents: 0,
      createdAt: now(),
    };
    this.links.set(link.id, link);
    this.linksByCode.set(link.code, link.id);
    return link;
  }
  async getLinkByCode(code: string): Promise<AffiliateLink | null> {
    const id = this.linksByCode.get(code);
    return id ? this.links.get(id) ?? null : null;
  }
  async listLinksByUser(userId: string): Promise<AffiliateLink[]> {
    return [...this.links.values()].filter((l) => l.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async countActiveLinks(userId: string): Promise<number> {
    return [...this.links.values()].filter((l) => l.userId === userId).length;
  }
  async incrementLinkClicks(code: string): Promise<void> {
    const link = await this.getLinkByCode(code);
    if (link) link.clicks += 1;
  }
  async applyConversionToLink(linkId: string, netCommissionCents: number): Promise<void> {
    const link = this.links.get(linkId);
    if (!link) return;
    link.conversions += 1;
    link.earningsCents += netCommissionCents;
  }

  // ── Conversions ──────────────────────────────────────────────────────────
  async createConversion(input: CreateConversionInput & { id?: string }): Promise<Conversion> {
    const conversion: Conversion = {
      id: input.id ?? randomUUID(),
      linkId: input.linkId,
      userId: input.userId,
      marketplace: input.marketplace,
      orderValueCents: input.orderValueCents,
      grossCommissionCents: input.grossCommissionCents,
      platformFeeCents: input.platformFeeCents,
      netCommissionCents: input.netCommissionCents,
      referralBonusCents: input.referralBonusCents,
      status: input.status ?? 'pending',
      createdAt: now(),
    };
    this.conversions.set(conversion.id, conversion);
    return conversion;
  }
  async listConversionsByUser(userId: string): Promise<Conversion[]> {
    return [...this.conversions.values()].filter((c) => c.userId === userId);
  }
  async listConversions(): Promise<Conversion[]> {
    return [...this.conversions.values()];
  }

  // ── Wallet ───────────────────────────────────────────────────────────────
  async addWalletEntry(entry: {
    id?: string;
    userId: string;
    type: WalletEntry['type'];
    amountCents: number;
    description: string;
    refId?: string;
  }): Promise<WalletEntry> {
    const row: WalletEntry = {
      id: entry.id ?? randomUUID(),
      userId: entry.userId,
      type: entry.type,
      amountCents: entry.amountCents,
      description: entry.description,
      refId: entry.refId,
      createdAt: now(),
    };
    this.wallet.set(row.id, row);
    const user = this.users.get(entry.userId);
    if (user && entry.amountCents > 0) {
      user.balanceCents += entry.amountCents;
      if (entry.type === 'commission' || entry.type === 'referral_bonus') {
        user.lifetimeEarningsCents += entry.amountCents;
      }
    }
    return row;
  }
  async listWalletByUser(userId: string): Promise<WalletEntry[]> {
    return [...this.wallet.values()]
      .filter((w) => w.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // ── Leads & clicks ───────────────────────────────────────────────────────
  async upsertLead(input: {
    phone: string;
    name?: string;
    userId?: string;
    optedIn?: boolean;
    source?: string;
  }): Promise<Lead> {
    const existing = this.leads.get(input.phone);
    const lead: Lead = existing
      ? { ...existing, name: input.name ?? existing.name, userId: input.userId ?? existing.userId, optedIn: input.optedIn ?? existing.optedIn, lastSeen: now() }
      : {
          id: randomUUID(),
          phone: input.phone,
          name: input.name,
          userId: input.userId,
          optedIn: input.optedIn ?? false,
          source: input.source,
          lastSeen: now(),
        };
    this.leads.set(input.phone, lead);
    return lead;
  }
  async getLeadByPhone(phone: string): Promise<Lead | null> {
    return this.leads.get(phone) ?? null;
  }
  async listLeads(): Promise<Lead[]> {
    return [...this.leads.values()];
  }
  async recordClick(input: Omit<ClickEvent, 'id' | 'createdAt'>): Promise<ClickEvent> {
    const event: ClickEvent = { ...input, id: randomUUID(), createdAt: now() };
    this.clicks.push(event);
    await this.incrementLinkClicks(input.linkCode);
    return event;
  }

  // ── Subscriptions ────────────────────────────────────────────────────────
  async upsertSubscription(
    input: Omit<Subscription, 'id' | 'createdAt'> & { id?: string },
  ): Promise<Subscription> {
    const existing = this.subscriptions.get(input.userId);
    const sub: Subscription = {
      id: input.id ?? existing?.id ?? randomUUID(),
      userId: input.userId,
      plan: input.plan,
      billing: input.billing,
      status: input.status,
      provider: input.provider,
      providerRef: input.providerRef,
      currentPeriodEnd: input.currentPeriodEnd,
      createdAt: existing?.createdAt ?? now(),
    };
    this.subscriptions.set(input.userId, sub);
    return sub;
  }
  async getSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptions.get(userId) ?? null;
  }
}

/** Process-wide singleton so every request shares the same store in dev. */
export const store: DataStore = new MemoryStore();
