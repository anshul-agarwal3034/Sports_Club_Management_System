export interface ActiveMembership {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  tier: 'GOLD' | 'SILVER' | 'JUNIOR';
  tierName: string;
  memberId: string;
  validFrom: string;
  validUntil: string;
  status: 'ACTIVE' | 'EXPIRED' | 'GRACE_PERIOD';
  payLaterCreditLimit: number;
  currentBalance: number;
  coachingSessionsRemaining: number;
  courtDiscountPct: number;
  rentalDiscountPct: number;
  shopDiscountPct: number;
  createdAt: string;
}

const STORAGE_KEY = 'sportshub_active_membership';

export function getActiveMembership(): ActiveMembership | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveMembership(membership: ActiveMembership | null): void {
  try {
    if (membership) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(membership));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new Event('sportshub_membership_updated'));
  } catch {
    // Ignore storage issues
  }
}

export function purchaseMembership(params: {
  userName: string;
  userEmail: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  tier: 'GOLD' | 'SILVER' | 'JUNIOR';
  tierName: string;
  courtDiscountPct: number;
  rentalDiscountPct: number;
  shopDiscountPct: number;
  freeCoachingSessions: number;
  payLaterEnabled: boolean;
}): ActiveMembership {
  const now = new Date();
  const nextYear = new Date();
  nextYear.setFullYear(now.getFullYear() + 1);

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const newMembership: ActiveMembership = {
    id: `mem-${Date.now()}`,
    userId: `usr-${Date.now()}`,
    userName: params.userName,
    userEmail: params.userEmail,
    clubId: params.clubId,
    clubSlug: params.clubSlug,
    clubName: params.clubName,
    tier: params.tier,
    tierName: params.tierName,
    memberId: `SH-${params.clubSlug.slice(0, 3).toUpperCase()}-M${randomDigits}`,
    validFrom: now.toISOString().split('T')[0],
    validUntil: nextYear.toISOString().split('T')[0],
    status: 'ACTIVE',
    payLaterCreditLimit: params.payLaterEnabled ? 2000 : 0,
    currentBalance: 0,
    coachingSessionsRemaining: params.freeCoachingSessions,
    courtDiscountPct: params.courtDiscountPct,
    rentalDiscountPct: params.rentalDiscountPct,
    shopDiscountPct: params.shopDiscountPct,
    createdAt: now.toISOString(),
  };

  saveActiveMembership(newMembership);
  return newMembership;
}
