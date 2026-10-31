// توزيع العملاء على الموظفين (من شاشة بيانات العملاء الموحدة) — api/customer-leads/distribution:
// - بياناته مُدخلة بلا استمارة → كل عميل للموظف اللي دخّل بياناته (زر واحد، من غير اختيار).
// - غير موجود في النظام → بالتساوي بين الموظفين النشطين اللي ليهم مندوب بيع، مع استبعاد وظائف أو موظفين بالاسم،
//   وتحديد النوع (ذكور / إناث) — النوع من ملف الموظف ثم اسمه ثم فرعه (EmployeeGender في الـ API)، وغير المحدد بيتستبعد.
// - معاينة قبل التنفيذ في الحالتين؛ والعميل اللي اتوزّع قبل كده مبيتوزّعش تاني.
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { API_BASE_URL, getUserGuid, readJson, useTasksPalette } from "./tasks/tasksCommon";
import { confirmAction, showError } from "./tasks/TasksUi";

const API = `${API_BASE_URL}/api/customer-leads/distribution`;
const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const GENDERS = {
  male: { label: "ذكور", one: "ذكر", symbol: "♂", color: "#2563eb" },
  female: { label: "إناث", one: "أنثى", symbol: "♀", color: "#db2777" }
};
const GENDER_SOURCE = { profile: "من ملف الموظف", name: "من الاسم", branch: "من الفرع" };

const CATEGORIES = {
  none: {
    title: "غير موجودين في النظام",
    hint: "يُوزَّعون بالتساوي على الموظفين الذين تختارهم، والمهتمون جدًا أولًا.",
    color: "#2563eb",
    Icon: PersonAddAltIcon
  },
  profile: {
    title: "بياناتهم مُدخلة بلا استمارة تسجيل",
    hint: "يذهب كل عميل تلقائيًا إلى الموظف الذي أدخل بياناته، دون أي اختيار.",
    color: "#d97706",
    Icon: PendingActionsIcon
  }
};

const Stat = ({ label, value, accent }) => {
  const p = useTasksPalette();
  return (
    <Box sx={{ flex: "1 1 140px", p: 1.5, borderRadius: 2, border: `1px solid ${p.border}`, borderInlineStart: accent ? `3px solid ${accent}` : undefined }}>
      <Typography sx={{ fontSize: 12, color: p.muted, fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 800, color: p.text, fontVariantNumeric: "tabular-nums" }}>{fmt(value)}</Typography>
    </Box>
  );
};

export default function CustomersDistribution({ open, onClose, filters, filterChips, onDone }) {
  const p = useTasksPalette();
  const userGuid = getUserGuid();
  const [category, setCategory] = useState("none");
  const [step, setStep] = useState("setup"); // setup | preview | done
  const [people, setPeople] = useState(null);
  const [excludedJobs, setExcludedJobs] = useState([]);
  const [excludedUsers, setExcludedUsers] = useState([]);
  const [gender, setGender] = useState("");
  const [search, setSearch] = useState("");
  const [previewSearch, setPreviewSearch] = useState("");
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("setup");
    setPreview(null);
    setResult(null);
    setError("");
    if (people) return;
    fetch(`${API}/employees?${new URLSearchParams({ userGuid })}`, { cache: "no-store" })
      .then(readJson)
      .then(setPeople)
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const employees = useMemo(() => people?.employees || [], [people]);
  const jobs = people?.jobs || [];
  const genderOk = (e) => !gender || e.gender === gender;
  const included = useMemo(
    () => employees.filter((e) => !excludedJobs.includes(e.jobCode) && !excludedUsers.includes(e.userGuid) && genderOk(e)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [employees, excludedJobs, excludedUsers, gender]
  );
  const visibleEmployees = useMemo(() => {
    const q = search.trim();
    return employees
      .filter((e) => !excludedJobs.includes(e.jobCode) && genderOk(e))
      .filter((e) => !q || [e.name, e.jobName, e.branchName].some((v) => String(v || "").includes(q)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, excludedJobs, search, gender]);
  // عدد كل نوع بعد استبعاد الوظائف
  const genderCounts = useMemo(() => {
    const pool = employees.filter((e) => !excludedJobs.includes(e.jobCode));
    return {
      all: pool.length,
      male: pool.filter((e) => e.gender === "male").length,
      female: pool.filter((e) => e.gender === "female").length,
      unknown: pool.filter((e) => !e.gender).length
    };
  }, [employees, excludedJobs]);

  const toggleJob = (code) => setExcludedJobs((x) => (x.includes(code) ? x.filter((c) => c !== code) : [...x, code]));
  const toggleUser = (guid) => setExcludedUsers((x) => (x.includes(guid) ? x.filter((g) => g !== guid) : [...x, guid]));

  const body = () => ({
    userGuid,
    category,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    source: filters.source || null,
    form: filters.form || null,
    diploma: filters.diploma || null,
    interest: filters.interest || null,
    gender: category === "none" ? gender || null : null,
    excludedJobs: category === "none" ? excludedJobs : [],
    excludedUsers: category === "none" ? excludedUsers : []
  });

  const post = async (path) =>
    readJson(await fetch(`${API}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body()) }));

  const runPreview = async () => {
    setBusy(true);
    setError("");
    try {
      setPreview(await post("preview"));
      setPreviewSearch("");
      setStep("preview");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const runDistribution = async () => {
    const s = preview?.summary;
    const ok = await confirmAction(
      "تأكيد التوزيع",
      category === "profile"
        ? `سيُرسَل ${fmt(s?.toAssign)} عميل، كلٌّ إلى الموظف الذي أدخل بياناته (${fmt(s?.recipients)} موظف).`
        : `سيُوزَّع ${fmt(s?.toAssign)} عميل بالتساوي على ${fmt(s?.recipients)} موظف.`
    );
    if (!ok) return;
    setBusy(true);
    try {
      const r = await post("run");
      setResult(r);
      setStep("done");
      onDone?.();
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  };

  const previewRows = useMemo(() => {
    const q = previewSearch.trim();
    return (preview?.byEmployee || []).filter((r) => !q || [r.name, r.jobName, r.branchName].some((v) => String(v || "").includes(q)));
  }, [preview, previewSearch]);

  const cat = CATEGORIES[category];
  const perPerson = category === "none" && preview?.summary?.recipients ? preview.summary.toAssign / preview.summary.recipients : 0;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md" dir="rtl" scroll="paper">
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <GroupsIcon sx={{ color: p.primary }} />
          <span>توزيع العملاء على الموظفين</span>
        </Stack>
        <IconButton onClick={onClose} disabled={busy} sx={{ position: "absolute", left: 12, top: 12 }} aria-label="إغلاق">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        {step === "done" ? (
          <Stack alignItems="center" spacing={1.5} sx={{ py: 5, textAlign: "center" }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: "#059669" }} />
            <Typography sx={{ fontWeight: 800, fontSize: 20, color: p.text }}>{result?.message}</Typography>
            <Typography sx={{ color: p.muted }}>سيجد كل موظف عملاءه في صفحة «طلبات تسجيل خاصة بك».</Typography>
          </Stack>
        ) : step === "preview" ? (
          <Stack spacing={2}>
            <Alert severity="info" icon={<cat.Icon />}>
              <b>{cat.title}</b> — {cat.hint}
            </Alert>
            <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
              <Stat label="العملاء في الفئة" value={preview.summary.candidates} />
              <Stat label="موزّعون مسبقًا (مستبعدون)" value={preview.summary.alreadyAssigned} />
              <Stat label="سيُوزَّعون الآن" value={preview.summary.toAssign} accent={cat.color} />
              <Stat label="عدد المستلمين" value={preview.summary.recipients} accent={cat.color} />
              {preview.summary.orphans ? <Stat label={category === "profile" ? "بلا موظف نشط (لن يُوزَّعوا)" : "بلا مستلم"} value={preview.summary.orphans} /> : null}
            </Stack>
            {perPerson ? (
              <Typography sx={{ fontSize: 13, color: p.muted }}>
                نصيب كل موظف {Math.floor(perPerson) === Math.ceil(perPerson) ? fmt(perPerson) : `${fmt(Math.floor(perPerson))} أو ${fmt(Math.ceil(perPerson))}`} عميل، والزيادة للأقل عملاءً حاليًا.
              </Typography>
            ) : null}

            {preview.byEmployee.length ? (
              <>
                <TextField
                  size="small" placeholder="ابحث عن موظف في المعاينة" value={previewSearch} onChange={(e) => setPreviewSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                />
                <TableContainer sx={{ maxHeight: 340, border: `1px solid ${p.border}`, borderRadius: 2 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>الموظف</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>الوظيفة</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>الفرع</TableCell>
                        <TableCell sx={{ fontWeight: 800 }} align="center">العملاء</TableCell>
                        <TableCell sx={{ fontWeight: 800 }} align="center">منهم مهتم جدًا</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewRows.map((r) => (
                        <TableRow key={r.userGuid} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                          <TableCell>{r.jobName || "—"}</TableCell>
                          <TableCell>{r.branchName || "—"}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800 }}>{fmt(r.count)}</TableCell>
                          <TableCell align="center">{r.hot ? fmt(r.hot) : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="warning">لا يوجد عملاء لتوزيعهم بهذه الفلاتر.</Alert>
            )}
          </Stack>
        ) : (
          <Stack spacing={2.5}>
            {/* العملاء المشمولون = فلاتر الشاشة */}
            <Box>
              <Typography sx={{ fontWeight: 800, color: p.text, mb: 0.75 }}>العملاء المشمولون</Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {filterChips.map((c) => <Chip key={c} size="small" label={c} variant="outlined" sx={{ color: p.text }} />)}
              </Stack>
              <Typography sx={{ fontSize: 12.5, color: p.muted, mt: 0.75 }}>
                تُستخدم فلاتر الشاشة الحالية (الفترة والمصدر والدبلوم والاهتمام). لتغيير العملاء المشمولين أغلق النافذة وعدّل الفلاتر.
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 800, color: p.text, mb: 1 }}>الفئة</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                {Object.entries(CATEGORIES).map(([key, c]) => {
                  const selected = category === key;
                  const t = p.tone(c.color);
                  return (
                    <Box
                      key={key} role="button" tabIndex={0} aria-pressed={selected}
                      onClick={() => setCategory(key)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setCategory(key)}
                      sx={{
                        p: 1.75, borderRadius: 2.5, cursor: "pointer", outline: "none", transition: "all .15s",
                        border: `1.5px solid ${selected ? c.color : p.border}`, bgcolor: selected ? t.bg : "transparent",
                        "&:hover, &:focus-visible": { borderColor: c.color }
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="flex-start">
                        <c.Icon sx={{ color: c.color, mt: 0.25 }} />
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: p.text }}>{c.title}</Typography>
                          <Typography sx={{ fontSize: 12.5, color: p.muted, lineHeight: 1.7 }}>{c.hint}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {category === "none" ? (
              !people ? (
                <Stack alignItems="center" sx={{ py: 3 }}><CircularProgress size={26} /></Stack>
              ) : (
                <>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: p.text, mb: 1 }}>النوع</Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <Chip clickable label={`الكل (${fmt(genderCounts.all)})`} color={!gender ? "primary" : "default"} variant={!gender ? "filled" : "outlined"} onClick={() => setGender("")} />
                      {Object.entries(GENDERS).map(([key, g]) => (
                        <Chip
                          key={key} clickable onClick={() => setGender(key)}
                          label={`${g.symbol} ${g.label} (${fmt(genderCounts[key])})`}
                          variant={gender === key ? "filled" : "outlined"}
                          sx={gender === key ? { bgcolor: g.color, color: "#fff", "&:hover": { bgcolor: g.color } } : { color: p.text }}
                        />
                      ))}
                    </Stack>
                    <Typography sx={{ fontSize: 12.5, color: p.muted, mt: 0.75 }}>
                      النوع من ملف الموظف، وإن لم يوجد فمن الاسم أو الفرع (رجال / نسائي).
                      {gender && genderCounts.unknown ? ` يُستبعد ${fmt(genderCounts.unknown)} موظف لم يمكن تحديد نوعه.` : ""}
                    </Typography>
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                      <Typography sx={{ fontWeight: 800, color: p.text }}>استبعاد وظائف</Typography>
                      <Typography sx={{ fontSize: 12.5, color: p.muted }}>اضغط على الوظيفة لاستبعادها</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {jobs.map((j) => {
                        const out = excludedJobs.includes(j.jobCode);
                        return (
                          <Chip
                            key={j.jobCode} clickable onClick={() => toggleJob(j.jobCode)}
                            label={`${j.jobName} (${fmt(j.count)})`}
                            variant={out ? "outlined" : "filled"}
                            color={out ? "default" : "primary"}
                            sx={out ? { textDecoration: "line-through", color: p.muted } : undefined}
                          />
                        );
                      })}
                    </Stack>
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
                      <Typography sx={{ fontWeight: 800, color: p.text }}>الموظفون</Typography>
                      <Typography sx={{ fontSize: 13, color: p.text, fontWeight: 700 }}>
                        سيستلم {fmt(included.length)} موظف{excludedUsers.length ? ` — مستبعد بالاسم: ${fmt(excludedUsers.length)}` : ""}
                      </Typography>
                    </Stack>
                    <TextField
                      size="small" fullWidth placeholder="ابحث بالاسم أو الوظيفة أو الفرع" value={search} onChange={(e) => setSearch(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                    />
                    <Box sx={{ mt: 1, maxHeight: 280, overflowY: "auto", border: `1px solid ${p.border}`, borderRadius: 2 }}>
                      {visibleEmployees.length === 0 ? (
                        <Typography sx={{ p: 2, color: p.muted, fontSize: 13, textAlign: "center" }}>لا يوجد موظفون مطابقون</Typography>
                      ) : (
                        visibleEmployees.map((e) => {
                          const inside = !excludedUsers.includes(e.userGuid);
                          return (
                            <Stack
                              key={e.userGuid} direction="row" alignItems="center" spacing={1}
                              onClick={() => toggleUser(e.userGuid)}
                              sx={{ px: 1, py: 0.5, cursor: "pointer", borderBottom: `1px solid ${p.border}`, opacity: inside ? 1 : 0.55, "&:hover": { bgcolor: p.hover } }}
                            >
                              <Checkbox size="small" checked={inside} tabIndex={-1} />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: p.text, textDecoration: inside ? "none" : "line-through" }}>{e.name}</Typography>
                                <Typography sx={{ fontSize: 12, color: p.muted }}>{[e.jobName, e.branchName].filter(Boolean).join(" — ")}</Typography>
                              </Box>
                              {e.gender ? (
                                <Tooltip title={`${GENDERS[e.gender].one} — ${GENDER_SOURCE[e.genderSource] || ""}`}>
                                  <Box component="span" sx={{ fontSize: 16, fontWeight: 800, color: GENDERS[e.gender].color, px: 0.5 }}>{GENDERS[e.gender].symbol}</Box>
                                </Tooltip>
                              ) : (
                                <Tooltip title="لم يمكن تحديد النوع"><Box component="span" sx={{ fontSize: 13, color: p.muted, px: 0.5 }}>؟</Box></Tooltip>
                              )}
                              {e.current ? <Chip size="small" label={`لديه ${fmt(e.current)}`} sx={{ height: 22, fontSize: 11.5 }} /> : null}
                            </Stack>
                          );
                        })
                      )}
                    </Box>
                  </Box>
                </>
              )
            ) : null}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.75, gap: 1 }}>
        {step === "done" ? (
          <Button variant="contained" onClick={onClose}>تم</Button>
        ) : step === "preview" ? (
          <>
            <Button startIcon={<ArrowForwardIcon />} onClick={() => setStep("setup")} disabled={busy}>رجوع</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained" onClick={runDistribution} disabled={busy || !preview?.summary?.toAssign}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : category === "profile" ? <PendingActionsIcon /> : <LocalFireDepartmentIcon />}
            >
              {category === "profile" ? "إرسال كل عميل لمن أدخل بياناته" : "تأكيد التوزيع"}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>إلغاء</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained" onClick={runPreview}
              disabled={busy || (category === "none" && (!people || included.length === 0))}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            >
              معاينة التوزيع
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
