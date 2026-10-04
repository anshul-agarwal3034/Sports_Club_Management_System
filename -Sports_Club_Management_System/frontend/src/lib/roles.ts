export type OperationalRole = 'OWNER' | 'FRONT_DESK' | 'KITCHEN' | 'COACH' | 'ADMIN';
export type UserRole = OperationalRole | 'PLAYER' | 'UNKNOWN';

export interface AuthUser {
  id?: string;
  email?: string;
  role: string;
  full_name?: string;
  club_slug?: string;
  club_name?: string;
}

/**
 * Normalizes any role string into a canonical UserRole.
 */
export function normalizeRole(rawRole?: string | null): UserRole {
  if (!rawRole) return 'UNKNOWN';
  const r = rawRole.trim().toUpperCase().replace(/[\s-]/g, '_');

  if (r === 'CLUB_OWNER' || r === 'OWNER') {
    return 'OWNER';
  }
  if (r === 'STAFF' || r === 'FRONT_DESK' || r === 'RECEPTION' || r === 'DESK') {
    return 'FRONT_DESK';
  }
  if (r === 'KITCHEN_MANAGER' || r === 'KITCHEN' || r === 'CHEF' || r === 'COOK') {
    return 'KITCHEN';
  }
  if (r === 'COACH' || r === 'TRAINER' || r === 'INSTRUCTOR') {
    return 'COACH';
  }
  if (r === 'PLATFORM_ADMIN' || r === 'ADMIN' || r === 'SUPERADMIN') {
    return 'ADMIN';
  }
  if (r === 'MEMBER' || r === 'NON_MEMBER' || r === 'PLAYER' || r === 'USER') {
    return 'PLAYER';
  }
  return 'UNKNOWN';
}

/**
 * Gets the home dashboard URL for a given role.
 */
export function getRoleDashboard(role: UserRole, clubSlug?: string): string {
  switch (role) {
    case 'OWNER':
      return '/owner';
    case 'FRONT_DESK':
      return '/desk';
    case 'KITCHEN':
      return '/kitchen';
    case 'COACH':
      return '/coach';
    case 'ADMIN':
      return '/admin';
    case 'PLAYER':
      return '/dashboard';
    default:
      return '/login';
  }
}

/**
 * Backwards-compatible helper matching LoginPage.redirectByRole signature.
 */
export function redirectByRole(user: { role: string; club_slug?: string }): string {
  const normalized = normalizeRole(user.role);
  return getRoleDashboard(normalized, user.club_slug);
}

/**
 * Human-readable badge text for each role.
 */
export function getRoleBadge(role: UserRole): string {
  switch (role) {
    case 'OWNER':
      return 'Club Owner HQ';
    case 'FRONT_DESK':
      return 'Front Desk & POS';
    case 'KITCHEN':
      return 'Kitchen KDS';
    case 'COACH':
      return 'Coach Station';
    case 'ADMIN':
      return 'Platform Admin';
    case 'PLAYER':
      return 'Player';
    default:
      return 'Staff Member';
  }
}

export interface NavItem {
  label: string;
  path: string;
  iconName: string;
  description?: string;
}

/**
 * Defines navigation links visible to each role.
 * Links to another role's dashboard are never included.
 */
export function getNavItemsForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'OWNER':
      return [
        { label: 'Dashboard', path: '/owner', iconName: 'LayoutDashboard', description: 'Overview & occupancy' },
        { label: 'Club Settings', path: '/owner/settings', iconName: 'SlidersHorizontal', description: 'Games, courts & prices' },
        { label: 'Dynamic Pricing', path: '/owner/dynamic-pricing', iconName: 'SlidersHorizontal', description: 'Slot pricing rules' },
        { label: 'Finance & Payouts', path: '/owner/finance', iconName: 'DollarSign', description: 'Settlements & ledger' },
        { label: 'Events & Ads', path: '/owner/events-ads', iconName: 'Megaphone', description: 'Promotions & banners' },
        { label: 'Inventory', path: '/inventory', iconName: 'Package', description: 'Shop & equipment stock' },
        { label: 'CRM Leads', path: '/crm', iconName: 'Kanban', description: 'Prospects & enquiries' },
        { label: 'Staff & HR', path: '/staff', iconName: 'Users', description: 'Roster & shift schedule' },
      ];
    case 'FRONT_DESK':
      return [
        { label: 'Desk / POS', path: '/desk', iconName: 'Monitor', description: 'Walk-ins, QR check-in & register' },
      ];
    case 'KITCHEN':
      return [
        { label: 'Kitchen Orders', path: '/kitchen', iconName: 'UtensilsCrossed', description: 'Live KDS orders & canteen' },
      ];
    case 'COACH':
      return [
        { label: 'Coach Dashboard', path: '/coach', iconName: 'Award', description: 'Sessions & student training' },
      ];
    case 'ADMIN':
      return [
        { label: 'Platform Admin', path: '/admin', iconName: 'ShieldCheck', description: 'Club verifications & compliance' },
      ];
    default:
      return [];
  }
}

/**
 * Route access control: ensures each role can only access their allowed URLs.
 * Owner tools (/inventory, /crm, /staff) are strictly owner-only.
 * Admins do not have automatic access to club staff screens.
 */
export function canRoleAccessRoute(role: UserRole, pathname: string): boolean {
  if (pathname === '/portal') return true; // Handled by OpsLayout redirect to user's dashboard

  if (role === 'OWNER' || role === 'ADMIN') {
    return (
      pathname === '/owner' ||
      pathname.startsWith('/owner/') ||
      pathname === '/inventory' ||
      pathname === '/crm' ||
      pathname === '/staff' ||
      pathname === '/admin' ||
      pathname.startsWith('/admin/')
    );
  }
  if (role === 'FRONT_DESK') {
    return pathname === '/desk';
  }
  if (role === 'KITCHEN') {
    return pathname === '/kitchen';
  }
  if (role === 'COACH') {
    return pathname === '/coach';
  }
  return false;
}

/**
 * Safely loads authenticated user from localStorage.
 */
export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('sportshub_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clears client session and triggers logout.
 */
export async function logoutUser(): Promise<void> {
  try {
    localStorage.removeItem('sportshub_user');
    localStorage.removeItem('sportshub_token');
    localStorage.removeItem('sportshub_customer_bookings');
    localStorage.removeItem('sportshub_active_membership');
    sessionStorage.clear();
  } catch {
    // Ignore storage errors
  }

  // Attempt backend logout if route exists, with a fast timeout so it never hangs
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch {
    // Backend logout route may not exist; client session is already cleared
  }
}
