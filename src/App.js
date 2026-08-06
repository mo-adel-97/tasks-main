import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import AdmissionRequestsReport from "./pages/AdmissionRequestsReport";
import VipCustomers from "./pages/VipCustomers";
import Login from './pages/Login';
import OnlineRegistrationRequests
  from "./pages/OnlineRegistrationRequests";

import OfflineRegistrationRequests
  from "./pages/OfflineRegistrationRequests";
import Dashboard from './pages/Dashboard';
import DesktopDevicesAccessPage from './pages/DesktopDevicesAccessPage';
import CircularsList from "./pages/CircularsList";
import CircularsUpload from "./pages/CircularsUpload";
import PrivateRoute from './components/PrivateRoute';
import AdminDashboard from './components/AdminDashboard';
import AdminStats from "./components/AdminStats";
import AllTasksList from './components/AllTasksList';
import AdmissionRequests from "./pages/AdmissionRequests";
import UploadUpdate from './components/UploadUpdate';
import TrainerStudentGrid from './components/TrainerStudentGrid';
import RegistrationCommissions from './components/RegistrationCommissions';
import MyRequests from "./MyRequests";
import NewTaskForm from './components/NewTaskForm';
import AssignedTasks from './components/AssignedTasks';
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
import AdminViewTasks from './pages/AdminViewTasks';
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

const isAdminForAchievements = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const job = Number(u?.userJop);
    return [0, 1, 2, 3].includes(job);
  } catch {
    return false;
  }
};

const AchievementsRoute = () => {
  return isAdminForAchievements()
    ? <AdminAchievementsPage />
    : <AchievementsPage />;
};

const isTopManagement = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && [0, 1, 2, 3].includes(Number(user.userJop));
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return false;
  }
};

const isP2PAdmin = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const job = Number(u?.userJop);
    return [0, 1, 2, 3].includes(job);
  } catch {
    return false;
  }
};

const P2PRoute = () => {
  const [authorized, setAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uRaw = localStorage.getItem('user');
    const u = uRaw ? JSON.parse(uRaw) : null;

    const ok = !!u?.guid;
    setAuthorized(ok);

    const admin = isP2PAdmin();
    setIsAdmin(admin);

    setLoading(false);
  }, []);

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

  if (!authorized) return <Navigate to="/login" />;

  return isAdmin ? <P2PMarketingAdmin /> : <P2PMarketing />;
};

const isStudentNotesAdmin = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const job = Number(u?.userJop);
    return [0, 1, 2, 3].includes(job);
  } catch {
    return false;
  }
};

const isStudentNotesUser = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const job = Number(u?.userJop);
    return job === 9;
  } catch {
    return false;
  }
};

const StudentNotesRoute = () => {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("deny");

  useEffect(() => {
    const uRaw = localStorage.getItem('user');
    const u = uRaw ? JSON.parse(uRaw) : null;

    if (!u?.guid) {
      setMode("deny");
      setLoading(false);
      return;
    }

    if (isStudentNotesAdmin()) setMode("admin");
    else if (isStudentNotesUser()) setMode("user");
    else setMode("deny");

    setLoading(false);
  }, []);

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

  if (mode === "deny") return <Navigate to="/dashboard" />;

  return mode === "admin" ? <AdminStudentNotes /> : <StudentNotes />;
};

const ConditionalAttendancePage = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = () => {
      setIsAdmin(isTopManagement());
      setLoading(false);
    };

    checkPermissions();
  }, []);

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

  return isAdmin ? <AdminBranchesReports /> : <AttendancePage />;
};

const MainLayoutWithHeader = ({ children }) => {
  const [user, setUser] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndBranch = async () => {
      try {
        const savedUser = localStorage.getItem('user');

        if (!savedUser) {
          setLoading(false);
          return;
        }

        const userData = JSON.parse(savedUser);
        setUser(userData);

        const branchesResponse = await fetch('https://api1.sstli.com/api/branches/all', {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          }
        });

        if (branchesResponse.ok) {
          const branchesJson = await branchesResponse.json();
          const userBranch = branchesJson.find(
            b => b.guid === userData.branchForWork
          );

          if (userBranch) {
            setBranch(userBranch);
            localStorage.setItem('user_branch', JSON.stringify(userBranch));
          } else {
            setBranch({
              branchName: userData.branchForWork || 'الفرع الرئيسي',
              guid: userData.branchForWork
            });
          }
        } else {
          setBranch({
            branchName: userData.branchForWork || 'الفرع الرئيسي',
            guid: userData.branchForWork
          });
        }
      } catch (error) {
        console.error('Error fetching branch data:', error);

        const savedUser = localStorage.getItem('user');

        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setBranch({
            branchName: userData.branchForWork || 'الفرع الرئيسي',
            guid: userData.branchForWork
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndBranch();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('user_branch');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div style={loadingStyles}>
        <div style={spinnerStyles}></div>
        <p style={loadingTextStyles}>جاري التحميل...</p>
      </div>
    );
  }

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
  const [user, setUser] = useState(null);
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndBranch = async () => {
      try {
        const savedUser = localStorage.getItem('user');

        if (!savedUser) {
          setLoading(false);
          return;
        }

        const userData = JSON.parse(savedUser);
        setUser(userData);

        const branchesResponse = await fetch('https://api1.sstli.com/api/branches/all', {
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          }
        });

        if (branchesResponse.ok) {
          const branchesJson = await branchesResponse.json();
          const userBranch = branchesJson.find(
            b => b.guid === userData.branchForWork
          );

          if (userBranch) {
            setBranch(userBranch);
            localStorage.setItem('user_branch', JSON.stringify(userBranch));
          } else {
            setBranch({
              branchName: userData.branchForWork || 'الفرع الرئيسي',
              guid: userData.branchForWork
            });
          }
        } else {
          setBranch({
            branchName: userData.branchForWork || 'الفرع الرئيسي',
            guid: userData.branchForWork
          });
        }
      } catch (error) {
        console.error('Error fetching branch data:', error);

        const savedUser = localStorage.getItem('user');

        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setBranch({
            branchName: userData.branchForWork || 'الفرع الرئيسي',
            guid: userData.branchForWork
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndBranch();
  }, []);

  if (loading) {
    return (
      <div style={loadingStyles}>
        <div style={spinnerStyles}></div>
        <p style={loadingTextStyles}>جاري التحميل...</p>
      </div>
    );
  }

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
            path="/admin-dashboard"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AdminViewTasks />
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
            path="/admin-view-tasks"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AdminViewTasks />
                </LayoutWithoutHeader>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin-add-task"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <NewTaskForm />
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
            path="/admin-all-tasks"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AllTasksList />
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
            path="/dashboard/assigned-tasks"
            element={
              <PrivateRoute>
                <LayoutWithoutHeader>
                  <AssignedTasks />
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