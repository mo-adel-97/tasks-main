// لوحة تفاصيل التذكرة: بيانات العميل، الخط الزمني (أحداث + متابعات)، وإجراءات المتابعة/الإغلاق/التحويل/الأولوية/إعادة الفتح.
import React, { useCallback, useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIcon from "@mui/icons-material/Phone";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import ForwardToInboxIcon from "@mui/icons-material/ForwardToInbox";
import FlagIcon from "@mui/icons-material/Flag";
import ReplayIcon from "@mui/icons-material/Replay";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AddCommentIcon from "@mui/icons-material/AddComment";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import LockIcon from "@mui/icons-material/Lock";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { useTasksPalette } from "../tasks/tasksCommon";
import { CenterLoader, SoftChip, showError, toast, multilineSx } from "../tasks/TasksUi";
import {
  AMBER, CS_PRIORITY, GREEN, PURPLE, RED, TICKET_TYPES, csGet, csSend, escalationLabel, fmtDateTime, ago,
  skewOf, slaState, telHref, toClient, whatsappHref
} from "./csCommon";

let staffCache = null;
export const loadStaff = async () => {
  if (!staffCache) staffCache = await csGet("/staff");
  return staffCache;
};

const EVENT_LOOK = {
  created: { icon: FiberNewIcon, color: "#2563eb", text: (e) => "أنشأ التذكرة" },
  forwarded: { icon: ForwardToInboxIcon, color: PURPLE, text: (e) => `حوّل التذكرة إلى ${e.targetName || "موظف"}` },
  escalated: { icon: TrendingUpIcon, color: RED, text: () => "تصعيد تلقائي" },
  closed: { icon: LockIcon, color: GREEN, text: () => "أغلق التذكرة" },
  reopened: { icon: ReplayIcon, color: AMBER, text: () => "أعاد فتح التذكرة" },
  priority: { icon: FlagIcon, color: AMBER, text: (e) => `غيّر الأولوية إلى ${e.note}` },
  followup: { icon: ChatBubbleOutlineIcon, color: "#0e7490", text: () => "أضاف متابعة" },
  followup_close: { icon: TaskAltIcon, color: GREEN, text: () => "أضاف متابعة وأغلق التذكرة" }
};

const ForwardDialog = ({ open, onClose, onDone, ticket }) => {
  const p = useTasksPalette();
  const [staff, setStaff] = useState([]);
  const [to, setTo] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo(null);
    setNote("");
    loadStaff().then(setStaff).catch(showError);
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await csSend(`/tickets/${ticket.guid}/forward`, { toUserGuid: to.guid, note });
      toast("تم تحويل التذكرة");
      onDone();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl" disableEnforceFocus>
      <DialogTitle sx={{ fontWeight: 800 }}>تحويل التذكرة #{ticket?.number}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ fontSize: 13, color: p.muted, mb: 0.75 }}>المحوَّل إليه</Box>
        <Autocomplete
          options={staff.filter((s) => s.guid !== ticket?.assigneeGuid)}
          value={to}
          onChange={(_, v) => setTo(v)}
          groupBy={(o) => (o.jobCode === 9 ? "مشرفو الفروع" : o.jobCode === 18 ? "المبيعات" : "الموظفون")}
          getOptionLabel={(o) => o.name || ""}
          isOptionEqualToValue={(a, b) => a.guid === b.guid}
          renderOption={(props, o) => (
            <li {...props} key={o.guid}>
              <Box>
                <Box sx={{ fontWeight: 700, fontSize: 14 }}>{o.name}</Box>
                <Box sx={{ fontSize: 12, color: p.muted }}>{[o.jobTitle, o.branch].filter(Boolean).join(" — ")}</Box>
              </Box>
            </li>
          )}
          renderInput={(params) => <TextField {...params} placeholder="ابحث بالاسم…" />}
          noOptionsText="لا توجد نتائج"
        />
        <Box sx={{ fontSize: 13, color: p.muted, mt: 2, mb: 0.75 }}>ملاحظة للمحوَّل إليه (اختياري)</Box>
        <TextField fullWidth multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)} sx={multilineSx(60, 160)} inputProps={{ maxLength: 1000 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={{ color: p.muted }}>إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={!to || saving} sx={{ bgcolor: PURPLE, color: "#fff", "&:hover": { bgcolor: "#6d28d9" } }}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ForwardToInboxIcon />}>
          تحويل
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const InfoRow = ({ label, children }) => {
  const p = useTasksPalette();
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.5 }}>
      <Box sx={{ width: 110, flexShrink: 0, fontSize: 13, color: p.muted }}>{label}</Box>
      <Box sx={{ fontSize: 13.5, color: p.text, fontWeight: 600, minWidth: 0, wordBreak: "break-word" }}>{children}</Box>
    </Stack>
  );
};

const TicketDetails = ({ guid, onClose, onChanged, onOpenCustomer }) => {
  const p = useTasksPalette();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [forwardOpen, setForwardOpen] = useState(false);
  const [priorityAnchor, setPriorityAnchor] = useState(null);

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await csGet(`/tickets/${guid}`));
    } catch (e) {
      setError(e.message);
    }
  }, [guid]);

  useEffect(() => {
    setData(null);
    setNote("");
    load();
  }, [load]);

  const changed = () => {
    load();
    onChanged?.();
  };

  const act = async (key, path, body, okText) => {
    setBusy(key);
    try {
      await csSend(path, body);
      toast(okText);
      if (key === "followup" || key === "close") setNote("");
      changed();
    } catch (e) {
      showError(e);
    } finally {
      setBusy("");
    }
  };

  if (error) return <Box sx={{ p: 3, color: RED, fontWeight: 700 }}>{error}</Box>;
  if (!data) return <CenterLoader />;

  const { ticket: t, timeline } = data;
  const skew = skewOf(data.serverNow);
  const type = TICKET_TYPES[t.callType] || TICKET_TYPES[0];
  const pr = CS_PRIORITY[t.priority] || CS_PRIORITY[2];
  const sla = slaState(t);
  const esc = t.isOpen ? escalationLabel(t.escalationLevel) : "";
  const created = toClient(t.createdAt, skew);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", direction: "rtl" }}>
      {/* الرأس */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.75, borderBottom: `1px solid ${p.border}`, background: `linear-gradient(135deg, ${p.tone(type.color).bg}, transparent 70%)` }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ fontSize: 12.5, color: p.muted, fontWeight: 700 }}>تذكرة #{t.number} · {fmtDateTime(created)}</Box>
            <Box sx={{ fontSize: 20, fontWeight: 800, color: p.text, mt: 0.25, lineHeight: 1.5 }}>{t.customerName || "عميل"}</Box>
          </Box>
          <IconButton onClick={onClose} aria-label="إغلاق"><CloseIcon /></IconButton>
        </Stack>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          <SoftChip label={type.label} color={type.color} />
          <SoftChip label={`أولوية ${pr.label}`} color={pr.color} strong={t.priority === 4} />
          <SoftChip label={sla.label} color={sla.color} strong={t.isOpen && t.minutesLeft < 0} />
          {esc ? <SoftChip icon={<TrendingUpIcon />} label={esc} color={RED} /> : null}
          {t.isVip ? <SoftChip icon={<StarIcon />} label="عميل VIP" color="#b45309" strong /> : null}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2 }}>
        {/* العميل */}
        <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: p.nested, mb: 2 }}>
          <InfoRow label="الجوال">
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <bdi dir="ltr">{t.customerTel || "—"}</bdi>
              {t.customerTel ? (
                <>
                  <Tooltip title="اتصال"><IconButton size="small" component="a" href={telHref(t.customerTel)} sx={{ color: GREEN }}><PhoneIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="واتساب"><IconButton size="small" component="a" href={whatsappHref(t.customerTel)} target="_blank" rel="noreferrer" sx={{ color: "#16a34a" }}><WhatsAppIcon fontSize="small" /></IconButton></Tooltip>
                </>
              ) : null}
            </Stack>
          </InfoRow>
          <InfoRow label="رقم الهوية"><bdi dir="ltr">{t.nationalId || "—"}</bdi></InfoRow>
          <InfoRow label="سجّلها">{t.creatorName || "—"}</InfoRow>
          <InfoRow label="المسؤول الحالي">{t.assigneeName || "—"}</InfoRow>
          <Button size="small" startIcon={<PersonSearchIcon />} onClick={() => onOpenCustomer(t.accountGuid)} sx={{ mt: 0.75, fontWeight: 700 }}>
            ملف العميل الكامل
          </Button>
        </Box>

        {/* التفاصيل */}
        {t.complainDetails || t.notes ? (
          <Box sx={{ mb: 2.5 }}>
            <Box sx={{ fontSize: 13, fontWeight: 800, color: p.muted, mb: 0.75 }}>تفاصيل التذكرة</Box>
            {t.complainDetails ? (
              <Box sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${p.tone(RED).border}`, bgcolor: p.tone(RED).bg, fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap", color: p.text, mb: 1 }}>
                {t.complainDetails}
              </Box>
            ) : null}
            {t.notes ? (
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: p.nested, fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap", color: p.text }}>{t.notes}</Box>
            ) : null}
          </Box>
        ) : null}

        {/* الخط الزمني */}
        <Box sx={{ fontSize: 13, fontWeight: 800, color: p.muted, mb: 1 }}>سجل التذكرة</Box>
        {timeline.length === 0 ? (
          <Box sx={{ fontSize: 13, color: p.muted, py: 1 }}>لا توجد متابعات مسجّلة بعد.</Box>
        ) : (
          <Box sx={{ position: "relative", pr: 0.5 }}>
            {timeline.map((e, i) => {
              const look = EVENT_LOOK[e.type] || EVENT_LOOK.followup;
              const Icon = look.icon;
              const at = toClient(e.at, skew);
              const last = i === timeline.length - 1;
              return (
                <Stack key={i} direction="row" spacing={1.5} sx={{ position: "relative", pb: last ? 0 : 2 }}>
                  {!last ? <Box sx={{ position: "absolute", right: 15, top: 32, bottom: 0, width: 2, bgcolor: p.border }} /> : null}
                  <Box sx={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", bgcolor: p.tone(look.color).bg, color: p.tone(look.color).fg, zIndex: 1 }}>
                    <Icon sx={{ fontSize: 17 }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1, pt: 0.25 }}>
                    <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap>
                      <Box sx={{ fontSize: 13.5, fontWeight: 800, color: p.text }}>{e.actorName || "النظام"}</Box>
                      <Box sx={{ fontSize: 13, color: p.muted }}>{look.text(e)}</Box>
                      <Tooltip title={fmtDateTime(at)}><Box sx={{ fontSize: 11.5, color: p.muted, mr: "auto" }}>{ago(at)}</Box></Tooltip>
                    </Stack>
                    {e.note && e.type !== "priority" ? (
                      <Box sx={{ mt: 0.75, p: 1.25, borderRadius: 2, bgcolor: p.nested, fontSize: 13.5, lineHeight: 1.85, whiteSpace: "pre-wrap", color: p.text }}>{e.note}</Box>
                    ) : null}
                  </Box>
                </Stack>
              );
            })}
          </Box>
        )}
      </Box>

      {/* الإجراءات */}
      <Box sx={{ borderTop: `1px solid ${p.border}`, px: 2.5, py: 1.75, bgcolor: p.card }}>
        {!data.canAct ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ fontSize: 13.5, color: p.muted }}>
            <LockIcon sx={{ fontSize: 18 }} />
            <Box>
              للاطلاع فقط — يرد على التذكرة المسؤول عنها ({t.assigneeName || "غير محدد"}) أو المشرف.
              {!t.isOpen ? ` أُغلقت في ${fmtDateTime(toClient(t.closedAt, skew))}.` : ""}
            </Box>
          </Stack>
        ) : t.isOpen ? (
          <>
            <TextField
              fullWidth multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="اكتب ما تم مع العميل أو الحل المقدَّم…" sx={multilineSx(56, 160)} inputProps={{ maxLength: 2000 }}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
              <Button variant="contained" disabled={!note.trim() || Boolean(busy)}
                onClick={() => act("close", `/tickets/${t.guid}/followup`, { note, close: true }, "تم حل التذكرة وإغلاقها")}
                startIcon={busy === "close" ? <CircularProgress size={16} color="inherit" /> : <TaskAltIcon />}
                sx={{ bgcolor: GREEN, color: "#fff", "&:hover": { bgcolor: "#047857" } }}>
                حل وإغلاق
              </Button>
              <Button variant="outlined" disabled={!note.trim() || Boolean(busy)}
                onClick={() => act("followup", `/tickets/${t.guid}/followup`, { note, close: false }, "تمت إضافة المتابعة")}
                startIcon={busy === "followup" ? <CircularProgress size={16} color="inherit" /> : <AddCommentIcon />}>
                متابعة فقط
              </Button>
              <Box sx={{ flex: 1 }} />
              <Tooltip title="تحويل لموظف آخر">
                <IconButton onClick={() => setForwardOpen(true)} sx={{ color: PURPLE, border: `1px solid ${p.border}` }}><ForwardToInboxIcon /></IconButton>
              </Tooltip>
              <Tooltip title="تغيير الأولوية">
                <IconButton onClick={(e) => setPriorityAnchor(e.currentTarget)} sx={{ color: AMBER, border: `1px solid ${p.border}` }}><FlagIcon /></IconButton>
              </Tooltip>
            </Stack>
          </>
        ) : (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ flex: 1, fontSize: 13.5, color: p.muted }}>
              أُغلقت في {fmtDateTime(toClient(t.closedAt, skew))}
            </Box>
            <Button variant="outlined" color="warning" disabled={Boolean(busy)} startIcon={<ReplayIcon />}
              onClick={() => act("reopen", `/tickets/${t.guid}/reopen`, {}, "أُعيد فتح التذكرة")}>
              إعادة فتح
            </Button>
          </Stack>
        )}
      </Box>

      <Menu anchorEl={priorityAnchor} open={Boolean(priorityAnchor)} onClose={() => setPriorityAnchor(null)} dir="rtl">
        {[4, 3, 2, 1].map((k) => (
          <MenuItem key={k} selected={t.priority === k} onClick={() => { setPriorityAnchor(null); if (k !== t.priority) act("priority", `/tickets/${t.guid}/priority`, { priority: k }, "تم تغيير الأولوية"); }}>
            <FlagIcon sx={{ color: CS_PRIORITY[k].color, fontSize: 18, ml: 1 }} /> {CS_PRIORITY[k].label}
          </MenuItem>
        ))}
      </Menu>
      <ForwardDialog open={forwardOpen} ticket={t} onClose={() => setForwardOpen(false)} onDone={() => { setForwardOpen(false); changed(); }} />
    </Box>
  );
};

export default function TicketDrawer({ guid, onClose, onChanged, onOpenCustomer }) {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const p = useTasksPalette();
  return (
    <Drawer
      anchor="left"
      open={Boolean(guid)}
      onClose={onClose}
      sx={{ zIndex: (th) => th.zIndex.modal }}
      disableEnforceFocus
      disableRestoreFocus
      PaperProps={{ sx: { width: phone ? "100%" : 600, maxWidth: "100%", bgcolor: p.card, backgroundImage: "none", ...p.containedSx } }}
    >
      {guid ? <TicketDetails guid={guid} onClose={onClose} onChanged={onChanged} onOpenCustomer={onOpenCustomer} /> : null}
    </Drawer>
  );
}
