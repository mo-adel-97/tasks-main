import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Slider,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import Swal from "sweetalert2";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ReplayIcon from "@mui/icons-material/Replay";
import DoNotDisturbIcon from "@mui/icons-material/DoNotDisturb";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import AddTaskIcon from "@mui/icons-material/AddTask";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import {
  ACCEPT_FILES,
  OVERDUE_COLOR,
  PRIORITY,
  STATUS,
  TASK_STATUS,
  apiGet,
  apiPost,
  apiPostForm,
  openAttachment,
  checkFiles,
  dueText,
  formatDate,
  formatDateTime,
  formatSize,
  getUserGuid,
  taskStatusKey,
  toLocalInput,
  useTasksPalette
} from "./tasksCommon";

// =========================================================
// تنبيهات
// =========================================================

const SWAL_COLOR = "#057546";

export const toast = (title, icon = "success") =>
  Swal.fire({ toast: true, position: "top", icon, title, showConfirmButton: false, timer: 2200 });

export const showError = (e) =>
  Swal.fire({ icon: "error", title: "تعذّر إتمام العملية", text: e?.message || String(e), confirmButtonText: "حسنًا", confirmButtonColor: SWAL_COLOR });

const askText = async (title, placeholder, required = true) => {
  const { value, isConfirmed } = await Swal.fire({
    title,
    input: "textarea",
    inputPlaceholder: placeholder,
    inputAttributes: { dir: "rtl" },
    // خانة SweetAlert الافتراضية بخط monospace وتباعد حروف؛ نرجعها لخط البرنامج
    didOpen: (popup) => {
      const area = popup.querySelector(".swal2-textarea");
      if (area) Object.assign(area.style, { fontFamily: "Cairo, Tahoma, sans-serif", letterSpacing: "normal", fontSize: "15px", lineHeight: "1.8", textAlign: "right" });
    },
    showCancelButton: true,
    confirmButtonText: "تأكيد",
    cancelButtonText: "إلغاء",
    confirmButtonColor: SWAL_COLOR,
    inputValidator: (v) => (required && !String(v || "").trim() ? "هذا الحقل مطلوب" : undefined)
  });
  return isConfirmed ? String(value || "").trim() : null;
};

export const confirmAction = async (title, text, danger = false) =>
  (
    await Swal.fire({
      icon: danger ? "warning" : "question",
      title,
      text,
      showCancelButton: true,
      confirmButtonText: "نعم",
      cancelButtonText: "تراجع",
      confirmButtonColor: danger ? OVERDUE_COLOR : SWAL_COLOR
    })
  ).isConfirmed;

// =========================================================
// شارات
// =========================================================

export const SoftChip = ({ label, color, icon, strong = false }) => {
  const p = useTasksPalette();
  const t = p.tone(color);
  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      sx={{
        height: 24,
        fontWeight: 600,
        fontSize: 12,
        borderRadius: 1.5,
        color: strong ? "#fff" : t.fg,
        bgcolor: strong ? color : t.bg,
        border: "none",
        "& .MuiChip-icon": { color: strong ? "#fff" : t.fg, fontSize: 15, mr: 0.5, ml: -0.25 },
        "& .MuiChip-label": { px: 1 }
      }}
    />
  );
};

export const StatusChip = ({ status }) => {
  const s = STATUS[status] || { label: status, color: "#6b7280" };
  return <SoftChip label={s.label} color={s.color} />;
};

export const TaskStatusChip = ({ status, doneCount, total }) => {
  const key = taskStatusKey(status, doneCount, total);
  const s = TASK_STATUS[key] || { label: status, color: "#6b7280" };
  return <SoftChip label={s.label} color={s.color} />;
};

export const PriorityChip = ({ priority, hideNormal = false }) => {
  if (hideNormal && Number(priority) === 2) return null;
  const pr = PRIORITY[priority] || PRIORITY[2];
  return <SoftChip label={`أولوية ${pr.label}`} color={pr.color} strong={Number(priority) === 4} />;
};

// finished: المهمة خلصت — نعرض الموعد نفسه بدل "متبقٍّ / متأخرة" المحسوبة من دلوقتي
export const DueChip = ({ dueAt, overdue, finished = false }) => {
  const p = useTasksPalette();
  if (!dueAt) return <Typography sx={{ fontSize: 12, color: p.muted }}>بلا موعد تسليم</Typography>;
  return (
    <Tooltip title={`موعد التسليم: ${formatDateTime(dueAt)}`}>
      <span>
        <SoftChip icon={<EventOutlinedIcon />} label={finished ? `الموعد ${formatDate(dueAt)}` : dueText(dueAt)} color={overdue && !finished ? OVERDUE_COLOR : "#64748b"} />
      </span>
    </Tooltip>
  );
};

// =========================================================
// هيكل الشاشة
// =========================================================

export const TasksPageShell = ({ icon, title, subtitle, actions, children }) => {
  const p = useTasksPalette();
  const t = p.tone(p.dark ? "#4fae84" : "#057546");
  return (
    <Box sx={{ direction: "rtl", p: { xs: 1.5, md: 2.5 }, maxWidth: 1500, mx: "auto", ...p.containedSx }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, display: "grid", placeItems: "center", bgcolor: t.bg, color: t.fg, flexShrink: 0 }}>
            {React.cloneElement(icon, { sx: { fontSize: 24 } })}
          </Box>
          <Box>
            <Typography component="h1" sx={{ fontWeight: 700, fontSize: { xs: 18, md: 20 }, color: p.text, lineHeight: 1.4 }}>{title}</Typography>
            {subtitle ? <Typography sx={{ fontSize: 13, color: p.muted, mt: 0.25 }}>{subtitle}</Typography> : null}
          </Box>
        </Stack>
        {actions ? <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent={{ xs: "flex-start", sm: "flex-end" }}>{actions}</Stack> : null}
      </Stack>
      {children}
    </Box>
  );
};

export const SectionCard = ({ children, sx, ...rest }) => {
  const p = useTasksPalette();
  return (
    <Paper elevation={0} sx={{ bgcolor: p.card, border: `1px solid ${p.border}`, borderRadius: 3, ...sx }} {...rest}>
      {children}
    </Paper>
  );
};

export const NoAccess = ({ message }) => (
  <Box sx={{ p: 3, direction: "rtl" }}>
    <Alert severity="warning" sx={{ fontWeight: 600 }}>{message || "ليس لديك صلاحية على هذه الشاشة"}</Alert>
  </Box>
);

export const CenterLoader = () => (
  <Stack alignItems="center" sx={{ py: 8 }}>
    <CircularProgress size={30} />
  </Stack>
);

export const EmptyState = ({ text, hint }) => {
  const p = useTasksPalette();
  return (
    <SectionCard sx={{ py: 6, px: 2, textAlign: "center", borderStyle: "dashed" }}>
      <InboxOutlinedIcon sx={{ fontSize: 44, color: p.muted, opacity: 0.6 }} />
      <Typography sx={{ fontWeight: 600, color: p.text, mt: 1 }}>{text}</Typography>
      {hint ? <Typography sx={{ fontSize: 13, color: p.muted, mt: 0.5 }}>{hint}</Typography> : null}
    </SectionCard>
  );
};

// rtl-forms-fix.css يثبّت الحقول متعددة الأسطر على سطر واحد؛ هنا نعيدها لحجمها الطبيعي.
export const multilineSx = (min = 72, max = 260) => ({
  "& .MuiInputBase-root textarea.MuiInputBase-inputMultiline:not([aria-hidden='true'])": {
    minHeight: `${min}px !important`,
    maxHeight: `${max}px !important`,
    height: "auto !important",
    lineHeight: "1.8 !important",
    overflow: "auto !important"
  }
});

const DialogHeader = ({ icon, title, onClose, disabled }) => {
  const p = useTasksPalette();
  return (
    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.6, borderBottom: `1px solid ${p.border}` }}>
      <Stack direction="row" spacing={1} alignItems="center">
        {icon ? React.cloneElement(icon, { sx: { color: p.primary } }) : null}
        <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{title}</Typography>
      </Stack>
      {onClose ? <IconButton onClick={onClose} disabled={disabled} size="small"><CloseIcon fontSize="small" /></IconButton> : null}
    </DialogTitle>
  );
};

// =========================================================
// اختيار الملفات
// =========================================================

const FileChips = ({ files, setFiles }) =>
  files.length ? (
    <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
      {files.map((f, i) => (
        <Chip
          key={`${f.name}-${i}`}
          size="small"
          variant="outlined"
          icon={<InsertDriveFileOutlinedIcon />}
          label={`${f.name} (${formatSize(f.size)})`}
          onDelete={() => setFiles(files.filter((_, j) => j !== i))}
        />
      ))}
    </Stack>
  ) : null;

const FilePicker = ({ files, setFiles, compact = false }) => {
  const inputRef = useRef(null);
  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPT_FILES}
        onChange={(e) => {
          const picked = Array.from(e.target.files || []);
          e.target.value = "";
          const next = [...files, ...picked];
          const error = checkFiles(next);
          if (error) return showError(new Error(error));
          setFiles(next);
        }}
      />
      {compact ? (
        <Tooltip title="إرفاق ملفات">
          <IconButton onClick={() => inputRef.current?.click()}>
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <>
          <Button variant="outlined" size="small" startIcon={<AttachFileIcon />} onClick={() => inputRef.current?.click()}>
            إرفاق ملفات
          </Button>
          <FileChips files={files} setFiles={setFiles} />
        </>
      )}
    </Box>
  );
};

// =========================================================
// إرسال مهمة
// =========================================================

export const SendTaskDialog = ({ open, onClose, onSent }) => {
  const theme = useTheme();
  const p = useTasksPalette();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState({ users: [], units: [], canBroadcast: false });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [dueAt, setDueAt] = useState("");
  const [requiresReview, setRequiresReview] = useState(true);
  const [selected, setSelected] = useState([]);
  const [unit, setUnit] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setPriority(2);
    setDueAt("");
    setRequiresReview(true);
    setSelected([]);
    setUnit(null);
    setFiles([]);
    setLoading(true);
    apiGet("/recipients")
      .then((r) => setRecipients({ users: r.users || [], units: r.units || [], canBroadcast: Boolean(r.canBroadcast) }))
      .catch((e) => {
        showError(e);
        onClose();
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const usersByGuid = useMemo(() => new Map(recipients.users.map((u) => [u.guid, u])), [recipients.users]);

  const pickUnit = (u) => {
    setUnit(u);
    if (!u) return;
    const members = (u.members || []).map((g) => usersByGuid.get(g)).filter(Boolean);
    setSelected((current) => {
      const have = new Set(current.map((x) => x.guid));
      return [...current, ...members.filter((m) => !have.has(m.guid))];
    });
  };

  const submit = async () => {
    if (!title.trim()) return showError(new Error("يرجى إدخال عنوان المهمة"));
    if (!selected.length) return showError(new Error("يرجى اختيار مستلم واحد على الأقل"));
    try {
      setSending(true);
      await apiPostForm(
        "",
        {
          payload: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            priority,
            dueAt: dueAt || null,
            requiresReview,
            assignees: selected.map((u) => u.guid),
            unitGuid: unit?.guid || null
          })
        },
        files
      );
      toast("تم إرسال المهمة بنجاح");
      onSent?.();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={sending ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}
      PaperProps={{ sx: { direction: "rtl", borderRadius: fullScreen ? 0 : 3, bgcolor: p.card, backgroundImage: "none", ...p.containedSx } }}>
      <DialogHeader icon={<AddTaskIcon />} title="مهمة جديدة" onClose={onClose} disabled={sending} />
      <DialogContent sx={{ pt: "20px !important" }}>
        {loading ? (
          <CenterLoader />
        ) : !recipients.users.length ? (
          <Alert severity="info">
            لا يوجد موظفون يمكنك إرسال مهام إليهم وفق قواعد الإرسال الحالية. يرجى التواصل مع مسؤول النظام.
          </Alert>
        ) : (
          <Stack spacing={2}>
            <TextField label="عنوان المهمة" value={title} onChange={(e) => setTitle(e.target.value)} inputProps={{ maxLength: 300 }} required fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="التفاصيل" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={3} maxRows={10} fullWidth InputLabelProps={{ shrink: true }} sx={multilineSx(84, 240)} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField select label="الأولوية" value={priority} onChange={(e) => setPriority(Number(e.target.value))} InputLabelProps={{ shrink: true }}>
                {Object.entries(PRIORITY).map(([k, pr]) => (
                  <MenuItem key={k} value={Number(k)}>{pr.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                type="datetime-local"
                label="موعد التسليم (اختياري)"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ dir: "ltr", min: toLocalInput(new Date()) }}
              />
            </Box>

            {recipients.canBroadcast && recipients.units.length ? (
              <Autocomplete
                options={recipients.units}
                value={unit}
                onChange={(_, v) => pickUnit(v)}
                getOptionLabel={(o) => (o?.parent ? `${o.name} — ${o.parent}` : o?.name || "")}
                isOptionEqualToValue={(a, b) => a.guid === b.guid}
                renderOption={(props, o) => (
                  <li {...props} key={o.guid}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                      <GroupsOutlinedIcon fontSize="small" sx={{ color: p.muted }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{o.name}</Typography>
                        {o.parent ? <Typography sx={{ fontSize: 12, color: p.muted }}>{o.parent}</Typography> : null}
                      </Box>
                      <Typography sx={{ fontSize: 12, color: p.muted }}>{o.members.length} موظف</Typography>
                    </Stack>
                  </li>
                )}
                renderInput={(params) => <TextField {...params} label="إرسال إلى وحدة كاملة (اختياري)" helperText="يُضيف جميع أعضاء الوحدة المسموح لك بالإرسال إليهم" InputLabelProps={{ shrink: true }} />}
              />
            ) : null}

            <Autocomplete
              multiple
              disableCloseOnSelect
              options={recipients.users}
              value={selected}
              onChange={(_, v) => setSelected(v)}
              getOptionLabel={(o) => o?.name || ""}
              isOptionEqualToValue={(a, b) => a.guid === b.guid}
              filterOptions={(options, { inputValue }) => {
                const q = inputValue.trim().toLowerCase();
                if (!q) return options;
                return options.filter((o) => [o.name, o.jobTitle, o.branch, o.units].some((v) => String(v || "").toLowerCase().includes(q)));
              }}
              renderOption={(props, o, state) => (
                <li {...props} key={o.guid}>
                  <Checkbox size="small" checked={state.selected} sx={{ mr: 1 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{o.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: p.muted }}>{[o.jobTitle, o.units || o.branch].filter(Boolean).join(" · ")}</Typography>
                  </Box>
                </li>
              )}
              renderTags={(tags, getTagProps) =>
                tags.map((o, i) => <Chip {...getTagProps({ index: i })} key={o.guid} label={o.name} size="small" />)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="المستلمون"
                  required
                  helperText={`ابحث بالاسم أو المسمى الوظيفي أو الوحدة — تم اختيار ${selected.length} من ${recipients.users.length}`}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />

            <Box sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: p.nested }}>
              <FormControlLabel
                sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
                labelPlacement="start"
                control={<Switch checked={requiresReview} onChange={(e) => setRequiresReview(e.target.checked)} />}
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>مراجعة التنفيذ قبل الإغلاق</Typography>
                    <Typography sx={{ fontSize: 12, color: p.muted }}>لا تُغلق المهمة إلا بعد اعتمادك لما سلّمه المستلم</Typography>
                  </Box>
                }
              />
            </Box>
            <FilePicker files={files} setFiles={setFiles} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.6, borderTop: `1px solid ${p.border}` }}>
        <Button onClick={onClose} disabled={sending} color="inherit">إلغاء</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={sending || loading || !recipients.users.length}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ transform: "scaleX(-1)" }} />}
          disableElevation
        >
          {sending ? "جارٍ الإرسال..." : selected.length ? `إرسال إلى ${selected.length}` : "إرسال"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// تعديل مهمة (المرسل)
// =========================================================

const EditTaskDialog = ({ open, onClose, task, assignees, onSaved }) => {
  const p = useTasksPalette();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [dueAt, setDueAt] = useState("");
  const [add, setAdd] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !task) return;
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueAt(toLocalInput(task.dueAt));
    setAdd([]);
    apiGet("/recipients")
      .then((r) => {
        const existing = new Set(assignees.map((a) => a.userGuid));
        setUsers((r.users || []).filter((u) => !existing.has(u.guid)));
      })
      .catch(() => setUsers([]));
  }, [open, task, assignees]);

  const save = async () => {
    if (!title.trim()) return showError(new Error("يرجى إدخال عنوان المهمة"));
    try {
      setSaving(true);
      await apiPost(`/${task.taskGuid}/edit`, {
        title: title.trim(),
        description,
        priority,
        dueAt: dueAt || null,
        clearDue: !dueAt,
        addAssignees: add.map((u) => u.guid)
      });
      toast("تم حفظ التعديلات");
      onSaved();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl", borderRadius: 3, bgcolor: p.card, backgroundImage: "none", ...p.containedSx } }}>
      <DialogHeader icon={<EditOutlinedIcon />} title="تعديل المهمة" onClose={onClose} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <Stack spacing={2}>
          <TextField label="العنوان" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="التفاصيل" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={3} fullWidth InputLabelProps={{ shrink: true }} sx={multilineSx(84, 240)} />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField select label="الأولوية" value={priority} onChange={(e) => setPriority(Number(e.target.value))} InputLabelProps={{ shrink: true }}>
              {Object.entries(PRIORITY).map(([k, pr]) => (
                <MenuItem key={k} value={Number(k)}>{pr.label}</MenuItem>
              ))}
            </TextField>
            <TextField type="datetime-local" label="موعد التسليم" value={dueAt} onChange={(e) => setDueAt(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} />
          </Box>
          <Autocomplete
            multiple
            options={users}
            value={add}
            onChange={(_, v) => setAdd(v)}
            getOptionLabel={(o) => o?.name || ""}
            isOptionEqualToValue={(a, b) => a.guid === b.guid}
            renderInput={(params) => <TextField {...params} label="إضافة مستلمين" InputLabelProps={{ shrink: true }} />}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.6, borderTop: `1px solid ${p.border}` }}>
        <Button onClick={onClose} color="inherit">إلغاء</Button>
        <Button variant="contained" disableElevation onClick={save} disabled={saving}>حفظ</Button>
      </DialogActions>
    </Dialog>
  );
};

// =========================================================
// تفاصيل مهمة
// =========================================================

const ACTIVITY_LABEL = {
  Created: "أنشأ المهمة",
  Edited: "عدّل بيانات المهمة",
  AssigneesAdded: "أضاف مستلمين",
  Status: "غيّر الحالة",
  Progress: "حدّث نسبة الإنجاز",
  Attachment: "أرفق ملفات",
  Cancelled: "ألغى المهمة",
  Overdue: "تجاوزت المهمة موعد التسليم"
};

const activityText = (a) => {
  const base = ACTIVITY_LABEL[a.action] || a.action;
  const to = a.newValue ? STATUS[a.newValue]?.label || a.newValue : "";
  const from = a.oldValue ? STATUS[a.oldValue]?.label || a.oldValue : "";
  if (a.action === "Status") return `${base}${a.assigneeName ? ` (${a.assigneeName})` : ""} من «${from}» إلى «${to}»`;
  if (a.action === "Progress") return `${base} إلى ${a.newValue}`;
  if (a.action === "Overdue") return `${base}${a.assigneeName ? ` لدى ${a.assigneeName}` : ""}`;
  return base;
};

const SectionTitle = ({ children, action }) => {
  const p = useTasksPalette();
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 14, color: p.text }}>{children}</Typography>
      {action}
    </Stack>
  );
};

export const TaskDetails = ({ taskGuid, onChanged, onClose, showOpenPage = false }) => {
  const p = useTasksPalette();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState(0);
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState([]);
  const [commentScope, setCommentScope] = useState("");
  const [progress, setProgress] = useState(0);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError("");
      const json = await apiGet(`/${taskGuid}`);
      setData(json);
      const mine = json.role?.isAssignee ? json.assignees?.[0] : null;
      setProgress(mine?.progress || 0);
    } catch (e) {
      setError(e.message);
    }
  }, [taskGuid]);

  useEffect(() => {
    setData(null);
    setTab(0);
    setComment("");
    setCommentFiles([]);
    setCommentScope("");
    load();
  }, [load]);

  const act = async (action, extra = {}) => {
    try {
      setBusy(true);
      await apiPost(`/${taskGuid}/status`, { action, ...extra });
      await load();
      onChanged?.();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const sendComment = async () => {
    if (!comment.trim() && !commentFiles.length) return;
    try {
      setBusy(true);
      await apiPostForm(`/${taskGuid}/comments`, { body: comment.trim(), assigneeGuid: commentScope || undefined }, commentFiles);
      setComment("");
      setCommentFiles([]);
      await load();
      onChanged?.();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <Box sx={{ p: 2 }}><Alert severity="error">{error}</Alert></Box>;
  if (!data) return <CenterLoader />;

  const { task, assignees, comments, attachments, activity, role } = data;
  const me = getUserGuid().toLowerCase();
  const open = task.status === "Open";
  const mine = role.isAssignee ? assignees.find(Boolean) : null;
  const myOpen = mine && ["New", "InProgress", "Returned"].includes(mine.status);
  const overdue = open && task.dueAt && new Date(task.dueAt) < new Date();
  const taskFiles = attachments.filter((f) => !f.commentId);
  const filesByComment = attachments.reduce((m, f) => {
    if (f.commentId) (m[f.commentId] = m[f.commentId] || []).push(f);
    return m;
  }, {});
  const block = { p: 1.75, borderRadius: 2.5, bgcolor: p.nested, mb: 2 };

  return (
    <Box sx={{ direction: "rtl", display: "flex", flexDirection: "column", height: "100%", bgcolor: p.card, ...p.containedSx }}>
      {/* الرأس */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.75, borderBottom: `1px solid ${p.border}`, bgcolor: p.section }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, color: p.muted }}>
              مهمة رقم {task.taskNo} · أرسلها {task.createdByName} · {formatDateTime(task.createdAt)}
              {task.unitName ? ` · إلى وحدة ${task.unitName}` : ""}
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 18, mt: 0.5, color: p.text, wordBreak: "break-word", lineHeight: 1.5 }}>{task.title}</Typography>
          </Box>
          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
            {role.isCreator && open ? (
              <Tooltip title="تعديل المهمة"><IconButton size="small" onClick={() => setEditOpen(true)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
            ) : null}
            {showOpenPage ? (
              <Tooltip title="فتح في صفحة مستقلة"><IconButton size="small" onClick={() => window.open(`/dashboard/tasks/view/${task.taskGuid}`, "_blank")}><OpenInNewIcon fontSize="small" /></IconButton></Tooltip>
            ) : null}
            {onClose ? <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton> : null}
          </Stack>
        </Stack>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
          <TaskStatusChip status={task.status} doneCount={role.canViewAll ? assignees.filter((a) => a.status === "Done").length : undefined} total={role.canViewAll ? assignees.filter((a) => a.status !== "Cancelled").length : undefined} />
          <PriorityChip priority={task.priority} />
          <DueChip dueAt={task.dueAt} overdue={overdue} finished={!open || (mine && !myOpen && mine.status !== "InReview")} />
          {task.requiresReview ? <SoftChip label="تتطلب مراجعة المرسل" color="#7c3aed" /> : null}
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 2.5, py: 2 }}>
        {task.description ? (
          <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.9, mb: 2, color: p.text, fontSize: 14 }}>{task.description}</Typography>
        ) : null}

        {taskFiles.length ? (
          <Box sx={{ mb: 2 }}>
            <SectionTitle>المرفقات</SectionTitle>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {taskFiles.map((f) => (
                <Chip key={f.guid} variant="outlined" icon={<InsertDriveFileOutlinedIcon />} label={`${f.fileName} (${formatSize(f.sizeBytes)})`}
                  onClick={() => openAttachment(f.guid, f.fileName).catch(showError)} clickable />
              ))}
            </Stack>
          </Box>
        ) : null}

        {/* المستلم: التنفيذ */}
        {mine ? (
          <Box sx={block}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} flexWrap="wrap" useFlexGap>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>حالتي في المهمة</Typography>
                <StatusChip status={mine.status} />
              </Stack>
              {open && myOpen ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {mine.status !== "InProgress" ? (
                    <Button size="small" variant="outlined" startIcon={<PlayArrowIcon sx={{ transform: "scaleX(-1)" }} />} disabled={busy} onClick={() => act("start")}>
                      بدء التنفيذ
                    </Button>
                  ) : null}
                  <Button size="small" variant="contained" disableElevation startIcon={<TaskAltIcon />} disabled={busy}
                    onClick={async () => {
                      const note = await askText(task.requiresReview ? "تسليم المهمة للمراجعة" : "تسليم المهمة", "ملاحظات التسليم (اختياري)", false);
                      if (note !== null) act("submit", { note: note || undefined });
                    }}>
                    {task.requiresReview ? "تسليم للمراجعة" : "تم التنفيذ"}
                  </Button>
                  <Button size="small" color="error" startIcon={<DoNotDisturbIcon />} disabled={busy}
                    onClick={async () => {
                      const note = await askText("الاعتذار عن المهمة", "يرجى كتابة سبب الاعتذار");
                      if (note) act("reject", { note });
                    }}>
                    اعتذار
                  </Button>
                </Stack>
              ) : null}
            </Stack>
            {open && myOpen ? (
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.5 }}>
                <Typography sx={{ fontSize: 13, color: p.muted, whiteSpace: "nowrap" }}>نسبة الإنجاز</Typography>
                <Slider size="small" value={progress} onChange={(_, v) => setProgress(v)} step={5} min={0} max={100} valueLabelDisplay="auto" valueLabelFormat={(v) => `${v}%`} />
                <Button size="small" variant="outlined" disabled={busy || progress === mine.progress} onClick={() => act("progress", { progress })} sx={{ whiteSpace: "nowrap", minWidth: 96 }}>
                  حفظ {progress}%
                </Button>
              </Stack>
            ) : (
              <LinearProgress variant="determinate" value={mine.progress} sx={{ mt: 1.5, height: 6, borderRadius: 9, bgcolor: p.hover }} />
            )}
          </Box>
        ) : null}

        {/* المرسل / المتابع: المستلمون */}
        {role.canViewAll ? (
          <Box sx={{ mb: 2 }}>
            <SectionTitle
              action={role.isCreator && open ? (
                <Button size="small" color="error" disabled={busy} onClick={async () => {
                  const note = await askText("إلغاء المهمة لجميع المستلمين", "سبب الإلغاء (اختياري)", false);
                  if (note !== null) act("cancelTask", { note: note || undefined });
                }}>
                  إلغاء المهمة
                </Button>
              ) : null}
            >
              المستلمون ({assignees.length})
            </SectionTitle>
            <Stack spacing={1}>
              {assignees.map((a) => {
                const tone = p.tone(STATUS[a.status]?.color || "#6b7280");
                return (
                  <Box key={a.userGuid} sx={{ p: 1.5, borderRadius: 2.5, bgcolor: p.nested }}>
                    <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: tone.bg, color: tone.fg, fontSize: 14, fontWeight: 700 }}>{a.name?.[0] || "؟"}</Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{a.name}</Typography>
                          <Typography sx={{ fontSize: 12, color: p.muted }}>
                            {[a.jobTitle, a.seenAt ? `اطّلع عليها ${formatDateTime(a.seenAt)}` : "لم يطّلع عليها بعد", a.completedAt ? `أنجزها ${formatDateTime(a.completedAt)}` : ""].filter(Boolean).join(" · ")}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                        <StatusChip status={a.status} />
                        <Typography sx={{ fontWeight: 600, fontSize: 13, minWidth: 36, textAlign: "center", color: p.muted }}>{a.progress}%</Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress variant="determinate" value={a.progress} sx={{ mt: 1.25, height: 4, borderRadius: 9, bgcolor: p.hover, "& .MuiLinearProgress-bar": { bgcolor: tone.fg } }} />
                    {role.isCreator && open ? (
                      <Stack direction="row" spacing={0.75} sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
                        {a.status === "InReview" ? (
                          <>
                            <Button size="small" variant="contained" disableElevation startIcon={<TaskAltIcon />} disabled={busy} onClick={() => act("approve", { assigneeGuid: a.userGuid })}>اعتماد التنفيذ</Button>
                            <Button size="small" variant="outlined" color="warning" startIcon={<ReplayIcon />} disabled={busy}
                              onClick={async () => {
                                const note = await askText(`إعادة المهمة إلى ${a.name}`, "يرجى كتابة الملاحظات المطلوب معالجتها");
                                if (note) act("return", { assigneeGuid: a.userGuid, note });
                              }}>
                              إعادة بملاحظات
                            </Button>
                          </>
                        ) : null}
                        <Button size="small" onClick={() => { setTab(0); setCommentScope(a.userGuid); }}>مراسلته</Button>
                        {!["Done", "Cancelled", "Rejected"].includes(a.status) ? (
                          <Button size="small" color="error" disabled={busy}
                            onClick={async () => {
                              if (await confirmAction(`إلغاء المهمة عن ${a.name}؟`, "لن تظهر المهمة لديه بعد الآن ضمن المهام قيد العمل.", true)) act("cancelAssignee", { assigneeGuid: a.userGuid });
                            }}>
                            إلغاء عنه
                          </Button>
                        ) : null}
                      </Stack>
                    ) : null}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ) : null}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 40, mb: 1.5, borderBottom: `1px solid ${p.border}`, "& .MuiTab-root": { minHeight: 40, fontWeight: 600 } }}>
          <Tab label={`المحادثة (${comments.length})`} />
          <Tab label={`سجل الإجراءات (${activity.length})`} />
        </Tabs>

        {tab === 0 ? (
          <Stack spacing={1.25}>
            {!comments.length ? (
              <Typography sx={{ color: p.muted, textAlign: "center", py: 3, fontSize: 13 }}>لا توجد تعليقات حتى الآن</Typography>
            ) : (
              comments.map((c) => {
                const isMine = String(c.userGuid || "").toLowerCase() === me;
                return (
                  <Box key={c.id} sx={{
                    alignSelf: isMine ? "flex-start" : "flex-end",
                    maxWidth: "85%",
                    bgcolor: isMine ? p.selected : p.nested,
                    borderRadius: 2.5,
                    borderTopRightRadius: isMine ? 4 : undefined,
                    borderTopLeftRadius: isMine ? undefined : 4,
                    px: 1.5,
                    py: 1
                  }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: p.muted }}>
                      {c.userName}
                      {/* رسالة المستلم بتتحفظ في محادثته هو؛ السهم يظهر بس لما المرسل يكتب لمستلم معيّن */}
                      {role.canViewAll && c.assigneeGuid && String(c.assigneeGuid).toLowerCase() !== String(c.userGuid).toLowerCase()
                        ? ` ← رسالة خاصة إلى ${c.assigneeName}`
                        : !c.assigneeGuid && role.canViewAll && assignees.length > 1 ? " · إلى جميع المستلمين" : ""}
                    </Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap", fontSize: 14, mt: 0.25, color: p.text, lineHeight: 1.7 }}>{c.body}</Typography>
                    {(filesByComment[c.id] || []).map((f) => (
                      <Chip key={f.guid} size="small" variant="outlined" icon={<InsertDriveFileOutlinedIcon />} label={f.fileName} onClick={() => openAttachment(f.guid, f.fileName).catch(showError)} clickable sx={{ mt: 0.75, ml: 0.5 }} />
                    ))}
                    <Typography sx={{ fontSize: 11, color: p.muted, mt: 0.5, textAlign: "left" }}>{formatDateTime(c.createdAt)}</Typography>
                  </Box>
                );
              })
            )}
          </Stack>
        ) : (
          <Box sx={{ position: "relative", pr: 1.5 }}>
            <Box sx={{ position: "absolute", top: 6, bottom: 6, right: 4, width: 2, bgcolor: p.border, borderRadius: 1 }} />
            <Stack spacing={1.5}>
              {activity.map((a, i) => (
                <Box key={i} sx={{ position: "relative", pr: 1.5 }}>
                  <Box sx={{ position: "absolute", right: -14.5, top: 6, width: 9, height: 9, borderRadius: 9, bgcolor: a.action === "Overdue" ? OVERDUE_COLOR : p.primary, border: `2px solid ${p.card}` }} />
                  <Typography sx={{ fontSize: 13.5, color: p.text }}><b style={{ fontWeight: 600 }}>{a.userName}</b> — {activityText(a)}</Typography>
                  <Typography sx={{ fontSize: 12, color: p.muted }}>{formatDateTime(a.at)}{a.notes ? ` · ${a.notes}` : ""}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Box>

      {(role.isCreator || role.isAssignee) && tab === 0 ? (
        <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${p.border}`, bgcolor: p.section }}>
          {role.isCreator && assignees.length > 1 ? (
            <TextField select size="small" value={commentScope} onChange={(e) => setCommentScope(e.target.value)} sx={{ mb: 1, minWidth: 240 }} SelectProps={{ displayEmpty: true }}>
              <MenuItem value="">رسالة إلى جميع المستلمين</MenuItem>
              {assignees.map((a) => (
                <MenuItem key={a.userGuid} value={a.userGuid}>رسالة إلى {a.name} فقط</MenuItem>
              ))}
            </TextField>
          ) : null}
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={role.isAssignee ? "اكتب رسالة إلى المرسل..." : "اكتب تعليقًا..."}
              multiline
              maxRows={5}
              fullWidth
              size="small"
              sx={multilineSx(22, 130)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendComment();
              }}
            />
            <FilePicker files={commentFiles} setFiles={setCommentFiles} compact />
            <Tooltip title="إرسال (Ctrl + Enter)">
              <span>
                <IconButton color="primary" onClick={sendComment} disabled={busy || (!comment.trim() && !commentFiles.length)}
                  sx={{ bgcolor: p.selected, "&:hover": { bgcolor: p.hover } }}>
                  {busy ? <CircularProgress size={20} /> : <SendIcon sx={{ transform: "scaleX(-1)" }} />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <FileChips files={commentFiles} setFiles={setCommentFiles} />
        </Box>
      ) : null}

      <EditTaskDialog open={editOpen} onClose={() => setEditOpen(false)} task={task} assignees={assignees} onSaved={() => { load(); onChanged?.(); }} />
    </Box>
  );
};

export const TaskDetailsDrawer = ({ taskGuid, onClose, onChanged }) => {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const p = useTasksPalette();
  return (
    <Drawer
      anchor="left"
      open={Boolean(taskGuid)}
      onClose={onClose}
      // فوق زرّي الجرس والوضع الليلي العائمين (zIndex 1201) عشان مايغطوش زر الإرسال
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
      // نوافذ SweetAlert (سبب الإلغاء / الاعتذار / ملاحظات الإعادة) بتتفتح برّه اللوحة؛
      // من غير ده اللوحة بتسحب التركيز منها ومحدش يقدر يكتب فيها.
      disableEnforceFocus
      disableRestoreFocus
      PaperProps={{ sx: { width: phone ? "100%" : 620, maxWidth: "100%", bgcolor: p.card, backgroundImage: "none", borderRight: `1px solid ${p.border}`, ...p.containedSx } }}
    >
      {taskGuid ? <TaskDetails taskGuid={taskGuid} onClose={onClose} onChanged={onChanged} showOpenPage /> : null}
    </Drawer>
  );
};
