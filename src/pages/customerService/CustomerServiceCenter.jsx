// استفسارات خدمة العملاء — /dashboard/customer-service (api/customer-service — CustomerServiceController).
// صندوق التذاكر: المكالمات اللي محتاجة متابعة (من شاشة "خدمة العملاء" أو الديسكتوب) بمهلة حل وتصعيد تلقائي.
// - صلاحية customer-service-center: التذاكر اللي اتحوّلت له أو سجّلها، ويرد على اللي هو مسؤول عنها.
// - cs-supervisor / cs-management: كل التذاكر + تحميل الموظفين (+ الإعدادات للإدارة).
// - ?ticket=<guid> بيفتح التذكرة (روابط الإشعارات).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import InboxIcon from "@mui/icons-material/Inbox";
import AlarmIcon from "@mui/icons-material/Alarm";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import FiberNewIcon from "@mui/icons-material/FiberNew";
import TimerIcon from "@mui/icons-material/Timer";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useTasksPalette } from "../tasks/tasksCommon";
import { TasksPageShell, SectionCard, CenterLoader, EmptyState, NoAccess, SoftChip } from "../tasks/TasksUi";
import TicketDrawer from "./TicketDrawer";
import { CustomerProfileDialog, SettingsDialog } from "./CsDialogs";
import {
  AMBER, CS_PRIORITY, GREEN, PURPLE, RED, TICKET_TYPES, ago, csGet, escalationLabel, skewOf, slaState, toClient
} from "./csCommon";

const STATUS_TABS = [
  { key: "open", label: "المفتوحة" },
  { key: "overdue", label: "المتأخرة" },
  { key: "escalated", label: "المصعّدة" },
  { key: "closed", label: "المغلقة" },
  { key: "all", label: "الكل" }
];

const Kpi = ({ icon, label, value, color, active, onClick, hint }) => {
  const p = useTasksPalette();
  const t = p.tone(color);
  return (
    <Tooltip title={hint || ""} disableHoverListener={!hint}>
      <Box
        onClick={onClick}
        sx={{
          flex: "1 1 150px", minWidth: 150, p: 1.75, borderRadius: 3, cursor: onClick ? "pointer" : "default",
          bgcolor: p.card, border: `1px solid ${active ? t.border : p.border}`, boxShadow: active ? `0 0 0 2px ${t.border}` : "none",
          transition: "transform .15s, box-shadow .15s", "&:hover": onClick ? { transform: "translateY(-2px)" } : {}
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: t.bg, color: t.fg, flexShrink: 0 }}>
            {React.cloneElement(icon, { sx: { fontSize: 22 } })}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ fontSize: 26, fontWeight: 800, color: p.text, lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{value ?? "—"}</Box>
            <Box sx={{ fontSize: 12.5, color: p.muted, fontWeight: 600 }}>{label}</Box>
          </Box>
        </Stack>
      </Box>
    </Tooltip>
  );
};

const TicketRow = ({ t, skew, onOpen, showAssignee }) => {
  const p = useTasksPalette();
  const type = TICKET_TYPES[t.callType] || TICKET_TYPES[0];
  const pr = CS_PRIORITY[t.priority] || CS_PRIORITY[2];
  const sla = slaState(t);
  const esc = t.isOpen ? escalationLabel(t.escalationLevel) : "";
  const created = toClient(t.createdAt, skew);
  const text = t.complainDetails || t.notes;

  return (
    <Box
      onClick={() => onOpen(t.guid)}
      sx={{
        p: 1.75, borderRadius: 2.5, cursor: "pointer", bgcolor: p.card, border: `1px solid ${p.border}`,
        borderInlineStart: `4px solid ${sla.color}`, transition: "background-color .15s, transform .15s",
        "&:hover": { bgcolor: p.hover }
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Box sx={{ fontSize: 12.5, fontWeight: 800, color: p.muted, fontVariantNumeric: "tabular-nums" }}>#{t.number}</Box>
        <Box sx={{ fontSize: 15, fontWeight: 800, color: p.text }}>{t.customerName || "عميل"}</Box>
        {t.isVip ? <StarIcon sx={{ fontSize: 18, color: "#d97706" }} titleAccess="عميل VIP" /> : null}
        <SoftChip label={type.label} color={type.color} />
        {t.priority !== 2 ? <SoftChip label={pr.label} color={pr.color} strong={t.priority === 4} /> : null}
        {esc ? <SoftChip icon={<TrendingUpIcon />} label={esc} color={RED} /> : null}
        <Box sx={{ mr: "auto" }}>
          <SoftChip icon={t.isOpen ? <TimerIcon /> : <TaskAltIcon />} label={sla.label} color={sla.color} strong={t.isOpen && t.minutesLeft < 0} />
        </Box>
      </Stack>
      {text ? (
        <Box sx={{ mt: 0.75, fontSize: 13.5, color: p.text, lineHeight: 1.8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "pre-wrap" }}>
          {text}
        </Box>
      ) : null}
      {t.lastNote ? (
        <Box sx={{ mt: 0.75, fontSize: 12.5, color: p.muted, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          آخر متابعة: {t.lastNote}
        </Box>
      ) : null}
      <Stack direction="row" spacing={2} sx={{ mt: 1, fontSize: 12, color: p.muted }} flexWrap="wrap" useFlexGap>
        {showAssignee ? (
          <Stack direction="row" spacing={0.5} alignItems="center"><PersonOutlineIcon sx={{ fontSize: 16 }} /><span>{t.assigneeName || "—"}</span></Stack>
        ) : null}
        <span>سجّلها: {t.creatorName || "—"}</span>
        <span>{ago(created)}</span>
        {t.followUps ? (
          <Stack direction="row" spacing={0.5} alignItems="center"><ChatBubbleOutlineIcon sx={{ fontSize: 15 }} /><span>{t.followUps}</span></Stack>
        ) : null}
      </Stack>
    </Box>
  );
};

const Workload = ({ rows, selected, onSelect }) => {
  const p = useTasksPalette();
  const max = Math.max(1, ...rows.map((r) => r.open));
  return (
    <SectionCard sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box sx={{ fontSize: 15, fontWeight: 800, color: p.text }}>تحميل الموظفين</Box>
        {selected ? <Button size="small" onClick={() => onSelect(null)}>عرض الجميع</Button> : null}
      </Stack>
      {rows.length === 0 ? <Box sx={{ fontSize: 13, color: p.muted }}>لا توجد تذاكر مفتوحة.</Box> : (
        <Stack spacing={1}>
          {rows.map((r) => (
            <Box key={r.userGuid} onClick={() => onSelect(r.userGuid === selected ? null : r.userGuid)}
              sx={{ p: 1, borderRadius: 2, cursor: "pointer", bgcolor: r.userGuid === selected ? p.selected : "transparent", "&:hover": { bgcolor: p.hover } }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: p.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</Box>
                <Box sx={{ fontSize: 12.5, fontWeight: 800, color: p.text }}>{r.open}</Box>
                {r.overdue ? <Box sx={{ fontSize: 11.5, fontWeight: 800, color: "#fff", bgcolor: RED, px: 0.75, borderRadius: 1 }}>{r.overdue} متأخرة</Box> : null}
              </Stack>
              <Box sx={{ mt: 0.6, height: 6, borderRadius: 3, bgcolor: p.nested, overflow: "hidden", display: "flex" }}>
                <Box sx={{ width: `${(r.overdue / max) * 100}%`, bgcolor: RED }} />
                <Box sx={{ width: `${((r.open - r.overdue) / max) * 100}%`, bgcolor: GREEN }} />
              </Box>
              <Box sx={{ fontSize: 11.5, color: p.muted, mt: 0.4 }}>أُغلق خلال 30 يومًا: {r.closed30}</Box>
            </Box>
          ))}
        </Stack>
      )}
    </SectionCard>
  );
};

export default function CustomerServiceCenter() {
  const p = useTasksPalette();
  const location = useLocation();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [skew, setSkew] = useState(0);
  const [denied, setDenied] = useState("");
  const [scope, setScope] = useState("mine");
  const [status, setStatus] = useState("open");
  const [type, setType] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState(null);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [openGuid, setOpenGuid] = useState(null);
  const [customerGuid, setCustomerGuid] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const scopeInit = useRef(false);

  const canManage = Boolean(summary?.canManage);

  const loadSummary = useCallback(async () => {
    try {
      const s = await csGet("/summary");
      setSummary(s);
      setLoadError("");
      // المشرف بيبدأ على "كل التذاكر"
      if (!scopeInit.current) {
        scopeInit.current = true;
        if (s.canManage) setScope("all");
      }
    } catch (e) {
      if (e.status === 403) setDenied(e.message);
      else setLoadError("تعذّر الاتصال بالخادم. تأكد من رفع آخر نسخة من الخادم ثم أعد المحاولة.");
    }
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      const r = await csGet("/tickets", {
        scope, status, type, priority, q, assignee: scope === "all" ? assignee : null, take: status === "closed" || status === "all" ? 300 : 500
      });
      setTickets(r.data);
      setSkew(skewOf(r.serverNow));
    } catch (e) {
      if (e.status === 403) setDenied(e.message);
      else setTickets([]);
    }
  }, [scope, status, type, priority, q, assignee]);

  const refresh = useCallback(() => {
    loadSummary();
    loadTickets();
  }, [loadSummary, loadTickets]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { setTickets(null); loadTickets(); }, [loadTickets]);

  useEffect(() => {
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // روابط الإشعارات: ?ticket=<guid>
  useEffect(() => {
    const guid = new URLSearchParams(location.search).get("ticket");
    if (guid) setOpenGuid(guid);
  }, [location.search]);

  const closeTicket = () => {
    setOpenGuid(null);
    const params = new URLSearchParams(location.search);
    if (params.get("ticket")) {
      params.delete("ticket");
      navigate(`${location.pathname}${params.toString() ? `?${params}` : ""}`, { replace: true });
    }
  };

  const openCustomer = useCallback((guid) => setCustomerGuid(guid), []);
  const closeCustomer = useCallback(() => setCustomerGuid(null), []);

  const totals = summary?.totals || {};
  const onTime = totals.onTimeRate === null || totals.onTimeRate === undefined ? "—" : `${totals.onTimeRate}%`;
  const avg = totals.avgResolveHours === null || totals.avgResolveHours === undefined ? "—" : `${totals.avgResolveHours} س`;

  const counts = useMemo(() => {
    if (!tickets) return null;
    return { total: tickets.length, complaints: tickets.filter((t) => t.callType === 2).length };
  }, [tickets]);

  if (denied) return <NoAccess message={denied} />;

  const kpiStatus = (s, scopeAll) => () => {
    setStatus(s);
    setType("");
    if (scopeAll !== undefined && canManage) setScope(scopeAll ? "all" : "mine");
  };

  return (
    <TasksPageShell
      icon={<SupportAgentIcon />}
      title="استفسارات خدمة العملاء"
      subtitle="الاستفسارات والشكاوى المحوّلة للمتابعة، بمهلة حل وتصعيد تلقائي للمشرفين"
      actions={
        <>
          <Tooltip title="تحديث"><IconButton onClick={refresh} sx={{ border: `1px solid ${p.border}` }}><RefreshIcon /></IconButton></Tooltip>
          {summary?.canConfigure ? (
            <Tooltip title="الإعدادات"><IconButton onClick={() => setSettingsOpen(true)} sx={{ border: `1px solid ${p.border}` }}><SettingsIcon /></IconButton></Tooltip>
          ) : null}
        </>
      }
    >
      {loadError ? (
        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: p.tone(RED).bg, color: p.tone(RED).fg, fontWeight: 700, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          {loadError}
          <Button size="small" onClick={refresh}>إعادة المحاولة</Button>
        </Box>
      ) : !summary ? <CenterLoader /> : (<>
      {/* المؤشرات */}
        <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {canManage ? (
            <>
              <Kpi icon={<InboxIcon />} label="مفتوحة" value={totals.open} color="#2563eb" active={status === "open" && scope === "all"} onClick={kpiStatus("open", true)} />
              <Kpi icon={<AlarmIcon />} label="متأخرة" value={totals.overdue} color={RED} active={status === "overdue"} onClick={kpiStatus("overdue", true)} />
              <Kpi icon={<TrendingUpIcon />} label="مصعّدة" value={totals.escalated} color={PURPLE} active={status === "escalated"} onClick={kpiStatus("escalated", true)} />
              <Kpi icon={<HourglassBottomIcon />} label="تنتهي مهلتها خلال ساعتين" value={totals.dueSoon} color={AMBER} />
              <Kpi icon={<ReportProblemIcon />} label="شكاوى مفتوحة" value={totals.openComplaints} color="#be123c"
                active={status === "open" && type === 2} onClick={() => { setStatus("open"); setType(2); setScope("all"); }} />
            </>
          ) : (
            <>
              <Kpi icon={<InboxIcon />} label="مسندة إليّ مفتوحة" value={totals.myOpen} color="#2563eb" active={status === "open"} onClick={kpiStatus("open")} />
              <Kpi icon={<AlarmIcon />} label="متأخرة لديّ" value={totals.myOverdue} color={RED} active={status === "overdue"} onClick={kpiStatus("overdue")} />
              <Kpi icon={<HourglassBottomIcon />} label="تنتهي مهلتها خلال ساعتين" value={totals.dueSoon} color={AMBER} />
            </>
          )}
          <Kpi icon={<FiberNewIcon />} label="جديدة اليوم" value={totals.newToday} color="#0e7490" />
          <Kpi icon={<TaskAltIcon />} label="أُغلقت اليوم" value={totals.closedToday} color={GREEN} />
          <Kpi icon={<TimerIcon />} label="متوسط زمن الحل (30 يومًا)" value={avg} color="#475569" hint="من فتح التذكرة حتى إغلاقها، للتذاكر الجديدة فقط" />
          <Kpi icon={<VerifiedIcon />} label="الالتزام بالمهلة (30 يومًا)" value={onTime} color={GREEN} hint="نسبة التذاكر المغلقة قبل انتهاء مهلة الحل" />
        </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: canManage && scope === "all" ? "1fr 320px" : "1fr" }, gap: 2, alignItems: "start" }}>
        <SectionCard sx={{ p: { xs: 1.5, md: 2 } }}>
          {/* الفلاتر */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ md: "center" }} sx={{ mb: 1.5 }}>
            {canManage ? (
              <ToggleButtonGroup exclusive size="small" value={scope} onChange={(_, v) => { if (v) { setScope(v); setAssignee(null); } }}>
                <ToggleButton value="mine" sx={{ fontWeight: 700, px: 2 }}>تذاكري</ToggleButton>
                <ToggleButton value="all" sx={{ fontWeight: 700, px: 2 }}>كل التذاكر</ToggleButton>
              </ToggleButtonGroup>
            ) : null}
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {STATUS_TABS.map((s) => {
                const active = status === s.key;
                return (
                  <Box key={s.key} component="button" type="button" onClick={() => setStatus(s.key)}
                    sx={{
                      border: `1px solid ${active ? p.primary : p.border}`, cursor: "pointer", px: 1.5, py: 0.6, borderRadius: 99,
                      fontFamily: "Cairo", fontSize: 13, fontWeight: 800, color: active ? p.onPrimary : p.text, bgcolor: active ? p.primary : "transparent"
                    }}>
                    {s.label}
                  </Box>
                );
              })}
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Select size="small" displayEmpty value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="">كل الأنواع</MenuItem>
              {[0, 1, 2].map((k) => <MenuItem key={k} value={k}>{TICKET_TYPES[k].label}</MenuItem>)}
            </Select>
            <Select size="small" displayEmpty value={priority} onChange={(e) => setPriority(e.target.value)} sx={{ minWidth: 130 }}>
              <MenuItem value="">كل الأولويات</MenuItem>
              {[4, 3, 2, 1].map((k) => <MenuItem key={k} value={k}>{CS_PRIORITY[k].label}</MenuItem>)}
            </Select>
            <TextField size="small" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="اسم، جوال، هوية، رقم تذكرة…" sx={{ minWidth: { md: 240 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          </Stack>

          {counts ? (
            <Box sx={{ fontSize: 12.5, color: p.muted, mb: 1 }}>
              {counts.total} تذكرة{counts.complaints ? ` · منها ${counts.complaints} شكوى` : ""}
              {assignee ? " · مفلترة على موظف واحد" : ""}
            </Box>
          ) : null}

          {!tickets ? <CenterLoader /> : tickets.length === 0 ? (
            <EmptyState text={status === "open" ? "لا توجد تذاكر مفتوحة" : "لا توجد تذاكر مطابقة"} hint={status === "open" ? "عمل رائع! كل التذاكر مغلقة." : "جرّب تغيير الفلاتر."} />
          ) : (
            <Stack spacing={1}>
              {tickets.map((t) => <TicketRow key={t.guid} t={t} skew={skew} onOpen={setOpenGuid} showAssignee={scope === "all" || t.assigneeGuid !== t.creatorGuid} />)}
            </Stack>
          )}
        </SectionCard>

        {canManage && scope === "all" ? <Workload rows={summary?.workload || []} selected={assignee} onSelect={setAssignee} /> : null}
      </Box>
      </>)}

      <TicketDrawer guid={openGuid} onClose={closeTicket} onChanged={refresh} onOpenCustomer={openCustomer} />
      <CustomerProfileDialog accountGuid={customerGuid} onClose={closeCustomer} onOpenTicket={(g) => { setCustomerGuid(null); setOpenGuid(g); }} />
      {summary?.canConfigure ? <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} /> : null}
    </TasksPageShell>
  );
}
