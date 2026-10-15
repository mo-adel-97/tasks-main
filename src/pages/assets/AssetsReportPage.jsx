// شاشة "أصول الفروع" (الإدارة): رصيد كل فرع، ومين ضاف إيه وفين، ونقل العهدة — مع التصدير لإكسل.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Grid,
  InputAdornment,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import * as XLSX from "xlsx";
import { CenterLoader, EmptyState, NoAccess, SectionCard, TasksPageShell, showError } from "../tasks/TasksUi";
import { formatDate, formatDateTime, useTasksPalette } from "../tasks/tasksCommon";
import { DISPOSAL_STATUS, ENTRY_STATUS, ENTRY_TYPE, TRANSFER_STATUS, apiGet, money, qtyText, tabFromUrl } from "./assetsCommon";
import {
  AssetThumb,
  BranchSelect,
  AttachmentView,
  DisposalStatusChip,
  EntryDetailsDialog,
  EntryStatusChip,
  EntryTypeChip,
  StatCard,
  FilterSelect,
  TransferStatusChip,
  filterFieldSx
} from "./AssetsUi";

const TABS = ["branches", "holdings", "entries", "transfers", "disposals"];

const AssetsReportPage = () => {
  const p = useTasksPalette();
  const [boot, setBoot] = useState(null);
  const [bootError, setBootError] = useState("");
  const [categories, setCategories] = useState([]);
  const [branchGuid, setBranchGuid] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [entryStatus, setEntryStatus] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(() => tabFromUrl(TABS, "branches"));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    apiGet("/bootstrap")
      .then(setBoot)
      .catch((e) => setBootError(e.status === 403 ? "ليس لديك صلاحية على أصول الفروع" : e.message));
    apiGet("/catalog").then((json) => setCategories(json?.categories || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await apiGet("/report", { branchGuid, categoryId }));
    } catch (e) {
      setData(null);
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [branchGuid, categoryId]);

  useEffect(() => {
    if (boot?.access?.report) load();
  }, [boot, load]);

  const q = search.trim().toLowerCase();
  const has = (...values) => !q || values.join(" ").toLowerCase().includes(q);

  const holdings = useMemo(() => (data?.holdings || []).filter((h) => has(h.itemName, h.model, h.branchName, h.categoryName)), [data, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const entries = useMemo(
    () => (data?.entries || []).filter((e) => (!entryStatus || e.status === entryStatus) && has(e.itemName, e.branchName, e.createdBy, e.reviewedBy, e.supplierName, e.invoiceNo, e.model)),
    [data, q, entryStatus] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const transfers = useMemo(() => (data?.transfers || []).filter((t) => has(t.itemName, t.fromBranchName, t.toBranchName, t.requestedBy, t.reason)), [data, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const disposals = useMemo(() => (data?.disposals || []).filter((d) => has(d.itemName, d.branchName, d.requestedBy, d.reason, d.model)), [data, q]); // eslint-disable-line react-hooks/exhaustive-deps

  // ملخص لكل فرع (من الأرصدة + الطلبات)
  const branchSummary = useMemo(() => {
    const map = new Map();
    const get = (guid, name) => {
      if (!map.has(guid)) map.set(guid, { guid, name, items: 0, pieces: 0, value: 0, pending: 0, rejected: 0, adders: new Set(), lastAt: null });
      return map.get(guid);
    };
    (data?.holdings || []).forEach((h) => {
      const b = get(h.branchGuid, h.branchName);
      b.items += 1;
      b.pieces += h.qty;
      b.value += h.value;
    });
    (data?.entries || []).forEach((e) => {
      const b = get(e.branchGuid, e.branchName);
      if (e.status === "Pending") b.pending += 1;
      if (e.status === "Rejected") b.rejected += 1;
      if (e.createdBy) b.adders.add(e.createdBy);
      const at = e.updatedAt || e.createdAt;
      if (!b.lastAt || at > b.lastAt) b.lastAt = at;
    });
    return [...map.values()].filter((b) => has(b.name, [...b.adders].join(" "))).sort((a, b) => b.value - a.value);
  }, [data, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    const h = data?.holdings || [];
    return {
      branches: new Set(h.map((x) => x.branchGuid)).size,
      pieces: h.reduce((s, x) => s + x.qty, 0),
      value: h.reduce((s, x) => s + x.value, 0),
      pending:
        (data?.entries || []).filter((e) => e.status === "Pending").length +
        (data?.transfers || []).filter((t) => ["Pending", "Received"].includes(t.status)).length +
        (data?.disposals || []).filter((d) => d.status === "Pending").length
    };
  }, [data]);

  if (bootError) return <NoAccess message={bootError} />;
  if (!boot) return <CenterLoader />;
  if (!boot.access.report) return <NoAccess message="ليس لديك صلاحية على أصول الفروع" />;

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const sheet = (rows, name) => {
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ "": "لا توجد بيانات" }]);
      ws["!views"] = [{ RTL: true }];
      XLSX.utils.book_append_sheet(wb, ws, name);
    };
    sheet(
      branchSummary.map((b) => ({
        الفرع: b.name,
        "عدد الأصناف": b.items,
        "إجمالي القطع": b.pieces,
        "قيمة العهدة": Number(b.value.toFixed(2)),
        "طلبات قيد المراجعة": b.pending,
        "طلبات مرفوضة": b.rejected,
        "من أضاف الأصول": [...b.adders].join("، ")
      })),
      "ملخص الفروع"
    );
    sheet(
      holdings.map((h) => ({
        الفرع: h.branchName,
        المجموعة: h.categoryName,
        الصنف: h.itemName,
        الموديل: h.model,
        الوحدة: h.unit,
        الكمية: h.qty,
        القيمة: Number(h.value.toFixed(2))
      })),
      "أرصدة الفروع"
    );
    sheet(
      entries.map((e) => ({
        "رقم الطلب": e.id,
        الفرع: e.branchName,
        الصنف: e.itemName,
        الموديل: e.model,
        النوع: ENTRY_TYPE[e.entryType]?.label || e.entryType,
        الكمية: e.qty,
        "سعر الوحدة": e.unitPrice,
        الإجمالي: e.totalPrice,
        "تاريخ الشراء": e.purchaseDate ? formatDate(e.purchaseDate) : "",
        المورد: e.supplierName,
        "رقم الفاتورة": e.invoiceNo,
        أضافه: e.createdBy,
        "تاريخ الإضافة": formatDateTime(e.createdAt),
        الحالة: ENTRY_STATUS[e.status]?.label || e.status,
        راجعه: e.reviewedBy,
        "تاريخ المراجعة": e.reviewedAt ? formatDateTime(e.reviewedAt) : "",
        "ملاحظة المراجعة": e.reviewNotes,
        ملاحظات: e.notes
      })),
      "طلبات الإضافة"
    );
    sheet(
      transfers.map((t) => ({
        "رقم الطلب": t.id,
        الصنف: t.itemName,
        "من فرع": t.fromBranchName,
        "إلى فرع": t.toBranchName,
        الكمية: t.qty,
        "قيمة القطعة": t.unitValue ?? "",
        السبب: t.reason,
        طلبه: t.requestedBy,
        "تاريخ الطلب": formatDateTime(t.requestedAt),
        "أكد الاستلام": t.receivedBy,
        "تاريخ الاستلام": t.receivedAt ? formatDateTime(t.receivedAt) : "",
        الحالة: TRANSFER_STATUS[t.status]?.label || t.status,
        راجعه: t.reviewedBy,
        "ملاحظة المراجعة": t.reviewNotes
      })),
      "نقل العهدة"
    );
    sheet(
      disposals.map((d) => ({
        "رقم الطلب": d.id,
        الفرع: d.branchName,
        الصنف: d.itemName,
        الموديل: d.model,
        الكمية: d.qty,
        "قيمة القطعة": d.unitValue ?? "",
        "القيمة المخصومة": d.unitValue !== null ? Number((d.unitValue * d.qty).toFixed(2)) : "",
        السبب: d.reason,
        طلبه: d.requestedBy,
        "تاريخ الطلب": formatDateTime(d.requestedAt),
        الحالة: DISPOSAL_STATUS[d.status]?.label || d.status,
        راجعه: d.reviewedBy,
        "ملاحظة المراجعة": d.reviewNotes
      })),
      "التكهين"
    );
    XLSX.writeFile(wb, `أصول الفروع ${formatDate(new Date()).replaceAll("/", "-")}.xlsx`);
  };

  return (
    <TasksPageShell
      icon={<WarehouseIcon />}
      title="أصول الفروع"
      subtitle="عهدة كل فرع، ومن أضاف كل صنف ومتى، وحالة المراجعة ونقل العهدة"
      actions={<Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportExcel} disabled={!data}>تصدير إكسل</Button>}
    >
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}><StatCard label="فروع عليها عهدة" value={qtyText(totals.branches)} color="#2563eb" icon={<StoreOutlinedIcon />} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="إجمالي القطع" value={qtyText(totals.pieces)} color="#057546" icon={<Inventory2OutlinedIcon />} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="إجمالي القيمة" value={money(totals.value)} color="#7c3aed" icon={<PaidOutlinedIcon />} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="قيد المراجعة" value={qtyText(totals.pending)} color="#d97706" icon={<HourglassTopIcon />} /></Grid>
      </Grid>

      <SectionCard sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", lg: "row" }} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between" spacing={1.25} sx={{ px: 1.5, py: 0.75 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ "& .MuiTab-root": { fontWeight: 700 } }}>
            <Tab value="branches" label="ملخص الفروع" />
            <Tab value="holdings" label="الأرصدة" />
            <Tab value="entries" label="سجل الإضافات" />
            <Tab value="transfers" label="سجل النقل" />
            <Tab value="disposals" label="سجل التكهين" />
          </Tabs>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
            <BranchSelect branches={boot.branches} value={branchGuid} onChange={setBranchGuid} allLabel="كل الفروع" />
            <FilterSelect
              label="المجموعة"
              value={categoryId}
              onChange={setCategoryId}
              allLabel="كل المجموعات"
              width={180}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            {tab === "entries" ? (
              <FilterSelect
                label="الحالة"
                value={entryStatus}
                onChange={setEntryStatus}
                allLabel="الكل"
                width={160}
                options={Object.entries(ENTRY_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            ) : null}
            <TextField
              size="small"
              placeholder="بحث (صنف، فرع، موظف...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={filterFieldSx(250)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
          </Stack>
        </Stack>
      </SectionCard>

      {loading && !data ? <CenterLoader /> : null}

      {data && tab === "branches" ? (
        branchSummary.length ? (
          <Grid container spacing={1.5}>
            {branchSummary.map((b) => (
              <Grid item xs={12} sm={6} lg={4} key={b.guid}>
                <SectionCard
                  sx={{ p: 1.75, height: "100%", cursor: "pointer", "&:hover": { borderColor: p.primary } }}
                  onClick={() => {
                    setBranchGuid(b.guid);
                    setTab("holdings");
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 16 }}>{b.name}</Typography>
                  <Stack direction="row" spacing={2.5} sx={{ mt: 1 }}>
                    <Box><Typography sx={{ fontSize: 11.5, color: p.muted }}>أصناف</Typography><Typography sx={{ fontWeight: 800 }}>{qtyText(b.items)}</Typography></Box>
                    <Box><Typography sx={{ fontSize: 11.5, color: p.muted }}>قطع</Typography><Typography sx={{ fontWeight: 800 }}>{qtyText(b.pieces)}</Typography></Box>
                    <Box><Typography sx={{ fontSize: 11.5, color: p.muted }}>القيمة</Typography><Typography sx={{ fontWeight: 800, color: p.primary }}>{money(b.value)}</Typography></Box>
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                    {b.pending ? <Typography sx={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>{b.pending} قيد المراجعة</Typography> : null}
                    {b.rejected ? <Typography sx={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>{b.rejected} مرفوض</Typography> : null}
                  </Stack>
                  {b.adders.size ? (
                    <Typography sx={{ fontSize: 12, color: p.muted, mt: 0.75 }} noWrap title={[...b.adders].join("، ")}>
                      أضاف: {[...b.adders].join("، ")}
                    </Typography>
                  ) : null}
                  {b.lastAt ? <Typography sx={{ fontSize: 11.5, color: p.muted }}>آخر حركة: {formatDateTime(b.lastAt)}</Typography> : null}
                </SectionCard>
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState text="لا توجد أصول مسجلة بعد" />
        )
      ) : null}

      {data && tab === "holdings" ? (
        holdings.length ? (
          <SectionCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>الفرع</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الصنف</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>المجموعة</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الكمية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">القيمة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holdings.map((h) => (
                    <TableRow key={`${h.branchGuid}-${h.itemId}`} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{h.branchName}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <AssetThumb kind="catalog" guid={h.itemGuid} hasImage={h.itemHasImage} size={40} title={h.itemName} />
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{h.itemName}</Typography>
                            {h.model ? <Typography sx={{ fontSize: 12, color: p.muted }}>{h.model}</Typography> : null}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{h.categoryName || "—"}</TableCell>
                      <TableCell align="center">{qtyText(h.qty)} {h.unit}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{money(h.value)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} sx={{ fontWeight: 800 }}>الإجمالي</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>{qtyText(holdings.reduce((s, h) => s + h.qty, 0))}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: p.primary }}>{money(holdings.reduce((s, h) => s + h.value, 0))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text="لا توجد أرصدة" />
        )
      ) : null}

      {data && tab === "entries" ? (
        entries.length ? (
          <SectionCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>الصنف</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الفرع</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>النوع</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الكمية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الإجمالي</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>أضافه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.guid} hover sx={{ cursor: "pointer" }} onClick={() => setDetails(e)}>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <AssetThumb kind="entry-image" guid={e.guid} size={42} title={e.itemName} />
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{e.itemName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{e.branchName}</TableCell>
                      <TableCell><EntryTypeChip type={e.entryType} /></TableCell>
                      <TableCell align="center">{qtyText(e.qty)}</TableCell>
                      <TableCell align="center">{money(e.totalPrice)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{e.createdBy}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(e.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <EntryStatusChip status={e.status} />
                        {e.reviewedBy ? <Typography sx={{ fontSize: 11.5, color: p.muted, mt: 0.5 }}>{e.reviewedBy}</Typography> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text="لا توجد طلبات إضافة" />
        )
      ) : null}

      {data && tab === "transfers" ? (
        transfers.length ? (
          <SectionCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>الصنف</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>من ← إلى</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الكمية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>السبب</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>طلبه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfers.map((t) => (
                    <TableRow key={t.guid} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{t.itemName}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography sx={{ fontSize: 13 }}>{t.fromBranchName}</Typography>
                          <ArrowBackIcon sx={{ fontSize: 16, color: p.muted }} />
                          <Typography sx={{ fontSize: 13 }}>{t.toBranchName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">{qtyText(t.qty)}</TableCell>
                      <TableCell sx={{ maxWidth: 260 }}><Typography sx={{ fontSize: 13 }} noWrap title={t.reason}>{t.reason}</Typography></TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{t.requestedBy}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(t.requestedAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <TransferStatusChip status={t.status} />
                        {t.reviewedBy ? <Typography sx={{ fontSize: 11.5, color: p.muted, mt: 0.5 }}>{t.reviewedBy}</Typography> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text="لا توجد طلبات نقل" />
        )
      ) : null}

      {data && tab === "disposals" ? (
        disposals.length ? (
          <SectionCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>الصنف</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الفرع</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الكمية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">القيمة المخصومة</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>السبب</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>طلبه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disposals.map((d) => (
                    <TableRow key={d.guid} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <AttachmentView kind="disposal-image" guid={d.guid} fileName={d.attachmentName} size={42} title={d.itemName} />
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{d.itemName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{d.branchName}</TableCell>
                      <TableCell align="center">{qtyText(d.qty)}</TableCell>
                      <TableCell align="center">{d.unitValue !== null ? money(d.unitValue * d.qty) : "—"}</TableCell>
                      <TableCell sx={{ maxWidth: 260 }}><Typography sx={{ fontSize: 13 }} noWrap title={d.reason}>{d.reason}</Typography></TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{d.requestedBy}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(d.requestedAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <DisposalStatusChip status={d.status} />
                        {d.reviewedBy ? <Typography sx={{ fontSize: 11.5, color: p.muted, mt: 0.5 }}>{d.reviewedBy}</Typography> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text="لا توجد طلبات تكهين" />
        )
      ) : null}

      <EntryDetailsDialog entry={details} onClose={() => setDetails(null)} />
    </TasksPageShell>
  );
};

export default AssetsReportPage;
