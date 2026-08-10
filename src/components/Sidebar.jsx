import { Box, List, ListItem, ListItemIcon, ListItemText, Button, Tooltip, Typography, Collapse } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import StorefrontIcon from '@mui/icons-material/Storefront';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import logo from "../images/logo.jpg";
import AssignmentIcon from '@mui/icons-material/Assignment';
import PollIcon from '@mui/icons-material/Poll';
import AddIcon from '@mui/icons-material/Add';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useEffect, useMemo, useState } from 'react';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import BlockIcon from '@mui/icons-material/Block';

import HomeIcon from '@mui/icons-material/Home';
import TaskIcon from '@mui/icons-material/Task';
import PaymentIcon from '@mui/icons-material/Payment';
import MessageIcon from '@mui/icons-material/Message';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReportIcon from '@mui/icons-material/Report';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import HistoryIcon from '@mui/icons-material/History';
import TodayIcon from '@mui/icons-material/Today';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HandshakeIcon from '@mui/icons-material/Handshake';
import StarIcon from '@mui/icons-material/Star';
import CampaignIcon from '@mui/icons-material/Campaign';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PercentIcon from '@mui/icons-material/Percent';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DescriptionIcon from '@mui/icons-material/Description';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
const SIDEBAR_WIDTH = 280;
const user = JSON.parse(localStorage.getItem('user') || '{}');

const primaryColor = '#057546';
const primaryDark = '#034d31';
const primaryLight = '#e6f3ee';
const accentColor = '#ae1e21';
const whiteColor = '#fefefe';
const backgroundColor = '#fefefe';
const textColor = '#1f2d3d';
const mutedTextColor = '#6f8a81';
const softShadow = '0 14px 35px rgba(5,117,70,0.12)';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [permissionsLoading, setPermissionsLoading] =
  useState(true);

const [permissionData, setPermissionData] =
  useState({
    menus: [],
    forms: [],
    sales: {
      canView: false,
      screens: {}
    },
    reports: {
      canView: false,
      screens: {}
    },
    studentAffairs: {
      canView: false,
      screens: {}
    },
    branchManagement: {
      canView: false,
      screens: {}
    }
  });

  useEffect(() => {
  let isMounted = true;

  const loadPermissions = async () => {
    const userGuid =
      String(
        user?.guid ||
        user?.Guid ||
        ""
      ).trim();

    if (!userGuid) {
      if (isMounted) {
        setPermissionData({
          menus: [],
          forms: [],
          sales: {
            canView: false,
            screens: {}
          },
          reports: {
            canView: false,
            screens: {}
          },
          branchManagement: {
            canView: false,
            screens: {}
          }
        });

        setPermissionsLoading(false);
      }

      return;
    }

    try {
      setPermissionsLoading(true);

      const response = await fetch(
        `http://localhost:5258/api/user-permissions/${encodeURIComponent(userGuid)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحميل صلاحيات المستخدم"
        );
      }

      if (isMounted) {
        setPermissionData(
          result?.data || {
            menus: [],
            forms: [],
            sales: {
              canView: false,
              screens: {}
            },
            reports: {
              canView: false,
              screens: {}
            },
            branchManagement: {
              canView: false,
              screens: {}
            }
          }
        );
      }
    } catch (error) {
      console.error(
        "Permission loading error:",
        error
      );

      if (isMounted) {
        /*
         * Fail Closed:
         * عند فشل تحميل الصلاحيات لا نظهر المبيعات.
         */
        setPermissionData({
          menus: [],
          forms: [],
          sales: {
            canView: false,
            screens: {}
          },
          reports: {
            canView: false,
            screens: {}
          },
          branchManagement: {
            canView: false,
            screens: {}
          }
        });
      }
    } finally {
      if (isMounted) {
        setPermissionsLoading(false);
      }
    }
  };

  loadPermissions();

  return () => {
    isMounted = false;
  };
}, []);

const canShowSalesTab =
  !permissionsLoading &&
  permissionData?.sales?.canView === true;

const salesScreens =
  permissionData?.sales?.screens || {};

const canShowReportsTab =
  !permissionsLoading &&
  permissionData?.reports?.canView === true;

const reportScreens =
  permissionData?.reports?.screens || {};

const canShowStudentAffairsTab =
  !permissionsLoading &&
  permissionData?.studentAffairs?.canView === true;

const studentAffairsScreens =
  permissionData?.studentAffairs?.screens || {};

const canShowBranchManagementTab =
  !permissionsLoading &&
  permissionData?.branchManagement?.canView === true;

const branchManagementScreens =
  permissionData?.branchManagement?.screens || {};

  const [surveysOpen, setSurveysOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(
    location.pathname.startsWith("/dashboard/admission-requests") ||
    location.pathname.startsWith("/dashboard/online-registration") ||
    location.pathname.startsWith("/dashboard/offline-registration") ||
    location.pathname.startsWith("/dashboard/other-institute") ||
    location.pathname.startsWith("/dashboard/vip-customers") ||
    location.pathname.startsWith("/dashboard/after-sales-follow") ||
    location.pathname.startsWith("/dashboard/after-sales-report") ||
    location.pathname.startsWith("/dashboard/training-agreements-follow") ||
    location.pathname.startsWith("/dashboard/registration-request-report")
  );
  const [studentFileOpen, setStudentFileOpen] = useState(
    location.pathname === '/dashboard/receptionoffice' ||
    location.pathname === '/dashboard/my-requests' ||
    location.pathname === '/dashboard/batch-seats-counter'
  );

  const [reportsOpen, setReportsOpen] = useState(
    location.pathname.startsWith(
      "/dashboard/marketers-report"
    ) ||
    location.pathname.startsWith(
      "/dashboard/collection-commissions-report"
    ) ||
    location.pathname.startsWith(
      "/dashboard/rewards-list"
    ) ||
    location.pathname.startsWith(
      "/dashboard/batch-statistics"
    ) ||
    location.pathname.startsWith(
      "/dashboard/payment-follow-report"
    ) ||
    location.pathname.startsWith(
      "/dashboard/graduates-follow-report"
    ) ||
    location.pathname.startsWith(
      "/dashboard/discount-requests-report"
    ) ||
    location.pathname.startsWith(
      "/dashboard/deregistration-requests-report"
    ) ||
    location.pathname.startsWith(
      "/dashboard/refund-requests-report"
    ) ||
    location.pathname.startsWith(
      "/dashboard/transfer-requests-report"
    )
  );

  const [branchManagementOpen, setBranchManagementOpen] =
    useState(
      location.pathname.startsWith(
        "/dashboard/cash-payment-order"
      ) ||
      location.pathname.startsWith(
        "/dashboard/cash-receipt-acknowledgment"
      ) ||
      location.pathname.startsWith(
        "/dashboard/branch-daily"
      )
    );

  const [studentAffairsOpen, setStudentAffairsOpen] =
    useState(
      location.pathname.startsWith(
        "/dashboard/new-students"
      ) ||
      location.pathname.startsWith(
        "/dashboard/diploma-students"
      ) ||
      location.pathname.startsWith(
        "/dashboard/course-students"
      )
    );


  const allowedReceptionOfficeGuids = [
  "f426653a-b389-4036-95f0-907920e7f205",
  "35efb423-5491-4775-a5cc-98625fb66fa5",
  "3f69ccb6-e2cf-4d6d-b801-7d727c977d8e",
  "39a98dc1-f13e-4c07-91a1-39653a1bde2c",
  "5d13046c-ccf1-4893-abce-03bf298e05ee",
  "979f71d0-ddc5-48b7-8a47-eb5ca393d34e",
  "1e0c626f-c66b-4ec8-812f-0d53e1887113",
   "4fd23f8d-5f04-4d1c-9201-3e1ae01e6e73",
  "5212a8b8-0bdc-46dc-a1c2-86f295399390"
];

const allowedDesktopDevicesAdminGuids = [
  "f426653a-b389-4036-95f0-907920e7f205",
  "3f69ccb6-e2cf-4d6d-b801-7d727c977d8e",
];

const allowedCircularUploaderGuids = [
  "f426653a-b389-4036-95f0-907920e7f205",
  "1e0c626f-c66b-4ec8-812f-0d53e1887113",
  "3f69ccb6-e2cf-4d6d-b801-7d727c977d8e",
  "35efb423-5491-4775-a5cc-98625fb66fa5",
];

const currentUserGuid = String(
  user?.guid ||
  user?.Guid ||
  ""
).trim().toLowerCase();

/*
 * شاشة متابعة السداد:
 * تظهر فقط لمشرفي الفروع المحددين أدناه
 * بالإضافة إلى المستخدمين الإضافيين المحددين.
 *
 * لا تعتمد الشاشة على صلاحية paymentFollowReport
 * القادمة من الباك إند، لكنها تظل داخل قائمة التقارير،
 * لذلك يلزم أن يكون للمستخدم صلاحية عرض قائمة التقارير.
 */
const allowedPaymentFollowGuids = [
  "3bfd29bc-b727-4456-9117-90b00392d654",
  "ed7fcacb-a5b8-49a1-8f2f-a601e0a9a2ee",
  "4a776c59-a5d6-43ff-963e-bdd63a5b2c5c",
  "515fcc7f-c8c5-4bc4-b1bd-1d664e3e72b0",
  "f81ec6b9-e1a7-4e43-baf4-6651dd80d9c1",
  "f09b8d0f-9625-43aa-8f16-4c38d9023453",
  "c05bc1b6-c0ad-4b8c-80c1-9f21ab676a7d",
  "98962d07-1bfc-4bf0-953a-87388da7426a",
  "b7f71c74-bcd6-42ff-8e13-4e2b6b26ce0e",
  "311f4e09-7045-4a61-ae74-efed22fc90eb",
  "5ec48dc1-d2a0-476c-9733-86110eec0026",
  "0e1d8c32-f20b-4c7a-b36f-1bc533537afc",
  "66026998-18eb-4f7d-9a47-85e07c5f7781",
  "bb5ac3bd-7898-48bf-865b-7bf3dcf55830",
  "fc1b86fd-0297-436a-9d72-76e4bbb81868",
  "e3116c64-48bd-407f-8d5f-35909b3fb410",
  "65a0d8d1-2d90-4ce8-a0d4-60ec011b32e7",

  // المستخدمون الإضافيون
  "1e0c626f-c66b-4ec8-812f-0d53e1887113",
  "f426653a-b389-4036-95f0-907920e7f205",
  "3f69ccb6-e2cf-4d6d-b801-7d727c977d8e",
  "35efb423-5491-4775-a5cc-98625fb66fa5"
];

const canShowPaymentFollowForUser =
  allowedPaymentFollowGuids.includes(
    currentUserGuid
  );

/*
 * متابعة الخريجين تستخدم نفس قائمة مستخدمي متابعة السداد.
 * وتظل داخل قائمة التقارير؛ لذلك لا تظهر التابة أصلًا
 * إلا إذا كانت صلاحية قائمة التقارير متاحة للمستخدم.
 */
const canShowGraduatesFollowForUser =
  allowedPaymentFollowGuids.includes(
    currentUserGuid
  );

/*
 * طلبات الخصم:
 * تظهر فقط للمستخدمين المحددين أدناه،
 * مع ضرورة وجود صلاحية قائمة التقارير.
 */
const allowedDiscountRequestsGuids = [
  "f426653a-b389-4036-95f0-907920e7f205",
  "35efb423-5491-4775-a5cc-98625fb66fa5",
  "3f69ccb6-e2cf-4d6d-b801-7d727c977d8e",
  "1e0c626f-c66b-4ec8-812f-0d53e1887113"
];

const canShowDiscountRequestsForUser =
  allowedDiscountRequestsGuids.includes(
    currentUserGuid
  );

/*
 * طلبات طي القيد تستخدم نفس مستخدمي طلبات الخصم.
 */
const canShowDeregistrationRequestsForUser =
  allowedDiscountRequestsGuids.includes(
    currentUserGuid
  );

/*
 * طلبات الاسترداد تستخدم نفس مستخدمي طلبات الخصم وطلبات طي القيد.
 */
const canShowRefundRequestsForUser =
  allowedDiscountRequestsGuids.includes(
    currentUserGuid
  );

/*
 * طلبات النقل / التحويل تستخدم نفس مستخدمي طلبات الاسترداد.
 */
const canShowTransferRequestsForUser =
  allowedDiscountRequestsGuids.includes(
    currentUserGuid
  );

/*
 * شاشات مبيعات خاصة:
 * - تقرير طلب التسجيل
 * - عملاء VIP
 * - المسجلين في معاهد أخرى
 *
 * تظهر فقط للمستخدمين الموجودين في هذه القائمة،
 * بغض النظر عن قيمة الشاشة القادمة من الباك إند.
 */
const restrictedSalesScreensAllowedGuids = [
  "f426653a-b389-4036-95f0-907920e7f205",
  "1e0c626f-c66b-4ec8-812f-0d53e1887113",
  "35efb423-5491-4775-a5cc-98625fb66fa5",
  "fd11b515-8054-4d0b-83bb-471f3c57b9e7",
  "3f69ccb6-e2cf-4d6d-b801-7d727c977d8e"
];

const canShowRestrictedSalesScreens =
  restrictedSalesScreensAllowedGuids.includes(
    currentUserGuid
  );

const restrictedSalesPermissions = [
  "otherInstituteRegistrations",
  "vipCustomers",
  "registrationRequestReport"
];

const canUploadCirculars = allowedCircularUploaderGuids.includes(currentUserGuid);

const canShowDesktopDevicesAdmin = allowedDesktopDevicesAdminGuids.includes(
  String(user?.guid || user?.Guid || "").toLowerCase()
);

const canShowReceptionOffice = allowedReceptionOfficeGuids.includes(
  String(user?.guid || user?.Guid || "").toLowerCase()
);


  const handleSurveysToggle = () => {
    setSurveysOpen(!surveysOpen);
  };

  const handleSalesToggle = () => {
    setSalesOpen(!salesOpen);
  };

  const handleReportsToggle = () => {
    setReportsOpen((current) => !current);
  };

  const handleBranchManagementToggle = () => {
    setBranchManagementOpen(
      (current) => !current
    );
  };

  const handleStudentFileToggle = () => {
    setStudentFileOpen((current) => !current);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menu = [
    { text: 'الرئيسية', icon: <HomeIcon />, path: '/dashboard' },

    { text: 'المهام', icon: <TaskIcon />, path: '/dashboard/assigned-tasks' },

    {
      text: 'السداد والتحصيل',
      icon: <PaymentIcon />,
      path: '/dashboard/payments',
      isNew: true
    },

    { text: 'المحادثات', icon: <MessageIcon />, path: '/chats' },

    { text: 'عمولات التسجيل', icon: <AccountBalanceIcon />, path: '/dashboard/registration-commissions' },

    ...(((user?.userName === "هشام يس") || [0, 1, 2, 3].includes(Number(user?.userJop)))
      ? [{ text: 'التقارير اليومية', icon: <ReportIcon />, path: '/dashboard/reportsfrobranches' }]
      : []),



    { text: 'الشكاوي', icon: <SupportAgentIcon />, path: '/dashboard/complaints' },

    {
  text: 'التعميمات',
  icon: <LibraryBooksIcon />,
  path: '/dashboard/circulars',
  isNew: true,
  badgeText: 'جديد'
},

...(canUploadCirculars
  ? [{
      text: 'رفع التعميمات',
      icon: <CampaignIcon />,
      path: '/dashboard/circulars-upload',
      isNew: true,
      customBadge: "خاص"
    }]
  : []),

    ...([17].includes(user?.userJop) || user?.userName === 'emadn'
      ? [{ text: 'خـدمـة العـــملاء', icon: <SupportAgentIcon />, path: '/dashboard/cleints' }]
      : []),

    ...((user?.userName === "محمد عادل")
      ? [{
          text: 'رفع تحديث',
          icon: <SystemUpdateAltIcon />,
          path: '/dashboard/upload-update',
          isNew: true,
          customBadge: "خاص"
        }]
      : []),

    ...([0, 1, 2, 3, 5].includes(user?.userJop)
      ? [{ text: 'تقرير خدمة العملاء', icon: <AnalyticsIcon />, path: '/dashboard/report' }]
      : []),

    { text: 'حضور الطلاب', icon: <GroupsIcon />, path: '/attendance' },

    {
      text: 'الاختبارات',
      icon: <SchoolIcon />,
      path: '/dashboard/tests',
      isNew: true
    },

    {
      text: 'الدعم الفني',
      icon: <ContactSupportIcon />,
      path: '/dashboard/technical-support',
      isNew: true
    },

    {
      text: 'الإنتاجية الأسبوعية',
      icon: <EmojiEventsIcon />,
      path: '/dashboard/achievements',
      isNew: true,
      badgeText: 'جديد'
    },

    ...([0, 1, 2, 3, 9].includes(Number(user?.userJop))
      ? [{
          text: 'ملاحظات المتدربين',
          icon: <AssignmentIcon />,
          path: '/dashboard/student-notes',
          isNew: true
        }]
      : []),

    ...((user?.departGuid === "675dad50-232f-407d-91a6-4f42dd145584")
      ? [{
          text: 'تقييم الموظفين',
          icon: <RateReviewIcon />,
          path: '/dashboard/employee-evaluation',
          isNew: true,
          customBadge: "خاص"
        }]
      : []),

    ...(((user?.userName === "محمد عادل") || [0, 1, 2, 3].includes(Number(user?.userJop)))
      ? [{
          text: 'P2P',
          icon: <HandshakeIcon />,
          path: '/dashboard/p2p-marketing',
          isNew: true,
          customBadge: "خاص"
        }]
      : []),

      ...(canShowDesktopDevicesAdmin
  ? [{
      text: 'إدارة أجهزة الديسكتوب',
      icon: <AdminPanelSettingsIcon />,
      path: '/dashboard/desktop-devices',
      isNew: true,
      customBadge: "خاص"
    }]
  : []),

    ...([9, 18].includes(user?.userJop)
      ? [{ text: 'الاستفسارات', icon: <LiveHelpIcon />, path: '/dashboard/inquiries' }]
      : []),

    ...([9].includes(user?.userJop) || user?.userName === "هشام يس"
      ? [{
          text: 'نماذج الاختبارات',
          icon: <FormatListBulletedIcon />,
          path: '/exploer',
          isNew: true,
          customBadge: "خاص"
        }]
      : []),

    ...([9].includes(user?.userJop)
      ? [{ text: 'المتابعة اليومية', icon: <TodayIcon />, path: '/dashboard/dailyreport' }]
      : []),

    ...([9].includes(user?.userJop)
      ? [{ text: 'التقارير السابقة', icon: <HistoryIcon />, path: '/dashboard/pastreports' }]
      : []),

    ...([9].includes(user?.userJop)
      ? [{ text: 'قوائم الاستثناءات', icon: <BlockIcon />, path: '/dashboard/exceptions' }]
      : []),

    ...([9, 0, 1, 2].includes(Number(user?.userJop))
      ? [{
          text: 'رفع الدرجات',
          icon: <UploadFileIcon />,
          path: '/dashboard/upload-grades',
          isNew: true
        }]
      : []),

    ...((([0, 1, 2, 3].includes(user?.userJop)) || (user?.userName === "emadn") || (user?.userName === "محمد عادل"))
      ? [{ text: 'قوائم الاستثناءات', icon: <BlockIcon />, path: '/dashboard/exceptionsadmin' }]
      : []),
  ];

  const surveysMenu = [
    ...(
      ([0, 1, 2, 3, 9, 14].includes(Number(user?.userJop)) ||
        user?.userName === "رنا الاحمري" ||
        user?.userName === "بشري الزهراني")
        ? [{
            text: 'إنشاء استبيان | اختبار',
            icon: <AddIcon />,
            path: '/dashboard/create-survey',
            isNew: true
          }]
        : []
    ),

    {
      text: 'الاستبيانات',
      icon: <PollIcon />,
      path: '/dashboard/surveys',
    },
  ].filter(Boolean);

const salesMenu = useMemo(() => {
  const items = [
    {
      permission: "onlineRegistration",
      text: "طلبات دراسة عن بعد",
      icon: <HowToRegIcon />,
      path: "/dashboard/online-registration-requests",
      isNew: true,
    },

    {
      permission: "offlineRegistration",
      text: "طلبات الدراسة الحضوري",
      icon: <SchoolIcon />,
      path: "/dashboard/offline-registration-requests",
      isNew: true,
    },

    {
      permission: "otherInstituteRegistrations",
      text: "المسجلين في معاهد أخرى",
      icon: <SchoolIcon />,
      path: "/dashboard/other-institute-registrations",
      isNew: true,
    },

    {
      permission: "contractFollow",
      text: "متابعة اتفاقيات التدريب",
      icon: <HandshakeIcon />,
      path: "/dashboard/training-agreements-follow",
      isNew: true,
    },

    {
      permission: "afterSalesFollow",
      text: "متابعة ما بعد البيع",
      icon: <SupportAgentIcon />,
      path: "/dashboard/after-sales-follow",
      isNew: true,
    },

    {
      permission: "afterSalesReport",
      text: "تقرير متابعة العملاء",
      icon: <AnalyticsIcon />,
      path: "/dashboard/after-sales-report",
      isNew: true,
    },

    {
      permission: "admissionRequests",
      text: "طلبات الالتحاق",
      icon: <HowToRegIcon />,
      path: "/dashboard/admission-requests",
      isNew: true,
    },

    {
      permission: "admissionRequestsReport",
      text: "تقرير طلبات الالتحاق",
      icon: <ReportIcon />,
      path: "/dashboard/admission-requests-report",
      isNew: true,
    },

    {
      permission: "vipCustomers",
      text: "عملاء VIP",
      icon: <StarIcon />,
      path: "/dashboard/vip-customers",
      isNew: true,
    },

    {
      permission: "registrationRequestReport",
      text: "تقرير طلب التسجيل",
      icon: <AssignmentIcon />,
      path: "/dashboard/registration-request-report",
      isNew: true,
    }
  ];

  return items.filter((item) => {
    /*
     * أولًا: الشاشة لازم تكون متاحة أصلًا
     * حسب الصلاحية القادمة من API.
     */
    const allowedByPermission =
      salesScreens[item.permission] === true;

    if (!allowedByPermission) {
      return false;
    }

    /*
     * ثانيًا: الشاشات الثلاث الخاصة
     * لا تظهر إلا للـ GUIDs المحددة في الفرونت إند.
     */
    if (
      restrictedSalesPermissions.includes(
        item.permission
      )
    ) {
      return canShowRestrictedSalesScreens;
    }

    /*
     * باقي شاشات المبيعات تظل تعمل
     * حسب صلاحيات الباك إند فقط.
     */
    return true;
  });
}, [
  salesScreens,
  canShowRestrictedSalesScreens
]);


const handleStudentAffairsToggle = () => {
  setStudentAffairsOpen((value) => !value);
};

const studentAffairsMenu = [
  studentAffairsScreens?.newStudents
    ? {
        text: 'قائمة الطلاب الجدد',
        icon: <PersonAddAlt1Icon />,
        path: '/dashboard/new-students',
        isNew: true,
      }
    : null,

  studentAffairsScreens?.diplomaStudents
    ? {
        text: 'قائمة طلاب الدبلومات',
        icon: <SchoolIcon />,
        path: '/dashboard/diploma-students',
        isNew: true,
      }
    : null,

  studentAffairsScreens?.courseStudents
    ? {
        text: 'قائمة طلاب الدورات',
        icon: <MenuBookIcon />,
        path: '/dashboard/course-students',
        isNew: true,
      }
    : null
].filter(Boolean);

const branchManagementMenu = useMemo(() => {
  const items = [
    {
      permission: "cashPaymentOrder",
      text: "أمر صرف نقدية",
      icon: <LocalAtmIcon />,
      path: "/dashboard/cash-payment-order",
      isNew: true,
    },
    {
      permission: "cashReceiptAcknowledgment",
      text: "إقرار استلام نقدية",
      icon: <ReceiptLongIcon />,
      path: "/dashboard/cash-receipt-acknowledgment",
      isNew: true,
    },
    {
      permission: "branchDaily",
      text: "يومية الفرع",
      icon: <MenuBookIcon />,
      path: "/dashboard/branch-daily",
      isNew: true,
    }
  ];

  return items.filter(
    (item) =>
      branchManagementScreens[
        item.permission
      ] === true
  );
}, [branchManagementScreens]);


const reportsMenu = useMemo(() => {
  const items = [
    {
      permission: "marketersReport",
      text: "تقرير المسوقين",
      icon: <CampaignOutlinedIcon />,
      path: "/dashboard/marketers-report",
      isNew: true
    },
    {
      permission: "collectionCommissionsReport",
      text: "تقرير عمولات التحصيل",
      icon: <PaidIcon />,
      path: "/dashboard/collection-commissions-report",
      isNew: true
    },
    {
      permission: "rewardsList",
      text: "قائمة المكافآت",
      icon: <EmojiEventsOutlinedIcon />,
      path: "/dashboard/rewards-list",
      isNew: true
    },
    {
      permission: "batchStatistics",
      text: "إحصائيات الدفعات",
      icon: <QueryStatsIcon />,
      path: "/dashboard/batch-statistics",
      isNew: true
    },
    {
      permission: "paymentFollowReport",
      text: "متابعة السداد",
      icon: <PaymentsOutlinedIcon />,
      path: "/dashboard/payment-follow-report",
      isNew: true
    },
    {
      permission: "graduatesFollowReport",
      text: "متابعة الخريجين",
      icon: <WorkspacePremiumIcon />,
      path: "/dashboard/graduates-follow-report",
      isNew: true
    },
    {
      permission: "discountRequestsReport",
      text: "طلبات الخصم",
      icon: <PercentIcon />,
      path: "/dashboard/discount-requests-report",
      isNew: true
    },
    {
      permission: "deregistrationRequestsReport",
      text: "طلبات طي القيد",
      icon: <PlaylistRemoveIcon />,
      path: "/dashboard/deregistration-requests-report",
      isNew: true
    },
    {
      permission: "refundRequestsReport",
      text: "طلبات الاسترداد",
      icon: <CurrencyExchangeIcon />,
      path: "/dashboard/refund-requests-report",
      isNew: true
    },
    {
      permission: "transferRequestsReport",
      text: "طلبات النقل / التحويل",
      icon: <SwapHorizIcon />,
      path: "/dashboard/transfer-requests-report",
      isNew: true
    }
  ];

  return items.filter((item) => {
    /*
     * متابعة السداد لا تعتمد على صلاحية الشاشة
     * القادمة من الباك إند، وتظهر فقط للقائمة المحددة.
     */
    if (
      item.permission ===
      "paymentFollowReport"
    ) {
      return canShowPaymentFollowForUser;
    }

    if (
      item.permission ===
      "graduatesFollowReport"
    ) {
      return canShowGraduatesFollowForUser;
    }

    if (
      item.permission ===
      "discountRequestsReport"
    ) {
      return canShowDiscountRequestsForUser;
    }

    if (
      item.permission ===
      "deregistrationRequestsReport"
    ) {
      return canShowDeregistrationRequestsForUser;
    }

    if (
      item.permission ===
      "refundRequestsReport"
    ) {
      return canShowRefundRequestsForUser;
    }

    if (
      item.permission ===
      "transferRequestsReport"
    ) {
      return canShowTransferRequestsForUser;
    }

    /*
     * باقي شاشات التقارير تظل مرتبطة
     * بصلاحيات الباك إند كالمعتاد.
     */
    return (
      reportScreens[
        item.permission
      ] === true
    );
  });
}, [
  reportScreens,
  canShowPaymentFollowForUser,
  canShowGraduatesFollowForUser,
  canShowDiscountRequestsForUser,
  canShowDeregistrationRequestsForUser,
  canShowRefundRequestsForUser,
  canShowTransferRequestsForUser
]);

const studentFileMenu = [
  {
    text: 'مكتب الاستقبال',
    icon: <HomeIcon />,
    path: '/dashboard/receptionoffice'
  },
  {
    text: 'قائمة طلباتي',
    icon: <AssignmentIcon />,
    path: '/dashboard/my-requests',
    isNew: true
  },
  {
    text: 'عداد الدفعات',
    icon: <DashboardCustomizeIcon />,
    path: '/dashboard/batch-seats-counter',
    isNew: true
  },
  {
    text: 'نماذج الجودة',
    icon: <DescriptionIcon />,
    path: '/dashboard/quality-forms',
    isNew: true,
  }
];

  const [generalGroupsOpen, setGeneralGroupsOpen] = useState(() => ({
    daily: [
      '/dashboard',
      '/dashboard/assigned-tasks',
      '/dashboard/payments',
      '/chats'
    ].includes(location.pathname),
    students: [
      '/dashboard/registration-commissions',
      '/attendance',
      '/dashboard/student-notes',
      '/dashboard/inquiries'
    ].includes(location.pathname),
    communication: [
      '/dashboard/complaints',
      '/dashboard/circulars',
      '/dashboard/cleints'
    ].includes(location.pathname),
    performance:
      location.pathname.startsWith('/dashboard/tests') ||
      location.pathname.startsWith('/dashboard/achievements') ||
      location.pathname.startsWith('/exploer') ||
      location.pathname.startsWith('/dashboard/dailyreport') ||
      location.pathname.startsWith('/dashboard/pastreports') ||
      location.pathname.startsWith('/dashboard/upload-grades'),
    administration: false
  }));

  const toggleGeneralGroup = (groupKey) => {
    setGeneralGroupsOpen((current) => ({
      ...current,
      [groupKey]: !current[groupKey]
    }));
  };

  const supportItem = menu.find(
    (item) => item.path === '/dashboard/technical-support'
  );

  const mainMenuWithoutSupport = menu.filter(
    (item) => item.path !== '/dashboard/technical-support'
  );

  const pickMainItems = (texts) =>
    mainMenuWithoutSupport.filter((item) => texts.includes(item.text));

  const dailyItems = pickMainItems([
    'الرئيسية',
    'المهام',
    'السداد والتحصيل',
    'المحادثات'
  ]);

  const studentItems = pickMainItems([
    'عمولات التسجيل',
    'حضور الطلاب',
    'ملاحظات المتدربين',
    'الاستفسارات'
  ]);

  const communicationItems = pickMainItems([
    'الشكاوي',
    'التعميمات',
    'خـدمـة العـــملاء'
  ]);

  const performanceItems = pickMainItems([
    'الاختبارات',
    'الإنتاجية الأسبوعية',
    'نماذج الاختبارات',
    'المتابعة اليومية',
    'التقارير السابقة',
    'رفع الدرجات'
  ]);

  const groupedPaths = new Set([
    ...dailyItems,
    ...studentItems,
    ...communicationItems,
    ...performanceItems
  ].map((item) => item.path));

  const administrationItems = mainMenuWithoutSupport.filter(
    (item) => !groupedPaths.has(item.path)
  );

  const childItemSx = (selected) => ({
    mb: 0.35,
    mx: { xs: 0.5, md: 1 },
    ml: 3,
    minHeight: 42,
    px: 1,
    py: 0.55,
    borderRadius: 2.5,
    color: selected ? whiteColor : textColor,
    background: selected
      ? `linear-gradient(135deg, ${accentColor} 0%, #7f1518 100%)`
      : '#ffffff',
    border: selected
      ? '1px solid transparent'
      : '1px solid rgba(5,117,70,0.09)',
    boxShadow: selected
      ? '0 7px 16px rgba(174,30,33,0.20)'
      : '0 2px 8px rgba(31,45,61,0.035)',
    position: 'relative',
    overflow: 'hidden',
    '&:before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 8,
      bottom: 8,
      width: 3,
      borderRadius: '0 999px 999px 0',
      background: selected ? whiteColor : primaryColor
    },
    '&.Mui-selected': {
      color: whiteColor,
      background: `linear-gradient(135deg, ${accentColor} 0%, #7f1518 100%)`
    },
    '&:hover': {
      color: selected ? whiteColor : primaryDark,
      background: selected
        ? `linear-gradient(135deg, ${accentColor} 0%, #7f1518 100%)`
        : primaryLight,
      transform: 'translateX(-4px)'
    },
    transition: 'all 0.2s ease'
  });

  const renderChildItem = (item) => {
    const selected = location.pathname === item.path;

    return (
      <Tooltip
        key={item.path || item.text}
        title={item.text}
        placement="left"
        arrow
      >
        <ListItem
          button
          component={Link}
          to={item.path}
          selected={selected}
          sx={childItemSx(selected)}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <ListItemText
              primary={item.text}
              secondary={item.description}
              sx={{
                m: 0,
                minWidth: 0,
                '& .MuiListItemText-primary': {
                  fontFamily: 'Cairo',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  textAlign: 'left',
                  marginRight: '8px',
                  lineHeight: 1.45
                },
                '& .MuiListItemText-secondary': {
                  fontFamily: 'Cairo',
                  fontSize: '0.66rem',
                  textAlign: 'left',
                  marginRight: '8px',
                  color: selected
                    ? 'rgba(255,255,255,.78)'
                    : mutedTextColor
                }
              }}
            />

            <ListItemIcon
              sx={{
                minWidth: 26,
                color: selected ? whiteColor : primaryColor,
                '& svg': { fontSize: '1.08rem' }
              }}
            >
              {item.icon}
            </ListItemIcon>
          </Box>
        </ListItem>
      </Tooltip>
    );
  };

  const renderGroup = ({
    title,
    icon,
    items,
    open,
    onToggle,
    visible = true,
    showWhenEmpty = false
  }) => {
    if (!visible || !items || (!showWhenEmpty && items.length === 0)) {
      return null;
    }

    const active = items.some(
      (item) => location.pathname === item.path
    );

    return (
      <Box sx={{ mb: 0.5 }}>
        <ListItem
          button
          onClick={onToggle}
          sx={{
            mb: 0.45,
            mx: { xs: 0.5, md: 1 },
            minHeight: 48,
            px: 1.15,
            py: 0.75,
            borderRadius: 3,
            color: open || active ? whiteColor : textColor,
            background: open || active
              ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`
              : 'linear-gradient(135deg, #f7fcf9 0%, #ffffff 100%)',
            border: open || active
              ? '1px solid transparent'
              : '1px solid rgba(5,117,70,0.13)',
            boxShadow: open || active
              ? '0 8px 18px rgba(5,117,70,0.24)'
              : '0 3px 10px rgba(5,117,70,0.06)',
            '&:hover': {
              color: whiteColor,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              transform: 'translateX(-4px)'
            },
            transition: 'all 0.22s ease'
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <ListItemText
              primary={title}
              sx={{
                m: 0,
                '.MuiTypography-root': {
                  fontFamily: 'Cairo',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  marginRight: '8px'
                }
              }}
            />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.6
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 26,
                  color: 'inherit',
                  '& svg': { fontSize: '1.18rem' }
                }}
              >
                {icon}
              </ListItemIcon>

              {open ? (
                <ExpandLess sx={{ fontSize: '1.05rem' }} />
              ) : (
                <ExpandMore sx={{ fontSize: '1.05rem' }} />
              )}
            </Box>
          </Box>
        </ListItem>

        <Collapse in={open} timeout={260} unmountOnExit>
          <List component="div" disablePadding>
            {items.length > 0 ? (
              items.map(renderChildItem)
            ) : (
              <Box
                sx={{
                  mx: 1,
                  ml: 3,
                  px: 1.2,
                  py: 1.25,
                  borderRadius: 2.5,
                  textAlign: 'center',
                  fontFamily: 'Cairo',
                  fontSize: '0.76rem',
                  color: mutedTextColor,
                  background: '#ffffff',
                  border: '1px solid rgba(5,117,70,0.09)'
                }}
              >
                لا توجد شاشات متاحة حسب الصلاحيات
              </Box>
            )}
          </List>
        </Collapse>
      </Box>
    );
  };

  const renderSupportItem = () => {
    if (!supportItem) {
      return null;
    }

    const selected = location.pathname === supportItem.path;

    return (
      <Tooltip title={supportItem.text} placement="left" arrow>
        <ListItem
          button
          component={Link}
          to={supportItem.path}
          selected={selected}
          sx={{
            mb: 0.6,
            mx: { xs: 0.5, md: 1 },
            minHeight: 48,
            px: 1.15,
            py: 0.75,
            borderRadius: 3,
            color: selected ? whiteColor : textColor,
            background: selected
              ? 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)'
              : 'linear-gradient(135deg, #f5fbff 0%, #ffffff 100%)',
            border: selected
              ? '1px solid transparent'
              : '1px solid rgba(25,118,210,0.18)',
            boxShadow: selected
              ? '0 8px 18px rgba(25,118,210,0.24)'
              : '0 3px 10px rgba(25,118,210,0.07)',
            '&.Mui-selected': {
              color: whiteColor,
              background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)'
            },
            '&:hover': {
              color: whiteColor,
              background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
              transform: 'translateX(-4px)'
            },
            transition: 'all 0.22s ease'
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <ListItemText
              primary={supportItem.text}
              sx={{
                m: 0,
                '.MuiTypography-root': {
                  fontFamily: 'Cairo',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  marginRight: '8px'
                }
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
              <Box
                sx={{
                  px: 0.8,
                  height: 20,
                  borderRadius: 999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Cairo',
                  fontSize: '0.58rem',
                  fontWeight: 900,
                  color: selected ? '#1976d2' : whiteColor,
                  background: selected
                    ? whiteColor
                    : 'linear-gradient(135deg, #2196f3, #0d6fc2)',
                  boxShadow: '0 3px 8px rgba(33,150,243,0.24)'
                }}
              >
                دعم
              </Box>

              <ListItemIcon
                sx={{
                  minWidth: 26,
                  color: selected ? whiteColor : '#1976d2',
                  '& svg': { fontSize: '1.18rem' }
                }}
              >
                {supportItem.icon}
              </ListItemIcon>
            </Box>
          </Box>
        </ListItem>
      </Tooltip>
    );
  };

  return (
    <Box
      sx={{
        width: { xs: '100%', md: SIDEBAR_WIDTH },
        height: { xs: 'auto', md: '100vh' },
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        maxWidth: '100%',
        minWidth: 0,
        flexShrink: 0,
        '&, & *': {
          boxSizing: 'border-box'
        },
        '& .MuiList-root': {
          maxWidth: '100%',
          overflowX: 'hidden'
        },
        '& .MuiListItem-root': {
          width: 'auto',
          minWidth: 0,
          maxWidth: '100%'
        },
        background: `linear-gradient(180deg, ${whiteColor} 0%, #f4fbf7 100%)`,
        color: textColor,
        borderRight: { xs: 'none', md: `1px solid ${primaryLight}` },
        fontFamily: 'Cairo, Arial, "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif',
        position: { xs: 'relative', md: 'fixed' },
        left: 0,
        top: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        boxShadow: {
          xs: '0 8px 24px rgba(5,117,70,0.08)',
          md: '8px 0 28px rgba(5,117,70,0.10)'
        },
        transition: 'all 0.3s ease'
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            py: 3,
            width: '100%',
            overflow: 'hidden',
            background: `linear-gradient(145deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
            color: whiteColor,
            textAlign: 'center',
            position: 'relative',
            boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.10)'
          }}
        >
          <Box
            sx={{
              width: '116px',
              height: '116px',
              borderRadius: '28px',
              overflow: 'hidden',
              border: `3px solid ${whiteColor}`,
              background: whiteColor,
              boxShadow: softShadow,
              mb: 1.5
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="شعار النظام"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>

          <Typography
            sx={{
              fontFamily: 'Cairo',
              fontWeight: 900,
              fontSize: '1.05rem',
              lineHeight: 1.5
            }}
          >
            نظام الإدارة
          </Typography>

          <Typography
            sx={{
              fontFamily: 'Cairo',
              fontWeight: 500,
              fontSize: '0.78rem',
              opacity: 0.95
            }}
          >
            المستخدم
          </Typography>
        </Box>

        <List
          sx={{
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            py: 1.2,
            px: 0,
            overflowX: 'hidden'
          }}
        >
          {renderGroup({
            title: 'العمل اليومي',
            icon: <TodayIcon />,
            items: dailyItems,
            open: generalGroupsOpen.daily,
            onToggle: () => toggleGeneralGroup('daily')
          })}

          {renderGroup({
            title: 'ملف',
            icon: <FolderSharedIcon />,
            items: studentFileMenu,
            open: studentFileOpen,
            onToggle: handleStudentFileToggle
          })}

          {renderGroup({
            title: 'التسجيل والمتدربون',
            icon: <GroupsIcon />,
            items: studentItems,
            open: generalGroupsOpen.students,
            onToggle: () => toggleGeneralGroup('students')
          })}

          {renderGroup({
            title: 'المبيعات',
            icon: <StorefrontIcon />,
            items: salesMenu,
            open: salesOpen,
            onToggle: handleSalesToggle,
            visible: canShowSalesTab,
            showWhenEmpty: true
          })}

          {renderGroup({
            title: 'شئون الطلاب',
            icon: <SchoolIcon />,
            items: studentAffairsMenu,
            open: studentAffairsOpen,
            onToggle: handleStudentAffairsToggle,
            visible: canShowStudentAffairsTab,
            showWhenEmpty: true
          })}

          {renderGroup({
            title: 'إدارة الفرع',
            icon: <BusinessCenterIcon />,
            items: branchManagementMenu,
            open: branchManagementOpen,
            onToggle: handleBranchManagementToggle,
            visible: canShowBranchManagementTab
          })}

          {renderGroup({
            title: 'التقارير',
            icon: <AssessmentIcon />,
            items: reportsMenu,
            open: reportsOpen,
            onToggle: handleReportsToggle,
            visible: canShowReportsTab
          })}

          {renderGroup({
            title: 'التواصل والخدمات',
            icon: <MessageIcon />,
            items: communicationItems,
            open: generalGroupsOpen.communication,
            onToggle: () => toggleGeneralGroup('communication')
          })}

          {renderGroup({
            title: 'الاختبارات والاستبيانات',
            icon: <PollIcon />,
            items: surveysMenu,
            open: surveysOpen,
            onToggle: handleSurveysToggle
          })}

          {renderGroup({
            title: 'الأداء والمتابعة',
            icon: <EmojiEventsIcon />,
            items: performanceItems,
            open: generalGroupsOpen.performance,
            onToggle: () => toggleGeneralGroup('performance')
          })}

          {renderGroup({
            title: 'الإدارة والأدوات',
            icon: <AdminPanelSettingsIcon />,
            items: administrationItems,
            open: generalGroupsOpen.administration,
            onToggle: () => toggleGeneralGroup('administration')
          })}

          {renderSupportItem()}
        </List>
      </Box>

      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          p: 2,
          overflowX: 'hidden',
          borderTop: `1px solid ${primaryLight}`
        }}
      >
        <Button
          fullWidth
          variant="contained"
          startIcon={<ExitToAppIcon />}
          onClick={handleLogout}
          sx={{
            borderRadius: 3,
            fontWeight: 'bold',
            py: 1.2,
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
            color: whiteColor,
            boxShadow: '0 4px 10px rgba(5,117,70,0.24)',
            '&:hover': {
              background: `linear-gradient(135deg, ${primaryDark} 0%, #5a8875 100%)`,
              boxShadow: '0 6px 15px rgba(5,117,70,0.30)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          تسجيل الخروج
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;