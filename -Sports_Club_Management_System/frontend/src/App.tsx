import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout';
import { OpsLayout } from '@/layouts/OpsLayout';

// Public Marketing & Info Pages
import HomePage from '@/pages/public/HomePage';
import AcademicPage from '@/pages/public/AcademicPage';
import ContactPage from '@/pages/public/ContactPage';
import CorporatePage from '@/pages/public/CorporatePage';
import FAQPage from '@/pages/public/FaqPage';
import HowBookingWorksPage from '@/pages/public/HowBookingWorksPage';
import HowWeVerifyPage from '@/pages/public/HowWeVerifyPage';
import PrivacyPage from '@/pages/public/PrivacyPage';
import ReferralPage from '@/pages/public/ReferralPage';
import RefundsPage from '@/pages/public/RefundsPage';
import TermsPage from '@/pages/public/TermsPage';

// Customer Flow Pages
import ClubsDiscoveryPage from '@/pages/customer/ClubsDiscoveryPage';
import ClubDetailPage from '@/pages/customer/ClubDetailPage';
import CourtBookingPage from '@/pages/customer/CourtBookingPage';
import ClubMembershipsPage from '@/pages/customer/ClubMembershipsPage';
import ClubShopPage from '@/pages/customer/ClubShopPage';
import CartPage from '@/pages/customer/CartPage';
import CheckoutPage from '@/pages/customer/CheckoutPage';
import MyBookingsPage from '@/pages/customer/MyBookingsPage';
import DigitalMembershipCardPage from '@/pages/customer/DigitalMembershipCardPage';
import CustomerDashboardPage from '@/pages/customer/CustomerDashboardPage';
import CustomerProfilePage from '@/pages/customer/CustomerProfilePage';
import CustomerCanteenPage from '@/pages/customer/CustomerCanteenPage';
import MatchmakingPage from '@/pages/customer/MatchmakingPage';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterRoleSelectionPage from '@/pages/auth/RegisterPage';
import ClubOwnerRegistrationPage from '@/pages/auth/RegisterClubPage';
import PlayerRegistrationPage from '@/pages/auth/RegisterPlayerPage';

// Ops Pages
import HomePortalPage from '@/pages/ops/HomePortalPage';
import OwnerDashboardPage from '@/pages/ops/OwnerDashboardPage';
import OwnerSettingsPage from '@/pages/ops/OwnerSettingsPage';
import DynamicPricingPage from '@/pages/ops/DynamicPricingPage';
import FinancePayoutsPage from '@/pages/ops/FinancePayoutsPage';
import EventsAdsPage from '@/pages/ops/EventsAdsPage';
import FrontDeskTerminalPage from '@/pages/ops/FrontDeskTerminalPage';
import KitchenKdsPage from '@/pages/ops/KitchenKdsPage';
import InventoryManagerPage from '@/pages/ops/InventoryManagerPage';
import CrmPipelinePage from '@/pages/ops/CrmPipelinePage';
import StaffHrPage from '@/pages/ops/StaffHrPage';
import PlatformAdminPage from '@/pages/ops/PlatformAdminPage';
import CoachDashboardPage from '@/pages/ops/CoachDashboardPage';

export default function App() {
  return (
    <Routes>
      {/* 1. Public Customer & Information Routes (Shared Navbar & Footer) */}
      <Route element={<PublicLayout />}>
        {/* Landing & Discovery */}
        <Route path="/" element={<HomePage />} />
        <Route path="/clubs" element={<ClubsDiscoveryPage />} />
        <Route path="/matches" element={<MatchmakingPage />} />

        {/* Club Details & Customer Operations */}
        <Route path="/club/:slug" element={<ClubDetailPage />} />
        <Route path="/club/:slug/book" element={<CourtBookingPage />} />
        <Route path="/club/:slug/memberships" element={<ClubMembershipsPage />} />
        <Route path="/club/:slug/shop" element={<ClubShopPage />} />

        {/* Cart & Checkout */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Customer Self-Service */}
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/my-membership" element={<DigitalMembershipCardPage />} />
        <Route path="/dashboard" element={<CustomerDashboardPage />} />
        <Route path="/profile" element={<CustomerProfilePage />} />
        <Route path="/canteen-ordering" element={<CustomerCanteenPage />} />
        <Route path="/canteen" element={<CustomerCanteenPage />} />

        {/* Information & Trust Pages */}
        <Route path="/academic" element={<AcademicPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/corporate" element={<CorporatePage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/how-booking-works" element={<HowBookingWorksPage />} />
        <Route path="/how-we-verify" element={<HowWeVerifyPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/referral" element={<ReferralPage />} />
        <Route path="/refunds" element={<RefundsPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>

      {/* 2. Standalone Auth Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterRoleSelectionPage />} />
      <Route path="/register/club" element={<ClubOwnerRegistrationPage />} />
      <Route path="/register/player" element={<PlayerRegistrationPage />} />

      {/* 3. Operational Staff & Owner Routes (Dedicated Terminals / OwnerSidebar) */}
      <Route element={<OpsLayout />}>
        <Route path="/portal" element={<HomePortalPage />} />
        <Route path="/owner" element={<OwnerDashboardPage />} />
        <Route path="/owner/settings" element={<OwnerSettingsPage />} />
        <Route path="/owner/onboarding" element={<OwnerSettingsPage />} />
        <Route path="/owner/dynamic-pricing" element={<DynamicPricingPage />} />
        <Route path="/owner/finance" element={<FinancePayoutsPage />} />
        <Route path="/owner/events-ads" element={<EventsAdsPage />} />
        <Route path="/desk" element={<FrontDeskTerminalPage />} />
        <Route path="/kitchen" element={<KitchenKdsPage />} />
        <Route path="/inventory" element={<InventoryManagerPage />} />
        <Route path="/crm" element={<CrmPipelinePage />} />
        <Route path="/staff" element={<StaffHrPage />} />
        <Route path="/admin" element={<PlatformAdminPage />} />
        <Route path="/coach" element={<CoachDashboardPage />} />
      </Route>

      {/* 4. Redirects & Fallback */}
      <Route path="/frontdesk" element={<Navigate to="/desk" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
