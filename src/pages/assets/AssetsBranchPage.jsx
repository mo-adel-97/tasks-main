// شاشة "أصول الفرع": العهدة المعتمدة + طلبات الإضافة + نقل العهدة + التكهين.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  Tooltip,
  Typography
} from "@mui/material";
import ChairIcon from "@mui/icons-material/Chair";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import { CenterLoader, EmptyState, NoAccess, SectionCard, SoftChip, TasksPageShell, confirmAction, showError, toast } from "../tasks/TasksUi";
import { formatDate, formatDateTime, useTasksPalette } from "../tasks/tasksCommon";
import { ENTITY_LABEL, GATES, apiGet, apiPost, money, qtyText, tabFromUrl } from "./assetsCommon";
import {
  AssetThumb,
  BranchSelect,
  AttachmentView,
  DisposalDialog,
  DisposalStatusChip,
  EditRequestDialog,
  EditStatusChip,
  EntryDetailsDialog,
  EntryDialog,
  EntryStatusChip,
  EntryTypeChip,
  FileButton,
  IconAction,
  ReceiveDialog,
  StatCard,
  TransferDialog,
  TransferStatusChip,
  filterFieldSx
} from "./AssetsUi";
import { PurchasesPanel } from "./AssetsPurchasesPage";

const TABS = ["holdings", "entries", "purchases", "transfers", "disposals", "edits"];

// زر في رأس الصفحة: لو العملية مقفولة بيظهر رمادي مع السبب.
const HeaderAction = ({ show, enabled, reason, children }) =>
  show ? (
    <Tooltip title={enabled ? "" : reason}>
      <span>{React.cloneElement(children, { disabled: !enabled })}</span>
    </Tooltip>
  ) : null;

const AssetsBranchPage = () => {
  const p = useTasksPalette();
  const [boot, setBoot] = useState(null);
  const [bootError, setBootError] = useState("");
  const [branchGuid, setBranchGuid] = useState("");
  const [data, setData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(() => tabFromUrl(TABS, "holdings"));
  const [search, setSearch] = useState("");
  const [entryDialog, setEntryDialog] = useState({ open: false, entry: null });
  const [details, setDetails] = useState(null);
  const [transfer, setTransfer] = useState({ open: false, itemId: null });
  const [disposal, setDisposal] = useState({ open: false, itemId: null });
  const [receiveFor, setReceiveFor] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [purchaseCount, setPurchaseCount] = useState(null);

  useEffect(() => {
    apiGet("/bootstrap")
      .then((json) => {
        setBoot(json);
        setBranchGuid(json?.userBranchGuid || json?.branches?.[0]?.guid || "");
      })
      .catch((e) => setBootError(e.status === 403 ? "ليس لديك صلاحية على أصول الفرع" : e.message));
    apiGet("/catalog").then((json) => setItems(json?.items || [])).catch(() => setItems([]));
  }, []);

  const load = useCallback(async () => {
    if (!branchGuid) return;
    try {
      setLoading(true);
      setData(await apiGet("/branch", { branchGuid }));
    } catch (e) {
      setData(null);
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [branchGuid]);

  useEffect(() => {
    load();
  }, [load]);

  const branches = boot?.branches || [];
  const branchName = branches.find((b) => b.guid === branchGuid)?.name || "";
  const q = search.trim().toLowerCase();
  const match = (...values) => !q || values.join(" ").toLowerCase().includes(q);

  const holdings = useMemo(() => (data?.holdings || []).filter((h) => match(h.itemName, h.model, h.categoryName)), [data, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const entries = useMemo(() => (data?.entries || []).filter((e) => match(e.itemName, e.model, e.createdBy, e.supplierName, e.invoiceNo)), [data, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const transfers = useMemo(() => (data?.transfers || []).filter((t) => match(t.itemName, t.fromBranchName, t.toBranchName, t.requestedBy)), [data, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const disposals = useMemo(() => (data?.disposals || []).filter((d) => match(d.itemName, d.model, d.requestedBy, d.reason)), [data, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const editRequests = useMemo(() => (data?.editRequests || []).filter((r) => match(r.itemName, r.notes, r.requestedBy, r.handleNotes)), [data, q]); // eslint-disable-line react-hooks/exhaustive-deps
  // العمليات اللي عليها طلب تعديل لسه عند المراجع.
  const pendingEdit = useMemo(
    () => new Set((data?.editRequests || []).filter((r) => r.status === "Pending").map((r) => String(r.entityGuid))),
    [data]
  );

  const stats = useMemo(() => {
    const h = data?.holdings || [];
    return {
      items: h.length,
      pieces: h.reduce((s, x) => s + x.qty, 0),
      value: h.reduce((s, x) => s + x.value, 0),
      pending:
        (data?.entries || []).filter((e) => e.status === "Pending").length +
        (data?.transfers || []).filter((t) => ["Pending", "Received"].includes(t.status)).length +
        (data?.disposals || []).filter((d) => d.status === "Pending").length +
        (data?.editRequests || []).filter((r) => r.status === "Pending").length,
      toReceive: (data?.transfers || []).filter((t) => t.status === "Pending" && t.toBranchGuid === branchGuid).length
    };
  }, [data, branchGuid]);

  if (bootError) return <NoAccess message={bootError} />;
  if (!boot) return <CenterLoader />;
  if (!boot.access.branch && !boot.access.report) return <NoAccess message="ليس لديك صلاحية على أصول الفرع" />;

  const runAction = async (question, detail, path, done) => {
    if (!(await confirmAction(question, detail, true))) return;
    try {
      const json = await apiPost(path);
      toast(json?.message || done);
      setDetails(null);
      load();
    } catch (e) {
      showError(e);
    }
  };

  const removeEntry = (e) => runAction("حذف الطلب؟", `${e.itemName} × ${e.qty}`, `/entries/${e.guid}/delete`, "تم حذف الطلب");
  const cancelTransfer = (t) => runAction("إلغاء طلب النقل؟", `${t.itemName} × ${t.qty} إلى ${t.toBranchName}`, `/transfers/${t.guid}/cancel`, "تم إلغاء طلب النقل");
  const cancelDisposal = (d) => runAction("إلغاء طلب التكهين؟", `${d.itemName} × ${d.qty}`, `/disposals/${d.guid}/cancel`, "تم إلغاء طلب التكهين");

  const windows = data?.windows;
  // الشراء بقى من شاشة طلبات الشراء؛ هنا إضافة الموجود بالفعل بس.
  const canAddAny = Boolean(data?.canAddExisting);
  const hasAvailable = (data?.holdings || []).some((h) => h.qty - h.pendingOut > 0);
  const canEditEntry = (e) => data?.canAct && !["Approved", "Deleted"].includes(e.status);

  // زر "طلب تعديل" على العمليات المعتمدة، أو شارة لو فيه طلب لسه عند المراجع.
  const editRequestAction = (entityType, item) => {
    if (!data?.canAct || item.status !== "Approved") return null;
    if (pendingEdit.has(String(item.guid))) return <EditStatusChip status="Pending" />;
    return (
      <IconAction
        title="طلب تعديل"
        onClick={() => setEditTarget({ entityType, guid: item.guid, title: `${ENTITY_LABEL[entityType]}: ${item.itemName} × ${item.qty}` })}
      >
        <EditNoteOutlinedIcon fontSize="small" />
      </IconAction>
    );
  };
  const closedReason = "مغلقة حاليًا من الإدارة";
  const noStockReason = "لا توجد أصناف معتمدة متاحة في عهدة الفرع";

  return (
    <TasksPageShell
      icon={<ChairIcon />}
      title="أصول الفرع"
      subtitle={branchName ? `عهدة ${branchName}` : "عهدة الفرع"}
      actions={
        <>
          {data?.canChooseBranch ? <BranchSelect branches={branches} value={branchGuid} onChange={setBranchGuid} /> : null}
          <HeaderAction show={data?.canAct} enabled={data?.canDispose && hasAvailable} reason={!data?.canDispose ? `طلبات التكهين ${closedReason}` : noStockReason}>
            <Button variant="outlined" color="error" startIcon={<DeleteSweepOutlinedIcon />} onClick={() => setDisposal({ open: true, itemId: null })}>
              طلب تكهين
            </Button>
          </HeaderAction>
          <HeaderAction show={data?.canAct} enabled={data?.canTransfer && hasAvailable} reason={!data?.canTransfer ? `طلبات نقل العهدة ${closedReason}` : noStockReason}>
            <Button variant="outlined" startIcon={<SwapHorizIcon />} onClick={() => setTransfer({ open: true, itemId: null })}>
              طلب نقل عهدة
            </Button>
          </HeaderAction>
          <HeaderAction show={data?.canAct} enabled={canAddAny} reason={`إضافة الأصناف ${closedReason}`}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEntryDialog({ open: true, entry: null })}>
              إضافة صنف
            </Button>
          </HeaderAction>
        </>
      }
    >
      {windows ? (
        <SectionCard sx={{ p: 1.5, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "flex-start", md: "center" }} flexWrap="wrap" useFlexGap>
            <Typography sx={{ fontWeight: 700, fontSize: 13.5, ml: 1 }}>حالة العمليات للفرع:</Typography>
            {GATES.map((g) => {
              const gate = windows[g.key];
              return (
                <SoftChip
                  key={g.key}
                  icon={gate.open ? <LockOpenOutlinedIcon /> : <LockOutlinedIcon />}
                  color={gate.open ? "#059669" : "#dc2626"}
                  label={`${g.label}: ${gate.open ? `مفتوحة${gate.until ? ` حتى ${formatDate(gate.until)}` : ""}` : "مغلقة"}`}
                />
              );
            })}
          </Stack>
          {data?.adminOverride ? (
            <Typography sx={{ fontSize: 12, color: p.muted, mt: 1 }}>تستطيع تنفيذ أي عملية حتى لو كانت مغلقة لأنك تملك صلاحية الإدارة على أصناف الأصول.</Typography>
          ) : null}
        </SectionCard>
      ) : null}

      {stats.toReceive ? (
        <Alert
          severity="info"
          icon={<CallReceivedIcon />}
          sx={{ mb: 2, fontWeight: 600 }}
          action={<Button color="inherit" size="small" onClick={() => setTab("transfers")}>عرض</Button>}
        >
          يوجد {stats.toReceive} عهدة واردة إلى الفرع بانتظار تأكيد الاستلام — يُرجى التأكيد بعد استلامها فعليًا.
        </Alert>
      ) : null}

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}><StatCard label="عدد الأصناف" value={qtyText(stats.items)} color="#2563eb" icon={<CategoryOutlinedIcon />} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="إجمالي القطع" value={qtyText(stats.pieces)} color="#057546" icon={<Inventory2OutlinedIcon />} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="قيمة العهدة" value={money(stats.value)} color="#7c3aed" icon={<PaidOutlinedIcon />} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="قيد المراجعة" value={qtyText(stats.pending)} color="#d97706" icon={<HourglassTopIcon />} /></Grid>
      </Grid>

      <SectionCard sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" spacing={1} sx={{ px: 1.5, py: 0.75 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ "& .MuiTab-root": { fontWeight: 700 } }}>
            <Tab value="holdings" label={`العهدة المعتمدة (${data?.holdings?.length || 0})`} />
            <Tab value="entries" label={`طلبات الإضافة (${data?.entries?.length || 0})`} />
            {boot.access.purchase ? <Tab value="purchases" label={`طلبات الشراء${purchaseCount ? ` (${purchaseCount.total})` : ""}`} /> : null}
            <Tab value="transfers" label={`نقل العهدة (${data?.transfers?.length || 0})`} />
            <Tab value="disposals" label={`التكهين (${data?.disposals?.length || 0})`} />
            <Tab value="edits" label={`طلبات التعديل (${data?.editRequests?.length || 0})`} />
          </Tabs>
          <TextField
            size="small"
            placeholder="بحث"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={filterFieldSx(260)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
        </Stack>
      </SectionCard>

      {loading && !data ? <CenterLoader /> : null}

      {data && tab === "holdings" ? (
        holdings.length ? (
          <Grid container spacing={1.5}>
            {holdings.map((h) => {
              const free = h.qty - h.pendingOut;
              return (
                <Grid item xs={12} sm={6} lg={4} key={h.itemId}>
                  <SectionCard sx={{ p: 1.5, height: "100%", display: "flex", gap: 1.5 }}>
                    <AssetThumb kind="catalog" guid={h.itemGuid} hasImage={h.itemHasImage} size={84} title={h.itemName} />
                    <Box sx={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                      <Typography sx={{ fontWeight: 700 }} noWrap title={h.itemName}>{h.itemName}</Typography>
                      <Typography sx={{ fontSize: 12.5, color: p.muted }} noWrap>
                        {[h.model && `موديل ${h.model}`, h.categoryName].filter(Boolean).join(" · ") || " "}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 0.75 }}>
                        <Box>
                          <Typography sx={{ fontSize: 11.5, color: p.muted }}>الكمية</Typography>
                          <Typography sx={{ fontWeight: 800 }}>{qtyText(h.qty)} <span style={{ fontSize: 12, fontWeight: 500 }}>{h.unit}</span></Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 11.5, color: p.muted }}>القيمة</Typography>
                          <Typography sx={{ fontWeight: 800 }}>{money(h.value)}</Typography>
                        </Box>
                      </Stack>
                      {h.pendingOut ? <Typography sx={{ fontSize: 12, color: "#d97706", mt: 0.5 }}>{qtyText(h.pendingOut)} محجوزة في طلبات لم تُنفّذ بعد</Typography> : null}
                      {data.canTransfer || data.canDispose ? (
                        <Stack direction="row" spacing={1} sx={{ mt: "auto", pt: 1 }} flexWrap="wrap" useFlexGap>
                          {data.canTransfer ? (
                            <Button size="small" variant="outlined" startIcon={<SwapHorizIcon />} disabled={free <= 0} onClick={() => setTransfer({ open: true, itemId: h.itemId })}>
                              نقل
                            </Button>
                          ) : null}
                          {data.canDispose ? (
                            <Button size="small" variant="outlined" color="error" startIcon={<DeleteSweepOutlinedIcon />} disabled={free <= 0} onClick={() => setDisposal({ open: true, itemId: h.itemId })}>
                              تكهين
                            </Button>
                          ) : null}
                        </Stack>
                      ) : null}
                    </Box>
                  </SectionCard>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <EmptyState text="لا توجد أصول معتمدة على الفرع بعد" hint={canAddAny ? "اضغط \"إضافة صنف\" وارفع الأصناف الموجودة لديك، وستظهر هنا بعد موافقة الحسابات" : undefined} />
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
                    <TableCell sx={{ fontWeight: 700 }}>النوع</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الكمية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الإجمالي</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>أضافه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.guid} hover sx={{ cursor: "pointer" }} onClick={() => setDetails(e)}>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <AssetThumb kind="entry-image" guid={e.guid} size={44} title={e.itemName} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{e.itemName}</Typography>
                            <Typography sx={{ fontSize: 12, color: p.muted }}>{e.model || e.categoryName}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell><EntryTypeChip type={e.entryType} /></TableCell>
                      <TableCell align="center">{qtyText(e.qty)}</TableCell>
                      <TableCell align="center">{money(e.totalPrice)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{e.createdBy}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(e.updatedAt || e.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <EntryStatusChip status={e.status} />
                        {["Rejected", "Returned"].includes(e.status) && e.reviewNotes ? (
                          <Typography sx={{ fontSize: 11.5, color: e.status === "Rejected" ? "#dc2626" : "#ea580c", mt: 0.5, maxWidth: 220 }} noWrap title={e.reviewNotes}>{e.reviewNotes}</Typography>
                        ) : null}
                      </TableCell>
                      <TableCell align="center" onClick={(ev) => ev.stopPropagation()}>
                        {editRequestAction("Entry", e)}
                        {canEditEntry(e) ? (
                          <Stack direction="row" justifyContent="center">
                            <IconAction title={e.status === "Pending" ? "تعديل" : "تعديل وإعادة الإرسال"} onClick={() => setEntryDialog({ open: true, entry: e })}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconAction>
                            <IconAction title="حذف" color="error" onClick={() => removeEntry(e)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconAction>
                          </Stack>
                        ) : null}
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
                    <TableCell sx={{ fontWeight: 700 }}>الاتجاه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الكمية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>السبب</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>طلبه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfers.map((t) => {
                    const outgoing = t.fromBranchGuid === branchGuid;
                    return (
                      <TableRow key={t.guid} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <AssetThumb kind="catalog" guid={t.itemGuid} hasImage={t.itemHasImage} size={40} title={t.itemName} />
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{t.itemName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: outgoing ? "#ea580c" : "#059669" }}>
                            {outgoing ? <CallMadeIcon fontSize="small" /> : <CallReceivedIcon fontSize="small" />}
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{outgoing ? `إلى ${t.toBranchName}` : `من ${t.fromBranchName}`}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">{qtyText(t.qty)}</TableCell>
                        <TableCell sx={{ maxWidth: 240 }}>
                          <Typography sx={{ fontSize: 13 }} noWrap title={t.reason}>{t.reason}</Typography>
                          {t.receivedBy ? (
                            <Typography sx={{ fontSize: 11.5, color: "#059669" }} noWrap title={t.receiveNotes}>
                              استلمها {t.receivedBy} — {formatDateTime(t.receivedAt)}
                            </Typography>
                          ) : null}
                          {t.hasReceipt ? <FileButton kind="transfer-receipt" guid={t.guid} label={`محضر الاستلام: ${t.receiptFileName || "فتح"}`} /> : null}
                          {t.status === "Rejected" && t.reviewNotes ? <Typography sx={{ fontSize: 11.5, color: "#dc2626" }} noWrap title={t.reviewNotes}>سبب الرفض: {t.reviewNotes}</Typography> : null}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{t.requestedBy}</Typography>
                          <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(t.requestedAt)}</Typography>
                        </TableCell>
                        <TableCell><TransferStatusChip status={t.status} /></TableCell>
                        <TableCell align="center">
                          {outgoing && t.status === "Pending" && data.canAct ? (
                            <Button size="small" color="error" onClick={() => cancelTransfer(t)}>إلغاء</Button>
                          ) : null}
                          {!outgoing && t.status === "Pending" && data.canAct ? (
                            <Button size="small" variant="contained" startIcon={<TaskAltIcon />} onClick={() => setReceiveFor(t)}>
                              تأكيد الاستلام
                            </Button>
                          ) : null}
                          {editRequestAction("Transfer", t)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text="لا توجد طلبات نقل" hint={data.canTransfer ? "لطلب نقل عهدة اضغط زر \"طلب نقل عهدة\" أعلى الصفحة" : undefined} />
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
                    <TableCell sx={{ fontWeight: 700 }} align="center">الكمية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>السبب</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>طلبه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disposals.map((d) => (
                    <TableRow key={d.guid} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <AttachmentView kind="disposal-image" guid={d.guid} fileName={d.attachmentName} size={44} title={d.itemName} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{d.itemName}</Typography>
                            <Typography sx={{ fontSize: 12, color: p.muted }}>{d.model || d.categoryName}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">{qtyText(d.qty)}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{d.reason}</Typography>
                        {d.status === "Rejected" && d.reviewNotes ? <Typography sx={{ fontSize: 11.5, color: "#dc2626" }}>سبب الرفض: {d.reviewNotes}</Typography> : null}
                        {d.status === "Approved" && d.unitValue !== null ? (
                          <Typography sx={{ fontSize: 11.5, color: p.muted }}>القيمة المخصومة: {money(d.unitValue * d.qty)}</Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{d.requestedBy}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(d.requestedAt)}</Typography>
                      </TableCell>
                      <TableCell><DisposalStatusChip status={d.status} /></TableCell>
                      <TableCell align="center">
                        {d.status === "Pending" && data.canAct ? (
                          <Button size="small" color="error" onClick={() => cancelDisposal(d)}>إلغاء</Button>
                        ) : null}
                        {editRequestAction("Disposal", d)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text="لا توجد طلبات تكهين" hint={data.canDispose ? "لطلب تكهين صنف تالف اضغط زر \"طلب تكهين\" أعلى الصفحة" : undefined} />
        )
      ) : null}

      {tab === "purchases" && boot.access.purchase && branchGuid ? (
        <PurchasesPanel branchGuid={branchGuid} search={search} items={items} branches={branches} onCount={setPurchaseCount} />
      ) : null}

      {data && tab === "edits" ? (
        editRequests.length ? (
          <SectionCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>العملية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>التعديل المطلوب</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>طلبه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>رد المراجع</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editRequests.map((r) => (
                    <TableRow key={r.guid} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <AssetThumb kind="catalog" guid={r.itemGuid} hasImage={r.itemHasImage} size={40} title={r.itemName} />
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{r.itemName}</Typography>
                            <Typography sx={{ fontSize: 12, color: p.muted }}>{ENTITY_LABEL[r.entityType]} × {qtyText(r.qty)}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}><Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{r.notes}</Typography></TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{r.requestedBy}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(r.requestedAt)}</Typography>
                      </TableCell>
                      <TableCell><EditStatusChip status={r.status} /></TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        {r.handledBy ? (
                          <>
                            <Typography sx={{ fontSize: 13 }}>{r.handleNotes || "—"}</Typography>
                            <Typography sx={{ fontSize: 11.5, color: p.muted }}>{r.handledBy} — {formatDateTime(r.handledAt)}</Typography>
                          </>
                        ) : (
                          <Typography sx={{ fontSize: 12.5, color: p.muted }}>بانتظار المراجع</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text="لا توجد طلبات تعديل" hint={data.canAct ? "لو أخطأت في عملية معتمدة، اضغط أيقونة \"طلب تعديل\" بجوارها واكتب المطلوب" : undefined} />
        )
      ) : null}

      <EditRequestDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setTab("edits");
          load();
        }}
      />

      <EntryDialog
        open={entryDialog.open}
        entry={entryDialog.entry}
        onClose={() => setEntryDialog({ open: false, entry: null })}
        onSaved={() => {
          setTab("entries");
          setDetails(null);
          load();
        }}
        branchGuid={branchGuid}
        branchName={branchName}
        items={items}
        allowExisting={Boolean(data?.canAddExisting)}
        allowPurchase={false}
      />

      <EntryDetailsDialog
        entry={details}
        onClose={() => setDetails(null)}
        actions={
          details && canEditEntry(details) ? (
            <>
              <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => removeEntry(details)}>حذف</Button>
              <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => setEntryDialog({ open: true, entry: details })}>
                {details.status === "Pending" ? "تعديل" : "تعديل وإعادة الإرسال"}
              </Button>
            </>
          ) : details && data?.canAct && details.status === "Approved" && !pendingEdit.has(String(details.guid)) ? (
            <Button
              variant="outlined"
              startIcon={<EditNoteOutlinedIcon />}
              onClick={() => {
                setEditTarget({ entityType: "Entry", guid: details.guid, title: `إضافة: ${details.itemName} × ${details.qty}` });
                setDetails(null);
              }}
            >
              طلب تعديل
            </Button>
          ) : null
        }
      />

      <ReceiveDialog
        transfer={receiveFor}
        onClose={() => setReceiveFor(null)}
        onSaved={() => {
          setTab("transfers");
          load();
        }}
      />

      <TransferDialog
        open={transfer.open}
        holdings={data?.holdings || []}
        initialItemId={transfer.itemId}
        fromBranchGuid={branchGuid}
        branches={branches}
        onClose={() => setTransfer({ open: false, itemId: null })}
        onSaved={() => {
          setTab("transfers");
          load();
        }}
      />

      <DisposalDialog
        open={disposal.open}
        holdings={data?.holdings || []}
        initialItemId={disposal.itemId}
        branchGuid={branchGuid}
        onClose={() => setDisposal({ open: false, itemId: null })}
        onSaved={() => {
          setTab("disposals");
          load();
        }}
      />
    </TasksPageShell>
  );
};

export default AssetsBranchPage;
