import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import MarkEmailUnreadRoundedIcon from "@mui/icons-material/MarkEmailUnreadRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchIcon from "@mui/icons-material/Search";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import DraftsRoundedIcon from "@mui/icons-material/DraftsRounded";
import { SSTLI_API_URL } from "../config/apiUrls";

/*
  صندوق عمليات الموظفين (حوكمة الموظفين) — بتصميم صندوق وارد:
  المجلدات (الوارد / غير المقروء / التصنيفات) ← قائمة الرسائل ← تفاصيل الرسالة.
  - الإعدادات (لمن يملك صلاحية التعديل): من يستلم ماذا (مشرفو الفروع / مستخدمو الإدارة).
  السيستم أدمن يستلم كل شيء دائمًا.
*/

const API_BASE_URL = SSTLI_API_URL;
const API = `${API_BASE_URL}/api/hr/inbox`;
const PAGE_SIZE = 30;

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const TYPE_STYLE = {
  EMPLOYEE_CREATED: { icon: PersonAddAlt1RoundedIcon, color: "#057546" },
  BRANCH_TRANSFER: { icon: SwapHorizRoundedIcon, color: "#1d4ed8" },
  JOB_CHANGE: { icon: WorkRoundedIcon, color: "#7c3aed" },
  STATUS_CHANGE: { icon: PowerSettingsNewRoundedIcon, color: "#ae1e21" },
  TRAINER_CHANGE: { icon: SchoolRoundedIcon, color: "#c2410c" },
  DEPARTMENT_CHANGE: { icon: AccountTreeRoundedIcon, color: "#0f766e" },
  ESTABLISHMENT_CHANGE: { icon: ApartmentRoundedIcon, color: "#92400e" },
  DATA_UPDATE: { icon: EditNoteRoundedIcon, color: "#475569" },
  PERMISSION_CHANGE: { icon: AdminPanelSettingsRoundedIcon, color: "#be185d" }
};

const styleOf = (type) => TYPE_STYLE[type] || TYPE_STYLE.DATA_UPDATE;

const getCurrentUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || user?.userGuid || user?.UserGuid || "").trim();
  } catch {
    return "";
  }
};

const readJson = async (response, fallback) => {
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.message || json?.error || fallback);
  return json;
};

const showError = (text) =>
  Swal.fire({ icon: "error", title: "خطأ", text, confirmButtonText: "حسنًا", confirmButtonColor: accentColor });

const dayKey = (value) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

// وقت مختصر للقائمة: الساعة لليوم، "أمس"، أو التاريخ
const shortTime = (value) => {
  const d = new Date(value);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey(d) === dayKey(new Date())) return d.toLocaleTimeString("ar-EG-u-nu-latn", { hour: "2-digit", minute: "2-digit" });
  if (dayKey(d) === dayKey(yesterday)) return "أمس";
  return d.toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "short" });
};

const fullDateTime = (value) =>
  new Date(value).toLocaleString("ar-EG-u-nu-latn", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

const fieldLabel = (text) => (
  <Box sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", mb: 0.4 }}>{text}</Box>
);

// ===================== صندوق الوارد =====================
const InboxView = ({ userGuid, onMeta }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isWide = useMediaQuery(theme.breakpoints.up("md"));
  const border = isDark ? alpha(theme.palette.success.light, 0.22) : "#e3eee8";
  const paneBg = isDark ? theme.palette.background.paper : "#ffffff";
  const softBg = isDark ? alpha(theme.palette.success.light, 0.04) : "#f7faf8";
  const strongText = isDark ? theme.palette.text.primary : "#14231c";

  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState({ total: 0, unread: 0, typeCounts: [], eventTypes: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [folder, setFolder] = useState("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const buildUrl = useCallback(
    (pageNumber) => {
      const params = new URLSearchParams({ userGuid, page: String(pageNumber), pageSize: String(PAGE_SIZE) });
      if (folder === "unread") params.set("unreadOnly", "true");
      else if (folder !== "all") params.set("type", folder);
      if (appliedSearch) params.set("search", appliedSearch);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return `${API}?${params}`;
    },
    [userGuid, folder, appliedSearch, from, to]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await readJson(await fetch(buildUrl(1), { cache: "no-store" }), "تعذر تحميل الصندوق");
      setEvents(json.data || []);
      setMeta(json);
      setPage(1);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    load();
  }, [load]);

  // رأس الصفحة يعرض عدد غير المقروء وزر الإعدادات
  useEffect(() => {
    onMeta?.(meta);
  }, [meta, onMeta]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const json = await readJson(await fetch(buildUrl(next), { cache: "no-store" }), "تعذر تحميل المزيد");
      setEvents((current) => [...current, ...(json.data || [])]);
      setPage(next);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const markRead = async (ids, all = false) => {
    try {
      await readJson(
        await fetch(`${API}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userGuid, ids, all })
        }),
        "تعذر تحديث الإشعارات"
      );
      if (all) {
        load();
        return;
      }
      // الأرقام تختفي فور القراءة: الإجمالي وعدّاد كل تصنيف
      const readTypes = events.filter((e) => ids.includes(e.id) && !e.isRead).map((e) => e.eventType);
      setEvents((current) => current.map((e) => (ids.includes(e.id) ? { ...e, isRead: true } : e)));
      setMeta((current) => ({
        ...current,
        unread: Math.max(0, (current.unread || 0) - readTypes.length),
        typeCounts: (current.typeCounts || []).map((t) => {
          const n = readTypes.filter((type) => type === t.eventType).length;
          return n ? { ...t, unread: Math.max(0, Number(t.unread || 0) - n) } : t;
        })
      }));
    } catch (e) {
      showError(e.message);
    }
  };

  const openEvent = (e) => {
    setSelectedId(e.id);
    if (!e.isRead) markRead([e.id]);
  };

  const countsByType = useMemo(() => {
    const map = {};
    (meta.typeCounts || []).forEach((t) => {
      map[t.eventType] = t;
    });
    return map;
  }, [meta.typeCounts]);

  const typeName = useMemo(() => {
    const map = {};
    (meta.eventTypes || []).forEach((t) => {
      map[t.key] = t.name;
    });
    return map;
  }, [meta.eventTypes]);

  const totalAll = useMemo(
    () => (meta.typeCounts || []).reduce((sum, t) => sum + Number(t.total || 0), 0),
    [meta.typeCounts]
  );

  const selected = events.find((e) => e.id === selectedId) || null;

  // ---------- المجلدات ----------
  const folders = [
    { key: "all", name: "الوارد", icon: InboxRoundedIcon, color: primaryColor, count: totalAll, unread: meta.unread },
    { key: "unread", name: "غير المقروء", icon: MarkEmailUnreadRoundedIcon, color: accentColor, count: meta.unread, unread: meta.unread }
  ];

  const folderButton = (f, compact = false) => {
    const Icon = f.icon;
    const active = folder === f.key;
    return (
      <Box
        key={f.key}
        component="button"
        type="button"
        onClick={() => {
          setFolder(f.key);
          setSelectedId(null);
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          width: compact ? "auto" : "100%",
          flexShrink: 0,
          border: compact ? `1px solid ${active ? f.color : border}` : 0,
          cursor: "pointer",
          px: compact ? 1.2 : 1.2,
          py: compact ? 0.6 : 0.85,
          borderRadius: compact ? 99 : "10px",
          fontFamily: "Cairo",
          fontSize: 13,
          fontWeight: active ? 900 : 700,
          textAlign: "start",
          color: active ? f.color : "text.primary",
          backgroundColor: active ? alpha(f.color, isDark ? 0.18 : 0.1) : "transparent",
          transition: "background-color .15s",
          "&:hover": { backgroundColor: alpha(f.color, isDark ? 0.14 : 0.07) }
        }}
      >
        <Icon sx={{ fontSize: 19, color: f.color }} />
        <Box component="span" sx={{ flex: compact ? "none" : 1, whiteSpace: "nowrap" }}>{f.name}</Box>
        {f.unread > 0 ? (
          <Box component="span" sx={{ fontSize: 11, fontWeight: 900, color: "#fff", backgroundColor: f.color, borderRadius: 99, px: 0.8, minWidth: 20, textAlign: "center" }}>
            {f.unread}
          </Box>
        ) : null}
      </Box>
    );
  };

  const typeFolders = (meta.eventTypes || []).map((t) => {
    const s = styleOf(t.key);
    const c = countsByType[t.key];
    return { key: t.key, name: t.name, icon: s.icon, color: s.color, count: Number(c?.total || 0), unread: Number(c?.unread || 0) };
  });

  const folderPane = (
    <Box sx={{ p: 1.2, overflowY: "auto", backgroundColor: softBg, borderInlineEnd: `1px solid ${border}` }}>
      <Stack spacing={0.3}>{folders.map((f) => folderButton(f))}</Stack>
      <Box sx={{ fontSize: 11.5, fontWeight: 900, color: "text.secondary", px: 1.2, mt: 2, mb: 0.6, letterSpacing: 0.3 }}>
        التصنيفات
      </Box>
      <Stack spacing={0.3}>{typeFolders.map((f) => folderButton(f))}</Stack>
    </Box>
  );

  // ---------- قائمة الرسائل ----------
  const listItem = (e) => {
    const s = styleOf(e.eventType);
    const Icon = s.icon;
    const active = e.id === selectedId;
    return (
      <Box
        key={e.id}
        onClick={() => openEvent(e)}
        sx={{
          display: "flex",
          gap: 1.1,
          px: 1.5,
          py: 1.2,
          cursor: "pointer",
          position: "relative",
          borderBottom: `1px solid ${border}`,
          backgroundColor: active
            ? alpha(primaryColor, isDark ? 0.22 : 0.09)
            : e.isRead
              ? "transparent"
              : alpha(s.color, isDark ? 0.08 : 0.035),
          transition: "background-color .12s",
          "&:hover": { backgroundColor: active ? alpha(primaryColor, isDark ? 0.24 : 0.11) : alpha(primaryColor, isDark ? 0.08 : 0.04) },
          "&::before": active || !e.isRead
            ? {
                content: '""',
                position: "absolute",
                insetInlineStart: 0,
                top: 0,
                bottom: 0,
                width: 3,
                backgroundColor: active ? primaryColor : s.color
              }
            : undefined
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: s.color,
            backgroundColor: alpha(s.color, isDark ? 0.24 : 0.12)
          }}
        >
          <Icon sx={{ fontSize: 21 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: 14,
                fontWeight: e.isRead ? 700 : 950,
                color: strongText,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {e.employeeName || "موظف"}
            </Box>
            <Box sx={{ fontSize: 11.5, fontWeight: e.isRead ? 600 : 900, color: e.isRead ? "text.secondary" : s.color, whiteSpace: "nowrap" }}>
              {shortTime(e.createdAt)}
            </Box>
          </Box>
          <Box sx={{ fontSize: 12.5, fontWeight: 800, color: s.color, mt: 0.15 }}>{e.title}</Box>
          <Box
            sx={{
              fontSize: 12.5,
              color: "text.secondary",
              fontWeight: 600,
              mt: 0.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {e.message}
          </Box>
        </Box>
      </Box>
    );
  };

  const listPane = (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, backgroundColor: paneBg, borderInlineEnd: isWide ? `1px solid ${border}` : 0 }}>
      <Box sx={{ p: 1.2, borderBottom: `1px solid ${border}` }}>
        <Stack direction="row" spacing={0.8} alignItems="center">
          <TextField
            size="small"
            fullWidth
            value={search}
            placeholder="ابحث في الصندوق..."
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setAppliedSearch(search.trim())}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              sx: { borderRadius: 99, backgroundColor: softBg }
            }}
          />
          <Tooltip title="تصفية بالتاريخ">
            <IconButton
              onClick={() => setShowFilters((v) => !v)}
              sx={{ color: from || to ? primaryColor : "text.secondary", backgroundColor: from || to ? alpha(primaryColor, 0.1) : "transparent" }}
            >
              <TuneRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Collapse in={showFilters}>
          <Stack direction="row" spacing={0.8} sx={{ mt: 1 }} alignItems="flex-end">
            <Box sx={{ flex: 1 }}>
              {fieldLabel("من")}
              <TextField size="small" fullWidth type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Box>
            <Box sx={{ flex: 1 }}>
              {fieldLabel("إلى")}
              <TextField size="small" fullWidth type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Box>
            {(from || to) && (
              <Button
                size="small"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
                sx={{ fontWeight: 800, color: accentColor, mb: 0.3 }}
              >
                مسح
              </Button>
            )}
          </Stack>
        </Collapse>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress size={26} sx={{ color: primaryColor }} />
          </Stack>
        ) : events.length === 0 ? (
          <Box sx={{ py: 7, px: 2, textAlign: "center" }}>
            <Box sx={{ width: 70, height: 70, mx: "auto", borderRadius: "50%", display: "grid", placeItems: "center", color: primaryColor, backgroundColor: alpha(primaryColor, 0.1) }}>
              <InboxRoundedIcon sx={{ fontSize: 36 }} />
            </Box>
            <Box sx={{ mt: 1.4, fontWeight: 900, fontSize: 15 }}>{folder === "unread" ? "لا توجد رسائل غير مقروءة" : "لا توجد رسائل هنا"}</Box>
            <Box sx={{ mt: 0.4, fontSize: 12.5, color: "text.secondary" }}>ستظهر هنا العمليات على الموظفين فور حدوثها</Box>
          </Box>
        ) : (
          <>
            {events.map(listItem)}
            {events.length < (meta.total || 0) && (
              <Box sx={{ p: 1.2, textAlign: "center" }}>
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  startIcon={loadingMore ? <CircularProgress size={14} color="inherit" /> : null}
                  sx={{ fontWeight: 900, color: primaryColor, borderRadius: 99 }}
                >
                  عرض المزيد ({(meta.total || 0) - events.length})
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );

  // ---------- قراءة الرسالة ----------
  const infoRow = (label, value) =>
    value ? (
      <Box sx={{ p: 1.2, borderRadius: "12px", backgroundColor: softBg, border: `1px solid ${border}` }}>
        <Box sx={{ fontSize: 11.5, fontWeight: 800, color: "text.secondary" }}>{label}</Box>
        <Box sx={{ fontSize: 14, fontWeight: 900, color: strongText, mt: 0.3 }}>{value}</Box>
      </Box>
    ) : null;

  const readingPane = selected ? (
    (() => {
      const s = styleOf(selected.eventType);
      const Icon = s.icon;
      const isTransfer = selected.eventType === "BRANCH_TRANSFER";
      return (
        <Box sx={{ overflowY: "auto", backgroundColor: paneBg }}>
          {!isWide && (
            <Box sx={{ px: 1.2, pt: 1 }}>
              <Button startIcon={<ArrowForwardRoundedIcon />} onClick={() => setSelectedId(null)} sx={{ fontWeight: 900, color: primaryColor }}>
                رجوع للصندوق
              </Button>
            </Box>
          )}
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" spacing={1.6} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "16px",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  background: `linear-gradient(135deg, ${s.color} 0%, ${alpha(s.color, 0.75)} 100%)`,
                  boxShadow: `0 8px 20px ${alpha(s.color, 0.3)}`
                }}
              >
                <Icon sx={{ fontSize: 30 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ fontSize: { xs: 18, md: 21 }, fontWeight: 950, color: strongText, lineHeight: 1.4 }}>{selected.title}</Box>
                <Box sx={{ fontSize: 12.5, fontWeight: 700, color: "text.secondary", mt: 0.3 }}>{fullDateTime(selected.createdAt)}</Box>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2.2, pb: 1.8, borderBottom: `1px solid ${border}` }}>
              <Box sx={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", backgroundColor: alpha(primaryColor, 0.12), color: primaryColor }}>
                <PersonRoundedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ fontSize: 13.5, fontWeight: 900, color: strongText }}>{selected.actorName || "غير محدد"}</Box>
                <Box sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 700 }}>منفّذ العملية</Box>
              </Box>
              <Box sx={{ fontSize: 11.5, fontWeight: 900, color: s.color, backgroundColor: alpha(s.color, 0.12), borderRadius: 99, px: 1.2, py: 0.3 }}>
                {typeName[selected.eventType] || selected.eventType}
              </Box>
            </Stack>

            <Box sx={{ mt: 2, fontSize: 15.5, lineHeight: 2, fontWeight: 600, color: strongText }}>{selected.message}</Box>

            {isTransfer && selected.fromBranchName && selected.toBranchName && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.2}
                sx={{ mt: 2.2, p: 1.6, borderRadius: "14px", backgroundColor: alpha(s.color, isDark ? 0.12 : 0.06), border: `1px dashed ${alpha(s.color, 0.4)}` }}
              >
                <Box sx={{ flex: 1, textAlign: "center" }}>
                  <Box sx={{ fontSize: 11.5, fontWeight: 800, color: "text.secondary" }}>من</Box>
                  <Box sx={{ fontSize: 14, fontWeight: 900, color: strongText }}>{selected.fromBranchName}</Box>
                </Box>
                <SwapHorizRoundedIcon sx={{ color: s.color, fontSize: 30 }} />
                <Box sx={{ flex: 1, textAlign: "center" }}>
                  <Box sx={{ fontSize: 11.5, fontWeight: 800, color: "text.secondary" }}>إلى</Box>
                  <Box sx={{ fontSize: 14, fontWeight: 900, color: strongText }}>{selected.toBranchName}</Box>
                </Box>
              </Stack>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, mt: 2.2 }}>
              {infoRow("الموظف", selected.employeeName)}
              {!isTransfer && infoRow("الفرع", selected.toBranchName || selected.fromBranchName)}
              {infoRow("منفّذ العملية", selected.actorName || "غير محدد")}
              {infoRow("نوع العملية", typeName[selected.eventType] || selected.eventType)}
            </Box>
          </Box>
        </Box>
      );
    })()
  ) : (
    <Box sx={{ display: "grid", placeItems: "center", backgroundColor: softBg, p: 3 }}>
      <Box sx={{ textAlign: "center" }}>
        <Box sx={{ width: 96, height: 96, mx: "auto", borderRadius: "50%", display: "grid", placeItems: "center", color: alpha(primaryColor, 0.7), backgroundColor: alpha(primaryColor, 0.08) }}>
          <DraftsRoundedIcon sx={{ fontSize: 48 }} />
        </Box>
        <Box sx={{ mt: 1.6, fontWeight: 900, fontSize: 16, color: strongText }}>اختر رسالة لعرض تفاصيلها</Box>
        <Box sx={{ mt: 0.4, fontSize: 12.5, color: "text.secondary" }}>من نفّذ العملية، ومتى، وعلى أي موظف</Box>
      </Box>
    </Box>
  );

  // ---------- التخطيط ----------
  if (!isWide) {
    if (selected) return <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, overflow: "hidden" }}>{readingPane}</Paper>;
    return (
      <Box>
        <Box sx={{ display: "flex", gap: 0.8, overflowX: "auto", pb: 1, mb: 0.5 }}>
          {[...folders, ...typeFolders].map((f) => folderButton(f, true))}
        </Box>
        <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, overflow: "hidden", height: "calc(100dvh - 260px)", display: "flex", flexDirection: "column" }}>
          {listPane}
        </Paper>
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        display: "grid",
        gridTemplateColumns: { md: "210px 340px 1fr", lg: "230px 400px 1fr" },
        height: "calc(100dvh - 190px)",
        minHeight: 520,
        borderRadius: "18px",
        border: `1px solid ${border}`,
        overflow: "hidden",
        boxShadow: isDark ? "none" : "0 10px 30px rgba(3,77,49,.07)"
      }}
    >
      {folderPane}
      {listPane}
      {readingPane}
    </Paper>
  );
};

// ===================== تبويب الإعدادات =====================
const emptySubscriber = { subscriberGuid: null, userGuid: "", branchGuid: "", allTypes: true, eventTypes: [], isActive: true };

const SettingsTab = ({ userGuid }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const border = isDark ? alpha(theme.palette.success.light, 0.25) : "#d7e8df";

  const [data, setData] = useState({ subscribers: [], users: [], branches: [], eventTypes: [] });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await readJson(
        await fetch(`${API}/settings?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
        "تعذر تحميل الإعدادات"
      );
      setData(json);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userGuid]);

  useEffect(() => {
    load();
  }, [load]);

  const typeName = useMemo(() => {
    const map = {};
    (data.eventTypes || []).forEach((t) => {
      map[t.key] = t.name;
    });
    return map;
  }, [data.eventTypes]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return data.subscribers;
    return data.subscribers.filter((s) =>
      [s.userName, s.branchName, s.jobTitle].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [data.subscribers, filter]);

  const save = async () => {
    if (!form.userGuid) {
      showError("برجاء اختيار المستخدم");
      return;
    }
    if (!form.allTypes && form.eventTypes.length === 0) {
      showError("برجاء اختيار نوع إشعار واحد على الأقل");
      return;
    }
    setSaving(true);
    try {
      await readJson(
        await fetch(`${API}/settings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            branchGuid: form.branchGuid || null,
            actorUserGuid: userGuid
          })
        }),
        "تعذر حفظ الإعدادات"
      );
      setForm(null);
      load();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "حذف المشترك",
      text: `سيتوقف وصول إشعارات ${s.branchName || "كل الفروع"} إلى ${s.userName}.`,
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: accentColor,
      cancelButtonColor: "#6b7280"
    });
    if (!confirm.isConfirmed) return;
    try {
      await readJson(
        await fetch(`${API}/settings/${s.subscriberGuid}?userGuid=${encodeURIComponent(userGuid)}`, { method: "DELETE" }),
        "تعذر الحذف"
      );
      load();
    } catch (e) {
      showError(e.message);
    }
  };

  const selectedUser = form ? data.users.find((u) => u.guid === form.userGuid) || null : null;

  const tableSx = {
    overflow: "auto",
    "& table": { borderCollapse: "separate", borderSpacing: 0, minWidth: "100%", fontSize: 13, color: "text.primary" },
    "& th": {
      background: isDark ? theme.palette.background.paper : primaryColor,
      color: isDark ? theme.palette.success.light : "#fff",
      padding: "8px",
      whiteSpace: "nowrap",
      fontWeight: 900,
      textAlign: "right"
    },
    "& td": { padding: "6px 8px", borderBottom: `1px solid ${border}`, fontWeight: 600, verticalAlign: "middle" }
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, p: 1.2, mb: 1.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", lineHeight: 1.9 }}>
          • مشرف/مشرفة الفرع: اختر المستخدم والفرع وحدد ما يتابعه، فيصله ذلك عن موظفي هذا الفرع فقط.
          <br />• مستخدمو الإدارة: اختر "كل الفروع" وحدد الأنواع التي تهمه، ومنها تعديل الصلاحيات، فيرى ما يحدث على أي مستخدم.
          <br />• السيستم أدمن يستلم كل الأحداث تلقائيًا دون إعداد.
        </Typography>
      </Paper>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1.2 }}>
        <TextField
          size="small"
          fullWidth
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="بحث بالاسم أو الفرع..."
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => setForm({ ...emptySubscriber })}
          sx={{ fontWeight: 900, whiteSpace: "nowrap", color: "#fff", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
        >
          إضافة مستلم
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, overflow: "hidden" }}>
        <Box sx={tableSx}>
          <table>
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>الفرع</th>
                <th>الإشعارات</th>
                <th>الحالة</th>
                <th style={{ width: 90 }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 30 }}><CircularProgress size={26} sx={{ color: primaryColor }} /></td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: theme.palette.text.secondary }}>لا يوجد مستلمون بعد</td></tr>
              ) : (
                visible.map((s) => (
                  <tr key={s.subscriberGuid}>
                    <td>
                      <Box sx={{ fontWeight: 900 }}>{s.userName}</Box>
                      <Box sx={{ fontSize: 12, color: "text.secondary" }}>{s.jobTitle}</Box>
                    </td>
                    <td>
                      {s.branchGuid ? s.branchName : <Chip size="small" color="success" label="كل الفروع" sx={{ fontWeight: 800 }} />}
                    </td>
                    <td>
                      {s.allTypes ? (
                        <Chip size="small" label="كل الأنواع" variant="outlined" sx={{ fontWeight: 800 }} />
                      ) : (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {s.eventTypes.map((t) => (
                            <Chip key={t} size="small" label={typeName[t] || t} variant="outlined" sx={{ fontSize: 11.5 }} />
                          ))}
                        </Stack>
                      )}
                    </td>
                    <td>
                      <Chip
                        size="small"
                        label={s.isActive ? "مفعل" : "موقوف"}
                        color={s.isActive ? "success" : "default"}
                        variant={s.isActive ? "filled" : "outlined"}
                        sx={{ fontWeight: 800 }}
                      />
                    </td>
                    <td>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setForm({
                            subscriberGuid: s.subscriberGuid,
                            userGuid: s.userGuid,
                            branchGuid: s.branchGuid || "",
                            allTypes: s.allTypes,
                            eventTypes: s.eventTypes,
                            isActive: s.isActive
                          })
                        }
                        sx={{ color: primaryColor }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => remove(s)} sx={{ color: accentColor }}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>
      </Paper>

      <Dialog open={Boolean(form)} onClose={() => !saving && setForm(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>{form?.subscriberGuid ? "تعديل مستلم" : "إضافة مستلم للإشعارات"}</DialogTitle>
        <DialogContent>
          {form && (
            <Stack spacing={1.5} sx={{ pt: 0.5 }}>
              <Box>
                {fieldLabel("المستخدم *")}
                <Autocomplete
                  size="small"
                  options={data.users}
                  value={selectedUser}
                  getOptionLabel={(u) => u.fullName || ""}
                  isOptionEqualToValue={(a, b) => a.guid === b.guid}
                  onChange={(_, u) => setForm({ ...form, userGuid: u?.guid || "" })}
                  renderOption={(props, u) => (
                    <li {...props} key={u.guid}>
                      <Box>
                        <Box sx={{ fontWeight: 800 }}>{u.fullName}</Box>
                        <Box sx={{ fontSize: 12, color: "text.secondary" }}>
                          {[u.jobTitle, u.branchName].filter(Boolean).join(" — ")}
                        </Box>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => <TextField {...params} placeholder="ابحث باسم المستخدم..." />}
                />
              </Box>
              <Box>
                {fieldLabel("الفرع")}
                <Select
                  size="small"
                  fullWidth
                  displayEmpty
                  value={form.branchGuid}
                  onChange={(e) => {
                    const branchGuid = e.target.value;
                    const startBranch = branchGuid && !form.subscriberGuid && !form.branchGuid;
                    setForm({
                      ...form,
                      branchGuid,
                      ...(startBranch ? { allTypes: false, eventTypes: data.branchEventTypes || [] } : {})
                    });
                  }}
                >
                  <MenuItem value="">كل الفروع (مستخدمو الإدارة)</MenuItem>
                  {data.branches.map((b) => (
                    <MenuItem key={b.guid} value={b.guid}>{b.name}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Box>
                {fieldLabel(form.branchGuid ? "ما يتابعه عن موظفي هذا الفرع" : "الإشعارات التي تصله (كل الفروع)")}
                <FormControlLabel
                  control={<Checkbox color="success" checked={form.allTypes} onChange={(e) => setForm({ ...form, allTypes: e.target.checked })} />}
                  label="كل الأنواع"
                />
                {!form.allTypes && (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                    {data.eventTypes.map((t) => (
                      <FormControlLabel
                        key={t.key}
                        control={
                          <Checkbox
                            color="success"
                            checked={form.eventTypes.includes(t.key)}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                eventTypes: e.target.checked
                                  ? [...form.eventTypes, t.key]
                                  : form.eventTypes.filter((k) => k !== t.key)
                              })
                            }
                          />
                        }
                        label={t.name}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              <FormControlLabel
                control={<Switch color="success" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
                label="مفعل"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setForm(null)} disabled={saving} sx={{ fontWeight: 800, color: "#6b7280" }}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ fontWeight: 900, color: "#fff", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ===================== الصفحة =====================
const HrInboxPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const userGuid = useMemo(getCurrentUserGuid, []);
  const [view, setView] = useState("inbox");
  const [meta, setMeta] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  if (!userGuid) {
    return <Box sx={{ p: 3, direction: "rtl", fontWeight: 800 }}>برجاء تسجيل الدخول مرة أخرى</Box>;
  }

  const markAll = async () => {
    try {
      await readJson(
        await fetch(`${API}/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userGuid, ids: [], all: true })
        }),
        "تعذر تحديث الإشعارات"
      );
      setReloadKey((k) => k + 1);
    } catch (e) {
      showError(e.message);
    }
  };

  const headerButtonSx = {
    color: "#fff",
    backgroundColor: "rgba(255,255,255,.14)",
    "&:hover": { backgroundColor: "rgba(255,255,255,.24)" },
    "&.Mui-disabled": { color: "rgba(255,255,255,.4)" }
  };

  return (
    <Box sx={{ direction: "rtl", p: { xs: 1, md: 2 }, fontFamily: "Cairo" }}>
      <Box
        sx={{
          mb: 1.5,
          px: { xs: 1.6, md: 2.4 },
          py: { xs: 1.4, md: 1.8 },
          borderRadius: "18px",
          color: "#fff",
          background: isDark
            ? "linear-gradient(135deg, #0b3d29 0%, #062a1c 100%)"
            : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
          boxShadow: isDark ? "none" : "0 12px 30px rgba(3,77,49,.22)",
          display: "flex",
          alignItems: "center",
          gap: 1.6,
          flexWrap: "wrap"
        }}
      >
        <Box sx={{ width: 50, height: 50, borderRadius: "15px", display: "grid", placeItems: "center", backgroundColor: "rgba(255,255,255,.16)" }}>
          {view === "settings" ? <SettingsRoundedIcon sx={{ fontSize: 28 }} /> : <InboxRoundedIcon sx={{ fontSize: 28 }} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Box sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 950, lineHeight: 1.35 }}>
            {view === "settings" ? "من يستلم الإشعارات" : "صندوق عمليات الموظفين"}
          </Box>
          <Box sx={{ fontSize: 12.5, fontWeight: 700, opacity: 0.85 }}>
            {view === "settings"
              ? "حدد مشرفي الفروع ومستخدمي الإدارة الذين تصلهم العمليات"
              : meta?.unread
                ? `لديك ${meta.unread} رسالة غير مقروءة`
                : "كل الرسائل مقروءة"}
          </Box>
        </Box>
        {view === "inbox" ? (
          <Stack direction="row" spacing={0.8}>
            <Tooltip title="تحديث">
              <IconButton onClick={() => setReloadKey((k) => k + 1)} sx={headerButtonSx}>
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="تعليم الكل كمقروء">
              <span>
                <IconButton onClick={markAll} disabled={!meta?.unread} sx={headerButtonSx}>
                  <DoneAllRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
            {meta?.canManage && (
              <Button
                startIcon={<SettingsRoundedIcon />}
                onClick={() => setView("settings")}
                sx={{ ...headerButtonSx, fontWeight: 900, borderRadius: 99, px: 1.6 }}
              >
                الإعدادات
              </Button>
            )}
          </Stack>
        ) : (
          <Button
            startIcon={<ArrowForwardRoundedIcon />}
            onClick={() => setView("inbox")}
            sx={{ ...headerButtonSx, fontWeight: 900, borderRadius: 99, px: 1.6 }}
          >
            رجوع للصندوق
          </Button>
        )}
      </Box>

      <Box sx={{ display: view === "inbox" ? "block" : "none" }}>
        <InboxView key={reloadKey} userGuid={userGuid} onMeta={setMeta} />
      </Box>
      {view === "settings" && meta?.canManage && <SettingsTab userGuid={userGuid} />}
    </Box>
  );
};

export default HrInboxPage;
