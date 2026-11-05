// تقرير خدمة العملاء — /dashboard/report (صلاحية customer-service-report 226 أو cs-management)، بدل RportForClinets القديم.
// المصدر: GET api/customer-service/reports (CustomerServiceController.Reports). الفترة على تاريخ فتح التذكرة.
// ألوان الأنواع من الـ palette المعتمدة (أول 3 خانات، متحققة بالوضعين على خلفيات البرنامج)؛ الأخضر المائي أقل من 3:1
// على الفاتح، فكل الرسوم معاها أرقام ظاهرة + جداول.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip
} from "@mui/material";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import ForwardToInboxIcon from "@mui/icons-material/ForwardToInbox";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AlarmIcon from "@mui/icons-material/Alarm";
import TimerIcon from "@mui/icons-material/Timer";
import VerifiedIcon from "@mui/icons-material/Verified";
import GroupsIcon from "@mui/icons-material/Groups";
import { useTasksPalette } from "../tasks/tasksCommon";
import { TasksPageShell, SectionCard, CenterLoader, NoAccess } from "../tasks/TasksUi";
import { csGet } from "./csCommon";
import { PROGRAMS, TOPICS } from "./CsDialogs";

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtNum = (n) => Number(n || 0).toLocaleString("en-US");
const pct = (part, total) => (total ? Math.round((100 * part) / total) : 0);

const presetRange = (key) => {
  const today = new Date();
  const d = (y, m, day) => new Date(y, m, day);
  switch (key) {
    case "today": return [iso(today), iso(today)];
    case "week": return [iso(new Date(Date.now() - 6 * 864e5)), iso(today)];
    case "30": return [iso(new Date(Date.now() - 29 * 864e5)), iso(today)];
    case "lastMonth": return [iso(d(today.getFullYear(), today.getMonth() - 1, 1)), iso(d(today.getFullYear(), today.getMonth(), 0))];
    case "year": return [iso(d(today.getFullYear(), 0, 1)), iso(today)];
    default: return [iso(d(today.getFullYear(), today.getMonth(), 1)), iso(today)];
  }
};

// الأنواع: ترتيب ثابت (عام، شكوى، دراسي) = خانات الـ palette 1،2،3
const useSeries = () => {
  const p = useTasksPalette();
  return useMemo(() => (p.dark
    ? { general: "#3987e5", complaint: "#d95926", study: "#199e70", single: "#3987e5" }
    : { general: "#2a78d6", complaint: "#eb6834", study: "#1baf7a", single: "#2a78d6" }), [p.dark]);
};

const Kpi = ({ icon, label, value, sub, subColor }) => {
  const p = useTasksPalette();
  return (
    <SectionCard sx={{ p: 1.75, flex: "1 1 170px", minWidth: 170 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: p.muted }}>
        {React.cloneElement(icon, { sx: { fontSize: 18 } })}
        <Box sx={{ fontSize: 12.5, fontWeight: 700 }}>{label}</Box>
      </Stack>
      <Box sx={{ fontSize: 28, fontWeight: 800, color: p.text, mt: 0.5, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{value}</Box>
      {sub ? <Box sx={{ fontSize: 12, color: subColor || p.muted, mt: 0.25, fontWeight: 600 }}>{sub}</Box> : null}
    </SectionCard>
  );
};

const Delta = (cur, prev) => {
  if (!prev) return null;
  const d = Math.round(((cur - prev) / prev) * 100);
  return { text: `${d > 0 ? "▲" : d < 0 ? "▼" : "■"} ${Math.abs(d)}% عن الفترة السابقة (${fmtNum(prev)})`, d };
};

const ChartCard = ({ title, hint, children, sx }) => {
  const p = useTasksPalette();
  return (
    <SectionCard sx={{ p: 2, ...sx }}>
      <Box sx={{ fontSize: 15, fontWeight: 800, color: p.text }}>{title}</Box>
      {hint ? <Box sx={{ fontSize: 12, color: p.muted, mt: 0.25 }}>{hint}</Box> : null}
      <Box sx={{ mt: 1.5 }}>{children}</Box>
    </SectionCard>
  );
};

const TooltipBox = ({ active, payload, label, labelFormatter }) => {
  const p = useTasksPalette();
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, x) => s + Number(x.value || 0), 0);
  return (
    <Box sx={{ direction: "rtl", bgcolor: p.card, border: `1px solid ${p.borderStrong}`, borderRadius: 2, px: 1.5, py: 1, boxShadow: 3, minWidth: 150 }}>
      <Box sx={{ fontSize: 12.5, fontWeight: 800, color: p.text, mb: 0.5 }}>{labelFormatter ? labelFormatter(label) : label}</Box>
      {payload.map((x) => (
        <Stack key={x.dataKey} direction="row" spacing={1} alignItems="center" sx={{ fontSize: 12.5, color: p.text }}>
          <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: x.color || x.fill }} />
          <Box sx={{ flex: 1 }}>{x.name}</Box>
          <Box sx={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmtNum(x.value)}</Box>
        </Stack>
      ))}
      {payload.length > 1 ? <Box sx={{ fontSize: 12, color: p.muted, mt: 0.5, borderTop: `1px solid ${p.border}`, pt: 0.5 }}>الإجمالي: {fmtNum(total)}</Box> : null}
    </Box>
  );
};

const Legend = ({ items }) => {
  const p = useTasksPalette();
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
      {items.map((i) => (
        <Stack key={i.label} direction="row" spacing={0.75} alignItems="center" sx={{ fontSize: 12.5, color: p.text }}>
          <Box sx={{ width: 12, height: 12, borderRadius: 0.75, bgcolor: i.color }} />
          <span>{i.label}</span>
          <Box sx={{ color: p.muted, fontVariantNumeric: "tabular-nums" }}>{fmtNum(i.value)}</Box>
        </Stack>
      ))}
    </Stack>
  );
};

// شريط أفقي لفئة واحدة (مصادر الشكاوى / البرامج / المواضيع) — HTML بدل recharts لأن تسميات المحور العربية
// كانت بتتقص وتركب على الأعمدة. الاسم يمين، والشريط من اليمين، والعدد والنسبة ظاهرين.
const RankBars = ({ rows, color, emptyText }) => {
  const p = useTasksPalette();
  if (!rows.length) return <Box sx={{ fontSize: 13, color: p.muted, py: 2 }}>{emptyText}</Box>;
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <Stack spacing={1.1}>
      {rows.map((r) => (
        <Tooltip key={r.name} title={`${r.name}: ${fmtNum(r.count)} (${pct(r.count, total)}%)`} placement="top">
          <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 2fr) 64px", alignItems: "center", gap: 1, cursor: "default", "&:hover .bar": { opacity: 0.85 } }}>
            <Box sx={{ fontSize: 12.5, color: p.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</Box>
            <Box sx={{ height: 14, borderRadius: 1, bgcolor: p.nested, overflow: "hidden" }}>
              <Box className="bar" sx={{ height: "100%", width: `${Math.max(2, (r.count / max) * 100)}%`, bgcolor: color, borderRadius: "0 4px 4px 0", transition: "opacity .15s" }} />
            </Box>
            <Box sx={{ fontSize: 12.5, color: p.text, fontWeight: 800, fontVariantNumeric: "tabular-nums", textAlign: "left" }}>
              {fmtNum(r.count)} <Box component="span" sx={{ color: p.muted, fontWeight: 600 }}>{pct(r.count, total)}%</Box>
            </Box>
          </Box>
        </Tooltip>
      ))}
    </Stack>
  );
};

const DataTable = ({ columns, rows, emptyText }) => {
  const p = useTasksPalette();
  if (!rows.length) return <Box sx={{ fontSize: 13, color: p.muted, py: 2 }}>{emptyText}</Box>;
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ "& td, & th": { borderColor: p.border, fontFamily: "Cairo", whiteSpace: "nowrap" }, "& th": { color: p.muted, fontWeight: 800, fontSize: 12.5 } }}>
        <TableHead>
          <TableRow>{columns.map((c) => <TableCell key={c.key} align={c.num ? "center" : "right"}>{c.label}</TableCell>)}</TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i} hover>
              {columns.map((c) => (
                <TableCell key={c.key} align={c.num ? "center" : "right"} sx={{ fontSize: 13, color: p.text, fontWeight: c.strong ? 800 : 500, fontVariantNumeric: "tabular-nums" }}>
                  {c.render ? c.render(r) : c.num ? fmtNum(r[c.key]) : r[c.key] || "—"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default function CsReports() {
  const p = useTasksPalette();
  const series = useSeries();
  const [preset, setPreset] = useState("month");
  const [range, setRange] = useState(() => presetRange("month"));
  const [data, setData] = useState(null);
  const [denied, setDenied] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setData(null);
    setError("");
    try {
      setData(await csGet("/reports", { from: range[0], to: range[1] }));
    } catch (e) {
      if (e.status === 403) setDenied(e.message);
      else setError(e.status ? e.message : "تعذّر الاتصال بالخادم. تأكد من رفع آخر نسخة من الخادم ثم أعد المحاولة.");
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const choosePreset = (key) => {
    setPreset(key);
    if (key !== "custom") setRange(presetRange(key));
  };

  const view = useMemo(() => {
    if (!data) return null;
    const t = data.totals || {};
    const daily = (data.daily || []).map((d) => {
      const dt = new Date(d.date);
      return { ...d, label: `${dt.getDate()}/${dt.getMonth() + 1}` };
    });
    const sums = daily.reduce((s, d) => ({ general: s.general + d.general, study: s.study + d.study, complaint: s.complaint + d.complaint }), { general: 0, study: 0, complaint: 0 });
    return {
      t,
      daily,
      sums,
      sources: data.sources || [],
      programs: (data.programs || []).map((x) => ({ name: PROGRAMS[x.key - 1] || `برنامج ${x.key}`, count: x.count })),
      topics: (data.topics || []).map((x) => ({ name: TOPICS[x.key - 1] || `موضوع ${x.key}`, count: x.count })),
      agents: data.agents || [],
      handlers: data.handlers || [],
      customers: data.customers || []
    };
  }, [data]);

  const exportExcel = () => {
    if (!view) return;
    const { t } = view;
    const wb = XLSX.utils.book_new();
    const add = (name, rows) => {
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "": "لا توجد بيانات" }]);
      ws["!views"] = [{ RTL: true }];
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    add("المؤشرات", [
      { "المؤشر": "إجمالي المكالمات", "القيمة": t.calls },
      { "المؤشر": "تم الرد أثناء المكالمة", "القيمة": t.onCall },
      { "المؤشر": "الشكاوى", "القيمة": t.complaints },
      { "المؤشر": "محوّلة لموظف", "القيمة": t.forwarded },
      { "المؤشر": "مفتوحة الآن", "القيمة": t.openNow },
      { "المؤشر": "متأخرة", "القيمة": t.overdue },
      { "المؤشر": "صُعّدت", "القيمة": t.escalated },
      { "المؤشر": "عدد العملاء", "القيمة": t.customers },
      { "المؤشر": "متوسط زمن الحل (ساعة)", "القيمة": t.avgResolveHours ?? "" },
      { "المؤشر": "الالتزام بالمهلة %", "القيمة": t.onTimeRate ?? "" }
    ]);
    add("الحركة اليومية", view.daily.map((d) => ({ "اليوم": d.label, "استفسار عام": d.general, "استفسار دراسي": d.study, "شكوى": d.complaint, "الإجمالي": d.general + d.study + d.complaint })));
    add("موظفو الاستقبال", view.agents.map((a) => ({ "الموظف": a.name, "المكالمات": a.calls, "تم الرد أثناء المكالمة": a.onCall, "محوّلة": a.forwarded, "شكاوى": a.complaints })));
    add("المتابعة", view.handlers.map((h) => ({ "المسؤول": h.name, "أُسندت إليه": h.assigned, "أُغلقت": h.closed, "مفتوحة": h.openNow, "متأخرة": h.overdue, "متوسط الحل (ساعة)": h.avgResolveHours ?? "", "الالتزام %": h.onTimeRate ?? "" })));
    add("مصادر الشكاوى", view.sources.map((s) => ({ "المصدر": s.name, "العدد": s.count })));
    add("البرامج", view.programs.map((s) => ({ "البرنامج": s.name, "العدد": s.count })));
    add("المواضيع", view.topics.map((s) => ({ "الموضوع": s.name, "العدد": s.count })));
    add("العملاء الأكثر تواصلًا", view.customers.map((c) => ({ "العميل": c.name, "الجوال": c.tel, "المكالمات": c.calls, "الشكاوى": c.complaints, "مفتوحة": c.openNow })));
    XLSX.writeFile(wb, `تقرير خدمة العملاء ${range[0]} إلى ${range[1]}.xlsx`);
  };

  if (denied) return <NoAccess message={denied} />;

  const filters = (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <Select size="small" value={preset} onChange={(e) => choosePreset(e.target.value)} sx={{ minWidth: 150 }}>
        <MenuItem value="today">اليوم</MenuItem>
        <MenuItem value="week">آخر 7 أيام</MenuItem>
        <MenuItem value="month">هذا الشهر</MenuItem>
        <MenuItem value="30">آخر 30 يومًا</MenuItem>
        <MenuItem value="lastMonth">الشهر الماضي</MenuItem>
        <MenuItem value="year">هذه السنة</MenuItem>
        <MenuItem value="custom">فترة مخصصة</MenuItem>
      </Select>
      {preset === "custom" ? (
        <>
          <TextField size="small" type="date" value={range[0]} onChange={(e) => setRange([e.target.value, range[1]])} sx={{ width: 160 }} />
          <Box sx={{ color: p.muted, fontSize: 13 }}>إلى</Box>
          <TextField size="small" type="date" value={range[1]} onChange={(e) => setRange([range[0], e.target.value])} sx={{ width: 160 }} />
        </>
      ) : null}
      <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={exportExcel} disabled={!view}>تصدير Excel</Button>
    </Stack>
  );

  return (
    <TasksPageShell icon={<AssessmentIcon />} title="تقرير خدمة العملاء" subtitle={`من ${range[0]} إلى ${range[1]}`} actions={filters}>
      {error ? (
        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: p.tone("#dc2626").bg, color: p.tone("#dc2626").fg, fontWeight: 700, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          {error}<Button size="small" onClick={load}>إعادة المحاولة</Button>
        </Box>
      ) : !view ? <CenterLoader /> : (
        <Stack spacing={2}>
          {/* المؤشرات */}
          <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
            {(() => {
              const { t } = view;
              const dc = Delta(t.calls, t.prevCalls);
              const dq = Delta(t.complaints, t.prevComplaints);
              return (
                <>
                  <Kpi icon={<PhoneInTalkIcon />} label="إجمالي المكالمات" value={fmtNum(t.calls)} sub={dc?.text} />
                  <Kpi icon={<TaskAltIcon />} label="تم الرد أثناء المكالمة" value={`${pct(t.onCall, t.calls)}%`} sub={`${fmtNum(t.onCall)} مكالمة`} />
                  <Kpi icon={<ReportProblemIcon />} label="الشكاوى" value={fmtNum(t.complaints)} sub={dq?.text} />
                  <Kpi icon={<ForwardToInboxIcon />} label="محوّلة لموظف" value={fmtNum(t.forwarded)} sub={`${pct(t.forwarded, t.calls)}% من المكالمات`} />
                  <Kpi icon={<PendingActionsIcon />} label="مفتوحة الآن" value={fmtNum(t.openNow)} sub={t.overdue ? `منها ${fmtNum(t.overdue)} متأخرة` : "لا توجد متأخرات"} subColor={t.overdue ? "#dc2626" : undefined} />
                  <Kpi icon={<AlarmIcon />} label="صُعّدت للمشرفين" value={fmtNum(t.escalated)} />
                  <Kpi icon={<TimerIcon />} label="متوسط زمن الحل" value={t.avgResolveHours === null || t.avgResolveHours === undefined ? "—" : `${t.avgResolveHours} س`} sub="للتذاكر التي احتاجت متابعة" />
                  <Kpi icon={<VerifiedIcon />} label="الالتزام بمهلة الحل" value={t.onTimeRate === null || t.onTimeRate === undefined ? "—" : `${t.onTimeRate}%`} />
                  <Kpi icon={<GroupsIcon />} label="عملاء تواصلوا" value={fmtNum(t.customers)} />
                </>
              );
            })()}
          </Stack>

          {/* الحركة اليومية */}
          <ChartCard title="حركة المكالمات اليومية" hint="عدد المكالمات في كل يوم حسب النوع">
            <Legend items={[
              { label: "استفسار عام", color: series.general, value: view.sums.general },
              { label: "شكوى", color: series.complaint, value: view.sums.complaint },
              { label: "استفسار دراسي", color: series.study, value: view.sums.study }
            ]} />
            {view.daily.length === 0 ? <Box sx={{ color: p.muted, fontSize: 13, py: 3 }}>لا توجد مكالمات في هذه الفترة.</Box> : (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={view.daily} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barCategoryGap="22%">
                    <CartesianGrid vertical={false} stroke={p.border} strokeDasharray="3 3" />
                    <XAxis dataKey="label" reversed tick={{ fontSize: 11, fill: p.muted }} tickLine={false} axisLine={{ stroke: p.border }} minTickGap={8} />
                    <YAxis orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: p.muted }} tickLine={false} axisLine={false} width={36} />
                    <ChartTooltip cursor={{ fill: p.hover }} content={<TooltipBox />} />
                    <Bar dataKey="general" name="استفسار عام" stackId="t" fill={series.general} stroke={p.card} strokeWidth={2} maxBarSize={36} />
                    <Bar dataKey="complaint" name="شكوى" stackId="t" fill={series.complaint} stroke={p.card} strokeWidth={2} maxBarSize={36} />
                    <Bar dataKey="study" name="استفسار دراسي" stackId="t" fill={series.study} stroke={p.card} strokeWidth={2} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>
            <ChartCard title="مصادر الشكاوى" hint="الشكوى من مَن؟">
              <RankBars rows={view.sources} color={series.complaint} emptyText="لا توجد شكاوى في هذه الفترة." />
            </ChartCard>
            <ChartCard title="البرامج الأكثر سؤالًا" hint="من الاستفسارات الدراسية">
              <RankBars rows={view.programs} color={series.single} emptyText="لا توجد استفسارات دراسية." />
            </ChartCard>
            <ChartCard title="مواضيع الاستفسار" hint="من الاستفسارات الدراسية">
              <RankBars rows={view.topics} color={series.study} emptyText="لا توجد استفسارات دراسية." />
            </ChartCard>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 2 }}>
            <ChartCard title="أداء موظفي استقبال المكالمات" hint="من سجّل المكالمات في هذه الفترة">
              <DataTable
                emptyText="لا توجد بيانات."
                rows={view.agents}
                columns={[
                  { key: "name", label: "الموظف", strong: true },
                  { key: "calls", label: "المكالمات", num: true },
                  { key: "onCall", label: "رد أثناء المكالمة", num: true, render: (r) => `${fmtNum(r.onCall)} (${pct(r.onCall, r.calls)}%)` },
                  { key: "forwarded", label: "حوّلها", num: true },
                  { key: "complaints", label: "شكاوى", num: true }
                ]}
              />
            </ChartCard>
            <ChartCard title="أداء المسؤولين عن المتابعة" hint="التذاكر التي احتاجت متابعة وأُسندت إليهم">
              <DataTable
                emptyText="لا توجد تذاكر احتاجت متابعة."
                rows={view.handlers}
                columns={[
                  { key: "name", label: "المسؤول", strong: true },
                  { key: "assigned", label: "أُسندت", num: true },
                  { key: "closed", label: "أُغلقت", num: true },
                  { key: "openNow", label: "مفتوحة", num: true },
                  { key: "overdue", label: "متأخرة", num: true, render: (r) => (r.overdue ? <Box component="span" sx={{ color: "#dc2626", fontWeight: 800 }}>{fmtNum(r.overdue)}</Box> : "0") },
                  { key: "avgResolveHours", label: "متوسط الحل", num: true, render: (r) => (r.avgResolveHours === null || r.avgResolveHours === undefined ? "—" : `${r.avgResolveHours} س`) },
                  { key: "onTimeRate", label: "الالتزام", num: true, render: (r) => (r.onTimeRate === null || r.onTimeRate === undefined ? "—" : `${r.onTimeRate}%`) }
                ]}
              />
            </ChartCard>
          </Box>

          <ChartCard title="العملاء الأكثر تواصلًا" hint="أكثر من مكالمة في الفترة — يستحقون متابعة خاصة">
            <DataTable
              emptyText="لا يوجد عميل تواصل أكثر من مرة."
              rows={view.customers}
              columns={[
                { key: "name", label: "العميل", strong: true },
                { key: "tel", label: "الجوال", render: (r) => <bdi dir="ltr">{r.tel || "—"}</bdi> },
                { key: "calls", label: "المكالمات", num: true },
                { key: "complaints", label: "الشكاوى", num: true },
                { key: "openNow", label: "مفتوحة الآن", num: true }
              ]}
            />
          </ChartCard>
        </Stack>
      )}
    </TasksPageShell>
  );
}
