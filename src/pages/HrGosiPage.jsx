import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Tooltip
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SearchIcon from "@mui/icons-material/Search";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import { SSTLI_API_URL } from "../config/apiUrls";

/*
  التأمينات الاجتماعية — شاشة استعلام مستقلة (GOSI — Engagement Deduction API):
  تُدخل رقم الهوية / الإقامة فيرجع رد التأمينات كما هو (بدون ربط بموظفينا أو بالمنشآت).
  - الإعدادات (صلاحية التعديل): حسابات الربط (رقم المنشأة في التأمينات + client_id
    + client_secret + المفتاح الخاص) — السري يُحفظ مشفّرًا ولا يُعرض مرة أخرى.
  - سجل الاستعلامات: كل استعلام يُحفظ بالرد الكامل.
*/

const API = `${SSTLI_API_URL}/api/hr/gosi`;

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";
const gosiNavy = "#1b2a5e";

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

const formatRate = (value) =>
  value === null || value === undefined ? "—" : `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 4 })}%`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("ar-EG-u-nu-latn", { dateStyle: "medium", timeStyle: "short" }) : "—";

const envLabel = (env) => (env === "sandbox" ? "التجريبية" : "الفعلية");

const fieldLabel = (text) => (
  <Box sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", mb: 0.4 }}>{text}</Box>
);

// تحويل الرد إلى أسطر (المسار ← القيمة) لعرضه مهما كان شكله
const flattenJson = (value, path = "", rows = []) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenJson(item, `${path}[${index + 1}]`, rows));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => flattenJson(child, path ? `${path} › ${key}` : key, rows));
  } else {
    rows.push({ path, value: value === null ? "—" : String(value) });
  }
  return rows;
};

// قيم التأمينات المعروفة بالعربي
const STATUS_AR = { ACTIVE: "نشط", INACTIVE: "غير نشط", TERMINATED: "منتهي", SUSPENDED: "موقوف" };
const TYPE_AR = { "Full Time": "دوام كامل", "Part Time": "دوام جزئي" };

const textOf = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return value.arabic || value.english || "";
  return String(value);
};

const formatDay = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("ar-EG-u-nu-latn", { year: "numeric", month: "long", day: "numeric" });
};

// مدة الاشتراك من تاريخ البداية حتى اليوم
const durationSince = (value) => {
  const start = new Date(value);
  if (!value || Number.isNaN(start.getTime())) return "";
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 1) return "أقل من شهر";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? `${years} سنة` : "", rest ? `${rest} شهر` : ""].filter(Boolean).join(" و");
};

const rateText = (value) =>
  value === null || value === undefined || value === "" ? "—" : `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 4 })}%`;

// ===================== عرض النتيجة =====================
const ResultView = ({ result }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const border = isDark ? alpha(theme.palette.success.light, 0.22) : "#e3eee8";
  const strong = isDark ? theme.palette.text.primary : "#14231c";
  const [showRaw, setShowRaw] = useState(false);

  const parsed = useMemo(() => {
    if (!result?.responseJson) return null;
    try {
      return JSON.parse(result.responseJson);
    } catch {
      return null;
    }
  }, [result]);

  const rows = useMemo(() => (parsed ? flattenJson(parsed) : []), [parsed]);

  if (!result) return null;

  const engagements = parsed?.engagements ? (Array.isArray(parsed.engagements) ? parsed.engagements : [parsed.engagements]) : [];
  const nameAr = textOf(parsed?.fullName?.arabic ? parsed.fullName.arabic : parsed?.fullName).trim();
  const nameEn = (parsed?.fullName?.english || "").trim();
  const personStatus = parsed?.status;

  const statusChip = (status) => {
    const active = String(status || "").toUpperCase() === "ACTIVE";
    return (
      <Box
        component="span"
        sx={{
          fontSize: 12,
          fontWeight: 900,
          px: 1.2,
          py: 0.3,
          borderRadius: 99,
          color: active ? "#fff" : accentColor,
          backgroundColor: active ? primaryColor : alpha(accentColor, 0.1)
        }}
      >
        {STATUS_AR[String(status || "").toUpperCase()] || status || "—"}
      </Box>
    );
  };

  const infoTile = (label, value, sub) => (
    <Box sx={{ p: 1.3, borderRadius: "14px", border: `1px solid ${border}`, backgroundColor: isDark ? alpha("#fff", 0.02) : "#fbfdfc" }}>
      <Box sx={{ fontSize: 11.5, fontWeight: 800, color: "text.secondary" }}>{label}</Box>
      <Box sx={{ fontSize: 15, fontWeight: 950, color: strong, mt: 0.3 }}>{value}</Box>
      {sub && <Box sx={{ fontSize: 11.5, fontWeight: 700, color: "text.secondary", mt: 0.2 }}>{sub}</Box>}
    </Box>
  );

  return (
    <Stack spacing={1.6}>
      {/* الحالة */}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip
          icon={result.success ? <CheckCircleRoundedIcon /> : <ErrorRoundedIcon />}
          color={result.success ? "success" : "error"}
          label={result.success ? "تم الاستعلام بنجاح" : "فشل الاستعلام"}
          sx={{ fontWeight: 900 }}
        />
        {result.accountName && <Chip variant="outlined" label={result.accountName} sx={{ fontWeight: 700 }} />}
        <Chip variant="outlined" label={`البيئة ${envLabel(result.environment)}`} sx={{ fontWeight: 700 }} />
        <Chip variant="outlined" label={formatDate(result.queriedAt)} sx={{ fontWeight: 700 }} />
      </Stack>

      {!result.success && (
        <Box sx={{ p: 1.4, borderRadius: "12px", color: accentColor, backgroundColor: alpha(accentColor, 0.08), fontWeight: 800, fontSize: 13.5 }}>
          {result.errorMessage}
        </Box>
      )}

      {/* بطاقة الشخص */}
      {result.success && parsed && (
        <Box
          sx={{
            p: { xs: 1.6, md: 2 },
            borderRadius: "18px",
            color: "#fff",
            background: `linear-gradient(135deg, ${gosiNavy} 0%, ${primaryDark} 100%)`,
            display: "flex",
            alignItems: "center",
            gap: 1.8,
            flexWrap: "wrap"
          }}
        >
          <Box sx={{ width: 64, height: 64, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 950, backgroundColor: "rgba(255,255,255,.16)" }}>
            {(nameAr || nameEn || "؟").trim().charAt(0)}
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ fontSize: { xs: 19, md: 23 }, fontWeight: 950, lineHeight: 1.35 }}>{nameAr || nameEn || "—"}</Box>
            {nameEn && nameAr && <Box sx={{ fontSize: 13, fontWeight: 700, opacity: 0.85, direction: "ltr", textAlign: "right" }}>{nameEn}</Box>}
            <Box sx={{ fontSize: 13, fontWeight: 800, opacity: 0.9, mt: 0.4 }}>
              رقم الهوية / الإقامة: <bdi dir="ltr">{parsed?.identity?.nin || parsed?.identity?.iqama || result.nationalId}</bdi>
            </Box>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Box sx={{ fontSize: 11.5, opacity: 0.8, fontWeight: 800, mb: 0.5 }}>حالة المشترك</Box>
            {statusChip(personStatus)}
          </Box>
        </Box>
      )}

      {/* الاشتراكات */}
      {result.success &&
        engagements.map((eng, index) => {
          const coverage = Array.isArray(eng?.coverage) ? eng.coverage : [];
          const totalEmployee = coverage.reduce((s, c) => s + Number(c?.employeeDeductionRate || 0), 0);
          const totalEmployer = coverage.reduce((s, c) => s + Number(c?.employerDeductionRate || 0), 0);
          return (
            <Box key={index} sx={{ borderRadius: "18px", border: `1px solid ${border}`, overflow: "hidden" }}>
              <Box sx={{ px: 1.8, py: 1.2, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", borderBottom: `1px solid ${border}`, backgroundColor: alpha(gosiNavy, isDark ? 0.25 : 0.05) }}>
                <Box sx={{ fontWeight: 950, fontSize: 15.5, color: strong, flex: 1 }}>
                  الاشتراك{engagements.length > 1 ? ` ${index + 1}` : ""} — منشأة رقم <bdi dir="ltr">{eng?.registrationNumber ?? "—"}</bdi>
                </Box>
                {statusChip(eng?.status)}
              </Box>

              <Box sx={{ p: 1.6 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1 }}>
                  {infoTile("تاريخ بداية الاشتراك", formatDay(eng?.startDate), durationSince(eng?.startDate))}
                  {infoTile("نوع الدوام", TYPE_AR[eng?.type] || textOf(eng?.type) || "—")}
                  {infoTile("إجمالي خصم الموظف", rateText(totalEmployee))}
                  {infoTile("إجمالي حصة صاحب العمل", rateText(totalEmployer))}
                </Box>

                {coverage.length > 0 && (
                  <Box sx={{ mt: 1.6, borderRadius: "14px", border: `1px solid ${border}`, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                      <thead>
                        <tr style={{ background: isDark ? alpha("#fff", 0.04) : "#f4f8f6" }}>
                          <th style={{ textAlign: "right", padding: "10px 14px", fontWeight: 900 }}>فرع التأمين</th>
                          <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 900 }}>نسبة الموظف</th>
                          <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 900 }}>نسبة صاحب العمل</th>
                          <th style={{ textAlign: "center", padding: "10px 14px", fontWeight: 900 }}>الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coverage.map((c, i) => (
                          <tr key={i} style={{ borderTop: `1px solid ${border}` }}>
                            <td style={{ padding: "10px 14px", fontWeight: 900 }}>
                              {textOf(c?.name?.arabic ? c.name.arabic : c?.name) || "—"}
                              {c?.name?.english && (
                                <Box component="span" sx={{ fontSize: 11.5, fontWeight: 700, color: "text.secondary", mx: 0.8 }}>{c.name.english}</Box>
                              )}
                            </td>
                            <td style={{ textAlign: "center", padding: "10px 14px", fontWeight: 900, color: primaryColor }}>{rateText(c?.employeeDeductionRate)}</td>
                            <td style={{ textAlign: "center", padding: "10px 14px", fontWeight: 900, color: isDark ? theme.palette.info.light : gosiNavy }}>{rateText(c?.employerDeductionRate)}</td>
                            <td style={{ textAlign: "center", padding: "10px 14px", fontWeight: 900 }}>
                              {rateText(Number(c?.employeeDeductionRate || 0) + Number(c?.employerDeductionRate || 0))}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: `2px solid ${border}`, background: isDark ? alpha(primaryColor, 0.12) : alpha(primaryColor, 0.06) }}>
                          <td style={{ padding: "10px 14px", fontWeight: 950 }}>الإجمالي</td>
                          <td style={{ textAlign: "center", padding: "10px 14px", fontWeight: 950, color: primaryColor }}>{rateText(totalEmployee)}</td>
                          <td style={{ textAlign: "center", padding: "10px 14px", fontWeight: 950, color: isDark ? theme.palette.info.light : gosiNavy }}>{rateText(totalEmployer)}</td>
                          <td style={{ textAlign: "center", padding: "10px 14px", fontWeight: 950 }}>{rateText(totalEmployee + totalEmployer)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}

      {/* الرد الخام */}
      {rows.length > 0 && (
        <Box>
          <Button size="small" onClick={() => setShowRaw((v) => !v)} sx={{ fontWeight: 800, color: "text.secondary" }}>
            {showRaw ? "إخفاء رد التأمينات الخام" : "عرض رد التأمينات الخام"}
          </Button>
          {showRaw && (
            <Box sx={{ mt: 0.8, maxHeight: 380, overflow: "auto", border: `1px solid ${border}`, borderRadius: "12px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={`${r.path}-${i}`} style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: "6px 12px", direction: "ltr", textAlign: "left", fontWeight: 700, opacity: 0.75, whiteSpace: "nowrap" }}>{r.path}</td>
                      <td style={{ padding: "6px 12px", direction: "ltr", textAlign: "left", fontWeight: 900 }}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Box>
      )}
    </Stack>
  );
};

// ===================== الاستعلام + السجل =====================
const LookupView = ({ userGuid, accounts, canManage, onOpenSettings }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const border = isDark ? alpha(theme.palette.success.light, 0.22) : "#e3eee8";

  const activeAccounts = accounts.filter((a) => a.isActive);
  const [accountGuid, setAccountGuid] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [querying, setQuerying] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!accountGuid && activeAccounts.length) setAccountGuid(activeAccounts[0].accountGuid);
  }, [activeAccounts, accountGuid]);

  const account = activeAccounts.find((a) => a.accountGuid === accountGuid);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ userGuid });
      if (historySearch.trim()) params.set("search", historySearch.trim());
      const json = await readJson(await fetch(`${API}/history?${params}`, { cache: "no-store" }), "تعذر تحميل السجل");
      setHistory(json.data || []);
    } catch (e) {
      showError(e.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [userGuid, historySearch]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const lookup = async () => {
    const digits = nationalId.replace(/\D/g, "");
    if (digits.length < 8) {
      showError("برجاء إدخال رقم هوية / إقامة صحيح");
      return;
    }
    setQuerying(true);
    setResult(null);
    try {
      const json = await readJson(
        await fetch(`${API}/lookup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userGuid, accountGuid, nationalId: digits })
        }),
        "تعذر الاستعلام"
      );
      setResult({ ...json, accountName: account?.accountName });
      loadHistory();
    } catch (e) {
      showError(e.message);
    } finally {
      setQuerying(false);
    }
  };

  const openDetail = async (id) => {
    try {
      const json = await readJson(
        await fetch(`${API}/results/${id}?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
        "تعذر تحميل النتيجة"
      );
      setDetail(json.data);
    } catch (e) {
      showError(e.message);
    }
  };

  const panelSx = { p: { xs: 1.6, md: 2.2 }, borderRadius: "18px", border: `1px solid ${border}` };

  if (!activeAccounts.length) {
    return (
      <Paper elevation={0} sx={{ ...panelSx, textAlign: "center", py: 6 }}>
        <VpnKeyRoundedIcon sx={{ fontSize: 52, color: "text.disabled" }} />
        <Box sx={{ fontWeight: 900, fontSize: 16, mt: 1 }}>لم يُضف حساب التأمينات بعد</Box>
        <Box sx={{ color: "text.secondary", fontSize: 13, mt: 0.4 }}>
          أضف بيانات الربط (رقم المنشأة في التأمينات، client_id، client_secret، المفتاح الخاص) من الإعدادات
        </Box>
        {canManage && (
          <Button
            variant="contained"
            startIcon={<SettingsRoundedIcon />}
            onClick={onOpenSettings}
            sx={{ mt: 2, fontWeight: 900, color: "#fff", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
          >
            فتح الإعدادات
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: "22px",
          border: `1px solid ${border}`,
          background: isDark
            ? `linear-gradient(180deg, ${alpha(gosiNavy, 0.35)} 0%, ${theme.palette.background.paper} 100%)`
            : "linear-gradient(180deg, #f3f6fb 0%, #ffffff 100%)",
          boxShadow: isDark ? "none" : "0 14px 34px rgba(27,42,94,.08)"
        }}
      >
        <Stack direction="row" spacing={1.4} alignItems="center" sx={{ mb: 2 }}>
          <Box sx={{ width: 46, height: 46, borderRadius: "14px", display: "grid", placeItems: "center", color: "#fff", background: `linear-gradient(135deg, ${gosiNavy}, ${primaryColor})` }}>
            <BadgeRoundedIcon />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ fontSize: 18, fontWeight: 950, color: isDark ? theme.palette.text.primary : gosiNavy }}>استعلام عن مشترك</Box>
            <Box sx={{ fontSize: 12.5, fontWeight: 700, color: "text.secondary" }}>
              اكتب رقم الهوية الوطنية أو الإقامة، وتظهر بيانات اشتراكه ونسب الخصم من التأمينات مباشرة
            </Box>
          </Box>
        </Stack>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "stretch",
            gap: 1,
            p: 0.8,
            borderRadius: "18px",
            backgroundColor: isDark ? alpha("#fff", 0.04) : "#fff",
            border: `2px solid ${alpha(primaryColor, 0.35)}`,
            transition: "border-color .15s, box-shadow .15s",
            "&:focus-within": { borderColor: primaryColor, boxShadow: `0 0 0 4px ${alpha(primaryColor, 0.12)}` }
          }}
        >
          {activeAccounts.length > 1 && (
            <Select
              size="small"
              value={accountGuid}
              onChange={(e) => setAccountGuid(e.target.value)}
              sx={{ minWidth: 220, "& fieldset": { border: 0 }, backgroundColor: alpha(gosiNavy, 0.06), borderRadius: "12px", fontWeight: 800 }}
            >
              {activeAccounts.map((a) => (
                <MenuItem key={a.accountGuid} value={a.accountGuid}>
                  {a.accountName} ({envLabel(a.environment)})
                </MenuItem>
              ))}
            </Select>
          )}
          <TextField
            fullWidth
            variant="standard"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value.replace(/[^\d]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && !querying && lookup()}
            placeholder="رقم الهوية / الإقامة"
            InputProps={{ disableUnderline: true }}
            inputProps={{ dir: "ltr", inputMode: "numeric", maxLength: 15, style: { fontSize: 22, fontWeight: 900, letterSpacing: 2, textAlign: "center", padding: "10px 6px" } }}
          />
          <Button
            variant="contained"
            disabled={querying || !accountGuid || nationalId.length < 8}
            onClick={lookup}
            startIcon={querying ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
            sx={{
              fontWeight: 950,
              fontSize: 16,
              px: 5,
              borderRadius: "14px",
              color: "#fff",
              whiteSpace: "nowrap",
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
              "&.Mui-disabled": { color: "rgba(255,255,255,.7)", background: alpha(primaryColor, 0.35) }
            }}
          >
            {querying ? "جارٍ الاستعلام..." : "استعلام"}
          </Button>
        </Box>

        {account && (
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 1.4 }}>
            <Chip size="small" icon={<ShieldRoundedIcon />} label={account.accountName} sx={{ fontWeight: 800 }} />
            <Chip size="small" variant="outlined" label={`رقم المنشأة في التأمينات ${account.registrationNumber}`} sx={{ fontWeight: 700 }} />
            <Chip
              size="small"
              variant="outlined"
              color={account.environment === "sandbox" ? "warning" : "success"}
              label={`البيئة ${envLabel(account.environment)}`}
              sx={{ fontWeight: 800 }}
            />
            {account.environment === "sandbox" && (
              <Chip size="small" variant="outlined" label="للتجربة: هوية تبدأ بـ 10 أو 11 أو 12، أو إقامة تبدأ بـ 20" sx={{ fontWeight: 700 }} />
            )}
          </Stack>
        )}
      </Paper>

      {result && (
        <Paper elevation={0} sx={panelSx}>
          <ResultView result={result} />
        </Paper>
      )}

      <Paper elevation={0} sx={{ ...panelSx, p: 0, overflow: "hidden" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${border}` }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
            <HistoryRoundedIcon sx={{ color: isDark ? theme.palette.info.light : gosiNavy }} />
            <Box sx={{ fontWeight: 950, fontSize: 16 }}>سجل الاستعلامات</Box>
            <Chip size="small" label={history.length} sx={{ fontWeight: 900 }} />
          </Stack>
          <TextField
            size="small"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="بحث برقم الهوية..."
            inputProps={{ dir: "ltr" }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>, sx: { borderRadius: 99 } }}
            sx={{ minWidth: 230 }}
          />
        </Stack>

        <Box sx={{ maxHeight: 520, overflowY: "auto" }}>
          {historyLoading && history.length === 0 ? (
            <Stack alignItems="center" sx={{ py: 5 }}><CircularProgress size={24} sx={{ color: primaryColor }} /></Stack>
          ) : history.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center", color: "text.secondary", fontWeight: 700 }}>لا توجد استعلامات بعد</Box>
          ) : (
            history.map((h) => {
              const active = String(h.personStatus || "").toUpperCase() === "ACTIVE";
              return (
                <Box
                  key={h.id}
                  onClick={() => openDetail(h.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.4,
                    px: 2,
                    py: 1.3,
                    cursor: "pointer",
                    borderBottom: `1px solid ${border}`,
                    transition: "background-color .12s",
                    "&:hover": { backgroundColor: alpha(primaryColor, isDark ? 0.1 : 0.04) }
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 950,
                      fontSize: 17,
                      color: h.success ? "#fff" : accentColor,
                      background: h.success ? `linear-gradient(135deg, ${gosiNavy}, ${primaryColor})` : alpha(accentColor, 0.1)
                    }}
                  >
                    {h.success ? (h.personName || "؟").trim().charAt(0) : <ErrorRoundedIcon fontSize="small" />}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ fontWeight: 950, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {h.success ? h.personName || "—" : "فشل الاستعلام"}
                    </Box>
                    <Box sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <bdi dir="ltr">{h.nationalId}</bdi> — {formatDate(h.queriedAt)}{h.queriedByName ? ` — بواسطة ${h.queriedByName}` : ""}
                      {!h.success && h.errorMessage ? ` — ${h.errorMessage}` : ""}
                    </Box>
                  </Box>

                  {h.success && (
                    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
                      <Box sx={{ textAlign: "center", px: 1.2 }}>
                        <Box sx={{ fontSize: 10.5, fontWeight: 800, color: "text.secondary" }}>الموظف</Box>
                        <Box sx={{ fontSize: 15, fontWeight: 950, color: primaryColor }}>{formatRate(h.employeeRate)}</Box>
                      </Box>
                      <Box sx={{ textAlign: "center", px: 1.2 }}>
                        <Box sx={{ fontSize: 10.5, fontWeight: 800, color: "text.secondary" }}>صاحب العمل</Box>
                        <Box sx={{ fontSize: 15, fontWeight: 950, color: isDark ? theme.palette.info.light : gosiNavy }}>{formatRate(h.employerRate)}</Box>
                      </Box>
                    </Stack>
                  )}

                  {h.success && h.personStatus && (
                    <Box
                      sx={{
                        fontSize: 11.5,
                        fontWeight: 900,
                        px: 1.2,
                        py: 0.3,
                        borderRadius: 99,
                        whiteSpace: "nowrap",
                        color: active ? "#fff" : accentColor,
                        backgroundColor: active ? primaryColor : alpha(accentColor, 0.1)
                      }}
                    >
                      {active ? "نشط" : h.personStatus}
                    </Box>
                  )}

                  <VisibilityOutlinedIcon sx={{ color: "text.disabled", fontSize: 20 }} />
                </Box>
              );
            })
          )}
        </Box>
      </Paper>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>تفاصيل الاستعلام</DialogTitle>
        <DialogContent>
          <ResultView result={detail} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetail(null)} sx={{ fontWeight: 800, color: primaryColor }}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

// ===================== الإعدادات (حسابات الربط) =====================
const emptyAccount = {
  accountGuid: "",
  accountName: "",
  environment: "production",
  registrationNumber: "",
  clientId: "",
  clientSecret: "",
  privateKey: "",
  isActive: true,
  hasSecret: false,
  hasKey: false
};

const SettingsView = ({ userGuid, accounts, onChanged }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const border = isDark ? alpha(theme.palette.success.light, 0.22) : "#e3eee8";

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState("");

  const save = async () => {
    setSaving(true);
    try {
      const isEdit = Boolean(form.accountGuid);
      const json = await readJson(
        await fetch(isEdit ? `${API}/accounts/${form.accountGuid}` : `${API}/accounts`, {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, userGuid })
        }),
        "تعذر الحفظ"
      );
      setForm(null);
      Swal.fire({ icon: "success", title: json.message, confirmButtonText: "حسنًا", confirmButtonColor: primaryColor });
      onChanged();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const test = async (account) => {
    setTesting(account.accountGuid);
    try {
      const json = await readJson(
        await fetch(`${API}/accounts/${account.accountGuid}/test`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userGuid })
        }),
        "تعذر اختبار الاتصال"
      );
      Swal.fire({
        icon: json.ok ? "success" : "error",
        title: json.ok ? "تم الاتصال بنجاح" : "فشل الاتصال",
        text: json.message,
        confirmButtonText: "حسنًا",
        confirmButtonColor: json.ok ? primaryColor : accentColor
      });
      onChanged();
    } catch (e) {
      showError(e.message);
    } finally {
      setTesting("");
    }
  };

  const remove = async (account) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "حذف الحساب",
      text: `سيُحذف حساب "${account.accountName}" وبيانات الربط الخاصة به. سجل الاستعلامات يبقى كما هو.`,
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: accentColor,
      cancelButtonColor: "#6b7280"
    });
    if (!confirm.isConfirmed) return;
    try {
      await readJson(
        await fetch(`${API}/accounts/${account.accountGuid}?userGuid=${encodeURIComponent(userGuid)}`, { method: "DELETE" }),
        "تعذر الحذف"
      );
      onChanged();
    } catch (e) {
      showError(e.message);
    }
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
          البيانات من منصة التأمينات "أعمال": خدمات المنشأة ← الوصول إلى الواجهات البرمجية (API Access)
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => setForm({ ...emptyAccount })}
          sx={{ fontWeight: 900, whiteSpace: "nowrap", color: "#fff", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
        >
          حساب جديد
        </Button>
      </Stack>

      {accounts.length === 0 && (
        <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: "18px", border: `1px solid ${border}`, fontWeight: 800, color: "text.secondary" }}>
          لا توجد حسابات بعد — اضغط "حساب جديد"
        </Paper>
      )}

      {accounts.map((a) => {
        const complete = a.hasSecret && a.hasKey;
        return (
          <Paper key={a.accountGuid} elevation={0} sx={{ p: 2, borderRadius: "18px", border: `1px solid ${border}`, opacity: a.isActive ? 1 : 0.6 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.4} alignItems={{ md: "center" }}>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", color: "#fff", backgroundColor: gosiNavy }}>
                  <ShieldRoundedIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ fontWeight: 950, fontSize: 16 }}>{a.accountName}</Box>
                  <Box sx={{ fontSize: 12, color: "text.secondary", fontWeight: 700, direction: "rtl" }}>
                    رقم المنشأة {a.registrationNumber} — client_id {a.clientId} — البيئة {envLabel(a.environment)} — {a.queryCount} استعلام
                  </Box>
                </Box>
              </Stack>
              <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
                {!a.isActive && <Chip size="small" label="موقوف" variant="outlined" sx={{ fontWeight: 800 }} />}
                {a.lastTestAt ? (
                  <Tooltip title={a.lastTestMessage || ""}>
                    <Chip
                      size="small"
                      color={a.lastTestOk ? "success" : "error"}
                      icon={a.lastTestOk ? <CheckCircleRoundedIcon /> : <ErrorRoundedIcon />}
                      label={a.lastTestOk ? "متصل" : "فشل الاتصال"}
                      sx={{ fontWeight: 800 }}
                    />
                  </Tooltip>
                ) : (
                  <Chip size="small" variant="outlined" label={complete ? "لم يُختبر" : "غير مكتمل"} sx={{ fontWeight: 800 }} />
                )}
                <Button
                  size="small"
                  variant="outlined"
                  disabled={!complete || testing === a.accountGuid}
                  onClick={() => test(a)}
                  startIcon={testing === a.accountGuid ? <CircularProgress size={14} color="inherit" /> : <LinkRoundedIcon />}
                  sx={{ fontWeight: 900, borderColor: gosiNavy, color: isDark ? theme.palette.text.primary : gosiNavy }}
                >
                  اختبار الاتصال
                </Button>
                <IconButton
                  size="small"
                  onClick={() => setForm({ ...emptyAccount, ...a, clientSecret: "", privateKey: "" })}
                  sx={{ color: primaryColor }}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => remove(a)} sx={{ color: accentColor }}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>
        );
      })}

      <Dialog open={Boolean(form)} onClose={() => !saving && setForm(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>{form?.accountGuid ? "تعديل حساب التأمينات" : "حساب تأمينات جديد"}</DialogTitle>
        <DialogContent>
          {form && (
            <Stack spacing={1.4} sx={{ pt: 0.5 }}>
              <Box>
                {fieldLabel("اسم الحساب (للتمييز فقط)")}
                <TextField size="small" fullWidth value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} placeholder="مثال: المعهد — السجل الرئيسي" />
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Box sx={{ flex: 1 }}>
                  {fieldLabel("البيئة")}
                  <Select size="small" fullWidth value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
                    <MenuItem value="production">الفعلية (Production)</MenuItem>
                    <MenuItem value="sandbox">التجريبية (Sandbox)</MenuItem>
                  </Select>
                </Box>
                <Box sx={{ flex: 1 }}>
                  {fieldLabel("رقم المنشأة في التأمينات")}
                  <TextField size="small" fullWidth value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} inputProps={{ dir: "ltr" }} />
                </Box>
              </Stack>
              <Box>
                {fieldLabel("client_id")}
                <TextField size="small" fullWidth value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} inputProps={{ dir: "ltr" }} />
              </Box>
              <Box>
                {fieldLabel(form.hasSecret ? "client_secret (محفوظ — اتركه فارغًا للإبقاء عليه)" : "client_secret")}
                <TextField
                  size="small"
                  fullWidth
                  type="password"
                  autoComplete="new-password"
                  value={form.clientSecret}
                  placeholder={form.hasSecret ? "••••••••" : ""}
                  onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
                  inputProps={{ dir: "ltr" }}
                />
              </Box>
              <Box>
                {fieldLabel(form.hasKey ? "المفتاح الخاص (محفوظ — الصق مفتاحًا جديدًا للاستبدال فقط)" : "المفتاح الخاص (PEM)")}
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={9}
                  value={form.privateKey}
                  placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
                  onChange={(e) => setForm({ ...form, privateKey: e.target.value })}
                  inputProps={{ dir: "ltr", style: { fontFamily: "monospace", fontSize: 12 } }}
                />
              </Box>
              {form.accountGuid && (
                <FormControlLabel
                  control={<Switch color="success" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
                  label="الحساب مفعل"
                />
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setForm(null)} disabled={saving} sx={{ fontWeight: 800, color: "#6b7280" }}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <VpnKeyRoundedIcon />}
            sx={{ fontWeight: 900, color: "#fff", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

// ===================== الصفحة =====================
const HrGosiPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const userGuid = useMemo(getCurrentUserGuid, []);
  const [view, setView] = useState("lookup");
  const [accounts, setAccounts] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userGuid) return;
    try {
      const json = await readJson(
        await fetch(`${API}/accounts?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
        "تعذر تحميل البيانات"
      );
      setAccounts(json.data || []);
      setCanManage(Boolean(json.canManage));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userGuid]);

  useEffect(() => {
    load();
  }, [load]);

  if (!userGuid) {
    return <Box sx={{ p: 3, direction: "rtl", fontWeight: 800 }}>برجاء تسجيل الدخول مرة أخرى</Box>;
  }

  const headerButtonSx = {
    color: "#fff",
    fontWeight: 900,
    borderRadius: 99,
    px: 1.6,
    backgroundColor: "rgba(255,255,255,.14)",
    "&:hover": { backgroundColor: "rgba(255,255,255,.24)" }
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
            ? "linear-gradient(135deg, #111c3d 0%, #0b3d29 100%)"
            : `linear-gradient(135deg, ${gosiNavy} 0%, ${primaryColor} 100%)`,
          boxShadow: isDark ? "none" : "0 12px 30px rgba(27,42,94,.22)",
          display: "flex",
          alignItems: "center",
          gap: 1.6,
          flexWrap: "wrap"
        }}
      >
        <Box sx={{ width: 50, height: 50, borderRadius: "15px", display: "grid", placeItems: "center", backgroundColor: "rgba(255,255,255,.16)" }}>
          {view === "settings" ? <SettingsRoundedIcon sx={{ fontSize: 28 }} /> : <ShieldRoundedIcon sx={{ fontSize: 28 }} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Box sx={{ fontSize: { xs: 18, md: 22 }, fontWeight: 950, lineHeight: 1.35 }}>
            {view === "settings" ? "إعدادات الربط مع التأمينات" : "التأمينات الاجتماعية"}
          </Box>
          <Box sx={{ fontSize: 12.5, fontWeight: 700, opacity: 0.85 }}>
            {view === "settings"
              ? "حسابات الربط — البيانات السرية تُحفظ مشفّرة ولا تُعرض مرة أخرى"
              : "استعلام مباشر برقم الهوية أو الإقامة، والنتيجة كما هي من التأمينات"}
          </Box>
        </Box>
        {canManage &&
          (view === "lookup" ? (
            <Button startIcon={<SettingsRoundedIcon />} onClick={() => setView("settings")} sx={headerButtonSx}>
              الإعدادات
            </Button>
          ) : (
            <Button startIcon={<ArrowForwardRoundedIcon />} onClick={() => setView("lookup")} sx={headerButtonSx}>
              رجوع للاستعلام
            </Button>
          ))}
      </Box>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress sx={{ color: primaryColor }} /></Stack>
      ) : error ? (
        <Box sx={{ p: 3, fontWeight: 800, color: accentColor }}>{error}</Box>
      ) : view === "settings" && canManage ? (
        <SettingsView userGuid={userGuid} accounts={accounts} onChanged={load} />
      ) : (
        <LookupView userGuid={userGuid} accounts={accounts} canManage={canManage} onOpenSettings={() => setView("settings")} />
      )}
    </Box>
  );
};

export default HrGosiPage;
