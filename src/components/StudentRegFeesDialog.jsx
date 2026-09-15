import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
import * as uiLayout from './common/uiLayout';
import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import SearchIcon from "@mui/icons-material/Search";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const primaryColor = "#80b49e";
const primaryDark = "#5f947e";
const primaryLight = "#d8eee5";
const textColor = "#1f2d3d";
const softBg = "#f6faf8";

const showWarning = (message) => {
  return Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#f57c00"
  });
};

const showError = (message) => {
  return Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#d33"
  });
};

const showSuccess = (message) => {
  return Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: primaryColor
  });
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getUserGuid = (user) => {
  return (
    user?.userGuid ||
    user?.guid ||
    user?.Guid ||
    user?.USER_GUID ||
    user?.USER_GUID____ ||
    ""
  );
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value)
    .replace(/[^\d.-]/g, "")
    .trim();

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : 0;
};

const round2 = (value) => {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
};

const formatMoney = (value) => {
  return round2(value).toLocaleString("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const MoneyCell = ({ value }) => (
  <Typography
    sx={{
      width: "100%",
      fontWeight: 900,
      fontSize: "0.9rem",
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
      "@media (max-width:599px)": { fontSize: "0.75rem" },
      textAlign: "center",
      direction: "ltr",
      color: textColor
    }}
  >
    {formatMoney(value)}
  </Typography>
);

const getTodayLocalInputValue = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`;
};

const getStudentValue = (student, ...keys) => {
  for (const key of keys) {
    if (student?.[key] !== undefined && student?.[key] !== null && student?.[key] !== "") {
      return student[key];
    }
  }

  return "";
};

const InfoCard = ({ label, value }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.2,
      borderRadius: 2,
      border: "1px solid #e4eeea",
      backgroundColor: "#fff",
      height: "100%",
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        p: 0.48,
        borderRadius: 1.3,
        minHeight: 46
      },
      "@media (max-width:599px)": {
        p: 0.34,
        minHeight: 42
      }
    }}
  >
    <Typography
      sx={{
        fontSize: "0.75rem",
        fontWeight: 900,
        color: "#6f8a81",
        mb: 0.4,
        lineHeight: 1.15,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem", mb: 0.15 },
        "@media (max-width:599px)": { fontSize: "0.75rem", mb: 0.1 }
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.9rem",
        fontWeight: 900,
        lineHeight: 1.15,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" },
        color: textColor,
        wordBreak: "break-word"
      }}
    >
      {value || "-"}
    </Typography>
  </Paper>
);

const TotalBox = ({ label, value, color = textColor }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.2,
      borderRadius: 2,
      border: "1px solid #e4eeea",
      backgroundColor: "#fff",
      minWidth: 150,
      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        minWidth: 0,
        flex: 1,
        p: 0.45,
        borderRadius: 1.3
      },
      "@media (max-width:599px)": {
        p: 0.32
      }
    }}
  >
    <Typography
      sx={{
        fontSize: "0.75rem",
        fontWeight: 900,
        color: "#6f8a81",
        mb: 0.4,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem", mb: 0.1 },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "1rem",
        fontWeight: 1000,
        color,
        direction: "ltr",
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: { fontSize: "0.75rem" },
        "@media (max-width:599px)": { fontSize: "0.75rem" }
      }}
    >
      {formatMoney(value)}
    </Typography>
  </Paper>
);

const StudentRegFeesDialog = ({
  open,
  onClose,
  student,
  apiBaseUrl = "https://api4.sstli.com",
  onSaved
}) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`);
  const isCompact = isPhone || isTablet;

  const [loadingContext, setLoadingContext] = useState(false);
  const [saving, setSaving] = useState(false);

  const [context, setContext] = useState(null);

  const [docSearch, setDocSearch] = useState("");
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docInfo, setDocInfo] = useState(null);

  const [feesSearch, setFeesSearch] = useState("");
  const [feesLoading, setFeesLoading] = useState(false);
  const [availableFees, setAvailableFees] = useState([]);
  const [selectedFees, setSelectedFees] = useState([]);

  const [salesmenLoading, setSalesmenLoading] = useState(false);
  const [salesmen, setSalesmen] = useState([]);
  const [selectedSalesman, setSelectedSalesman] = useState(null);

  const [regDate, setRegDate] = useState(getTodayLocalInputValue());
  const [notes, setNotes] = useState("");

  const user = useMemo(() => getCurrentUser(), []);
  const userGuid = useMemo(() => getUserGuid(user), [user]);

  const studentName = getStudentValue(student, "studentName", "StudentName", "name");
  const nationalId = getStudentValue(student, "nationalId", "NationalId");
  const studentTel = getStudentValue(student, "studentTel", "tel", "StudentTel", "Tel");
  const accountGuid = getStudentValue(student, "accountGuid", "AccountGuid", "studentGuid");

  const compactAutocompleteProps = isCompact
    ? {
        ListboxProps: {
          sx: {
            maxHeight: isPhone ? 175 : 220,
            p: 0.25,
            "& .MuiAutocomplete-option": {
              minHeight: isPhone ? 29 : 33,
              py: isPhone ? 0.35 : 0.5,
              px: isPhone ? 0.65 : 0.85,
              fontSize: isPhone ? "0.5rem" : "0.58rem",
              lineHeight: 1.2
            }
          }
        },
        componentsProps: {
          paper: {
            sx: {
              mt: 0.25,
              borderRadius: 1.25,
              boxShadow: "0 8px 24px rgba(31,45,61,0.16)",
              "& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading": {
                py: 0.7,
                px: 0.8,
                fontSize: isPhone ? "0.5rem" : "0.58rem"
              }
            }
          }
        }
      }
    : {};

  const totals = useMemo(() => {
    return selectedFees.reduce(
      (acc, item) => {
        acc.total += toNumber(item.cost);
        acc.tax += toNumber(item.tax);
        acc.subTotal += toNumber(item.subTotal);
        return acc;
      },
      { total: 0, tax: 0, subTotal: 0 }
    );
  }, [selectedFees]);

  const resetState = () => {
    setContext(null);

    setDocSearch("");
    setDocuments([]);
    setSelectedDoc(null);
    setDocInfo(null);

    setFeesSearch("");
    setAvailableFees([]);
    setSelectedFees([]);

    setSalesmen([]);
    setSelectedSalesman(null);

    setRegDate(getTodayLocalInputValue());
    setNotes("");
    setSaving(false);
  };

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || result?.error || "حدث خطأ أثناء تنفيذ الطلب");
    }

    return result;
  };

  const loadContext = async () => {
    try {
      setLoadingContext(true);

      const result = await fetchJson(`${apiBaseUrl}/api/student-reg-fees/context`);

      setContext(result?.data || null);
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تجهيز استمارة الرسوم");
      onClose?.();
    } finally {
      setLoadingContext(false);
    }
  };

  const loadDocuments = async (searchValue = "") => {
    if (!context?.regFessTypeGuid) return;

    if (!userGuid) {
      showWarning("لا يمكن قراءة المستخدم الحالي، برجاء تسجيل الدخول مرة أخرى");
      return;
    }

    try {
      setDocumentsLoading(true);

      const params = new URLSearchParams({
        userGuid,
        docTypeGuid: context.regFessTypeGuid,
        search: searchValue || ""
      });

      const result = await fetchJson(
        `${apiBaseUrl}/api/student-reg-fees/documents?${params.toString()}`
      );

      const data = Array.isArray(result?.data) ? result.data : [];

      setDocuments(
        data.map((item, index) => ({
          ...item,
          id: item.docGuid || item.code || index + 1
        }))
      );
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل أنواع المستندات");
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const loadDocumentInfo = async (doc) => {
    if (!doc?.code || !context?.regFessTypeGuid) return;

    try {
      setDocInfo(null);
      setAvailableFees([]);
      setSelectedFees([]);
      setSalesmen([]);
      setSelectedSalesman(null);

      const params = new URLSearchParams({
        docCode: doc.code,
        docTypeGuid: context.regFessTypeGuid
      });

      const result = await fetchJson(
        `${apiBaseUrl}/api/student-reg-fees/document-info?${params.toString()}`
      );

      const info = result?.data || null;

      setDocInfo(info);

      if (info?.priceListGuid && doc?.fessType !== undefined && doc?.fessType !== null) {
        await loadFees(info.priceListGuid, doc.fessType, feesSearch);
      }

      await loadSalesmen();
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل بيانات نوع المستند");
      setDocInfo(null);
    }
  };

  const loadFees = async (priceListGuid, fessType, searchValue = "") => {
    if (!priceListGuid) return;

    try {
      setFeesLoading(true);

      const params = new URLSearchParams({
        priceListGuid,
        type: String(fessType ?? 0),
        search: searchValue || ""
      });

      const result = await fetchJson(
        `${apiBaseUrl}/api/student-reg-fees/fees?${params.toString()}`
      );

      const data = Array.isArray(result?.data) ? result.data : [];

      setAvailableFees(
        data.map((item, index) => ({
          ...item,
          id: item.feeGuid || item.code || index + 1,
          total: round2(item.total),
          tax: round2(item.tax),
          subTotal: round2(item.subTotal)
        }))
      );
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء تحميل الرسوم");
      setAvailableFees([]);
    } finally {
      setFeesLoading(false);
    }
  };

 const loadSalesmen = async (searchValue = "") => {
  try {
    setSalesmenLoading(true);

    const params = new URLSearchParams();

    if (searchValue) {
      params.append("search", searchValue);
    }

    const url = params.toString()
      ? `${apiBaseUrl}/api/student-reg-fees/salesmen?${params.toString()}`
      : `${apiBaseUrl}/api/student-reg-fees/salesmen`;

    const result = await fetchJson(url);

    const data = Array.isArray(result?.data) ? result.data : [];

    setSalesmen(
      data.map((item, index) => ({
        ...item,
        id: item.salesManGuid || item.code || index + 1
      }))
    );
  } catch (error) {
    showError(error.message || "حدث خطأ أثناء تحميل مندوبي البيع");
    setSalesmen([]);
  } finally {
    setSalesmenLoading(false);
  }
};

  const handleSelectDoc = async (doc) => {
    setSelectedDoc(doc);

    if (!doc) {
      setDocInfo(null);
      setAvailableFees([]);
      setSelectedFees([]);
      setSalesmen([]);
      setSelectedSalesman(null);
      return;
    }

    await loadDocumentInfo(doc);
  };

  const handleSearchFees = async () => {
    if (!selectedDoc?.docGuid) {
      showWarning("برجاء اختيار نوع المستند أولاً");
      return;
    }

    if (!docInfo?.priceListGuid) {
      showWarning("لا يوجد قائمة أسعار مرتبطة بنوع المستند");
      return;
    }

    await loadFees(docInfo.priceListGuid, selectedDoc.fessType, feesSearch);
  };

  const buildSelectedFee = (fee) => {
    const totalFromPrice = round2(fee?.total);

    if (docInfo?.chkVat) {
      const cost = round2(totalFromPrice / 1.15);
      const tax = round2(totalFromPrice - cost);

      return {
        id: fee.feeGuid,
        feeGuid: fee.feeGuid,
        code: fee.code,
        feeName: fee.feeName,
        cost,
        tax,
        subTotal: totalFromPrice
      };
    }

    return {
      id: fee.feeGuid,
      feeGuid: fee.feeGuid,
      code: fee.code,
      feeName: fee.feeName,
      cost: round2(fee.total),
      tax: round2(fee.tax),
      subTotal: round2(fee.subTotal)
    };
  };

  const handleAddFee = (fee) => {
    if (!fee?.feeGuid) return;

    const exists = selectedFees.some(
      (item) => String(item.feeGuid).toLowerCase() === String(fee.feeGuid).toLowerCase()
    );

    if (exists) {
      showWarning("تم إدراج الرسوم مسبقاً");
      return;
    }

    setSelectedFees((prev) => [...prev, buildSelectedFee(fee)]);
  };

  const handleRemoveFee = (feeGuid) => {
    setSelectedFees((prev) =>
      prev.filter((item) => String(item.feeGuid).toLowerCase() !== String(feeGuid).toLowerCase())
    );
  };

  const validateBeforeSave = () => {
    if (!accountGuid) {
      showWarning("لا يمكن قراءة حساب الطالب");
      return false;
    }

    if (!selectedDoc?.docGuid) {
      showWarning("برجاء اختيار نوع المستند");
      return false;
    }

    if (!selectedSalesman?.salesManGuid) {
      showWarning("برجاء اختيار مندوب البيع");
      return false;
    }

    if (selectedFees.length === 0 || totals.subTotal <= 0) {
      showWarning("لا يمكن حفظ الاستمارة بدون اختيار الرسوم");
      return false;
    }

    if (!docInfo?.branchGuid) {
      showWarning("لا يمكن قراءة فرع المستند");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateBeforeSave()) return;

    const confirm = await Swal.fire({
      icon: "question",
      title: "تأكيد الحفظ",
      text: "هل تريد حفظ استمارة الرسوم؟",
      showCancelButton: true,
      confirmButtonText: "نعم، حفظ",
      cancelButtonText: "إلغاء",
      confirmButtonColor: primaryColor,
      cancelButtonColor: "#9e9e9e"
    });

    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);

      const payload = {
        userGuid,
        accountGuid,

        docGuid: selectedDoc.docGuid,
        docCode: selectedDoc.code,
        docName: selectedDoc.docName,

        branchGuid: docInfo.branchGuid,
        salesManGuid: selectedSalesman.salesManGuid,

        regFessDate: regDate ? new Date(regDate).toISOString() : new Date().toISOString(),

        total: round2(totals.total),
        tax: round2(totals.tax),
        subTotal: round2(totals.subTotal),

        chkVat: Boolean(docInfo?.chkVat),

        notes,
        studentName,

        vatAccountGuid: docInfo?.vatAccountGuid || "",
        madenGuid: docInfo?.madenGuid || "",
        daenGuid: docInfo?.daenGuid || "",
        costCenterGuid: docInfo?.costCenterGuid || "",

        chkMaden: Boolean(docInfo?.chkMaden),
        chkDaen: Boolean(docInfo?.chkDaen),

        details: selectedFees.map((item) => ({
          feeGuid: item.feeGuid,
          cost: round2(item.cost),
          tax: round2(item.tax),
          subTotal: round2(item.subTotal)
        }))
      };

      const result = await fetchJson(`${apiBaseUrl}/api/student-reg-fees/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      await showSuccess(result?.message || "تم حفظ استمارة الرسوم بنجاح");
      onSaved?.(result?.data);
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء حفظ استمارة الرسوم");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    resetState();
    loadContext();
  }, [open]);

  useEffect(() => {
    if (!open || !context?.regFessTypeGuid) return;

    loadDocuments("");
  }, [open, context?.regFessTypeGuid]);

  const availableFeesColumns = [
    {
      field: "actions",
      headerName: "",
      width: 65,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="إضافة الرسم">
          <IconButton
            size="small"
            onClick={() => handleAddFee(params.row)}
            sx={{
              color: primaryDark,
              backgroundColor: primaryLight,
              "&:hover": { backgroundColor: "#c8e5d8" }
            }}
          >
            <AddCircleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    },
    {
      field: "code",
      headerName: "كود",
      width: 90,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "feeName",
      headerName: "البيان",
      flex: 1,
      minWidth: 220,
      align: "left",
      headerAlign: "center"
    },
    {
      field: "total",
      headerName: "الصافي",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.total} />
    }
  ];

  const selectedFeesColumns = [
    {
      field: "actions",
      headerName: "",
      width: 65,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="حذف">
          <IconButton
            size="small"
            onClick={() => handleRemoveFee(params.row.feeGuid)}
            sx={{
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              "&:hover": { backgroundColor: "#ffcdd2" }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    },
    {
      field: "code",
      headerName: "كود",
      width: 90,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "feeName",
      headerName: "البيان",
      flex: 1,
      minWidth: 220,
      align: "left",
      headerAlign: "center"
    },
    {
      field: "cost",
      headerName: "الصافي",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.cost} />
    },
    {
      field: "tax",
      headerName: "الضريبة",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.tax} />
    },
    {
      field: "subTotal",
      headerName: "الإجمالي",
      width: 110,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => <MoneyCell value={params.row?.subTotal} />
    }
  ];

  // أعمدة مختصرة ومناسبة للموبايل/التابلت
  const compactAvailableFeesColumns = isPhone
    ? [
        {
          ...availableFeesColumns.find((c) => c.field === "actions"),
          width: 34,
          minWidth: 34,
          maxWidth: 34
        },
        {
          ...availableFeesColumns.find((c) => c.field === "feeName"),
          headerName: "الرسم",
          flex: 1,
          minWidth: 120
        },
        {
          ...availableFeesColumns.find((c) => c.field === "total"),
          headerName: "القيمة",
          width: 62,
          minWidth: 62,
          maxWidth: 62
        }
      ]
    : isTablet
      ? [
          {
            ...availableFeesColumns.find((c) => c.field === "actions"),
            width: 40,
            minWidth: 40,
            maxWidth: 40
          },
          {
            ...availableFeesColumns.find((c) => c.field === "code"),
            width: 54,
            minWidth: 54,
            maxWidth: 54
          },
          {
            ...availableFeesColumns.find((c) => c.field === "feeName"),
            flex: 1,
            minWidth: 150
          },
          {
            ...availableFeesColumns.find((c) => c.field === "total"),
            width: 76,
            minWidth: 76,
            maxWidth: 76
          }
        ]
      : availableFeesColumns;

  const compactSelectedFeesColumns = isPhone
    ? [
        {
          ...selectedFeesColumns.find((c) => c.field === "actions"),
          width: 34,
          minWidth: 34,
          maxWidth: 34
        },
        {
          ...selectedFeesColumns.find((c) => c.field === "feeName"),
          headerName: "الرسم",
          flex: 1,
          minWidth: 120
        },
        {
          ...selectedFeesColumns.find((c) => c.field === "subTotal"),
          headerName: "الإجمالي",
          width: 66,
          minWidth: 66,
          maxWidth: 66
        }
      ]
    : isTablet
      ? [
          {
            ...selectedFeesColumns.find((c) => c.field === "actions"),
            width: 40,
            minWidth: 40,
            maxWidth: 40
          },
          {
            ...selectedFeesColumns.find((c) => c.field === "feeName"),
            flex: 1,
            minWidth: 150
          },
          {
            ...selectedFeesColumns.find((c) => c.field === "cost"),
            width: 72,
            minWidth: 72,
            maxWidth: 72
          },
          {
            ...selectedFeesColumns.find((c) => c.field === "tax"),
            width: 68,
            minWidth: 68,
            maxWidth: 68
          },
          {
            ...selectedFeesColumns.find((c) => c.field === "subTotal"),
            width: 76,
            minWidth: 76,
            maxWidth: 76
          }
        ]
      : selectedFeesColumns;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xl"
      fullScreen={isPhone}
      sx={uiLayout.withUiSx({
        "& .MuiDialog-container": {
          pt: isPhone ? "58px" : isTablet ? "64px" : 1.5,
          px: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          pb: isPhone ? 0 : isTablet ? 0.5 : 1.5,
          alignItems: isPhone ? "stretch" : "center"
        }
      }, uiLayout.dialogLayoutSx)}
      PaperProps={{
        sx: {
          width: isPhone ? "100vw" : isTablet ? "96vw" : undefined,
          maxWidth: isPhone ? "100vw" : isTablet ? "1180px" : undefined,
          borderRadius: isPhone ? 0 : isTablet ? 2 : 3,
          direction: "rtl",
          height: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "92vh",
          maxHeight: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "92vh",
          m: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }
      }}
    >
      <DialogTitle
        sx={{
          p: isPhone ? 0.5 : isTablet ? 0.75 : 2,
          borderBottom: "1px solid #e5efea",
          flexShrink: 0,
          backgroundColor: softBg
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Stack direction="row" alignItems="center" gap={isCompact ? 0.35 : 1}>
            <ReceiptLongIcon sx={{ color: primaryDark, fontSize: isPhone ? 16 : isTablet ? 19 : undefined }} />
            <Box>
              <Typography
                sx={{
                  fontWeight: 1000,
                  color: textColor,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.76rem" : undefined,
                  lineHeight: 1.15
                }}
              >
                استمارة رسوم
              </Typography>
              <Typography
                sx={{
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.8rem",
                  fontWeight: 800,
                  color: "#6f8a81",
                  lineHeight: 1.15
                }}
              >
                اختيار نوع المستند ثم الرسوم ثم مندوب البيع
              </Typography>
            </Box>
          </Stack>

          <IconButton
            disabled={saving}
            onClick={onClose}
            sx={{
              width: isPhone ? 27 : isTablet ? 31 : undefined,
              height: isPhone ? 27 : isTablet ? 31 : undefined
            }}
          >
            <CloseIcon sx={{ fontSize: isPhone ? 16 : isTablet ? 18 : undefined }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          p: isPhone ? 0.3 : isTablet ? 0.55 : 2,
          backgroundColor: "#fbfdfc",
          overflowY: "auto",
          flex: 1,
          minHeight: 0,

          "& .MuiInputLabel-root": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          },
          "& .MuiInputBase-input, & .MuiAutocomplete-input": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            py: isPhone ? 0.5 : isTablet ? 0.65 : undefined
          },
          "& .MuiOutlinedInput-root": {
            minHeight: isPhone ? 31 : isTablet ? 35 : undefined,
            borderRadius: isCompact ? 1.25 : undefined
          },
          "& .MuiChip-root": {
            height: isPhone ? 20 : isTablet ? 23 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }
        }}
      >
        {loadingContext ? (
          <Box sx={{ py: isPhone ? 3 : isTablet ? 4 : 8, textAlign: "center" }}>
            <CircularProgress sx={{ color: primaryDark }} />
            <Typography
              sx={{
                mt: isCompact ? 0.7 : 2,
                fontWeight: 900,
                color: textColor,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
              }}
            >
              جاري تجهيز استمارة الرسوم...
            </Typography>
          </Box>
        ) : (
          <Stack gap={isPhone ? 0.45 : isTablet ? 0.65 : 2}>
            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.4 : isTablet ? 0.6 : 1.5,
                borderRadius: isCompact ? 1.5 : 3,
                border: "1px solid #e1eee8",
                backgroundColor: "#fff"
              }}
            >
              <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 1.5}>
                <Grid item xs={6} sm={6} md={3}>
                  <InfoCard label="اسم الطالب" value={studentName} />
                </Grid>

                <Grid item xs={6} sm={6} md={3}>
                  <InfoCard label="رقم الهوية" value={nationalId} />
                </Grid>

                <Grid item xs={6} sm={6} md={3}>
                  <InfoCard label="رقم الجوال" value={studentTel} />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="التاريخ"
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={uiLayout.withUiSx({
                      "& .MuiInputBase-input": {
                        fontWeight: 900,
                        direction: "ltr"
                      }
                    }, uiLayout.formFieldSx)}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                </Grid>
              </Grid>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.4 : isTablet ? 0.6 : 1.5,
                borderRadius: isCompact ? 1.5 : 3,
                border: "1px solid #e1eee8",
                backgroundColor: "#fff"
              }}
            >
              <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 1.5} alignItems="center">
                <Grid item xs={12} sm={7} md={5}>
                  <Autocomplete
                    {...compactAutocompleteProps}
                    options={documents}
                    value={selectedDoc}
                    loading={documentsLoading}
                    onChange={(_, value) => handleSelectDoc(value)}
                    getOptionLabel={(option) => {
                      if (!option) return "";
                      const full = `${option.code || ""} - ${option.docName || ""}`;
                      return isCompact && full.length > 42 ? `${full.slice(0, 42)}…` : full;
                    }}
                    isOptionEqualToValue={(option, value) =>
                      String(option?.docGuid || "") === String(value?.docGuid || "")
                    }
                    renderInput={(params) => (
                      <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                        {...params}
                        label="نوع المستند"
                        placeholder="اختر نوع المستند"
                        size="small"
                        onChange={(e) => setDocSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") loadDocuments(docSearch);
                        }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {documentsLoading ? <CircularProgress size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={5} sm={5} md={1.2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SearchIcon />}
                    onClick={() => loadDocuments(docSearch)}
                    disabled={documentsLoading}
                    sx={uiLayout.withUiSx({
                      height: isPhone ? 31 : isTablet ? 35 : 40,
                      borderRadius: isCompact ? 1.25 : 2,
                      fontWeight: 900,
                      fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                      color: primaryDark,
                      borderColor: primaryLight,
                      direction: "rtl"
                    }, uiLayout.buttonSx)}
                  >
                    بحث
                  </Button>
                </Grid>

                <Grid item xs={12} sm={7} md={4}>
                  <Autocomplete
                    {...compactAutocompleteProps}
                    options={salesmen}
                    value={selectedSalesman}
                    loading={salesmenLoading}
                    disabled={!selectedDoc?.docGuid}
                    onChange={(_, value) => setSelectedSalesman(value)}
                    getOptionLabel={(option) => option?.salesManName || ""}
                    isOptionEqualToValue={(option, value) =>
                      String(option?.salesManGuid || "") === String(value?.salesManGuid || "")
                    }
                    renderInput={(params) => (
  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
    {...params}
    label="مندوب البيع"
    placeholder="اختر مندوب البيع"
    size="small"
    onChange={(e) => loadSalesmen(e.target.value)}
    InputProps={{
      ...params.InputProps,
      startAdornment: (
        <>
          <PersonSearchIcon
            sx={{ color: primaryDark, mr: 0.5, fontSize: "1.2rem" }}
          />
          {params.InputProps.startAdornment}
        </>
      ),
      endAdornment: (
        <>
          {salesmenLoading ? <CircularProgress size={18} /> : null}
          {params.InputProps.endAdornment}
        </>
      )
    }}
  />
)}
                  />
                </Grid>

                <Grid item xs={5} sm={5} md={1.8}>
                  <Stack direction="row" gap={1} justifyContent="flex-start">
                    <Chip
                      label={docInfo?.chkVat ? "ضريبة مفعلة" : "بدون ضريبة"}
                      sx={{
                        fontWeight: 900,
                        color: docInfo?.chkVat ? "#0b6b3a" : "#795548",
                        backgroundColor: docInfo?.chkVat ? "#e3f5ec" : "#fff4e5"
                      }}
                    />
                  </Stack>
                </Grid>

                {docInfo && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField InputLabelProps={{ shrink: true }}
                        fullWidth
                        size="small"
                        label="الفرع"
                        value={docInfo?.branchName || ""}
                        InputProps={{ readOnly: true }}
                        sx={uiLayout.withUiSx({
                          "& .MuiInputBase-input": {
                            fontWeight: 900,
                            color: textColor,
                            textAlign: "start"
                          }
                        }, uiLayout.formFieldSx)}
                      />
                    </Grid>

                    {/* <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="قائمة الأسعار"
                        value={docInfo?.priceListGuid || ""}
                        InputProps={{ readOnly: true }}
                        sx={{
                          "& .MuiInputBase-input": {
                            fontWeight: 900,
                            color: textColor,
                            direction: "ltr"
                          }
                        }}
                      />
                    </Grid> */}
                  </>
                )}
              </Grid>
            </Paper>

            <Grid container spacing={isPhone ? 0.45 : isTablet ? 0.65 : 2}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: isPhone ? 0.4 : isTablet ? 0.6 : 1.5,
                    borderRadius: isCompact ? 1.5 : 3,
                    border: "1px solid #e1eee8",
                    backgroundColor: "#fff",
                    height: "100%"
                  }}
                >
                  <Stack sx={uiLayout.pageHeaderSx}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={isCompact ? 0.35 : 1}
                    gap={isCompact ? 0.35 : 1}
                  >
                    <Typography
                      sx={{
                        fontWeight: 1000,
                        color: textColor,
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                      }}
                    >
                      الرسوم المتاحة
                    </Typography>

                    <Stack direction="row" gap={isCompact ? 0.25 : 1} sx={uiLayout.withUiSx({ minWidth: 0 }, uiLayout.filterBarSx)}>
                      <TextField InputLabelProps={{ shrink: true }}
                        size="small"
                        placeholder="بحث في الرسوم"
                        value={feesSearch}
                        onChange={(e) => setFeesSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSearchFees();
                        }}
                        sx={uiLayout.withUiSx({
                          width: isPhone ? 92 : isTablet ? 135 : 210,
                          "& .MuiInputBase-input": {
                            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                          }
                        }, uiLayout.formFieldSx)}
                      />

                      <Button
                        variant="outlined"
                        onClick={handleSearchFees}
                        disabled={feesLoading || !selectedDoc?.docGuid}
                        sx={uiLayout.withUiSx({
                          borderRadius: isCompact ? 1.2 : 2,
                          fontWeight: 900,
                          minWidth: isPhone ? 44 : isTablet ? 52 : undefined,
                          px: isPhone ? 0.45 : isTablet ? 0.65 : undefined,
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                          color: primaryDark,
                          borderColor: primaryLight
                        }, uiLayout.buttonSx)}
                      >
                        بحث
                      </Button>
                    </Stack>
                  </Stack>

                  <Box
                    sx={uiLayout.withUiSx({
                      height: isPhone ? 235 : isTablet ? 285 : 355,
                      minWidth: 0,
                      width: "100%"
                    }, uiLayout.tableContainerSx)}
                  >
                    <DataGrid
                      rows={availableFees}
                      columns={compactAvailableFeesColumns}
                      loading={feesLoading}
                      disableRowSelectionOnClick
                      disableColumnMenu={isCompact}
                      disableColumnFilter={isCompact}
                      rowHeight={isPhone ? 30 : isTablet ? 36 : undefined}
                      columnHeaderHeight={isPhone ? 30 : isTablet ? 36 : undefined}
                      hideFooterSelectedRowCount
                      pageSizeOptions={[5, 10, 25]}
                      initialState={{
                        pagination: {
                          paginationModel: { pageSize: 5, page: 0 }
                        }
                      }}
                      sx={uiLayout.withUiSx({
                        border: "1px solid #e4eeea",
                        borderRadius: isCompact ? 1.2 : 2,
                        direction: "rtl",
                        width: "100%",
                        minWidth: 0,
                        overflow: "hidden",
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,

                        "& .MuiDataGrid-main": {
                          minWidth: 0
                        },

                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: softBg,
                          fontWeight: 900,
                          minHeight: `${isPhone ? 30 : isTablet ? 36 : 56}px !important`,
                          maxHeight: `${isPhone ? 30 : isTablet ? 36 : 56}px !important`
                        },

                        "& .MuiDataGrid-columnHeader": {
                          px: isPhone ? 0.15 : isTablet ? 0.3 : undefined
                        },

                        "& .MuiDataGrid-columnHeaderTitle": {
                          fontWeight: 1000,
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                          lineHeight: 1.05,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          textAlign: "center"
                        },

                        "& .MuiDataGrid-cell": {
                          fontWeight: 800,
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                          px: isPhone ? 0.12 : isTablet ? 0.28 : undefined,
                          lineHeight: 1.1,
                          overflow: "hidden"
                        },

                        "& .MuiDataGrid-cellContent": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        },

                        "& .MuiDataGrid-row": {
                          minHeight: `${isPhone ? 30 : isTablet ? 36 : 52}px !important`,
                          maxHeight: `${isPhone ? 30 : isTablet ? 36 : 52}px !important`
                        },

                        "& .MuiIconButton-root": {
                          width: isPhone ? 24 : isTablet ? 27 : undefined,
                          height: isPhone ? 24 : isTablet ? 27 : undefined,
                          p: isPhone ? 0.25 : undefined
                        },

                        "& .MuiSvgIcon-root": {
                          fontSize: isPhone ? 14 : isTablet ? 16 : undefined
                        },

                        "& .MuiDataGrid-footerContainer": {
                          minHeight: isPhone ? 34 : isTablet ? 38 : undefined
                        },

                        "& .MuiTablePagination-toolbar": {
                          minHeight: isPhone ? 34 : isTablet ? 38 : undefined,
                          px: isPhone ? 0.15 : isTablet ? 0.3 : undefined
                        },

                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                        }
                      }, uiLayout.dataGridSx)}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: isPhone ? 0.4 : isTablet ? 0.6 : 1.5,
                    borderRadius: isCompact ? 1.5 : 3,
                    border: "1px solid #e1eee8",
                    backgroundColor: "#fff",
                    height: "100%"
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={isCompact ? 0.35 : 1}
                    gap={isCompact ? 0.35 : 1}
                  >
                    <Typography
                      sx={{
                        fontWeight: 1000,
                        color: textColor,
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                      }}
                    >
                      الرسوم المختارة
                    </Typography>

                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={() => setSelectedFees([])}
                      disabled={selectedFees.length === 0}
                      sx={uiLayout.withUiSx({
                        borderRadius: isCompact ? 1.2 : 2,
                        fontWeight: 900,
                        minWidth: isPhone ? 48 : isTablet ? 58 : undefined,
                        px: isPhone ? 0.45 : isTablet ? 0.65 : undefined,
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                        color: "#d32f2f",
                        borderColor: "#ffcdd2",
                        direction: "rtl"
                      }, uiLayout.buttonSx)}
                    >
                      تفريغ
                    </Button>
                  </Stack>

                  <Box
                    sx={uiLayout.withUiSx({
                      height: isPhone ? 235 : isTablet ? 285 : 355,
                      minWidth: 0,
                      width: "100%"
                    }, uiLayout.tableContainerSx)}
                  >
                    <DataGrid
                      rows={selectedFees}
                      columns={compactSelectedFeesColumns}
                      disableRowSelectionOnClick
                      disableColumnMenu={isCompact}
                      disableColumnFilter={isCompact}
                      rowHeight={isPhone ? 30 : isTablet ? 36 : undefined}
                      columnHeaderHeight={isPhone ? 30 : isTablet ? 36 : undefined}
                      hideFooterSelectedRowCount
                      pageSizeOptions={[5, 10, 25]}
                      initialState={{
                        pagination: {
                          paginationModel: { pageSize: 5, page: 0 }
                        }
                      }}
                      sx={uiLayout.withUiSx({
                        border: "1px solid #e4eeea",
                        borderRadius: isCompact ? 1.2 : 2,
                        direction: "rtl",
                        width: "100%",
                        minWidth: 0,
                        overflow: "hidden",
                        fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,

                        "& .MuiDataGrid-main": {
                          minWidth: 0
                        },

                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: softBg,
                          fontWeight: 900,
                          minHeight: `${isPhone ? 30 : isTablet ? 36 : 56}px !important`,
                          maxHeight: `${isPhone ? 30 : isTablet ? 36 : 56}px !important`
                        },

                        "& .MuiDataGrid-columnHeader": {
                          px: isPhone ? 0.15 : isTablet ? 0.3 : undefined
                        },

                        "& .MuiDataGrid-columnHeaderTitle": {
                          fontWeight: 1000,
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                          lineHeight: 1.05,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          textAlign: "center"
                        },

                        "& .MuiDataGrid-cell": {
                          fontWeight: 800,
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
                          px: isPhone ? 0.12 : isTablet ? 0.28 : undefined,
                          lineHeight: 1.1,
                          overflow: "hidden"
                        },

                        "& .MuiDataGrid-cellContent": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        },

                        "& .MuiDataGrid-row": {
                          minHeight: `${isPhone ? 30 : isTablet ? 36 : 52}px !important`,
                          maxHeight: `${isPhone ? 30 : isTablet ? 36 : 52}px !important`
                        },

                        "& .MuiIconButton-root": {
                          width: isPhone ? 24 : isTablet ? 27 : undefined,
                          height: isPhone ? 24 : isTablet ? 27 : undefined,
                          p: isPhone ? 0.25 : undefined
                        },

                        "& .MuiSvgIcon-root": {
                          fontSize: isPhone ? 14 : isTablet ? 16 : undefined
                        },

                        "& .MuiDataGrid-footerContainer": {
                          minHeight: isPhone ? 34 : isTablet ? 38 : undefined
                        },

                        "& .MuiTablePagination-toolbar": {
                          minHeight: isPhone ? 34 : isTablet ? 38 : undefined,
                          px: isPhone ? 0.15 : isTablet ? 0.3 : undefined
                        },

                        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                          fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                        }
                      }, uiLayout.dataGridSx)}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Paper
              elevation={0}
              sx={{
                p: isPhone ? 0.4 : isTablet ? 0.6 : 1.5,
                borderRadius: isCompact ? 1.5 : 3,
                border: "1px solid #e1eee8",
                backgroundColor: "#fff"
              }}
            >
              <Grid container spacing={isPhone ? 0.35 : isTablet ? 0.55 : 1.5}>
                <Grid item xs={12} md={6}>
                  <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                    fullWidth
                    multiline
                    minRows={isPhone ? 1 : isTablet ? 2 : 3}
                    label="ملاحظات"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack
                    direction="row"
                    gap={isCompact ? 0.3 : 1}
                    justifyContent="flex-end"
                    alignItems="stretch"
                    sx={{ height: "100%" }}
                  >
                    <TotalBox label="الصافي" value={totals.total} />
                    <TotalBox label="الضريبة" value={totals.tax} color="#d32f2f" />
                    <TotalBox label="الإجمالي" value={totals.subTotal} color={primaryDark} />
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        )}
      </DialogContent>

      <Divider />

      <DialogActions
        sx={uiLayout.withUiSx({
          p: isPhone ? 0.35 : isTablet ? 0.55 : 2,
          gap: isCompact ? 0.4 : 1,
          backgroundColor: "#fff",
          flexShrink: 0,
          justifyContent: "space-between",
          direction: "rtl"
        }, uiLayout.dialogActionsSx)}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          variant="outlined"
          sx={uiLayout.withUiSx({
            borderRadius: isCompact ? 1.2 : 2,
            fontWeight: 900,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            px: isPhone ? 1 : isTablet ? 1.3 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            color: "#d32f2f",
            borderColor: "#ffcdd2"
          }, uiLayout.buttonSx)}
        >
          إغلاق
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving || loadingContext}
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          sx={uiLayout.withUiSx({
            borderRadius: isCompact ? 1.2 : 2,
            fontWeight: 1000,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            px: isPhone ? 1.2 : isTablet ? 1.6 : 4,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            backgroundColor: primaryColor,
            direction: "rtl",
            "&:hover": {
              backgroundColor: primaryDark
            }
          }, uiLayout.buttonSx)}
        >
          {saving ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentRegFeesDialog;