import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import * as XLSX from "xlsx";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import {
  CenterLoader,
  DueChip,
  EmptyState,
  NoAccess,
  PriorityChip,
  SectionCard,
  SendTaskDialog,
  StatusChip,
  TaskDetailsDrawer,
  TaskStatusChip,
  TasksPageShell,
  showError
} from "./TasksUi";
import { OPEN_STATUSES, OVERDUE_COLOR, PRIORITY, STATUS, TASK_STATUS, apiGet, taskStatusKey, formatDate, formatDateTime, useTasksPalette } from "./tasksCommon";

const ASSIGNMENT_VIEWS = [
  { key: "open", label: "قيد العمل", test: (r) => r.taskStatus === "Open" && OPEN_STATUSES.includes(r.status) },
  { key: "review", label: "بانتظار المراجعة", test: (r) => r.status === "InReview" },
  { key: "overdue", label: "متأخرة", test: (r) => r.isOverdue },
  { key: "done", label: "مكتملة", test: (r) => r.status === "Done" },
  { key: "all", label: "الكل", test: () => true }
];

const SENT_VIEWS = [
  { key: "open", label: "جارية", test: (r) => r.taskStatus === "Open" },
  { key: "review", label: "تنتظر مراجعتي", test: (r) => r.reviewCount > 0 },
  { key: "overdue", label: "متأخرة", test: (r) => r.isOverdue },
  // نفس أسماء حالة المهمة بالظبط (taskStatusKey) عشان التبويب مايتلخبطش مع الحالة
  { key: "completed", label: "مكتملة", test: (r) => taskStatusKey(r.taskStatus, r.doneCount, r.assigneeCount) === "Completed" },
  { key: "partial", label: "منتهية جزئيًا أو ملغاة", test: (r) => ["Partial", "Cancelled"].includes(taskStatusKey(r.taskStatus, r.doneCount, r.assigneeCount)) },
  { key: "all", label: "الكل", test: () => true }
];

const useTasksList = (path) => {
  const [state, setState] = useState({ loading: true, forbidden: "", rows: [] });

  const load = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setState((s) => ({ ...s, loading: true }));
      const json = await apiGet(path);
      setState({ loading: false, forbidden: "", rows: json.data || [] });
    } catch (e) {
      if (e.status === 403) setState({ loading: false, forbidden: e.message, rows: [] });
      else {
        setState((s) => ({ ...s, loading: false }));
        if (!quiet) showError(e);
      }
    }
  }, [path]);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  return { ...state, reload: load };
};

// تبويبات الحالة مع العدد
const ViewTabs = ({ views, rows, view, setView }) => {
  const p = useTasksPalette();
  return (
    <Tabs
      value={view}
      onChange={(_, v) => setView(v)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{ minHeight: 44, px: 1, borderBottom: `1px solid ${p.border}`, "& .MuiTab-root": { minHeight: 44, fontWeight: 600, fontSize: 14, px: 1.75 } }}
    >
      {views.map((v) => {
        const n = rows.filter(v.test).length;
        const alert = v.key === "overdue" && n > 0;
        const t = p.tone(alert ? OVERDUE_COLOR : "#64748b");
        return (
          <Tab
            key={v.key}
            value={v.key}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>{v.label}</span>
                <Box component="span" sx={{ minWidth: 22, px: 0.75, height: 20, lineHeight: "20px", borderRadius: 10, fontSize: 12, fontWeight: 600, bgcolor: t.bg, color: t.fg }}>{n}</Box>
              </Stack>
            }
          />
        );
      })}
    </Tabs>
  );
};

const FilterBar = ({ search, setSearch, priority, setPriority, placeholder, extra }) => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ p: 1.5 }}>
    <TextField
      size="small"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder={placeholder}
      sx={{ flex: 1 }}
      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
    />
    <TextField select size="small" value={priority} onChange={(e) => setPriority(e.target.value)} sx={{ minWidth: 170 }} SelectProps={{ displayEmpty: true }}>
      <MenuItem value="">جميع الأولويات</MenuItem>
      {Object.entries(PRIORITY).map(([k, pr]) => (
        <MenuItem key={k} value={k}>{pr.label}</MenuItem>
      ))}
    </TextField>
    {extra}
  </Stack>
);

const TaskRow = ({ onClick, overdue, unread, children }) => {
  const p = useTasksPalette();
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" ? onClick() : null)}
      sx={{
        position: "relative",
        px: 2,
        py: 1.6,
        cursor: "pointer",
        borderBottom: `1px solid ${p.border}`,
        bgcolor: unread ? p.hover : "transparent",
        transition: "background-color .15s",
        "&:last-of-type": { borderBottom: "none" },
        "&:hover": { bgcolor: p.selected },
        "&:focus-visible": { outline: `2px solid ${p.primary}`, outlineOffset: -2 },
        "&::before": overdue ? { content: '""', position: "absolute", right: 0, top: 10, bottom: 10, width: 3, borderRadius: 3, bgcolor: OVERDUE_COLOR } : undefined
      }}
    >
      {children}
    </Box>
  );
};

const RowTitle = ({ children, strong }) => {
  const p = useTasksPalette();
  return <Typography sx={{ fontWeight: strong ? 700 : 600, fontSize: 15, color: p.text, wordBreak: "break-word", lineHeight: 1.5 }}>{children}</Typography>;
};

const RowMeta = ({ children }) => {
  const p = useTasksPalette();
  return <Typography sx={{ fontSize: 12.5, color: p.muted, mt: 0.25 }}>{children}</Typography>;
};

const matchesSearch = (r, q, fields) => !q || fields.some((f) => String(r[f] || "").toLowerCase().includes(q));

const exportRows = (fileName, header, rows) => {
  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  sheet["!cols"] = header.map(() => ({ wch: 22 }));
  const book = XLSX.utils.book_new();
  book.Workbook = { Views: [{ RTL: true }] };
  XLSX.utils.book_append_sheet(book, sheet, "المهام");
  XLSX.writeFile(book, fileName);
};

const ListBody = ({ loading, rows, empty, children }) =>
  loading ? <CenterLoader /> : !rows.length ? <Box sx={{ p: 1.5 }}>{empty}</Box> : <Box>{children}</Box>;

// =========================================================
// مهامي
// =========================================================

export const TasksInboxPage = () => {
  const { loading, forbidden, rows, reload } = useTasksList("/inbox");
  const [view, setView] = useState("open");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [openGuid, setOpenGuid] = useState(null);
  const q = useDeferredValue(search.trim().toLowerCase());

  const visible = useMemo(() => {
    const v = ASSIGNMENT_VIEWS.find((x) => x.key === view) || ASSIGNMENT_VIEWS[0];
    return rows.filter((r) => v.test(r) && (!priority || String(r.priority) === priority) && matchesSearch(r, q, ["title", "createdByName"]));
  }, [rows, view, priority, q]);

  if (forbidden) return <NoAccess message={forbidden} />;

  return (
    <TasksPageShell
      icon={<AssignmentTurnedInOutlinedIcon />}
      title="مهامي"
      subtitle="المهام المسندة إليك: ابدأ التنفيذ، وحدّث نسبة الإنجاز، ثم سلّم المهمة"
      actions={<Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => reload()}>تحديث</Button>}
    >
      <SectionCard>
        <ViewTabs views={ASSIGNMENT_VIEWS} rows={rows} view={view} setView={setView} />
        <FilterBar search={search} setSearch={setSearch} priority={priority} setPriority={setPriority} placeholder="ابحث بعنوان المهمة أو اسم المرسل" />
        <ListBody
          loading={loading}
          rows={visible}
          empty={<EmptyState text={view === "open" ? "لا توجد مهام قيد العمل" : "لا توجد مهام في هذا القسم"} hint={view === "open" ? "ستظهر هنا المهام الجديدة فور إرسالها إليك" : undefined} />}
        >
          {visible.map((r) => (
            <TaskRow key={r.taskGuid} onClick={() => setOpenGuid(r.taskGuid)} overdue={r.isOverdue} unread={!r.seenAt}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {!r.seenAt ? <Tooltip title="لم تطّلع عليها بعد"><Box sx={{ width: 8, height: 8, borderRadius: 9, bgcolor: STATUS.New.color, flexShrink: 0 }} /></Tooltip> : null}
                    <RowTitle strong={!r.seenAt}>{r.title}</RowTitle>
                  </Stack>
                  <RowMeta>من {r.createdByName} · {formatDateTime(r.assignedAt)}</RowMeta>
                </Box>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                  <PriorityChip priority={r.priority} hideNormal />
                  <DueChip dueAt={r.dueAt} overdue={r.isOverdue} finished={r.taskStatus !== "Open" || ["Done", "Rejected", "Cancelled"].includes(r.status)} />
                  <StatusChip status={r.status} />
                  {r.commentCount ? <Chip size="small" variant="outlined" icon={<ChatBubbleOutlineIcon />} label={r.commentCount} sx={{ height: 24 }} /> : null}
                </Stack>
              </Stack>
              {OPEN_STATUSES.includes(r.status) && r.progress > 0 ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, maxWidth: 420 }}>
                  <LinearProgress variant="determinate" value={r.progress} sx={{ flex: 1, height: 4, borderRadius: 9 }} />
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{r.progress}%</Typography>
                </Stack>
              ) : null}
            </TaskRow>
          ))}
        </ListBody>
      </SectionCard>
      <TaskDetailsDrawer taskGuid={openGuid} onClose={() => setOpenGuid(null)} onChanged={() => reload(true)} />
    </TasksPageShell>
  );
};

// =========================================================
// المهام المرسلة
// =========================================================

export const TasksSentPage = () => {
  const p = useTasksPalette();
  const { loading, forbidden, rows, reload } = useTasksList("/sent");
  const [canSend, setCanSend] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [view, setView] = useState("open");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [openGuid, setOpenGuid] = useState(null);
  const q = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    apiGet("/bootstrap").then((b) => setCanSend(Boolean(b.access?.send))).catch(() => setCanSend(false));
  }, []);

  const visible = useMemo(() => {
    const v = SENT_VIEWS.find((x) => x.key === view) || SENT_VIEWS[0];
    return rows.filter((r) => v.test(r) && (!priority || String(r.priority) === priority) && matchesSearch(r, q, ["title", "assigneeNames"]));
  }, [rows, view, priority, q]);

  if (forbidden) return <NoAccess message={forbidden} />;

  return (
    <TasksPageShell
      icon={<AssignmentOutlinedIcon />}
      title="المهام المرسلة"
      subtitle="تابع تنفيذ المهام التي أرسلتها لدى كل مستلم، واعتمد ما يُسلَّم إليك"
      actions={
        <>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => reload()}>تحديث</Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            disabled={!visible.length}
            onClick={() =>
              exportRows(`المهام_المرسلة_${formatDate(new Date()).replace(/\//g, "-")}.xlsx`,
                ["الرقم", "العنوان", "الأولوية", "موعد التسليم", "الحالة", "المستلمون", "المكتملة", "بانتظار المراجعة", "متوسط الإنجاز %", "تاريخ الإرسال"],
                visible.map((r) => [r.taskNo, r.title, PRIORITY[r.priority]?.label, formatDateTime(r.dueAt), TASK_STATUS[taskStatusKey(r.taskStatus, r.doneCount, r.assigneeCount)]?.label || r.taskStatus, r.assigneeNames, `${r.doneCount}/${r.assigneeCount}`, r.reviewCount, r.avgProgress, formatDateTime(r.createdAt)]))
            }
          >
            تصدير Excel
          </Button>
          {canSend ? <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={() => setSendOpen(true)}>مهمة جديدة</Button> : null}
        </>
      }
    >
      <SectionCard>
        <ViewTabs views={SENT_VIEWS} rows={rows} view={view} setView={setView} />
        <FilterBar search={search} setSearch={setSearch} priority={priority} setPriority={setPriority} placeholder="ابحث بعنوان المهمة أو اسم المستلم" />
        <ListBody
          loading={loading}
          rows={visible}
          empty={<EmptyState text="لا توجد مهام في هذا القسم" hint={canSend ? "يمكنك إرسال مهمة من زر «مهمة جديدة»" : undefined} />}
        >
          {visible.map((r) => {
            const done = r.doneCount || 0;
            const total = r.assigneeCount || 0;
            return (
              <TaskRow key={r.taskGuid} onClick={() => setOpenGuid(r.taskGuid)} overdue={r.isOverdue}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <RowTitle>{r.title}</RowTitle>
                    <RowMeta>
                      <Box component="span" sx={{ display: "inline-block", maxWidth: { xs: "100%", md: 560 }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "bottom" }}>
                        إلى: {r.assigneeNames}
                      </Box>
                      {" · "}{formatDateTime(r.createdAt)}
                    </RowMeta>
                  </Box>
                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                    <PriorityChip priority={r.priority} hideNormal />
                    <DueChip dueAt={r.dueAt} overdue={r.isOverdue} finished={r.taskStatus !== "Open"} />
                    {r.reviewCount ? <StatusChip status="InReview" /> : null}
                    <TaskStatusChip status={r.taskStatus} doneCount={r.doneCount} total={r.assigneeCount} />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 1.1, maxWidth: 520 }}>
                  <LinearProgress variant="determinate" value={total ? (done / total) * 100 : 0} sx={{ flex: 1, height: 4, borderRadius: 9 }} />
                  <Typography sx={{ fontSize: 12, color: p.muted, whiteSpace: "nowrap" }}>أنجزها {done} من {total} · متوسط الإنجاز {r.avgProgress ?? 0}%</Typography>
                </Stack>
              </TaskRow>
            );
          })}
        </ListBody>
      </SectionCard>
      <SendTaskDialog open={sendOpen} onClose={() => setSendOpen(false)} onSent={() => reload(true)} />
      <TaskDetailsDrawer taskGuid={openGuid} onClose={() => setOpenGuid(null)} onChanged={() => reload(true)} />
    </TasksPageShell>
  );
};

// =========================================================
// متابعة مهام الفريق
// =========================================================

export const TasksTeamPage = () => {
  const p = useTasksPalette();
  const { loading, forbidden, rows, reload } = useTasksList("/team");
  const [view, setView] = useState("open");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [person, setPerson] = useState("");
  const [openGuid, setOpenGuid] = useState(null);
  const q = useDeferredValue(search.trim().toLowerCase());

  const people = useMemo(() => [...new Set(rows.map((r) => r.assigneeName))].sort((a, b) => a.localeCompare(b, "ar")), [rows]);

  const visible = useMemo(() => {
    const v = ASSIGNMENT_VIEWS.find((x) => x.key === view) || ASSIGNMENT_VIEWS[0];
    return rows.filter((r) =>
      v.test(r) &&
      (!priority || String(r.priority) === priority) &&
      (!person || r.assigneeName === person) &&
      matchesSearch(r, q, ["title", "assigneeName", "createdByName"]));
  }, [rows, view, priority, person, q]);

  // ملخص لكل موظف لديه مهام مفتوحة
  const byPerson = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const x = map.get(r.assigneeName) || { name: r.assigneeName, open: 0, overdue: 0, notSeen: 0 };
      if (r.taskStatus === "Open" && OPEN_STATUSES.includes(r.status)) x.open += 1;
      if (r.isOverdue) x.overdue += 1;
      if (!r.seenAt && r.status === "New") x.notSeen += 1;
      map.set(r.assigneeName, x);
    });
    return [...map.values()].filter((x) => x.open || x.overdue).sort((a, b) => b.overdue - a.overdue || b.open - a.open);
  }, [rows]);

  if (forbidden) return <NoAccess message={forbidden} />;

  const overdueTone = p.tone(OVERDUE_COLOR);

  return (
    <TasksPageShell
      icon={<SupervisorAccountOutlinedIcon />}
      title="متابعة مهام الفريق"
      subtitle="مهام الموظفين التابعين لك في الهيكل التنظيمي (للاطلاع والمتابعة)"
      actions={<Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => reload()}>تحديث</Button>}
    >
      {byPerson.length ? (
        <Stack direction="row" spacing={1.25} sx={{ mb: 2, overflowX: "auto", pb: 0.5 }}>
          {byPerson.map((x) => {
            const active = person === x.name;
            return (
              <SectionCard
                key={x.name}
                onClick={() => setPerson(active ? "" : x.name)}
                sx={{ p: 1.5, minWidth: 190, cursor: "pointer", flexShrink: 0, borderColor: active ? p.primary : p.border, bgcolor: active ? p.selected : p.card, transition: "all .15s", "&:hover": { borderColor: p.borderStrong } }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700, bgcolor: p.selected, color: p.primary }}>{x.name?.[0] || "؟"}</Avatar>
                  <Typography sx={{ fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap" }}>{x.name}</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                  <Typography sx={{ fontSize: 12, color: p.muted }}><b style={{ color: p.text }}>{x.open}</b> قيد العمل</Typography>
                  {x.overdue ? <Typography sx={{ fontSize: 12, color: overdueTone.fg }}><b>{x.overdue}</b> متأخرة</Typography> : null}
                  {x.notSeen ? <Typography sx={{ fontSize: 12, color: p.muted }}><b style={{ color: p.text }}>{x.notSeen}</b> لم تُفتح</Typography> : null}
                </Stack>
              </SectionCard>
            );
          })}
        </Stack>
      ) : null}
      <SectionCard>
        <ViewTabs views={ASSIGNMENT_VIEWS} rows={rows} view={view} setView={setView} />
        <FilterBar
          search={search}
          setSearch={setSearch}
          priority={priority}
          setPriority={setPriority}
          placeholder="ابحث بعنوان المهمة أو اسم الموظف"
          extra={
            <TextField select size="small" value={person} onChange={(e) => setPerson(e.target.value)} sx={{ minWidth: 210 }} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">جميع الموظفين</MenuItem>
              {people.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
          }
        />
        <ListBody loading={loading} rows={visible} empty={<EmptyState text="لا توجد مهام في هذا القسم" />}>
          {visible.map((r) => (
            <TaskRow key={`${r.taskGuid}-${r.assigneeGuid}`} onClick={() => setOpenGuid(r.taskGuid)} overdue={r.isOverdue}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <RowTitle>{r.title}</RowTitle>
                  <RowMeta>
                    <b style={{ fontWeight: 600 }}>{r.assigneeName}</b> · من {r.createdByName} · {formatDateTime(r.assignedAt)}{!r.seenAt ? " · لم يطّلع عليها بعد" : ""}
                  </RowMeta>
                </Box>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                  <PriorityChip priority={r.priority} hideNormal />
                  <DueChip dueAt={r.dueAt} overdue={r.isOverdue} finished={r.taskStatus !== "Open" || ["Done", "Rejected", "Cancelled"].includes(r.status)} />
                  <StatusChip status={r.status} />
                  <Typography sx={{ fontSize: 12, color: p.muted, minWidth: 34, textAlign: "center" }}>{r.progress}%</Typography>
                </Stack>
              </Stack>
            </TaskRow>
          ))}
        </ListBody>
      </SectionCard>
      <TaskDetailsDrawer taskGuid={openGuid} onClose={() => setOpenGuid(null)} onChanged={() => reload(true)} />
    </TasksPageShell>
  );
};
