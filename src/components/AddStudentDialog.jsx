import { DESKTOP_BREAKPOINT } from '../config/sidebarLayout';
import { pinColor } from '../config/themeColors';
import * as uiLayout from './common/uiLayout';
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";

import dayjs from "dayjs";
import "dayjs/locale/en-gb";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const API_BASE_URL = "https://api4.sstli.com";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
// Always-visible focus-green outline (never hover/focus-only) for every field
// and the dialog frame itself — matches the reference styling on the Home page.
const FOCUS_BORDER_SX = (theme) => (theme.palette.mode !== "dark" ? {} : {
  "& .MuiDialog-paper": { border: "1px solid #67C99D" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#67C99D" }
});
const whiteColor = "#fefefe";
const softBg = "#fefefe";
const textColor = "#1f2d3d";

const ADD_STUDENT_BOOTSTRAP_TTL_MS = 5 * 60 * 1000;
const addStudentBootstrapCache = new Map();
const addStudentBootstrapInFlight = new Map();

const getCachedAddStudentBootstrap = (sellerGuid) => {
  const key = String(sellerGuid || "default").toLowerCase();
  const cached = addStudentBootstrapCache.get(key);

  if (
    !cached ||
    Date.now() - cached.timestamp >= ADD_STUDENT_BOOTSTRAP_TTL_MS
  ) {
    return null;
  }

  return cached.data;
};

const fetchJsonOrThrow = async (url, fallbackMessage) => {
  const response = await fetch(url);
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      json?.error ||
      json?.message ||
      fallbackMessage ||
      `HTTP ${response.status}`
    );
  }

  return json;
};

const loadAddStudentBootstrap = async (
  sellerGuid,
  { force = false } = {}
) => {
  const key = String(sellerGuid || "default").toLowerCase();
  const cached = !force
    ? getCachedAddStudentBootstrap(sellerGuid)
    : null;

  if (cached) {
    return cached;
  }

  if (!force && addStudentBootstrapInFlight.has(key)) {
    return addStudentBootstrapInFlight.get(key);
  }

  const promise = (async () => {
    // الثلاث طلبات مستقلة، لذلك تُنفذ معًا بدل التسلسل.
    const contextPromise = fetchJsonOrThrow(
      `${API_BASE_URL}/api/students/create-context?sellerGuid=${encodeURIComponent(
        sellerGuid || ""
      )}`,
      "فشل تجهيز بيانات إضافة الطالب"
    );

    const sectorsPromise = fetchJsonOrThrow(
      `${API_BASE_URL}/api/students/sectors`,
      "فشل تحميل القطاعات"
    ).catch((error) => {
      console.error("Sectors loading error:", error);
      return { data: [] };
    });

    const sellersPromise = fetchJsonOrThrow(
      `${API_BASE_URL}/api/students/sellers`,
      "فشل تحميل مناديب البيع"
    ).catch((error) => {
      console.error("Sellers loading error:", error);
      return { data: [] };
    });

    const [contextJson, sectorsJson, sellersJson] =
      await Promise.all([
        contextPromise,
        sectorsPromise,
        sellersPromise
      ]);

    const data = {
      contextJson,
      sectorsJson,
      sellersJson
    };

    addStudentBootstrapCache.set(key, {
      timestamp: Date.now(),
      data
    });

    return data;
  })();

  addStudentBootstrapInFlight.set(key, promise);

  try {
    return await promise;
  } finally {
    addStudentBootstrapInFlight.delete(key);
  }
};

const emptyForm = {
  acadmyId: "",
  parentGuid: "",
  parentCode: "",
  openAccountGuid: "",

  studentName: "",
  studentNameEn: "",
  birthDate: "",

  studentTel: "",
  studentTel2: "",
  nationalId: "",
  email: "",

  studentType: 0,
  studentNational: 0,
  studyType: 0,
  customerType: 0,

  companyGuid: "",
  companyName: "",

  sellerGuid: "",
  sellerName: "",

  isUse: true,
  noData: false,

  maden: 0,
  daen: 0,

  notes: ""
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const showError = (message) => {
  return Swal.fire({
    icon: "error",
    title: "خطأ",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
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

const showWarning = (message) => {
  return Swal.fire({
    icon: "warning",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسناً",
    confirmButtonColor: accentColor
  });
};

const FieldLabel = ({ children }) => (
  <Typography
    sx={(theme) => ({
      fontWeight: 900,
      color:
        theme.palette.mode === "dark"
          ? "#9BE0C1"
          : primaryColor,
      fontSize: "0.85rem",
      mb: 0.5,
      textAlign: "start",

      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        fontSize: "0.75rem",
        mb: 0.22,
        lineHeight: 1.2
      },

      "@media (max-width:599px)": {
        fontSize: "0.75rem",
        mb: 0.16
      }
    })}
  >
    {children}
  </Typography>
);

const inputSx = {
  backgroundColor: (theme) =>
    theme.palette.mode === "dark"
      ? "transparent"
      : whiteColor,
  borderRadius: 2,
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    fontWeight: 900,

    [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
      minHeight: 34,
      borderRadius: 1.35,
      fontSize: "0.62rem"
    },

    "@media (max-width:599px)": {
      minHeight: 31,
      fontSize: "0.55rem"
    },
    "& fieldset": {
      borderColor: (theme) => theme.palette.mode === "dark" ? "#67C99D" : primaryLight
    },
    "&:hover fieldset": {
      borderColor: (theme) => theme.palette.mode === "dark" ? "#67C99D" : primaryColor
    },
    "&.Mui-focused fieldset": {
      borderColor: (theme) => theme.palette.mode === "dark" ? "#67C99D" : primaryColor,
      borderWidth: 2
    },
    "&.Mui-disabled fieldset": {
      borderColor: (theme) => theme.palette.mode === "dark" ? "#67C99D" : primaryLight
    }
  },
  "& .MuiInputBase-input": {
    fontWeight: 900,

    [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
      py: 0.7,
      px: 0.8,
      fontSize: "0.62rem"
    },

    "@media (max-width:599px)": {
      py: 0.55,
      px: 0.65,
      fontSize: "0.55rem"
    }
  },
  "& .MuiInputBase-input.Mui-disabled": {
    WebkitTextFillColor: (theme) =>
      theme.palette.mode === "dark"
        ? theme.palette.text.secondary
        : textColor
  }
};

const selectSx = {
  ...inputSx,
  fontWeight: 900,
  textAlign: "start",
  "& .MuiSelect-select": {
    fontWeight: 900
  }
};

const selectMenuProps = {
  disablePortal: false,
  PaperProps: {
    sx: (theme) => ({
      maxHeight: 300,
      direction: "rtl",
      borderRadius: 2,
      border: theme.palette.mode === "dark" ? "1px solid #67C99D" : undefined,
      backgroundColor:
        theme.palette.mode === "dark"
          ? (theme.palette.surfaces?.section || "#172b22")
          : undefined,
      color:
        theme.palette.mode === "dark"
          ? theme.palette.text.primary
          : undefined,
      "& .MuiMenuItem-root": {
        fontWeight: 800,
        textAlign: "right",
        justifyContent: "flex-start"
      }
    })
  },
  MenuListProps: {
    sx: {
      direction: "rtl",
      py: 0.5
    }
  }
};

const isValidGregorianDate = (value) => {
  if (!value) return false;

  const date = dayjs(value, "YYYY-MM-DD", true);

  if (!date.isValid()) return false;

  const currentYear = dayjs().year();
  const year = date.year();

  if (year < 1900 || year > currentYear) return false;

  return true;
};

const AddStudentDialog = ({
  open,
  onClose,
  onCreated,
  initialData = null,
  permissionMode = "addStudent"
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(`(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`);

  const [form, setForm] = useState(emptyForm);
  const [context, setContext] = useState(null);

  const [sectors, setSectors] = useState([]);
  const [sellers, setSellers] = useState([]);

  const [loadingContext, setLoadingContext] = useState(false);
  const [saving, setSaving] = useState(false);

  const birthDatePickerValue = useMemo(() => {
    if (!form.birthDate) return null;

    const date = dayjs(form.birthDate, "YYYY-MM-DD", true);

    return date.isValid() ? date : null;
  }, [form.birthDate]);

  const setValue = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const getSellerGuidFromLocalStorage = () => {
    const user = getCurrentUser();

    return (
      user?.sellerGuid ||
      user?.SellerGuid ||
      user?.sellerManGuid ||
      user?.sellermanGuid ||
      user?.SELLERMAN_GUID____ ||
      ""
    );
  };

  const getUserGuidFromLocalStorage = () => {
    const user = getCurrentUser();

    return (
      user?.guid ||
      user?.userGuid ||
      user?.UserGuid ||
      user?.USER_GUID____ ||
      ""
    );
  };

  const loadContext = async ({ force = false } = {}) => {
    const currentSellerGuid =
      getSellerGuidFromLocalStorage();

    const cachedBootstrap = !force
      ? getCachedAddStudentBootstrap(currentSellerGuid)
      : null;

    try {
      if (!cachedBootstrap) {
        setLoadingContext(true);
      }

      const {
        contextJson,
        sectorsJson,
        sellersJson
      } = await loadAddStudentBootstrap(
        currentSellerGuid,
        { force }
      );

      const apiSectors = Array.isArray(sectorsJson?.data)
        ? sectorsJson.data
        : [];

      const apiSellers = Array.isArray(sellersJson?.data)
        ? sellersJson.data
        : [];

      const finalSellers =
        contextJson?.sellerGuid && contextJson?.sellerName
          ? [
              {
                guid: contextJson.sellerGuid,
                name: contextJson.sellerName
              },
              ...apiSellers.filter(
                (x) => x.guid !== contextJson.sellerGuid
              )
            ]
          : apiSellers;

      setContext(contextJson);
      setSectors(apiSectors);
      setSellers(finalSellers);

      setForm({
        ...emptyForm,

        parentGuid: contextJson?.parentGuid || "",
        parentCode: contextJson?.parentCode || "",
        openAccountGuid: contextJson?.openAccountGuid || "",

        sellerGuid: contextJson?.sellerGuid || "",
        sellerName: contextJson?.sellerName || "",

        studentName: initialData?.studentName || "",
        studentTel:
          initialData?.studentTel ||
          initialData?.tel ||
          "",
        nationalId: initialData?.nationalId || "",
        notes: initialData?.notes || "",
        maden: Number(initialData?.maden || 0),
        daen: Number(initialData?.daen || 0),
        noData: Boolean(initialData?.fromArchive),
        isUse: true
      });
    } catch (error) {
      console.error(
        "AddStudentDialog loadContext error:",
        error
      );

      showError(
        error.message ||
          "حدث خطأ أثناء تجهيز شاشة الطالب"
      );

      setContext(null);
      setSectors([]);
      setSellers([]);

      setForm({
        ...emptyForm,
        birthDate: ""
      });
    } finally {
      setLoadingContext(false);
    }
  };

  // Warm the bootstrap data while the reception page is already open.
  // Therefore most clicks on "طالب جديد" open with cached context.
  useEffect(() => {
    const currentSellerGuid =
      getSellerGuidFromLocalStorage();

    loadAddStudentBootstrap(currentSellerGuid).catch(
      (error) => {
        console.error(
          "AddStudentDialog preload error:",
          error
        );
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      loadContext();
    }
  }, [open, initialData]);

  const validate = () => {
    if (!form.studentName.trim()) return "برجاء إدخال اسم الطالب";

    if (!form.studentNameEn.trim()) return "برجاء إدخال الاسم باللغة الإنجليزية";

    if (!/^[A-Za-z0-9 ]+$/.test(form.studentNameEn.trim())) {
      return "الاسم باللغة الإنجليزية يجب أن يحتوي على حروف إنجليزية وأرقام ومسافات فقط";
    }

    if (!form.studentTel.trim()) return "برجاء إدخال رقم الجوال";

    if (!/^0\d{9}$/.test(form.studentTel.trim())) {
      return "رقم الجوال يجب أن يبدأ بـ 0 ويتكون من 10 أرقام";
    }

    if (form.studentTel2.trim()) {
      if (!/^0\d{9}$/.test(form.studentTel2.trim())) {
        return "رقم الجوال الآخر يجب أن يبدأ بـ 0 ويتكون من 10 أرقام";
      }

      if (form.studentTel.trim() === form.studentTel2.trim()) {
        return "رقمي الجوال متشابهين";
      }
    }

    if (!form.nationalId.trim()) return "برجاء إدخال رقم الهوية";
    if (!form.email.trim()) return "برجاء إدخال الإيميل الخاص بالطالب";

    if (!form.birthDate) return "برجاء اختيار تاريخ الميلاد الميلادي";

    if (!isValidGregorianDate(form.birthDate)) {
      return "تاريخ الميلاد يجب أن يكون ميلادي وبالصيغة الصحيحة YYYY-MM-DD";
    }

    if (!form.companyGuid) return "برجاء تحديد القطاع";
    if (!form.sellerGuid) return "برجاء تحديد مندوب البيع";

    if (
      !form.parentGuid ||
      form.parentGuid === "00000000-0000-0000-0000-000000000000"
    ) {
      return "لم يتم قراءة حساب الأب للعملاء من الإعدادات";
    }

    if (Number(form.customerType) === 0) {
      const id = form.nationalId.trim();

      if (!/^\d{10}$/.test(id)) {
        return "رقم الهوية للعميل الفرد يجب أن يكون 10 أرقام";
      }

      if (Number(form.studentNational) === 0 && !id.startsWith("1")) {
        return "رقم هوية المواطن يجب أن يبدأ بالرقم 1";
      }

      if (
        Number(form.studentNational) === 1 &&
        (id.startsWith("0") || id.startsWith("1"))
      ) {
        return "رقم هوية الأجنبي يجب ألا يبدأ بـ 0 أو 1";
      }
    }

    return "";
  };

  const checkNormalAddPermission = async () => {
    const userGuid = getUserGuidFromLocalStorage();

    if (!userGuid) {
      throw new Error(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
    }

    const params = new URLSearchParams({
      userGuid,
      formName: "addstudent",
      action: "save"
    });

    const response = await fetch(
      `${API_BASE_URL}/api/reception-office/permissions/check?${params.toString()}`,
      { cache: "no-store" }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.error ||
        "تعذر فحص صلاحية إضافة الطالب"
      );
    }

    return {
      allowed: Boolean(result?.allowed),
      message:
        result?.message ||
        "لا تملك صلاحية إضافة طالب جديد"
    };
  };

  const checkAcceptOldStudentPermission = async () => {
    const userGuid = getUserGuidFromLocalStorage();

    if (!userGuid) {
      throw new Error(
        "تعذر قراءة بيانات المستخدم، برجاء تسجيل الدخول مرة أخرى"
      );
    }

    const params = new URLSearchParams({ userGuid });

    const response = await fetch(
      `${API_BASE_URL}/api/reception-office/permissions/accept-old-student?${params.toString()}`,
      { cache: "no-store" }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.message ||
        result?.error ||
        "تعذر فحص صلاحية قبول الطالب من الأرشيف"
      );
    }

    return {
      allowed: Boolean(result?.allowed),
      message:
        result?.message ||
        "لا تملك صلاحية قبول طالب من الأرشيف برجاء التواصل مع الإدارة"
    };
  };

  const handleSave = async () => {
    const validationMessage = validate();

    if (validationMessage) {
      showWarning(validationMessage);
      return;
    }

    try {
      setSaving(true);

      // إعادة فحص الصلاحية وقت الحفظ.
      const permission =
        permissionMode === "acceptOldStudent" || initialData?.fromArchive
          ? await checkAcceptOldStudentPermission()
          : await checkNormalAddPermission();

      if (!permission.allowed) {
        await showWarning(permission.message);
        return;
      }

      const payload = {
        userGuid: getUserGuidFromLocalStorage(),

        operationType:
          permissionMode === "acceptOldStudent" || initialData?.fromArchive
            ? "acceptOldStudent"
            : "addStudent",
        fromArchive: Boolean(initialData?.fromArchive),
        oldCustomerNo: initialData?.oldCustomerNo || "",
        oldBranchCode: Number(initialData?.branchCode || 0),

        acadmyId: form.acadmyId,

        parentGuid: form.parentGuid,
        parentCode: form.parentCode,
        openAccountGuid: form.openAccountGuid,

        studentName: form.studentName.trim(),
        studentNameEn: form.studentNameEn.trim(),
        birthDate: form.birthDate,

        studentTel: form.studentTel.trim(),
        studentTel2: form.studentTel2.trim(),
        nationalId: form.nationalId.trim(),
        email: form.email.trim(),

        studentType: Number(form.studentType),
        studentNational: Number(form.studentNational),
        studyType: Number(form.studyType),
        customerType: Number(form.customerType),

        companyGuid: form.companyGuid,
        sellerGuid: form.sellerGuid,

        maden: Number(form.maden || 0),
        daen: Number(form.daen || 0),

        isUse: Boolean(form.isUse),
        noData: Boolean(form.noData),

        notes: form.notes || ""
      };

      const response = await fetch(`${API_BASE_URL}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || result?.message || "تعذر حفظ الطالب");
      }

      await showSuccess(result?.message || "تم حفظ بيانات الطالب بنجاح");

      onCreated?.(result?.data || result);
      onClose?.();
    } catch (error) {
      showError(error.message || "حدث خطأ أثناء حفظ الطالب");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Dialog
        open={open}
        keepMounted
        transitionDuration={0}
        BackdropProps={{ transitionDuration: 0 }}
        onClose={() => !saving && onClose?.()}
        fullWidth
        maxWidth="lg"
        fullScreen={isPhone}
        sx={uiLayout.withUiSx({
          "& .MuiDialog-container": {
            alignItems: isPhone ? "stretch" : "center",
            justifyContent: "center",
            p: isPhone ? 0 : isTablet ? 0.7 : 1.5
          }
        }, uiLayout.dialogLayoutSx, FOCUS_BORDER_SX)}
        PaperProps={{
          sx: {
            width: isPhone ? "100vw" : isTablet ? "96vw" : undefined,
            maxWidth: isPhone ? "100vw" : isTablet ? "1100px" : undefined,
            height: isPhone ? "100dvh" : "auto",
            maxHeight: isPhone ? "100dvh" : isTablet ? "94dvh" : "90vh",
            m: isPhone ? 0 : isTablet ? 0.7 : 2,
            borderRadius: isPhone ? 0 : isTablet ? 2 : 4,
            direction: "rtl",
            overflow: "hidden",
            border: isDark
              ? "1px solid #67C99D"
              : `1px solid ${primaryLight}`,
            backgroundColor: isDark
              ? (theme.palette.surfaces?.card || "#13251d")
              : whiteColor,
            boxShadow: isDark
              ? "none"
              : "0 18px 50px rgba(5,117,70,0.18)",
            display: "flex",
            flexDirection: "column"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 950,
            color: isDark ? "#9BE0C1" : whiteColor,
            borderBottom: isDark
              ? "1px solid #67C99D"
              : `1px solid ${primaryDark}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isDark
              ? (theme.palette.surfaces?.section || "#172b22")
              : `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
            backgroundImage: isDark ? "none" : undefined,
            py: isPhone ? 0.6 : isTablet ? 0.8 : 1.7,
            px: isPhone ? 0.8 : isTablet ? 1.2 : 2.5,
            fontSize: isPhone ? "0.78rem" : isTablet ? "0.9rem" : undefined,
            lineHeight: 1.25,
            letterSpacing: "0.2px",
            flexShrink: 0
          }}
        >
          {initialData?.fromArchive
            ? "قبول طالب من الأرشيف"
            : "بطاقة تسجيل طالب"}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            background: (theme) =>
              theme.palette.mode === "dark"
                ? (theme.palette.surfaces?.card || "#13251d")
                : `linear-gradient(180deg, ${softBg} 0%, #f4fbf7 100%)`,
            p: isPhone ? 0.45 : isTablet ? 0.7 : 2,
            overflowY: "auto",
            flex: 1,
            minHeight: 0,

            "& .MuiTypography-root": {
              overflowWrap: "anywhere"
            },

            "& .MuiSelect-select": {
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
              py: isPhone ? 0.55 : isTablet ? 0.7 : undefined
            }
          }}
        >
          {loadingContext ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ py: isPhone ? 4 : isTablet ? 5 : 8 }}
            >
              <CircularProgress sx={{ color: primaryColor }} />
              <Typography
                sx={{
                  mt: isPhone ? 0.8 : 2,
                  fontWeight: 900,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                }}
              >
                جاري تجهيز شاشة إضافة الطالب...
              </Typography>
            </Stack>
          ) : (
            <Box>
              {initialData?.fromArchive ? (
                <Paper
                  elevation={0}
                  sx={{
                    mb: isPhone ? 0.5 : isTablet ? 0.7 : 2,
                    p: isPhone ? 0.55 : isTablet ? 0.8 : 1.6,
                    borderRadius: isPhone ? 1.2 : isTablet ? 1.6 : 3,
                    border: (theme) => `1px solid ${theme.palette.mode === "dark" ? "rgba(237,137,54,.5)" : "#ffcc80"}`,
                    backgroundColor: (theme) => theme.palette.mode === "dark" ? "rgba(237,137,54,.12)" : "#fff8e1"
                  }}
                >
                  <Typography sx={{ fontWeight: 950, color: "#e65100" }}>
                    يتم نقل الطالب من الأرشيف القديم إلى النظام الجديد
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.5,
                      fontWeight: 800,
                      color: isDark
                        ? theme.palette.text.primary
                        : textColor
                    }}
                  >
                    رقم العميل القديم: {initialData?.oldCustomerNo || "-"} — كود الفرع القديم: {initialData?.branchCode || "-"}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.4,
                      fontWeight: 800,
                      color: isDark
                        ? theme.palette.text.primary
                        : textColor
                    }}
                  >
                    الرصيد الافتتاحي: مدين {Number(initialData?.maden || 0).toLocaleString("en-US")} / دائن {Number(initialData?.daen || 0).toLocaleString("en-US")}
                  </Typography>
                </Paper>
              ) : null}

              <Paper
                elevation={0}
                sx={{
                  p: isPhone ? 0.55 : isTablet ? 0.8 : 2,
                  borderRadius: isPhone ? 1.2 : isTablet ? 1.6 : 3,
                  border: (theme) => theme.palette.mode === "dark" ? "1px solid #67C99D" : `1px solid ${primaryLight}`,
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? (theme.palette.surfaces?.section || "#172b22")
                      : whiteColor,
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "none"
                      : "0 10px 30px rgba(5,117,70,0.08)"
                }}
              >
                <Grid
                  container
                  spacing={isPhone ? 0.55 : isTablet ? 0.8 : 2}
                >
                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>كود</FieldLabel>
                    <TextField InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      value={form.acadmyId}
                      placeholder="يتولد تلقائي"
                      disabled
                      sx={uiLayout.withUiSx({
                        ...inputSx,
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#777",
                          fontWeight: 900,
                          cursor: "not-allowed"
                        }
                      }, uiLayout.formFieldSx)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={6}>
                    <FieldLabel>اسم الطالب</FieldLabel>
                    <TextField InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      value={form.studentName}
                      onChange={(e) => setValue("studentName", e.target.value)}
                      sx={uiLayout.withUiSx(inputSx, uiLayout.formFieldSx)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>رقم الجوال</FieldLabel>
                    <TextField InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      value={form.studentTel}
                      inputProps={{ maxLength: 10 , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setValue("studentTel", value);
                      }}
                      sx={uiLayout.withUiSx(inputSx, uiLayout.formFieldSx)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={6}>
                    <FieldLabel>الاسم بالإنجليزية</FieldLabel>
                    <TextField InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      value={form.studentNameEn}
                      inputProps={{ dir: "ltr" }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z0-9 ]/g, "");
                        setValue("studentNameEn", value);
                      }}
                      sx={uiLayout.withUiSx(inputSx, uiLayout.formFieldSx)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>رقم جوال آخر</FieldLabel>
                    <TextField InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      value={form.studentTel2}
                      inputProps={{ maxLength: 10 , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setValue("studentTel2", value);
                      }}
                      sx={uiLayout.withUiSx(inputSx, uiLayout.formFieldSx)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>رقم الهوية</FieldLabel>
                    <TextField InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      value={form.nationalId}
                      inputProps={{ maxLength: 10 , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setValue("nationalId", value);
                      }}
                      sx={uiLayout.withUiSx(inputSx, uiLayout.formFieldSx)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>الجنسية</FieldLabel>
                    <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                      <Select
                        value={form.studentNational}
                        MenuProps={selectMenuProps}
                        sx={selectSx}
                        onChange={(e) => {
                          setValue("studentNational", e.target.value);
                          setValue("nationalId", "");
                        }}
                      >
                        <MenuItem value={0}>مواطن</MenuItem>
                        <MenuItem value={1}>أجنبي</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>نوع العميل</FieldLabel>
                    <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                      <Select
                        value={form.customerType}
                        MenuProps={selectMenuProps}
                        sx={selectSx}
                        onChange={(e) => {
                          setValue("customerType", e.target.value);
                          setValue("nationalId", "");
                        }}
                      >
                        <MenuItem value={0}>فرد</MenuItem>
                        <MenuItem value={1}>شركة</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>النوع</FieldLabel>
                    <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                      <Select
                        value={form.studentType}
                        MenuProps={selectMenuProps}
                        sx={selectSx}
                        onChange={(e) => setValue("studentType", e.target.value)}
                      >
                        <MenuItem value={0}>ذكر</MenuItem>
                        <MenuItem value={1}>أنثى</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>تاريخ الميلاد ميلادي</FieldLabel>
                    <DatePicker
                      value={birthDatePickerValue}
                      format="YYYY-MM-DD"
                      views={["year", "month", "day"]}
                      minDate={dayjs("1900-01-01")}
                      maxDate={dayjs()}
                      onChange={(newValue) => {
                        if (!newValue || !dayjs(newValue).isValid()) {
                          setValue("birthDate", "");
                          return;
                        }

                        setValue("birthDate", dayjs(newValue).format("YYYY-MM-DD"));
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          placeholder: "YYYY-MM-DD",
                          sx: {
                            ...inputSx,
                            "& .MuiInputBase-root": {
                              minHeight: isPhone ? 31 : isTablet ? 34 : undefined
                            },
                            "& input": {
                              direction: "ltr",
                              textAlign: "left",
                              fontWeight: 900
                            }
                          },
                          inputProps: {
                            dir: "ltr"
                          }
                        },
                        openPickerButton: {
                          sx: {
                            color: primaryColor
                          }
                        },
                        popper: {
                          sx: {
                            direction: "ltr"
                          }
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={6}>
                    <FieldLabel>الإيميل</FieldLabel>
                    <TextField InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      value={form.email}
                      inputProps={{ dir: "ltr" }}
                      onChange={(e) => setValue("email", e.target.value)}
                      sx={uiLayout.withUiSx(inputSx, uiLayout.formFieldSx)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>نوع الدراسة</FieldLabel>
                    <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                      <Select
                        value={form.studyType}
                        MenuProps={selectMenuProps}
                        sx={selectSx}
                        onChange={(e) => setValue("studyType", e.target.value)}
                      >
                        <MenuItem value={0}>حضوري</MenuItem>
                        <MenuItem value={1}>عن بعد</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>القطاع</FieldLabel>
                    <FormControl sx={uiLayout.formFieldSx} fullWidth size="small" error={!form.companyGuid}>
                      <Select
                        value={form.companyGuid}
                        MenuProps={selectMenuProps}
                        displayEmpty
                        onChange={(e) => {
                          const selectedGuid = e.target.value;
                          const selectedSector = sectors.find(
                            (x) => x.guid === selectedGuid
                          );

                          setForm((prev) => ({
                            ...prev,
                            companyGuid: selectedGuid,
                            companyName: selectedSector?.name || ""
                          }));
                        }}
                        sx={selectSx}
                      >
                        <MenuItem value="">اختر القطاع</MenuItem>

                        {sectors.map((item) => (
                          <MenuItem key={item.guid} value={item.guid}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>

                      {!form.companyGuid && (
                        <Typography
                          sx={{
                            color: accentColor,
                            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
                            mt: isPhone ? 0.15 : isTablet ? 0.25 : 0.5,
                            textAlign: "start"
                          }}
                        >
                          لم يتم اختيار القطاع بعد
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>مندوب البيع</FieldLabel>
                    <FormControl sx={uiLayout.formFieldSx} fullWidth size="small" error={!form.sellerGuid}>
                      <Select
                        value={form.sellerGuid}
                        MenuProps={selectMenuProps}
                        displayEmpty
                        onChange={(e) => {
                          const selectedGuid = e.target.value;
                          const selectedSeller = sellers.find(
                            (x) => x.guid === selectedGuid
                          );

                          setForm((prev) => ({
                            ...prev,
                            sellerGuid: selectedGuid,
                            sellerName: selectedSeller?.name || ""
                          }));
                        }}
                        sx={selectSx}
                      >
                        <MenuItem value="">اختر مندوب البيع</MenuItem>

                        {sellers.map((item) => (
                          <MenuItem key={item.guid} value={item.guid}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>

                      {!form.sellerGuid && (
                        <Typography
                          sx={{
                            color: accentColor,
                            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : "0.75rem",
                            mt: isPhone ? 0.15 : isTablet ? 0.25 : 0.5,
                            textAlign: "start"
                          }}
                        >
                          لم يتم تحديد مندوب البيع
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FieldLabel>الحساب الرئيسي</FieldLabel>
                    <TextField InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      value={context?.parentName || "العملاء"}
                      disabled
                      sx={uiLayout.withUiSx({
                        ...inputSx,
                        "& .MuiInputBase-input": {
                          color: accentColor,
                          fontWeight: 900,
                          WebkitTextFillColor: accentColor
                        }
                      }, uiLayout.formFieldSx)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FieldLabel>ملاحظات</FieldLabel>
                    <TextField InputLabelProps={{ shrink: true }}
                      fullWidth
                      multiline
                      minRows={isPhone ? 2 : isTablet ? 3 : 4}
                      value={form.notes}
                      onChange={(e) => setValue("notes", e.target.value)}
                      sx={uiLayout.withUiSx(inputSx, uiLayout.formFieldSx)}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={uiLayout.withUiSx({
            p: isPhone ? 0.45 : isTablet ? 0.7 : 2,
            gap: isPhone ? 0.45 : isTablet ? 0.65 : 1,
            backgroundColor: isDark
              ? (theme.palette.surfaces?.section || "#172b22")
              : whiteColor,
            borderTop: isDark
              ? "1px solid #67C99D"
              : `1px solid ${primaryLight}`,
            flexShrink: 0,

            "& .MuiButton-root": {
              minHeight: isPhone ? 30 : isTablet ? 33 : undefined,
              px: isPhone ? 1 : isTablet ? 1.3 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            }
          }, uiLayout.dialogActionsSx)}
        >
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={onClose}
            disabled={saving}
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              fontWeight: 900,
              color: isDark ? "#9BE0C1" : accentColor,
              backgroundColor: "transparent",
              borderColor: isDark
                ? "#67C99D"
                : pinColor("#ffcdd2")
            }, uiLayout.buttonSx)}
          >
            خروج
          </Button>

          <Button
            variant={isDark ? "outlined" : "contained"}
            startIcon={
              saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />
            }
            onClick={handleSave}
            disabled={saving || loadingContext}
            sx={uiLayout.withUiSx({
              borderRadius: 2,
              fontWeight: 900,
              background: isDark
                ? "transparent"
                : `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`,
              color: isDark ? "#9BE0C1" : "#fff",
              borderColor: isDark ? "#67C99D" : primaryColor,
              boxShadow: isDark
                ? "none"
                : "0 8px 20px rgba(5,117,70,0.24)",
              "&:hover": {
                background: isDark
                  ? "transparent"
                  : `linear-gradient(135deg, ${primaryDark}, ${primaryColor})`,
                boxShadow: isDark
                  ? "none"
                  : "0 10px 24px rgba(5,117,70,0.30)"
              },
              "& .MuiButton-startIcon": {
                ml: 0.5,
                mr: 0
              }
            }, uiLayout.buttonSx)}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddStudentDialog;