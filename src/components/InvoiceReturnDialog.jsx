import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
import * as uiLayout from './common/uiLayout';
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";
import SaveIcon from "@mui/icons-material/Save";
import Swal from "sweetalert2";

const primaryColor = "#057546";
const accentColor = "#ae1e21";
// Always-visible focus-green outline (never hover/focus-only) for every field
// and the dialog frame itself — matches the reference styling on the Home page.
const FOCUS_BORDER_SX = (theme) => (theme.palette.mode !== "dark" ? {} : {
  "& .MuiDialog-paper": { border: "1px solid #67C99D" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" }
});

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = (user) =>
  user?.userGuid ||
  user?.guid ||
  user?.Guid ||
  user?.USER_GUID ||
  user?.USER_GUID____ ||
  "";

const readValue = (object, ...keys) => {
  for (const key of keys) {
    const value = object?.[key];

    if (value !== undefined && value !== null && value !== "")
      return value;
  }

  return "";
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const warning = (text) =>
  Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });

export default function InvoiceReturnDialog({
  open,
  student,
  apiBaseUrl,
  onClose,
  onSaved
}) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`);
  const isCompact = isPhone || isTablet;

  const getResponsiveSwalOptions = () => {
    if (!isCompact) return {};

    return {
      width: isPhone ? "82vw" : "420px",
      padding: isPhone ? "0.65rem" : "0.85rem",
      customClass: {
        popup: "sstli-invoice-return-swal",
        icon: "sstli-invoice-return-swal-icon",
        title: "sstli-invoice-return-swal-title",
        htmlContainer: "sstli-invoice-return-swal-text",
        actions: "sstli-invoice-return-swal-actions",
        confirmButton: "sstli-invoice-return-swal-confirm",
        cancelButton: "sstli-invoice-return-swal-cancel"
      }
    };
  };

  const userGuid = useMemo(
    () => getUserGuid(getCurrentUser()),
    []
  );

  const studentName = readValue(
    student,
    "studentName",
    "StudentName"
  );

  const nationalId = readValue(
    student,
    "nationalId",
    "NationalId"
  );

  const studentTel = readValue(
    student,
    "studentTel",
    "StudentTel",
    "tel"
  );

  const accountGuid = readValue(
    student,
    "accountGuid",
    "AccountGuid"
  );

  const [invoices, setInvoices] = useState([]);
  const [selectedBillGuid, setSelectedBillGuid] = useState("");
  const [context, setContext] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [selectedDocGuid, setSelectedDocGuid] = useState("");
  const [documentInfo, setDocumentInfo] = useState(null);

  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");

  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedInvoice = invoices.find(
    (item) => item.billGuid === selectedBillGuid
  );

  const showWarning = (message) =>
    Swal.fire({
      ...getResponsiveSwalOptions(),
      icon: "warning",
      title: "تنبيه",
      text: message,
      confirmButtonText: "حسناً",
      confirmButtonColor: accentColor
    });

  const totals = useMemo(() => {
    const total = items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.cost || 0),
      0
    );

    const tax = items.reduce(
      (sum, item) => sum + Number(item.tax || 0),
      0
    );

    return {
      total: Number(total.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      subTotal: Number((total + tax).toFixed(2))
    };
  }, [items]);

  const loadInvoices = async () => {
    if (!accountGuid || !userGuid) return;

    try {
      setLoadingInvoices(true);
      setError("");

      const params = new URLSearchParams({
        accountGuid,
        userGuid
      });

      const response = await fetch(
        `${apiBaseUrl}/api/invoice-returns/invoices?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تحميل فواتير الطالب"
        );
      }

      const data = Array.isArray(result?.data)
        ? result.data
        : [];

      setInvoices(data);

      if (data.length === 0) {
        setError(
          result?.message ||
            "لا تتوفر فواتير خاصة بالطالب لعمل مرتجع"
        );
      }
    } catch (e) {
      setInvoices([]);
      setError(
        e.message ||
          "حدث خطأ أثناء تحميل فواتير الطالب"
      );
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadContext = async () => {
    if (!selectedInvoice || !userGuid) return;

    if (selectedInvoice.isReturned) {
      setContext(null);
      setItems([]);

      return showWarning(
        "تم عمل استرجاع للفاتورة بالفعل، ويمكن عرض المرتجع من كشف الحساب"
      );
    }

    try {
      setLoadingContext(true);
      setError("");
      setContext(null);
      setItems([]);
      setSelectedDocGuid("");
      setDocuments([]);

      const params = new URLSearchParams({
        billGuid: selectedInvoice.billGuid,
        billCode: selectedInvoice.code,
        userGuid
      });

      const response = await fetch(
        `${apiBaseUrl}/api/invoice-returns/context?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تجهيز مرتجع الفاتورة"
        );
      }

      const data = result?.data || null;

      setContext(data);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(
        e.message ||
          "حدث خطأ أثناء تجهيز مرتجع الفاتورة"
      );
    } finally {
      setLoadingContext(false);
    }
  };

  const loadDocuments = async () => {
    if (!context?.originalBranchGuid || !userGuid) return;

    try {
      setLoadingDocuments(true);
      setError("");

      const params = new URLSearchParams({
        userGuid,
        branchGuid: context.originalBranchGuid
      });

      const response = await fetch(
        `${apiBaseUrl}/api/invoice-returns/documents?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تحميل دفاتر مرتجع الفاتورة"
        );
      }

      setDocuments(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (e) {
      setDocuments([]);
      setError(
        e.message ||
          "حدث خطأ أثناء تحميل دفاتر مرتجع الفاتورة"
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    setInvoices([]);
    setSelectedBillGuid("");
    setContext(null);
    setDocuments([]);
    setSelectedDocGuid("");
    setDocumentInfo(null);
    setItems([]);
    setNotes("");
    setReturnDate(new Date().toISOString().slice(0, 16));
    setError("");

    loadInvoices();
  }, [open, accountGuid, userGuid]);

  useEffect(() => {
    if (!selectedBillGuid) return;
    loadContext();
  }, [selectedBillGuid]);

  useEffect(() => {
    if (!context?.originalBranchGuid) return;
    loadDocuments();
  }, [context?.originalBranchGuid]);

  useEffect(() => {
    loadDocumentInfo(selectedDocGuid);
  }, [selectedDocGuid]);

  const loadDocumentInfo = async (docGuid) => {
    if (!docGuid) {
      setDocumentInfo(null);
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${apiBaseUrl}/api/invoice-returns/document-info?docGuid=${encodeURIComponent(
          docGuid
        )}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر قراءة بيانات دفتر مرتجع الفاتورة"
        );
      }

      setDocumentInfo(result?.data || null);
    } catch (e) {
      setDocumentInfo(null);
      setError(
        e.message ||
          "حدث خطأ أثناء قراءة بيانات دفتر مرتجع الفاتورة"
      );
    }
  };

  const updateItem = (index, field, value) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const nextItem = {
          ...item,
          [field]: Math.abs(Number(value || 0))
        };

        if (
          field === "quantity" ||
          field === "cost" ||
          field === "taxRate"
        ) {
          let quantity = Number(nextItem.quantity || 0);

          if (quantity <= 0) quantity = 1;

          const cost = Number(nextItem.cost || 0);
          const taxRate = Number(nextItem.taxRate || 0);

          const beforeTax = Number(
            (quantity * cost).toFixed(2)
          );

          const tax = Number(
            (
              beforeTax *
              (taxRate / 100)
            ).toFixed(2)
          );

          nextItem.quantity = quantity;
          nextItem.tax = tax;
          nextItem.subTotal = Number(
            (beforeTax + tax).toFixed(2)
          );
        }

        return nextItem;
      })
    );
  };

  const save = async () => {
    if (!selectedInvoice) {
      return showWarning("برجاء اختيار الفاتورة المراد عمل مرتجع لها");
    }

    if (!selectedDocGuid) {
      return showWarning("برجاء اختيار نوع المستند");
    }

    if (!context?.salesManGuid) {
      return showWarning("برجاء اختيار محصل الفاتورة");
    }

    if (!notes.trim()) {
      return showWarning("لا يمكن حفظ مرتجع المبيعات بدون ملاحظات");
    }

    if (items.length === 0) {
      return showWarning("لا توجد بنود بالفاتورة المختارة");
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${apiBaseUrl}/api/invoice-returns`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            userGuid,
            accountGuid,
            billGuid: selectedInvoice.billGuid,
            billCode: selectedInvoice.code,
            docGuid: selectedDocGuid,
            salesManGuid: context.salesManGuid,
            returnDate: new Date(returnDate).toISOString(),
            notes: notes.trim(),
            isUse: true,
            items: items.map((item) => ({
              diplomGuid: item.diplomGuid,
              unit: item.unit || "",
              quantity: Number(item.quantity || 0),
              cost: Number(item.cost || 0),
              taxRate: Number(item.taxRate || 0),
              tax: Number(item.tax || 0),
              subTotal: Number(item.subTotal || 0),
              diplomType: Number(item.diplomType || 0)
            }))
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر حفظ مرتجع الفاتورة"
        );
      }

      await Swal.fire({
        ...getResponsiveSwalOptions(),
        icon: "success",
        title: "تم الحفظ",
        text:
          result?.message ||
          "تم حفظ مرتجع المبيعات بنجاح",
        confirmButtonColor: primaryColor
      });

      onSaved?.(result);
    } catch (e) {
      setError(
        e.message ||
          "حدث خطأ أثناء حفظ مرتجع الفاتورة"
      );
    } finally {
      setSaving(false);
    }
  };

  // Lazy-mount guard: this dialog is mounted eagerly (but closed) as soon
  // as the parent page loads, so skip building its JSX until it has
  // actually been opened once. Once opened, later closes still render
  // normally so the MUI exit transition keeps working.
  const hasOpenedRef = useRef(open);
  if (open) hasOpenedRef.current = true;
  if (!hasOpenedRef.current) return null;

  return (
    <>
      <style>
        {`
          @media screen {
            .sstli-invoice-return-swal {
              max-width: 420px !important;
              border-radius: 14px !important;
              font-family: Cairo, Arial, sans-serif !important;
            }
            .sstli-invoice-return-swal-icon {
              width: 3.4em !important;
              height: 3.4em !important;
              margin: 0.6em auto 0.25em !important;
            }
            .sstli-invoice-return-swal-icon .swal2-icon-content {
              font-size: 2.3em !important;
            }
            .sstli-invoice-return-swal-title {
              font-size: 0.95rem !important;
              line-height: 1.2 !important;
              padding-top: 0.2em !important;
            }
            .sstli-invoice-return-swal-text {
              font-size: 0.68rem !important;
              line-height: 1.4 !important;
              padding: 0 0.75em !important;
            }
            .sstli-invoice-return-swal-actions {
              margin-top: 0.65em !important;
            }
            .sstli-invoice-return-swal-confirm,
            .sstli-invoice-return-swal-cancel {
              min-width: 76px !important;
              min-height: 31px !important;
              padding: 0.38rem 0.75rem !important;
              margin: 0 !important;
              font-size: 0.66rem !important;
              border-radius: 8px !important;
              font-weight: 900 !important;
            }
          }

          @media (max-width: 599px) {
            .sstli-invoice-return-swal {
              width: 82vw !important;
              max-width: 300px !important;
              border-radius: 12px !important;
            }
            .sstli-invoice-return-swal-icon {
              width: 3em !important;
              height: 3em !important;
              margin: 0.5em auto 0.2em !important;
            }
            .sstli-invoice-return-swal-icon .swal2-icon-content {
              font-size: 2em !important;
            }
            .sstli-invoice-return-swal-title {
              font-size: 0.8rem !important;
            }
            .sstli-invoice-return-swal-text {
              font-size: 0.57rem !important;
              padding: 0 0.5em !important;
            }
            .sstli-invoice-return-swal-confirm,
            .sstli-invoice-return-swal-cancel {
              min-width: 64px !important;
              min-height: 28px !important;
              padding: 0.32rem 0.55rem !important;
              font-size: 0.56rem !important;
            }
          }
        `}
      </style>

      <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isPhone}
      dir="rtl"
      sx={uiLayout.withUiSx({
        "& .MuiDialog-container": {
          pt: isPhone ? "58px" : isTablet ? "64px" : 1.5,
          px: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          pb: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          alignItems: isPhone ? "stretch" : "center"
        }
      }, uiLayout.dialogLayoutSx, FOCUS_BORDER_SX)}
      PaperProps={{
        sx: {
          width: isPhone ? "100vw" : isTablet ? "96vw" : undefined,
          maxWidth: isPhone ? "100vw" : isTablet ? "1180px" : undefined,
          height: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "90vh",
          maxHeight: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "90vh",
          minHeight: 0,
          m: 0,
          borderRadius: isPhone ? 0 : isTablet ? 2 : 3,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: isCompact ? 0.35 : 1,
          color: primaryColor,
          fontWeight: 950,
          py: isPhone ? 0.55 : isTablet ? 0.75 : 1.5,
          px: isPhone ? 0.65 : isTablet ? 0.9 : 2,
          fontSize: isPhone ? "0.75rem" : isTablet ? "0.8rem" : undefined,
          flexShrink: 0
        }}
      >
        <ChangeCircleIcon sx={{ fontSize: isPhone ? 16 : isTablet ? 19 : undefined }} />
        مرتجع فاتورة
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: isPhone ? 0.3 : isTablet ? 0.55 : 3,
          overflowY: "auto",
          flex: 1,
          minHeight: 0,

          "& .MuiInputLabel-root": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          },
          "& .MuiInputBase-input, & .MuiSelect-select": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            py: isPhone ? 0.52 : isTablet ? 0.67 : undefined
          },

          "& .MuiSelect-select": {
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            pr: isPhone ? "24px !important" : undefined
          },
          "& .MuiOutlinedInput-root": {
            minHeight: isPhone ? 31 : isTablet ? 35 : undefined,
            borderRadius: isCompact ? 1.25 : undefined
          }
        }}
      >
        {error ? (
          <Alert
            severity="error"
            sx={{
              mb: isCompact ? 0.35 : 2,
              py: isCompact ? 0.15 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            }}
          >
            {error}
          </Alert>
        ) : null}

        <Stack spacing={isPhone ? 0.45 : isTablet ? 0.65 : 2}>
          <Paper
            variant="outlined"
            sx={(theme) => ({
              p: isPhone ? 0.4 : isTablet ? 0.6 : 2,
              borderRadius: isCompact ? 1.4 : undefined,
              borderColor: theme.palette.mode === "dark" ? "#67C99D" : undefined
            })}
          >
            <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 1.5}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="اسم الطالب"
                  value={studentName || ""}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid item xs={12} sm={3} md={4}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="رقم الهوية"
                  value={nationalId || ""}
                  InputProps={{ readOnly: true }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              </Grid>

              <Grid item xs={12} sm={3} md={4}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="رقم الجوال"
                  value={studentTel || ""}
                  InputProps={{ readOnly: true }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 2}>
            <Grid item xs={12} sm={4} md={4}>
              <FormControl sx={uiLayout.formFieldSx}
                fullWidth
                disabled={loadingInvoices}
              >
                <InputLabel>الفاتورة المراد استرجاعها</InputLabel>

                <Select
                  value={selectedBillGuid}
                  label="الفاتورة المراد استرجاعها"
                  onChange={(event) =>
                    setSelectedBillGuid(event.target.value)
                  }
                  renderValue={(value) => {
                    const invoice = invoices.find(
                      (item) => item.billGuid === value
                    );

                    if (!invoice) return "";

                    return isCompact
                      ? `رقم ${invoice.code} - ${invoice.documentType || ""}`
                      : `رقم ${invoice.code} — ${invoice.date} — ${invoice.documentType || ""}`;
                  }}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "right"
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "right"
                    },
                    MenuListProps: {
                      dense: true,
                      sx: {
                        p: isPhone ? 0.25 : isTablet ? 0.35 : 0.75
                      }
                    },
                    PaperProps: {
                      sx: {
                        width: isPhone
                          ? "calc(100vw - 16px)"
                          : isTablet
                            ? "min(620px, calc(100vw - 32px))"
                            : undefined,
                        maxWidth: isPhone
                          ? "calc(100vw - 16px)"
                          : isTablet
                            ? "calc(100vw - 32px)"
                            : undefined,
                        maxHeight: isPhone ? 210 : isTablet ? 260 : 360,
                        mt: 0.35,
                        borderRadius: isCompact ? 1.35 : 2,
                        overflowX: "hidden",
                        boxShadow: "0 10px 28px rgba(31,45,61,0.18)",

                       "& .MuiMenuItem-root": {
  minHeight: isPhone ? 38 : isTablet ? 44 : 46,

  py: isPhone ? 0.4 : isTablet ? 0.5 : 0.75,

  pl: isPhone ? 2 : isTablet ? 2.5 : 3,
  pr: isPhone ? 0.65 : isTablet ? 0.85 : 1.5,

  borderRadius: isCompact ? 1 : 0,
  mb: isCompact ? 0.18 : 0,
  alignItems: "stretch",
  whiteSpace: "normal",
}
                      }
                    }
                  }}
                >
                  {invoices.map((invoice) => (
                    <MenuItem
                      key={invoice.billGuid}
                      value={invoice.billGuid}
                      disabled={invoice.isReturned}
                    >
                      <Box
                        sx={{
                          width: "100%",
                          minWidth: 0,
                          display: "grid",
                          gridTemplateColumns: isPhone
                            ? "52px minmax(0,1fr)"
                            : isTablet
                              ? "64px minmax(0,1fr) auto"
                              : "auto",
                          gap: isCompact ? 0.5 : 0,
                          alignItems: "center"
                        }}
                      >
                        {isCompact ? (
                          <>
                            <Typography
                              sx={{
                                fontSize: isPhone ? "0.75rem" : "0.75rem",
                                fontWeight: 1000,
                                color: primaryColor,
                                whiteSpace: "nowrap"
                              }}
                            >
                              #{invoice.code}
                            </Typography>

                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontSize: isPhone ? "0.75rem" : "0.75rem",
                                  fontWeight: 900,
                                  color: "#24364b",
                                  lineHeight: 1.15,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                {invoice.documentType || "فاتورة"}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.08,
                                  fontSize: isPhone ? "0.75rem" : "0.75rem",
                                  color: "#6f8a81",
                                  lineHeight: 1.1,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                {invoice.date || "-"}
                                {invoice.isReturned ? " • تم استرجاعها" : ""}
                              </Typography>
                            </Box>

                            {isTablet && (
                              <Typography
                                sx={{
                                  fontSize: "0.75rem",
                                  fontWeight: 900,
                                  color: invoice.isReturned
                                    ? accentColor
                                    : primaryColor,
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {invoice.isReturned ? "مسترجعة" : "متاحة"}
                              </Typography>
                            )}
                          </>
                        ) : (
                          <>
                            رقم {invoice.code} — {invoice.date} —{" "}
                            {invoice.documentType}
                            {invoice.isReturned
                              ? " — تم استرجاعها"
                              : ""}
                          </>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={4}>
              <TextField sx={uiLayout.formFieldSx}
                fullWidth
                type="datetime-local"
                label="التاريخ"
                value={returnDate}
                onChange={(event) =>
                  setReturnDate(event.target.value)
                }
                InputLabelProps={{ shrink: true }}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </Grid>

            <Grid item xs={12} sm={4} md={4}>
              <FormControl sx={uiLayout.formFieldSx}
                fullWidth
                disabled={
                  loadingDocuments ||
                  !context?.originalBranchGuid
                }
              >
                <InputLabel>نوع المستند</InputLabel>

                <Select
                  value={selectedDocGuid}
                  label="نوع المستند"
                  onChange={(event) =>
                    setSelectedDocGuid(event.target.value)
                  }
                  MenuProps={{
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "right"
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "right"
                    },
                    MenuListProps: {
                      dense: true,
                      sx: { p: isCompact ? 0.25 : 0.75 }
                    },
                    PaperProps: {
                      sx: {
                        width: isPhone
                          ? "min(260px, calc(100vw - 20px))"
                          : isTablet
                            ? "min(360px, calc(100vw - 32px))"
                            : undefined,
                        maxHeight: isPhone ? 175 : isTablet ? 220 : 320,
                        mt: 0.35,
                        borderRadius: isCompact ? 1.25 : 2,
                        boxShadow: "0 10px 26px rgba(31,45,61,0.16)",

                        "& .MuiMenuItem-root": {
                          minHeight: isPhone ? 30 : isTablet ? 34 : 40,
                          py: isPhone ? 0.35 : isTablet ? 0.48 : 0.75,
                          px: isPhone ? 0.65 : isTablet ? 0.85 : 1.5,
                          borderRadius: isCompact ? 0.9 : 0,
                          mb: isCompact ? 0.15 : 0,
                          fontSize: isPhone ? "0.48rem" : isTablet ? "0.56rem" : "0.875rem",
                          fontWeight: 850,
                          lineHeight: 1.15,
                          whiteSpace: "normal"
                        }
                      }
                    }
                  }}
                >
                  {documents.map((document) => (
                    <MenuItem
                      key={document.guid}
                      value={document.guid}
                    >
                      {document.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loadingInvoices || loadingContext ? (
            <Box sx={{ py: isPhone ? 2.5 : isTablet ? 3.5 : 6, textAlign: "center" }}>
              <CircularProgress />
            </Box>
          ) : null}

          {context ? (
            <>
              <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 2}>
                <Grid item xs={12} sm={6} md={6}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    label="الفرع"
                    value={
                      documentInfo?.branchName ||
                      ""
                    }
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={6}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    label="المحصل"
                    value={context.salesManName || ""}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                fullWidth
                multiline
                minRows={isPhone ? 2 : isTablet ? 2 : 3}
                label="ملاحظات"
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
              />

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={uiLayout.withUiSx({
                  borderRadius: isCompact ? 1.3 : undefined,
                  overflowX: "auto",

                  "& .MuiTableCell-root": {
                    py: isPhone ? 0.4 : isTablet ? 0.55 : undefined,
                    px: isPhone ? 0.28 : isTablet ? 0.45 : undefined,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                    whiteSpace: "nowrap"
                  },

                  "& .MuiTableHead-root .MuiTableCell-root": {
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                    lineHeight: 1.05
                  },

                  "& .MuiTextField-root": {
                    width: isPhone ? "54px !important" : isTablet ? "72px !important" : undefined
                  },

                  "& .MuiOutlinedInput-root": {
                    minHeight: isPhone ? 27 : isTablet ? 31 : undefined
                  },

                  "& .MuiInputBase-input": {
                    px: isPhone ? 0.25 : isTablet ? 0.4 : undefined,
                    py: isPhone ? 0.35 : isTablet ? 0.45 : undefined,
                    fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                  }
                }, uiLayout.tableContainerSx)}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{ backgroundColor: (theme) => theme.palette.mode === "dark" ? "rgba(237,137,54,.18)" : "#f7d38a" }}
                    >
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 950 }}
                      >
                        البيان
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 950,
                          display: isPhone ? "none" : "table-cell"
                        }}
                      >
                        الوحدة
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: 950 }}
                      >
                        الكمية
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: 950 }}
                      >
                        التكلفة
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: 950 }}
                      >
                        الضريبة %
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 950,
                          display: isPhone ? "none" : "table-cell"
                        }}
                      >
                        الضريبة
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{ fontWeight: 950 }}
                      >
                        الصافي
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow
                        key={`${item.diplomGuid}-${index}`}
                      >
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 850,
                            maxWidth: isPhone ? 110 : isTablet ? 180 : undefined,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {item.name}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{ display: isPhone ? "none" : "table-cell" }}
                        >
                          {item.unit}
                        </TableCell>

                        <TableCell align="center">
                          <TextField InputLabelProps={{ shrink: true }}
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "quantity",
                                event.target.value
                              )
                            }
                            inputProps={{
                              min: 1,
                              step: 1,
                              style: {
                                textAlign: "center"
                              , direction: "ltr", unicodeBidi: "isolate" }
                            , dir: "ltr" }}
                            sx={uiLayout.withUiSx({ width: 95 }, uiLayout.formFieldSx)}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <TextField InputLabelProps={{ shrink: true }}
                            size="small"
                            type="number"
                            value={item.cost}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "cost",
                                event.target.value
                              )
                            }
                            inputProps={{
                              min: 0,
                              step: "0.01",
                              style: {
                                textAlign: "center"
                              , direction: "ltr", unicodeBidi: "isolate" }
                            , dir: "ltr" }}
                            sx={uiLayout.withUiSx({ width: 120 }, uiLayout.formFieldSx)}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <TextField InputLabelProps={{ shrink: true }}
                            size="small"
                            type="number"
                            value={item.taxRate}
                            onChange={(event) =>
                              updateItem(
                                index,
                                "taxRate",
                                event.target.value
                              )
                            }
                            inputProps={{
                              min: 0,
                              step: "0.01",
                              style: {
                                textAlign: "center"
                              , direction: "ltr", unicodeBidi: "isolate" }
                            , dir: "ltr" }}
                            sx={uiLayout.withUiSx({ width: 100 }, uiLayout.formFieldSx)}
                          />
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{ display: isPhone ? "none" : "table-cell" }}
                        >
                          {money(item.tax)}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{ fontWeight: 900 }}
                        >
                          {money(item.subTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 2}>
                <Grid item xs={4} sm={4} md={4}>
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      p: isPhone ? 0.45 : isTablet ? 0.65 : 2,
                      minHeight: isPhone ? 54 : isTablet ? 60 : undefined,
                      borderRadius: isCompact ? 1.3 : undefined,
                      textAlign: "center",
                      borderColor: theme.palette.mode === "dark" ? "#67C99D" : undefined
                    })}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined }}>
                      الإجمالي
                    </Typography>

                    <Typography
                      sx={{
                        color: "#d71920",
                        fontSize: isPhone ? 14 : isTablet ? 17 : 25,
                        fontWeight: 950
                      }}
                    >
                      {money(totals.total)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4} sm={4} md={4}>
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      p: isPhone ? 0.45 : isTablet ? 0.65 : 2,
                      minHeight: isPhone ? 54 : isTablet ? 60 : undefined,
                      borderRadius: isCompact ? 1.3 : undefined,
                      textAlign: "center",
                      borderColor: theme.palette.mode === "dark" ? "#67C99D" : undefined
                    })}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined }}>
                      الضريبة
                    </Typography>

                    <Typography
                      sx={{
                        color: "#d71920",
                        fontSize: isPhone ? 14 : isTablet ? 17 : 25,
                        fontWeight: 950
                      }}
                    >
                      {money(totals.tax)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4} sm={4} md={4}>
                  <Paper
                    variant="outlined"
                    sx={(theme) => ({
                      p: isPhone ? 0.45 : isTablet ? 0.65 : 2,
                      minHeight: isPhone ? 54 : isTablet ? 60 : undefined,
                      borderRadius: isCompact ? 1.3 : undefined,
                      textAlign: "center",
                      borderColor: theme.palette.mode === "dark" ? "#67C99D" : undefined
                    })}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined }}>
                      الصافي
                    </Typography>

                    <Typography
                      sx={{
                        color: "#d71920",
                        fontSize: isPhone ? 14 : isTablet ? 17 : 25,
                        fontWeight: 950
                      }}
                    >
                      {money(totals.subTotal)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={uiLayout.withUiSx({
          px: isPhone ? 0.35 : isTablet ? 0.55 : 3,
          py: isPhone ? 0.28 : isTablet ? 0.42 : 2,
          gap: isCompact ? 0.35 : 1,
          flexShrink: 0
        }, uiLayout.dialogActionsSx)}
      >
        <Button
          variant="contained"
          onClick={save}
          disabled={
            saving ||
            loadingContext ||
            !context
          }
          startIcon={
            saving ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <SaveIcon />
            )
          }
          sx={uiLayout.withUiSx({
            backgroundColor: primaryColor,
            minWidth: isPhone ? 92 : isTablet ? 110 : 140,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            px: isPhone ? 0.8 : isTablet ? 1.1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          حفظ
        </Button>

        <Button
          onClick={onClose}
          disabled={saving}
          sx={uiLayout.withUiSx({
            color: accentColor,
            fontWeight: 900,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            px: isPhone ? 0.8 : isTablet ? 1.1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}