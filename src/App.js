import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import AdmissionRequestsReport from "./pages/AdmissionRequestsReport";
import HrEmployeesPage from "./pages/HrEmployeesPage.jsx";
import HrAttendancePage from "./pages/HrAttendancePage.js";
import HrLeavesPage from "./pages/HrLeavesPage";
import HrPermissionsPage from "./pages/HrPermissionsPage.jsx";
import VipCustomers from "./pages/VipCustomers";
import Login from './pages/Login';
import HrDepartmentsPage from "./pages/HrDepartmentsPage.jsx";
import HrContractsPage from "./pages/HrContractsPage.jsx";
import HrJobTitlesPage from "./pages/HrJobTitlesPage.jsx";
import OnlineRegistrationRequests from "./pages/OnlineRegistrationRequests";
import BalanceReviewPage from "./pages/BalanceReviewPage";
import GeneralAccountStatement from "./pages/GeneralAccountStatement.jsx";
import GeneralDaily from "./pages/GeneralDaily.jsx";
import JournalEntry from "./pages/JournalEntry.jsx";
import CashDisbursement from "./pages/CashDisbursement.jsx";
import TrialBalance from "./pages/TrialBalance.jsx";
import ClosingEntry from "./pages/ClosingEntry.jsx";
import ConsolidatedIncomeStatement from "./pages/ConsolidatedIncomeStatement.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import SidebarSettings from "./pages/SidebarSettings.jsx";
import SalesManManagement from "./pages/SalesManManagement.jsx";
import TrainerManagement from "./pages/TrainerManagement.jsx";
import DiscountTypeManagement from "./pages/DiscountTypeManagement.jsx";
import ServiceManagement from "./pages/ServiceManagement.jsx";
import ChangeUserPassword from "./pages/ChangeUserPassword.jsx";
import UserActionReport from "./pages/UserActionReport.jsx";
import QualityFormsAudit from "./pages/QualityFormsAudit.jsx";
import BatchManagement from "./pages/BatchManagement.jsx";
import BatchCountManagement from "./pages/BatchCountManagement.jsx";

import OfflineRegistrationRequests
  from "./pages/OfflineRegistrationRequests";
import Dashboard from './pages/Dashboard';
import DesktopDevicesAccessPage from './pages/DesktopDevicesAccessPage';
import CircularsList from "./pages/CircularsList";
import CircularsUpload from "./pages/CircularsUpload";
import PrivateRoute from './components/PrivateRoute';
import AdminDashboard from './components/AdminDashboard';
import AdminStats from "./components/AdminStats";
import AdmissionRequests from "./pages/AdmissionRequests";
import UploadUpdate from './components/UploadUpdate';
import TrainerStudentGrid from './components/TrainerStudentGrid';
import RegistrationCommissions from './components/RegistrationCommissions';
import MyRequests from "./MyRequests";
import StudentSearch from './components/StudentSearch';
import InquiriesPage from './components/InquiriesPage';
import ReportClients from './components/RportForClinets';
import DailyFollowUpReport from './pages/DailyFollowUpReport';
import EmployeeCVAdminPage from './components/EmployeeCVAdminPage';
import BranchReport from './components/PastReports';
import ChatSystem from './pages/ChatMian';
import ExplorerNetwork from './pages/ExploerNetwork';
import BranchReportsPage from './pages/BranchReportsPage';
import Complaints from './pages/Complaiments';
import AttendancePage from './pages/AttendancePage';
import DailyAttendanceReport from './pages/DailyAttendanceReport';
import MonthlyAttendanceReport from './pages/MonthlyAttendanceReport';
import PeriodicReports from './pages/PeriodicReports';
import TrainerStudentGrid2 from './components/TrainerStudentGrid2';
import ExceptionsLists from './components/ExceptionsLists';


import AdminBranchesReports from './pages/PeriodicReportsForManagers';
import PrintExamPage from './pages/PrintExamPage';
import CreateExam from './pages/CreateExam';

import Header from './components/Header';
import HRCreateSurvey from './components/HRCreateSurvey';
import EmployeeSurveys from './components/EmployeeSurveys';
import MeetingPage from './pages/MeetingPage';

import TechnicalSupport from './components/TechnicalSupport';
import ExceptionsListsAdmin from './components/ExceptionsListsAdmin';
import Announcements from './components/Announcements';

import AchievementsPage from './components/Achievements';
import AdminAchievementsPage from './components/AdminAchievementsPage';

import P2PMarketing from './components/P2PMarketing';
import P2PMarketingAdmin from './components/P2PMarketingAdmin';

import EmployeeEvaluationPage from './components/EmployeeEvaluationPage';

import StudentNotes from './components/StudentNotes';
import AdminStudentNotes from './components/AdminStudentNotes';
import UploadGrades from './components/UploadGrades';
import AdminIncomeDashboard from './components/AdminIncomeDashboard';
import ReceptionOffice from './pages/ReceptionOffice';
import OtherInstituteRegistrationsPage from './pages/OtherInstituteRegistrationsPage';
import AfterSalesFollow from './pages/AfterSalesFollow';
import AfterSalesReport from './pages/AfterSalesReport';
import TrainingAgreementsFollow from './pages/TrainingAgreementsFollow';
import RegistrationRequestReport from './pages/RegistrationRequestReport';
import BatchSeatsCounter from './pages/BatchSeatsCounter';
import CollectionCommissionsReport from './pages/CollectionCommissionsReport';
import RewardsList from './pages/RewardsList';
import BatchStatistics from './pages/BatchStatistics';
import PaymentFollowReport from './pages/PaymentFollowReport';
import PaymentRequestsReport from './pages/PaymentRequestsReport.jsx';
import SalesReport from './pages/SalesReport.jsx';
import TaxSalesReport from './pages/TaxSalesReport.jsx';
import TaxReturnsReport from './pages/TaxReturnsReport.jsx';
import GraduatesFollowReport from './pages/GraduatesFollowReport';
import MarketersReport from './pages/MarketersReport';
import DiscountRequestsReport from './pages/DiscountRequestsReport';
import DeregistrationRequestsReport from './pages/DeregistrationRequestsReport';
import RefundRequestsReport from './pages/RefundRequestsReport';
import TransferRequestsReport from './pages/TransferRequestsReport';
import CashPaymentOrder from './pages/CashPaymentOrder';
import CashReceiptAcknowledgment from './pages/CashReceiptAcknowledgment';
import BranchDailyReport from './pages/BranchDailyReport';
import QualityFormsPage from './pages/QualityFormsPage';
import NewStudentsPage from './pages/NewStudentsPage';
import DiplomaStudentsPage from './pages/DiplomaStudentsPage';
import CourseStudentsPage from './pages/CourseStudentsPage';

const PERMISSION_API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5258';

const permissionFlagCache = new Map();
const permissionFlagPromises = new Map();

const permissionCacheKey = (key, permission) => `${String(key)}|${String(permission)}`;

const loadPermissionFlagShared = async (key, permission) => {
  const cacheKey = permissionCacheKey(key, permission);
  if (permissionFlagCache.has(cacheKey)) {
    return permissionFlagCache.get(cacheKey);
  }

  if (permissionFlagPromises.has(cacheKey)) {
    return permissionFlagPromises.get(cacheKey);
  }

  const promise = (async () => {
    const params = new URLSearchParams({ key, permission });
    const response = await fetch(
      `${PERMISSION_API_BASE_URL}/api/screen-access/me?${params.toString()}`,
      { cache: 'no-store' }
    );
    const result = await response.json().catch(() => null);
    const allowed = response.ok && result?.allowed === true;
    permissionFlagCache.set(cacheKey, allowed);
    return allowed;
  })();

  permissionFlagPromises.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    permissionFlagPromises.delete(cacheKey);
  }
};

const usePermissionFlag = (key, permission = 'view') => {
  const cacheKey = permissionCacheKey(key, permission);
  const cached = permissionFlagCache.get(cacheKey);
  const [state, setState] = useState({
    loading: cached === undefined,
    allowed: cached === true
  });

  useEffect(() => {
    let alive = true;
    const immediate = permissionFlagCache.get(cacheKey);

    if (immediate !== undefined) {
      setState({ loading: false, allowed: immediate === true });
      return () => {
        alive = false;
      };
    }

    loadPermissionFlagShared(key, permission)
      .then((allowed) => {
        if (alive) setState({ loading: false, allowed });
      })
      .catch(() => {
        if (alive) setState({ loading: false, allowed: false });
      });

    return () => {
      alive = false;
    };
  }, [cacheKey, key, permission]);

  return state;
};

const PermissionModeRoute = ({ permissionKey, adminComponent, defaultComponent }) => {
  const { loading, allowed } = usePermissionFlag(permissionKey, 'view');

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: '"Cairo", sans-serif'
      }}>
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  return allowed ? adminComponent : defaultComponent;
};

const AchievementsRoute = () => (
  <PermissionModeRoute
    permissionKey="achievements-admin-mode"
    adminComponent={<AdminAchievementsPage />}
    defaultComponent={<AchievementsPage />}
  />
);

const P2PRoute = () => (
  <PermissionModeRoute
    permissionKey="p2p-admin-mode"
    adminComponent={<P2PMarketingAdmin />}
    defaultComponent={<P2PMarketing />}
  />
);

const StudentNotesRoute = () => (
  <PermissionModeRoute
    permissionKey="student-notes-admin-mode"
    adminComponent={<AdminStudentNotes />}
    defaultComponent={<StudentNotes />}
  />
);

const ConditionalAttendancePage = () => (
  <PermissionModeRoute
    permissionKey="attendance-admin-mode"
    adminComponent={<AdminBranchesReports />}
    defaultComponent={<AttendancePage />}
  />
);

const BRANCH_CACHE_TTL_MS = 10 * 60 * 1000;
let branchesMemoryCache = null;
let branchesLoadedAt = 0;
let branchesRequestPromise = null;

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const getFallbackBranch = (userData) => {
  if (!userData) return null;

  try {
    const cached = JSON.parse(localStorage.getItem('user_branch') || 'null');
    if (
      cached &&
      (!userData.branchForWork || !cached.guid || cached.guid === userData.branchForWork)
    ) {
      return cached;
    }
  } catch {
    // Ignore invalid local branch cache.
  }

  return {
    branchName: userData.branchForWork || 'الفرع الرئيسي',
    guid: userData.branchForWork
  };
};

const loadBranchesShared = async () => {
  const now = Date.now();
  if (
    Array.isArray(branchesMemoryCache) &&
    now - branchesLoadedAt < BRANCH_CACHE_TTL_MS
  ) {
    return branchesMemoryCache;
  }

  if (branchesRequestPromise) return branchesRequestPromise;

  branchesRequestPromise = (async () => {
    const response = await fetch('https://api1.sstli.com/api/branches/all', {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load branches: ${response.status}`);
    }

    const rows = await response.json();
    branchesMemoryCache = Array.isArray(rows) ? rows : [];
    branchesLoadedAt = Date.now();
    return branchesMemoryCache;
  })();

  try {
    return await branchesRequestPromise;
  } finally {
    branchesRequestPromise = null;
  }
};

const useCurrentUserAndBranch = () => {
  const initialUser = readStoredUser();
  const [user, setUser] = useState(initialUser);
  const [branch, setBranch] = useState(() => getFallbackBranch(initialUser));

  useEffect(() => {
    let alive = true;

    const syncFromStorage = () => {
      const nextUser = readStoredUser();
      if (!alive) return;
      setUser(nextUser);
      setBranch((current) => current || getFallbackBranch(nextUser));
    };

    window.addEventListener('sstli-auth-refreshed', syncFromStorage);

    const userData = readStoredUser();
    if (userData) {
      // لا نوقف رسم الصفحة أثناء تحديث اسم الفرع؛ الكاش يظهر فوراً.
      loadBranchesShared()
        .then((branches) => {
          if (!alive) return;

          const userBranch = branches.find(
            (item) => item?.guid === userData.branchForWork
          );

          if (userBranch) {
            setBranch(userBranch);
            localStorage.setItem('user_branch', JSON.stringify(userBranch));
          }
        })
        .catch((error) => {
          console.warn('Background branch refresh failed:', error);
        });
    }

    return () => {
      alive = false;
      window.removeEventListener('sstli-auth-refreshed', syncFromStorage);
    };
  }, []);

  return { user, branch };
};

const MainLayoutWithHeader = ({ children }) => {
  const { user, branch } = useCurrentUserAndBranch();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('user_branch');
    localStorage.removeItem('token');
    sessionStorage.removeItem('sstli_auth_verified_v2');
    sessionStorage.removeItem('sstli_screen_access_v2');
    window.location.href = '/login';
  };

  if (!user) return children;

  return (
    <div className="main-shell" style={{ direction: 'rtl' }}>
      <Header user={user} branch={branch} onLogout={handleLogout} />
      {React.isValidElement(children)
        ? React.cloneElement(children, { userBranch: branch })
        : children}
    </div>
  );
};

const LayoutWithoutHeader = ({ children }) => {
  const { user, branch } = useCurrentUserAndBranch();

  return React.isValidElement(children)
    ? React.cloneElement(children, { user, userBranch: branch })
    : children;
};

function App() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `.swal2-container { z-index: 2500 !important; }`;
    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard/tests"
            element={
              <PrivateRoute>
                <MainLayoutWithHeader>
                  <PrintExamPage />
                </MainLayoutWithHeader>
              </PrivateRoute>
            }
          />

          <Route
  path="/dashboard/hr-employees"
  element={
    <PrivateRoute>
      <LayoutWithoutHeader>
        <HrEmployeesPage />
      </LayoutWithoutHeader>
    </PrivateRoute>
  }
/>

<Route
  path="/dashboard/hr-contracts"
  element={
    <PrivateRoute>
      <LayoutWithoutHeader>
        <HrContractsPage />
      </LayoutWithoutHeader>
    </PrivateRoute>
  }
/>

          <Route
            path="/dashboard/upload-update"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <UploadUpdate />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/admission-requests"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AdmissionRequests />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />


          <Route
            path="/dashboard/batch-seats-counter"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <BatchSeatsCounter />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />


          <Route
            path="/dashboard/new-students"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <NewStudentsPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/diploma-students"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <DiplomaStudentsPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
  path="/dashboard/hr-departments"
  element={
    <PrivateRoute>
      <LayoutWithoutHeader>
        <HrDepartmentsPage />
      </LayoutWithoutHeader>
    </PrivateRoute>
  }
/>



          <Route
            path="/dashboard/course-students"
            element={
              <PrivateRoute>
                <CourseStudentsPage />
              </PrivateRoute>
            }
          />

<Route
            path="/dashboard/quality-forms"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <QualityFormsPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />


          <Route
            path="/dashboard/marketers-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <MarketersReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/collection-commissions-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <CollectionCommissionsReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />


          <Route
            path="/dashboard/rewards-list"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <RewardsList />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />


          <Route
            path="/dashboard/batch-statistics"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <BatchStatistics />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/payment-follow-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <PaymentFollowReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

            <Route
            path="/dashboard/hr-job-titles"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <HrJobTitlesPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/payment-requests-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <PaymentRequestsReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/sales-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <SalesReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/tax-sales-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <TaxSalesReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/tax-returns-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <TaxReturnsReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
  path="/dashboard/hr-attendance"
  element={
    <PrivateRoute>
      <LayoutWithoutHeader>
        <HrAttendancePage />
      </LayoutWithoutHeader>
    </PrivateRoute>
  }
/>

          <Route
            path="/dashboard/graduates-follow-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <GraduatesFollowReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/discount-requests-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <DiscountRequestsReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/deregistration-requests-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <DeregistrationRequestsReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/refund-requests-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <RefundRequestsReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/transfer-requests-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <TransferRequestsReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

            <Route
            path="/dashboard/hr-permissions"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <HrPermissionsPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/hr-employee-permissions"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <HrPermissionsPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/employee-permissions"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <HrPermissionsPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/hr-leaves"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <HrLeavesPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/cash-payment-order"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <CashPaymentOrder />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/cash-receipt-acknowledgment"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <CashReceiptAcknowledgment />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/branch-daily"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <BranchDailyReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/receptionoffice"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ReceptionOffice />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

            <Route
            path="/dashboard/online-registration-requests"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <OnlineRegistrationRequests  />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

     <Route
            path="/dashboard/offline-registration-requests"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <OfflineRegistrationRequests   />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/other-institute-registrations"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <OtherInstituteRegistrationsPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/desktop-devices"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <DesktopDevicesAccessPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/circulars"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <CircularsList />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/circulars-upload"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <CircularsUpload />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/create-exam"
            element={
              <PrivateRoute>
                <MainLayoutWithHeader>
                  <CreateExam />
                </MainLayoutWithHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/upload-grades"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <UploadGrades />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin-income"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AdminIncomeDashboard />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <Dashboard />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/meeting/:meetingId"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <MeetingPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ConditionalAttendancePage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/attendance-normal"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AttendancePage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/attendance-admin"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AdminBranchesReports />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/student-notes"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <StudentNotesRoute />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />
             <Route
            path="/dashboard/my-requests"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <MyRequests  />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/employee-evaluation"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <EmployeeEvaluationPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/mohamed-adel-announcements"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <Announcements />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/exceptions"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ExceptionsLists />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/exceptionsadmin"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ExceptionsListsAdmin />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/general-account-statement"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <GeneralAccountStatement />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/general-daily"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <GeneralDaily />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/journal-entry"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <JournalEntry />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/cash-disbursement"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <CashDisbursement />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/trial-balance"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <TrialBalance />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/closing-entry"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ClosingEntry />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/consolidated-income-statement"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ConsolidatedIncomeStatement />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/balance-review"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <BalanceReviewPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/tra"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <TrainerStudentGrid2 />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

            <Route
            path="/dashboard/vip-customers"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <VipCustomers />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/daily"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <DailyAttendanceReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/monthly"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <MonthlyAttendanceReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/inquiries"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <InquiriesPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/cleints"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <StudentSearch />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ReportClients />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/payments"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <TrainerStudentGrid2 />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/admission-requests-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AdmissionRequestsReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/dailyreport"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <DailyFollowUpReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/periodic-reports"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <PeriodicReports />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/reportsfrobranches"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <BranchReportsPage />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/complaints"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <Complaints />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/exploer"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ExplorerNetwork />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/achievements"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AchievementsRoute />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/p2p-marketing"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <P2PRoute />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/technical-support"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <TechnicalSupport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/pastreports"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <BranchReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/registration-commissions"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <RegistrationCommissions />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin-stats"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AdminStats />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/commision"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <RegistrationCommissions />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />
          <Route
  path="/dashboard/employee-cvs"
  element={
    <PrivateRoute>
      <LayoutWithoutHeader>
        <EmployeeCVAdminPage />
      </LayoutWithoutHeader>
    </PrivateRoute>
  }
/>

          <Route
            path="/dashboard/create-survey"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <HRCreateSurvey />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/surveys"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <EmployeeSurveys />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/chats"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ChatSystem />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/user-management"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <UserManagement />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/sidebar-settings"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <SidebarSettings />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/salesman-management"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <SalesManManagement />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/trainer-management"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <TrainerManagement />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/discount-type-management"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <DiscountTypeManagement />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/service-management"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ServiceManagement />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/change-password"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <ChangeUserPassword />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/user-action-report"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <UserActionReport />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />


          <Route
            path="/dashboard/quality-forms-audit"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <QualityFormsAudit />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" />} />
                      <Route
                path="/dashboard/after-sales-follow"
                element={<AfterSalesFollow />}
              />
              <Route
                path="/dashboard/after-sales-report"
                element={<AfterSalesReport />}
              />
              <Route
                path="/dashboard/training-agreements-follow"
                element={<TrainingAgreementsFollow />}
              />

          <Route
            path="/dashboard/batch-management"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <BatchManagement />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/batch-count-management"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <BatchCountManagement />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />
<Route
                path="/dashboard/registration-request-report"
                element={<RegistrationRequestReport />}
              />
</Routes>
      </Router>
    </>
  );
}

const loadingStyles = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  direction: 'rtl'
};

const spinnerStyles = {
  width: '50px',
  height: '50px',
  border: '4px solid rgba(255, 255, 255, 0.3)',
  borderTop: '4px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '16px'
};

const loadingTextStyles = {
  fontSize: '18px',
  color: 'white',
  fontWeight: '500'
};

export default App;