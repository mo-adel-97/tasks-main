// شاشة "خدمة العملاء" — /dashboard/cleints (صلاحية customer-service 225)، بدل StudentSearch القديمة.
// موظف خدمة العملاء: يستقبل المكالمة ← يبحث عن العميل (أو يسجّله) ← يسجّل المكالمة (مكتملة / متابعة / تحويل).
// الرد على المتابعات والتحويلات مش هنا؛ ده في شاشة "استفسارات خدمة العملاء".
import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import HistoryIcon from "@mui/icons-material/History";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CloseIcon from "@mui/icons-material/Close";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { useTasksPalette } from "../tasks/tasksCommon";
import { TasksPageShell, CenterLoader, NoAccess, SoftChip, toast } from "../tasks/TasksUi";
import CallDesk from "./CallDesk";
import TicketDrawer from "./TicketDrawer";
import { CustomerProfileDialog } from "./CsDialogs";
import { RED, TICKET_TYPES, ago, csGet, skewOf, slaState, toClient } from "./csCommon";

const readUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
};

const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const Stat = ({ icon, label, value, color }) => {
  const p = useTasksPalette();
  const t = p.tone(color);
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: "1 1 180px", p: 1.5, borderRadius: 3, bgcolor: p.card, border: `1px solid ${p.border}` }}>
      <Box sx={{ width: 38, height: 38, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: t.bg, color: t.fg }}>
        {React.cloneElement(icon, { sx: { fontSize: 21 } })}
      </Box>
      <Box>
        <Box sx={{ fontSize: 22, fontWeight: 800, color: p.text, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{value ?? "—"}</Box>
        <Box sx={{ fontSize: 12.5, color: p.muted, fontWeight: 600 }}>{label}</Box>
      </Box>
    </Stack>
  );
};

// ===================== سجل اتصالاتي =====================
const MyCallsDialog = ({ open, onClose, onOpenTicket }) => {
  const p = useTasksPalette();
  const [range, setRange] = useState("today");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open) return;
    setData(null);
    const today = new Date();
    const from = range === "today" ? isoDay(today) : range === "week" ? isoDay(new Date(Date.now() - 6 * 864e5)) : range === "month" ? isoDay(new Date(Date.now() - 29 * 864e5)) : "";
    csGet("/tickets", { createdByMe: true, status: "all", scope: "mine", from, take: 500 }).then(setData).catch(() => setData({ data: [] }));
  }, [open, range]);

  const skew = skewOf(data?.serverNow);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        سجل اتصالاتي
        <IconButton onClick={onClose} sx={{ position: "absolute", left: 12, top: 12 }} aria-label="إغلاق"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 380 }}>
        <ToggleButtonGroup exclusive size="small" value={range} onChange={(_, v) => v && setRange(v)} sx={{ mb: 1.5 }}>
          <ToggleButton value="today" sx={{ fontWeight: 700, px: 2 }}>اليوم</ToggleButton>
          <ToggleButton value="week" sx={{ fontWeight: 700, px: 2 }}>آخر 7 أيام</ToggleButton>
          <ToggleButton value="month" sx={{ fontWeight: 700, px: 2 }}>آخر 30 يومًا</ToggleButton>
          <ToggleButton value="all" sx={{ fontWeight: 700, px: 2 }}>الكل</ToggleButton>
        </ToggleButtonGroup>
        {!data ? <CenterLoader /> : data.data.length === 0 ? <Box sx={{ color: p.muted, py: 3, textAlign: "center" }}>لا توجد مكالمات مسجّلة في هذه الفترة.</Box> : (
          <>
            <Box sx={{ fontSize: 12.5, color: p.muted, mb: 1 }}>{data.data.length} مكالمة</Box>
            <Stack spacing={1}>
              {data.data.map((t) => {
                const type = TICKET_TYPES[t.callType] || TICKET_TYPES[0];
                const sla = slaState(t);
                return (
                  <Box key={t.guid} onClick={() => onOpenTicket(t.guid)}
                    sx={{ p: 1.25, borderRadius: 2, border: `1px solid ${p.border}`, borderInlineStart: `4px solid ${type.color}`, cursor: "pointer", "&:hover": { bgcolor: p.hover } }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Box sx={{ fontWeight: 800, fontSize: 14 }}>{t.customerName || "عميل"}</Box>
                      <Box sx={{ fontSize: 12, color: p.muted }}>#{t.number}</Box>
                      <SoftChip label={type.label} color={type.color} />
                      <SoftChip label={sla.label} color={sla.color} />
                      {t.assigneeGuid !== t.creatorGuid ? <Box sx={{ fontSize: 12, color: p.muted }}>محوّلة إلى {t.assigneeName}</Box> : null}
                      <Box sx={{ fontSize: 12, color: p.muted, mr: "auto" }}>{ago(toClient(t.createdAt, skew))}</Box>
                    </Stack>
                    <Box sx={{ fontSize: 13, mt: 0.5, color: p.text, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {t.complainDetails || t.notes || "—"}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ===================== استفسار توظيفي عبر الواتساب (من الشاشة القديمة) =====================
const JobInquiryDialog = ({ open, onClose, agentName }) => {
  const p = useTasksPalette();
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [sent, setSent] = useState({ applicant: false, hr: false });

  useEffect(() => {
    if (open) { setForm({ name: "", phone: "", notes: "" }); setSent({ applicant: false, hr: false }); }
  }, [open]);

  const validPhone = /^05\d{8}$/.test(form.phone);
  const valid = form.name.trim() && validPhone;

  const sendApplicant = () => {
    const msg = `السيد/ة ${form.name.trim()}،\n\nنشكركم على تواصلكم معنا بخصوص الفرص الوظيفية.\nيُرجى إرسال السيرة الذاتية على البريد الإلكتروني:\nhr@administration.sstli.com\n\nمع تمنياتنا لكم بالتوفيق`;
    window.open(`https://wa.me/966${form.phone.slice(1)}?text=${encodeURIComponent(msg)}`, "_blank");
    setSent((s) => ({ ...s, applicant: true }));
  };

  const sendHr = () => {
    const msg = `📋 *طلب توظيف جديد* 📋\n\n👤 *المتقدم:*\n   - الاسم: ${form.name.trim()}\n   - رقم الجوال: ${form.phone}\n\n📝 *ملاحظات:*\n   ${form.notes.trim() || "لا توجد ملاحظات"}\n\n👨‍💼 *مسجل بواسطة:*\n   ${agentName} - خدمة العملاء`;
    window.open(`https://wa.me/966543502504?text=${encodeURIComponent(msg)}`, "_blank");
    setSent((s) => ({ ...s, hr: true }));
    toast("تم فتح رسالة الموارد البشرية");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle sx={{ fontWeight: 800 }}>استفسار توظيفي عبر الواتساب</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ fontSize: 13, color: p.muted, mb: 0.75 }}>الاسم</Box>
        <TextField fullWidth size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Box sx={{ fontSize: 13, color: p.muted, mb: 0.75, mt: 1.75 }}>رقم الجوال</Box>
        <TextField fullWidth size="small" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.trim() })}
          inputProps={{ dir: "ltr", maxLength: 10, inputMode: "numeric" }} error={Boolean(form.phone) && !validPhone}
          helperText={form.phone && !validPhone ? "10 أرقام تبدأ بـ 05" : " "} />
        <Box sx={{ fontSize: 13, color: p.muted, mb: 0.75 }}>ملاحظات</Box>
        <TextField fullWidth size="small" multiline minRows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose} sx={{ color: p.muted }}>إغلاق</Button>
        <Button variant="outlined" startIcon={<WhatsAppIcon />} disabled={!valid} onClick={sendApplicant} sx={{ color: "#16a34a", borderColor: "#16a34a" }}>
          {sent.applicant ? "أُرسلت للمتقدم ✓" : "إرسال للمتقدم"}
        </Button>
        <Button variant="contained" startIcon={<WhatsAppIcon />} disabled={!valid} onClick={sendHr} sx={{ bgcolor: "#16a34a", color: "#fff", "&:hover": { bgcolor: "#15803d" } }}>
          {sent.hr ? "أُرسلت للموارد البشرية ✓" : "إرسال للموارد البشرية"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function CustomerServiceDesk() {
  const p = useTasksPalette();
  const user = readUser();
  const agentName = String(user.fullName || user.FullName || "").trim();
  const [stats, setStats] = useState(null);
  const [denied, setDenied] = useState("");
  const [error, setError] = useState("");
  const [myCallsOpen, setMyCallsOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [openGuid, setOpenGuid] = useState(null);
  const [customerGuid, setCustomerGuid] = useState(null);

  // إحصائيات اليوم + التحقق من الصلاحية
  const loadStats = useCallback(async () => {
    try {
      const r = await csGet("/tickets", { createdByMe: true, status: "all", scope: "mine", from: isoDay(new Date()), take: 1000 });
      const rows = r.data || [];
      setStats({
        today: rows.length,
        open: rows.filter((t) => t.isOpen).length,
        complaints: rows.filter((t) => t.callType === 2).length
      });
      setError("");
    } catch (e) {
      if (e.status === 403) setDenied(e.message);
      else setError("تعذّر الاتصال بالخادم. تأكد من رفع آخر نسخة من الخادم ثم أعد المحاولة.");
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (denied) return <NoAccess message={denied} />;

  return (
    <TasksPageShell
      icon={<SupportAgentIcon />}
      title="خدمة العملاء"
      subtitle={agentName ? `أهلًا ${agentName} — استقبال المكالمات وتسجيلها` : "استقبال المكالمات وتسجيلها"}
      actions={
        <>
          <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => setMyCallsOpen(true)}>سجل اتصالاتي</Button>
          <Button variant="outlined" startIcon={<WhatsAppIcon />} onClick={() => setJobOpen(true)} sx={{ color: "#16a34a", borderColor: "#16a34a" }}>
            استفسار توظيفي عبر الواتساب
          </Button>
        </>
      }
    >
      {error ? (
        <Box sx={{ p: 2, mb: 2, borderRadius: 2.5, bgcolor: p.tone(RED).bg, color: p.tone(RED).fg, fontWeight: 700, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          {error}
          <Button size="small" onClick={loadStats}>إعادة المحاولة</Button>
        </Box>
      ) : (
        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Stat icon={<PhoneInTalkIcon />} label="مكالماتي اليوم" value={stats?.today} color="#2563eb" />
          <Stat icon={<PendingActionsIcon />} label="منها تحتاج متابعة" value={stats?.open} color="#d97706" />
          <Stat icon={<ReportProblemIcon />} label="شكاوى اليوم" value={stats?.complaints} color={RED} />
        </Stack>
      )}

      <CallDesk onOpenTicket={setOpenGuid} onTicketCreated={loadStats} />

      <MyCallsDialog open={myCallsOpen} onClose={() => setMyCallsOpen(false)} onOpenTicket={(g) => { setMyCallsOpen(false); setOpenGuid(g); }} />
      <JobInquiryDialog open={jobOpen} onClose={() => setJobOpen(false)} agentName={agentName} />
      <TicketDrawer guid={openGuid} onClose={() => setOpenGuid(null)} onChanged={loadStats} onOpenCustomer={setCustomerGuid} />
      <CustomerProfileDialog accountGuid={customerGuid} onClose={() => setCustomerGuid(null)} onOpenTicket={(g) => { setCustomerGuid(null); setOpenGuid(g); }} />
    </TasksPageShell>
  );
}
