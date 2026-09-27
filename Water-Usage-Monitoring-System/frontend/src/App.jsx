import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { ProfileProvider } from "./context/ProfileContext";
import { LanguageProvider } from "./context/LanguageContext";
import ChatWidget from "./components/ChatWidget/ChatWidget";

import Login from "./pages/Login/Login";
import LoginPage from "./pages/Login/LoginPage";


/* =========================================================
   RESIDENT PAGES
========================================================= */

import Overview
  from "./pages/Resident/Dashboard/Overview";

import WaterConsumption
  from "./pages/Resident/watermanagement/WaterConsumption";

import UsageHistory
  from "./pages/Resident/watermanagement/UsageHistory";

import MeterDetails
  from "./pages/Resident/watermanagement/MeterDetails";

import MeterTips
  from "./pages/Resident/watermanagement/MeterTips";

import CurrentBill
  from "./pages/Resident/Billing/CurrentBill";

import BillingHistory
  from "./pages/Resident/Billing/BillingHistory";

import PaymentHistory
  from "./pages/Resident/Billing/PaymentHistory";

import Notifications
  from "./pages/Resident/Communication/Notifications";

import Alerts
  from "./pages/Resident/Communication/Alerts";

import MyProfile
  from "./pages/Resident/Account/MyProfile";

import AccountSettings
  from "./pages/Resident/Account/AccountSettings";

import HelpSupport
  from "./pages/Resident/Support/HelpSupport";


/* =========================================================
   ADMIN PAGES
========================================================= */

import AdminOverview
  from "./pages/Admin/Dashboard/Overview";

import HouseholdComparison from "./pages/Admin/CommunityOps/HouseholdComparison";
import Households from "./pages/Admin/CommunityOps/Households";
import HouseholdDetail from "./pages/Admin/CommunityOps/HouseholdDetail";
import MeterReadings from "./pages/Admin/CommunityOps/MeterReadings";
import BillingCycles from "./pages/Admin/CommunityOps/BillingCycles";
import TariffVersions from "./pages/Admin/CommunityOps/TariffVersions";
import BulkPurchases from "./pages/Admin/CommunityOps/BulkPurchases";

import ConsumptionComparison from "./pages/Resident/Comparison/ConsumptionComparison";

import Residents
  from "./pages/Admin/UserManagement/Residents";

import AddResident
  from "./pages/Admin/UserManagement/AddResident";

import UserAccounts
  from "./pages/Admin/UserManagement/UserAccounts";

import WaterMeters
  from "./pages/Admin/Watermanagement/WaterMeters";

import AddWaterMeter
  from "./pages/Admin/Watermanagement/AddWaterMeter";



import BillingManagement
  from "./pages/Admin/Billing/BillingManagement";

import PaymentManagement
  from "./pages/Admin/Billing/PaymentManagement";

import TariffManagement
  from "./pages/Admin/Billing/TariffManagement";

import TrafficManagement
  from "./pages/Admin/Billing/TrafficManagement";

import MeterMonitoring
  from "./pages/Admin/Operations/MeterMonitoring";

import AlertsNotifications
  from "./pages/Admin/Operations/AlertsNotifications";

import ServiceRequests
  from "./pages/Admin/ServiceMaintenance/ServiceRequests";

import MaintenanceManagement
  from "./pages/Admin/ServiceMaintenance/MaintenanceManagement";

import IssueTracking
  from "./pages/Admin/ServiceMaintenance/IssueTracking";

import ConsumptionReports
  from "./pages/Admin/Reports/ConsumptionReports";

import BillingReports
  from "./pages/Admin/Reports/BillingReports";

import RevenueReports
  from "./pages/Admin/Reports/RevenueReports";

import AdminProfile
  from "./pages/Admin/System/AdminProfile";

import SystemSettings
  from "./pages/Admin/System/SystemSettings";

/* =========================================================
   COMMUNITY ADMIN PAGES
========================================================= */
import CommunityAdminOverview
  from "./pages/CommunityAdmin/Dashboard/Overview";

import CommunityResidents
  from "./pages/CommunityAdmin/Residents/CommunityResidents";

import CommunityAdminManagement
  from "./pages/CommunityAdmin/AdminManagement/AdminManagement";

import CommunityUserAccounts
  from "./pages/CommunityAdmin/UserAccounts/CommunityUserAccounts";

import CommunityWaterMeters
  from "./pages/CommunityAdmin/WaterMeters/CommunityWaterMeters";

import CommunityConsumption
  from "./pages/CommunityAdmin/Consumption/CommunityConsumption";

import CommunityBilling
  from "./pages/CommunityAdmin/Billing/CommunityBilling";

import CommunityTariff
  from "./pages/CommunityAdmin/Tariff/CommunityTariff";

import CommunityAlerts
  from "./pages/CommunityAdmin/Alerts/CommunityAlerts";

import CommunityReports
  from "./pages/CommunityAdmin/Reports/CommunityReports";

import CommunitySettings
  from "./pages/CommunityAdmin/Settings/CommunitySettings";





/* =========================================================
   AUTH STATE HELPERS
========================================================= */

function getAuthState() {

  const isAuthenticated =
    localStorage.getItem("isAuthenticated") === "true";

  const userRole =
    localStorage.getItem("userRole");

  return {
    isAuthenticated,
    userRole,
  };
}


/* =========================================================
   ROUTE GUARDS
========================================================= */

function ProtectedRoute({ children }) {
  const { isAuthenticated } = getAuthState();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// Resident-only pages: admins are sent back to their own dashboard instead of
// seeing a resident page that the API will refuse to serve them.
function ResidentRoute({ children }) {
  const { isAuthenticated, userRole } = getAuthState();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // Admins may enter as a preview when they came through the "Resident Portal" button in their header.
  let previewing = false;
  try {
    previewing = sessionStorage.getItem("residentPreview") === "1";
  } catch {
    previewing = false;
  }
  if (!previewing) {
    if (userRole === "community_admin") {
      return <Navigate to="/community-admin/dashboard" replace />;
    }
    if (userRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
}


function AdminRoute({ children }) {
  const { isAuthenticated, userRole } = getAuthState();

  if (!isAuthenticated || (userRole !== "admin" && userRole !== "community_admin")) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function CommunityAdminRoute({ children }) {
  const { isAuthenticated, userRole } = getAuthState();

  if (!isAuthenticated || (userRole !== "community_admin" && userRole !== "admin")) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function LoginRoute() {
  const {
    isAuthenticated,
    userRole,
  } = getAuthState();

  if (isAuthenticated) {
    if (userRole === "community_admin") {
      return (
        <Navigate
          to="/community-admin/dashboard"
          replace
        />
      );
    }
    if (userRole === "admin") {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }
    if (userRole === "user") {
      return (
        <Navigate
          to="/resident/dashboard"
          replace
        />
      );
    }
  }

  return <Login />;
}


/* =========================================================
   APP
========================================================= */

function App() {
  // Clear localStorage authentication on first load in a new browser tab/session
  if (typeof window !== "undefined" && !sessionStorage.getItem("sessionActive")) {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("authToken");
    sessionStorage.setItem("sessionActive", "true");
  }

  return (
    <LanguageProvider>
      <ProfileProvider>
        <BrowserRouter>

        <Routes>


        {/* ROOT */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* LOGIN */}

        <Route
          path="/login"
          element={
            <LoginRoute />
          }
        />


        {/* FULL-SCREEN LOGIN PAGE */}

        <Route
          path="/login-page"
          element={
            <LoginPage />
          }
        />


        {/* ===================================================
            RESIDENT ROUTES
        =================================================== */}

        <Route
          path="/resident/dashboard"
          element={
            <ResidentRoute>

              <Overview />

            </ResidentRoute>
          }
        />

        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute>

              <Overview />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/consumption-comparison"
          element={
            <ResidentRoute>
              <ConsumptionComparison />
            </ResidentRoute>
          }
        />

        <Route
          path="/resident/water-consumption"
          element={
            <ProtectedRoute>

              <WaterConsumption />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/usage-history"
          element={
            <ProtectedRoute>

              <UsageHistory />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/meter-details"
          element={
            <ProtectedRoute>

              <MeterDetails />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/meter-tips"
          element={
            <ProtectedRoute>

              <MeterTips />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/current-bill"
          element={
            <ProtectedRoute>

              <CurrentBill />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/billing-history"
          element={
            <ProtectedRoute>

              <BillingHistory />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/payment-history"
          element={
            <ProtectedRoute>

              <PaymentHistory />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/notifications"
          element={
            <ProtectedRoute>

              <Notifications />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/alerts"
          element={
            <ProtectedRoute>

              <Alerts />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/profile"
          element={
            <ProtectedRoute>

              <MyProfile />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/settings"
          element={
            <ProtectedRoute>

              <AccountSettings />

            </ProtectedRoute>
          }
        />


        <Route
          path="/resident/help"
          element={
            <ProtectedRoute>

              <HelpSupport />

            </ProtectedRoute>
          }
        />


        {/* ===================================================
            ADMIN ROUTES
        =================================================== */}

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>

              <AdminOverview />

            </AdminRoute>
          }
        />


        <Route
          path="/admin/residents"
          element={
            <AdminRoute>
              <Residents />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/add-resident"
          element={
            <AdminRoute>
              <AddResident />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/user-accounts"
          element={
            <AdminRoute>
              <UserAccounts />
            </AdminRoute>
          }
        />

        {/* WATER MANAGEMENT */}
        <Route
          path="/admin/water-management/water-meters"
          element={
            <AdminRoute>
              <WaterMeters />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/water-meters"
          element={
            <AdminRoute>
              <WaterMeters />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/add-water-meter"
          element={
            <AdminRoute>
              <AddWaterMeter />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/water-management/add-water-meter"
          element={
            <AdminRoute>
              <AddWaterMeter />
            </AdminRoute>
          }
        />

        <Route path="/admin/water-management/consumption-monitoring" element={<Navigate to="/admin/household-comparison" replace />} />

        <Route path="/admin/consumption-monitoring" element={<Navigate to="/admin/household-comparison" replace />} />

        <Route path="/admin/water-management/usage-analytics" element={<Navigate to="/admin/household-comparison" replace />} />

        <Route path="/admin/usage-analytics" element={<Navigate to="/admin/household-comparison" replace />} />


        <Route
          path="/admin/households"
          element={
            <AdminRoute>
              <Households />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/households/:id"
          element={
            <AdminRoute>
              <HouseholdDetail />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/household-comparison"
          element={
            <AdminRoute>
              <HouseholdComparison />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/meter-readings"
          element={
            <AdminRoute>
              <MeterReadings />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/billing-cycles"
          element={
            <AdminRoute>
              <BillingCycles />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/tariff-versions"
          element={
            <AdminRoute>
              <TariffVersions />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/bulk-purchases"
          element={
            <AdminRoute>
              <BulkPurchases />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/billing-management"
          element={
            <AdminRoute>
              <BillingManagement />
            </AdminRoute>
          }
        />


        <Route
          path="/admin/payment-management"
          element={
            <AdminRoute>
              <PaymentManagement />
            </AdminRoute>
          }
        />


        <Route
          path="/admin/tariff-management"
          element={
            <AdminRoute>
              <TariffManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/traffic-management"
          element={
            <AdminRoute>
              <TrafficManagement />
            </AdminRoute>
          }
        />


        <Route
          path="/admin/meter-monitoring"
          element={
            <AdminRoute>
              <MeterMonitoring />
            </AdminRoute>
          }
        />


        <Route
          path="/admin/alerts-notifications"
          element={
            <AdminRoute>
              <AlertsNotifications />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/service-requests"
          element={
            <AdminRoute>
              <ServiceRequests />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/maintenance-management"
          element={
            <AdminRoute>
              <MaintenanceManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/issue-tracking"
          element={
            <AdminRoute>
              <IssueTracking />
            </AdminRoute>
          }
        />


        <Route
          path="/admin/consumption-reports"
          element={
            <AdminRoute>
              <ConsumptionReports />
            </AdminRoute>
          }
        />


        <Route
          path="/admin/billing-reports"
          element={
            <AdminRoute>
              <BillingReports />
            </AdminRoute>
          }
        />


        <Route
          path="/admin/revenue-reports"
          element={
            <AdminRoute>
              <RevenueReports />
            </AdminRoute>
          }
        />


        <Route
          path="/admin/profile"
          element={
            <AdminRoute>
              <AdminProfile />
            </AdminRoute>
          }
        />


        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <SystemSettings />
            </AdminRoute>
          }
        />

        {/* ===================================================
            COMMUNITY ADMIN ROUTES
        =================================================== */}
        <Route
          path="/community-admin/dashboard"
          element={
            <CommunityAdminRoute>
              <CommunityAdminOverview />
            </CommunityAdminRoute>
          }
        />

        <Route
          path="/community-admin/residents"
          element={
            <CommunityAdminRoute>
              <CommunityResidents />
            </CommunityAdminRoute>
          }
        />

        <Route
          path="/community-admin/admin-management"
          element={
            <CommunityAdminRoute>
              <CommunityAdminManagement />
            </CommunityAdminRoute>
          }
        />

        <Route
          path="/community-admin/user-accounts"
          element={
            <CommunityAdminRoute>
              <CommunityUserAccounts />
            </CommunityAdminRoute>
          }
        />

        <Route
          path="/community-admin/water-meters"
          element={
            <CommunityAdminRoute>
              <CommunityWaterMeters />
            </CommunityAdminRoute>
          }
        />

        <Route
          path="/community-admin/consumption-monitoring"
          element={
            <CommunityAdminRoute>
              <CommunityConsumption />
            </CommunityAdminRoute>
          }
        />

        <Route
          path="/community-admin/billing-payments"
          element={
            <CommunityAdminRoute>
              <CommunityBilling />
            </CommunityAdminRoute>
          }
        />

        <Route
          path="/community-admin/tariff-management"
          element={
            <CommunityAdminRoute>
              <CommunityTariff />
            </CommunityAdminRoute>
          }
        />

        <Route
          path="/community-admin/alerts-notifications"
          element={
            <CommunityAdminRoute>
              <CommunityAlerts />
            </CommunityAdminRoute>
          }
        />

        <Route
          path="/community-admin/reports"
          element={
            <CommunityAdminRoute>
              <CommunityReports />
            </CommunityAdminRoute>
          }
        />

        <Route
          path="/community-admin/settings"
          element={
            <CommunityAdminRoute>
              <CommunitySettings />
            </CommunityAdminRoute>
          }
        />

        {/* CATCH-ALL */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


      </Routes>

      {/* AquaBot — floating chatbot on all pages */}
      <ChatWidget />

    </BrowserRouter>
    </ProfileProvider>
    </LanguageProvider>
  );
}


export default App;