// نوافذ مركز خدمة العملاء: ملف العميل الموحّد، تسجيل مكالمة، تسجيل عميل جديد، والإعدادات.
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AddIcon from "@mui/icons-material/Add";
import AddIcCallIcon from "@mui/icons-material/AddIcCall";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { SSTLI_API_URL } from "../../config/apiUrls";
import { useTasksPalette } from "../tasks/tasksCommon";
import { CenterLoader, SoftChip, showError, toast, multilineSx } from "../tasks/TasksUi";
import StudentStatementDialog from "../../components/StudentStatementDialog";
import {
  CS_PRIORITY, GREEN, RED, TICKET_TYPES, csGet, csSend, fmtDate, fmtDateTime, skewOf, slaState,
  telHref, toClient, whatsappHref
} from "./csCommon";
import { loadStaff } from "./TicketDrawer";

// نفس قوائم شاشة خدمة العملاء القديمة (القيمة = الترتيب + 1، ومحفوظة كده في CrmCall)
export const PROGRAMS = ["دبلوم الإدارة المكتبية", "دبلوم الموارد البشرية", "دبلوم إدارة الأعمال", "دبلوم القانون", "دبلوم المستشفيات",
  "دبلوم الأمن السيبراني", "دبلوم مشارك مكتبي", "دبلوم إدارة السلامة", "دبلوم المحاسبة", "دورة الحاسب الآلي 3 شهور",
  "دورة الحاسب الآلي 6 شهور", "دورة الإدارة المكتبية 3 شهور", "دورة الإدارة المكتبية 6 شهور", "دورات تطويرية", "أخرى"];
export const TOPICS = ["الرسوم الدراسية", "التسجيل", "الاختبارات", "شهادة التخرج", "جدول الدراسة", "التجسير", "أخرى"];
const COMPLAINT_SOURCES = ["موظف إداري", "مدرب", "مشرف فرع", "مسوق", "أخرى"];

const Label = ({ children }) => {
  const p = useTasksPalette();
  return <Box sx={{ fontSize: 13, color: p.muted, mb: 0.75, mt: 1.75, fontWeight: 600 }}>{children}</Box>;
};

const Stat = ({ label, value, color }) => {
  const p = useTasksPalette();
  return (
    <Box sx={{ flex: 1, minWidth: 105, p: 1.5, borderRadius: 2.5, bgcolor: p.tone(color).bg }}>
      <Box sx={{ fontSize: 24, fontWeight: 800, color: p.tone(color).fg, lineHeight: 1.2 }}>{value}</Box>
      <Box sx={{ fontSize: 12.5, color: p.muted, mt: 0.25 }}>{label}</Box>
    </Box>
  );
};

const StaffOption = (props, o, p) => (
  <li {...props} key={o.guid}>
    <Box>
      <Box sx={{ fontWeight: 700, fontSize: 14 }}>{o.name}</Box>
      <Box sx={{ fontSize: 12, color: p.muted }}>{[o.jobTitle, o.branch].filter(Boolean).join(" — ")}</Box>
    </Box>
  </li>
);

// ===================== ملف العميل =====================
export const CustomerProfileView = ({ accountGuid, onOpenTicket, onNewCall, reloadKey = 0 }) => {
  const p = useTasksPalette();
  const [data, setData] = useState(null);
  const [study, setStudy] = useState(null);
  const [tab, setTab] = useState(0);
  const [statementOpen, setStatementOpen] = useState(false);

  useEffect(() => {
    if (!accountGuid) return;
    setData(null);
    setStudy(null);
    csGet(`/customers/${accountGuid}`).then(setData).catch(showError);
    axios.get(`${SSTLI_API_URL}/api/studyinfo/${accountGuid}`).then((r) => setStudy(Array.isArray(r.data) ? r.data : [])).catch(() => setStudy([]));
  }, [accountGuid, reloadKey]);

  if (!data) return <CenterLoader />;
  const skew = skewOf(data.serverNow);
  const pr = data.profile;
  const openCount = data.tickets.filter((t) => t.isOpen).length;
  const complaints = data.tickets.filter((t) => t.callType === 2).length;

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }} flexWrap="wrap" useFlexGap>
          <Box sx={{ fontSize: 20, fontWeight: 800, color: p.text }}>{pr.name}</Box>
          {pr.isVip ? <SoftChip icon={<StarIcon />} label="عميل VIP" color="#b45309" strong /> : null}
          {openCount ? <SoftChip label={`${openCount} تذكرة مفتوحة`} color={RED} /> : null}
        </Stack>
        <Stack direction="row" spacing={1}>
          {onNewCall ? (
            <Button variant="contained" startIcon={<AddIcCallIcon />} onClick={onNewCall} sx={{ bgcolor: "#057546", color: "#fff", "&:hover": { bgcolor: "#04633b" } }}>
              تسجيل مكالمة
            </Button>
          ) : null}
          <Button variant="outlined" startIcon={<ReceiptLongIcon />} onClick={() => setStatementOpen(true)}>كشف الحساب</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, p: 1.5, borderRadius: 2.5, bgcolor: p.nested }}>
        {[
          ["الجوال", pr.tel], ["جوال آخر", pr.tel2], ["رقم الهوية", pr.nationalId], ["البريد", pr.email],
          ["الفرع", pr.branch], ["الرقم الأكاديمي", pr.academyId], ["الجنسية", pr.isForeign ? "مقيم" : "سعودي"]
        ].filter(([, v]) => v).map(([k, v]) => (
          <Stack key={k} direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 100, fontSize: 13, color: p.muted }}>{k}</Box>
            <Box sx={{ fontSize: 13.5, fontWeight: 700, color: p.text }}><bdi>{v}</bdi></Box>
            {k === "الجوال" || k === "جوال آخر" ? (
              <>
                <IconButton size="small" component="a" href={telHref(v)} sx={{ color: GREEN }}><PhoneIcon fontSize="small" /></IconButton>
                <IconButton size="small" component="a" href={whatsappHref(v)} target="_blank" rel="noreferrer" sx={{ color: "#16a34a" }}><WhatsAppIcon fontSize="small" /></IconButton>
              </>
            ) : null}
          </Stack>
        ))}
      </Box>
      {pr.vipNotes ? <Box sx={{ mt: 1, p: 1.25, borderRadius: 2, bgcolor: p.tone("#b45309").bg, fontSize: 13.5 }}>ملاحظات VIP: {pr.vipNotes}</Box> : null}

      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
        <Stat label="إجمالي التذاكر" value={data.tickets.length} color="#2563eb" />
        <Stat label="مفتوحة الآن" value={openCount} color={openCount ? RED : GREEN} />
        <Stat label="شكاوى" value={complaints} color="#dc2626" />
        <Stat label="ما بعد البيع" value={data.afterSales.length} color="#0e7490" />
        <Stat label="التسجيلات" value={data.registrations.length} color="#7c3aed" />
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mt: 1.5, borderBottom: `1px solid ${p.border}` }}>
        <Tab label={`التذاكر (${data.tickets.length})`} />
        <Tab label={`الملف التدريبي (${study ? study.length : "…"})`} />
        <Tab label={`التسجيلات (${data.registrations.length})`} />
        <Tab label={`ما بعد البيع (${data.afterSales.length})`} />
      </Tabs>

      <Box sx={{ pt: 1.5 }}>
        {tab === 0 && (data.tickets.length === 0 ? <Box sx={{ color: p.muted, py: 2 }}>لا توجد تذاكر لهذا العميل.</Box> : (
          <Stack spacing={1}>
            {data.tickets.map((t) => {
              const type = TICKET_TYPES[t.callType] || TICKET_TYPES[0];
              const sla = slaState(t);
              return (
                <Box key={t.guid} onClick={() => onOpenTicket(t.guid)}
                  sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${p.border}`, borderInlineStart: `4px solid ${type.color}`, cursor: "pointer", "&:hover": { bgcolor: p.hover } }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Box sx={{ fontWeight: 800, fontSize: 13.5 }}>#{t.number}</Box>
                    <SoftChip label={type.label} color={type.color} />
                    <SoftChip label={sla.label} color={sla.color} />
                    <Box sx={{ fontSize: 12, color: p.muted, mr: "auto" }}>{fmtDateTime(toClient(t.createdAt, skew))} · {t.creatorName}</Box>
                  </Stack>
                  <Box sx={{ fontSize: 13, color: p.text, mt: 0.5, whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {t.complainDetails || t.notes || "—"}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        ))}
        {tab === 1 && (!study ? <CenterLoader /> : study.length === 0 ? <Box sx={{ color: p.muted, py: 2 }}>لا يوجد ملف تدريبي.</Box> : (
          <Stack spacing={1}>
            {study.map((s, i) => (
              <Box key={i} sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${p.border}` }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Box sx={{ fontWeight: 800, fontSize: 14 }}>{s.diplom || "—"}</Box>
                  {s.level ? <SoftChip label={s.level} color="#7c3aed" /> : null}
                  {s.status ? <SoftChip label={s.status} color="#0e7490" /> : null}
                </Stack>
                <Box sx={{ fontSize: 12.5, color: p.muted, mt: 0.5 }}>
                  {[s.batch && `الدفعة ${s.batch}`, s.branch, s.dateStart && `من ${fmtDate(new Date(s.dateStart))}`, s.dateEnd && `إلى ${fmtDate(new Date(s.dateEnd))}`].filter(Boolean).join(" · ")}
                </Box>
                {s.notes ? <Box sx={{ fontSize: 13, mt: 0.5 }}>{s.notes}</Box> : null}
              </Box>
            ))}
          </Stack>
        ))}
        {tab === 2 && (data.registrations.length === 0 ? <Box sx={{ color: p.muted, py: 2 }}>لا توجد تسجيلات.</Box> : (
          <Stack spacing={1}>
            {data.registrations.map((r, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${p.border}` }}>
                <Box sx={{ fontWeight: 800, fontSize: 13.5 }}>سند {r.code}</Box>
                <Box sx={{ fontSize: 13.5 }}>{r.program || "—"}</Box>
                {r.batch ? <Box sx={{ fontSize: 12, color: p.muted }}>دفعة {r.batch}</Box> : null}
                <Box sx={{ fontSize: 12, color: p.muted }}>{r.branch}</Box>
                <Box sx={{ mr: "auto", fontSize: 12.5, color: p.muted }}>{fmtDate(toClient(r.regDate, skew))}</Box>
                <SoftChip label={`${Number(r.total || 0).toLocaleString("en-US")} ر.س`} color="#475569" />
                <SoftChip label={r.isPaid ? "مدفوع" : "غير مدفوع"} color={r.isPaid ? GREEN : RED} />
              </Stack>
            ))}
          </Stack>
        ))}
        {tab === 3 && (data.afterSales.length === 0 ? <Box sx={{ color: p.muted, py: 2 }}>لا توجد متابعات ما بعد البيع.</Box> : (
          <Stack spacing={1}>
            {data.afterSales.map((n, i) => (
              <Box key={i} sx={{ p: 1.25, borderRadius: 2, bgcolor: p.nested, borderInlineStart: "3px solid #0e7490" }}>
                <Box sx={{ fontSize: 13.5, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{n.notes}</Box>
                <Box sx={{ fontSize: 12, color: p.muted, mt: 0.5 }}>{fmtDateTime(toClient(n.at, skew))} · {n.userName} · سند {n.regCode}</Box>
              </Box>
            ))}
          </Stack>
        ))}
      </Box>
      <StudentStatementDialog open={statementOpen} onClose={() => setStatementOpen(false)} accountGuid={accountGuid} />
    </Box>
  );
};

export const CustomerProfileDialog = ({ accountGuid, onClose, onOpenTicket }) => (
  <Dialog open={Boolean(accountGuid)} onClose={onClose} fullWidth maxWidth="md" dir="rtl" sx={{ zIndex: (th) => th.zIndex.modal + 1 }}>
    <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
      ملف العميل
      <IconButton onClick={onClose} sx={{ position: "absolute", left: 12, top: 12 }} aria-label="إغلاق"><CloseIcon /></IconButton>
    </DialogTitle>
    <DialogContent dividers sx={{ minHeight: 420 }}>
      {accountGuid ? <CustomerProfileView accountGuid={accountGuid} onOpenTicket={onOpenTicket} /> : null}
    </DialogContent>
  </Dialog>
);

// ===================== تسجيل مكالمة =====================
export const CallDialog = ({ open, customer, onClose, onCreated }) => {
  const p = useTasksPalette();
  const [type, setType] = useState(0);
  const [program, setProgram] = useState("");
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState(2);
  const [mode, setMode] = useState("closed");
  const [staff, setStaff] = useState([]);
  const [forwardTo, setForwardTo] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(0); setProgram(""); setTopic(""); setSource(""); setDetails(""); setPriority(2); setMode("closed"); setForwardTo(null);
    loadStaff().then(setStaff).catch(() => {});
  }, [open]);

  useEffect(() => { setPriority(type === 2 ? 3 : 2); }, [type]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await csSend("/tickets", {
        accountGuid: customer.accountGuid,
        callType: type,
        priority,
        programInquiry: type === 1 ? program || null : null,
        studyInquiryTopic: type === 1 ? topic || null : null,
        complainSource: type === 2 ? source : null,
        close: mode === "closed",
        forwardToGuid: mode === "forward" ? forwardTo?.guid : null,
        ...(type === 2 ? { complainDetails: details } : { notes: details })
      });
      toast(r.number ? `تم تسجيل المكالمة — تذكرة #${r.number}` : "تم تسجيل المكالمة");
      onCreated(r.guid, mode !== "closed");
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const valid = details.trim() && (type !== 1 || (program && topic)) && (type !== 2 || source) && (mode !== "forward" || forwardTo);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl" disableEnforceFocus>
      <DialogTitle sx={{ fontWeight: 800 }}>
        تسجيل مكالمة
        <Box sx={{ fontSize: 13, color: p.muted, fontWeight: 600 }}>{customer?.name}</Box>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 0.5 }}>
        <Label>نوع المكالمة</Label>
        <ToggleButtonGroup exclusive fullWidth size="small" value={type} onChange={(_, v) => v !== null && setType(v)}>
          {[0, 1, 2].map((k) => (
            <ToggleButton key={k} value={k} sx={{ fontWeight: 700, "&.Mui-selected": { color: TICKET_TYPES[k].color, bgcolor: p.tone(TICKET_TYPES[k].color).bg } }}>
              {TICKET_TYPES[k].label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {type === 1 ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box sx={{ flex: 1.3 }}>
              <Label>البرنامج</Label>
              <Select fullWidth size="small" displayEmpty value={program} onChange={(e) => setProgram(e.target.value)}>
                <MenuItem value="" disabled>اختر البرنامج</MenuItem>
                {PROGRAMS.map((l, i) => <MenuItem key={i} value={i + 1}>{l}</MenuItem>)}
              </Select>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Label>موضوع الاستفسار</Label>
              <Select fullWidth size="small" displayEmpty value={topic} onChange={(e) => setTopic(e.target.value)}>
                <MenuItem value="" disabled>اختر الموضوع</MenuItem>
                {TOPICS.map((l, i) => <MenuItem key={i} value={i + 1}>{l}</MenuItem>)}
              </Select>
            </Box>
          </Stack>
        ) : null}
        {type === 2 ? (
          <>
            <Label>الشكوى من</Label>
            <Select fullWidth size="small" displayEmpty value={source} onChange={(e) => setSource(e.target.value)}>
              <MenuItem value="" disabled>اختر</MenuItem>
              {COMPLAINT_SOURCES.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </Select>
          </>
        ) : null}

        <Label>{type === 2 ? "تفاصيل الشكوى" : "تفاصيل المكالمة"}</Label>
        <TextField fullWidth multiline minRows={3} value={details} onChange={(e) => setDetails(e.target.value)} sx={multilineSx(80, 220)}
          inputProps={{ maxLength: type === 2 ? 4000 : 590 }} placeholder="ما الذي طلبه العميل؟ وما الذي قُدِّم له؟" />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1.4 }}>
            <Label>حالة المكالمة</Label>
            <Select fullWidth size="small" value={mode} onChange={(e) => setMode(e.target.value)}>
              <MenuItem value="closed">مكتملة — تم الرد أثناء المكالمة</MenuItem>
              <MenuItem value="open">متابعة لاحقًا — أتابعها بنفسي</MenuItem>
              <MenuItem value="forward">متابعة لاحقًا — تحويل لموظف</MenuItem>
            </Select>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Label>الأولوية</Label>
            <Select fullWidth size="small" value={priority} onChange={(e) => setPriority(e.target.value)} disabled={mode === "closed"}>
              {[1, 2, 3, 4].map((k) => <MenuItem key={k} value={k}>{CS_PRIORITY[k].label}</MenuItem>)}
            </Select>
          </Box>
        </Stack>

        {mode === "forward" ? (
          <>
            <Label>المحوَّل إليه</Label>
            <Autocomplete
              options={staff}
              value={forwardTo}
              onChange={(_, v) => setForwardTo(v)}
              groupBy={(o) => (o.jobCode === 9 ? "مشرفو الفروع" : o.jobCode === 18 ? "المبيعات" : "الموظفون")}
              getOptionLabel={(o) => o.name || ""}
              isOptionEqualToValue={(a, b) => a.guid === b.guid}
              renderOption={(props, o) => StaffOption(props, o, p)}
              renderInput={(params) => <TextField {...params} placeholder="ابحث بالاسم…" />}
              noOptionsText="لا يوجد موظف لديه صلاحية مركز خدمة العملاء"
            />
          </>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={{ color: p.muted }}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={!valid || saving} sx={{ bgcolor: "#057546", color: "#fff", "&:hover": { bgcolor: "#04633b" } }}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}>
          حفظ المكالمة
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ===================== تسجيل عميل جديد =====================
export const NewCustomerDialog = ({ open, initial, onClose, onCreated }) => {
  const p = useTasksPalette();
  const [form, setForm] = useState({});
  const [sectors, setSectors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const q = String(initial || "").trim();
    const digits = q.replace(/\D/g, "");
    setForm({
      name: digits ? "" : q,
      nationalId: /^[123]\d{9}$/.test(digits) ? digits : "",
      tel: /^05\d{8}$/.test(digits) ? digits : "",
      email: "", gender: "", nationality: "", sectorGuid: "", notes: ""
    });
    csGet("/sectors").then((s) => { setSectors(s); setForm((f) => ({ ...f, sectorGuid: f.sectorGuid || s[0]?.guid || "" })); }).catch(() => {});
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await csSend("/customers", {
        name: form.name, nationalId: form.nationalId, tel: form.tel, email: form.email,
        gender: Number(form.gender), nationality: Number(form.nationality), sectorGuid: form.sectorGuid || null, notes: form.notes
      });
      toast("تم تسجيل العميل");
      onCreated(r.accountGuid);
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const valid = form.name?.trim() && /^[123]\d{9}$/.test(form.nationalId || "") && /^05\d{8}$/.test(form.tel || "") && form.gender !== "" && form.nationality !== "";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle sx={{ fontWeight: 800 }}>تسجيل عميل جديد</DialogTitle>
      <DialogContent dividers sx={{ pt: 0.5 }}>
        <Label>الاسم الكامل</Label>
        <TextField fullWidth size="small" value={form.name || ""} onChange={set("name")} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Label>رقم الهوية</Label>
            <TextField fullWidth size="small" value={form.nationalId || ""} onChange={set("nationalId")} inputProps={{ dir: "ltr", maxLength: 10, inputMode: "numeric" }}
              error={Boolean(form.nationalId) && !/^[123]\d{9}$/.test(form.nationalId)} helperText={form.nationalId && !/^[123]\d{9}$/.test(form.nationalId) ? "10 أرقام تبدأ بـ 1 أو 2 أو 3" : " "} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Label>رقم الجوال</Label>
            <TextField fullWidth size="small" value={form.tel || ""} onChange={set("tel")} inputProps={{ dir: "ltr", maxLength: 10, inputMode: "numeric" }}
              error={Boolean(form.tel) && !/^05\d{8}$/.test(form.tel)} helperText={form.tel && !/^05\d{8}$/.test(form.tel) ? "10 أرقام تبدأ بـ 05" : " "} />
          </Box>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Label>الجنس</Label>
            <Select fullWidth size="small" displayEmpty value={form.gender ?? ""} onChange={set("gender")}>
              <MenuItem value="" disabled>اختر</MenuItem>
              <MenuItem value="0">ذكر</MenuItem>
              <MenuItem value="1">أنثى</MenuItem>
            </Select>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Label>الجنسية</Label>
            <Select fullWidth size="small" displayEmpty value={form.nationality ?? ""} onChange={set("nationality")}>
              <MenuItem value="" disabled>اختر</MenuItem>
              <MenuItem value="0">سعودي</MenuItem>
              <MenuItem value="1">مقيم</MenuItem>
            </Select>
          </Box>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Label>القطاع</Label>
            <Select fullWidth size="small" value={form.sectorGuid || ""} onChange={set("sectorGuid")}>
              {sectors.map((s) => <MenuItem key={s.guid} value={s.guid}>{s.name}</MenuItem>)}
            </Select>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Label>البريد الإلكتروني (اختياري)</Label>
            <TextField fullWidth size="small" value={form.email || ""} onChange={set("email")} inputProps={{ dir: "ltr" }} />
          </Box>
        </Stack>
        <Label>ملاحظات (اختياري)</Label>
        <TextField fullWidth size="small" value={form.notes || ""} onChange={set("notes")} inputProps={{ maxLength: 240 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={{ color: p.muted }}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={!valid || saving} sx={{ bgcolor: "#057546", color: "#fff", "&:hover": { bgcolor: "#04633b" } }}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <PersonAddAlt1Icon />}>
          تسجيل العميل
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ===================== الإعدادات =====================
const ROLE_INFO = [
  { key: "customer-service", title: "خدمة العملاء (استقبال المكالمات)", color: GREEN },
  { key: "customer-service-center", title: "استفسارات خدمة العملاء (مستقبلو التحويل)", color: "#2563eb" },
  { key: "cs-supervisor", title: "الإشراف", color: "#7c3aed" },
  { key: "cs-management", title: "الإدارة", color: RED }
];

export const SettingsDialog = ({ open, onClose }) => {
  const p = useTasksPalette();
  const [data, setData] = useState(null);
  const [sla, setSla] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setData(null);
    csGet("/settings").then((d) => { setData(d); setSla(d.sla); }).catch(showError);
  }, [open]);

  const saveSla = async () => {
    setSaving(true);
    try {
      const r = await csSend("/settings/sla", { items: sla.map((s) => ({ ...s, dueHours: Number(s.dueHours), escalateAfterHours: Number(s.escalateAfterHours) })) }, "PUT");
      toast(r.message);
    } catch (e) { showError(e); } finally { setSaving(false); }
  };

  const setSlaField = (i, field, value) => setSla((rows) => rows.map((r, j) => (j === i ? { ...r, [field]: value } : r)));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        إعدادات مركز خدمة العملاء
        <IconButton onClick={onClose} sx={{ position: "absolute", left: 12, top: 12 }} aria-label="إغلاق"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!data ? <CenterLoader /> : (
          <>
            <Box sx={{ fontSize: 15, fontWeight: 800 }}>مهلة الحل والتصعيد</Box>
            <Box sx={{ fontSize: 12.5, color: p.muted, mt: 0.5, mb: 1.5, lineHeight: 1.8 }}>
              إذا لم تُغلق التذكرة خلال مهلة الحل تُصعَّد تلقائيًا إلى أصحاب صلاحية الإشراف ومشرف فرع الموظف المسؤول (المستوى الأول)،
              وإذا بقيت مفتوحة بعد مهلة التصعيد الثاني تُرفع إلى أصحاب صلاحية الإدارة (المستوى الثاني).
            </Box>
            <Stack spacing={1}>
              {sla.map((s, i) => (
                <Stack key={s.callType} direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ p: 1.25, borderRadius: 2, bgcolor: p.nested }}>
                  <Box sx={{ width: 130, fontWeight: 800, color: (TICKET_TYPES[s.callType] || {}).color }}>{s.typeName}</Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ fontSize: 13, color: p.muted }}>مهلة الحل</Box>
                    <TextField size="small" type="number" value={s.dueHours} onChange={(e) => setSlaField(i, "dueHours", e.target.value)} sx={{ width: 90 }} inputProps={{ min: 1, max: 720 }} />
                    <Box sx={{ fontSize: 13, color: p.muted }}>ساعة</Box>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ fontSize: 13, color: p.muted }}>التصعيد الثاني بعد</Box>
                    <TextField size="small" type="number" value={s.escalateAfterHours} onChange={(e) => setSlaField(i, "escalateAfterHours", e.target.value)} sx={{ width: 90 }} inputProps={{ min: 1, max: 720 }} />
                    <Box sx={{ fontSize: 13, color: p.muted }}>ساعة</Box>
                  </Stack>
                  <Select size="small" value={s.defaultPriority} onChange={(e) => setSlaField(i, "defaultPriority", e.target.value)} sx={{ minWidth: 120 }}>
                    {[1, 2, 3, 4].map((k) => <MenuItem key={k} value={k}>أولوية {CS_PRIORITY[k].label}</MenuItem>)}
                  </Select>
                </Stack>
              ))}
            </Stack>
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.25 }}>
              <Button variant="contained" onClick={saveSla} disabled={saving} sx={{ bgcolor: "#057546", color: "#fff", "&:hover": { bgcolor: "#04633b" } }}>حفظ المهل</Button>
            </Stack>

            <Box sx={{ fontSize: 15, fontWeight: 800, mt: 3 }}>فريق خدمة العملاء</Box>
            <Box sx={{ fontSize: 12.5, color: p.muted, mt: 0.5, mb: 1.5, lineHeight: 1.8 }}>
              الأدوار تُمنح من شاشة صلاحيات المستخدمين (صلاحية «عرض» على كل بند). من يملك «استفسارات خدمة العملاء»
              فقط يظهر في قائمة التحويل.
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
              {ROLE_INFO.map((role) => {
                const people = data.roles?.[role.key] || [];
                return (
                  <Box key={role.key} sx={{ p: 1.5, borderRadius: 2.5, border: `1px solid ${p.border}`, borderTop: `3px solid ${role.color}` }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Box sx={{ fontWeight: 800, fontSize: 13.5 }}>{role.title}</Box>
                      <SoftChip label={`${people.length}`} color={role.color} />
                    </Stack>
                    {people.length === 0 ? <Box sx={{ fontSize: 12.5, color: p.muted }}>لم تُمنح لأحد بعد.</Box> : (
                      <Box sx={{ maxHeight: 180, overflowY: "auto" }}>
                        {people.map((u) => (
                          <Box key={u.guid} sx={{ py: 0.5, borderBottom: `1px dashed ${p.border}` }}>
                            <Box sx={{ fontSize: 13, fontWeight: 700 }}>{u.name}</Box>
                            <Box sx={{ fontSize: 11.5, color: p.muted }}>{[u.jobTitle, u.branch].filter(Boolean).join(" — ")}</Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
