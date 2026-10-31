// التنبيهات والإعلانات (الإعدادات العامة) — api/announcements/admin:
// - كل التنبيهات (العادية) وإعلانات الإدارة المميزة (المطر) في مكان واحد: إضافة، تعديل، تفعيل/إيقاف، حذف، معاينة.
// - الجمهور: الكل، أو وظائف / فروع / موظفين بعينهم (أي واحد منهم يكفي).
// - متابعة الاطلاع: مين شاف ومين لسه من الجمهور.
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
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
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip
} from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { API_BASE_URL, getUserGuid, readJson, useTasksPalette } from "./tasks/tasksCommon";
import { TasksPageShell, SectionCard, NoAccess, CenterLoader, EmptyState, toast, showError, confirmAction, multilineSx } from "./tasks/TasksUi";
import AnnouncementDialog from "../components/announcements/AnnouncementDialog";

const API = `${API_BASE_URL}/api/announcements/admin`;
const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const fmtDateTime = (s) => {
  if (!s) return "";
  const [d, t] = String(s).split(/[ T]/);
  return `${d.split("-").reverse().join("/")}${t ? ` ${t.slice(0, 5)}` : ""}`;
};
const toInput = (s) => (s ? String(s).replace(" ", "T").slice(0, 16) : "");

const TYPES = {
  info: { label: "معلومة", color: "#3b82f6" },
  success: { label: "خبر سار", color: "#10b981" },
  warning: { label: "تنبيه", color: "#f59e0b" },
  error: { label: "مهم جدًا", color: "#ef4444" }
};
const BLESSING_DEFAULTS = {
  kicker: "شركة المعهد السعودي المتخصص العالي للتدريب",
  highlight: "",
  slogan: "All for SSTLI, and SSTLI for all",
  signatureLabel: "أخوكم",
  signatureName: "",
  buttonText: "على بركة الله"
};
const emptyForm = {
  alertGuid: null, title: "", message: "", alertType: "info", displayStyle: "standard",
  extra: { ...BLESSING_DEFAULTS }, startAt: "", endAt: "", isActive: true,
  audience: "all", jobs: [], branches: [], users: []
};

// عنوان ثابت فوق الخانة (الـ label العائم بيتداخل مع القيمة بسبب rtl-forms-fix)
const Field = ({ label, hint, children }) => {
  const p = useTasksPalette();
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ fontSize: 13, fontWeight: 700, color: p.muted, mb: 0.6 }}>{label}</Box>
      {children}
      {hint ? <Box sx={{ fontSize: 12, color: p.muted, mt: 0.5 }}>{hint}</Box> : null}
    </Box>
  );
};

const StyleChip = ({ item }) => {
  const p = useTasksPalette();
  if (item.displayStyle === "blessing")
    return <Chip size="small" icon={<WaterDropIcon />} label="إعلان مميز" sx={{ height: 24, fontWeight: 700, bgcolor: p.tone("#0ea5e9").bg, color: p.text, "& .MuiChip-icon": { color: "#0ea5e9", fontSize: 16 } }} />;
  const t = TYPES[item.alertType] || TYPES.info;
  return <Chip size="small" icon={<NotificationsActiveOutlinedIcon />} label={`تنبيه — ${t.label}`} sx={{ height: 24, fontWeight: 700, bgcolor: p.tone(t.color).bg, color: p.text, "& .MuiChip-icon": { color: t.color, fontSize: 16 } }} />;
};

// ---------- من اطّلع ----------
const SeenDialog = ({ item, onClose }) => {
  const p = useTasksPalette();
  const userGuid = getUserGuid();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("seen");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!item) return;
    setData(null);
    setTab("seen");
    setSearch("");
    fetch(`${API}/${item.alertGuid}/seen?${new URLSearchParams({ userGuid })}`, { cache: "no-store" })
      .then(readJson)
      .then(setData)
      .catch((e) => { showError(e); onClose(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const rows = useMemo(() => {
    const q = search.trim();
    return (data?.[tab === "seen" ? "seen" : "notSeen"] || []).filter((r) => !q || [r.name, r.jobName, r.branchName].some((v) => String(v || "").includes(q)));
  }, [data, tab, search]);

  return (
    <Dialog open={Boolean(item)} onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        الاطلاع على: {item?.title}
        <IconButton onClick={onClose} sx={{ position: "absolute", left: 12, top: 12 }} aria-label="إغلاق"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!data ? <CenterLoader /> : (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab value="seen" label={`اطّلعوا (${fmt(data.seen.length)})`} sx={{ fontWeight: 700 }} />
                <Tab value="notSeen" label={`لم يطّلعوا بعد (${fmt(data.notSeen.length)})`} sx={{ fontWeight: 700 }} />
              </Tabs>
              <TextField
                size="small" placeholder="ابحث بالاسم أو الوظيفة أو الفرع" value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              />
            </Stack>
            {rows.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center", color: p.muted }}>{tab === "seen" ? "لم يطّلع أحد بعد." : "اطّلع الجميع ✓"}</Box>
            ) : (
              <TableContainer sx={{ maxHeight: 420, border: `1px solid ${p.border}`, borderRadius: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>الموظف</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>الوظيفة</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>الفرع</TableCell>
                      {tab === "seen" ? <TableCell sx={{ fontWeight: 800 }}>وقت الاطلاع</TableCell> : null}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={`${r.name}-${i}`} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                        <TableCell>{r.jobName || "—"}</TableCell>
                        <TableCell>{r.branchName || "—"}</TableCell>
                        {tab === "seen" ? <TableCell sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmtDateTime(r.seenAt)}</TableCell> : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ---------- الإضافة والتعديل ----------
const EditorDialog = ({ open, initial, options, onClose, onSaved }) => {
  const p = useTasksPalette();
  const userGuid = getUserGuid();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (!initial) {
      setForm(emptyForm);
      return;
    }
    const targets = Array.isArray(initial.targets) ? initial.targets : [];
    const pick = (type) => targets.filter((t) => t.TargetType === type).map((t) => String(t.TargetValue).toLowerCase());
    const users = pick("user");
    setForm({
      alertGuid: initial.alertGuid,
      title: initial.title || "",
      message: initial.message || "",
      alertType: initial.alertType || "info",
      displayStyle: initial.displayStyle || "standard",
      extra: { ...BLESSING_DEFAULTS, ...(initial.extra || {}) },
      startAt: toInput(initial.startAt),
      endAt: toInput(initial.endAt),
      isActive: Boolean(initial.isActive),
      audience: targets.length ? "custom" : "all",
      jobs: pick("job"),
      branches: pick("branch"),
      users: (options?.users || []).filter((u) => users.includes(String(u.userGuid).toLowerCase()))
    });
  }, [open, initial, options]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setExtra = (patch) => setForm((f) => ({ ...f, extra: { ...f.extra, ...patch } }));
  const toggle = (key, value) => setForm((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));

  // عدد الجمهور تقريبيًا من قائمة الموظفين النشطين
  const audienceCount = useMemo(() => {
    const users = options?.users || [];
    if (form.audience === "all") return users.length;
    const branchByName = new Map((options?.branches || []).map((b) => [b.name, b.value.toLowerCase()]));
    const picked = new Set(form.users.map((u) => String(u.userGuid).toLowerCase()));
    return users.filter((u) =>
      picked.has(String(u.userGuid).toLowerCase())
      || form.jobs.includes(String(u.jobCode))
      || (u.branchName && form.branches.includes(branchByName.get(u.branchName)))
    ).length;
  }, [form, options]);

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setError("يُرجى كتابة العنوان ونص الرسالة.");
      return;
    }
    if (form.audience === "custom" && !form.jobs.length && !form.branches.length && !form.users.length) {
      setError("اختر وظيفة أو فرعًا أو موظفًا واحدًا على الأقل، أو اجعل الجمهور «الكل».");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const targets = form.audience === "all" ? [] : [
        ...form.jobs.map((v) => ({ type: "job", value: v })),
        ...form.branches.map((v) => ({ type: "branch", value: v })),
        ...form.users.map((u) => ({ type: "user", value: u.userGuid }))
      ];
      await readJson(await fetch(`${API}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userGuid,
          alertGuid: form.alertGuid,
          title: form.title.trim(),
          message: form.message.trim(),
          alertType: form.alertType,
          displayStyle: form.displayStyle,
          extra: form.displayStyle === "blessing" ? form.extra : null,
          priority: form.displayStyle === "blessing" ? 200 : 100,
          startAt: form.startAt || null,
          endAt: form.endAt || null,
          isActive: form.isActive,
          targets
        })
      }));
      toast("تم الحفظ");
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const blessing = form.displayStyle === "blessing";
  const styleCard = (value, title, hint, Icon, color) => {
    const selected = form.displayStyle === value;
    return (
      <Box
        role="button" tabIndex={0} aria-pressed={selected}
        onClick={() => set({ displayStyle: value })} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && set({ displayStyle: value })}
        sx={{
          p: 1.5, borderRadius: 2.5, cursor: "pointer", outline: "none", transition: "all .15s",
          border: `1.5px solid ${selected ? color : p.border}`, bgcolor: selected ? p.tone(color).bg : "transparent",
          "&:hover, &:focus-visible": { borderColor: color }
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <Icon sx={{ color, mt: 0.25 }} />
          <Box>
            <Box sx={{ fontWeight: 800, color: p.text }}>{title}</Box>
            <Box sx={{ fontSize: 12.5, color: p.muted, lineHeight: 1.7 }}>{hint}</Box>
          </Box>
        </Stack>
      </Box>
    );
  };

  return (
    <>
      <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" dir="rtl" scroll="paper">
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          {form.alertGuid ? "تعديل" : "إضافة تنبيه أو إعلان"}
          <IconButton onClick={onClose} disabled={saving} sx={{ position: "absolute", left: 12, top: 12 }} aria-label="إغلاق"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          <Stack spacing={2.25}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
              {styleCard("standard", "تنبيه عادي", "نافذة بسيطة بأيقونة ونوع التنبيه وزر «تم الاطلاع».", NotificationsActiveOutlinedIcon, "#3b82f6")}
              {styleCard("blessing", "إعلان مميز (مطر)", "ينزل من السماء ومعه مطر، بعنوان ذهبي وتوقيع، لرسائل الإدارة المهمة.", WaterDropIcon, "#0ea5e9")}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: blessing ? "1fr" : "2fr 1fr" }, gap: 1.5 }}>
              <Field label="العنوان">
                <TextField size="small" fullWidth value={form.title} onChange={(e) => set({ title: e.target.value })} inputProps={{ maxLength: 200 }} />
              </Field>
              {!blessing ? (
                <Field label="نوع التنبيه">
                  <TextField select size="small" fullWidth value={form.alertType} onChange={(e) => set({ alertType: e.target.value })}>
                    {Object.entries(TYPES).map(([k, t]) => (
                      <MenuItem key={k} value={k}>
                        <Stack direction="row" spacing={1} alignItems="center"><Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: t.color }} /><span>{t.label}</span></Stack>
                      </MenuItem>
                    ))}
                  </TextField>
                </Field>
              ) : null}
            </Box>

            <Field label="نص الرسالة">
              <TextField fullWidth multiline minRows={4} value={form.message} onChange={(e) => set({ message: e.target.value })} sx={multilineSx(96, 260)} />
            </Field>

            {blessing ? (
              <Box sx={{ p: 2, borderRadius: 2.5, border: `1px dashed ${p.borderStrong}` }}>
                <Box sx={{ fontWeight: 800, color: p.text, mb: 1.5 }}>تفاصيل الإعلان المميز</Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <Field label="السطر الصغير أعلى العنوان">
                    <TextField size="small" fullWidth value={form.extra.kicker} onChange={(e) => setExtra({ kicker: e.target.value })} />
                  </Field>
                  <Field label="الشعار">
                    <TextField size="small" fullWidth value={form.extra.slogan} onChange={(e) => setExtra({ slogan: e.target.value })} />
                  </Field>
                  <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                    <Field label="سطر مميز (يظهر في إطار ذهبي)" hint="اتركه فارغًا إذا لم يكن مطلوبًا.">
                      <TextField size="small" fullWidth value={form.extra.highlight} onChange={(e) => setExtra({ highlight: e.target.value })} />
                    </Field>
                  </Box>
                  <Field label="قبل التوقيع">
                    <TextField size="small" fullWidth value={form.extra.signatureLabel} onChange={(e) => setExtra({ signatureLabel: e.target.value })} />
                  </Field>
                  <Field label="التوقيع">
                    <TextField size="small" fullWidth value={form.extra.signatureName} onChange={(e) => setExtra({ signatureName: e.target.value })} />
                  </Field>
                  <Field label="نص الزر">
                    <TextField size="small" fullWidth value={form.extra.buttonText} onChange={(e) => setExtra({ buttonText: e.target.value })} />
                  </Field>
                </Box>
              </Box>
            ) : null}

            {/* الجمهور */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                <Box sx={{ fontWeight: 800, color: p.text }}>من يرى هذا؟</Box>
                <Box sx={{ fontSize: 13, fontWeight: 700, color: p.text }}>سيصل إلى {fmt(audienceCount)} موظف نشط</Box>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <Chip label="الكل" clickable color={form.audience === "all" ? "primary" : "default"} variant={form.audience === "all" ? "filled" : "outlined"} onClick={() => set({ audience: "all" })} />
                <Chip label="فئات محددة" clickable color={form.audience === "custom" ? "primary" : "default"} variant={form.audience === "custom" ? "filled" : "outlined"} onClick={() => set({ audience: "custom" })} />
              </Stack>
              {form.audience === "custom" ? (
                <Stack spacing={1.75}>
                  <Field label="الوظائف">
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {(options?.jobs || []).map((j) => {
                        const on = form.jobs.includes(j.value);
                        return <Chip key={j.value} clickable size="small" label={`${j.name} (${fmt(j.count)})`} color={on ? "primary" : "default"} variant={on ? "filled" : "outlined"} onClick={() => toggle("jobs", j.value)} />;
                      })}
                    </Stack>
                  </Field>
                  <Field label="الفروع">
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {(options?.branches || []).map((b) => {
                        const on = form.branches.includes(b.value.toLowerCase());
                        return <Chip key={b.value} clickable size="small" label={`${b.name} (${fmt(b.count)})`} color={on ? "primary" : "default"} variant={on ? "filled" : "outlined"} onClick={() => toggle("branches", b.value.toLowerCase())} />;
                      })}
                    </Stack>
                  </Field>
                  <Field label="موظفون بالاسم" hint="يكفي أن يطابق الموظف أي اختيار من الوظائف أو الفروع أو الأسماء.">
                    <Autocomplete
                      multiple
                      size="small"
                      options={options?.users || []}
                      value={form.users}
                      onChange={(_, v) => set({ users: v })}
                      isOptionEqualToValue={(a, b) => String(a.userGuid).toLowerCase() === String(b.userGuid).toLowerCase()}
                      getOptionLabel={(u) => u.name || ""}
                      filterOptions={(opts, { inputValue }) => {
                        const q = inputValue.trim();
                        return (q ? opts.filter((u) => [u.name, u.jobName, u.branchName].some((v) => String(v || "").includes(q))) : opts).slice(0, 80);
                      }}
                      renderOption={(props, u) => (
                        <li {...props} key={u.userGuid}>
                          <Box>
                            <Box sx={{ fontWeight: 700 }}>{u.name}</Box>
                            <Box sx={{ fontSize: 12, color: p.muted }}>{[u.jobName, u.branchName].filter(Boolean).join(" — ")}</Box>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => <TextField {...params} placeholder="ابحث بالاسم أو الوظيفة أو الفرع" />}
                      noOptionsText="لا يوجد موظفون مطابقون"
                    />
                  </Field>
                </Stack>
              ) : null}
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" }, gap: 1.5, alignItems: "end" }}>
              <Field label="يبدأ الظهور (اختياري)">
                <TextField type="datetime-local" size="small" fullWidth value={form.startAt} onChange={(e) => set({ startAt: e.target.value })} />
              </Field>
              <Field label="ينتهي الظهور (اختياري)">
                <TextField type="datetime-local" size="small" fullWidth value={form.endAt} onChange={(e) => set({ endAt: e.target.value })} />
              </Field>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ pb: 0.5 }}>
                <Switch checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
                <Box sx={{ fontWeight: 700, color: p.text }}>{form.isActive ? "مفعّل" : "مسودة"}</Box>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.75 }}>
          <Button startIcon={<VisibilityOutlinedIcon />} onClick={() => setPreview(true)} disabled={!form.title.trim()}>معاينة</Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>حفظ</Button>
        </DialogActions>
      </Dialog>

      <AnnouncementDialog
        alert={preview ? { title: form.title, message: form.message || "نص الرسالة يظهر هنا.", alertType: form.alertType, displayStyle: form.displayStyle, extra: form.extra } : null}
        open={preview}
        preview
        onClose={() => setPreview(false)}
      />
    </>
  );
};

// ---------- الصفحة ----------
export default function AnnouncementsAdmin() {
  const p = useTasksPalette();
  const userGuid = getUserGuid();
  const [data, setData] = useState(null);
  const [options, setOptions] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [editor, setEditor] = useState({ open: false, item: null });
  const [seenFor, setSeenFor] = useState(null);
  const [previewFor, setPreviewFor] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    try {
      setData(await readJson(await fetch(`${API}/list?${new URLSearchParams({ userGuid })}`, { cache: "no-store" })));
    } catch (e) {
      if (e.status === 403) setForbidden(true);
      else showError(e);
    }
  };

  useEffect(() => {
    load();
    fetch(`${API}/options?${new URLSearchParams({ userGuid })}`, { cache: "no-store" }).then(readJson).then(setOptions).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActive = async (item, isActive) => {
    setBusy(item.alertGuid);
    try {
      const r = await readJson(await fetch(`${API}/${item.alertGuid}/active`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userGuid, isActive })
      }));
      toast(r.message);
      await load();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (item) => {
    if (!(await confirmAction("حذف نهائي", `سيُحذف «${item.title}» وسجل من اطّلع عليه.`, true))) return;
    try {
      await readJson(await fetch(`${API}/${item.alertGuid}?${new URLSearchParams({ userGuid })}`, { method: "DELETE" }));
      toast("تم الحذف");
      await load();
    } catch (e) {
      showError(e);
    }
  };

  const audienceText = (item) => {
    const targets = Array.isArray(item.targets) ? item.targets : [];
    if (!targets.length) return "الكل";
    const count = (type) => targets.filter((t) => t.TargetType === type).length;
    return [
      count("job") ? `${fmt(count("job"))} وظيفة` : null,
      count("branch") ? `${fmt(count("branch"))} فرع` : null,
      count("user") ? `${fmt(count("user"))} موظف` : null
    ].filter(Boolean).join("، ");
  };

  if (forbidden) return <NoAccess message="ليس لديك صلاحية على شاشة التنبيهات والإعلانات." />;
  const canEdit = data?.canEdit;

  return (
    <TasksPageShell
      icon={<CampaignIcon />}
      title="التنبيهات والإعلانات"
      subtitle="تنبيهات النظام وإعلانات الإدارة في مكان واحد: من يراها، ومتى، ومن اطّلع عليها"
      actions={canEdit ? (
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditor({ open: true, item: null })} sx={{ whiteSpace: "nowrap" }}>
          إضافة تنبيه أو إعلان
        </Button>
      ) : null}
    >
      {!data ? <CenterLoader /> : data.items.length === 0 ? (
        <EmptyState text="لا توجد تنبيهات أو إعلانات بعد" hint="أضف أول تنبيه أو إعلان ليظهر للموظفين في أي صفحة." />
      ) : (
        <Stack spacing={1.5}>
          {data.items.map((item) => {
            const pct = item.audienceCount ? Math.min(100, Math.round((100 * item.seenCount) / item.audienceCount)) : 0;
            return (
              <SectionCard key={item.alertGuid} sx={{ p: 2, opacity: item.isActive ? 1 : 0.72 }}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Box sx={{ fontWeight: 800, fontSize: 16, color: p.text }}>{item.title}</Box>
                      <StyleChip item={item} />
                      {!item.isActive ? <Chip size="small" label="مسودة / متوقف" sx={{ height: 22 }} /> : null}
                    </Stack>
                    <Box sx={{ fontSize: 13, color: p.muted, mt: 0.75, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.8 }}>
                      {item.message}
                    </Box>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1, fontSize: 12.5, color: p.muted }}>
                      <span>الجمهور: <b style={{ color: p.text }}>{audienceText(item)}</b></span>
                      {item.startAt || item.endAt ? <span>الظهور: {item.startAt ? `من ${fmtDateTime(item.startAt)}` : ""} {item.endAt ? `حتى ${fmtDateTime(item.endAt)}` : ""}</span> : null}
                      {item.createdBy ? <span>أضافه: {item.createdBy}</span> : null}
                    </Stack>
                  </Box>

                  {/* نسبة الاطلاع */}
                  <Tooltip title="اضغط لعرض من اطّلع ومن لم يطّلع">
                    <Box role="button" tabIndex={0} onClick={() => setSeenFor(item)} onKeyDown={(e) => e.key === "Enter" && setSeenFor(item)}
                      sx={{ minWidth: 190, cursor: "pointer", p: 1.25, borderRadius: 2, border: `1px solid ${p.border}`, "&:hover": { borderColor: p.primary } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                        <Box sx={{ fontSize: 12.5, color: p.muted, fontWeight: 700 }}>اطّلع</Box>
                        <Box sx={{ fontWeight: 800, color: p.text, fontVariantNumeric: "tabular-nums" }}>{fmt(item.seenCount)} / {fmt(item.audienceCount)}</Box>
                      </Stack>
                      <Box sx={{ mt: 0.75, height: 8, borderRadius: 1, bgcolor: p.dark ? "rgba(255,255,255,.08)" : "#e8efeb", overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: p.dark ? "#4fae84" : "#057546", borderRadius: 1 }} />
                      </Box>
                    </Box>
                  </Tooltip>

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {canEdit ? (
                      <Tooltip title={item.isActive ? "إيقاف" : "تفعيل"}>
                        <span><Switch checked={item.isActive} disabled={busy === item.alertGuid} onChange={(e) => setActive(item, e.target.checked)} /></span>
                      </Tooltip>
                    ) : null}
                    <Tooltip title="معاينة"><IconButton onClick={() => setPreviewFor(item)}><VisibilityOutlinedIcon /></IconButton></Tooltip>
                    <Tooltip title="من اطّلع"><IconButton onClick={() => setSeenFor(item)}><GroupsOutlinedIcon /></IconButton></Tooltip>
                    {canEdit ? (
                      <>
                        <Tooltip title="تعديل"><IconButton onClick={() => setEditor({ open: true, item })}><EditOutlinedIcon /></IconButton></Tooltip>
                        <Tooltip title="حذف"><IconButton onClick={() => remove(item)} sx={{ color: "#ef4444" }}><DeleteOutlineIcon /></IconButton></Tooltip>
                      </>
                    ) : null}
                  </Stack>
                </Stack>
              </SectionCard>
            );
          })}
        </Stack>
      )}

      <EditorDialog
        open={editor.open}
        initial={editor.item}
        options={options}
        onClose={() => setEditor({ open: false, item: null })}
        onSaved={() => { setEditor({ open: false, item: null }); load(); }}
      />
      <SeenDialog item={seenFor} onClose={() => setSeenFor(null)} />
      <AnnouncementDialog alert={previewFor} open={Boolean(previewFor)} preview onClose={() => setPreviewFor(null)} />
    </TasksPageShell>
  );
}
