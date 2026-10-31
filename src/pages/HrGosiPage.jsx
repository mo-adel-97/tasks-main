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
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SearchIcon from "@mui/icons-material/Search";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import CloudSyncRoundedIcon from "@mui/icons-material/CloudSyncRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import { SSTLI_API_URL } from "../config/apiUrls";

/*
  الربط مع التأمينات الاجتماعية (GOSI — Engagement Deduction API):
  - الاستعلام: نسب خصم التأمينات (الموظف / صاحب العمل) لموظفي كل منشأة، فرديًا أو للكل،
    والنتيجة تُحفظ وتظهر في ملف الموظف.
  - إعدادات الربط (صلاحية التعديل): لكل منشأة رقمها في التأمينات و client_id و client_secret
    والمفتاح الخاص (تُحفظ مشفّرة ولا تُعرض مرة أخرى).
*/

const API_BASE_URL = SSTLI_API_URL;
const API = `${API_BASE_URL}/api/hr/gosi`;

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

// ===================== تفاصيل الاستعلام =====================
const ResultDialog = ({ resultId, userGuid, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resultId) return;
    setLoading(true);
    setData(null);
    fetch(`${API}/results/${resultId}?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" })
      .then((r) => readJson(r, "تعذر تحميل النتيجة"))
      .then((json) => setData(json.data))
      .catch((e) => showError(e.message))
      .finally(() => setLoading(false));
  }, [resultId, userGuid]);

  const rows = useMemo(() => {
    if (!data?.responseJson) return [];
    try {
      return flattenJson(JSON.parse(data.responseJson));
    } catch {
      return [{ path: "الرد", value: data.responseJson }];
    }
  }, [data]);

  return (
    <Dialog open={Boolean(resultId)} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>تفاصيل الاستعلام من التأمينات</DialogTitle>
      <DialogContent>
        {loading || !data ? (
          <Stack alignItems="center" sx={{ py: 5 }}>
            <CircularProgress sx={{ color: primaryColor }} />
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1 }}>
              {[
                ["رقم الهوية / الإقامة", data.nationalId],
                ["نسبة الموظف", formatRate(data.employeeRate)],
                ["نسبة صاحب العمل", formatRate(data.employerRate)],
                ["البيئة", data.environment === "production" ? "الفعلية" : "التجريبية"],
                ["المنشأة", data.establishmentName || "—"],
                ["وقت الاستعلام", formatDate(data.queriedAt)],
                ["بواسطة", data.queriedByName || "—"],
                ["حالة الرد", data.httpStatus ?? "—"]
              ].map(([label, value]) => (
                <Box key={label} sx={{ p: 1.1, borderRadius: 2, backgroundColor: alpha(primaryColor, 0.06) }}>
                  <Box sx={{ fontSize: 11.5, fontWeight: 800, color: "text.secondary" }}>{label}</Box>
                  <Box sx={{ fontSize: 14, fontWeight: 900, mt: 0.3, direction: "ltr", textAlign: "right" }}>{value}</Box>
                </Box>
              ))}
            </Box>

            {!data.success && (
              <Box sx={{ p: 1.2, borderRadius: 2, color: accentColor, backgroundColor: alpha(accentColor, 0.08), fontWeight: 800, fontSize: 13 }}>
                {data.errorMessage}
              </Box>
            )}

            {rows.length > 0 && (
              <Box>
                <Box sx={{ fontWeight: 900, mb: 0.8 }}>رد التأمينات الاجتماعية كاملًا</Box>
                <Box sx={{ maxHeight: 360, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={`${r.path}-${i}`} style={{ borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                          <td style={{ padding: "6px 10px", direction: "ltr", textAlign: "left", fontWeight: 700, opacity: 0.75, whiteSpace: "nowrap" }}>{r.path}</td>
                          <td style={{ padding: "6px 10px", direction: "ltr", textAlign: "left", fontWeight: 800 }}>{r.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 800, color: primaryColor }}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
};

// ===================== الاستعلام =====================
const QueryView = ({ userGuid, establishments, onOpenSettings, canManage }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const border = isDark ? alpha(theme.palette.success.light, 0.22) : "#e3eee8";

  const [selected, setSelected] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [bulkRunning, setBulkRunning] = useState(false);
  const [resultId, setResultId] = useState(null);

  useEffect(() => {
    if (!selected && establishments.length) setSelected(establishments[0].establishmentGuid);
  }, [establishments, selected]);

  const establishment = establishments.find((e) => e.establishmentGuid === selected);
  const ready = Boolean(establishment?.registrationNumber && establishment?.clientId && establishment?.hasSecret && establishment?.hasKey);

  const load = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const json = await readJson(
        await fetch(`${API}/establishments/${selected}/employees?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
        "تعذر تحميل الموظفين"
      );
      setEmployees(json.data || []);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selected, userGuid]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => [e.fullName, e.nationalId, e.employeeCode, e.branchName].some((v) => String(v ?? "").toLowerCase().includes(q)));
  }, [employees, search]);

  const stats = useMemo(() => {
    const done = employees.filter((e) => e.lastResult?.success).length;
    const failed = employees.filter((e) => e.lastResult && !e.lastResult.success).length;
    const missing = employees.filter((e) => !e.nationalId).length;
    return { total: employees.length, done, failed, missing };
  }, [employees]);

  const queryOne = async (employee) => {
    setBusy(employee.employeeGuid);
    try {
      const json = await readJson(
        await fetch(`${API}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userGuid, employeeGuid: employee.employeeGuid })
        }),
        "تعذر الاستعلام"
      );
      if (!json.success) showError(json.errorMessage || "فشل الاستعلام");
      await load();
    } catch (e) {
      showError(e.message);
    } finally {
      setBusy("");
    }
  };

  const queryAll = async () => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "استعلام عن كل الموظفين",
      text: `سيتم الاستعلام من التأمينات الاجتماعية عن ${stats.total - stats.missing} موظف في "${establishment?.establishmentName}". قد يستغرق ذلك بعض الوقت.`,
      showCancelButton: true,
      confirmButtonText: "ابدأ",
      cancelButtonText: "إلغاء",
      confirmButtonColor: primaryColor,
      cancelButtonColor: "#6b7280"
    });
    if (!confirm.isConfirmed) return;

    setBulkRunning(true);
    try {
      const json = await readJson(
        await fetch(`${API}/query-establishment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userGuid, establishmentGuid: selected })
        }),
        "تعذر الاستعلام"
      );
      await Swal.fire({
        icon: json.failed ? "warning" : "success",
        title: json.message,
        text: json.firstError || "",
        confirmButtonText: "حسنًا",
        confirmButtonColor: primaryColor
      });
      await load();
    } catch (e) {
      showError(e.message);
    } finally {
      setBulkRunning(false);
    }
  };

  const stat = (label, value, color) => (
    <Paper elevation={0} sx={{ flex: 1, minWidth: 130, p: 1.3, borderRadius: "14px", border: `1px solid ${border}` }}>
      <Box sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}>{label}</Box>
      <Box sx={{ fontSize: 22, fontWeight: 950, color, mt: 0.2 }}>{value}</Box>
    </Paper>
  );

  if (!establishments.length) {
    return (
      <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: "18px", border: `1px solid ${border}` }}>
        <ApartmentRoundedIcon sx={{ fontSize: 52, color: "text.disabled" }} />
        <Box sx={{ fontWeight: 900, fontSize: 16, mt: 1 }}>لا توجد منشآت بعد</Box>
        <Typography sx={{ color: "text.secondary", fontSize: 13 }}>أضف المنشآت واربط الموظفين بها من شاشة "المنشآت والسجلات التجارية"</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 1.4, mb: 1.5, borderRadius: "16px", border: `1px solid ${border}` }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "flex-end" }}>
          <Box sx={{ minWidth: 260 }}>
            {fieldLabel("المنشأة")}
            <Select size="small" fullWidth value={selected} onChange={(e) => setSelected(e.target.value)}>
              {establishments.map((e) => (
                <MenuItem key={e.establishmentGuid} value={e.establishmentGuid}>{e.establishmentName}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ flex: 1 }}>
            {fieldLabel("بحث")}
            <TextField
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="الاسم أو رقم الهوية أو الكود..."
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
          </Box>
          <Button
            variant="contained"
            disabled={!ready || bulkRunning || !employees.length}
            onClick={queryAll}
            startIcon={bulkRunning ? <CircularProgress size={16} color="inherit" /> : <CloudSyncRoundedIcon />}
            sx={{ fontWeight: 900, color: "#fff", whiteSpace: "nowrap", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
          >
            {bulkRunning ? "جارٍ الاستعلام..." : "استعلام عن الكل"}
          </Button>
        </Stack>

        {establishment && (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1.2 }}>
            <Chip
              size="small"
              icon={ready ? <CheckCircleRoundedIcon /> : <ErrorRoundedIcon />}
              color={ready ? "success" : "warning"}
              label={ready ? "بيانات الربط مكتملة" : "بيانات الربط غير مكتملة"}
              sx={{ fontWeight: 800 }}
            />
            {establishment.registrationNumber && (
              <Chip size="small" variant="outlined" label={`رقم المنشأة في التأمينات: ${establishment.registrationNumber}`} sx={{ fontWeight: 700 }} />
            )}
            <Chip
              size="small"
              variant="outlined"
              label={establishment.environment === "production" ? "البيئة الفعلية" : "البيئة التجريبية (Sandbox)"}
              sx={{ fontWeight: 700 }}
            />
            {!ready && canManage && (
              <Button size="small" startIcon={<SettingsRoundedIcon />} onClick={onOpenSettings} sx={{ fontWeight: 800, color: primaryColor }}>
                أكمل بيانات الربط
              </Button>
            )}
          </Stack>
        )}
      </Paper>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        {stat("موظفو المنشأة", stats.total, isDark ? theme.palette.text.primary : "#14231c")}
        {stat("تم الاستعلام بنجاح", stats.done, primaryColor)}
        {stat("فشل الاستعلام", stats.failed, accentColor)}
        {stat("بدون رقم هوية", stats.missing, "#b45309")}
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: "16px", border: `1px solid ${border}`, overflow: "hidden" }}>
        <Box
          sx={{
            overflow: "auto",
            maxHeight: "calc(100dvh - 400px)",
            minHeight: 260,
            "& table": { width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 },
            "& th": {
              position: "sticky",
              top: 0,
              zIndex: 1,
              textAlign: "right",
              padding: "9px 10px",
              fontWeight: 900,
              whiteSpace: "nowrap",
              color: isDark ? theme.palette.success.light : "#fff",
              background: isDark ? theme.palette.background.paper : gosiNavy
            },
            "& td": { padding: "7px 10px", borderBottom: `1px solid ${border}`, fontWeight: 600, whiteSpace: "nowrap" },
            "& tbody tr:hover": { background: alpha(primaryColor, 0.05) }
          }}
        >
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>رقم الهوية / الإقامة</th>
                <th>الفرع</th>
                <th>نسبة الموظف</th>
                <th>نسبة صاحب العمل</th>
                <th>آخر استعلام</th>
                <th>الحالة</th>
                <th style={{ width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40 }}><CircularProgress size={26} sx={{ color: primaryColor }} /></td></tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 30, color: theme.palette.text.secondary }}>
                    لا يوجد موظفون مربوطون بهذه المنشأة
                  </td>
                </tr>
              ) : (
                visible.map((e) => {
                  const r = e.lastResult;
                  return (
                    <tr key={e.employeeGuid}>
                      <td>
                        <Box sx={{ fontWeight: 900 }}>{e.fullName}</Box>
                        <Box sx={{ fontSize: 11.5, color: "text.secondary" }}>كود {e.employeeCode ?? "—"}</Box>
                      </td>
                      <td style={{ direction: "ltr", textAlign: "right" }}>
                        {e.nationalId || <Box component="span" sx={{ color: "#b45309", fontWeight: 800 }}>غير مسجل</Box>}
                      </td>
                      <td>{e.branchName || "—"}</td>
                      <td style={{ fontWeight: 900, color: primaryColor }}>{r?.success ? formatRate(r.employeeRate) : "—"}</td>
                      <td style={{ fontWeight: 900, color: gosiNavy }}>{r?.success ? formatRate(r.employerRate) : "—"}</td>
                      <td>{r ? formatDate(r.queriedAt) : "—"}</td>
                      <td>
                        {!r ? (
                          <Chip size="small" label="لم يُستعلم" variant="outlined" sx={{ fontWeight: 700 }} />
                        ) : r.success ? (
                          <Chip size="small" color="success" label="تم" sx={{ fontWeight: 800 }} />
                        ) : (
                          <Tooltip title={r.errorMessage || ""}>
                            <Chip size="small" color="error" variant="outlined" label="فشل" sx={{ fontWeight: 800 }} />
                          </Tooltip>
                        )}
                      </td>
                      <td>
                        <Tooltip title="استعلام الآن">
                          <span>
                            <IconButton
                              size="small"
                              disabled={!ready || !e.nationalId || busy === e.employeeGuid || bulkRunning}
                              onClick={() => queryOne(e)}
                              sx={{ color: primaryColor }}
                            >
                              {busy === e.employeeGuid ? <CircularProgress size={16} color="inherit" /> : <SyncRoundedIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="التفاصيل">
                          <span>
                            <IconButton size="small" disabled={!r} onClick={() => setResultId(r.id)} sx={{ color: gosiNavy }}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Box>
      </Paper>

      <ResultDialog resultId={resultId} userGuid={userGuid} onClose={() => setResultId(null)} />
    </Box>
  );
};

// ===================== إعدادات الربط =====================
const CredentialCard = ({ establishment, userGuid, onSaved }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const border = isDark ? alpha(theme.palette.success.light, 0.22) : "#e3eee8";

  const [form, setForm] = useState({
    environment: establishment.environment || "sandbox",
    registrationNumber: establishment.registrationNumber || "",
    clientId: establishment.clientId || "",
    clientSecret: "",
    privateKey: ""
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const json = await readJson(
        await fetch(`${API}/credentials/${establishment.establishmentGuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, userGuid })
        }),
        "تعذر الحفظ"
      );
      setForm((f) => ({ ...f, clientSecret: "", privateKey: "" }));
      Swal.fire({ icon: "success", title: json.message, confirmButtonText: "حسنًا", confirmButtonColor: primaryColor });
      onSaved();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const json = await readJson(
        await fetch(`${API}/credentials/${establishment.establishmentGuid}/test`, {
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
      onSaved();
    } catch (e) {
      showError(e.message);
    } finally {
      setTesting(false);
    }
  };

  const complete = establishment.registrationNumber && establishment.clientId && establishment.hasSecret && establishment.hasKey;

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: "18px", border: `1px solid ${border}` }}>
      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.6 }}>
        <Box sx={{ width: 42, height: 42, borderRadius: "12px", display: "grid", placeItems: "center", color: "#fff", backgroundColor: gosiNavy }}>
          <ApartmentRoundedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ fontWeight: 950, fontSize: 16 }}>{establishment.establishmentName}</Box>
          <Box sx={{ fontSize: 12, color: "text.secondary", fontWeight: 700 }}>
            السجل التجاري: {establishment.commercialRegNo || "—"} — {establishment.employeeCount} موظف
          </Box>
        </Box>
        {establishment.lastTestAt ? (
          <Tooltip title={establishment.lastTestMessage || ""}>
            <Chip
              size="small"
              color={establishment.lastTestOk ? "success" : "error"}
              icon={establishment.lastTestOk ? <CheckCircleRoundedIcon /> : <ErrorRoundedIcon />}
              label={establishment.lastTestOk ? "متصل" : "فشل الاتصال"}
              sx={{ fontWeight: 800 }}
            />
          </Tooltip>
        ) : (
          <Chip size="small" variant="outlined" label={complete ? "لم يُختبر" : "غير مكتمل"} sx={{ fontWeight: 800 }} />
        )}
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.2 }}>
        <Box>
          {fieldLabel("البيئة")}
          <Select size="small" fullWidth value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
            <MenuItem value="sandbox">التجريبية (Sandbox)</MenuItem>
            <MenuItem value="production">الفعلية (Production)</MenuItem>
          </Select>
        </Box>
        <Box>
          {fieldLabel("رقم المنشأة في التأمينات (Registration Number)")}
          <TextField size="small" fullWidth value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} inputProps={{ dir: "ltr" }} />
        </Box>
        <Box>
          {fieldLabel("client_id")}
          <TextField size="small" fullWidth value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} inputProps={{ dir: "ltr" }} />
        </Box>
        <Box>
          {fieldLabel(establishment.hasSecret ? "client_secret (محفوظ — اتركه فارغًا للإبقاء عليه)" : "client_secret")}
          <TextField
            size="small"
            fullWidth
            type="password"
            autoComplete="new-password"
            value={form.clientSecret}
            placeholder={establishment.hasSecret ? "••••••••" : ""}
            onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
            inputProps={{ dir: "ltr" }}
          />
        </Box>
        <Box sx={{ gridColumn: { md: "1 / -1" } }}>
          {fieldLabel(establishment.hasKey ? "المفتاح الخاص لتوقيع DPoP (محفوظ — الصق مفتاحًا جديدًا للاستبدال فقط)" : "المفتاح الخاص لتوقيع DPoP (PEM)")}
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            value={form.privateKey}
            placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
            onChange={(e) => setForm({ ...form, privateKey: e.target.value })}
            inputProps={{ dir: "ltr", style: { fontFamily: "monospace", fontSize: 12 } }}
          />
        </Box>
      </Box>

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1.6 }}>
        <Button
          variant="outlined"
          disabled={!complete || testing}
          onClick={test}
          startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <LinkRoundedIcon />}
          sx={{ fontWeight: 900, borderColor: gosiNavy, color: isDark ? theme.palette.text.primary : gosiNavy }}
        >
          اختبار الاتصال
        </Button>
        <Button
          variant="contained"
          disabled={saving}
          onClick={save}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <VpnKeyRoundedIcon />}
          sx={{ fontWeight: 900, color: "#fff", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
        >
          حفظ
        </Button>
      </Stack>
    </Paper>
  );
};

// ===================== الصفحة =====================
const HrGosiPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const userGuid = useMemo(getCurrentUserGuid, []);
  const [view, setView] = useState("query");
  const [establishments, setEstablishments] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userGuid) return;
    try {
      const json = await readJson(
        await fetch(`${API}/establishments?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" }),
        "تعذر تحميل البيانات"
      );
      setEstablishments((json.data || []).filter((e) => e.isActive));
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
            {view === "settings" ? "إعدادات الربط مع التأمينات" : "الربط مع التأمينات الاجتماعية"}
          </Box>
          <Box sx={{ fontSize: 12.5, fontWeight: 700, opacity: 0.85 }}>
            {view === "settings"
              ? "بيانات الربط لكل منشأة، تُحفظ مشفّرة ولا تُعرض مرة أخرى"
              : "نسب خصم التأمينات للموظف وصاحب العمل لكل موظف حسب منشأته"}
          </Box>
        </Box>
        {canManage &&
          (view === "query" ? (
            <Button startIcon={<SettingsRoundedIcon />} onClick={() => setView("settings")} sx={headerButtonSx}>
              إعدادات الربط
            </Button>
          ) : (
            <Button startIcon={<ArrowForwardRoundedIcon />} onClick={() => setView("query")} sx={headerButtonSx}>
              رجوع للاستعلام
            </Button>
          ))}
      </Box>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress sx={{ color: primaryColor }} /></Stack>
      ) : error ? (
        <Box sx={{ p: 3, fontWeight: 800, color: accentColor }}>{error}</Box>
      ) : view === "settings" && canManage ? (
        <Stack spacing={1.5}>
          {establishments.length === 0 ? (
            <Box sx={{ p: 3, fontWeight: 800 }}>أضف المنشآت أولًا من شاشة "المنشآت والسجلات التجارية"</Box>
          ) : (
            establishments.map((e) => (
              <CredentialCard key={e.establishmentGuid} establishment={e} userGuid={userGuid} onSaved={load} />
            ))
          )}
        </Stack>
      ) : (
        <QueryView userGuid={userGuid} establishments={establishments} canManage={canManage} onOpenSettings={() => setView("settings")} />
      )}
    </Box>
  );
};

export default HrGosiPage;
