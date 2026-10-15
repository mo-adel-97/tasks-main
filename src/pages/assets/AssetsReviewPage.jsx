// شاشة "مراجعة الأصول": الحسابات بتوافق أو ترفض طلبات الإضافة ونقل العهدة والتكهين.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
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
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UndoIcon from "@mui/icons-material/Undo";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { CenterLoader, EmptyState, NoAccess, SectionCard, TasksPageShell, showError, toast } from "../tasks/TasksUi";
import { formatDateTime, useTasksPalette } from "../tasks/tasksCommon";
import { ENTITY_LABEL, apiGet, apiPost, money, qtyText, tabFromUrl } from "./assetsCommon";
import {
  AssetThumb,
  BranchSelect,
  AttachmentView,
  DecisionDialog,
  DisposalStatusChip,
  EditStatusChip,
  EntryDialog,
  FileButton,
  FilterSelect,
  ReasonDialog,
  EntryDetailsDialog,
  EntryStatusChip,
  EntryTypeChip,
  IconAction,
  TransferStatusChip,
  filterFieldSx
} from "./AssetsUi";
import { PurchasesPanel } from "./AssetsPurchasesPage";

const TABS = ["entries", "purchases", "transfers", "disposals", "edits"];
// فلتر الحالة في المراجعة ← حالة طلب الشراء
const PURCHASE_FILTER = { Pending: "Pending", Approved: "Approved", Rejected: "Rejected", Cancelled: "Cancelled", All: "" };
const KIND_PATH = { entry: "entries", transfer: "transfers", disposal: "disposals" };
const KIND_LABEL = { entry: "إضافة", transfer: "نقل", disposal: "تكهين" };

const AssetsReviewPage = () => {
  const p = useTasksPalette();
  const [boot, setBoot] = useState(null);
  const [bootError, setBootError] = useState("");
  const [tab, setTab] = useState(() => tabFromUrl(TABS, "entries"));
  const [status, setStatus] = useState("Pending");
  const [branchGuid, setBranchGuid] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  // { kind: "entry" | "transfer", item, approve }
  const [decision, setDecision] = useState(null);
  // إجراءات الإدارة اللي محتاجة سبب (فتح للفرع / حذف / إلغاء / معالجة طلب تعديل)
  const [reason, setReason] = useState(null);
  // إضافة معتمدة بيعدّلها المراجع بنفسه
  const [adminEntry, setAdminEntry] = useState(null);
  const [items, setItems] = useState([]);
  const [purchaseCount, setPurchaseCount] = useState(null);

  useEffect(() => {
    apiGet("/bootstrap")
      .then(setBoot)
      .catch((e) => setBootError(e.status === 403 ? "ليس لديك صلاحية على مراجعة الأصول" : e.message));
    apiGet("/catalog").then((json) => setItems(json?.items || [])).catch(() => setItems([]));
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setData(await apiGet("/review", { status, branchGuid }));
    } catch (e) {
      setData(null);
      showError(e);
    } finally {
      setLoading(false);
    }
  }, [status, branchGuid]);

  useEffect(() => {
    if (boot?.access?.review) load();
  }, [boot, load]);

  // المعتمِد اللي معاه "طلبات الشراء" بس (من غير مراجعة الأصول) يفتح على تبويب الشراء.
  useEffect(() => {
    if (boot && !boot.access.review && boot.access.purchaseEdit) setTab("purchases");
  }, [boot]);

  const q = search.trim().toLowerCase();
  const entries = useMemo(
    () => (data?.entries || []).filter((e) => !q || [e.itemName, e.branchName, e.createdBy, e.model, e.supplierName, e.invoiceNo].join(" ").toLowerCase().includes(q)),
    [data, q]
  );
  const transfers = useMemo(
    () => (data?.transfers || []).filter((t) => !q || [t.itemName, t.fromBranchName, t.toBranchName, t.requestedBy, t.reason].join(" ").toLowerCase().includes(q)),
    [data, q]
  );
  const disposals = useMemo(
    () => (data?.disposals || []).filter((d) => !q || [d.itemName, d.branchName, d.requestedBy, d.reason, d.model].join(" ").toLowerCase().includes(q)),
    [data, q]
  );
  const editRequests = useMemo(
    () => (data?.editRequests || []).filter((r) => !q || [r.itemName, r.branchName, r.requestedBy, r.notes].join(" ").toLowerCase().includes(q)),
    [data, q]
  );

  if (bootError) return <NoAccess message={bootError} />;
  if (!boot) return <CenterLoader />;
  if (!boot.access.review && !boot.access.purchaseEdit) return <NoAccess message="ليس لديك صلاحية على مراجعة الأصول" />;
  const showPurchases = boot.access.purchaseEdit || boot.access.purchase;

  const canDecide = Boolean(data?.canDecide);
  const canDelete = Boolean(data?.canDelete);

  const done = (json) => {
    toast(json?.message || "تم");
    setDetails(null);
    load();
  };

  const unlockEntry = (entry, initial = "") =>
    setReason({
      title: `فتح للفرع للتعديل: ${entry.itemName} × ${entry.qty}`,
      label: "المطلوب تعديله",
      placeholder: "اكتب للفرع ما الذي يجب تعديله",
      hint: "ستخرج الإضافة من عهدة الفرع مؤقتًا حتى يعدّلها الفرع وتعتمدها مرة أخرى.",
      confirmLabel: "فتح للفرع",
      initial,
      run: async (notes) => done(await apiPost(`/entries/${entry.guid}/unlock`, { notes }))
    });

  const deleteEntry = (entry) =>
    setReason({
      title: `حذف إضافة معتمدة: ${entry.itemName} × ${entry.qty}`,
      label: "سبب الحذف",
      hint: "ستُخصم الكمية من عهدة الفرع، ويبقى الطلب في السجل بحالة \"محذوف\".",
      confirmLabel: "حذف",
      color: "error",
      run: async (notes) => done(await apiPost(`/entries/${entry.guid}/admin-delete`, { notes }))
    });

  const cancelApproved = (kind, item) =>
    setReason({
      title: `إلغاء ${kind === "transfers" ? "نقل" : "تكهين"} معتمد: ${item.itemName} × ${item.qty}`,
      label: "سبب الإلغاء",
      hint: kind === "transfers" ? "ستعود الكمية من الفرع المستلم إلى الفرع المرسل." : "ستعود الكمية إلى عهدة الفرع.",
      confirmLabel: "إلغاء العملية",
      color: "error",
      run: async (notes) => done(await apiPost(`/${kind}/${item.guid}/admin-cancel`, { notes }))
    });

  const resolveRequest = (request, action) =>
    setReason({
      title: action === "Done" ? "إغلاق طلب التعديل كمنفَّذ" : "رفض طلب التعديل",
      label: action === "Done" ? "ملاحظة للفرع" : "سبب الرفض",
      optional: action === "Done",
      hint: action === "Done" ? "استخدم هذا إذا نفّذت التعديل بطريقة أخرى أو لم يعد مطلوبًا." : undefined,
      confirmLabel: action === "Done" ? "إغلاق الطلب" : "رفض الطلب",
      color: action === "Done" ? "primary" : "error",
      run: async (notes) => done(await apiPost(`/edit-requests/${request.guid}/resolve`, { action, notes }))
    });

  const editEntryFromRequest = async (request) => {
    try {
      const json = await apiGet(`/entries/${request.entityGuid}`);
      setAdminEntry({ ...json.entry, adminNotes: `بناءً على طلب الفرع: ${request.notes}`.slice(0, 1000) });
    } catch (e) {
      showError(e);
    }
  };

  const cancelButton = (kind, item) =>
    canDelete && item.status === "Approved" ? (
      <IconAction title="إلغاء العملية المعتمدة" color="error" onClick={() => cancelApproved(kind, item)}>
        <UndoIcon fontSize="small" />
      </IconAction>
    ) : null;

  const decide = async (notes) => {
    const { kind, item, approve } = decision;
    try {
      const json = await apiPost(`/${KIND_PATH[kind]}/${item.guid}/review`, { approve, notes });
      toast(json?.message || "تم");
      setDecision(null);
      setDetails(null);
      load();
    } catch (e) {
      showError(e);
    }
  };

  // النقل: الحسابات بتقرر بعد ما الفرع المستلم يأكد الاستلام (Received).
  const decisionButtons = (kind, item) =>
    canDecide && item.status === (kind === "transfer" ? "Received" : "Pending") ? (
      <Stack direction="row" justifyContent="center">
        <IconAction title="موافقة" color="success" onClick={() => setDecision({ kind, item, approve: true })}>
          <CheckCircleOutlineIcon fontSize="small" />
        </IconAction>
        <IconAction title="رفض" color="error" onClick={() => setDecision({ kind, item, approve: false })}>
          <HighlightOffIcon fontSize="small" />
        </IconAction>
      </Stack>
    ) : null;

  return (
    <TasksPageShell
      icon={<FactCheckIcon />}
      title="مراجعة الأصول"
      subtitle="طلبات الإضافة والشراء ونقل العهدة والتكهين والتعديل من الفروع — لا تتغير عهدة أي فرع إلا بعد موافقتك"
      actions={<Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}>تحديث</Button>}
    >
      <SectionCard sx={{ mb: 2 }}>
        <Stack direction={{ xs: "column", lg: "row" }} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between" spacing={1.25} sx={{ px: 1.5, py: 0.75 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ "& .MuiTab-root": { fontWeight: 700 } }}>
            {boot.access.review ? <Tab value="entries" label={`طلبات الإضافة (${data?.entries?.length ?? 0})`} /> : null}
            {showPurchases ? <Tab value="purchases" label={`طلبات الشراء${purchaseCount ? ` (${purchaseCount.total})` : ""}`} /> : null}
            {boot.access.review ? <Tab value="transfers" label={`نقل العهدة (${data?.transfers?.length ?? 0})`} /> : null}
            {boot.access.review ? <Tab value="disposals" label={`التكهين (${data?.disposals?.length ?? 0})`} /> : null}
            {boot.access.review ? <Tab value="edits" label={`طلبات التعديل (${data?.editRequests?.length ?? 0})`} /> : null}
          </Tabs>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
            <FilterSelect
              label="الحالة"
              value={status}
              onChange={(v) => setStatus(v || "All")}
              width={190}
              options={[
                { value: "Pending", label: "قيد المراجعة" },
                { value: "Approved", label: "المعتمد" },
                { value: "Rejected", label: "المرفوض" },
                ...(tab === "transfers" ? [{ value: "AwaitingReceipt", label: "بانتظار استلام الفرع" }] : []),
                ...(!["entries", "edits"].includes(tab) ? [{ value: "Cancelled", label: "الملغى" }] : []),
                { value: "All", label: "الكل" }
              ]}
            />
            <BranchSelect branches={boot.branches} value={branchGuid} onChange={setBranchGuid} allLabel="كل الفروع" />
            <TextField
              size="small"
              placeholder="بحث"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={filterFieldSx(220)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
          </Stack>
        </Stack>
      </SectionCard>

      {tab === "purchases" && showPurchases ? (
        <PurchasesPanel
          branchGuid={branchGuid}
          status={PURCHASE_FILTER[status] ?? ""}
          search={search}
          items={items}
          branches={boot.branches}
          onCount={setPurchaseCount}
        />
      ) : null}

      {loading && !data ? <CenterLoader /> : null}

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
                    <TableCell sx={{ fontWeight: 700 }} align="center">سعر الوحدة</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الإجمالي</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>أضافه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">قرار</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.guid} hover sx={{ cursor: "pointer" }} onClick={() => setDetails(e)}>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <AssetThumb kind="entry-image" guid={e.guid} size={46} title={e.itemName} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{e.itemName}</Typography>
                            <Typography sx={{ fontSize: 12, color: p.muted }}>{[e.model, e.hasInvoice ? "فاتورة مرفقة" : ""].filter(Boolean).join(" · ")}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{e.branchName}</TableCell>
                      <TableCell><EntryTypeChip type={e.entryType} /></TableCell>
                      <TableCell align="center">{qtyText(e.qty)}</TableCell>
                      <TableCell align="center">{money(e.unitPrice)}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>{money(e.totalPrice)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{e.createdBy}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(e.updatedAt || e.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <EntryStatusChip status={e.status} />
                        {e.reviewedBy ? <Typography sx={{ fontSize: 11.5, color: p.muted, mt: 0.5 }}>{e.reviewedBy}</Typography> : null}
                      </TableCell>
                      <TableCell align="center">{decisionButtons("entry", e)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text={status === "Pending" ? "لا توجد طلبات إضافة بانتظار المراجعة" : "لا توجد طلبات"} />
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
                    <TableCell sx={{ fontWeight: 700 }} align="center">قرار</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfers.map((t) => (
                    <TableRow key={t.guid} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <AssetThumb kind="catalog" guid={t.itemGuid} hasImage={t.itemHasImage} size={40} title={t.itemName} />
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{t.itemName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{t.fromBranchName}</Typography>
                          <ArrowBackIcon sx={{ fontSize: 16, color: p.muted }} />
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{t.toBranchName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">{qtyText(t.qty)}</TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{t.reason}</Typography>
                        {t.receivedBy ? (
                          <>
                            <Typography sx={{ fontSize: 11.5, color: "#059669" }}>
                              استلمها {t.receivedBy} — {formatDateTime(t.receivedAt)}{t.receiveNotes ? ` (${t.receiveNotes})` : ""}
                            </Typography>
                            {t.hasReceipt ? <FileButton kind="transfer-receipt" guid={t.guid} label={`محضر الاستلام: ${t.receiptFileName || "فتح"}`} /> : null}
                          </>
                        ) : t.status === "Pending" ? (
                          <Typography sx={{ fontSize: 11.5, color: "#0891b2" }}>لم يؤكد الفرع المستلم الاستلام بعد</Typography>
                        ) : null}
                        {t.reviewNotes ? <Typography sx={{ fontSize: 11.5, color: t.status === "Rejected" ? "#dc2626" : p.muted }}>ملاحظة: {t.reviewNotes}</Typography> : null}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{t.requestedBy}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(t.requestedAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <TransferStatusChip status={t.status} />
                        {t.reviewedBy ? <Typography sx={{ fontSize: 11.5, color: p.muted, mt: 0.5 }}>{t.reviewedBy}</Typography> : null}
                      </TableCell>
                      <TableCell align="center">{decisionButtons("transfer", t)}{cancelButton("transfers", t)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState
            text={status === "Pending" ? "لا توجد طلبات نقل بانتظار موافقتك" : "لا توجد طلبات"}
            hint={status === "Pending" ? "يظهر طلب النقل هنا بعد أن يؤكد الفرع المستلم الاستلام" : undefined}
          />
        )
      ) : null}

      {data && tab === "disposals" ? (
        disposals.length ? (
          <SectionCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>الصنف ومرفق التكهين</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الفرع</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الكمية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>السبب</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>طلبه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">قرار</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disposals.map((d) => (
                    <TableRow key={d.guid} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <AttachmentView kind="disposal-image" guid={d.guid} fileName={d.attachmentName} size={52} title={`${d.itemName} — مرفق التكهين`} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{d.itemName}</Typography>
                            <Typography sx={{ fontSize: 12, color: p.muted }}>{d.model || d.categoryName}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{d.branchName}</TableCell>
                      <TableCell align="center">{qtyText(d.qty)}</TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{d.reason}</Typography>
                        {d.reviewNotes ? <Typography sx={{ fontSize: 11.5, color: d.status === "Rejected" ? "#dc2626" : p.muted }}>ملاحظة: {d.reviewNotes}</Typography> : null}
                        {d.status === "Approved" && d.unitValue !== null ? (
                          <Typography sx={{ fontSize: 11.5, color: p.muted }}>القيمة المخصومة: {money(d.unitValue * d.qty)}</Typography>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{d.requestedBy}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(d.requestedAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <DisposalStatusChip status={d.status} />
                        {d.reviewedBy ? <Typography sx={{ fontSize: 11.5, color: p.muted, mt: 0.5 }}>{d.reviewedBy}</Typography> : null}
                      </TableCell>
                      <TableCell align="center">{decisionButtons("disposal", d)}{cancelButton("disposals", d)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text={status === "Pending" ? "لا توجد طلبات تكهين بانتظار المراجعة" : "لا توجد طلبات"} />
        )
      ) : null}

      {data && tab === "edits" ? (
        editRequests.length ? (
          <SectionCard>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>العملية</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الفرع</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>التعديل المطلوب</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>طلبه</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">الإجراء</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editRequests.map((r) => {
                    const open = r.status === "Pending" && canDecide;
                    const approved = r.entityStatus === "Approved";
                    return (
                      <TableRow key={r.guid} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <AssetThumb kind="catalog" guid={r.itemGuid} hasImage={r.itemHasImage} size={42} title={r.itemName} />
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{r.itemName}</Typography>
                              <Typography sx={{ fontSize: 12, color: p.muted }}>
                                {ENTITY_LABEL[r.entityType]} × {qtyText(r.qty)}{r.toBranchName ? ` إلى ${r.toBranchName}` : ""}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{r.branchName}</TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography sx={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{r.notes}</Typography>
                          {r.handleNotes ? <Typography sx={{ fontSize: 11.5, color: p.muted }}>الرد: {r.handleNotes}</Typography> : null}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{r.requestedBy}</Typography>
                          <Typography sx={{ fontSize: 11.5, color: p.muted }}>{formatDateTime(r.requestedAt)}</Typography>
                        </TableCell>
                        <TableCell>
                          <EditStatusChip status={r.status} />
                          {r.handledBy ? <Typography sx={{ fontSize: 11.5, color: p.muted, mt: 0.5 }}>{r.handledBy}</Typography> : null}
                        </TableCell>
                        <TableCell align="center">
                          {open ? (
                            <Stack direction="row" justifyContent="center" flexWrap="wrap">
                              {r.entityType === "Entry" && approved ? (
                                <>
                                  <IconAction title="تعديل مباشر" onClick={() => editEntryFromRequest(r)}><EditOutlinedIcon fontSize="small" /></IconAction>
                                  <IconAction title="فتح للفرع ليعدّله" onClick={() => unlockEntry({ guid: r.entityGuid, itemName: r.itemName, qty: r.qty }, r.notes)}>
                                    <LockOpenOutlinedIcon fontSize="small" />
                                  </IconAction>
                                </>
                              ) : null}
                              {r.entityType !== "Entry" && approved && canDelete ? (
                                <IconAction
                                  title="إلغاء العملية ليعيدها الفرع بشكل صحيح"
                                  color="error"
                                  onClick={() => cancelApproved(r.entityType === "Transfer" ? "transfers" : "disposals", { guid: r.entityGuid, itemName: r.itemName, qty: r.qty, status: "Approved" })}
                                >
                                  <UndoIcon fontSize="small" />
                                </IconAction>
                              ) : null}
                              <IconAction title="تم التنفيذ" color="success" onClick={() => resolveRequest(r, "Done")}><DoneAllIcon fontSize="small" /></IconAction>
                              <IconAction title="رفض الطلب" color="error" onClick={() => resolveRequest(r, "Rejected")}><HighlightOffIcon fontSize="small" /></IconAction>
                            </Stack>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>
        ) : (
          <EmptyState text={status === "Pending" ? "لا توجد طلبات تعديل بانتظار المراجعة" : "لا توجد طلبات"} />
        )
      ) : null}

      <EntryDetailsDialog
        entry={details}
        onClose={() => setDetails(null)}
        actions={
          details && canDecide && details.status === "Pending" ? (
            <>
              <Button color="error" variant="outlined" startIcon={<HighlightOffIcon />} onClick={() => setDecision({ kind: "entry", item: details, approve: false })}>
                رفض
              </Button>
              <Button variant="contained" startIcon={<CheckCircleOutlineIcon />} onClick={() => setDecision({ kind: "entry", item: details, approve: true })}>
                الموافقة والإضافة إلى عهدة الفرع
              </Button>
            </>
          ) : details && details.status === "Approved" && (canDecide || canDelete) ? (
            <>
              {canDelete ? (
                <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => deleteEntry(details)}>حذف</Button>
              ) : null}
              {canDecide ? (
                <Button variant="outlined" startIcon={<LockOpenOutlinedIcon />} onClick={() => unlockEntry(details)}>فتح للفرع للتعديل</Button>
              ) : null}
              {canDecide ? (
                <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => setAdminEntry(details)}>تعديل مباشر</Button>
              ) : null}
            </>
          ) : null
        }
      />

      <EntryDialog
        open={Boolean(adminEntry)}
        admin
        entry={adminEntry}
        items={items}
        onClose={() => setAdminEntry(null)}
        onSaved={() => {
          setDetails(null);
          load();
        }}
      />

      <ReasonDialog action={reason} onClose={() => setReason(null)} />

      <DecisionDialog
        open={Boolean(decision)}
        approve={decision?.approve}
        title={
          decision
            ? `${decision.approve ? "موافقة على" : "رفض"} ${KIND_LABEL[decision.kind]}: ${decision.item.itemName} × ${decision.item.qty}`
            : ""
        }
        onClose={() => setDecision(null)}
        onConfirm={decide}
      />
    </TasksPageShell>
  );
};

export default AssetsReviewPage;
