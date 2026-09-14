import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import StorefrontIcon from '@mui/icons-material/Storefront';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PollIcon from '@mui/icons-material/Poll';
import AddIcon from '@mui/icons-material/Add';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import BlockIcon from '@mui/icons-material/Block';
import HomeIcon from '@mui/icons-material/Home';
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
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import LockResetIcon from '@mui/icons-material/LockReset';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import TuneIcon from '@mui/icons-material/Tune';
import SecurityIcon from '@mui/icons-material/Security';
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";

// Standard menu metadata remains authoritative on the server.
const SIDEBAR_ICON_COMPONENTS = {
  home: HomeIcon,
  payment: PaymentIcon,
  message: MessageIcon,
  accountbalance: AccountBalanceIcon,
  report: ReportIcon,
  support: SupportAgentIcon,
  analytics: AnalyticsIcon,
  groups: GroupsIcon,
  school: SchoolIcon,
  livehelp: LiveHelpIcon,
  list: FormatListBulletedIcon,
  history: HistoryIcon,
  today: TodayIcon,
  contactsupport: ContactSupportIcon,
  emojievents: EmojiEventsIcon,
  handshake: HandshakeIcon,
  star: StarIcon,
  campaign: CampaignIcon,
  librarybooks: LibraryBooksIcon,
  dashboard: DashboardCustomizeIcon,
  assessment: AssessmentIcon,
  campaignoutline: CampaignOutlinedIcon,
  paid: PaidIcon,
  emojioutline: EmojiEventsOutlinedIcon,
  querystats: QueryStatsIcon,
  payments: PaymentsOutlinedIcon,
  workspacepremium: WorkspacePremiumIcon,
  percent: PercentIcon,
  playlistremove: PlaylistRemoveIcon,
  currencyexchange: CurrencyExchangeIcon,
  swaphoriz: SwapHorizIcon,
  businesscenter: BusinessCenterIcon,
  localatm: LocalAtmIcon,
  receipt: ReceiptLongIcon,
  description: DescriptionIcon,
  menubook: MenuBookIcon,
  personadd: PersonAddAlt1Icon,
  services: MiscellaneousServicesIcon,
  lockreset: LockResetIcon,
  historymanage: ManageHistoryIcon,
  admin: AdminPanelSettingsIcon,
  folder: FolderSharedIcon,
  storefront: StorefrontIcon,
  howtoreg: HowToRegIcon,
  upload: UploadFileIcon,
  ratereview: RateReviewIcon,
  systemupdate: SystemUpdateAltIcon,
  block: BlockIcon,
  poll: PollIcon,
  add: AddIcon,
  logout: ExitToAppIcon,
  tune: TuneIcon,
  security: SecurityIcon
};
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
export const SIDEBAR_ICON_OPTIONS = ["home", "payment", "message", "accountbalance", "report", "support", "analytics", "groups", "school", "livehelp", "list", "history", "today", "contactsupport", "emojievents", "handshake", "star", "campaign", "librarybooks", "dashboard", "assessment", "campaignoutline", "paid", "emojioutline", "querystats", "payments", "workspacepremium", "percent", "playlistremove", "currencyexchange", "swaphoriz", "businesscenter", "localatm", "receipt", "description", "menubook", "personadd", "services", "lockreset", "historymanage", "admin", "folder", "storefront", "howtoreg", "upload", "ratereview", "systemupdate", "block", "poll", "add", "logout", "tune", "security"];
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
