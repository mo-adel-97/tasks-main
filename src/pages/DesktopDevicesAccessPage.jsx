import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SecurityIcon from "@mui/icons-material/Security";
import DevicesIcon from "@mui/icons-material/Devices";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PublicIcon from "@mui/icons-material/Public";
import ComputerIcon from "@mui/icons-material/Computer";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import RefreshIcon from "@mui/icons-material/Refresh";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import GppBadIcon from "@mui/icons-material/GppBad";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WifiIcon from "@mui/icons-material/Wifi";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import MapIcon from "@mui/icons-material/Map";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

import Swal from "sweetalert2";


const API_URL = "https://filesregsiteration.sstli.com/erp/Desktop/device_admin.php";
const USERS_API_URL = "https://api1.sstli.com/api/userinfo";

// فتح الصفحة أصبح من Form_Name + User_Premision عبر PrivateRoute.


const colors = {
  primary: "#057445",
  primaryDark: "#034d31",
  primarySoft: "#e8f4ef",
  red: "#ae1e21",
  redSoft: "#fdecec",
  white: "#ffffff",
  text: "#1f2d3d",
  muted: "#6f827a",
  border: "rgba(5,116,69,0.14)",
  page: "#f4faf7",
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};


const fetchUsersMap = async () => {
  try {
    const response = await fetch(USERS_API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return new Map();
    }

    const users = await response.json();

    if (!Array.isArray(users)) {
      return new Map();
    }

    const map = new Map();

    users.forEach((user) => {
      const guid = normalizeGuid(user?.guid);

      if (!guid) return;

      const fullName = String(user?.fullName || "").trim();
      const userName = String(user?.userName || "").trim();

      map.set(guid, {
        guid,
        fullName,
        userName,
        displayName: fullName || userName || "غير معروف",
        code: user?.code ?? null,
        id: user?.id ?? null,
      });
    });

    return map;
  } catch {
    return new Map();
  }
};

const normalizeGuid = (value) => String(value || "").toLowerCase();

const normalizeSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[\s\-_:./\\]+/g, "");

const rowMatchesSearch = (row, search) => {
  const q = normalizeSearchText(search);

  if (!q) return true;

  const values = [
    row.display_user_name,
    row.resolved_user_full_name,
    row.resolved_user_name,
    row.user_guid,
    row.machine_name,
    row.windows_user,
    row.mac_address,
    row.local_ip,
    row.public_ip,
    row.location_text,
    row.device_guid,
    row.created_at,
    row.created_at_formatted,
  ];

  return values.some((value) => normalizeSearchText(value).includes(q));
};

const applyAllLocalFilters = (items, filters) => {
  let result = [...items];

  result = result.filter((row) => rowMatchesSearch(row, filters.search));

  if (filters.status && filters.status !== "all") {
    result = result.filter((row) => String(row.access_status || "") === filters.status);
  }

  result = applyLocalSuspicionFilter(result, filters.suspicion);

  return result;
};


const buildSuspiciousRows = (items) => {
  /*
    الشبهة هنا ليست تكرار الدخول.
    الشبهة الحقيقية أصبحت مبنية على Device GUID وليس MAC Address:
    1) نفس Device GUID استخدمه أكثر من user_guid مختلف.
    2) نفس user_guid استخدم أكثر من Device GUID مختلف.
    أما نفس المستخدم بنفس Device GUID وكرر الدخول 100 مرة = طبيعي.
  */

  const userToDeviceGuids = new Map();
  const deviceGuidToUsers = new Map();

  items.forEach((item) => {
    const userGuid = normalizeGuid(item.user_guid);
    const deviceGuid = normalizeGuid(item.device_guid);

    if (!userGuid || !deviceGuid) return;

    if (!userToDeviceGuids.has(userGuid)) {
      userToDeviceGuids.set(userGuid, new Set());
    }
    userToDeviceGuids.get(userGuid).add(deviceGuid);

    if (!deviceGuidToUsers.has(deviceGuid)) {
      deviceGuidToUsers.set(deviceGuid, new Set());
    }
    deviceGuidToUsers.get(deviceGuid).add(userGuid);
  });

  return items.map((item) => {
    const userGuid = normalizeGuid(item.user_guid);
    const deviceGuid = normalizeGuid(item.device_guid);

    const userDevicesCount =
      userGuid && userToDeviceGuids.has(userGuid)
        ? userToDeviceGuids.get(userGuid).size
        : 0;

    const deviceUsersCount =
      deviceGuid && deviceGuidToUsers.has(deviceGuid)
        ? deviceGuidToUsers.get(deviceGuid).size
        : 0;

    let suspicionType = "normal";
    let suspicionText = "طبيعي";

    if (deviceUsersCount > 1 && userDevicesCount > 1) {
      suspicionType = "both";
      suspicionText = "نفس Device GUID عليه أكثر من مستخدم، والمستخدم فتح من أكثر من Device GUID";
    } else if (deviceUsersCount > 1) {
      suspicionType = "same_device_multi_users";
      suspicionText = "أكثر من مستخدم على نفس Device GUID";
    } else if (userDevicesCount > 1) {
      suspicionType = "same_user_multi_devices";
      suspicionText = "نفس المستخدم فتح من أكثر من Device GUID";
    }

    return {
      ...item,
      device_users_count: deviceUsersCount,
      user_devices_count: userDevicesCount,
      is_suspicious: suspicionType !== "normal" ? 1 : 0,
      suspicion_type: suspicionType,
      suspicion_text: suspicionText,
    };
  });
};

const applyLocalSuspicionFilter = (items, suspicion) => {
  if (!suspicion || suspicion === "all") return items;

  if (suspicion === "suspicious") {
    return items.filter((row) => Number(row.is_suspicious) === 1);
  }

  if (suspicion === "same_device_multi_users") {
    return items.filter((row) => Number(row.device_users_count) > 1);
  }

  if (suspicion === "same_user_multi_devices") {
    return items.filter((row) => Number(row.user_devices_count) > 1);
  }

  if (suspicion === "normal") {
    return items.filter((row) => Number(row.is_suspicious) !== 1);
  }

  return items;
};


const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const uniqueBy = (items, keyGetter) => {
  const map = new Map();

  items.forEach((item) => {
    const key = keyGetter(item);
    if (key && !map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
};

const getApprovalCheckDetails = (row, allRows) => {
  const currentUserGuid = normalizeGuid(row.user_guid);
  const currentDeviceGuid = normalizeGuid(row.device_guid);

  const sameDeviceGuidDifferentUsers = uniqueBy(
    allRows.filter((item) => {
      const itemDeviceGuid = normalizeGuid(item.device_guid);
      const itemUserGuid = normalizeGuid(item.user_guid);

      return (
        currentDeviceGuid &&
        itemDeviceGuid === currentDeviceGuid &&
        itemUserGuid &&
        currentUserGuid &&
        itemUserGuid !== currentUserGuid
      );
    }),
    (item) => normalizeGuid(item.user_guid)
  );

  const sameUserDifferentDeviceGuids = uniqueBy(
    allRows.filter((item) => {
      const itemDeviceGuid = normalizeGuid(item.device_guid);
      const itemUserGuid = normalizeGuid(item.user_guid);

      return (
        currentUserGuid &&
        itemUserGuid === currentUserGuid &&
        itemDeviceGuid &&
        currentDeviceGuid &&
        itemDeviceGuid !== currentDeviceGuid
      );
    }),
    (item) => normalizeGuid(item.device_guid)
  );

  const hasSuspicion =
    sameDeviceGuidDifferentUsers.length > 0 || sameUserDifferentDeviceGuids.length > 0;

  const lines = [];

  if (sameDeviceGuidDifferentUsers.length > 0) {
    lines.push(
      `<div style="margin-top:10px;padding:10px;border-radius:12px;background:#fff6df;border:1px solid rgba(154,106,0,.22);">
        <div style="font-weight:900;color:#9a6a00;margin-bottom:6px;">⚠️ نفس Device GUID مستخدم عليه أكثر من مستخدم</div>
        ${sameDeviceGuidDifferentUsers
          .map(
            (item) =>
              `<div style="font-size:13px;line-height:1.8;">
                <b>المستخدم:</b> ${escapeHtml(
                  item.display_user_name ||
                    item.resolved_user_full_name ||
                    item.resolved_user_name ||
                    "غير معروف"
                )}
                <br/>
                <b>User GUID:</b> <span style="direction:ltr;unicode-bidi:embed;">${escapeHtml(
                  item.user_guid || "غير متاح"
                )}</span>
                <br/>
                <b>Device GUID:</b> <span style="direction:ltr;unicode-bidi:embed;">${escapeHtml(
                  item.device_guid || "غير متاح"
                )}</span>
                <br/>
                <b>MAC:</b> <span style="direction:ltr;unicode-bidi:embed;">${escapeHtml(
                  item.mac_address || "غير متاح"
                )}</span>
              </div>`
          )
          .join('<hr style="border:none;border-top:1px solid rgba(154,106,0,.18);" />')}
      </div>`
    );
  }

  if (sameUserDifferentDeviceGuids.length > 0) {
    lines.push(
      `<div style="margin-top:10px;padding:10px;border-radius:12px;background:#fdecec;border:1px solid rgba(174,30,33,.22);">
        <div style="font-weight:900;color:#ae1e21;margin-bottom:6px;">⚠️ نفس المستخدم فتح من Device GUID مختلف</div>
        ${sameUserDifferentDeviceGuids
          .map(
            (item) =>
              `<div style="font-size:13px;line-height:1.8;">
                <b>اسم الجهاز:</b> ${escapeHtml(item.machine_name || "غير متاح")}
                <br/>
                <b>Device GUID:</b> <span style="direction:ltr;unicode-bidi:embed;">${escapeHtml(
                  item.device_guid || "غير متاح"
                )}</span>
                <br/>
                <b>MAC:</b> <span style="direction:ltr;unicode-bidi:embed;">${escapeHtml(
                  item.mac_address || "غير متاح"
                )}</span>
                <br/>
                <b>IP:</b> <span style="direction:ltr;unicode-bidi:embed;">${escapeHtml(
                  item.local_ip || "غير متاح"
                )}</span>
                <br/>
                <b>آخر موقع:</b> ${escapeHtml(item.location_text || "غير متاح")}
              </div>`
          )
          .join('<hr style="border:none;border-top:1px solid rgba(174,30,33,.18);" />')}
      </div>`
    );
  }

  return {
    hasSuspicion,
    sameDeviceGuidDifferentUsers,
    sameUserDifferentDeviceGuids,
    html: lines.join(""),
  };
};

const showAllowAnywhereConfirmation = async (row, allRows) => {
  const details = getApprovalCheckDetails(row, allRows);
  const hasSuspicion = details.hasSuspicion;

  const baseInfo = `
    <div style="text-align:right;font-family:Cairo,Arial;line-height:1.9;">
      <div style="padding:10px;border-radius:12px;background:#f4faf7;border:1px solid rgba(5,116,69,.18);">
        <div><b>المستخدم:</b> ${escapeHtml(row.display_user_name || "غير معروف")}</div>
        <div><b>اسم الجهاز:</b> ${escapeHtml(row.machine_name || "غير متاح")}</div>
        <div><b>MAC:</b> <span style="direction:ltr;unicode-bidi:embed;">${escapeHtml(
          row.mac_address || "غير متاح"
        )}</span></div>
        <div><b>Device GUID:</b> <span style="direction:ltr;unicode-bidi:embed;">${escapeHtml(
          row.device_guid || "غير متاح"
        )}</span></div>
        <div><b>IP:</b> <span style="direction:ltr;unicode-bidi:embed;">${escapeHtml(
          row.local_ip || "غير متاح"
        )}</span></div>
      </div>

      ${
        hasSuspicion
          ? details.html
          : `<div style="margin-top:10px;padding:10px;border-radius:12px;background:#e8f4ef;border:1px solid rgba(5,116,69,.22);color:#057445;font-weight:900;">
              ✅ لا توجد شبهة على هذا الجهاز أو المستخدم حسب السجلات المحمّلة حاليًا.
            </div>`
      }

      <div style="margin-top:12px;color:#6f827a;font-size:13px;">
        هل تريد تأكيد السماح لهذا الجهاز بالدخول من أي مكان؟
      </div>
    </div>
  `;

  const result = await Swal.fire({
    title: hasSuspicion ? "تنبيه: توجد شبهة قبل السماح" : "تأكيد السماح للجهاز",
    html: baseInfo,
    icon: hasSuspicion ? "warning" : "info",
    showCancelButton: true,
    confirmButtonText: "نعم، اسمح للجهاز",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#057445",
    cancelButtonColor: "#ae1e21",
    width: 720,
    reverseButtons: true,
  });

  return result.isConfirmed;
};


const todayDate = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const formatDateTime = (value) => {
  if (!value) return "غير متاح";

  try {
    const normalized = String(value).replace(" ", "T");
    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return value;
  }
};

const postAdmin = async (body) => {
  const user = getCurrentUser();

  let response;

  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        ...body,
        admin_guid: user?.guid || user?.Guid || "",
      }),
    });
  } catch {
    throw new Error(
      "فشل الاتصال بالسيرفر. تأكد أن ملف device_admin.php مرفوع وأن إعدادات CORS مفعلة."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("السيرفر رجّع رد غير صالح JSON. راجع ملف PHP.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "حدث خطأ أثناء تنفيذ الطلب");
  }

  return data;
};

const StatCard = ({ title, value, icon, color = colors.primary, subtitle }) => (
  <Card
    elevation={0}
    sx={{
      height: "100%",
      borderRadius: 4,
      border: `1px solid ${colors.border}`,
      boxShadow: "0 16px 38px rgba(5,116,69,0.08)",
      background: "linear-gradient(145deg, #ffffff 0%, #f8fffb 100%)",
      overflow: "hidden",
      position: "relative",
      "&:before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: 4,
        background: `linear-gradient(90deg, ${color}, ${colors.primaryDark})`,
      },
    }}
  >
    <CardContent sx={{ p: 2.2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: "Cairo", fontWeight: 900, color: colors.muted, fontSize: "0.83rem" }}>
            {title}
          </Typography>

          <Typography
            sx={{
              fontFamily: "Cairo",
              fontWeight: 950,
              color,
              fontSize: { xs: "1.7rem", md: "2rem" },
              mt: 0.7,
              lineHeight: 1,
            }}
          >
            {value ?? 0}
          </Typography>

          {subtitle && (
            <Typography
              noWrap
              sx={{ fontFamily: "Cairo", color: colors.muted, fontSize: "0.75rem", mt: 1, maxWidth: "100%" }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            width: 52,
            height: 52,
            flex: "0 0 auto",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: `linear-gradient(135deg, ${color} 0%, ${colors.primaryDark} 100%)`,
            boxShadow: `0 10px 24px ${color}44`,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const DeviceStateChip = ({ row }) => {
  if (Number(row.is_blocked) === 1) {
    return (
      <Chip
        label="محظور"
        size="small"
        sx={{
          fontFamily: "Cairo",
          fontWeight: 900,
          bgcolor: colors.redSoft,
          color: colors.red,
          border: `1px solid ${colors.red}22`,
        }}
      />
    );
  }

  if (Number(row.is_allowed) === 1 && Number(row.allow_outside_network) === 1) {
    return (
      <Chip
        label="مسموح من أي مكان"
        size="small"
        sx={{
          fontFamily: "Cairo",
          fontWeight: 900,
          bgcolor: colors.primarySoft,
          color: colors.primary,
          border: `1px solid ${colors.primary}22`,
        }}
      />
    );
  }

  if (Number(row.is_allowed) === 1) {
    return (
      <Chip
        label="داخل المعهد فقط"
        size="small"
        sx={{
          fontFamily: "Cairo",
          fontWeight: 900,
          bgcolor: "#eaf2ff",
          color: "#1e5aa8",
          border: "1px solid rgba(30,90,168,0.14)",
        }}
      />
    );
  }

  return (
    <Chip
      label="غير معتمد"
      size="small"
      sx={{
        fontFamily: "Cairo",
        fontWeight: 900,
        bgcolor: "#fff6df",
        color: "#9a6a00",
        border: "1px solid rgba(154,106,0,0.16)",
      }}
    />
  );
};

const AccessResultChip = ({ row }) => {
  if (row.access_status === "allowed") {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="تم السماح"
        size="small"
        sx={{ fontFamily: "Cairo", fontWeight: 900, bgcolor: colors.primarySoft, color: colors.primary }}
      />
    );
  }

  if (row.access_status === "pending") {
    return (
      <Chip
        icon={<PendingActionsIcon />}
        label="انتظار"
        size="small"
        sx={{ fontFamily: "Cairo", fontWeight: 900, bgcolor: "#fff6df", color: "#9a6a00" }}
      />
    );
  }

  return (
    <Chip
      icon={<BlockIcon />}
      label="مرفوض"
      size="small"
      sx={{ fontFamily: "Cairo", fontWeight: 900, bgcolor: colors.redSoft, color: colors.red }}
    />
  );
};

export default function DesktopDevicesAccessPage() {
  const user = getCurrentUser();
  const userGuid = normalizeGuid(user?.guid || user?.Guid);

  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mapDialog, setMapDialog] = useState({
    open: false,
    row: null,
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    suspicion: "all",
    date_from: todayDate(),
    date_to: todayDate(),
  });

  const openMapDialog = (row) => {
    setMapDialog({
      open: true,
      row,
    });
  };

  const closeMapDialog = () => {
    setMapDialog({
      open: false,
      row: null,
    });
  };

  const fetchRows = async (filtersToUse = filters) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      /*
        مهم:
        فلتر البحث ونتيجة الدخول والشبهات هنا محلي داخل React.
        لا نرسل search/status للـ PHP؛ لأن الـ PHP لا يعرف fullName
        القادم من API المستخدمين، وده كان سبب إن البحث باسم المستخدم يرجع فاضي.
        التاريخ فقط هو اللي يروح للـ PHP عشان يقلل الداتا.
      */
      const data = await postAdmin({
        action: "list",
        search: "",
        status: "all",
        date_from: filtersToUse.date_from,
        date_to: filtersToUse.date_to,
      });

      const usersMap = await fetchUsersMap();

      const enrichedRows = buildSuspiciousRows(
        (data.rows || []).map((item, index) => {
          const userGuid = normalizeGuid(item.user_guid);
          const userInfo = usersMap.get(userGuid);

          return {
            ...item,
            id: item.log_id || index + 1,

            /*
              مهم:
              لا نستخدم item.user_name هنا لأنه غالبًا Windows User / اسم مستخدم الجهاز.
              اسم المستخدم الحقيقي لازم ييجي من user_guid عن طريق USERS_API_URL.
            */
            display_user_name: userInfo?.displayName || "غير معروف",
            resolved_user_full_name: userInfo?.fullName || "",
            resolved_user_name: userInfo?.userName || "",
            resolved_user_code: userInfo?.code ?? null,
            actual_user_loaded: Boolean(userInfo),

            created_at_formatted: formatDateTime(item.created_at),
          };
        })
      );

      const filteredRows = applyAllLocalFilters(enrichedRows, filtersToUse);

      setAllRows(enrichedRows);
      setRows(filteredRows);

      const suspiciousSummary = enrichedRows.reduce(
        (acc, row) => {
          if (Number(row.device_users_count) > 1) acc.devices_with_multi_users += 1;
          if (Number(row.user_devices_count) > 1) acc.users_with_multi_devices += 1;
          if (Number(row.is_suspicious) === 1) acc.total_suspicious += 1;
          return acc;
        },
        {
          devices_with_multi_users: 0,
          users_with_multi_devices: 0,
          total_suspicious: 0,
        }
      );

      setSummary({
        ...(data.summary || {}),
        ...suspiciousSummary,
        displayed_rows: filteredRows.length,
      });
    } catch (e) {
      setError(e.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const applyCurrentFilters = () => {
    /*
      تطبيق الفلاتر يعيد تحميل البيانات من السيرفر بالتاريخ المختار،
      وبعدها يطبق البحث / الحالة / الشبهات محليًا داخل React.
    */
    fetchRows(filters);
  };

  useEffect(() => {
    fetchRows(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runDeviceAction = async (action, row, successMessage) => {
    setError("");
    setSuccess("");

    if (action === "allow_anywhere") {
      const confirmed = await showAllowAnywhereConfirmation(row, allRows);

      if (!confirmed) {
        return;
      }
    }

    setActionLoading(`${action}_${row.device_guid || row.mac_address}`);

    try {
      await postAdmin({
        action,
        device_guid: row.device_guid,
        mac_address: row.mac_address,
      });

      setSuccess(successMessage);
      await fetchRows(filters);

      if (action === "allow_anywhere") {
        await Swal.fire({
          title: "تم السماح",
          text: "تم السماح للجهاز بالدخول من أي مكان بنجاح.",
          icon: "success",
          confirmButtonText: "تمام",
          confirmButtonColor: "#057445",
        });
      }
    } catch (e) {
      setError(e.message || "تعذر تنفيذ الإجراء");

      await Swal.fire({
        title: "تعذر تنفيذ الإجراء",
        text: e.message || "تعذر تنفيذ الإجراء",
        icon: "error",
        confirmButtonText: "إغلاق",
        confirmButtonColor: "#ae1e21",
      });
    } finally {
      setActionLoading("");
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "created_at_formatted",
        headerName: "وقت الدخول",
        flex: 1.05,
        minWidth: 135,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => (
          <Stack direction="row" spacing={0.7} alignItems="center" sx={{ minWidth: 0 }}>
            <AccessTimeIcon sx={{ color: colors.primary, fontSize: 18, flex: "0 0 auto" }} />
            <Tooltip title={params.row.created_at || ""}>
              <Typography
                noWrap
                sx={{ fontFamily: "Cairo", fontWeight: 800, fontSize: "0.78rem", maxWidth: "100%" }}
              >
                {params.value || "غير متاح"}
              </Typography>
            </Tooltip>
          </Stack>
        ),
      },
      {
        field: "display_user_name",
        headerName: "المستخدم",
        flex: 1.15,
        minWidth: 145,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => (
          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0, width: "100%" }}>
            <PersonIcon sx={{ color: colors.primary, fontSize: 19, flex: "0 0 auto" }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontFamily: "Cairo", fontWeight: 900, lineHeight: 1.2, fontSize: "0.82rem" }}>
                {params.row.display_user_name || "غير معروف"}
              </Typography>
              <Typography noWrap sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: colors.muted }}>
                {params.row.actual_user_loaded
                  ? params.row.resolved_user_name || params.row.user_guid || ""
                  : params.row.user_guid
                  ? `غير موجود في المستخدمين - ${params.row.user_guid}`
                  : "لا يوجد User GUID"}
              </Typography>
            </Box>
          </Stack>
        ),
      },
      {
        field: "machine_name",
        headerName: "اسم الجهاز",
        flex: 0.95,
        minWidth: 130,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => (
          <Stack direction="row" spacing={0.7} alignItems="center" sx={{ minWidth: 0 }}>
            <ComputerIcon sx={{ color: "#4d6f63", fontSize: 18, flex: "0 0 auto" }} />
            <Tooltip title={params.value || ""}>
              <Typography noWrap sx={{ fontFamily: "Cairo", fontWeight: 800, fontSize: "0.8rem" }}>
                {params.value || "غير متاح"}
              </Typography>
            </Tooltip>
          </Stack>
        ),
      },
      {
        field: "local_ip",
        headerName: "IP",
        flex: 0.72,
        minWidth: 105,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => (
          <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minWidth: 0 }}>
            <WifiIcon sx={{ color: colors.primary, fontSize: 17, flex: "0 0 auto" }} />
            <Typography noWrap sx={{ fontFamily: "Cairo", fontWeight: 800, fontSize: "0.78rem" }}>
              {params.value || "—"}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "mac_address",
        headerName: "MAC",
        flex: 1,
        minWidth: 145,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => (
          <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minWidth: 0 }}>
            <FingerprintIcon sx={{ color: colors.red, fontSize: 17, flex: "0 0 auto" }} />
            <Tooltip title={params.value || ""}>
              <Typography noWrap sx={{ fontFamily: "Cairo", fontWeight: 800, fontSize: "0.76rem" }}>
                {params.value || "—"}
              </Typography>
            </Tooltip>
          </Stack>
        ),
      },
      {
        field: "device_guid",
        headerName: "Device GUID",
        flex: 1.15,
        minWidth: 190,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => (
          <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minWidth: 0 }}>
            <FingerprintIcon sx={{ color: colors.primary, fontSize: 17, flex: "0 0 auto" }} />
            <Tooltip title={params.value || ""}>
              <Typography
                noWrap
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  direction: "ltr",
                  textAlign: "left",
                  maxWidth: "100%",
                }}
              >
                {params.value || "—"}
              </Typography>
            </Tooltip>
          </Stack>
        ),
      },
      {
        field: "location_text",
        headerName: "اللوكيشن",
        flex: 1.35,
        minWidth: 160,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => {
          const hasMap = params.row.location_lat && params.row.location_lng;

          return (
            <Stack direction="row" spacing={0.7} alignItems="center" sx={{ minWidth: 0, width: "100%" }}>
              <Tooltip title={params.value || ""}>
                <Stack direction="row" spacing={0.7} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                  <LocationOnIcon sx={{ color: colors.red, fontSize: 18, flex: "0 0 auto" }} />

                  <Typography
                    noWrap
                    sx={{
                      fontFamily: "Cairo",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      maxWidth: "100%",
                    }}
                  >
                    {params.value || "غير متاح"}
                  </Typography>
                </Stack>
              </Tooltip>

              {hasMap && (
                <Tooltip title="عرض على الخريطة">
                  <IconButton
                    size="small"
                    onClick={() => openMapDialog(params.row)}
                    sx={{
                      width: 28,
                      height: 28,
                      color: "#fff",
                      bgcolor: colors.primary,
                      flex: "0 0 auto",
                      boxShadow: "0 6px 14px rgba(5,116,69,0.18)",
                      "&:hover": {
                        bgcolor: colors.primaryDark,
                      },
                    }}
                  >
                    <MapIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          );
        },
      },
      {
        field: "suspicion_text",
        headerName: "الشبهات",
        flex: 0.95,
        minWidth: 130,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => {
          const suspicious = Number(params.row.is_suspicious) === 1;

          return (
            <Tooltip
              title={
                suspicious
                  ? `${params.row.suspicion_text} | مستخدمين على نفس Device GUID: ${params.row.device_users_count || 0} | Device GUIDs لنفس المستخدم: ${params.row.user_devices_count || 0}`
                  : "لا توجد شبهة على هذا السجل"
              }
            >
              <Chip
                icon={suspicious ? <ReportProblemIcon /> : <CheckCircleIcon />}
                label={suspicious ? "شبهة" : "طبيعي"}
                size="small"
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  bgcolor: suspicious ? "#fff6df" : colors.primarySoft,
                  color: suspicious ? "#9a6a00" : colors.primary,
                  border: suspicious
                    ? "1px solid rgba(154,106,0,0.18)"
                    : `1px solid ${colors.primary}22`,
                }}
              />
            </Tooltip>
          );
        },
      },
      {
        field: "device_state",
        headerName: "حالة الجهاز",
        flex: 0.95,
        minWidth: 135,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => <DeviceStateChip row={params.row} />,
      },
      {
        field: "access_status",
        headerName: "الدخول",
        flex: 0.75,
        minWidth: 105,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => <AccessResultChip row={params.row} />,
      },
      {
        field: "actions",
        headerName: "إجراءات",
        flex: 0.78,
        minWidth: 118,
        sortable: false,
        filterable: false,
        align: "left",
        headerAlign: "left",
        renderCell: (params) => {
          const row = params.row;
          const key = row.device_guid || row.mac_address;
          const isLoading = actionLoading.includes(key);

          return (
            <Stack direction="row" spacing={0.55}>
              <Tooltip title="فحص الشبهة ثم السماح من أي مكان">
                <span>
                  <IconButton
                    size="small"
                    disabled={isLoading}
                    onClick={() =>
                      runDeviceAction(
                        "allow_anywhere",
                        row,
                        "تم السماح للجهاز بالدخول من أي مكان"
                      )
                    }
                    sx={{
                      color: "#fff",
                      bgcolor: colors.primary,
                      width: 30,
                      height: 30,
                      "&:hover": { bgcolor: colors.primaryDark },
                    }}
                  >
                    <LockOpenIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="السماح داخل المعهد فقط">
                <span>
                  <IconButton
                    size="small"
                    disabled={isLoading}
                    onClick={() =>
                      runDeviceAction(
                        "allow_inside_only",
                        row,
                        "تم السماح للجهاز داخل شبكة المعهد فقط"
                      )
                    }
                    sx={{
                      color: "#fff",
                      bgcolor: "#1e5aa8",
                      width: 30,
                      height: 30,
                      "&:hover": { bgcolor: "#153f78" },
                    }}
                  >
                    <HomeWorkIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="حظر الجهاز">
                <span>
                  <IconButton
                    size="small"
                    disabled={isLoading}
                    onClick={() => runDeviceAction("block", row, "تم حظر الجهاز")}
                    sx={{
                      color: "#fff",
                      bgcolor: colors.red,
                      width: 30,
                      height: 30,
                      "&:hover": { bgcolor: "#7f1518" },
                    }}
                  >
                    <GppBadIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    [actionLoading, allRows]
  );

  return (
    <NavigationShell variant="standard" ><>
      

      <PageContainer
        sx={{
          minHeight: "100vh",
          
          bgcolor: colors.page,
          direction: "rtl",
          textAlign: "start",
          fontFamily: "Cairo, Arial, sans-serif",
          overflowX: "hidden",
          overflowY: "auto",
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.7 },
            borderRadius: 5,
            mb: 2.5,
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            color: "#fff",
            boxShadow: "0 18px 42px rgba(5,116,69,0.22)",
            position: "relative",
            overflow: "hidden",
            "&:before": {
              content: '""',
              position: "absolute",
              right: -90,
              top: -90,
              width: 230,
              height: 230,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.10)",
            },
            "&:after": {
              content: '""',
              position: "absolute",
              right: 80,
              bottom: -110,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(174,30,33,0.20)",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
            sx={{ position: "relative", zIndex: 2 }}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "20px",
                    bgcolor: "rgba(255,255,255,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.22)",
                  }}
                >
                  <SecurityIcon sx={{ fontSize: 34 }} />
                </Box>

                <Box>
                  <Typography sx={{ fontFamily: "Cairo", fontWeight: 950, fontSize: { xs: "1.35rem", md: "1.7rem" } }}>
                    إدارة أجهزة الديسكتوب
                  </Typography>
                  <Typography sx={{ fontFamily: "Cairo", opacity: 0.9, fontSize: "0.9rem" }}>
                    متابعة وقت الدخول، الجهاز، الـ IP، الماك، Device GUID، اللوكيشن، وحالة السماح
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
              onClick={() => fetchRows(filters)}
              disabled={loading}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900,
                borderRadius: 3,
                px: 2.5,
                bgcolor: "#fff",
                color: colors.primary,
                boxShadow: "none",
                "&:hover": { bgcolor: "#edf7f2", boxShadow: "none" },
              }, uiLayout.buttonSx)}
            >
              تحديث البيانات
            </Button>
          </Stack>
        </Paper>

        {/* <Grid container spacing={1.8} sx={{ mb: 2.2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="محاولات اليوم"
              value={summary.today_attempts}
              icon={<PublicIcon />}
              subtitle="كل عمليات فتح البرنامج اليوم"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="مسموح اليوم"
              value={summary.today_allowed}
              icon={<CheckCircleIcon />}
              color={colors.primary}
              subtitle="محاولات تم السماح لها"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="مرفوض / انتظار"
              value={summary.today_blocked}
              icon={<BlockIcon />}
              color={colors.red}
              subtitle="محاولات تحتاج مراجعة"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="إجمالي الأجهزة"
              value={summary.total_devices}
              icon={<DevicesIcon />}
              color="#1e5aa8"
              subtitle={`معتمدة: ${summary.allowed_devices || 0} / انتظار: ${summary.pending_devices || 0}`}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="الشبهات"
              value={summary.total_suspicious || 0}
              icon={<ReportProblemIcon />}
              color="#9a6a00"
              subtitle={`نفس Device GUID: ${summary.devices_with_multi_users || 0} / نفس مستخدم: ${summary.users_with_multi_devices || 0}`}
            />
          </Grid>
        </Grid> */}

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 4,
            mb: 2,
            border: `1px solid ${colors.border}`,
            boxShadow: "0 14px 34px rgba(5,116,69,0.07)",
            bgcolor: "#fff",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            spacing={1.5}
            useFlexGap
            sx={uiLayout.withUiSx({ flexWrap: "wrap" }, uiLayout.filterBarSx)}
          >
            <TextField
              fullWidth
              label="بحث باسم المستخدم / الجهاز / MAC / Device GUID / IP / المدينة"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  applyCurrentFilters();
                }
              }}
              size="small"
              InputLabelProps={{ sx: { fontFamily: "Cairo", left: "auto", right: 0 } , shrink: true }}
              inputProps={{ dir: "auto", style: { textAlign: "start", fontFamily: "Cairo" } }}
              sx={uiLayout.withUiSx({ flex: "1 1 340px" }, uiLayout.formFieldSx)}
            />

            <TextField
              select
              label="نتيجة الدخول"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              size="small"
              InputLabelProps={{ sx: { fontFamily: "Cairo", left: "auto", right: 0 } , shrink: true }}
              sx={uiLayout.withUiSx({
                minWidth: { xs: "100%", md: 170 },
                ".MuiSelect-select": { fontFamily: "Cairo", textAlign: "start" },
              }, uiLayout.formFieldSx)}
            >
              <MenuItem value="all">الكل</MenuItem>
              <MenuItem value="allowed">مسموح</MenuItem>
              <MenuItem value="pending">بانتظار الاعتماد</MenuItem>
              <MenuItem value="blocked">مرفوض</MenuItem>
              <MenuItem value="error">خطأ</MenuItem>
            </TextField>

            <TextField
              select
              label="فلتر الشبهات"
              value={filters.suspicion}
              onChange={(e) => setFilters((prev) => ({ ...prev, suspicion: e.target.value }))}
              size="small"
              InputLabelProps={{ sx: { fontFamily: "Cairo", left: "auto", right: 0 } , shrink: true }}
              sx={uiLayout.withUiSx({
                minWidth: { xs: "100%", md: 230 },
                ".MuiSelect-select": { fontFamily: "Cairo", textAlign: "start" },
              }, uiLayout.formFieldSx)}
            >
              <MenuItem value="all">كل السجلات</MenuItem>
              <MenuItem value="suspicious">كل الشبهات</MenuItem>
              <MenuItem value="same_device_multi_users">أكثر من مستخدم على نفس Device GUID</MenuItem>
              <MenuItem value="same_user_multi_devices">نفس المستخدم على أكثر من Device GUID</MenuItem>
              <MenuItem value="normal">طبيعي فقط</MenuItem>
            </TextField>

            <TextField
              type="date"
              label="من تاريخ"
              value={filters.date_from}
              onChange={(e) => setFilters((prev) => ({ ...prev, date_from: e.target.value }))}
              size="small"
              InputLabelProps={{ shrink: true, sx: { fontFamily: "Cairo", left: "auto", right: 0 } }}
              inputProps={{ style: { textAlign: "left", direction: "ltr" , unicodeBidi: "isolate" } , dir: "ltr" }}
              sx={uiLayout.withUiSx({ minWidth: { xs: "100%", md: 155 } }, uiLayout.formFieldSx)}
            />

            <TextField
              type="date"
              label="إلى تاريخ"
              value={filters.date_to}
              onChange={(e) => setFilters((prev) => ({ ...prev, date_to: e.target.value }))}
              size="small"
              InputLabelProps={{ shrink: true, sx: { fontFamily: "Cairo", left: "auto", right: 0 } }}
              inputProps={{ style: { textAlign: "left", direction: "ltr" , unicodeBidi: "isolate" } , dir: "ltr" }}
              sx={uiLayout.withUiSx({ minWidth: { xs: "100%", md: 155 } }, uiLayout.formFieldSx)}
            />

            <Button
              variant="contained"
              onClick={applyCurrentFilters}
              disabled={loading}
              sx={uiLayout.withUiSx({
                height: "40px",
                minWidth: { xs: "100%", md: 130 },
                fontFamily: "Cairo",
                fontWeight: 900,
                borderRadius: 2.5,
                bgcolor: colors.primary,
                boxShadow: "0 10px 22px rgba(5,116,69,0.18)",
                "&:hover": { bgcolor: colors.primaryDark },
              }, uiLayout.buttonSx)}
            >
              تطبيق
            </Button>

            <Button
              variant="outlined"
              onClick={() => {
                const resetFilters = {
                  search: "",
                  status: "all",
                  suspicion: "all",
                  date_from: filters.date_from,
                  date_to: filters.date_to,
                };

                setFilters(resetFilters);
                fetchRows(resetFilters);
              }}
              disabled={loading}
              sx={uiLayout.withUiSx({
                height: "40px",
                minWidth: { xs: "100%", md: 110 },
                fontFamily: "Cairo",
                fontWeight: 900,
                borderRadius: 2.5,
                color: colors.red,
                borderColor: colors.red,
                "&:hover": {
                  borderColor: colors.red,
                  bgcolor: colors.redSoft,
                },
              }, uiLayout.buttonSx)}
            >
              تصفير
            </Button>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3, fontFamily: "Cairo" }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 3, fontFamily: "Cairo" }}>
            {success}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={uiLayout.withUiSx({
            width: "100%",
            borderRadius: 4.5,
            overflow: "visible",
            border: `1px solid ${colors.border}`,
            boxShadow: "0 18px 42px rgba(5,116,69,0.08)",
            bgcolor: "#fff",
          }, uiLayout.tableContainerSx)}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: "#fff",
              borderBottom: "1px solid #e7f1ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box>
              <Typography sx={{ fontFamily: "Cairo", fontWeight: 950, color: colors.text }}>
                الأجهزة ومحاولات الدخول
              </Typography>
              <Typography sx={{ fontFamily: "Cairo", fontSize: "0.75rem", color: colors.muted }}>
                اسم المستخدم المعروض يتم جلبه من user_guid فقط وليس من اسم مستخدم الجهاز
              </Typography>
            </Box>

            <Chip
              label={`${rows.length} من ${allRows.length || rows.length} سجل`}
              size="small"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                bgcolor: colors.primarySoft,
                color: colors.primary,
              }}
            />
          </Box>

          <Divider />

          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            rowHeight={48}
            columnHeaderHeight={48}
            loading={loading}
            disableRowSelectionOnClick
            disableColumnMenu
            disableColumnResize
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 100, page: 0 },
              },
            }}
            sx={uiLayout.withUiSx({
              direction: "rtl",
              border: "none",
              fontFamily: "Cairo",
              overflowX: "hidden",
              ".MuiDataGrid-main": {
                overflowX: "hidden",
                overflowY: "visible",
              },
              ".MuiDataGrid-virtualScroller": {
                overflowX: "auto",
                overflowY: "visible !important",
              },
              ".MuiDataGrid-columnHeaders": {
                bgcolor: "#f2faf6",
                color: colors.text,
                fontFamily: "Cairo",
                fontWeight: 950,
                borderBottom: `1px solid ${colors.border}`,
              },
              ".MuiDataGrid-columnHeader": {
                px: 1,
              },
              ".MuiDataGrid-columnHeaderTitle": {
                fontFamily: "Cairo",
                fontWeight: 950,
                fontSize: "0.78rem",
              },
              ".MuiDataGrid-cell": {
                fontFamily: "Cairo",
                textAlign: "start",
                px: 1,
                borderBottom: "1px solid rgba(5,116,69,0.06)",
              },
              ".MuiDataGrid-row:hover": {
                bgcolor: "#f7fcfa",
              },
              ".MuiDataGrid-footerContainer": {
                direction: "rtl",
                borderTop: `1px solid ${colors.border}`,
              },
              ".MuiTablePagination-root, .MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                fontFamily: "Cairo",
              },
            }, uiLayout.dataGridSx)}
          />
        </Paper>
      </PageContainer>

      <Dialog sx={uiLayout.dialogLayoutSx}
        open={mapDialog.open}
        onClose={closeMapDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            fontFamily: "Cairo",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Cairo",
            fontWeight: 950,
            color: "#fff",
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <MapIcon />
          عرض موقع الجهاز على الخريطة
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            bgcolor: "#f5faf7",
          }}
        >
          {mapDialog.row && (
            <Box>
              <Box sx={{ p: 2.2 }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: colors.muted,
                          fontSize: "0.78rem",
                        }}
                      >
                        المستخدم
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 950,
                          color: colors.text,
                        }}
                      >
                        {mapDialog.row.display_user_name || "غير معروف"}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: colors.muted,
                          fontSize: "0.78rem",
                        }}
                      >
                        اسم الجهاز
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 950,
                          color: colors.text,
                        }}
                      >
                        {mapDialog.row.machine_name || "غير متاح"}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: colors.muted,
                          fontSize: "0.78rem",
                        }}
                      >
                        IP الجهاز
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 950,
                          color: colors.text,
                        }}
                      >
                        {mapDialog.row.local_ip || "غير متاح"}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: colors.muted,
                          fontSize: "0.78rem",
                        }}
                      >
                        Device GUID
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 950,
                          color: colors.text,
                          direction: "ltr",
                          textAlign: "left",
                          wordBreak: "break-all",
                          fontSize: "0.78rem",
                        }}
                      >
                        <bdi dir="ltr">{mapDialog.row.device_guid || "غير متاح"}</bdi>
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: colors.muted,
                          fontSize: "0.78rem",
                        }}
                      >
                        الإحداثيات
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 950,
                          color: colors.text,
                          direction: "ltr",
                          textAlign: "left",
                        }}
                      >
                        {mapDialog.row.location_lat}, {mapDialog.row.location_lng}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: colors.muted,
                          fontSize: "0.78rem",
                        }}
                      >
                        وصف الموقع
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 800,
                          color: colors.text,
                        }}
                      >
                        {mapDialog.row.location_text || "غير متاح"}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Box
                sx={{
                  height: 380,
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <iframe
                  title="device-location-map"
                  width="100%"
                  height="100%"
                  style={{
                    border: 0,
                    display: "block",
                  }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${mapDialog.row.location_lat},${mapDialog.row.location_lng}&z=12&output=embed`}
                />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            p: 2,
            justifyContent: "space-between",
            borderTop: `1px solid ${colors.border}`,
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            onClick={closeMapDialog}
            sx={uiLayout.withUiSx({
              fontFamily: "Cairo",
              fontWeight: 900,
              color: colors.red,
            }, uiLayout.buttonSx)}
          >
            إغلاق
          </Button>

          {mapDialog.row?.location_lat && mapDialog.row?.location_lng && (
            <Button
              variant="contained"
              endIcon={<OpenInNewIcon />}
              onClick={() => {
                window.open(
                  `https://www.google.com/maps?q=${mapDialog.row.location_lat},${mapDialog.row.location_lng}`,
                  "_blank"
                );
              }}
              sx={uiLayout.withUiSx({
                fontFamily: "Cairo",
                fontWeight: 900,
                borderRadius: 2.5,
                bgcolor: colors.primary,
                "&:hover": {
                  bgcolor: colors.primaryDark,
                },
              }, uiLayout.buttonSx)}
            >
              فتح في Google Maps
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </></NavigationShell>
  );
}
