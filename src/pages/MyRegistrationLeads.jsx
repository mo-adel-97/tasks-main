// طلبات تسجيل خاصة بك — api/my-leads (MyLeadsController):
// العملاء اللي اتوزعوا على الموظف من شاشة بيانات العملاء الموحدة.
// - تابات: الحالية / السلة / المسجّلون (المسجّل بيتحسب لوحده من النظام).
// - ملاحظات متابعة لكل عميل، ونقل للسلة وإرجاع منها.
// - مفيش أي تواريخ لاهتمام العميل (مقصود عشان الموظف ميحسش إن العميل قديم).
// - رسالة الإدارة (الإعلان المميز) بقت من شاشة "التنبيهات والإعلانات" وبتظهر في أي صفحة؛ زر "رسالة الإدارة" هنا بيعيد عرضها.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIcon from "@mui/icons-material/Phone";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import StickyNote2OutlinedIcon from "@mui/icons-material/StickyNote2Outlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestoreIcon from "@mui/icons-material/Restore";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import { API_BASE_URL, getUserGuid, readJson, useTasksPalette } from "./tasks/tasksCommon";
import { TasksPageShell, SectionCard, CenterLoader, EmptyState, toast, showError, multilineSx } from "./tasks/TasksUi";
import AnnouncementDialog from "../components/announcements/AnnouncementDialog";

const API = `${API_BASE_URL}/api/my-leads`;
const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const fmtDateTime = (s) => {
  if (!s) return "";
  const [d, t] = String(s).split(" ");
  return `${d.split("-").reverse().join("/")}${t ? ` ${t}` : ""}`;
};

const HOT = "#ea580c";
const GREEN = "#059669";
const AMBER = "#d97706";

// ---------- ملاحظات العميل ----------
const NotesDialog = ({ lead, onClose, onSaved }) => {
  const p = useTasksPalette();
  const userGuid = getUserGuid();
  const [notes, setNotes] = useState(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setNotes(null);
    setText("");
    fetch(`${API}/notes?${new URLSearchParams({ userGuid, id: lead.id })}`, { cache: "no-store" })
      .then(readJson)
      .then((r) => setNotes(r.notes))
      .catch((e) => { setNotes([]); showError(e); });
  }, [lead, userGuid]);

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await readJson(await fetch(`${API}/notes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGuid, id: lead.id, note: text.trim() })
      }));
      const r = await readJson(await fetch(`${API}/notes?${new URLSearchParams({ userGuid, id: lead.id })}`, { cache: "no-store" }));
      setNotes(r.notes);
      setText("");
      onSaved();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(lead)} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        ملاحظات المتابعة — {lead?.name || "عميل مهتم"}
        <IconButton onClick={onClose} sx={{ position: "absolute", left: 12, top: 12 }} aria-label="إغلاق"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth multiline minRows={3} placeholder="اكتب ما تم مع العميل: اتصال، موعد زيارة، استفسار…" value={text}
          onChange={(e) => setText(e.target.value)} sx={multilineSx(80, 220)} inputProps={{ maxLength: 2000 }}
        />
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1.25 }}>
          <Button variant="contained" onClick={save} disabled={saving || !text.trim()} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
            حفظ الملاحظة
          </Button>
        </Stack>
        <Box sx={{ mt: 2.5 }}>
          {!notes ? <CenterLoader /> : notes.length === 0 ? (
            <Typography sx={{ color: p.muted, fontSize: 13.5, textAlign: "center", py: 2 }}>لا توجد ملاحظات بعد.</Typography>
          ) : (
            <Stack spacing={1.25}>
              {notes.map((n) => (
                <Box key={n.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: p.nested, borderInlineStart: `3px solid ${p.primary}` }}>
                  <Typography sx={{ fontSize: 14, color: p.text, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{n.note}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: p.muted, mt: 0.5, fontVariantNumeric: "tabular-nums" }}>{fmtDateTime(n.createdAt)}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ---------- بطاقة العميل ----------
const LeadCard = ({ lead, onNotes, onState, busy }) => {
  const p = useTasksPalette();
  const hot = lead.interest === "hot";
  const isProfile = lead.category === "profile";
  const accent = lead.registered ? GREEN : hot ? HOT : isProfile ? AMBER : p.primary;

  return (
    <SectionCard sx={{ p: 2, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 1.25, borderTop: `3px solid ${accent}` }}>
      {lead.registered ? (
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ position: "absolute", top: 12, left: 12, px: 1.25, py: 0.4, borderRadius: 5, bgcolor: GREEN, color: "#fff" }}>
          <VerifiedIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: 12, fontWeight: 800 }}>مسجّل</Typography>
        </Stack>
      ) : null}

      <Box sx={{ pl: lead.registered ? 10 : 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: lead.name ? p.text : p.muted, lineHeight: 1.5 }}>{lead.name || "عميل مهتم"}</Typography>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
          {isProfile ? (
            <Chip size="small" icon={<PendingActionsIcon />} label="طالب أدخلتَ بياناته ولم يُسجَّل بعد"
              sx={{ height: 24, fontWeight: 700, fontSize: 12, bgcolor: p.tone(AMBER).bg, color: p.text, "& .MuiChip-icon": { color: AMBER, fontSize: 16 } }} />
          ) : (
            <Chip size="small" icon={<HowToRegIcon />} label="طلب تسجيل خاص بك"
              sx={{ height: 24, fontWeight: 700, fontSize: 12, bgcolor: p.tone(p.primary).bg, color: p.text, "& .MuiChip-icon": { color: p.primary, fontSize: 16 } }} />
          )}
          {hot ? (
            <Chip size="small" icon={<LocalFireDepartmentIcon />} label="مهتم جدًا"
              sx={{ height: 24, fontWeight: 700, fontSize: 12, bgcolor: p.tone(HOT).bg, color: p.text, "& .MuiChip-icon": { color: HOT, fontSize: 16 } }} />
          ) : null}
        </Stack>
        {hot && !lead.registered ? (
          <Typography sx={{ fontSize: 12.5, color: p.muted, mt: 0.75 }}>مصنّف مهتمًا جدًا، ولم يتم التواصل معه أو تسجيله بعد.</Typography>
        ) : null}
      </Box>

      <Stack spacing={0.75}>
        {lead.mobile ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <PhoneIcon sx={{ fontSize: 18, color: p.muted }} />
            <Typography component="a" href={`tel:${String(lead.mobile).replace(/[^\d+]/g, "")}`} dir="ltr"
              sx={{ fontWeight: 800, fontSize: 16, color: p.text, textDecoration: "none", fontVariantNumeric: "tabular-nums", "&:hover": { color: p.primary } }}>
              {lead.mobile}
            </Typography>
          </Stack>
        ) : null}
        {lead.city ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <PlaceOutlinedIcon sx={{ fontSize: 18, color: p.muted }} />
            <Typography sx={{ fontSize: 13.5, color: p.text }}>{lead.city}</Typography>
          </Stack>
        ) : null}
        {lead.diplomas ? (
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <SchoolOutlinedIcon sx={{ fontSize: 18, color: p.muted, mt: 0.25 }} />
            <Typography sx={{ fontSize: 13.5, color: p.text, lineHeight: 1.7 }}>{lead.diplomas}</Typography>
          </Stack>
        ) : null}
      </Stack>

      {lead.lastNote ? (
        <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: p.nested }}>
          <Typography sx={{ fontSize: 12, color: p.muted, fontWeight: 700, mb: 0.25 }}>آخر ملاحظة</Typography>
          <Typography sx={{ fontSize: 13, color: p.text, lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {lead.lastNote}
          </Typography>
        </Box>
      ) : null}

      <Box sx={{ flex: 1 }} />
      <Stack direction="row" spacing={1} justifyContent="space-between">
        <Button size="small" variant="outlined" startIcon={<StickyNote2OutlinedIcon />} onClick={() => onNotes(lead)}>
          الملاحظات{lead.notesCount ? ` (${fmt(lead.notesCount)})` : ""}
        </Button>
        {!lead.registered ? (
          lead.state === "basket" ? (
            <Button size="small" startIcon={<RestoreIcon />} onClick={() => onState(lead, "active")} disabled={busy}>إرجاع للحالية</Button>
          ) : (
            <Tooltip title="يختفي من القائمة الحالية ويبقى ظاهرًا في السلة">
              <span>
                <Button size="small" color="inherit" startIcon={<DeleteOutlineIcon />} onClick={() => onState(lead, "basket")} disabled={busy} sx={{ color: p.muted }}>
                  نقل إلى السلة
                </Button>
              </span>
            </Tooltip>
          )
        ) : null}
      </Stack>
    </SectionCard>
  );
};

// ---------- الصفحة ----------
export default function MyRegistrationLeads() {
  const userGuid = getUserGuid();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("current");
  const [search, setSearch] = useState("");
  const [notesFor, setNotesFor] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);

  // آخر إعلان مميز موجّه للموظف (حتى لو اطّلع عليه قبل كده)
  const openMessage = async () => {
    try {
      const r = await readJson(await fetch(`${API_BASE_URL}/api/announcements/latest-blessing?${new URLSearchParams({ userGuid })}`, { cache: "no-store" }));
      if (r.item) setMessage(r.item);
      else toast("لا توجد رسالة من الإدارة حاليًا", "info");
    } catch (e) {
      showError(e);
    }
  };

  const load = useCallback(async () => {
    try {
      const r = await readJson(await fetch(`${API}?${new URLSearchParams({ userGuid })}`, { cache: "no-store" }));
      setItems(r.items);
      setError("");
    } catch (e) {
      setError(e.message);
      setItems((x) => x || []);
    }
  }, [userGuid]);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    const all = items || [];
    return {
      current: all.filter((x) => !x.registered && x.state !== "basket"),
      basket: all.filter((x) => !x.registered && x.state === "basket"),
      registered: all.filter((x) => x.registered)
    };
  }, [items]);

  const shown = useMemo(() => {
    const q = search.trim();
    const digits = q.replace(/\D/g, "").replace(/^0+/, "");
    return groups[tab].filter((x) => !q || String(x.name || "").includes(q) || (digits && String(x.mobile || "").replace(/\D/g, "").includes(digits)));
  }, [groups, tab, search]);

  const setState = async (lead, state) => {
    setBusyId(lead.id);
    try {
      const r = await readJson(await fetch(`${API}/state`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGuid, id: lead.id, state })
      }));
      setItems((x) => x.map((i) => (i.id === lead.id ? { ...i, state } : i)));
      toast(r.message);
    } catch (e) {
      showError(e);
    } finally {
      setBusyId(null);
    }
  };

  const TABS = [
    { key: "current", label: "الحالية" },
    { key: "basket", label: "السلة" },
    { key: "registered", label: "المسجّلون" }
  ];

  return (
    <TasksPageShell
      icon={<HowToRegIcon />}
      title="طلبات تسجيل خاصة بك"
      subtitle="عملاء مهتمون أُسندوا إليك للتواصل معهم ومساعدتهم على التسجيل"
      actions={
        <Button variant="outlined" startIcon={<CampaignOutlinedIcon />} onClick={openMessage} sx={{ whiteSpace: "nowrap" }}>
          رسالة الإدارة
        </Button>
      }
    >
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <SectionCard sx={{ px: { xs: 1, sm: 2 }, pt: 0.5, pb: 1.5, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between">
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
            {TABS.map((t) => (
              <Tab
                key={t.key} value={t.key}
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    {t.key === "registered" ? <VerifiedIcon sx={{ fontSize: 18, color: GREEN }} /> : null}
                    <span>{t.label}</span>
                    <Chip size="small" label={fmt(groups[t.key].length)} sx={{ height: 20, fontSize: 11.5, fontWeight: 800 }} />
                  </Stack>
                }
                sx={{ fontWeight: 700, minHeight: 52 }}
              />
            ))}
          </Tabs>
          <TextField
            size="small" placeholder="ابحث بالاسم أو رقم الجوال" value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { md: 300 }, mt: { xs: 0, md: 1 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
        </Stack>
      </SectionCard>

      {!items ? (
        <CenterLoader />
      ) : shown.length === 0 ? (
        <EmptyState
          text={
            search ? "لا يوجد عملاء مطابقون للبحث"
              : tab === "current" ? (items.length ? "لا يوجد عملاء في القائمة الحالية" : "لم يُسند إليك أي عميل بعد")
              : tab === "basket" ? "السلة فارغة"
              : "لم يُسجَّل أي من عملائك بعد"
          }
          hint={tab === "registered" && !search ? "سيظهر هنا تلقائيًا كل عميل يتم تسجيله في النظام." : undefined}
        />
      ) : (
        <Box sx={{ display: "grid", gap: 1.75, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" } }}>
          {shown.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              busy={busyId === lead.id}
              onNotes={setNotesFor}
              onState={setState}
            />
          ))}
        </Box>
      )}

      <NotesDialog lead={notesFor} onClose={() => setNotesFor(null)} onSaved={load} />
      <AnnouncementDialog alert={message} open={Boolean(message)} preview onClose={() => setMessage(null)} />
    </TasksPageShell>
  );
}
