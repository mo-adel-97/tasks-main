import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DescriptionIcon from "@mui/icons-material/Description";
import PaymentIcon from "@mui/icons-material/Payment";
import DiscountIcon from "@mui/icons-material/Discount";
import ReplayIcon from "@mui/icons-material/Replay";
import BlockIcon from "@mui/icons-material/Block";
import VerifiedIcon from "@mui/icons-material/Verified";
import SchoolIcon from "@mui/icons-material/School";
import SendIcon from "@mui/icons-material/Send";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import StudyApprovalDialog from "./components/StudyApprovalDialog";
import Swal from "sweetalert2";
import Sidebar from "./components/Sidebar";
import instituteLogo from "./images/logo.jpg";

const SIDEBAR_WIDTH = 280;
const API_BASE_URL = "https://api4.sstli.com";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const readCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getSellerGuid = (user) =>
  user?.sellerGuid ||
  user?.SellerGuid ||
  user?.salesManGuid ||
  user?.SalesManGuid ||
  user?.SELLERMAN_GUID ||
  user?.SELLERMAN_GUID____ ||
  "";


const getUserGuid = (user) =>
  user?.userGuid ||
  user?.UserGuid ||
  user?.guid ||
  user?.Guid ||
  user?.USER_GUID ||
  user?.USER_GUID____ ||
  "";

const getUserFullName = (user) =>
  user?.fullName ||
  user?.FullName ||
  user?.userName ||
  user?.UserName ||
  user?.name ||
  user?.Name ||
  user?.USER_NAME ||
  user?.USER_NAME____ ||
  "";

const todayText = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};

const tabs = [
  { key: "non-contract", label: "تسجيلات بدون اتفاقية", icon: <DescriptionIcon /> },
  { key: "admission", label: "طلبات الالتحاق", icon: <AssignmentTurnedInIcon /> },
  { key: "payment", label: "طلبات السداد", icon: <PaymentIcon /> },
  { key: "discount", label: "طلبات الخصم", icon: <DiscountIcon /> },
  { key: "refund", label: "طلبات الاسترداد", icon: <ReplayIcon /> },
  { key: "de-registration", label: "طلبات طي القيد", icon: <BlockIcon /> },
  { key: "approvals", label: "الموافقات الدراسية", icon: <VerifiedIcon /> },
  { key: "other-institutes", label: "تسجيلات في معاهد أخرى", icon: <SchoolIcon /> }
];

const money = (value) => {
  const number = Number(value || 0);
  return Number.isFinite(number)
    ? number.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    : "0.00";
};

const formatDateTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const admissionDateText = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
};

const refundPolicyUrl =
  "https://sstli.com/%d8%b3%d9%8a%d8%a7%d8%b3%d8%a9-%d8%a7%d9%84%d8%a5%d8%b3%d8%aa%d8%b1%d8%af%d8%a7%d8%af-%d8%a7%d9%84%d9%85%d8%a7%d9%84%d9%8a/";

const refundQrUrl =
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(refundPolicyUrl)}`;


const showError = (text) =>
  Swal.fire({
    icon: "error",
    title: "خطأ",
    text,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

const showSuccess = (text) =>
  Swal.fire({
    icon: "success",
    title: "تم",
    text,
    confirmButtonText: "حسناً",
    confirmButtonColor: primaryColor
  });

function GenericItemsTable({ title, rows }) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const hiddenColumns = new Set([
    "Type",
    "type",
    "Type_",
    "type_",
    "DiplomType",
    "diplomType"
  ]);

  const columnNames = {
    Code: "الكود",
    code: "الكود",
    DiplomName: "اسم الدبلوم / الدورة",
    diplomName: "اسم الدبلوم / الدورة",
    CourseName: "اسم الدورة",
    courseName: "اسم الدورة",
    Cost: "التكلفة",
    cost: "التكلفة",
    Tax: "الضريبة",
    tax: "الضريبة",
    SubTotal: "الصافي",
    subTotal: "الصافي",
    Total: "الإجمالي",
    total: "الإجمالي",
    Qty: "الكمية",
    qty: "الكمية",
    Quantity: "الكمية",
    quantity: "الكمية",
    Unit_: "الوحدة",
    unit_: "الوحدة",
    Unit: "الوحدة",
    unit: "الوحدة",
    Name: "البيان",
    name: "البيان",
    FessName: "البيان",
    FeesName: "البيان",
    FeeName: "البيان",
    PackageName: "اسم الباكدج",
    packageName: "اسم الباكدج",
    Amount: "المبلغ",
    amount: "المبلغ",
    Price: "السعر",
    price: "السعر"
  };

  const keys = Object.keys(rows[0] || {})
    .filter((key) => !/guid/i.test(key))
    .filter((key) => !hiddenColumns.has(key))
    .slice(0, 8);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
      <Typography sx={{ fontWeight: 950, mb: 1, color: primaryColor }}>
        {title}
      </Typography>

      <Box sx={{ overflowX: "auto" }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            "& th, & td": {
              border: "1px solid #ddd",
              px: 1,
              py: 0.8,
              whiteSpace: "nowrap",
              textAlign: "center"
            },
            "& th": {
              backgroundColor: "#edf8f2",
              fontWeight: 900
            }
          }}
        >
          <thead>
            <tr>
              {keys.map((key) => (
                <th key={key}>{columnNames[key] || key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {keys.map((key) => (
                  <td key={key}>{String(row?.[key] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
    </Paper>
  );
}

function AdmissionDetailsDialog({ open, data, loading, error, onClose, onPrint }) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      dir="rtl"
    >
      <DialogTitle
        sx={{
          fontWeight: 950,
          color: primaryColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <ReceiptLongIcon />
          <span>عرض طلب الالتحاق رقم {data?.code || ""}</span>
        </Stack>

        <IconButton onClick={onClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        {loading ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <CircularProgress />
            <Typography>جاري تحميل بيانات الطلب...</Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : data ? (
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Grid container spacing={1.5}>
                {[
                  ["اسم الطالب", data.studentName],
                  ["رقم الهوية", data.nationalId],
                  ["رقم الجوال", data.studentTel],
                  ["مسؤول التسجيل", data.sellerName],
                  ["الفرع", data.branchName],
                  ["الدفعة", data.batchName],
                  ["الباكدج", data.packageName]
                ].map(([label, value]) => (
                  <Grid item xs={12} md={4} key={label}>
                    <TextField
                      fullWidth
                      size="small"
                      label={label}
                      value={value || ""}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="الملاحظات"
                    value={data.notes || ""}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={1.5}>
              {[
                ["الإجمالي", data.total],
                ["الضريبة", data.tax],
                ["الصافي", data.subTotal],
                ["المدفوع", data.amount]
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} md={3} key={label}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 1.5, textAlign: "center", borderRadius: 3 }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>{label}</Typography>
                    <Typography
                      variant="h6"
                      sx={{ mt: 0.4, color: accentColor, fontWeight: 950 }}
                    >
                      {money(value)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <GenericItemsTable title="الدبلومات والدورات" rows={data.diplomaItems} />
            <GenericItemsTable title="الرسوم الإضافية" rows={data.feeItems} />
            <GenericItemsTable title="تفاصيل الباكدج" rows={data.packageItems} />
          </Stack>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, justifyContent: "space-between" }}>
        <Button
          variant="contained"
          onClick={() => onPrint?.(data)}
          disabled={loading || !data}
          startIcon={<PrintIcon />}
          sx={{ backgroundColor: primaryColor, fontWeight: 900, minWidth: 150 }}
        >
          طباعة طلب الالتحاق
        </Button>

        <Button onClick={onClose} disabled={loading} sx={{ color: accentColor, fontWeight: 900 }}>
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}



function PaymentDetailsDialog({
  open,
  data,
  loading,
  error,
  onClose,
  onPrint
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      dir="rtl"
    >
      <DialogTitle
        sx={{
          fontWeight: 950,
          color: primaryColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <PaymentIcon />
          <span>عرض طلب السداد رقم {data?.code || ""}</span>
        </Stack>

        <IconButton onClick={onClose} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        {loading ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <CircularProgress />
            <Typography>جاري تحميل بيانات طلب السداد...</Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : data ? (
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
              <Grid container spacing={1.5}>
                {[
                  ["اسم الطالب", data.studentName],
                  ["رقم الهوية", data.nationalId],
                  ["رقم الجوال", data.studentTel],
                  ["الفرع", data.branchName],
                  ["الخزينة / البنك", data.cashBoxName],
                  ["رقم المرجع", data.referenceNumber],
                  ["تاريخ الطلب", formatDateTime(data.orderDate)],
                  ["تاريخ الحوالة", formatDateTime(data.paymentDate)],
                  ["نوع المستند", data.documentName],
                  ["حالة الطلب", data.orderStatus]
                ].map(([label, value]) => (
                  <Grid item xs={12} md={4} key={label}>
                    <TextField
                      fullWidth
                      size="small"
                      label={label}
                      value={value || ""}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="الملاحظات"
                    value={data.notes || ""}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Box sx={{ overflowX: "auto" }}>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  "& th, & td": {
                    border: "1px solid #ddd",
                    px: 1,
                    py: 0.9,
                    whiteSpace: "nowrap",
                    textAlign: "center"
                  },
                  "& th": {
                    backgroundColor: "#f7d58b",
                    fontWeight: 950
                  }
                }}
              >
                <thead>
                  <tr>
                    <th>البيان</th>
                    <th>الوحدة</th>
                    <th>الكمية</th>
                    <th>التكلفة</th>
                    <th>الضريبة %</th>
                    <th>الضريبة</th>
                    <th>الصافي</th>
                  </tr>
                </thead>

                <tbody>
                  {Array.isArray(data.items) && data.items.length > 0 ? (
                    data.items.map((item, index) => (
                      <tr key={`${item.code || "item"}-${index}`}>
                        <td>{item.statement || ""}</td>
                        <td>{item.unit || ""}</td>
                        <td>{item.quantity ?? ""}</td>
                        <td>{money(item.cost)}</td>
                        <td>{item.taxRate ?? ""}</td>
                        <td>{money(item.tax)}</td>
                        <td>{money(item.subTotal)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>لا توجد تفاصيل لطلب السداد</td>
                    </tr>
                  )}
                </tbody>
              </Box>
            </Box>

            <Grid container spacing={1.5}>
              {[
                ["الإجمالي", data.total],
                ["الضريبة", data.tax],
                ["الصافي", data.subTotal]
              ].map(([label, value]) => (
                <Grid item xs={12} md={4} key={label}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      textAlign: "center",
                      borderRadius: 3
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      {label}
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        mt: 0.4,
                        color: accentColor,
                        fontWeight: 950
                      }}
                    >
                      {money(value)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Stack>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, justifyContent: "space-between" }}>
        <Button
          variant="contained"
          onClick={() => onPrint?.(data)}
          disabled={loading || !data}
          startIcon={<PrintIcon />}
          sx={{ backgroundColor: primaryColor, fontWeight: 900, minWidth: 145 }}
        >
          طباعة طلب السداد
        </Button>

        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ color: accentColor, fontWeight: 900 }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConvertVipDialog({
  open,
  row,
  userName,
  saving,
  error,
  onClose,
  onConfirm
}) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) setNotes("");
  }, [open, row?.id]);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      dir="ltr"
    >
      <Box
        sx={{
          px: 3,
          py: 2.2,
          textAlign: "center",
          color: "white",
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`
        }}
      >
        <WorkspacePremiumIcon sx={{ fontSize: 40, mb: 0.5 }} />
        <Typography variant="h5" sx={{ fontWeight: 950 }}>
          تحويل الطلب إلى عميل VIP
        </Typography>
        <Typography sx={{ mt: 0.5, opacity: 0.9 }}>
          سيتم حفظ الطلب بحالة غير مؤكد
        </Typography>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            backgroundColor: "#fafafa"
          }}
        >
          <Stack spacing={0.8}>
            <Typography><strong>رقم الطلب:</strong> {row?.code || "-"}</Typography>
            <Typography><strong>اسم العميل:</strong> {row?.studentName || "-"}</Typography>
            <Typography><strong>رقم الهوية:</strong> {row?.nationalId || "-"}</Typography>
            <Typography><strong>رقم الجوال:</strong> {row?.studentTel || "-"}</Typography>
            <Typography><strong>مسؤول التحويل:</strong> {userName || "-"}</Typography>
            <Typography>
              <strong>الحالة:</strong>{" "}
              <Chip size="small" label="غير مؤكد" color="warning" />
            </Typography>
          </Stack>
        </Paper>

        <TextField
          fullWidth
          multiline
          minRows={4}
          label="ملاحظة VIP"
          placeholder="اكتب ملاحظة خاصة بالعميل أو اتركها فارغة..."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          variant="contained"
          onClick={() => onConfirm(notes)}
          disabled={saving}
          startIcon={
            saving
              ? <CircularProgress size={18} color="inherit" />
              : <WorkspacePremiumIcon />
          }
          sx={{
            minWidth: 140,
            backgroundColor: primaryColor,
            fontWeight: 950
          }}
        >
          تحويل
        </Button>

        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ color: accentColor, fontWeight: 900 }}
        >
          إلغاء
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MyRequests() {
  const user = useMemo(() => readCurrentUser(), []);
  const sellerGuid = useMemo(() => getSellerGuid(user), [user]);
  const userGuid = useMemo(() => getUserGuid(user), [user]);
  const userFullName = useMemo(() => getUserFullName(user), [user]);

  const [activeTab, setActiveTab] = useState("non-contract");
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [fromDate, setFromDate] = useState(todayText());
  const [toDate, setToDate] = useState(todayText());
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [savingTraineeNoteId, setSavingTraineeNoteId] = useState("");
  const [error, setError] = useState("");

  const [contextMenu, setContextMenu] = useState(null);
  const [contextRow, setContextRow] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [detailsData, setDetailsData] = useState(null);

  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  const [paymentDetailsError, setPaymentDetailsError] = useState("");
  const [paymentDetailsData, setPaymentDetailsData] = useState(null);

  const [vipOpen, setVipOpen] = useState(false);
  const [vipRow, setVipRow] = useState(null);
  const [vipSaving, setVipSaving] = useState(false);
  const [vipError, setVipError] = useState("");

  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalRow, setApprovalRow] = useState(null);

  const dateFilteredTabs = new Set([
    "admission",
    "payment",
    "discount",
    "refund",
    "de-registration",
    "approvals",
    "other-institutes"
  ]);

  const loadData = async () => {
    // التسجيلات بدون اتفاقية وطلبات الالتحاق ما زالت مرتبطة بـ SellerGuid.
    if (
      (
        activeTab === "non-contract" ||
        activeTab === "admission"
      ) &&
      !sellerGuid
    ) {
      setRows([]);
      setError("تعذر قراءة القائم بالتسجيل المرتبط بالمستخدم.");
      return;
    }

    // الموافقات الدراسية تُحفظ داخل SalesManGuid باستخدام UserGuid
    // لذلك يجب جلبها بنفس UserGuid الذي تم إرسال الموافقة به.
    if (activeTab === "approvals" && !userGuid) {
      setRows([]);
      setError("تعذر قراءة المستخدم الذي قام بإرسال الموافقة.");
      return;
    }

    if (
      activeTab !== "non-contract" &&
      activeTab !== "admission" &&
      !userGuid
    ) {
      setRows([]);
      setError("تعذر قراءة بيانات المستخدم.");
      return;
    }

    if (dateFilteredTabs.has(activeTab) && !showAll && (!fromDate || !toDate)) {
      setRows([]);
      setError("برجاء اختيار تاريخ البداية وتاريخ النهاية.");
      return;
    }

    if (dateFilteredTabs.has(activeTab) && !showAll && new Date(toDate) < new Date(fromDate)) {
      setRows([]);
      setError("تاريخ النهاية يجب أن يكون أكبر من أو يساوي تاريخ البداية.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let url = `${API_BASE_URL}/api/my-requests/non-contract?sellerGuid=${encodeURIComponent(sellerGuid)}`;

      if (activeTab === "admission") {
        const params = new URLSearchParams({
          sellerGuid,
          fromDate,
          toDate,
          showAll: String(showAll)
        });

        url = `${API_BASE_URL}/api/my-requests/admission?${params.toString()}`;
      } else if (activeTab === "approvals") {
        const params = new URLSearchParams({
          // اسم البراميتر يظل sellerGuid لأن Endpoint الحالي يستقبله بهذا الاسم،
          // لكن القيمة الصحيحة هي UserGuid لأن الموافقة تُحفظ به داخل SalesManGuid.
          sellerGuid: userGuid,
          fromDate,
          toDate,
          showAll: String(showAll)
        });

        url = `${API_BASE_URL}/api/my-requests/approvals?${params.toString()}`;
      } else if (activeTab !== "non-contract") {
        const params = new URLSearchParams({
          userGuid,
          fromDate,
          toDate,
          showAll: String(showAll)
        });

        url = `${API_BASE_URL}/api/my-requests/${activeTab}?${params.toString()}`;
      }

      const response = await fetch(url, { cache: "no-store" });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || result?.message || "تعذر تحميل قائمة الطلبات");
      }

      setRows(Array.isArray(result?.data) ? result.data : []);
    } catch (requestError) {
      setRows([]);
      setError(requestError?.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchText("");
    loadData();
  }, [activeTab, sellerGuid, userGuid]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) return rows;

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [rows, searchText]);

  const sendAgreement = async (row) => {
    const confirmed = await Swal.fire({
      icon: "question",
      title: "إرسال الاتفاقية",
      text: `هل تريد إرسال الاتفاقية إلى ${row.studentName || "الطالب"}؟`,
      showCancelButton: true,
      confirmButtonText: "إرسال",
      cancelButtonText: "إلغاء",
      confirmButtonColor: primaryColor,
      cancelButtonColor: "#777"
    });

    if (!confirmed.isConfirmed) return;

    try {
      setSendingId(row.id);

      const response = await fetch(
        `${API_BASE_URL}/api/my-requests/non-contract/send-agreement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            regDocCode: row.code,
            regDocGuid: row.regDocGuid,
            studentTel: row.studentTel,
            diplomName: row.diplomName
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر إرسال الاتفاقية"
        );
      }

      await showSuccess(result?.message || "تم إرسال الاتفاقية بنجاح");
    } catch (sendError) {
      showError(sendError?.message || "حدث خطأ أثناء إرسال الاتفاقية");
    } finally {
      setSendingId("");
    }
  };

  const printAdmission = (admissionData) => {
    if (!admissionData) {
      showError("لا توجد بيانات لطلب الالتحاق");
      return;
    }

    const diplomaRows = Array.isArray(admissionData.diplomaItems) ? admissionData.diplomaItems : [];
    const feeRows = Array.isArray(admissionData.feeItems) ? admissionData.feeItems : [];
    const packageRows = Array.isArray(admissionData.packageItems) ? admissionData.packageItems : [];
    const allItems = [...diplomaRows, ...feeRows, ...packageRows];

    const itemRowsHtml = allItems.length > 0
      ? allItems.map((item) => {
          const statement = item?.DiplomName || item?.diplomName || item?.CourseName || item?.courseName || item?.Name || item?.name || item?.FessName || item?.FeesName || item?.FeeName || item?.PackageName || item?.packageName || "-";
          const cost = item?.Cost ?? item?.cost ?? item?.Price ?? item?.price ?? item?.Amount ?? item?.amount ?? item?.Total ?? item?.total ?? 0;
          const tax = item?.Tax ?? item?.tax ?? item?.TaxAmount ?? item?.taxAmount ?? 0;
          const subTotal = item?.SubTotal ?? item?.subTotal ?? item?.Net ?? item?.net ?? (Number(cost || 0) + Number(tax || 0));
          return `<tr><td class="statement">${escapeHtml(statement)}</td><td>${escapeHtml(money(cost))}</td><td>${escapeHtml(money(tax))}</td><td>${escapeHtml(money(subTotal))}</td></tr>`;
        }).join("")
      : `<tr><td class="statement">لا توجد بنود مسجلة</td><td>0.00</td><td>0.00</td><td>0.00</td></tr>`;

    const printWindow = window.open("", "_blank", "width=950,height=1100");
    if (!printWindow) {
      showError("المتصفح منع نافذة الطباعة، برجاء السماح بالنوافذ المنبثقة");
      return;
    }

    const formDate = admissionData.orderDate || admissionData.formDate || admissionData.date || "";
    const branchName = admissionData.branchName || "";
    const sellerName = admissionData.sellerName || "";
    const code = admissionData.code || admissionData.orderCode || "";
    const total = Number(admissionData.total || 0);
    const tax = Number(admissionData.tax || 0);
    const subTotal = Number(admissionData.subTotal || total + tax || 0);
    const paid = Number(admissionData.amount || 0);

    printWindow.document.open();
    printWindow.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"/><title>طلب التحاق رقم ${escapeHtml(code)}</title><style>
      @page{size:A4 portrait;margin:8mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
      body{margin:0;background:#fff;color:#111;font-family:Arial,Tahoma,sans-serif;direction:rtl}.sheet{width:100%;min-height:277mm;border:1px solid #d5d5d5;padding:9mm 9mm 7mm}
      .header{display:grid;grid-template-columns:115px 1fr;gap:14px;align-items:start;border-bottom:3px solid #222;padding-bottom:10px}.logo{width:105px;height:105px;object-fit:contain}
      .company{text-align:center;font-weight:700;line-height:1.75;font-size:13px}.company .main{font-size:17px;font-weight:900}.title{text-align:center;font-size:25px;font-weight:900;margin:10px 0 12px}
      .info{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:13px}.info td{padding:6px 7px}.info .label{font-weight:900;width:15%;white-space:nowrap}.info .value{font-weight:800;width:35%;border-bottom:1px dotted #aaa}
      .items{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}.items th{background:#dedede;border:1px solid #fff;padding:8px 5px;font-weight:900}.items td{border-bottom:1px dotted #999;padding:7px 5px;text-align:center;font-weight:700}.items .statement{text-align:right;width:54%}
      .separator{border-top:2px solid #222;margin:10px 0 12px}.bottom{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}.totals{width:100%;border-collapse:collapse;font-size:13px}.totals td{border:1px solid #777;padding:7px 8px;font-weight:900}.totals .number{width:34%;text-align:center;font-size:15px}
      .qr-box{text-align:center;font-size:11px;font-weight:800}.qr-box img{width:135px;height:135px;object-fit:contain;display:block;margin:0 auto 5px}.policy-note{text-align:center;font-size:16px;font-weight:900;margin-top:16px}.notes{margin-top:12px;border:1px solid #ddd;padding:8px 10px;min-height:42px;font-size:12px;line-height:1.7}.footer{margin-top:12px;display:flex;justify-content:space-between;font-size:10px;direction:ltr}@media print{.sheet{border:none}}
    </style></head><body><section class="sheet">
      <div class="header"><img class="logo" src="${escapeHtml(instituteLogo)}" alt="SSTLI"/><div class="company"><div class="main">شركة معهد السعودي المتخصص العالي للتدريب</div><div>${escapeHtml(branchName || "المعهد السعودي المتخصص العالي للتدريب")}</div><div>السجل التجاري: 920012673</div><div>الرقم الضريبي: 312191561600003</div></div></div>
      <div class="title">طلب التحاق</div>
      <table class="info"><tr><td class="label">اسم العميل</td><td class="value">${escapeHtml(admissionData.studentName || "")}</td><td class="label">رقم الطلب</td><td class="value">${escapeHtml(code)}</td></tr><tr><td class="label">رقم الهوية</td><td class="value">${escapeHtml(admissionData.nationalId || "")}</td><td class="label">تاريخ الطلب</td><td class="value">${escapeHtml(admissionDateText(formDate))}</td></tr><tr><td class="label">رقم الجوال</td><td class="value">${escapeHtml(admissionData.studentTel || "")}</td><td class="label">البائع</td><td class="value">${escapeHtml(sellerName)}</td></tr></table>
      <table class="items"><thead><tr><th>البيان</th><th>القيمة</th><th>مبلغ الضريبة</th><th>الصافي</th></tr></thead><tbody>${itemRowsHtml}</tbody></table>
      <div class="separator"></div><div class="bottom"><table class="totals"><tr><td>الإجمالي قبل الضريبة</td><td class="number">${escapeHtml(money(total))}</td></tr><tr><td>ضريبة القيمة المضافة</td><td class="number">${escapeHtml(money(tax))}</td></tr><tr><td>الإجمالي بعد الضريبة</td><td class="number">${escapeHtml(money(subTotal))}</td></tr><tr><td>المدفوع</td><td class="number">${escapeHtml(money(paid))}</td></tr></table><div class="qr-box"><img src="${escapeHtml(refundQrUrl)}" alt="سياسة الاسترداد"/><div>يرجى مراجعة سياسة الاسترداد</div></div></div>
      ${admissionData.notes ? `<div class="notes"><strong>ملاحظات:</strong> ${escapeHtml(admissionData.notes)}</div>` : ""}
      <div class="policy-note">المبالغ المدفوعة رسوم دراسية غير مستردة</div><div class="footer"><span>${escapeHtml(new Date().toLocaleDateString("en-GB"))}</span><span>Page 1 of 1</span></div>
    </section><script>window.addEventListener("load",function(){window.setTimeout(function(){window.print()},700)})</script></body></html>`);
    printWindow.document.close();
  };

  const printPayment = (paymentData) => {
    if (!paymentData) {
      showError("لا توجد بيانات لطلب السداد");
      return;
    }

    const items = Array.isArray(paymentData.items) ? paymentData.items : [];
    const itemRowsHtml = items.length
      ? items.map((item) => `
          <tr>
            <td class="statement">${escapeHtml(item.statement || item.name || "-")}</td>
            <td>${escapeHtml(money(item.cost))}</td>
            <td>${escapeHtml(String(item.taxRate ?? 0))}</td>
            <td>${escapeHtml(money(item.tax))}</td>
            <td>${escapeHtml(money(item.subTotal))}</td>
          </tr>`).join("")
      : `<tr><td class="statement">لا توجد بنود مسجلة</td><td>0.00</td><td>0</td><td>0.00</td><td>0.00</td></tr>`;

    const printWindow = window.open("", "_blank", "width=980,height=1100");
    if (!printWindow) {
      showError("المتصفح منع نافذة الطباعة، برجاء السماح بالنوافذ المنبثقة");
      return;
    }

    const code = paymentData.code || paymentData.orderCode || "";
    const orderDate = formatDateTime(paymentData.orderDate || paymentData.formDate || "");
    const sellerName = paymentData.sellerName || paymentData.fullName || userFullName || "";
    const total = Number(paymentData.total || 0);
    const tax = Number(paymentData.tax || 0);
    const subTotal = Number(paymentData.subTotal || 0);

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>طلب سداد ${escapeHtml(code)}</title>
  <style>
    @page{size:A4 portrait;margin:8mm}
    *{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    body{margin:0;background:#eef5f2;color:#111827;font-family:Tahoma,Arial,sans-serif}
    .print-btn{position:fixed;left:18px;top:18px;border:0;border-radius:10px;padding:10px 22px;background:#057546;color:#fff;font-weight:900;cursor:pointer;z-index:10}
    .preview{padding:18px;display:flex;justify-content:center}
    .sheet{width:190mm;min-height:270mm;background:#fff;border:1px solid #b9d8cc;border-radius:18px;padding:10mm 11mm;box-shadow:0 15px 40px rgba(0,0,0,.13);position:relative;overflow:hidden}
    .sheet:before{content:"";position:absolute;right:0;left:0;top:0;height:5px;background:linear-gradient(90deg,#034d31,#057546,#dcefe7,#057546,#034d31)}
    .header{display:grid;grid-template-columns:115px minmax(0,1fr) 115px;align-items:center;border-bottom:3px solid #1f2937;padding:5px 0 14px;margin-bottom:16px}
    .logo-card{width:105px;height:105px;border:1px solid #c8e2d8;border-radius:20px;padding:7px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(5,117,70,.12)}
    .logo{width:92px;height:92px;object-fit:contain}
    .company{text-align:center;font-weight:850;line-height:1.65;font-size:13px}.company .main{font-size:18px;font-weight:950;margin-bottom:2px}
    .title{width:max-content;min-width:170px;margin:0 auto 18px;padding:7px 25px;border:1px solid #cce3da;border-radius:999px;background:#f4faf7;color:#5b4428;font-size:22px;font-weight:950;text-align:center}
    .info{display:grid;grid-template-columns:1fr 1fr;gap:9px 22px;border:1px solid #edf3f1;border-radius:15px;padding:13px 15px;margin-bottom:18px;direction:ltr}
    .info-row{display:grid;grid-template-columns:90px minmax(0,1fr) 72px;gap:8px;align-items:center;min-height:32px;font-size:12px}
    .en{direction:ltr;text-align:left;white-space:nowrap}.ar{direction:rtl;text-align:right;white-space:nowrap}.value{min-width:0;text-align:center;font-weight:950;line-height:1.45;padding:4px 2px;white-space:normal;overflow-wrap:anywhere;word-break:break-word}.customer{direction:rtl;font-size:12px}
    .items{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;direction:rtl}.items th{background:#e4eee9;padding:10px 6px;border:2px solid #fff;font-size:12px;font-weight:950}.items td{text-align:center;padding:8px 6px;border-bottom:1px dotted #888;font-size:12px;font-weight:850}.items .statement{text-align:right;width:34%}
    .separator{height:3px;background:#1f2937;margin:14px 0 10px;border-radius:5px}
    .summary{width:390px;margin-right:auto;border-collapse:collapse;font-size:12px}.summary td{border:1px solid #555;padding:7px 9px;font-weight:900}.summary .amount{text-align:center;font-size:14px;width:38%}
    .notes{margin-top:13px;border:1px solid #ddd;border-radius:8px;min-height:45px;padding:8px 10px;font-size:12px;line-height:1.7}
    .watermark{position:absolute;left:24px;bottom:22px;font-size:39px;font-weight:950;color:rgba(5,117,70,.055);letter-spacing:5px}
    @media print{body{background:#fff}.print-btn{display:none}.preview{padding:0}.sheet{width:190mm;min-height:270mm;border:0;border-radius:0;box-shadow:none;padding:8mm 9mm}.sheet:before{display:none}}
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">طباعة</button>
  <div class="preview"><section class="sheet">
    <div class="header">
      <div class="logo-card"><img class="logo" src="${escapeHtml(instituteLogo)}" alt="SSTLI"/></div>
      <div class="company"><div class="main">شركة معهد السعودي المتخصص العالي للتدريب</div><div>${escapeHtml(paymentData.branchName || "")}</div><div>920012673</div><div>312191561600003</div></div>
      <div></div>
    </div>
    <div class="title">طلب سداد</div>
    <div class="info">
      <div class="info-row"><span class="en">Form No</span><span class="value">${escapeHtml(code)}</span><span class="ar">رقم الطلب</span></div>
      <div class="info-row"><span class="en">Customer Name</span><span class="value customer">${escapeHtml(paymentData.studentName || "")}</span><span class="ar">اسم العميل</span></div>
      <div class="info-row"><span class="en">Form Date</span><span class="value">${escapeHtml(orderDate)}</span><span class="ar">تاريخ الطلب</span></div>
      <div class="info-row"><span class="en">ID Number</span><span class="value">${escapeHtml(paymentData.nationalId || "")}</span><span class="ar">رقم الهوية</span></div>
      <div class="info-row"><span class="en">Seller Name</span><span class="value">${escapeHtml(sellerName)}</span><span class="ar">المحصل</span></div>
      <div class="info-row"><span class="en">Mobile No</span><span class="value">${escapeHtml(paymentData.studentTel || "")}</span><span class="ar">رقم الجوال</span></div>
    </div>
    <table class="items"><thead><tr><th>البيان</th><th>القيمة</th><th>الضريبة %</th><th>مبلغ الضريبة</th><th>الصافي</th></tr></thead><tbody>${itemRowsHtml}</tbody></table>
    <div class="separator"></div>
    <table class="summary"><tr><td>الإجمالي قبل الضريبة</td><td class="amount">${escapeHtml(money(total))} ريال</td></tr><tr><td>ضريبة القيمة المضافة</td><td class="amount">${escapeHtml(money(tax))} ريال</td></tr><tr><td>الإجمالي بعد الضريبة</td><td class="amount">${escapeHtml(money(subTotal))} ريال</td></tr></table>
    ${paymentData.notes ? `<div class="notes"><strong>الملاحظات:</strong> ${escapeHtml(paymentData.notes)}</div>` : ""}
    <div class="watermark">SSTLI</div>
  </section></div>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
  };

  const loadAndPrintPayment = async (row) => {
    const orderGuid = row?.orderGuid || row?.guid || row?.Guid || "";
    if (!orderGuid) {
      showError("تعذر قراءة معرف طلب السداد");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/my-requests/payment/${encodeURIComponent(orderGuid)}`, { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || result?.message || "تعذر تحميل طلب السداد للطباعة");
      printPayment(result?.data || null);
    } catch (printError) {
      showError(printError?.message || "حدث خطأ أثناء تجهيز طلب السداد للطباعة");
    }
  };

  const openAdmission = async (row) => {
    setDetailsOpen(true);
    setDetailsData(null);
    setDetailsError("");

    try {
      setDetailsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/my-requests/admission/${encodeURIComponent(
          row.code
        )}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر تحميل طلب الالتحاق"
        );
      }

      setDetailsData(result?.data || null);
    } catch (openError) {
      setDetailsError(
        openError?.message ||
        "حدث خطأ أثناء تحميل طلب الالتحاق"
      );
    } finally {
      setDetailsLoading(false);
    }
  };



  const openPayment = async (row) => {
    const orderGuid =
      row?.orderGuid ||
      row?.guid ||
      row?.Guid ||
      "";

    if (!orderGuid) {
      showError("تعذر قراءة معرف طلب السداد");
      return;
    }

    setPaymentDetailsOpen(true);
    setPaymentDetailsData(null);
    setPaymentDetailsError("");

    try {
      setPaymentDetailsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/my-requests/payment/${encodeURIComponent(
          orderGuid
        )}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر تحميل طلب السداد"
        );
      }

      setPaymentDetailsData(result?.data || null);
    } catch (openError) {
      setPaymentDetailsError(
        openError?.message ||
        "حدث خطأ أثناء تحميل طلب السداد"
      );
    } finally {
      setPaymentDetailsLoading(false);
    }
  };

  const openVipDialog = (row) => {
    if (row?.vipStatus || row?.vipHint) {
      showError("هذا العميل موجود بالفعل ضمن عملاء VIP");
      return;
    }

    setVipRow(row);
    setVipError("");
    setVipOpen(true);
  };

  const convertToVip = async (vipNotes) => {
    if (!vipRow?.code) {
      setVipError("رقم طلب الالتحاق غير موجود");
      return;
    }

    if (!sellerGuid || !userGuid || !userFullName) {
      setVipError(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
      return;
    }

    try {
      setVipSaving(true);
      setVipError("");

      const response = await fetch(
        `${API_BASE_URL}/api/my-requests/admission/convert-vip`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderCode: String(vipRow.code),
            sellerGuid,
            userGuid,
            userName: userFullName,
            vipNotes: vipNotes || ""
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر تحويل الطلب إلى عميل VIP"
        );
      }

      setRows((currentRows) =>
        currentRows.map((item) =>
          item.id === vipRow.id
            ? {
                ...item,
                vipStatus: result?.data?.vipStatus || "غير مؤكد",
                vipHint: result?.data?.vipHint || "VIP - غير مؤكد"
              }
            : item
        )
      );

      setVipOpen(false);
      setVipRow(null);

      await showSuccess(
        result?.message ||
        "تم تحويل الطلب إلى عميل VIP بحالة غير مؤكد"
      );
    } catch (convertError) {
      setVipError(
        convertError?.message ||
        "حدث خطأ أثناء تحويل الطلب إلى عميل VIP"
      );
    } finally {
      setVipSaving(false);
    }
  };

  const editTraineeStatusNote = async (row) => {
    const recordId =
      row?.code ||
      row?.id ||
      row?.Id ||
      row?.ID ||
      "";

    if (!recordId) {
      showError("تعذر قراءة سجل المتدرب");
      return;
    }

    const currentNote =
      row?.traineeStatusNote ||
      row?.TraineeStatusNote ||
      "";

    const inputResult = await Swal.fire({
      icon: "info",
      title: "موقف المتدرب",
      html: `
        <div style="direction:rtl;text-align:right;font-weight:700;margin-bottom:8px">
          المتدرب: ${escapeHtml(row?.studentName || "-")}
        </div>
      `,
      input: "textarea",
      inputValue: currentNote,
      inputPlaceholder: "اكتب موقف المتدرب أو آخر متابعة تمت معه...",
      inputAttributes: {
        dir: "rtl",
        maxlength: "2000"
      },
      showCancelButton: true,
      confirmButtonText: "حفظ الملاحظة",
      cancelButtonText: "إلغاء",
      confirmButtonColor: primaryColor,
      cancelButtonColor: "#777",
      reverseButtons: true,
      inputValidator: (value) => {
        if (!String(value || "").trim()) {
          return "برجاء كتابة موقف المتدرب";
        }

        if (String(value).trim().length > 2000) {
          return "الملاحظة لا يمكن أن تتجاوز 2000 حرف";
        }

        return undefined;
      }
    });

    if (!inputResult.isConfirmed) return;

    const traineeStatusNote =
      String(inputResult.value || "").trim();

    try {
      setSavingTraineeNoteId(String(recordId));

      const response = await fetch(
        `${API_BASE_URL}/api/my-requests/other-institutes/${encodeURIComponent(
          recordId
        )}/trainee-status-note`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            traineeStatusNote,
            userGuid,
            userName: userFullName
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر حفظ موقف المتدرب"
        );
      }

      setRows((currentRows) =>
        currentRows.map((item) => {
          const itemId =
            item?.code ||
            item?.id ||
            item?.Id ||
            item?.ID ||
            "";

          return String(itemId) === String(recordId)
            ? {
                ...item,
                traineeStatusNote:
                  result?.data?.traineeStatusNote ||
                  traineeStatusNote,
                traineeStatusUpdatedAt:
                  result?.data?.traineeStatusUpdatedAt ||
                  new Date().toISOString(),
                traineeStatusUpdatedBy:
                  result?.data?.traineeStatusUpdatedBy ||
                  userFullName
              }
            : item;
        })
      );

      await showSuccess(
        result?.message || "تم حفظ موقف المتدرب بنجاح"
      );
    } catch (saveError) {
      showError(
        saveError?.message ||
        "حدث خطأ أثناء حفظ موقف المتدرب"
      );
    } finally {
      setSavingTraineeNoteId("");
    }
  };


  const closeContextMenu = () => {
    setContextMenu(null);
    setContextRow(null);
  };

  const handleRowContextMenu = (params, event) => {
    event.preventDefault();
    setContextRow(params.row);
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6
    });
  };

  const openApprovalEditor = (row) => {
    const orderGuid =
      row?.orderGuid ||
      row?.OrderGuid ||
      row?.guid ||
      row?.Guid ||
      row?.raw?.OrderGuid ||
      row?.raw?.Guid ||
      "";

    const orderCode =
      row?.code ||
      row?.Code ||
      row?.orderCode ||
      row?.OrderCode ||
      row?.raw?.Code ||
      "";

    if (!orderGuid && !orderCode) {
      showError("تعذر قراءة رقم الموافقة المراد تعديلها");
      return;
    }

    setApprovalRow({
      ...row,
      orderGuid,
      approvalOrderGuid: orderGuid,
      orderCode,
      approvalOrderCode: orderCode,
      existingApproval: true,
      isEditMode: true,
      accountGuid:
        row?.accountGuid ||
        row?.AccountGuid ||
        row?.studentGuid ||
        row?.StudentGuid ||
        row?.raw?.StudentGuid ||
        "",
      studentName:
        row?.studentName ||
        row?.StudentName ||
        row?.raw?.StudentName ||
        "",
      nationalId:
        row?.nationalId ||
        row?.NationalId ||
        row?.raw?.NationalId ||
        "",
      studentTel:
        row?.studentTel ||
        row?.StudentTel ||
        row?.raw?.StudentTel ||
        ""
    });

    setApprovalOpen(true);
  };

  const printApproval = (row) => {
    const orderGuid = row.orderGuid || row.guid || row.raw?.Guid || row.raw?.OrderGuid;
    if (!orderGuid) {
      showError("رقم الموافقة غير موجود للطباعة");
      return;
    }
    window.open(
      `${API_BASE_URL}/api/study-approval/print/${encodeURIComponent(orderGuid)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const commonDateColumn = {
    field: "orderDate",
    headerName: "التاريخ",
    minWidth: 150,
    align: "center",
    headerAlign: "center",
    valueFormatter: (params) => formatDateTime(
      params && typeof params === "object" && "value" in params ? params.value : params
    )
  };

  const commonRequestColumns = (extra = []) => [
    { field: "code", headerName: "كود", minWidth: 90, align: "center", headerAlign: "center" },
    commonDateColumn,
    { field: "studentName", headerName: "اسم الطالب", minWidth: 230, flex: 1, align: "center", headerAlign: "center" },
    { field: "studentTel", headerName: "رقم الجوال", minWidth: 140, align: "center", headerAlign: "center" },
    { field: "nationalId", headerName: "رقم الهوية", minWidth: 145, align: "center", headerAlign: "center" },
    ...extra
  ];

  const actionColumn = {
    field: "actions",
    headerName: "الإجراءات",
    minWidth: 135,
    sortable: false,
    filterable: false,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }) => (
      activeTab === "non-contract" ? (
        <Tooltip title="إرسال الاتفاقية">
          <Button
            size="small"
            variant="contained"
            onClick={() => sendAgreement(row)}
            disabled={sendingId === row.id}
            startIcon={
              sendingId === row.id
                ? <CircularProgress size={16} color="inherit" />
                : <SendIcon />
            }
            sx={{ backgroundColor: primaryColor, fontWeight: 900 }}
          >
            إرسال
          </Button>
        </Tooltip>
      ) : (
        <Stack direction="row" spacing={0.4}>
          <Tooltip title="عرض الطلب">
            <IconButton
              onClick={() => activeTab === "payment" ? openPayment(row) : openAdmission(row)}
              sx={{ color: accentColor }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          {activeTab === "admission" ? (
            <Tooltip title="طباعة طلب الالتحاق">
              <IconButton
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${API_BASE_URL}/api/my-requests/admission/${encodeURIComponent(row.code)}`,
                      { cache: "no-store" }
                    );
                    const result = await response.json().catch(() => null);
                    if (!response.ok) throw new Error(result?.error || result?.message || "تعذر تحميل بيانات طلب الالتحاق للطباعة");
                    printAdmission(result?.data || null);
                  } catch (printError) {
                    showError(printError?.message || "حدث خطأ أثناء تجهيز طلب الالتحاق للطباعة");
                  }
                }}
                sx={{ color: primaryColor }}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
          ) : activeTab === "payment" ? (
            <Tooltip title="طباعة طلب السداد">
              <IconButton onClick={() => loadAndPrintPayment(row)} sx={{ color: primaryColor }}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
          ) : null}

          {activeTab === "admission" ? (
          <Tooltip
            title={
              row.vipStatus || row.vipHint
                ? "الطالب موجود بالفعل ضمن عملاء VIP"
                : "تحويل إلى عميل VIP"
            }
          >
            <span>
              <IconButton
                onClick={() => openVipDialog(row)}
                disabled={Boolean(row.vipStatus || row.vipHint)}
                sx={{ color: primaryColor }}
              >
                <WorkspacePremiumIcon />
              </IconButton>
            </span>
          </Tooltip>
          ) : null}
        </Stack>
      )
    )
  };

  const nonContractColumns = [
    actionColumn,
    {
      field: "code",
      headerName: "كود",
      minWidth: 95,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "studentName",
      headerName: "اسم الطالب",
      minWidth: 220,
      flex: 1,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "studentTel",
      headerName: "رقم الجوال",
      minWidth: 140,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "nationalId",
      headerName: "رقم الهوية",
      minWidth: 140,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "diplomName",
      headerName: "الدبلوم / الدورة",
      minWidth: 300,
      flex: 1.4,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "remainingDays",
      headerName: "الأيام المتبقية",
      minWidth: 135,
      align: "center",
      headerAlign: "center",
      renderCell: ({ value }) => {
        const days = Number(value || 0);
        const color = days <= 3 ? "error" : days <= 7 ? "warning" : "success";

        return (
          <Chip
            size="small"
            color={color}
            variant="outlined"
            label={`${days} يوم`}
            sx={{ fontWeight: 900 }}
          />
        );
      }
    }
  ];


  const paymentColumns = [
    {
      ...actionColumn,
      renderCell: ({ row }) => (
        <Tooltip title="عرض طلب السداد">
          <IconButton
            onClick={() => openPayment(row)}
            sx={{ color: primaryColor }}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      )
    },
    {
      field: "code",
      headerName: "كود",
      minWidth: 95,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "orderDate",
      headerName: "التاريخ",
      minWidth: 155,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) =>
        formatDateTime(
          params && typeof params === "object" && "value" in params
            ? params.value
            : params
        )
    },
    {
      field: "studentName",
      headerName: "اسم الطالب",
      minWidth: 230,
      flex: 1,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "studentTel",
      headerName: "رقم الجوال",
      minWidth: 140,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "nationalId",
      headerName: "رقم الهوية",
      minWidth: 145,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "orderStatus",
      headerName: "حالة الطلب",
      minWidth: 140,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "accountNotes",
      headerName: "ملاحظات الحسابات",
      minWidth: 280,
      flex: 1.2,
      align: "center",
      headerAlign: "center"
    }
  ];

  const admissionColumns = [
    actionColumn,
    {
      field: "code",
      headerName: "كود",
      minWidth: 90,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "studentName",
      headerName: "اسم الطالب",
      minWidth: 230,
      flex: 1,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "studentTel",
      headerName: "رقم الجوال",
      minWidth: 135,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "nationalId",
      headerName: "رقم الهوية",
      minWidth: 145,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "branchName",
      headerName: "الفرع",
      minWidth: 270,
      flex: 1.2,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "orderStatus",
      headerName: "حالة الطلب",
      minWidth: 130,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "salesNotes",
      headerName: "ملاحظات المبيعات",
      minWidth: 230,
      flex: 1,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "vipHint",
      headerName: "تنبيه VIP",
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      renderCell: ({ value }) =>
        value ? (
          <Chip
            label={value}
            color={String(value).includes("غير مؤكد") ? "warning" : "primary"}
            sx={{ fontWeight: 900 }}
          />
        ) : null
    }
  ];

  const discountColumns = commonRequestColumns([
    { field: "discountName", headerName: "نوع الخصم", minWidth: 280, flex: 1, align: "center", headerAlign: "center" },
    { field: "orderStatus", headerName: "حالة الطلب", minWidth: 135, align: "center", headerAlign: "center" },
    { field: "accountNotes", headerName: "ملاحظات الحسابات", minWidth: 300, flex: 1.2, align: "center", headerAlign: "center" }
  ]);

  const refundColumns = commonRequestColumns([
    { field: "orderStatus", headerName: "حالة الطلب", minWidth: 140, align: "center", headerAlign: "center" },
    { field: "accountNotes", headerName: "ملاحظات الحسابات", minWidth: 320, flex: 1.3, align: "center", headerAlign: "center" }
  ]);

  const deregistrationColumns = [
    { field: "code", headerName: "كود", minWidth: 90, align: "center", headerAlign: "center" },
    { ...commonDateColumn, field: "actionDate" },
    { field: "studentName", headerName: "اسم الطالب", minWidth: 230, flex: 1, align: "center", headerAlign: "center" },
    { field: "studentTel", headerName: "رقم الجوال", minWidth: 140, align: "center", headerAlign: "center" },
    { field: "nationalId", headerName: "رقم الهوية", minWidth: 145, align: "center", headerAlign: "center" },
    { field: "orderStatus", headerName: "حالة الطلب", minWidth: 140, align: "center", headerAlign: "center" },
    { field: "accountNotes", headerName: "ملاحظات الحسابات", minWidth: 320, flex: 1.3, align: "center", headerAlign: "center" }
  ];

  const approvalColumns = [
    {
      field: "approvalActions",
      headerName: "الإجراءات",
      minWidth: 125,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.4}>
          <Tooltip title="تعديل الموافقة"><IconButton onClick={() => openApprovalEditor(row)} sx={{ color: accentColor }}><EditIcon /></IconButton></Tooltip>
          {/* <Tooltip title="طباعة الموافقة"><IconButton onClick={() => printApproval(row)} sx={{ color: primaryColor }}><PrintIcon /></IconButton></Tooltip> */}
        </Stack>
      )
    },
    ...commonRequestColumns([
      { field: "branchName", headerName: "فرع الدراسة", minWidth: 220, flex: 1, align: "center", headerAlign: "center" },
      { field: "sectorName", headerName: "القطاع", minWidth: 220, flex: 1, align: "center", headerAlign: "center" },
      { field: "diplomName", headerName: "الدبلوم / الدورة", minWidth: 240, flex: 1, align: "center", headerAlign: "center" },
      { field: "batchName", headerName: "الدفعة", minWidth: 130, align: "center", headerAlign: "center" },
      { field: "orderStatus", headerName: "الحالة", minWidth: 130, align: "center", headerAlign: "center" },
      { field: "accountNotes", headerName: "ملاحظات", minWidth: 230, flex: 1, align: "center", headerAlign: "center" }
    ])
  ];

  const otherInstitutesColumns = [
    {
      field: "traineeStatusActions",
      headerName: "الإجراءات",
      minWidth: 150,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) => {
        const recordId =
          row?.code ||
          row?.id ||
          row?.Id ||
          row?.ID ||
          "";

        const isSaving =
          String(savingTraineeNoteId) === String(recordId);

        return (
          <Tooltip title="إضافة أو تعديل موقف المتدرب">
            <span>
              <Button
                size="small"
                variant="contained"
                onClick={() => editTraineeStatusNote(row)}
                disabled={isSaving}
                startIcon={
                  isSaving
                    ? <CircularProgress size={16} color="inherit" />
                    : <NoteAddIcon />
                }
                sx={{
                  backgroundColor: primaryColor,
                  fontWeight: 900,
                  whiteSpace: "nowrap"
                }}
              >
                موقف المتدرب
              </Button>
            </span>
          </Tooltip>
        );
      }
    },
    { field: "code", headerName: "كود", minWidth: 80, align: "center", headerAlign: "center" },
    { field: "orderCode", headerName: "رقم الطلب", minWidth: 100, align: "center", headerAlign: "center" },
    { field: "regDocCode", headerName: "رقم الاستمارة", minWidth: 110, align: "center", headerAlign: "center" },
    { field: "studentName", headerName: "اسم الطالب", minWidth: 220, flex: 1, align: "center", headerAlign: "center" },
    { field: "nationalId", headerName: "رقم الهوية", minWidth: 140, align: "center", headerAlign: "center" },
    { field: "studentTel", headerName: "رقم الجوال", minWidth: 140, align: "center", headerAlign: "center" },
    { field: "branchName", headerName: "الفرع", minWidth: 220, flex: 1, align: "center", headerAlign: "center" },
    { field: "sellerName", headerName: "مسؤول التسجيل", minWidth: 170, align: "center", headerAlign: "center" },
    { field: "otherInstituteName", headerName: "المعهد الآخر", minWidth: 190, align: "center", headerAlign: "center" },
    { field: "isStillRegisteredText", headerName: "هل تم طي قيده؟", minWidth: 160, align: "center", headerAlign: "center" },
    { field: "notes", headerName: "ملاحظات", minWidth: 230, flex: 1, align: "center", headerAlign: "center" },
    { field: "statusUpdateNote", headerName: "ملاحظة طي القيد", minWidth: 230, flex: 1, align: "center", headerAlign: "center" },
    {
      field: "traineeStatusNote",
      headerName: "موقف المتدرب",
      minWidth: 300,
      flex: 1.4,
      align: "center",
      headerAlign: "center",
      renderCell: ({ value }) => (
        <Tooltip title={value || "لا توجد ملاحظة"} arrow>
          <Typography
            sx={{
              width: "100%",
              fontWeight: 800,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "center"
            }}
          >
            {value || "-"}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: "traineeStatusUpdatedBy",
      headerName: "آخر تحديث بواسطة",
      minWidth: 180,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "traineeStatusUpdatedAt",
      headerName: "تاريخ موقف المتدرب",
      minWidth: 180,
      align: "center",
      headerAlign: "center",
      valueFormatter: (p) =>
        formatDateTime(p?.value ?? p)
    },
    { field: "createdAt", headerName: "تاريخ التسجيل", minWidth: 150, align: "center", headerAlign: "center", valueFormatter: (p) => formatDateTime(p?.value ?? p) },
    { field: "statusUpdatedAt", headerName: "تاريخ تحديث الحالة", minWidth: 165, align: "center", headerAlign: "center", valueFormatter: (p) => formatDateTime(p?.value ?? p) }
  ];

  const columns =
    activeTab === "admission" ? admissionColumns :
    activeTab === "payment" ? paymentColumns :
    activeTab === "discount" ? discountColumns :
    activeTab === "refund" ? refundColumns :
    activeTab === "de-registration" ? deregistrationColumns :
    activeTab === "approvals" ? approvalColumns :
    activeTab === "other-institutes" ? otherInstitutesColumns :
    nonContractColumns;

  const selectedTab = tabs.find((item) => item.key === activeTab);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fcfa 0%, #eef8f3 100%)",
        fontFamily: "Cairo, Arial, sans-serif"
      }}
    >
      <Sidebar />

      <Box
        sx={{
          ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          width: { xs: "100%", md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          p: { xs: 1.2, md: 2.2 },
          boxSizing: "border-box"
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid rgba(5,117,70,0.14)",
            boxShadow: "0 18px 45px rgba(5,117,70,0.10)"
          }}
        >
          <Box
            dir="rtl"
            sx={{
              px: 3,
              py: 2,
              color: "white",
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 950 }}>
                قائمة طلباتي
              </Typography>
              <Typography sx={{ opacity: 0.86, fontSize: "0.85rem" }}>
                متابعة طلبات التسجيل والسداد والخصم والاسترداد
              </Typography>
            </Box>

            <Chip
              label={`الإجمالي: ${filteredRows.length}`}
              sx={{ backgroundColor: "white", color: primaryDark, fontWeight: 950 }}
            />
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            dir="rtl"
            sx={{
              borderBottom: "1px solid rgba(5,117,70,0.12)",
              "& .MuiTab-root": {
                minHeight: 62,
                fontFamily: "Cairo",
                fontWeight: 850,
                gap: 0.8
              },
              "& .MuiTabs-indicator": {
                height: 4,
                backgroundColor: accentColor
              }
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.key}
                value={tab.key}
                icon={tab.icon}
                iconPosition="start"
                label={tab.label}
              />
            ))}
          </Tabs>

          <Box sx={{ p: 2 }}>
            {true ? (
              <>
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={1.2}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", lg: "center" }}
                  sx={{ mb: 1.6 }}
                >
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                    <TextField
                      size="small"
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="بحث بالاسم أو الهوية أو الجوال..."
                      sx={{ width: { xs: "100%", md: 390 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />

                    {dateFilteredTabs.has(activeTab) ? (
                      <>
                        <TextField
                          size="small"
                          type="date"
                          label="من تاريخ"
                          value={fromDate}
                          onChange={(event) => setFromDate(event.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={showAll}
                          inputProps={{ max: toDate || undefined }}
                        />
                        <TextField
                          size="small"
                          type="date"
                          label="إلى تاريخ"
                          value={toDate}
                          onChange={(event) => setToDate(event.target.value)}
                          InputLabelProps={{ shrink: true }}
                          disabled={showAll}
                          inputProps={{ min: fromDate || undefined }}
                        />
                        <FormControlLabel
                          control={<Checkbox checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />}
                          label="عرض الكل"
                          sx={{ mr: 0.5, whiteSpace: "nowrap" }}
                        />
                      </>
                    ) : null}
                  </Stack>

                  <Button
                    variant="contained"
                    onClick={loadData}
                    disabled={loading}
                    startIcon={
                      loading
                        ? <CircularProgress size={18} color="inherit" />
                        : <RefreshIcon />
                    }
                    sx={{ minWidth: 135, backgroundColor: primaryColor, fontWeight: 900 }}
                  >
                    عرض
                  </Button>
                </Stack>

                {error ? <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert> : null}

                <Box sx={{ height: 590, width: "100%", direction: "ltr" }}>
                  <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    loading={loading}
                    disableRowSelectionOnClick
                    onRowDoubleClick={(params) => {
                      if (activeTab === "admission") {
                        openAdmission(params.row);
                      } else if (activeTab === "payment") {
                        openPayment(params.row);
                      } else if (activeTab === "approvals") {
                        openApprovalEditor(params.row);
                      }
                    }}
                    onRowContextMenu={["non-contract", "admission", "payment"].includes(activeTab) ? handleRowContextMenu : undefined}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 25, page: 0 }
                      }
                    }}
                    localeText={{
                      noRowsLabel: `لا توجد بيانات في ${selectedTab?.label || "هذا التبويب"}${showAll ? "" : " خلال الفترة المحددة"}`
                    }}
                    sx={{
                      borderRadius: 3,
                      backgroundColor: "#fff",
                      "& .MuiDataGrid-columnHeaders": {
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
                        color: "#fff"
                      },
                      "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 950 },
                      "& .MuiDataGrid-row:nth-of-type(even)": { backgroundColor: "#fff8ef" },
                      "& .MuiDataGrid-row:hover": { backgroundColor: "#eaf7f0" },
                      "& .MuiDataGrid-cell": {
                        fontFamily: "Cairo",
                        fontWeight: 700
                      }
                    }}
                  />
                </Box>
              </>
            ) : (
              <Paper
                variant="outlined"
                dir="ltr"
                sx={{
                  minHeight: 450,
                  borderRadius: 3,
                  borderStyle: "dashed",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 950 }}>
                  {selectedTab?.label}
                </Typography>
                <Typography color="text.secondary">
                  سيتم تفعيل هذا التبويب في الخطوة التالية.
                </Typography>
              </Paper>
            )}
          </Box>
        </Paper>
      </Box>

      <Menu
        open={contextMenu !== null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {activeTab === "non-contract" ? (
          <MenuItem
            onClick={() => {
              const row = contextRow;
              closeContextMenu();
              if (row) sendAgreement(row);
            }}
          >
            <SendIcon sx={{ ml: 1, color: primaryColor }} />
            إرسال الاتفاقية
          </MenuItem>
        ) : activeTab === "payment" ? (
          <Box>
            <MenuItem
              onClick={() => {
                const row = contextRow;
                closeContextMenu();
                if (row) openPayment(row);
              }}
            >
              <VisibilityIcon sx={{ ml: 1, color: primaryColor }} />
              عرض طلب السداد
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                const row = contextRow;
                closeContextMenu();
                if (row) loadAndPrintPayment(row);
              }}
            >
              <PrintIcon sx={{ ml: 1, color: primaryColor }} />
              طباعة طلب السداد
            </MenuItem>
          </Box>
        ) : (
          <Box>
            <MenuItem
              onClick={() => {
                const row = contextRow;
                closeContextMenu();
                if (row) openAdmission(row);
              }}
            >
              <VisibilityIcon sx={{ ml: 1, color: accentColor }} />
              عرض الطلب
            </MenuItem>

            <Divider />

            <MenuItem
              disabled={Boolean(contextRow?.vipStatus || contextRow?.vipHint)}
              onClick={() => {
                const row = contextRow;
                closeContextMenu();
                if (row) openVipDialog(row);
              }}
            >
              <WorkspacePremiumIcon sx={{ ml: 1, color: primaryColor }} />
              {contextRow?.vipStatus || contextRow?.vipHint
                ? "العميل موجود ضمن VIP"
                : "تحويل إلى عميل VIP"}
            </MenuItem>
          </Box>
        )}
      </Menu>

      <StudyApprovalDialog
        open={approvalOpen}
        student={approvalRow}
        apiBaseUrl={API_BASE_URL}
        editMode={Boolean(approvalRow?.isEditMode)}
        orderGuid={
          approvalRow?.approvalOrderGuid ||
          approvalRow?.orderGuid ||
          ""
        }
        orderCode={
          approvalRow?.approvalOrderCode ||
          approvalRow?.orderCode ||
          ""
        }
        onClose={() => {
          setApprovalOpen(false);
          setApprovalRow(null);
        }}
        onSaved={async (result) => {
          setApprovalOpen(false);
          setApprovalRow(null);

          await showSuccess(
            result?.message ||
            "تم تعديل الموافقة الدراسية بنجاح"
          );

          await loadData();
        }}
      />

      <AdmissionDetailsDialog
        open={detailsOpen}
        data={detailsData}
        loading={detailsLoading}
        error={detailsError}
        onPrint={printAdmission}
        onClose={() => setDetailsOpen(false)}
      />


      <PaymentDetailsDialog
        open={paymentDetailsOpen}
        data={paymentDetailsData}
        loading={paymentDetailsLoading}
        error={paymentDetailsError}
        onPrint={printPayment}
        onClose={() => {
          if (paymentDetailsLoading) return;
          setPaymentDetailsOpen(false);
          setPaymentDetailsData(null);
          setPaymentDetailsError("");
        }}
      />

      <ConvertVipDialog
        open={vipOpen}
        row={vipRow}
        userName={userFullName}
        saving={vipSaving}
        error={vipError}
        onClose={() => {
          if (vipSaving) return;
          setVipOpen(false);
          setVipRow(null);
          setVipError("");
        }}
        onConfirm={convertToVip}
      />
    </Box>
  );
}