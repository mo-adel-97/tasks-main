import { SIDEBAR_ICON_COMPONENTS, SIDEBAR_ICON_LIST, SIDEBAR_ICON_LABELS, SIDEBAR_ICON_OPTIONS } from './sidebarIcons';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";

// Standard menu metadata remains authoritative on the server.
// مكتبة الأيقونات الكاملة في sidebarIcons.jsx (الأسماء القديمة ثابتة جوّاها).
export { SIDEBAR_ICON_COMPONENTS, SIDEBAR_ICON_LIST, SIDEBAR_ICON_LABELS };
export const normalizeSidebarKey = value => String(value || '').trim().toLowerCase();
export const resolveSidebarIcon = (iconKey, fallback = null) => {
  const IconComponent = SIDEBAR_ICON_COMPONENTS[normalizeSidebarKey(iconKey)];
  if (IconComponent) {
    return <IconComponent />;
  }
  return fallback || <DashboardCustomizeIcon />;
};

// Preserve the legacy administrator menu and its exact visibility condition.
export const getAdminNavigation = currentUser => {
  const base = [{
    label: "الدخل",
    to: "/admin-income",
    icon: <MonetizationOnRoundedIcon />
  }, {
    label: "الرئيسية",
    to: "/admin-dashboard",
    icon: <DashboardRoundedIcon />
  }, {
    label: "السير الذاتية",
    to: "/dashboard/employee-cvs",
    icon: <AssignmentIndRoundedIcon />
  }, {
    label: "عرض الإحصائيات",
    to: "/admin-stats",
    icon: <BarChartRoundedIcon />
  }, {
    label: "إضافة مهمة جديدة",
    to: "/admin-add-task",
    icon: <AddTaskRoundedIcon />
  }, {
    label: "عرض المهام",
    to: "/admin-view-tasks",
    icon: <FormatListBulletedRoundedIcon />
  }];
  if (currentUser?.userName === "sa") {
    base.push({
      label: "إدارة المهام",
      to: "/admin-all-tasks",
      icon: <AdminPanelSettingsRoundedIcon />,
      admin: true
    });
  }
  return base;
};

// Preserve the editor option order; freeSolo still accepts custom keys.
export { SIDEBAR_ICON_OPTIONS };
export const HEADER_NAVIGATION = [
  {
    "to": "/dashboard/create-exam",
    "label": "إضافة اختبار"
  },
  {
    "to": "/dashboard/tests",
    "label": "طباعة أوراق الاختبار"
  }
];
