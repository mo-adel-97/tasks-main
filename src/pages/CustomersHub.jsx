// بيانات العملاء الموحدة (تابة المبيعات) — api/customer-leads (CustomerLeadsController):
// - كل مصادر العملاء في شاشة واحدة: طلبات الدراسة الحضوري / عن بعد، طلبات التسجيل، تسجيلات الموقع 2025، نماذج مواقع الووردبريس، والشات بوت.
// - كل رقم جوال = عميل واحد، ومعاه كل طلباته.
// - حالة التسجيل: مسجّل لدينا / بياناته مُدخلة بلا استمارة تسجيل / غير موجود في النظام — للكل مجمّع ولكل مصدر لوحده.
//   "لا يمكن التحقق" = طلب من غير جوال ولا هوية؛ بيتعرض لوحده ومش داخل في النسب.
// - ألوان الحالات التلاتة متجربة على validate_palette (فاتح وداكن) ودايمًا معاها أيقونة واسم ورقم، مش اللون لوحده.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  ListSubheader,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SyncIcon from "@mui/icons-material/Sync";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import GroupsIcon from "@mui/icons-material/Groups";
import CustomersDistribution from "./CustomersDistribution";
import DistributionResults from "./DistributionResults";
import InsightsIcon from "@mui/icons-material/Insights";
import { API_BASE_URL, getUserGuid, readJson, useTasksPalette } from "./tasks/tasksCommon";
import { TasksPageShell, SectionCard, NoAccess, CenterLoader, EmptyState, toast, showError } from "./tasks/TasksUi";

const API = `${API_BASE_URL}/api/customer-leads`;

// ---------- ثوابت ----------
// الحالات: أخضر / كهرماني / أزرق (الأزرق = عميل محتمل لم يدخل النظام بعد). "لا يمكن التحقق" رمادي محايد خارج الشريط.
const STATUS = {
  registered: {
    label: "مسجّل لدينا",
    short: "مسجّل",
    hint: "له ملف طالب وتسجيل في دبلوم أو دورة",
    light: "#059669",
    dark: "#059669",
    Icon: CheckCircleIcon,
    field: "registered"
  },
  profile: {
    label: "بياناته مُدخلة بلا استمارة تسجيل",
    short: "بياناته مُدخلة فقط",
    hint: "له ملف طالب في النظام ولم تُصدر له استمارة تسجيل بعد",
    light: "#d97706",
    dark: "#d97706",
    Icon: PendingActionsIcon,
    field: "profileOnly"
  },
  none: {
    label: "غير موجود في النظام",
    short: "غير موجود",
    hint: "لم تُدخل بياناته في النظام إطلاقًا",
    light: "#2563eb",
    dark: "#3b82f6",
    Icon: PersonAddAltIcon,
    field: "notRegistered"
  },
  unknown: {
    label: "لا يمكن التحقق",
    short: "لا يمكن التحقق",
    hint: "طلب بلا رقم جوال ولا رقم هوية",
    light: "#64748b",
    dark: "#94a3b8",
    Icon: HelpOutlineIcon,
    field: "unverifiable"
  }
};
const STATUS_ORDER = ["registered", "profile", "none"];

const SOURCES = [
  { key: "attendance", label: "طلبات الدراسة الحضوري" },
  { key: "online", label: "طلبات الدراسة عن بعد" },
  { key: "chatbot", label: "الشات بوت" },
  { key: "wp", label: "نماذج الموقع" },
  { key: "regrequest", label: "طلبات التسجيل" },
  { key: "oldsite", label: "تسجيلات الموقع 2025" }
];

const pad2 = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};
const PRESETS = [
  { key: "today", label: "اليوم", range: () => [iso(new Date()), iso(new Date())] },
  { key: "7", label: "آخر 7 أيام", range: () => [daysAgo(6), iso(new Date())] },
  { key: "30", label: "آخر 30 يومًا", range: () => [daysAgo(29), iso(new Date())] },
  { key: "year", label: "هذا العام", range: () => [`${new Date().getFullYear()}-01-01`, iso(new Date())] },
  { key: "all", label: "كل الفترة", range: (first) => [first || "2025-01-01", iso(new Date())] }
];

const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const verifiable = (x) => (x?.registered || 0) + (x?.profileOnly || 0) + (x?.notRegistered || 0);
const pct = (part, total) => (total ? Math.round((1000 * part) / total) / 10 : 0);
const fmtDateTime = (s) => {
  if (!s) return "";
  const [d, t] = String(s).split(" ");
  return `${d.split("-").reverse().join("/")}${t ? ` ${t}` : ""}`;
};
const sourceLabel = (key) => SOURCES.find((s) => s.key === key)?.label || key;

const headSx = { fontWeight: 800, whiteSpace: "nowrap", fontSize: 12.5 };
const numSx = { fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

const AUTO_REFRESH_MS = 5 * 60 * 1000;

// الاهتمام في الفترة (من الـ API): مهتم جدًا = من مصدرين أو أكثر، أو 3 طلبات أو أكثر، أو الشات بوت قيّمه "مهتم جدًا"؛ مهتم = طلبين
const INTEREST = {
  hot: { label: "مهتم جدًا", color: "#ea580c" },
  warm: { label: "مهتم", color: "#ea580c" }
};

const emptyFilters = { source: "", form: "", diploma: "", search: "", interest: "" };

// ---------- مكونات صغيرة ----------
const useStatusColor = () => {
  const p = useTasksPalette();
  return (key) => (p.dark ? STATUS[key].dark : STATUS[key].light);
};

const SectionTitle = ({ title, subtitle, action }) => {
  const p = useTasksPalette();
  return (
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-end" }} spacing={1} sx={{ mb: 1.25, mt: 0.5 }}>
      <Box>
        <Typography component="h2" sx={{ fontWeight: 800, fontSize: 16, color: p.text }}>{title}</Typography>
        {subtitle ? <Typography sx={{ fontSize: 12.5, color: p.muted, mt: 0.25 }}>{subtitle}</Typography> : null}
      </Box>
      {action}
    </Stack>
  );
};

// عنوان ثابت فوق الخانة بدل الـ label العائم (rtl-forms-fix بيخليه يتكتب فوق القيمة)
const FilterField = ({ label, children }) => {
  const p = useTasksPalette();
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ display: "block", fontSize: 12.5, fontWeight: 700, color: p.muted, mb: 0.6, lineHeight: 1.4 }}>{label}</Typography>
      {children}
    </Box>
  );
};

// شارة الاهتمام جنب اسم العميل، والتلميح بيقول السبب
const InterestBadge = ({ row }) => {
  const p = useTasksPalette();
  const it = INTEREST[row.interest];
  if (!it) return null;
  const byChatbot = row.interest === "hot" && row.requests < 3 && row.sourceCount < 2;
  const why = byChatbot
    ? "قيّمه الشات بوت مهتمًا جدًا"
    : [row.sourceCount >= 2 ? `من ${fmt(row.sourceCount)} مصادر مختلفة` : null, `${fmt(row.requests)} طلبات في الفترة`].filter(Boolean).join(" — ");
  const t = p.tone(it.color);
  return (
    <Tooltip arrow title={why}>
      <Chip
        size="small"
        icon={<LocalFireDepartmentIcon />}
        label={it.label}
        sx={{
          height: 22, fontWeight: 700, fontSize: 11.5, borderRadius: 1.5, color: p.text, bgcolor: t.bg, border: "none",
          opacity: row.interest === "hot" ? 1 : 0.75,
          "& .MuiChip-icon": { color: it.color, fontSize: 15, mr: 0.4, ml: -0.25 }, "& .MuiChip-label": { px: 0.75 }
        }}
      />
    </Tooltip>
  );
};

const StatusChip = ({ status }) => {
  const p = useTasksPalette();
  const color = useStatusColor();
  const s = STATUS[status];
  if (!s) return null;
  const t = p.tone(color(status));
  return (
    <Chip
      size="small"
      icon={<s.Icon />}
      label={s.label}
      sx={{
        height: 24, fontWeight: 700, fontSize: 12, borderRadius: 1.5, color: p.text, bgcolor: t.bg, border: "none",
        "& .MuiChip-icon": { color: color(status), fontSize: 16, mr: 0.5, ml: -0.25 }, "& .MuiChip-label": { px: 1 }
      }}
    />
  );
};

const Legend = () => {
  const p = useTasksPalette();
  const color = useStatusColor();
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
      {STATUS_ORDER.map((k) => (
        <Stack key={k} direction="row" spacing={0.75} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: color(k) }} />
          <Typography sx={{ fontSize: 12, color: p.muted, fontWeight: 600 }}>{STATUS[k].short}</Typography>
        </Stack>
      ))}
    </Stack>
  );
};

// شريط التوزيع: فاصل 2px بين الأجزاء، وتلميح بالعدد والنسبة لكل جزء
const DistributionBar = ({ counts, height = 10, onPick, active }) => {
  const p = useTasksPalette();
  const color = useStatusColor();
  const total = verifiable(counts);
  return (
    <Stack direction="row" sx={{ height, gap: "2px", borderRadius: 1, overflow: "hidden", bgcolor: p.dark ? "rgba(255,255,255,0.08)" : "#e8efeb", minWidth: 120 }}>
      {total > 0 &&
        STATUS_ORDER.filter((k) => counts[STATUS[k].field] > 0).map((k) => (
          <Tooltip key={k} arrow title={`${STATUS[k].label}: ${fmt(counts[STATUS[k].field])} (${pct(counts[STATUS[k].field], total)}%)`}>
            <Box
              onClick={onPick ? (e) => { e.stopPropagation(); onPick(k); } : undefined}
              sx={{
                flexGrow: counts[STATUS[k].field], flexBasis: 0, minWidth: 4, bgcolor: color(k),
                cursor: onPick ? "pointer" : "default", opacity: active && active !== k ? 0.35 : 1, transition: "opacity .15s"
              }}
            />
          </Tooltip>
        ))}
    </Stack>
  );
};

const Kpi = ({ label, value, hint, accent, icon, onClick, selected }) => {
  const p = useTasksPalette();
  const clickable = Boolean(onClick);
  return (
    <SectionCard
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && onClick() : undefined}
      sx={{
        p: 2, flex: "1 1 200px", minWidth: 180, position: "relative", overflow: "hidden", outline: "none",
        cursor: clickable ? "pointer" : "default", transition: "all .15s",
        ...(selected ? { borderColor: accent, bgcolor: p.tone(accent).bg } : {}),
        ...(clickable ? { "&:hover, &:focus-visible": { borderColor: accent } } : {})
      }}
    >
      {accent ? <Box sx={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: 3, bgcolor: accent }} /> : null}
      <Stack direction="row" spacing={0.75} alignItems="center">
        {icon}
        <Typography sx={{ fontSize: 12.5, color: p.muted, fontWeight: 600 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: 26, fontWeight: 800, color: p.text, mt: 0.25, lineHeight: 1.3, ...numSx }}>{value}</Typography>
      {hint ? <Typography sx={{ fontSize: 12, color: p.muted, mt: 0.25 }}>{hint}</Typography> : null}
    </SectionCard>
  );
};

// الحالة المجمّعة لكل المصادر: شريط + ثلاث بطاقات قابلة للضغط
const StatusOverview = ({ summary, active, onPick }) => {
  const p = useTasksPalette();
  const color = useStatusColor();
  const total = verifiable(summary);

  return (
    <SectionCard sx={{ p: { xs: 1.75, md: 2.25 }, mb: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1} sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: 13, color: p.muted }}>
          توزيع <b style={{ color: p.text }}>{fmt(total)}</b> عميل حسب حالتهم في النظام — اضغط على أي حالة لعرض عملائها
        </Typography>
        <Legend />
      </Stack>

      <DistributionBar counts={summary || {}} height={16} onPick={onPick} active={active} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1.5, mt: 2 }}>
        {STATUS_ORDER.map((k) => {
          const s = STATUS[k];
          const value = summary?.[s.field] || 0;
          const selected = active === k;
          const t = p.tone(color(k));
          return (
            <Box
              key={k}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => onPick(k)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(k)}
              sx={{
                p: 1.75, borderRadius: 2.5, cursor: "pointer", outline: "none",
                border: `1.5px solid ${selected ? color(k) : p.border}`,
                bgcolor: selected ? t.bg : "transparent",
                opacity: active && !selected ? 0.6 : 1,
                transition: "all .15s",
                "&:hover, &:focus-visible": { borderColor: color(k), bgcolor: t.bg }
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: t.bg, flexShrink: 0 }}>
                  <s.Icon sx={{ color: color(k), fontSize: 22 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: p.text, lineHeight: 1.5 }}>{s.label}</Typography>
                  <Stack direction="row" spacing={1} alignItems="baseline">
                    <Typography sx={{ fontSize: 28, fontWeight: 800, color: p.text, lineHeight: 1.25, ...numSx }}>{fmt(value)}</Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: p.muted, ...numSx }}>{pct(value, total)}%</Typography>
                  </Stack>
                  <Typography sx={{ fontSize: 12, color: p.muted, lineHeight: 1.6 }}>{s.hint}</Typography>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Box>

      {summary?.unverifiable ? (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1.5 }}>
          <HelpOutlineIcon sx={{ fontSize: 17, color: color("unknown") }} />
          <Typography sx={{ fontSize: 12.5, color: p.muted }}>
            إضافةً إلى{" "}
            <Box component="span" role="button" tabIndex={0} onClick={() => onPick("unknown")}
              sx={{ color: p.text, fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
              {fmt(summary.unverifiable)} عميل
            </Box>{" "}
            لا يمكن التحقق من تسجيلهم لعدم وجود رقم جوال أو هوية في طلباتهم، وهم غير داخلين في النسب.
          </Typography>
        </Stack>
      ) : null}
    </SectionCard>
  );
};

// خلية رقم + نسبة، قابلة للضغط للفلترة بالمصدر والحالة
const CountCell = ({ value, total, onClick, strong }) => {
  const p = useTasksPalette();
  return (
    <TableCell align="center" onClick={onClick} sx={{ cursor: onClick && value ? "pointer" : "default", "&:hover": onClick && value ? { bgcolor: p.hover } : undefined }}>
      <Typography sx={{ fontWeight: strong ? 800 : 700, fontSize: 13.5, color: p.text, ...numSx }}>{fmt(value)}</Typography>
      {total != null ? <Typography sx={{ fontSize: 11.5, color: p.muted, ...numSx }}>{pct(value, total)}%</Typography> : null}
    </TableCell>
  );
};

// حالة التسجيل لكل مصدر (ونماذج الموقع بتتفتح لنماذجها)، وصف الإجمالي المجمّع تحت
const SourcesTable = ({ bySource, summary, filters, status, onPick }) => {
  const p = useTasksPalette();
  const [openWp, setOpenWp] = useState(false);
  const sources = bySource.filter((x) => !x.formTitle);
  const forms = bySource.filter((x) => x.formTitle);
  const hasUnknown = bySource.some((x) => x.unverifiable > 0);

  const Row = ({ x, sub }) => {
    const total = verifiable(x);
    const isActive = filters.source === x.sourceKey && (filters.form || "") === (x.formTitle || "");
    const pick = (st) => onPick({ source: x.sourceKey, form: x.formTitle || "", status: st });
    return (
      <TableRow hover selected={isActive} sx={{ cursor: "pointer", "& td": { py: 1 } }} onClick={() => onPick({ source: x.sourceKey, form: x.formTitle || "", status: "" })}>
        <TableCell sx={{ minWidth: 200 }}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ pr: sub ? 3.5 : 0 }}>
            {x.sourceKey === "wp" && !sub ? (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setOpenWp((v) => !v); }} aria-label="عرض النماذج">
                {openWp ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowLeftIcon fontSize="small" />}
              </IconButton>
            ) : null}
            <Box>
              <Typography sx={{ fontWeight: sub ? 600 : 700, fontSize: sub ? 13 : 13.5, color: p.text }}>{sub ? x.formTitle : x.sourceName}</Typography>
              <Typography sx={{ fontSize: 11.5, color: p.muted, ...numSx }}>{fmt(x.requests)} طلب</Typography>
            </Box>
          </Stack>
        </TableCell>
        <CountCell value={x.customers} strong />
        {STATUS_ORDER.map((k) => (
          <CountCell key={k} value={x[STATUS[k].field]} total={total} onClick={(e) => { e.stopPropagation(); pick(k); }} />
        ))}
        {hasUnknown ? <CountCell value={x.unverifiable} onClick={(e) => { e.stopPropagation(); pick("unknown"); }} /> : null}
        <TableCell sx={{ minWidth: 180, width: "26%" }}>
          <DistributionBar counts={x} onPick={pick} active={isActive ? status : ""} />
        </TableCell>
      </TableRow>
    );
  };

  const total = verifiable(summary);
  return (
    <SectionCard sx={{ overflow: "hidden", mb: 3 }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1} sx={{ px: 2, py: 1.5 }}>
        <Legend />
        <Stack direction="row" spacing={0.5} alignItems="center">
          <InfoOutlinedIcon sx={{ fontSize: 15, color: p.muted }} />
          <Typography sx={{ fontSize: 12, color: p.muted }}>
            العميل الذي تقدّم من أكثر من مصدر يُحتسب في كل مصدر، لذا لا يساوي مجموع المصادر الإجمالي.
          </Typography>
        </Stack>
      </Stack>
      <Divider />
      <TableContainer>
        <Table size="small" sx={{ "& td, & th": { borderColor: p.border } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headSx}>المصدر</TableCell>
              <TableCell sx={headSx} align="center">العملاء</TableCell>
              {STATUS_ORDER.map((k) => <TableCell key={k} sx={headSx} align="center">{STATUS[k].short}</TableCell>)}
              {hasUnknown ? <TableCell sx={headSx} align="center">لا يمكن التحقق</TableCell> : null}
              <TableCell sx={headSx}>التوزيع</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sources.length === 0 ? (
              <TableRow><TableCell colSpan={7} sx={{ color: p.muted, py: 3, textAlign: "center" }}>لا توجد بيانات في الفترة</TableCell></TableRow>
            ) : (
              sources.map((x) => (
                <React.Fragment key={x.sourceKey}>
                  <Row x={x} />
                  {x.sourceKey === "wp" && openWp ? forms.map((f) => <Row key={f.formTitle} x={f} sub />) : null}
                </React.Fragment>
              ))
            )}
          </TableBody>
          {sources.length > 1 ? (
            <TableFooter>
              <TableRow sx={{ bgcolor: p.nested, "& td": { borderBottom: "none", py: 1.25 } }}>
                <TableCell><Typography sx={{ fontWeight: 800, fontSize: 13.5, color: p.text }}>الإجمالي (كل المصادر)</Typography></TableCell>
                <CountCell value={summary?.customers} strong />
                {STATUS_ORDER.map((k) => <CountCell key={k} value={summary?.[STATUS[k].field]} total={total} strong />)}
                {hasUnknown ? <CountCell value={summary?.unverifiable} strong /> : null}
                <TableCell><DistributionBar counts={summary || {}} /></TableCell>
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </TableContainer>
    </SectionCard>
  );
};

// أعمدة أفقية بلون واحد (حجم) — الرقم بلون النص، والشريط بلون الثيم
const DiplomaBars = ({ items, activeKey, onPick }) => {
  const p = useTasksPalette();
  const max = Math.max(1, ...items.map((x) => x.customers));
  return (
    <SectionCard sx={{ p: 2, mb: 3 }}>
      {items.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: p.muted, py: 2, textAlign: "center" }}>لا توجد بيانات في الفترة</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, columnGap: 4, rowGap: 1.25 }}>
          {items.map((x) => (
            <Tooltip key={x.diploma} arrow placement="top" title={`${fmt(x.customers)} عميل — اضغط للفلترة`}>
              <Box
                onClick={() => onPick(x.diploma)}
                sx={{
                  cursor: "pointer", borderRadius: 1.5, px: 1, py: 0.6, mx: -1,
                  bgcolor: activeKey === x.diploma ? p.selected : "transparent", "&:hover": { bgcolor: p.hover }
                }}
              >
                <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13, color: p.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.diploma}</Typography>
                  <Typography sx={{ fontSize: 13, color: p.text, fontWeight: 700, ...numSx }}>{fmt(x.customers)}</Typography>
                </Stack>
                {/* شريط عادي بدل LinearProgress: ألوان الثيم كانت بتطلعه باهت في الداكن، والتعبئة بتبدأ من اليمين */}
                <Box sx={{ height: 8, borderRadius: 1, bgcolor: p.dark ? "rgba(255,255,255,0.08)" : "#e8efeb", overflow: "hidden" }}>
                  <Box sx={{ height: "100%", width: `${Math.max(1.5, (100 * x.customers) / max)}%`, bgcolor: p.dark ? "#4fae84" : "#057546", borderRadius: 1, transition: "width .3s" }} />
                </Box>
              </Box>
            </Tooltip>
          ))}
        </Box>
      )}
    </SectionCard>
  );
};

// ---------- تفاصيل العميل ----------
const CustomerDialog = ({ customerKey, onClose }) => {
  const p = useTasksPalette();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customerKey) return;
    setData(null);
    setError("");
    const q = new URLSearchParams({ userGuid: getUserGuid(), key: customerKey });
    fetch(`${API}/details?${q}`, { cache: "no-store" })
      .then(readJson)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [customerKey]);

  const named = data?.requests?.find((r) => r.name);
  const field = (label, value) => (
    <Box sx={{ minWidth: 140 }}>
      <Typography sx={{ fontSize: 12, color: p.muted }}>{label}</Typography>
      <Typography sx={{ fontWeight: 700, color: p.text, ...numSx }}>{value || "—"}</Typography>
    </Box>
  );

  return (
    <Dialog open={Boolean(customerKey)} onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        {named?.name || data?.student?.name || "بيانات العميل"}
        <IconButton onClick={onClose} sx={{ position: "absolute", left: 12, top: 12 }} aria-label="إغلاق">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error ? <Alert severity="error">{error}</Alert> : !data ? <CenterLoader /> : (
          <Stack spacing={2.25}>
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap alignItems="center">
              <StatusChip status={data.status} />
              {field("الجوال", data.requests.find((r) => r.mobile)?.mobile)}
              {field("رقم الهوية", data.requests.find((r) => r.nationalId)?.nationalId)}
              {field("المدينة", data.requests.find((r) => r.city)?.city)}
              {field("عدد الطلبات", fmt(data.requests.length))}
            </Stack>

            {data.student ? (
              <SectionCard sx={{ p: 1.75, bgcolor: p.nested }}>
                <Typography sx={{ fontWeight: 800, color: p.text, mb: 1 }}>ملف الطالب في النظام</Typography>
                <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                  {field("الاسم", data.student.name)}
                  {field("الجوال", data.student.mobile)}
                  {field("رقم الهوية", data.student.nationalId)}
                </Stack>
                {data.registrations.length ? (
                  <Table size="small" sx={{ mt: 1.5 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={headSx}>الدبلوم / الدورة</TableCell>
                        <TableCell sx={headSx}>الفرع</TableCell>
                        <TableCell sx={headSx}>تاريخ التسجيل</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.registrations.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.program || "—"}</TableCell>
                          <TableCell>{r.branch || "—"}</TableCell>
                          <TableCell sx={numSx}>{r.regDate ? fmtDateTime(r.regDate).split(" ")[0] : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography sx={{ fontSize: 13, color: p.muted, mt: 1 }}>لا توجد له استمارة تسجيل حتى الآن.</Typography>
                )}
              </SectionCard>
            ) : null}

            <Box>
              <Typography sx={{ fontWeight: 800, color: p.text, mb: 1 }}>سجل الطلبات</Typography>
              <TableContainer sx={{ border: `1px solid ${p.border}`, borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headSx}>التاريخ</TableCell>
                      <TableCell sx={headSx}>المصدر</TableCell>
                      <TableCell sx={headSx}>الدبلوم / المجال</TableCell>
                      <TableCell sx={headSx}>الاسم المسجّل</TableCell>
                      <TableCell sx={headSx}>المدينة</TableCell>
                      <TableCell sx={headSx}>تفاصيل</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.requests.map((r) => (
                      <TableRow key={`${r.sourceKey}:${r.sourceId}`}>
                        <TableCell sx={numSx}>{fmtDateTime(r.createdAt)}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{r.formTitle || r.sourceName}</TableCell>
                        <TableCell>{r.diploma || "—"}</TableCell>
                        <TableCell>{r.name || "—"}</TableCell>
                        <TableCell>{r.city || "—"}</TableCell>
                        <TableCell sx={{ maxWidth: 320, fontSize: 12.5, lineHeight: 1.7 }}>{[r.status, r.notes].filter(Boolean).join(" — ") || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ---------- التصدير ----------
const exportExcel = async ({ rows, summary, bySource, byDiploma, fromDate, toDate, status }) => {
  const wb = new ExcelJS.Workbook();
  const header = (ws) => {
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF057546" } };
  };
  const total = verifiable(summary);

  const s = wb.addWorksheet("الملخص", { views: [{ rightToLeft: true }] });
  s.columns = [{ header: "البند", key: "k", width: 44 }, { header: "العدد", key: "v", width: 14 }, { header: "النسبة", key: "pc", width: 10 }];
  s.addRow({ k: `الفترة: ${fromDate} إلى ${toDate}` });
  s.addRow({ k: "إجمالي العملاء", v: summary?.customers || 0 });
  s.addRow({ k: "إجمالي الطلبات", v: summary?.requests || 0 });
  s.addRow({ k: "مهتمون جدًا (من مصدرين أو أكثر، أو 3 طلبات أو أكثر)", v: summary?.hot || 0 });
  s.addRow({ k: "مهتمون جدًا لم يسجّلوا بعد", v: summary?.hotOpen || 0 });
  STATUS_ORDER.forEach((k) => s.addRow({ k: STATUS[k].label, v: summary?.[STATUS[k].field] || 0, pc: `${pct(summary?.[STATUS[k].field], total)}%` }));
  if (summary?.unverifiable) s.addRow({ k: `${STATUS.unknown.label} (خارج النسب)`, v: summary.unverifiable });
  s.addRow({});
  s.addRow({ k: "أكثر الدبلومات طلبًا (عدد العملاء)" }).font = { bold: true };
  byDiploma.forEach((x) => s.addRow({ k: x.diploma, v: x.customers }));
  header(s);

  const src = wb.addWorksheet("حسب المصدر", { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
  src.columns = [
    { header: "المصدر", key: "source", width: 34 },
    { header: "النموذج", key: "form", width: 26 },
    { header: "الطلبات", key: "requests", width: 10 },
    { header: "العملاء", key: "customers", width: 10 },
    ...STATUS_ORDER.flatMap((k) => [
      { header: STATUS[k].short, key: k, width: 16 },
      { header: `نسبة ${STATUS[k].short}`, key: `${k}Pct`, width: 16 }
    ]),
    { header: STATUS.unknown.label, key: "unknown", width: 14 }
  ];
  bySource.forEach((x) => {
    const t = verifiable(x);
    src.addRow({
      source: x.sourceName, form: x.formTitle || "", requests: x.requests, customers: x.customers, unknown: x.unverifiable,
      ...Object.fromEntries(STATUS_ORDER.flatMap((k) => [[k, x[STATUS[k].field]], [`${k}Pct`, `${pct(x[STATUS[k].field], t)}%`]]))
    });
  });
  header(src);

  const ws = wb.addWorksheet("العملاء", { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "الاسم", key: "name", width: 30 },
    { header: "الجوال", key: "mobile", width: 16 },
    { header: "رقم الهوية", key: "nationalId", width: 14 },
    { header: "البريد", key: "email", width: 26 },
    { header: "المدينة", key: "city", width: 18 },
    { header: "الدبلومات المطلوبة", key: "diplomas", width: 40 },
    { header: "المصادر", key: "sources", width: 40 },
    { header: "عدد الطلبات", key: "requests", width: 12 },
    { header: "الاهتمام", key: "interest", width: 12 },
    { header: "أول طلب", key: "firstAt", width: 18 },
    { header: "آخر طلب", key: "lastAt", width: 18 },
    { header: "حالة التسجيل", key: "status", width: 30 },
    { header: "اسم ملف الطالب", key: "studentName", width: 30 }
  ];
  rows.forEach((r) => ws.addRow({ ...r, interest: INTEREST[r.interest]?.label || "", status: STATUS[r.status]?.label || "", firstAt: fmtDateTime(r.firstAt), lastAt: fmtDateTime(r.lastAt) }));
  header(ws);

  const suffix = status ? ` - ${STATUS[status].label}` : "";
  saveAs(new Blob([await wb.xlsx.writeBuffer()]), `بيانات العملاء الموحدة ${fromDate} إلى ${toDate}${suffix}.xlsx`);
};

// ---------- الصفحة ----------
export default function CustomersHub() {
  const p = useTasksPalette();
  const userGuid = getUserGuid();
  const [options, setOptions] = useState({ diplomas: [], forms: [], firstDate: null });
  const [[fromDate, toDate], setRange] = useState(PRESETS[2].range());
  const [preset, setPreset] = useState("30");
  const [filters, setFilters] = useState(emptyFilters);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [openKey, setOpenKey] = useState(null);
  const [distOpen, setDistOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const requestSeq = useRef(0);
  // الصفحات اللي اتحملت (والصفحة التالية بتتحمل مقدمًا) — بتتمسح مع أي تحديث للبيانات
  const pageCache = useRef(new Map());
  const [tableBusy, setTableBusy] = useState(false);

  const query = useCallback(
    (over = {}) => {
      const { silent, ...rest } = over;
      const q = { userGuid, fromDate, toDate, ...filters, status, page: page + 1, pageSize, ...rest };
      return new URLSearchParams(Object.fromEntries(Object.entries(q).filter(([, v]) => v !== "" && v != null)));
    },
    [userGuid, fromDate, toDate, filters, status, page, pageSize]
  );

  const remember = (key, result) => {
    pageCache.current.set(key, result);
    if (pageCache.current.size > 40) pageCache.current.delete(pageCache.current.keys().next().value);
  };

  const load = useCallback(
    async (over = {}) => {
      const from = over.fromDate ?? fromDate;
      const to = over.toDate ?? toDate;
      if (!from || !to) return;
      if (from > to) {
        setError("تاريخ البداية يجب ألا يتجاوز تاريخ النهاية.");
        return;
      }
      if (over.silent) pageCache.current.clear();
      const key = query(over).toString();

      // تحميل الصفحة التالية في الخلفية عشان "التالي" يفتح على طول
      const prefetchNext = (result) => {
        const current = over.page ?? page + 1;
        const size = over.pageSize ?? pageSize;
        if (!result || current * size >= result.total) return;
        const nextKey = query({ ...over, page: current + 1 }).toString();
        if (pageCache.current.has(nextKey)) return;
        fetch(`${API}?${nextKey}`, { cache: "no-store" })
          .then(readJson)
          .then((r) => remember(nextKey, r))
          .catch(() => {});
      };

      if (!over.silent && pageCache.current.has(key)) {
        requestSeq.current++;
        const cached = pageCache.current.get(key);
        setData(cached);
        setLoading(false);
        setTableBusy(false);
        prefetchNext(cached);
        return;
      }

      const seq = ++requestSeq.current;
      setLoading(true);
      if (!over.silent) setTableBusy(true);
      try {
        const result = await readJson(await fetch(`${API}?${key}`, { cache: "no-store" }));
        if (seq !== requestSeq.current) return;
        remember(key, result);
        setData(result);
        setError("");
        prefetchNext(result);
      } catch (e) {
        if (seq !== requestSeq.current) return;
        if (e.status === 403) setForbidden(true);
        // التحديث التلقائي الصامت ميطلعش رسالة لو فيه بيانات معروضة أصلًا
        else if (!over.silent) setError(e.message);
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
          setTableBusy(false);
        }
      }
    },
    [fromDate, toDate, query, page, pageSize]
  );

  // تحديث تلقائي في الخلفية كل 5 دقائق (نفس معدل المزامنة) طالما الصفحة ظاهرة، بنفس الفلاتر والصفحة
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") loadRef.current({ silent: true });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch(`${API}/options?${new URLSearchParams({ userGuid })}`, { cache: "no-store" })
      .then(readJson)
      .then(setOptions)
      .catch((e) => e.status === 403 && setForbidden(true));
    load();
    // التحميل الأول فقط؛ بعده بزر "عرض" والفلاتر
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // كل تغيير في الفلترة بيرجع لأول صفحة
  const reload = (patch) => {
    setPage(0);
    load({ ...patch, page: 1 });
  };

  const applyPreset = (key) => {
    const found = PRESETS.find((x) => x.key === key);
    if (!found) return;
    const [f, t] = found.range(options.firstDate);
    setPreset(key);
    setRange([f, t]);
    reload({ fromDate: f, toDate: t });
  };

  // البحث بيتطبق لوحده بعد ما يقف عن الكتابة
  const searchTimer = useRef(null);
  const onSearch = (value) => {
    setFilters((x) => ({ ...x, search: value }));
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => reload({ search: value }), 600);
  };
  // المصدر ونماذج الموقع في قائمة واحدة: "wp|اسم النموذج"
  const sourceValue = filters.form ? `wp|${filters.form}` : filters.source;
  const onSource = (value) => {
    const [source, form = ""] = String(value).split("|");
    changeFilters({ source, form });
  };
  const onDates = (from, to) => {
    setPreset("");
    setRange([from, to]);
    if (from && to && from <= to) reload({ fromDate: from, toDate: to });
  };
  const changeFilters = (patch) => {
    setFilters((x) => ({ ...x, ...patch }));
    reload(patch);
  };
  const resetFilters = () => {
    setFilters(emptyFilters);
    setStatus("");
    reload({ ...emptyFilters, status: "" });
  };

  const pickStatus = (key) => {
    const next = status === key ? "" : key;
    setStatus(next);
    reload({ status: next });
  };
  // من جدول المصادر: الضغط على الصف = المصدر، على رقم أو جزء من الشريط = المصدر + الحالة
  const pickSource = ({ source, form, status: st }) => {
    const same = filters.source === source && filters.form === form && status === st;
    const patch = same ? { source: "", form: "", status: "" } : { source, form, status: st };
    setFilters((x) => ({ ...x, source: patch.source, form: patch.form }));
    setStatus(patch.status);
    reload(patch);
    if (!same) document.getElementById("customers-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const pickDiploma = (name) => changeFilters({ diploma: filters.diploma === name ? "" : name });

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await readJson(
        await fetch(`${API}/sync`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userGuid }) })
      );
      if (r.inserted) toast(`${fmt(r.inserted)} طلب جديد أو محدّث`);
      await load({ silent: true });
    } catch {
      // البيانات الحالية تفضل ظاهرة، والتنبيه بيظهر في شريط "تعذر آخر تحديث"
      await load({ silent: true });
    } finally {
      setSyncing(false);
    }
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const all = await readJson(await fetch(`${API}?${query({ export: "true", page: 1 })}`, { cache: "no-store" }));
      await exportExcel({ ...all, fromDate, toDate, status });
    } catch (e) {
      showError(e);
    } finally {
      setExporting(false);
    }
  };

  // الفلاتر المطبّقة كشارات قابلة للإزالة
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.source) chips.push({ key: "source", label: `المصدر: ${sourceLabel(filters.source)}`, clear: { source: "", form: "" } });
    if (filters.form) chips.push({ key: "form", label: `النموذج: ${filters.form}`, clear: { form: "" } });
    if (filters.diploma) chips.push({ key: "diploma", label: `الدبلوم: ${filters.diploma}`, clear: { diploma: "" } });
    if (filters.search) chips.push({ key: "search", label: `بحث: ${filters.search}`, clear: { search: "" } });
    if (filters.interest) chips.push({ key: "interest", label: `الاهتمام: ${INTEREST[filters.interest].label}`, clear: { interest: "" } });
    if (status) chips.push({ key: "status", label: `الحالة: ${STATUS[status].label}`, status: true });
    return chips;
  }, [filters, status]);

  if (forbidden) return <NoAccess message="ليس لديك صلاحية على شاشة بيانات العملاء الموحدة." />;

  const summary = data?.summary;
  const rows = data?.rows || [];
  const registeredRate = pct(summary?.registered, verifiable(summary));

  return (
    <TasksPageShell
      icon={<ContactPhoneIcon />}
      title="بيانات العملاء الموحدة"
      subtitle={
        <>
          طلبات العملاء من كل المصادر في مكان واحد — لكل رقم جوال سجل واحد مع حالة تسجيله في النظام
          <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 12, mt: 0.5, minHeight: 18, ...numSx }}>
            {syncing ? (
              <><CircularProgress size={11} thickness={6} /> جارٍ تحديث البيانات من المصادر في الخلفية…</>
            ) : loading && data ? (
              <><CircularProgress size={11} thickness={6} /> جارٍ التحديث…</>
            ) : data?.lastSyncAt ? (
              <>آخر تحديث للبيانات: {fmtDateTime(data.lastSyncAt)}</>
            ) : null}
          </Box>
        </>
      }
      actions={
        <>
          <Button variant="outlined" startIcon={<SyncIcon sx={syncing ? { animation: "chSpin 1s linear infinite", "@keyframes chSpin": { to: { transform: "rotate(-360deg)" } } } : undefined} />} onClick={sync} disabled={syncing} sx={{ whiteSpace: "nowrap" }}>
            تحديث البيانات
          </Button>
          {data?.canDistribute ? (
            <>
              <Button variant="outlined" startIcon={<GroupsIcon />} onClick={() => setDistOpen(true)} sx={{ whiteSpace: "nowrap" }}>
                توزيع العملاء
              </Button>
              <Button variant="outlined" startIcon={<InsightsIcon />} onClick={() => setResultsOpen(true)} sx={{ whiteSpace: "nowrap" }}>
                نتائج التوزيع
              </Button>
            </>
          ) : null}
          <Button variant="contained" startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />} onClick={doExport} disabled={!data || exporting} sx={{ whiteSpace: "nowrap" }}>
            تصدير Excel
          </Button>
        </>
      }
    >
      {/* الفترة والفلاتر — كل اختيار بيتطبق لوحده */}
      <SectionCard sx={{ p: 2, mb: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ pt: { md: 2.5 } }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: p.muted, ml: 0.5 }}>الفترة:</Typography>
            {PRESETS.map((x) => (
              <Chip key={x.key} label={x.label} clickable onClick={() => applyPreset(x.key)}
                color={preset === x.key ? "primary" : "default"} variant={preset === x.key ? "filled" : "outlined"} />
            ))}
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <FilterField label="من تاريخ">
              <TextField type="date" size="small" fullWidth value={fromDate} onChange={(e) => onDates(e.target.value, toDate)} />
            </FilterField>
            <FilterField label="إلى تاريخ">
              <TextField type="date" size="small" fullWidth value={toDate} onChange={(e) => onDates(fromDate, e.target.value)} />
            </FilterField>
          </Stack>
        </Stack>

        <Box sx={{ display: "grid", gap: 1.5, mt: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1.6fr 1fr 1fr 1fr 0.9fr" } }}>
          <FilterField label="بحث">
            <TextField
              size="small" fullWidth placeholder="ابحث باسم العميل أو رقم الجوال أو الهوية" value={filters.search}
              onChange={(e) => onSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                endAdornment: filters.search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" aria-label="مسح البحث" onClick={() => { clearTimeout(searchTimer.current); changeFilters({ search: "" }); }}><CloseIcon fontSize="small" /></IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </FilterField>
          <FilterField label="المصدر">
            <TextField select size="small" fullWidth value={sourceValue} onChange={(e) => onSource(e.target.value)} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">كل المصادر</MenuItem>
              {SOURCES.map((x) => <MenuItem key={x.key} value={x.key}>{x.label}</MenuItem>)}
              {options.forms.length ? <ListSubheader sx={{ fontWeight: 800, lineHeight: "36px" }}>نماذج الموقع بالتفصيل</ListSubheader> : null}
              {options.forms.map((f) => <MenuItem key={f} value={`wp|${f}`} sx={{ pr: 3 }}>{f}</MenuItem>)}
            </TextField>
          </FilterField>
          <FilterField label="الدبلوم">
            <TextField select size="small" fullWidth value={filters.diploma} onChange={(e) => changeFilters({ diploma: e.target.value })} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">كل الدبلومات</MenuItem>
              {(options.diplomas.length ? options.diplomas : (data?.byDiploma || []).map((x) => x.diploma)).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </FilterField>
          <FilterField label="حالة التسجيل">
            <TextField select size="small" fullWidth value={status} onChange={(e) => { setStatus(e.target.value); reload({ status: e.target.value }); }} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">كل الحالات</MenuItem>
              {[...STATUS_ORDER, "unknown"].map((k) => {
                const S = STATUS[k];
                return (
                  <MenuItem key={k} value={k}>
                    <Stack direction="row" spacing={1} alignItems="center"><S.Icon sx={{ fontSize: 18, color: p.dark ? S.dark : S.light }} /><span>{S.label}</span></Stack>
                  </MenuItem>
                );
              })}
            </TextField>
          </FilterField>
          <FilterField label="الاهتمام">
            <TextField select size="small" fullWidth value={filters.interest} onChange={(e) => changeFilters({ interest: e.target.value })} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">كل العملاء</MenuItem>
              {["hot", "warm"].map((k) => (
                <MenuItem key={k} value={k}>
                  <Stack direction="row" spacing={1} alignItems="center"><LocalFireDepartmentIcon sx={{ fontSize: 18, color: INTEREST[k].color, opacity: k === "hot" ? 1 : 0.6 }} /><span>{INTEREST[k].label}</span></Stack>
                </MenuItem>
              ))}
            </TextField>
          </FilterField>
        </Box>

        {activeChips.length ? (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mt: 1.5 }}>
            <Typography sx={{ fontSize: 12.5, color: p.muted, ml: 0.5 }}>المطبّق:</Typography>
            {activeChips.map((c) => (
              <Chip key={c.key} size="small" label={c.label} variant="outlined"
                onDelete={() => (c.status ? pickStatus(status) : changeFilters(c.clear))} sx={{ color: p.text }} />
            ))}
            <Button size="small" startIcon={<FilterAltOffIcon />} onClick={resetFilters}>إلغاء الكل</Button>
          </Stack>
        ) : null}
      </SectionCard>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {data?.lastSyncError ? (
        <Alert severity="warning" sx={{ mb: 2 }}>تعذر آخر تحديث لأحد المصادر (نماذج الموقع أو الشات بوت)، والبيانات المعروضة حتى {fmtDateTime(data.lastSyncAt)}.</Alert>
      ) : null}

      {!data ? (
        loading ? <CenterLoader /> : null
      ) : (
        <Box>
          {/* نظرة عامة */}
          <SectionTitle title="نظرة عامة — كل المصادر" subtitle={`الفترة من ${fmtDateTime(fromDate)} إلى ${fmtDateTime(toDate)}`} />
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
            <Kpi label="إجمالي العملاء" value={fmt(summary?.customers)} hint="رقم الجوال الواحد = عميل واحد" />
            <Kpi label="إجمالي الطلبات" value={fmt(summary?.requests)} hint="من كل المصادر في الفترة" />
            <Kpi label="نسبة المسجّلين" value={`${registeredRate}%`} hint={`${fmt(summary?.registered)} عميل مسجّل لدينا`} accent={STATUS.registered.light} />
            <Kpi
              label="مهتمون جدًا" value={fmt(summary?.hot)} accent={INTEREST.hot.color}
              icon={<LocalFireDepartmentIcon sx={{ fontSize: 17, color: INTEREST.hot.color }} />}
              hint={`منهم ${fmt(summary?.hotOpen)} لم يسجّلوا بعد — اضغط لعرضهم`}
              selected={filters.interest === "hot"}
              onClick={() => changeFilters({ interest: filters.interest === "hot" ? "" : "hot" })}
            />
          </Stack>
          <StatusOverview summary={summary} active={status} onPick={pickStatus} />

          {/* لكل مصدر */}
          <SectionTitle title="حالة التسجيل حسب المصدر" subtitle="اضغط على المصدر لعرض عملائه، أو على أي رقم لعرض عملاء هذه الحالة من هذا المصدر" />
          <SourcesTable bySource={data.bySource || []} summary={summary} filters={filters} status={status} onPick={pickSource} />

          {/* الدبلومات */}
          <SectionTitle title="أكثر الدبلومات طلبًا" subtitle="عدد العملاء لكل دبلوم بعد توحيد أسماء الدبلومات — اضغط للفلترة" />
          <DiplomaBars items={data.byDiploma || []} activeKey={filters.diploma} onPick={pickDiploma} />

          {/* العملاء */}
          <Box id="customers-table" sx={{ scrollMarginTop: 16 }}>
            <SectionTitle
              title={status ? `العملاء — ${STATUS[status].label}` : "العملاء"}
              subtitle={`${fmt(data.total)} عميل مرتبين من الأحدث طلبًا — اضغط على العميل لعرض ملفه وكل طلباته`}
            />
          </Box>
          <SectionCard sx={{ overflow: "hidden", position: "relative" }} aria-busy={tableBusy}>
            <Box sx={{ position: "absolute", top: 0, insetInline: 0, height: 3, overflow: "hidden", zIndex: 2, opacity: tableBusy ? 1 : 0, transition: "opacity .2s" }}>
              <Box sx={{
                width: "35%", height: "100%", borderRadius: 2, bgcolor: p.dark ? "#4fae84" : "#057546",
                animation: tableBusy ? "chGridLoad 1.1s ease-in-out infinite" : "none",
                "@keyframes chGridLoad": { "0%": { transform: "translateX(120%)" }, "100%": { transform: "translateX(-300%)" } }
              }} />
            </Box>
            {tableBusy ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{
                position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 3, px: 1.75, py: 0.75,
                borderRadius: 5, bgcolor: p.card, border: `1px solid ${p.borderStrong}`, boxShadow: "0 6px 20px rgba(0,0,0,.18)"
              }}>
                <CircularProgress size={14} thickness={6} />
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: p.text, whiteSpace: "nowrap" }}>جارٍ تحميل العملاء…</Typography>
              </Stack>
            ) : null}
            <Box sx={{ opacity: tableBusy ? 0.45 : 1, pointerEvents: tableBusy ? "none" : "auto", transition: "opacity .2s" }}>
            {rows.length === 0 ? (
              <Box sx={{ p: 2 }}><EmptyState text="لا يوجد عملاء بهذه الفلاتر" hint="جرّب فترة أطول أو ألغِ بعض الفلاتر" /></Box>
            ) : (
              <TableContainer>
                <Table size="small" sx={{ "& td, & th": { borderColor: p.border }, "& tbody td": { py: 1 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headSx}>العميل</TableCell>
                      <TableCell sx={headSx}>الجوال</TableCell>
                      <TableCell sx={headSx}>المدينة</TableCell>
                      <TableCell sx={headSx}>الدبلومات المطلوبة</TableCell>
                      <TableCell sx={headSx}>المصادر</TableCell>
                      <TableCell sx={headSx} align="center">الطلبات</TableCell>
                      <TableCell sx={headSx}>آخر طلب</TableCell>
                      <TableCell sx={headSx}>حالة التسجيل</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.key} hover sx={{ cursor: "pointer" }} onClick={() => setOpenKey(r.key)}>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: r.name ? p.text : p.muted }}>{r.name || "بدون اسم"}</Typography>
                            <InterestBadge row={r} />
                          </Stack>
                          {r.studentName && r.studentName.trim() !== (r.name || "").trim() ? (
                            <Typography sx={{ fontSize: 12, color: p.muted }}>في النظام: {r.studentName}</Typography>
                          ) : null}
                        </TableCell>
                        <TableCell sx={numSx} dir="ltr" align="right">{r.mobile || "—"}</TableCell>
                        <TableCell>{r.city || "—"}</TableCell>
                        <TableCell sx={{ minWidth: 200, fontSize: 13 }}>{r.diplomas || "—"}</TableCell>
                        <TableCell sx={{ minWidth: 170 }}>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {r.sourceKeys.map((k) => (
                              <Chip key={k} size="small" variant="outlined" label={sourceLabel(k)} sx={{ height: 22, fontSize: 11.5, color: p.text, borderColor: p.borderStrong }} />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell align="center" sx={{ ...numSx, fontWeight: 700 }}>{fmt(r.requests)}</TableCell>
                        <TableCell sx={numSx}>{fmtDateTime(r.lastAt)}</TableCell>
                        <TableCell><StatusChip status={r.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            </Box>
            <TablePagination
              component="div"
              count={data.total}
              page={page}
              rowsPerPage={pageSize}
              rowsPerPageOptions={[25, 50, 100, 200]}
              onPageChange={(_, next) => {
                if (tableBusy) return;
                setPage(next);
                load({ page: next + 1 });
                document.getElementById("customers-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              backIconButtonProps={{ disabled: tableBusy || page === 0, "aria-label": "الصفحة السابقة" }}
              nextIconButtonProps={{ disabled: tableBusy || (page + 1) * pageSize >= data.total, "aria-label": "الصفحة التالية" }}
              SelectProps={{ disabled: tableBusy }}
              onRowsPerPageChange={(e) => { const size = Number(e.target.value); setPageSize(size); setPage(0); load({ pageSize: size, page: 1 }); }}
              labelRowsPerPage="عدد الصفوف:"
              labelDisplayedRows={({ from, to, count }) => `${fmt(from)}–${fmt(to)} من ${fmt(count)}`}
              sx={{ direction: "rtl", borderTop: `1px solid ${p.border}` }}
            />
          </SectionCard>
        </Box>
      )}

      <CustomerDialog customerKey={openKey} onClose={() => setOpenKey(null)} />
      <DistributionResults open={resultsOpen} onClose={() => setResultsOpen(false)} />
      <CustomersDistribution
        open={distOpen}
        onClose={() => setDistOpen(false)}
        filters={{ fromDate, toDate, source: filters.source, form: filters.form, diploma: filters.diploma, interest: filters.interest }}
        filterChips={[
          `الفترة: ${fmtDateTime(fromDate)} – ${fmtDateTime(toDate)}`,
          filters.form ? `النموذج: ${filters.form}` : filters.source ? `المصدر: ${sourceLabel(filters.source)}` : "كل المصادر",
          filters.diploma ? `الدبلوم: ${filters.diploma}` : "كل الدبلومات",
          filters.interest ? `الاهتمام: ${INTEREST[filters.interest].label}` : "كل مستويات الاهتمام"
        ]}
        onDone={() => load({ silent: true })}
      />
    </TasksPageShell>
  );
}
