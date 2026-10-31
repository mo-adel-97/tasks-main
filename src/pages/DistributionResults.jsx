// نتائج التوزيع (من شاشة بيانات العملاء الموحدة) — api/customer-leads/distribution/results:
// لكل توزيع ولكل موظف: كام عميل، كام اشتغل عليه (ملاحظات)، كام أُدخلت بياناته بعد التوزيع (لغير الموجودين في النظام)،
// كام سجّل فعليًا (استمارة تاريخها بعد التوزيع)، ومنهم كام على مندوب البيع بتاع نفس الموظف.
import React, { useEffect, useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import InsightsIcon from "@mui/icons-material/Insights";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { API_BASE_URL, getUserGuid, readJson, useTasksPalette } from "./tasks/tasksCommon";
import { showError } from "./tasks/TasksUi";

const API = `${API_BASE_URL}/api/customer-leads/distribution/results`;
const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const pct = (part, total) => (total ? Math.round((1000 * part) / total) / 10 : 0);
const fmtDateTime = (s) => {
  if (!s) return "";
  const [d, t] = String(s).split(" ");
  return `${d.split("-").reverse().join("/")}${t ? ` ${t}` : ""}`;
};
const CATEGORY = { none: "غير موجودين في النظام", profile: "بياناتهم مُدخلة بلا استمارة" };
const GENDER = { male: "ذكور", female: "إناث" };
const INTEREST = { hot: "مهتم جدًا", warm: "مهتم" };

// مراحل النتيجة بنفس ترتيب رحلة العميل
const STAGES = [
  { key: "assigned", label: "وُزّعوا", hint: "عدد العملاء الموزّعين" },
  { key: "workedOn", label: "تمت متابعتهم", hint: "عملاء كتب عنهم الموظف ملاحظة واحدة على الأقل" },
  { key: "newFiles", label: "أُدخلت بياناتهم", hint: "من «غير الموجودين في النظام»: أصبح لهم ملف طالب بعد التوزيع" },
  { key: "registered", label: "سجّلوا فعليًا", hint: "لهم استمارة تسجيل تاريخها من يوم التوزيع أو بعده", strong: true },
  { key: "byAssignee", label: "منهم على يد الموظف نفسه", hint: "التسجيل على مندوب البيع الخاص بالموظف الذي وُزّع عليه العميل" }
];

const Stage = ({ stage, value, base }) => {
  const p = useTasksPalette();
  const green = p.dark ? "#4fae84" : "#057546";
  return (
    <Tooltip title={stage.hint} arrow>
      <Box sx={{ flex: "1 1 150px", p: 1.5, borderRadius: 2.5, border: `1px solid ${stage.strong ? green : p.border}`, bgcolor: stage.strong ? p.tone(green).bg : "transparent" }}>
        <Box sx={{ fontSize: 12.5, color: p.muted, fontWeight: 700 }}>{stage.label}</Box>
        <Stack direction="row" spacing={1} alignItems="baseline">
          <Box sx={{ fontSize: 26, fontWeight: 800, color: p.text, fontVariantNumeric: "tabular-nums" }}>{fmt(value)}</Box>
          {stage.key !== "assigned" ? <Box sx={{ fontSize: 13.5, fontWeight: 700, color: p.muted }}>{pct(value, base)}%</Box> : null}
        </Stack>
        <Box sx={{ mt: 0.75, height: 6, borderRadius: 1, bgcolor: p.dark ? "rgba(255,255,255,.08)" : "#e8efeb", overflow: "hidden" }}>
          <Box sx={{ height: "100%", width: `${stage.key === "assigned" ? 100 : Math.min(100, pct(value, base))}%`, bgcolor: green, borderRadius: 1 }} />
        </Box>
      </Box>
    </Tooltip>
  );
};

const COLUMNS = [
  { key: "name", label: "الموظف", text: true },
  { key: "assigned", label: "العملاء" },
  { key: "workedOn", label: "تمت متابعتهم" },
  { key: "newFiles", label: "أُدخلت بياناتهم" },
  { key: "registered", label: "سجّلوا" },
  { key: "byAssignee", label: "على يده" },
  { key: "rate", label: "نسبة التسجيل" }
];

export default function DistributionResults({ open, onClose }) {
  const p = useTasksPalette();
  const userGuid = getUserGuid();
  const [batchId, setBatchId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "registered", dir: "desc" });

  const load = async (id = batchId) => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ userGuid, ...(id ? { batchId: id } : {}) });
      setData(await readJson(await fetch(`${API}?${q}`, { cache: "no-store" })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load(batchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, batchId]);

  // كل التوزيعات (للاختيار) بتتحفظ من أول تحميل من غير فلتر
  const [allBatches, setAllBatches] = useState([]);
  useEffect(() => {
    if (data && !batchId) setAllBatches(data.batches);
  }, [data, batchId]);

  const totals = useMemo(() => {
    const t = { assigned: 0, workedOn: 0, newFiles: 0, registered: 0, byAssignee: 0, inBasket: 0, noneAssigned: 0 };
    (data?.batches || []).forEach((b) => {
      Object.keys(t).forEach((k) => { if (k !== "noneAssigned") t[k] += b[k] || 0; });
      if (b.category === "none") t.noneAssigned += b.assigned;
    });
    return t;
  }, [data]);

  const rows = useMemo(() => {
    const q = search.trim();
    const list = (data?.employees || [])
      .map((e) => ({ ...e, rate: pct(e.registered, e.assigned) }))
      .filter((e) => !q || [e.name, e.jobName, e.branchName].some((v) => String(v || "").includes(q)));
    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => (sort.key === "name" ? String(a.name).localeCompare(String(b.name), "ar") : (a[sort.key] - b[sort.key])) * dir);
  }, [data, search, sort]);

  const describe = (b) => {
    const f = b.filters || {};
    return [
      f.interest ? INTEREST[f.interest] : "كل مستويات الاهتمام",
      f.gender ? GENDER[f.gender] : null,
      f.FromDate ? `طلبات ${fmtDateTime(String(f.FromDate).slice(0, 10))} – ${fmtDateTime(String(f.ToDate).slice(0, 10))}` : null
    ].filter(Boolean).join(" · ");
  };

  const exportExcel = async () => {
    try {
      const wb = new ExcelJS.Workbook();
      const header = (ws) => {
        ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF057546" } };
      };
      const bs = wb.addWorksheet("التوزيعات", { views: [{ rightToLeft: true }] });
      bs.columns = [
        { header: "رقم التوزيع", key: "id", width: 12 }, { header: "الفئة", key: "category", width: 28 }, { header: "التاريخ", key: "createdAt", width: 18 },
        { header: "بواسطة", key: "createdBy", width: 20 }, { header: "المستلمون", key: "recipients", width: 12 },
        ...STAGES.map((s) => ({ header: s.label, key: s.key, width: 16 })), { header: "في السلة", key: "inBasket", width: 10 }
      ];
      (data?.batches || []).forEach((b) => bs.addRow({ ...b, category: CATEGORY[b.category], createdAt: fmtDateTime(b.createdAt) }));
      header(bs);
      const es = wb.addWorksheet("الموظفون", { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
      es.columns = [
        { header: "الموظف", key: "name", width: 30 }, { header: "الوظيفة", key: "jobName", width: 18 }, { header: "الفرع", key: "branchName", width: 22 },
        ...COLUMNS.filter((c) => !c.text).map((c) => ({ header: c.label, key: c.key, width: 15 })), { header: "عدد الملاحظات", key: "notesCount", width: 14 }, { header: "في السلة", key: "inBasket", width: 10 }
      ];
      rows.forEach((r) => es.addRow({ ...r, rate: `${r.rate}%` }));
      header(es);
      saveAs(new Blob([await wb.xlsx.writeBuffer()]), `نتائج التوزيع ${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (e) {
      showError(e);
    }
  };

  const head = (c) => (
    <TableCell key={c.key} align={c.text ? "right" : "center"} sx={{ fontWeight: 800, whiteSpace: "nowrap" }} sortDirection={sort.key === c.key ? sort.dir : false}>
      <TableSortLabel active={sort.key === c.key} direction={sort.key === c.key ? sort.dir : "desc"}
        onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key && s.dir === "desc" ? "asc" : "desc" }))}>
        {c.label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" dir="rtl" scroll="paper">
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <InsightsIcon sx={{ color: p.primary }} />
          <span>نتائج التوزيع</span>
        </Stack>
        <IconButton onClick={onClose} sx={{ position: "absolute", left: 12, top: 12 }} aria-label="إغلاق"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        {/* اختيار التوزيع */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mb: 2 }}>
          <Chip clickable label="كل التوزيعات" color={!batchId ? "primary" : "default"} variant={!batchId ? "filled" : "outlined"} onClick={() => setBatchId(null)} />
          {allBatches.map((b) => (
            <Tooltip key={b.id} title={`${describe(b)} — بواسطة ${b.createdBy || "—"}`}>
              <Chip clickable color={batchId === b.id ? "primary" : "default"} variant={batchId === b.id ? "filled" : "outlined"} onClick={() => setBatchId(b.id)}
                label={`${CATEGORY[b.category]} — ${fmtDateTime(b.createdAt)} (${fmt(b.assigned)})`} />
            </Tooltip>
          ))}
          <Box sx={{ flex: 1 }} />
          <Button size="small" startIcon={loading ? <CircularProgress size={14} /> : <RefreshIcon />} onClick={() => load()} disabled={loading}>تحديث</Button>
          <Button size="small" startIcon={<FileDownloadIcon />} onClick={exportExcel} disabled={!data}>تصدير Excel</Button>
        </Stack>

        {!data ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack>
        ) : data.batches.length === 0 ? (
          <Alert severity="info">لم يتم أي توزيع بعد.</Alert>
        ) : (
          <Box sx={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>
            <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
              {STAGES.map((s) => (
                <Stage key={s.key} stage={s} value={totals[s.key]} base={s.key === "newFiles" ? totals.noneAssigned : totals.assigned} />
              ))}
            </Stack>
            <Box sx={{ fontSize: 12.5, color: p.muted, mb: 2.5 }}>
              النسب من عدد الموزّعين («أُدخلت بياناتهم» من غير الموجودين في النظام فقط).
              {totals.inBasket ? ` في السلة: ${fmt(totals.inBasket)} عميل.` : ""}
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ fontWeight: 800, color: p.text }}>الموظفون ({fmt(rows.length)})</Box>
              <TextField size="small" placeholder="ابحث بالاسم أو الوظيفة أو الفرع" value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            </Stack>
            <TableContainer sx={{ maxHeight: 460, border: `1px solid ${p.border}`, borderRadius: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>{COLUMNS.map(head)}</TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.userGuid} hover>
                      <TableCell>
                        <Box sx={{ fontWeight: 700, color: p.text }}>{r.name}</Box>
                        <Box sx={{ fontSize: 12, color: p.muted }}>{[r.jobName, r.branchName].filter(Boolean).join(" — ")}</Box>
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{fmt(r.assigned)}</TableCell>
                      <TableCell align="center">{r.workedOn ? fmt(r.workedOn) : "—"}</TableCell>
                      <TableCell align="center">{r.newFiles ? fmt(r.newFiles) : "—"}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: r.registered ? (p.dark ? "#4fae84" : "#057546") : p.muted }}>{r.registered ? fmt(r.registered) : "—"}</TableCell>
                      <TableCell align="center">{r.byAssignee ? fmt(r.byAssignee) : "—"}</TableCell>
                      <TableCell align="center" sx={{ fontVariantNumeric: "tabular-nums" }}>{r.registered ? `${r.rate}%` : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
