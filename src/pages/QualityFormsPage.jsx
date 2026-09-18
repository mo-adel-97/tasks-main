import { PRINT_READY_SCRIPT } from '../utils/printReady';
import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Alert,
  AppBar,
  Box,
  GlobalStyles,
  Button,
  CircularProgress,
  Checkbox,
  createTheme,
  Divider,
  IconButton,
  FormControlLabel,
  FormControl,
  InputLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Swal from "sweetalert2";
import { QRCodeSVG } from "qrcode.react";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Print/export output must always read as a clean, official document —
// white paper with dark ink — no matter which theme (dark or light) the
// user is browsing the app in. Every print-sheet component below is
// rendered under this fixed theme instead of the live app theme, so a
// Typography with no explicit color (or any component reading
// theme.palette.*) never inherits the app's light-on-dark palette and
// goes invisible on the forced-white print page.
const PRINT_THEME = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#057546", dark: "#034d31", light: "#dff2e9" },
    secondary: { main: "#ae1e21" },
    text: { primary: "#111111", secondary: "#4b5a53" },
    background: { default: "#ffffff", paper: "#ffffff" },
    divider: "#9eb9ad"
  },
  typography: {
    fontFamily: "Cairo, Tahoma, Arial, sans-serif"
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#ffffff",
          color: "#111111",
          colorScheme: "light"
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: "#111111"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#ffffff",
          color: "#111111"
        }
      }
    }
  }
});

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const TEMPLATES = [
  {
    code: "HOURS_STATEMENT",
    name: "مشهد ساعات",
    enabled: true
  },
  {
    code: "REGISTERED_LETTER",
    name: "خطاب مسجل لدينا",
    enabled: true
  },
  {
    code: "COOP_TRAINING",
    name: "نموذج تدريب تعاوني",
    enabled: true
  },
  {
    code: "EXAM_SCHEDULE",
    name: "نموذج جدول اختبارات",
    enabled: true
  },
  {
    code: "ABSENCE_WARNING_1",
    name: "إنذار أول بالغياب",
    enabled: true
  },
  {
    code: "ABSENCE_WARNING_2",
    name: "إنذار ثاني بالغياب",
    enabled: true
  },
  {
    code: "COURSE_DEPRIVATION",
    name: "نموذج حرمان من مقرر",
    enabled: true
  },
  {
    code: "GRADE_WARNING_1",
    name: "إنذار أول بانخفاض المعدل",
    enabled: true
  },
  {
    code: "GRADE_WARNING_2",
    name: "إنذار ثاني بانخفاض المعدل",
    enabled: true
  },
  {
    code: "GRADE_WARNING_3",
    name: "إنذار ثالث بانخفاض المعدل",
    enabled: true
  },
  {
    code: "FINANCIAL_WARNING_1",
    name: "إنذار مالي رقم 1",
    enabled: true
  },
  {
    code: "FINANCIAL_WARNING_2",
    name: "إنذار مالي رقم 2",
    enabled: true
  },
  {
    code: "REGISTRATION_REJECTED",
    name: "خطاب تعذر تسجيله",
    enabled: true
  },
  {
    code: "DROPPED_STATEMENT",
    name: "إفادة طي قيده",
    enabled: true
  },
  {
    code: "COURSE_STUDIED_WAITING_EXAM",
    name: "خطاب دراسة دورة وبانتظار موعد الاختبار",
    enabled: true
  },
  {
    code: "NOT_REGISTERED_LETTER",
    name: "نموذج خطاب غير مسجل لدينا",
    enabled: true
  },
  // {
  //   code: "CHANGE_SPECIALIZATION",
  //   name: "طلب تغيير تخصص",
  //   enabled: false
  // }
];

const emptyForm = {
  documentGuid: "",
  documentNo: "",
  formCode: "HOURS_STATEMENT",
  formName: "مشهد ساعات",
  hijriDate: "",
  toText: "إلى من يهمه الأمر",
  studentName: "",
  trainingNo: "",
  nationality: "",
  nationalId: "",
  studySystem: "",
  studyStartDate: "",
  studentStatus: "",
  totalHours: "",
  earnedHours: "",
  email: "",
  studyPeriod: "مسائية",
  coopPhone: "",
  specialization: "",
  managerName: "مدير المعهد السعودي",
  managerTitle: "المتخصص العالي للتدريب",
  eligible: false,
  eligibilityMessage: "",
  statementText: "",
  levelName: "",
  examRows: [
    {
      dayDate: "",
      examDateValue: "",
      courseName: "",
      timeOne: "",
      timeOneValue: "",
      courseTwo: "",
      timeTwo: "",
      timeTwoValue: ""
    }
  ],
  sessionNo: "108",
  sessionHijriDate: "1440/11/02 هـ",
  articleNo: "13",
  warningNo: "1",
  absencePercent: "10",
  denialPercent: "25",
  termName: "",
  courses: "",
  gradeValue: "2.00",
  gradeMax: "5.00",
  periodHijriText: "/      / 14هـ",
  reasonText: "نظراً لحرمانك / غيابك عن أداء الاختبارات",
  financialAmount: "",
  firstWarningDate: "/      /      هـ",
  letterProgramName: "",
  letterApprovedProgramName: "",
  letterStartDate: "/      / 14هـ",
  letterEndDate: "/      / 14هـ",
  letterStudyHours: "180",
  letterRegisterDate: "/      / 14هـ",
  letterReasonFees: true,
  letterReasonCapacity: false
};

const readJson = async (response) => {
  const text = await response.text();

  let result = {};
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
      result?.details ||
      text ||
      `HTTP ${response.status}`
    );
  }

  return result;
};

const showError = (message) =>
  Swal.fire({
    icon: "error",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });

const DARK_ACTION_GLOBAL_STYLES = (theme) => {
  if (theme.palette.mode !== "dark") return {};

  const darkBorder = "#67C99D";
  const darkText = "#9BE0C1";

  return {
    ".MuiButton-root": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important",
      color: `${darkText} !important`,
      border: `1px solid ${darkBorder} !important`,
      boxShadow: "none !important",
      borderRadius: "10px !important",
      fontWeight: "800 !important"
    },
    ".MuiButton-root:hover": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important",
      color: "#C9F2DF !important",
      borderColor: `${darkBorder} !important`,
      boxShadow: "0 0 0 1px rgba(103,201,157,.18) !important"
    },
    ".MuiButton-root.Mui-disabled": {
      backgroundColor: "transparent !important",
      color: "rgba(155,224,193,.42) !important",
      borderColor: "rgba(103,201,157,.35) !important",
      boxShadow: "none !important"
    },
    ".MuiButton-root .MuiSvgIcon-root": {
      color: "inherit !important"
    },
    ".MuiIconButton-root": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important",
      color: `${darkText} !important`,
      border: `1px solid ${darkBorder} !important`,
      boxShadow: "none !important"
    },
    ".MuiIconButton-root:hover": {
      backgroundColor: "transparent !important",
      color: "#C9F2DF !important",
      borderColor: `${darkBorder} !important`
    },
    ".MuiIconButton-root.Mui-disabled": {
      backgroundColor: "transparent !important",
      color: "rgba(155,224,193,.38) !important",
      borderColor: "rgba(103,201,157,.30) !important"
    },
    ".MuiChip-root": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important",
      color: `${darkText} !important`,
      border: `1px solid ${darkBorder} !important`,
      boxShadow: "none !important"
    },
    ".MuiChip-icon, .MuiChip-deleteIcon": {
      color: `${darkText} !important`
    },
    ".MuiOutlinedInput-root": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important"
    },
    ".MuiOutlinedInput-notchedOutline": {
      borderColor: `${darkBorder} !important`
    },
    ".MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: `${darkBorder} !important`
    },
    ".MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: `${darkBorder} !important`
    },
    ".MuiSelect-icon": {
      color: `${darkText} !important`
    },
    ".MuiAlert-root": {
      backgroundColor: "transparent !important",
      backgroundImage: "none !important",
      color: `${theme.palette.text.primary} !important`,
      border: `1px solid ${darkBorder} !important`,
      boxShadow: "none !important"
    },
    ".MuiAlert-icon": {
      color: `${darkText} !important`
    },
    ".MuiPaginationItem-root": {
      backgroundColor: "transparent !important",
      color: `${darkText} !important`,
      border: "1px solid transparent !important"
    },
    ".MuiPaginationItem-root.Mui-selected": {
      backgroundColor: "transparent !important",
      color: "#C9F2DF !important",
      border: `1px solid ${darkBorder} !important`
    },
    ".MuiSwitch-track": {
      backgroundColor: "transparent !important",
      border: `1px solid ${darkBorder} !important`,
      opacity: "1 !important"
    },
    ".MuiSwitch-thumb": {
      backgroundColor: `${darkBorder} !important`
    },
    ".MuiSwitch-switchBase.Mui-checked": {
      color: `${darkBorder} !important`
    },
    ".MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
      backgroundColor: "transparent !important",
      borderColor: `${darkBorder} !important`,
      opacity: "1 !important"
    }
  };
};


const fieldSx = {
  "& .MuiInputBase-root": {
    fontFamily: "Cairo"
  },
  "& .MuiInputLabel-root": {
    fontFamily: "Cairo"
  },

  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
    "& .MuiInputLabel-root": {
      fontFamily: "Cairo",
      fontSize: "0.56rem",
      fontWeight: 800
    },

    "& .MuiInputBase-input, & .MuiSelect-select": {
      fontFamily: "Cairo",
      fontSize: "0.6875rem",
      fontWeight: 500,
      paddingTop: "4px",
      paddingBottom: "4px"
    },

    "& .MuiOutlinedInput-root": {
      minHeight: 32,
      borderRadius: "9px"
    }
  },

  "@media (max-width:599px)": {
    "& .MuiInputLabel-root": {
      fontSize: "0.46rem"
    },

    "& .MuiInputBase-input, & .MuiSelect-select": {
      fontSize: "0.5rem",
      paddingTop: "6px",
      paddingBottom: "6px"
    },

    "& .MuiOutlinedInput-root": {
      minHeight: 31,
      borderRadius: "8px"
    }
  }
};

const QualityFormsPage = () => {
  const theme = useTheme();

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isCompact = isPhone || isTablet;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [exportingPdf, setExportingPdf] =
    useState(false);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const userGuid = String(
    currentUser?.guid ||
    currentUser?.Guid ||
    ""
  ).trim();

  const [selectedTemplate, setSelectedTemplate] =
    useState("HOURS_STATEMENT");

  const selected =
    TEMPLATES.find(
      (item) =>
        item.code === selectedTemplate
    );

  const [form, setForm] =
    useState(emptyForm);

  const [loadingStudent, setLoadingStudent] =
    useState(false);

  const [saving, setSaving] =
    useState(false);


  const printRef = useRef(null);
  const lastLoadedNationalIdRef = useRef("");
  const loadSequenceRef = useRef(0);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const compactMenuProps = {
    MenuListProps: {
      dense: true,
      sx: {
        p: isCompact ? 0.25 : 0.75
      }
    },
    PaperProps: {
      sx: {
        maxHeight: isPhone ? 220 : isTablet ? 280 : 360,
        borderRadius: isCompact ? 1.3 : 2,
        "& .MuiMenuItem-root": {
          minHeight: isPhone ? 30 : isTablet ? 34 : 40,
          py: isPhone ? 0.35 : isTablet ? 0.48 : 0.75,
          px: isPhone ? 0.75 : isTablet ? 0.95 : 1.5,
          pl: isPhone ? 2 : isTablet ? 2.4 : 1.5,
          fontSize: isPhone ? "0.48rem" : isTablet ? "0.56rem" : "0.875rem",
          fontWeight: 850,
          lineHeight: 1.2,
          whiteSpace: "normal"
        }
      }
    }
  };

  const update = (field) => (event) => {
    const rawValue = event.target.value;
    const value =
      field === "nationalId"
        ? String(rawValue)
            .replace(/\D/g, "")
            .slice(0, 10)
        : rawValue;

    setForm((current) => {
      if (field !== "nationalId") {
        return {
          ...current,
          [field]: value
        };
      }

      lastLoadedNationalIdRef.current = "";

      return {
        ...current,
        nationalId: value,
        studentName: "",
        trainingNo: "",
        nationality: "",
        studySystem: "",
        studyStartDate: "",
        studentStatus: "",
        totalHours: "",
        earnedHours: "",
        email: "",
        studyPeriod:
          current.studyPeriod || "مسائية",
        coopPhone: "",
        specialization: "",
        levelName: "",
        termName: "",
        gradeValue: current.gradeValue || "2.00",
        gradeMax: current.gradeMax || "5.00",
        periodHijriText:
          current.periodHijriText || "/      / 14هـ",
        reasonText:
          current.reasonText ||
          "نظراً لحرمانك / غيابك عن أداء الاختبارات",
        financialAmount:
          current.financialAmount || "",
        firstWarningDate:
          current.firstWarningDate || "/      /      هـ",
        letterProgramName:
          current.letterProgramName || "",
        letterApprovedProgramName:
          current.letterApprovedProgramName || "",
        letterStartDate:
          current.letterStartDate || "/      / 14هـ",
        letterEndDate:
          current.letterEndDate || "/      / 14هـ",
        letterStudyHours:
          current.letterStudyHours || "180",
        letterRegisterDate:
          current.letterRegisterDate || "/      / 14هـ",
        letterReasonFees:
          current.letterReasonFees ?? true,
        letterReasonCapacity:
          current.letterReasonCapacity ?? false,
        accountGuid: null,
        eligible: false,
        eligibilityMessage: "",
        documentGuid: "",
        documentNo: "",
        verificationUrl: ""
      };
    });
  };

  const loadStudent =
    useCallback(async (nationalIdValue = "") => {
      const nationalId =
        String(
          nationalIdValue ||
          form.nationalId ||
          ""
        )
          .replace(/\D/g, "")
          .trim();

      if (nationalId.length !== 10) {
        await showError(
          "برجاء إدخال سجل مدني صحيح مكوّن من 10 أرقام"
        );
        return;
      }

      const requestSequence =
        ++loadSequenceRef.current;

      try {
        setLoadingStudent(true);

        const params =
          new URLSearchParams({
            userGuid,
            nationalId,
            formCode: selectedTemplate
          });

        const response = await fetch(
          `${API_BASE_URL}/api/quality-forms/hours-statement/student?${params.toString()}`,
          {
            cache: "no-store"
          }
        );

        const result =
          await readJson(response);

        const data =
          result?.data || {};

        if (
          requestSequence !==
          loadSequenceRef.current
        ) {
          return;
        }

        lastLoadedNationalIdRef.current =
          nationalId;

        setForm((current) => ({
          ...current,
          ...data,
          nationalId,
          formCode:
            selectedTemplate,
          formName:
            selected?.name ||
            "مشهد ساعات",
          toText:
            current.toText ||
            "إلى من يهمه الأمر",
          managerName:
            current.managerName ||
            "مدير المعهد السعودي",
          managerTitle:
            current.managerTitle ||
            "المتخصص العالي للتدريب",
          documentGuid: "",
          documentNo: ""
        }));

        if (!data?.eligible) {
          await Swal.fire({
            icon: "warning",
            title: "عدم استحقاق مشهد الساعات",
            text:
              data?.eligibilityMessage ||
              "الطالب غير مستحق لإصدار مشهد ساعات",
            confirmButtonText: "حسنًا"
          });
        }
      } catch (error) {
        if (
          requestSequence !==
          loadSequenceRef.current
        ) {
          return;
        }

        lastLoadedNationalIdRef.current = "";

        setForm((current) => ({
          ...emptyForm,
          nationalId:
            current.nationalId,
          hijriDate:
            current.hijriDate,
          toText:
            current.toText,
          managerName:
            current.managerName,
          managerTitle:
            current.managerTitle
        }));

        await showError(
          error?.message ||
          "تعذر تحميل بيانات المتدرب"
        );
      } finally {
        if (
          requestSequence ===
          loadSequenceRef.current
        ) {
          setLoadingStudent(false);
        }
      }
    }, [
      form.nationalId,
      userGuid,
      selectedTemplate,
      selected?.name
    ]);

  useEffect(() => {
    const nationalId =
      String(form.nationalId || "")
        .replace(/\D/g, "")
        .trim();

    if (
      nationalId.length !== 10 ||
      loadingStudent ||
      nationalId ===
        lastLoadedNationalIdRef.current
    ) {
      return undefined;
    }

    const timer = window.setTimeout(
      () => {
        loadStudent(nationalId);
      },
      350
    );

    return () =>
      window.clearTimeout(timer);
  }, [
    form.nationalId,
    loadingStudent,
    loadStudent
  ]);

  const validate = () => {
    if (
      selectedTemplate ===
        "HOURS_STATEMENT" &&
      !form.eligible
    ) {
      return "لا يمكن إصدار مشهد الساعات قبل التحقق من استحقاق الطالب";
    }

    if (!String(form.studentName).trim()) {
      return "اسم المتدرب مطلوب";
    }

    if (!String(form.nationalId).trim()) {
      return "السجل المدني مطلوب";
    }

    if (
      ["HOURS_STATEMENT", "REGISTERED_LETTER", "COOP_TRAINING"].includes(selectedTemplate) &&
      !String(form.trainingNo).trim()
    ) {
      return "الرقم التدريبي مطلوب";
    }

    if (selectedTemplate === "EXAM_SCHEDULE") {
      if (!String(form.specialization).trim()) return "اسم الدبلوم مطلوب";
      if (!String(form.levelName).trim()) return "المستوى مطلوب";
      if (!(form.examRows || []).some((row) => String(row.dayDate || row.courseName || "").trim())) {
        return "أدخل صفًا واحدًا على الأقل في جدول الاختبارات";
      }
    }

    if (
      [
        "ABSENCE_WARNING_1",
        "ABSENCE_WARNING_2",
        "COURSE_DEPRIVATION"
      ].includes(selectedTemplate)
    ) {
      if (!String(form.specialization).trim()) {
        return "اسم الدبلوم مطلوب";
      }

      if (!String(form.termName).trim()) {
        return "الفصل التدريبي مطلوب";
      }
    }

    if (
      [
        "GRADE_WARNING_1",
        "GRADE_WARNING_2",
        "GRADE_WARNING_3"
      ].includes(selectedTemplate)
    ) {
      if (!String(form.specialization).trim()) {
        return "اسم الدبلوم مطلوب";
      }

      if (!String(form.gradeValue).trim()) {
        return "قيمة المعدل مطلوبة";
      }

      if (!String(form.gradeMax).trim()) {
        return "الحد الأعلى للمعدل مطلوب";
      }

      if (!String(form.periodHijriText).trim()) {
        return "الفترة التدريبية مطلوبة";
      }

      if (!String(form.reasonText).trim()) {
        return "سبب انخفاض المعدل مطلوب";
      }
    }

    if (
      [
        "FINANCIAL_WARNING_1",
        "FINANCIAL_WARNING_2"
      ].includes(selectedTemplate)
    ) {
      if (!String(form.specialization).trim()) {
        return "اسم الدبلوم مطلوب";
      }

      if (!String(form.financialAmount).trim()) {
        return "قيمة المستحقات المالية مطلوبة";
      }

      if (
        selectedTemplate === "FINANCIAL_WARNING_2" &&
        !String(form.firstWarningDate).trim()
      ) {
        return "تاريخ الإنذار المالي الأول مطلوب";
      }
    }

    if (
      [
        "REGISTRATION_REJECTED",
        "DROPPED_STATEMENT",
        "COURSE_STUDIED_WAITING_EXAM",
        "NOT_REGISTERED_LETTER"
      ].includes(selectedTemplate)
    ) {
      if (
        ![
          "REGISTRATION_REJECTED",
          "DROPPED_STATEMENT"
        ].includes(selectedTemplate) &&
        !String(form.letterProgramName).trim()
      ) {
        return selectedTemplate === "COURSE_STUDIED_WAITING_EXAM"
          ? "اسم الدورة مطلوب"
          : selectedTemplate === "NOT_REGISTERED_LETTER"
            ? "اسم الدبلوم أو الدورة مطلوب"
            : "اسم الدبلوم مطلوب";
      }

      if (
        selectedTemplate === "REGISTRATION_REJECTED" &&
        !String(form.letterApprovedProgramName).trim()
      ) {
        return "اسم دورة أو دبلوم الموافقة مطلوب";
      }

      if (
        selectedTemplate === "COURSE_STUDIED_WAITING_EXAM" &&
        !String(form.letterStudyHours).trim()
      ) {
        return "عدد ساعات الدورة مطلوب";
      }
    }

    if (!String(form.specialization).trim()) {
      return "تخصص المتدرب مطلوب";
    }

    if (
      selectedTemplate ===
        "REGISTERED_LETTER" &&
      !String(form.studyPeriod || "").trim()
    ) {
      return "برجاء اختيار فترة الدراسة صباحية أو مسائية";
    }

    if (
      selectedTemplate ===
        "COOP_TRAINING" &&
      !String(form.coopPhone || "").trim()
    ) {
      return "رقم الجوال مطلوب في نموذج التدريب التعاوني";
    }

    if (
      selectedTemplate ===
        "COOP_TRAINING" &&
      !String(form.email || "").trim()
    ) {
      return "البريد الإلكتروني مطلوب في نموذج التدريب التعاوني";
    }

    return "";
  };

  const saveDocument = async () => {
    const validationError =
      validate();

    if (validationError) {
      await showError(validationError);
      return;
    }

    try {
      setSaving(true);

      const createdByName =
        currentUser?.fullName ||
        currentUser?.FullName ||
        currentUser?.userName ||
        currentUser?.UserName ||
        "";

      let endpoint =
        `${API_BASE_URL}/api/quality-forms/hours-statement`;

      let requestBody;

      if (
        [
          "REGISTRATION_REJECTED",
          "DROPPED_STATEMENT",
          "COURSE_STUDIED_WAITING_EXAM",
          "NOT_REGISTERED_LETTER"
        ].includes(selectedTemplate)
      ) {
        endpoint =
          `${API_BASE_URL}/api/quality-forms/general-letter`;

        requestBody = {
          userGuid,
          documentGuid:
            form.documentGuid || null,
          formCode: selectedTemplate,
          formName:
            selected?.name || "خطاب جودة",
          createdByName,
          hijriDate:
            form.hijriDate || "",
          studentName:
            form.studentName || "",
          nationalId:
            form.nationalId || "",
          diplomaName:
            [
              "REGISTRATION_REJECTED",
              "DROPPED_STATEMENT"
            ].includes(selectedTemplate)
              ? form.specialization || ""
              : form.letterProgramName || "",
          letterProgramName:
            [
              "REGISTRATION_REJECTED",
              "DROPPED_STATEMENT"
            ].includes(selectedTemplate)
              ? form.specialization || ""
              : form.letterProgramName || "",
          letterApprovedProgramName:
            form.letterApprovedProgramName || "",
          letterStartDate:
            form.letterStartDate || "",
          letterEndDate:
            form.letterEndDate || "",
          letterStudyHours:
            form.letterStudyHours || "",
          letterRegisterDate:
            form.letterRegisterDate || "",
          letterReasonFees:
            Boolean(form.letterReasonFees),
          letterReasonCapacity:
            Boolean(form.letterReasonCapacity)
        };
      } else if (selectedTemplate === "EXAM_SCHEDULE") {
        endpoint =
          `${API_BASE_URL}/api/quality-forms/exam-schedule`;

        requestBody = {
          userGuid,
          documentGuid:
            form.documentGuid || null,
          formCode: "EXAM_SCHEDULE",
          formName:
            selected?.name ||
            "نموذج جدول اختبارات",
          createdByName,
          hijriDate:
            form.hijriDate || "",
          toText:
            form.toText ||
            "إلى من يهمه الأمر",
          diplomaName:
            form.specialization || "",
          levelName:
            form.levelName || "",
          studentName:
            form.studentName || "",
          nationalId:
            form.nationalId || "",
          statementText:
            form.statementText || "",
          rows: (form.examRows || [])
            .filter((row) =>
              String(
                row.dayDate ||
                row.courseName ||
                row.timeOne ||
                row.courseTwo ||
                row.timeTwo ||
                ""
              ).trim()
            )
            .map((row) => ({
              dayDate:
                row.dayDate || "",
              courseName:
                row.courseName || "",
              timeOne:
                row.timeOne || "",
              courseTwo:
                row.courseTwo || "",
              timeTwo:
                row.timeTwo || ""
            }))
        };
      } else {
        const payload = { ...form };

        if (
          [
            "ABSENCE_WARNING_1",
            "ABSENCE_WARNING_2",
            "COURSE_DEPRIVATION"
          ].includes(selectedTemplate)
        ) {
          const isSecondAbsenceWarning =
            selectedTemplate === "ABSENCE_WARNING_2";

          const isCourseDeprivation =
            selectedTemplate === "COURSE_DEPRIVATION";

          payload.trainingNo =
            form.sessionNo || "108";
          payload.nationality =
            form.sessionHijriDate ||
            "1440/11/02 هـ";
          payload.studySystem =
            form.articleNo || "13";
          payload.studyStartDate =
            form.warningNo ||
            (
              isCourseDeprivation
                ? "3"
                : isSecondAbsenceWarning
                  ? "2"
                  : "1"
            );
          payload.studentStatus =
            form.termName || "";
          payload.totalHours =
            form.absencePercent ||
            (
              isCourseDeprivation
                ? "25"
                : isSecondAbsenceWarning
                  ? "20"
                  : "10"
            );
          payload.earnedHours =
            form.denialPercent || "25";
          payload.coopPhone =
            form.courses || "";
        }

        if (
          [
            "GRADE_WARNING_1",
            "GRADE_WARNING_2",
            "GRADE_WARNING_3"
          ].includes(selectedTemplate)
        ) {
          const gradeWarningNumber =
            selectedTemplate === "GRADE_WARNING_3"
              ? "3"
              : selectedTemplate === "GRADE_WARNING_2"
                ? "2"
                : "1";

          payload.trainingNo =
            form.sessionNo || "108";
          payload.nationality =
            form.sessionHijriDate ||
            "1440/11/02 هـ";
          payload.studySystem =
            form.articleNo || "15";
          payload.studyStartDate =
            form.warningNo || gradeWarningNumber;
          payload.studentStatus =
            form.periodHijriText || "";
          payload.totalHours =
            form.gradeValue || "2.00";
          payload.earnedHours =
            form.gradeMax || "5.00";
          payload.coopPhone =
            form.reasonText || "";
        }

        if (
          [
            "FINANCIAL_WARNING_1",
            "FINANCIAL_WARNING_2"
          ].includes(selectedTemplate)
        ) {
          const isSecondFinancialWarning =
            selectedTemplate === "FINANCIAL_WARNING_2";

          payload.trainingNo =
            isSecondFinancialWarning ? "2" : "1";

          payload.studyStartDate =
            isSecondFinancialWarning ? "2" : "1";

          payload.totalHours =
            form.financialAmount || "";

          payload.studentStatus =
            isSecondFinancialWarning
              ? form.firstWarningDate || ""
              : "";

          payload.coopPhone = "";
          payload.earnedHours = "";
        }

        requestBody = {
          ...payload,
          documentGuid:
            form.documentGuid || null,
          accountGuid:
            form.accountGuid || null,
          earnedHours:
            selectedTemplate ===
            "COOP_TRAINING"
              ? form.coopPhone
              : payload.earnedHours,
          coopPhone:
            payload.coopPhone || "",
          studyPeriod:
            form.studyPeriod || "",
          userGuid,
          createdByName
        };
      }

      const response = await fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(requestBody)
        }
      );

      const result =
        await readJson(response);

      setForm((current) => ({
        ...current,
        documentGuid:
          result?.data?.documentGuid ||
          current.documentGuid,
        documentNo:
          String(
            result?.data?.documentNo ||
            current.documentNo ||
            ""
          ),
        verificationUrl:
          result?.data?.verificationUrl ||
          ""
      }));

      await Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text:
          `تم حفظ ${selected?.name || "النموذج"} برقم صادر ${result?.data?.documentNo}`,
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });
    } catch (error) {
      await showError(
        error?.message ||
        `تعذر حفظ ${selected?.name || "النموذج"}`
      );
    } finally {
      setSaving(false);
    }
  };

// Keep every intentionally single A4 print page on ONE page without clipping.
// If a template is a little taller than its reserved A4 body, shrink only the
// page body just enough to fit; the footer stays fixed and is never cut.
const fitPrintPagesForExport = (rootNode) => {
  if (!rootNode) return;

  const pageNodes = rootNode.matches?.(".print-page, .print-sheet")
    ? [rootNode, ...rootNode.querySelectorAll(".print-page, .print-sheet")]
    : Array.from(rootNode.querySelectorAll(".print-page, .print-sheet"));

  const uniquePages = Array.from(new Set(pageNodes));

  uniquePages.forEach((pageNode) => {
    const body = pageNode.querySelector(":scope > .print-page-body") ||
      pageNode.querySelector(".print-page-body");

    if (!body) return;

    body.style.transform = "none";
    body.style.width = "100%";

    const availableHeight = body.clientHeight;
    const neededHeight = body.scrollHeight;

    if (!availableHeight || neededHeight <= availableHeight + 1) return;

    // Small safety margin prevents the last pixels from being eaten by
    // browser/PDF rounding. Never create a second page to solve overflow.
    const scale = Math.max(0.90, Math.min(0.995, (availableHeight - 4) / neededHeight));

    body.style.transformOrigin = "top right";
    body.style.transform = `scale(${scale})`;
    body.style.width = `${100 / scale}%`;
  });
};

const exportPdfDirect = async () => {
  if (!form.documentGuid) {
    await showError("احفظ النموذج أولًا قبل التصدير");
    return;
  }

  const sourceNode = printRef.current;

  if (!sourceNode) {
    await showError("تعذر تجهيز نموذج الطباعة");
    return;
  }

  const popup = window.open(
    "",
    "_blank",
    "width=1050,height=1350"
  );

  if (!popup) {
    await showError(
      "تعذر فتح نافذة الطباعة. برجاء السماح بالنوافذ المنبثقة."
    );
    return;
  }

  try {
    /*
      نعمل Clone للنموذج، ثم ننقل الـ computed styles
      بدل الاعتماد على كلاسات MUI بعد الـ production build.
    */
    const clonedNode = sourceNode.cloneNode(true);

    const sourceElements = [
      sourceNode,
      ...sourceNode.querySelectorAll("*")
    ];

    const clonedElements = [
      clonedNode,
      ...clonedNode.querySelectorAll("*")
    ];

    sourceElements.forEach((sourceElement, index) => {
      const clonedElement = clonedElements[index];

      if (!clonedElement) {
        return;
      }

      const computedStyle =
        window.getComputedStyle(sourceElement);

      let inlineStyle = "";

      for (
        let styleIndex = 0;
        styleIndex < computedStyle.length;
        styleIndex += 1
      ) {
        const propertyName =
          computedStyle[styleIndex];

        const propertyValue =
          computedStyle.getPropertyValue(propertyName);

        const propertyPriority =
          computedStyle.getPropertyPriority(propertyName);

        inlineStyle += `${propertyName}:${propertyValue}${
          propertyPriority ? " !important" : ""
        };`;
      }

      clonedElement.setAttribute(
        "style",
        `${clonedElement.getAttribute("style") || ""};${inlineStyle}`
      );
    });

    /*
      نحول مسارات الصور إلى روابط كاملة.
      هذا يمنع أي اختلاف في تفسير /image.png داخل about:blank.
    */
    clonedNode
      .querySelectorAll("img")
      .forEach((image) => {
        const source = image.getAttribute("src");

        if (!source) {
          return;
        }

        try {
          image.src = new URL(
            source,
            window.location.origin
          ).href;
        } catch {
          // نترك المسار كما هو عند تعذر تحويله.
        }
      });

    /*
      تحويل روابط ملفات CSS إلى absolute URLs.
    */
    const externalStyles = Array.from(
      document.querySelectorAll(
        'link[rel="stylesheet"]'
      )
    )
      .map((link) => {
        const href = link.getAttribute("href");

        if (!href) {
          return "";
        }

        const absoluteHref = new URL(
          href,
          window.location.href
        ).href;

        return `<link rel="stylesheet" href="${absoluteHref}" />`;
      })
      .join("\n");

    const baseUrl =
      `${window.location.origin}/`;

    popup.document.open();

    popup.document.write(`
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />

          <base href="${baseUrl}" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <title>
            ${selected?.name || "نموذج جودة"}
            ${form.documentNo || ""}
          </title>

          ${externalStyles}

          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }

            html,
            body {
              width: 210mm !important;
              min-width: 210mm !important;
              max-width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111111 !important;
              color-scheme: light !important;
              overflow: visible !important;
              font-family: Cairo, Tahoma, Arial, sans-serif !important;
              font-synthesis: none !important;
              text-rendering: geometricPrecision !important;
              -webkit-font-smoothing: antialiased !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            *,
            *::before,
            *::after {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body {
              display: block !important;
            }

            .print-page-body {
              transform-origin: top right !important;
              box-sizing: border-box !important;
            }

            .print-document {
              width: 210mm !important;
              min-width: 210mm !important;
              max-width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111111 !important;
            }

            .print-sheet,
            .print-page {
              width: 210mm !important;
              min-width: 210mm !important;
              max-width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 !important;
              background: #ffffff !important;
              color: #111111 !important;
              box-shadow: none !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid-page !important;
            }

            .print-page {
              page-break-after: always !important;
              break-after: page !important;
            }

            .print-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }

            img,
            svg {
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
            }

            @media print {
              html,
              body {
                width: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #111111 !important;
              }
            }
          </style>
        ${PRINT_READY_SCRIPT}</head>

        <body>
          ${clonedNode.outerHTML}

          <script>
            const waitForImages = async () => {
              const images = Array.from(
                document.images || []
              );

              await Promise.all(
                images.map((image) => {
                  if (
                    image.complete &&
                    image.naturalWidth > 0
                  ) {
                    return Promise.resolve();
                  }

                  return new Promise((resolve) => {
                    const finish = () => resolve();

                    image.addEventListener(
                      "load",
                      finish,
                      { once: true }
                    );

                    image.addEventListener(
                      "error",
                      finish,
                      { once: true }
                    );

                    setTimeout(finish, 5000);
                  });
                })
              );
            };

            window.addEventListener(
              "load",
              async () => {
                await waitForImages();

                if (document.fonts?.ready) {
                  try {
                    await document.fonts.ready;
                  } catch {}
                }

                const fitPrintPages = () => {
                  const pages = Array.from(
                    document.querySelectorAll('.print-page, .print-sheet')
                  );

                  pages.forEach((page) => {
                    const body = page.querySelector(':scope > .print-page-body') ||
                      page.querySelector('.print-page-body');

                    if (!body) return;

                    body.style.transform = 'none';
                    body.style.width = '100%';

                    const available = body.clientHeight;
                    const needed = body.scrollHeight;

                    if (!available || needed <= available + 1) return;

                    const scale = Math.max(
                      0.90,
                      Math.min(0.995, (available - 4) / needed)
                    );

                    body.style.transformOrigin = 'top right';
                    body.style.transform = 'scale(' + scale + ')';
                    body.style.width = (100 / scale) + '%';
                  });
                };

                fitPrintPages();

                await new Promise((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(resolve))
                );

                setTimeout(() => {
                  window.focus();
                  printWhenReady();
                }, 350);
              }
            );
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  } catch (error) {
    popup.close();

    await showError(
      error?.message ||
      "حدث خطأ أثناء تجهيز نافذة الطباعة"
    );
  }
};


const exportPdfMobile = async () => {
  if (!form.documentGuid) {
    await showError("احفظ النموذج أولًا قبل التصدير");
    return;
  }

  const sourceNode = printRef.current;

  if (!sourceNode) {
    await showError("تعذر تجهيز نموذج PDF");
    return;
  }

  let exportHost = null;

  try {
    setExportingPdf(true);

    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    exportHost = document.createElement("div");
    exportHost.setAttribute("data-quality-pdf-host", "true");

    Object.assign(exportHost.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "210mm",
      background: "#ffffff",
      color: "#111111",
      colorScheme: "light",
      opacity: "1",
      pointerEvents: "none",
      zIndex: "-10000",
      overflow: "visible"
    });

    const clonedNode = sourceNode.cloneNode(true);

    clonedNode.style.opacity = "1";
    clonedNode.style.visibility = "visible";
    clonedNode.style.pointerEvents = "none";
    clonedNode.style.transform = "none";
    clonedNode.style.margin = "0";
    clonedNode.style.background = "#ffffff";
    clonedNode.style.color = "#111111";
    clonedNode.style.colorScheme = "light";

    clonedNode
      .querySelectorAll("img")
      .forEach((image) => {
        const value = image.getAttribute("src");

        if (!value) return;

        try {
          image.src = new URL(
            value,
            window.location.origin
          ).href;
          image.crossOrigin = "anonymous";
        } catch {}
      });

    exportHost.appendChild(clonedNode);
    document.body.appendChild(exportHost);

    const images = Array.from(
      clonedNode.querySelectorAll("img")
    );

    await Promise.all(
      images.map(
        (image) =>
          new Promise((resolve) => {
            if (
              image.complete &&
              image.naturalWidth > 0
            ) {
              resolve();
              return;
            }

            const finish = () => resolve();

            image.addEventListener(
              "load",
              finish,
              { once: true }
            );

            image.addEventListener(
              "error",
              finish,
              { once: true }
            );

            window.setTimeout(finish, 5000);
          })
      )
    );

    // The export host is rendered, so we can measure the real A4 content and
    // fit any slightly-overflowing page before html2canvas captures it.
    fitPrintPagesForExport(clonedNode);

    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );

    const explicitPages = Array.from(
      clonedNode.querySelectorAll(".print-page")
    );

    const pages =
      explicitPages.length > 0
        ? explicitPages
        : [clonedNode];

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    for (
      let index = 0;
      index < pages.length;
      index += 1
    ) {
      const pageNode = pages[index];

      const canvas = await html2canvas(
        pageNode,
        {
          scale: isPhone ? 3.1 : 3.25,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 7000,
          width: pageNode.scrollWidth,
          height: pageNode.scrollHeight,
          windowWidth: Math.max(
            pageNode.scrollWidth,
            794
          ),
          windowHeight: Math.max(
            pageNode.scrollHeight,
            1123
          ),
          scrollX: 0,
          scrollY: 0
        }
      );

      const imageData =
        canvas.toDataURL("image/png");

      if (index > 0) {
        pdf.addPage("a4", "portrait");
      }

      pdf.addImage(
        imageData,
        "PNG",
        0,
        0,
        210,
        297,
        undefined,
        "FAST"
      );
    }

    const safeName = String(
      selected?.name || "نموذج جودة"
    )
      .replace(/[\\/:*?"<>|]+/g, "-")
      .trim();

    const fileName =
      `${safeName}${
        form.documentNo
          ? `-${form.documentNo}`
          : ""
      }.pdf`;

    pdf.save(fileName);
  } catch (error) {
    await showError(
      error?.message ||
        "تعذر إنشاء ملف PDF مباشرة"
    );
  } finally {
    if (
      exportHost &&
      exportHost.parentNode
    ) {
      exportHost.parentNode.removeChild(
        exportHost
      );
    }

    setExportingPdf(false);
  }
};

const handleExportPdf = () => {
  if (isCompact) {
    return exportPdfMobile();
  }

  return exportPdfDirect();
};

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><GlobalStyles styles={DARK_ACTION_GLOBAL_STYLES} /><Box
      dir="rtl"
      sx={(theme) => ({
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        direction: "rtl",
        background: theme.palette.mode === "dark"
          ? theme.palette.background.default
          : "linear-gradient(135deg,#f5faf7 0%,#fff 55%,#eef8f3 100%)",
        position: "relative"
      })}
    >
      {!isDesktop && (
        <AppBar
          position="sticky"
          elevation={0}
          sx={(theme) => ({
            top: 0,
            background: theme.palette.mode === "dark" ? theme.palette.surfaces.card : "rgba(255,255,255,.96)",
            backdropFilter: "blur(14px)",
            color: theme.palette.mode === "dark" ? theme.palette.text.primary : "#17372b",
            borderBottom: theme.palette.mode === "dark" ? "1px solid #67C99D" : "1px solid rgba(5,117,70,.12)"
          })}
        >
          <Toolbar
            sx={{
              direction: "rtl",
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)",
                md: "var(--app-header-height, 56px)"
              },
              px: {
                xs: 0.8,
                sm: 1.2,
                md: 1.5
              },
              gap: 0.8
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                setMobileSidebarOpen(
                  (current) => !current
                );
              }}
              aria-label={
                mobileSidebarOpen
                  ? "إغلاق القائمة"
                  : "فتح القائمة"
              }
              aria-expanded={
                mobileSidebarOpen
              }
              sx={{
                width: {
                  xs: 36,
                  sm: 40,
                  md: 42
                },
                height: {
                  xs: 36,
                  sm: 40,
                  md: 42
                },
                flexShrink: 0,
                color: "#fff",
                background:
                  "linear-gradient(135deg,#057546,#034d31)",
                boxShadow:
                  "0 6px 16px rgba(5,117,70,.22)"
              }}
            >
              <MenuRoundedIcon
                sx={{
                  fontSize: {
                    xs: 20,
                    sm: 22,
                    md: 23
                  }
                }}
              />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.8rem",
                  md: "0.88rem"
                },
                color: "#17372b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              نماذج الجودة
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      <PageContainer
        component="main"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          ml: 0,
          mr: 0,
          boxSizing: "border-box",
          overflowX: "hidden",
          direction: "rtl",
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={(theme) => ({
            p: isPhone ? 0.65 : isTablet ? 0.9 : 1.15,
            mb: isPhone ? 0.55 : isTablet ? 0.75 : 1,
            borderRadius: isPhone ? 1.5 : isTablet ? 2 : 2.5,
            border: theme.palette.mode === "dark" ? "1px solid #67C99D" : "1px solid rgba(5,117,70,.14)",
            backgroundColor: theme.palette.mode === "dark" ? theme.palette.surfaces.card : undefined,
            direction: "rtl"
          })}
        >
          <Stack
            direction="row"
            spacing={isPhone ? 0.45 : isTablet ? 0.65 : 1.2}
            alignItems="center"
          >
            <DescriptionIcon
              sx={{
                color: "#057546",
                fontSize: isPhone ? 20 : isTablet ? 24 : 28
              }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.86rem" : "1.05rem",
                  color: "#173b2b"
                }}
              >
                نماذج الجودة
              </Typography>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  color: "#708179",
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : ".78rem",
                  display: isPhone ? "none" : "block"
                }}
              >
                إنشاء وحفظ وتصدير نماذج الجودة بصيغة PDF
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={(theme) => ({
            p: isPhone ? 0.55 : isTablet ? 0.8 : 1,
            mb: isPhone ? 0.55 : isTablet ? 0.75 : 1,
            borderRadius: isPhone ? 1.4 : isTablet ? 2 : 2.5,
            border: theme.palette.mode === "dark" ? "1px solid #67C99D" : "1px solid rgba(5,117,70,.14)",
            backgroundColor: theme.palette.mode === "dark" ? theme.palette.surfaces.card : undefined,
            direction: "rtl"
          })}
        >
          <FormControl
            fullWidth
            sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
          >
            <InputLabel>
              اختر نوع النموذج
            </InputLabel>

            <Select
              value={selectedTemplate}
              label="اختر نوع النموذج"
              MenuProps={compactMenuProps}
              onChange={(event) => {
                const code =
                  event.target.value;

                const template =
                  TEMPLATES.find(
                    (item) =>
                      item.code === code
                  );

                if (!template?.enabled) {
                  Swal.fire({
                    icon: "info",
                    title:
                      "النموذج غير مفعّل حتى الآن",
                    text:
                      "سيتم إضافته في المرحلة التالية",
                    confirmButtonText:
                      "حسنًا"
                  });
                  return;
                }

                setSelectedTemplate(code);
                lastLoadedNationalIdRef.current = "";

                setForm({
                  ...emptyForm,
                  formCode: code,
                  formName: template.name,
                  toText:
                    code === "COOP_TRAINING"
                      ? "سعادة /"
                      : "إلى من يهمه الأمر",
                  studyPeriod: "مسائية",
                  coopPhone: "",
                  email:
                    code === "COOP_TRAINING"
                      ? "Saudi_board@sstli.com"
                      : "",
                  managerName:
                    code === "COOP_TRAINING"
                      ? "مشرف التدريب التعاوني"
                      : "مدير المعهد السعودي",
                  managerTitle:
                    code === "COOP_TRAINING"
                      ? "بالمعهد"
                      : "المتخصص العالي للتدريب",
                  eligible: code !== "HOURS_STATEMENT",
                  examRows: [
                    {
                      dayDate: "",
                      examDateValue: "",
                      courseName: "",
                      timeOne: "",
                      timeOneValue: "",
                      courseTwo: "",
                      timeTwo: "",
                      timeTwoValue: ""
                    }
                  ],
                  statementText: code === "EXAM_SCHEDULE"
                    ? "نحيط علم سعادتكم أن الموضح بياناته أعلاه مقرر له اختبار وفق الجدول المعتمد الموضح أدناه:"
                    : "",
                  sessionNo: "108",
                  sessionHijriDate: "1440/11/02 هـ",
                  articleNo:
                    [
                      "GRADE_WARNING_1",
                      "GRADE_WARNING_2",
                      "GRADE_WARNING_3"
                    ].includes(code)
                      ? "15"
                      : "13",
                  warningNo:
                    code === "GRADE_WARNING_3"
                      ? "3"
                      : code === "GRADE_WARNING_2"
                        ? "2"
                        : code === "GRADE_WARNING_1"
                          ? "1"
                          : code === "COURSE_DEPRIVATION"
                      ? "3"
                      : code === "ABSENCE_WARNING_2"
                        ? "2"
                        : "1",
                  absencePercent:
                    code === "COURSE_DEPRIVATION"
                      ? "25"
                      : code === "ABSENCE_WARNING_2"
                        ? "20"
                        : "10",
                  denialPercent: "25",
                  gradeValue: "2.00",
                  gradeMax: "5.00",
                  periodHijriText: "/      / 14هـ",
                  reasonText:
                    "نظراً لحرمانك / غيابك عن أداء الاختبارات",
                  financialAmount: "",
                  firstWarningDate: "/      /      هـ",
                  letterProgramName: "",
                  letterApprovedProgramName: "",
                  letterStartDate: "/      / 14هـ",
                  letterEndDate: "/      / 14هـ",
                  letterStudyHours: "180",
                  letterRegisterDate: "/      / 14هـ",
                  letterReasonFees: true,
                  letterReasonCapacity: false
                });
              }}
            >
              {TEMPLATES.map(
                (template) => (
                  <MenuItem
                    key={template.code}
                    value={template.code}
                  >
                    {template.name}
                    {!template.enabled
                      ? " — قريبًا"
                      : ""}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        </Paper>

        {[
          "HOURS_STATEMENT",
          "REGISTERED_LETTER",
          "COOP_TRAINING",
          "EXAM_SCHEDULE",
          "ABSENCE_WARNING_1",
          "ABSENCE_WARNING_2",
          "COURSE_DEPRIVATION",
          "GRADE_WARNING_1",
          "GRADE_WARNING_2",
          "GRADE_WARNING_3",
          "FINANCIAL_WARNING_1",
          "FINANCIAL_WARNING_2",
          "REGISTRATION_REJECTED",
          "DROPPED_STATEMENT",
          "COURSE_STUDIED_WAITING_EXAM",
          "NOT_REGISTERED_LETTER"
        ].includes(selected?.code) && (
          <Paper
            className="quality-editor-shell"
            elevation={0}
            sx={uiLayout.withUiSx({
              p: isPhone ? 0.55 : isTablet ? 0.85 : 1.15,
              borderRadius: isPhone ? 1.5 : isTablet ? 2 : 2.5,
              border:
                "1px solid rgba(5,117,70,.14)",
              direction: "rtl",

              "& .MuiPaper-outlined": {
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                  padding: "9px !important",
                  marginBottom: "9px !important",
                  borderRadius: "11px !important"
                },

                "@media (max-width:599px)": {
                  padding: "6px !important",
                  marginBottom: "6px !important",
                  borderRadius: "9px !important"
                }
              },

              "& .MuiInputLabel-root": {
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                  fontSize: "0.56rem !important",
                  fontWeight: "800 !important"
                },

                "@media (max-width:599px)": {
                  fontSize: "0.46rem !important"
                }
              },

              "& .MuiInputBase-input, & .MuiSelect-select": {
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                  fontSize: "0.6rem !important",
                  paddingTop: "8px !important",
                  paddingBottom: "8px !important"
                },

                "@media (max-width:599px)": {
                  fontSize: "0.5rem !important",
                  paddingTop: "6px !important",
                  paddingBottom: "6px !important"
                }
              },

              "& .MuiOutlinedInput-root": {
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                  minHeight: "35px !important",
                  borderRadius: "9px !important"
                },

                "@media (max-width:599px)": {
                  minHeight: "31px !important",
                  borderRadius: "8px !important"
                }
              },

              "& .MuiFormControl-root": {
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                  marginTop: "3px",
                  marginBottom: "3px"
                },

                "@media (max-width:599px)": {
                  marginTop: "4px",
                  marginBottom: "4px"
                }
              },

              "& .MuiButton-root": {
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                  minHeight: "33px",
                  fontSize: "0.75rem",
                  padding: "5px 9px"
                },

                "@media (max-width:599px)": {
                  minHeight: "30px",
                  fontSize: "0.75rem",
                  padding: "4px 7px"
                }
              },

              "& .MuiFormControlLabel-label": {
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                  fontSize: "0.75rem",
                  fontWeight: 800
                },

                "@media (max-width:599px)": {
                  fontSize: "0.75rem"
                }
              },

              "& .MuiAlert-root": {
                [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                  fontSize: "0.75rem",
                  paddingTop: "4px",
                  paddingBottom: "4px"
                },

                "@media (max-width:599px)": {
                  fontSize: "0.75rem"
                }
              }
            }, uiLayout.pageHeaderSx, (theme) => (theme.palette.mode !== "dark" ? {} : {
              border: "1px solid #67C99D",
              backgroundColor: theme.palette.surfaces.card
            }))}
          >
            <Typography
              align="center"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: isPhone ? "0.78rem" : isTablet ? "0.95rem" : "1.2rem",
                color: "#057546"
              }}
            >
              {selected?.name}
            </Typography>

            <Typography
              align="center"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 800,
                color: "#ae1e21",
                mb: isPhone ? 0.55 : isTablet ? 0.75 : 0.85,
                fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
              }}
            >
              إدخال بيانات نموذج {selected?.name}
            </Typography>

            {selectedTemplate ===
              "HOURS_STATEMENT" &&
              form.eligibilityMessage && (
              <Alert
                severity={
                  form.eligible
                    ? "success"
                    : "warning"
                }
                sx={{
                  mb: 2,
                  fontFamily: "Cairo"
                }}
              >
                {form.eligibilityMessage}
              </Alert>
            )}

            {["HOURS_STATEMENT", "REGISTERED_LETTER", "COOP_TRAINING"].includes(selectedTemplate) && (
            <>
            <Section
              title="البيانات الأساسية"
            >
              <TextField
                InputLabelProps={{ shrink: true }}
                label="السجل المدني"
                value={form.nationalId}
                onChange={update("nationalId")}
                size="small"
                inputProps={{
                  maxLength: 10,
                  inputMode: "numeric",
                  dir: "ltr",
                  style: {
                    direction: "ltr",
                    unicodeBidi: "isolate",
                    textAlign: "right"
                  }
                }}
                InputProps={{
                  endAdornment: loadingStudent ? (
                    <InputAdornment position="end">
                      <CircularProgress size={16} thickness={5} sx={{ color: "#67C99D" }} />
                    </InputAdornment>
                  ) : null
                }}
                sx={uiLayout.withUiSx({
                  ...fieldSx,
                  "& .MuiInputBase-input": {
                    paddingInline: "10px",
                    textAlign: "right"
                  }
                }, uiLayout.formFieldSx)}
              />

              <ReadOnlyField
                label="الاسم"
                value={form.studentName}
              />

              <ReadOnlyField
                label="التاريخ الهجري"
                value={form.hijriDate}
              />

              <TextField InputLabelProps={{ shrink: true }}
                label="الرقم التدريبي"
                value={form.trainingNo}
                onChange={update("trainingNo")}
                sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
              />

              <ReadOnlyField
                label="الجنسية"
                value={form.nationality}
              />

              <TextField InputLabelProps={{ shrink: true }}
                label="إلى"
                value={form.toText}
                onChange={update("toText")}
                sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
              />
            </Section>

            <Section
              title="بيانات الدراسة"
            >
              {selectedTemplate ===
                "COOP_TRAINING" ? (
                <TextField InputLabelProps={{ shrink: true }}
                  label="مدة التدريب التعاوني"
                  value={form.studySystem}
                  onChange={update("studySystem")}
                  sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                  placeholder="مثال: 1448/01/06 هـ إلى 1448/03/07 هـ"
                />
              ) : (
                <ReadOnlyField
                  label="نظام الدراسة الملتحق به"
                  value={form.studySystem}
                />
              )}

              {selectedTemplate ===
                "COOP_TRAINING" ? (
                <TextField InputLabelProps={{ shrink: true }}
                  label="تاريخ بداية ونهاية التدريب"
                  value={form.studyStartDate}
                  onChange={update("studyStartDate")}
                  sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                  placeholder="مثال: 1448/01/06 هـ إلى 1448/03/07 هـ"
                />
              ) : (
                <ReadOnlyField
                  label="تاريخ بداية الدراسة"
                  value={form.studyStartDate}
                />
              )}

              {selectedTemplate ===
                "COOP_TRAINING" ? (
                <TextField InputLabelProps={{ shrink: true }}
                  label="أيام العمل"
                  value={form.studentStatus}
                  onChange={update("studentStatus")}
                  sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                  placeholder="مثال: 5 أيام من الأحد إلى الخميس"
                />
              ) : (
                <ReadOnlyField
                  label="حالة المتدرب الدراسية"
                  value={form.studentStatus}
                />
              )}

              {selectedTemplate ===
                "COOP_TRAINING" ? (
                <TextField InputLabelProps={{ shrink: true }}
                  label="عدد ساعات التدريب يوميًا"
                  value={form.totalHours}
                  onChange={update("totalHours")}
                  sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                  placeholder="مثال: 6 ساعات يوميًا"
                />
              ) : (
                <ReadOnlyField
                  label="الساعات المقررة على الدبلوم"
                  value={form.totalHours}
                />
              )}

              {selectedTemplate ===
                "REGISTERED_LETTER" && (
                <FormControl
                  fullWidth
                  sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                >
                  <InputLabel>
                    فترة الدراسة
                  </InputLabel>

                  <Select
                    value={
                      form.studyPeriod ||
                      "مسائية"
                    }
                    label="فترة الدراسة"
                    onChange={update(
                      "studyPeriod"
                    )}
                  >
                    <MenuItem value="صباحية">
                      الفترة الصباحية
                    </MenuItem>
                    <MenuItem value="مسائية">
                      الفترة المسائية
                    </MenuItem>
                  </Select>
                </FormControl>
              )}

              {selectedTemplate ===
                "HOURS_STATEMENT" && (
                <TextField InputLabelProps={{ shrink: true }}
                  label="عدد الساعات المكتسبة"
                  value={form.earnedHours}
                  onChange={update("earnedHours")}
                  sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                />
              )}

              {selectedTemplate ===
                "HOURS_STATEMENT" && (
                <TextField InputLabelProps={{ shrink: true }}
                  label="البريد الإلكتروني"
                  value={form.email}
                  onChange={update("email")}
                  sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              )}

              {selectedTemplate ===
                "COOP_TRAINING" && (
                <TextField InputLabelProps={{ shrink: true }}
                  label="رقم الجوال"
                  value={form.coopPhone}
                  onChange={update("coopPhone")}
                  inputProps={{
                    inputMode: "tel",
                    maxLength: 20
                  }}
                  sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                />
              )}

              {selectedTemplate ===
                "COOP_TRAINING" && (
                <TextField InputLabelProps={{ shrink: true }}
                  label="البريد الإلكتروني"
                  value={form.email}
                  onChange={update("email")}
                  sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              )}

              <TextField InputLabelProps={{ shrink: true }}
                label={
                  selectedTemplate ===
                  "COOP_TRAINING"
                    ? "اسم مشرف التدريب"
                    : "اسم المدير"
                }
                value={form.managerName}
                onChange={update("managerName")}
                sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
              />

              <TextField InputLabelProps={{ shrink: true }}
                label={
                  selectedTemplate ===
                  "COOP_TRAINING"
                    ? "صفة مشرف التدريب"
                    : "صفة المدير"
                }
                value={form.managerTitle}
                onChange={update("managerTitle")}
                sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
              />
            </Section>

            <Paper
              variant="outlined"
              sx={{
                p: isPhone ? 0.4 : isTablet ? 0.55 : 2,
                mb: isPhone ? 0.55 : isTablet ? 0.75 : 2,
                borderRadius: isPhone ? 1.2 : isTablet ? 1.5 : 3
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  color: "#057546",
                  fontWeight: 900,
                  mb: isPhone ? 0.3 : isTablet ? 0.4 : 1,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  lineHeight: 1.15
                }}
              >
                {selectedTemplate ===
                "COOP_TRAINING"
                  ? "تخصص التدريب التعاوني"
                  : "تخصص المتدرب الدقيق"}
              </Typography>

              <TextField InputLabelProps={{ shrink: true }}
                multiline
                minRows={1}
                maxRows={isPhone ? 1 : isTablet ? 2 : 3}
                fullWidth
                value={form.specialization}
                onChange={update("specialization")}
                sx={uiLayout.withUiSx({
                  ...fieldSx,

                  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                    "& .MuiOutlinedInput-root": {
                      minHeight: "44px !important",
                      p: "5px 7px !important"
                    },
                    "& textarea": {
                      fontSize: "0.54rem !important",
                      lineHeight: 1.35,
                      padding: "0 !important"
                    }
                  },

                  "@media (max-width:599px)": {
                    "& .MuiOutlinedInput-root": {
                      minHeight: "38px !important",
                      maxHeight: "42px !important",
                      p: "4px 6px !important"
                    },
                    "& textarea": {
                      fontSize: "0.46rem !important",
                      lineHeight: 1.3
                    }
                  }
                }, uiLayout.formFieldSx)}
              />
            </Paper>
            </>
            )}

            {selectedTemplate === "EXAM_SCHEDULE" && (
              <ExamScheduleEditor form={form} setForm={setForm} update={update} loadStudent={loadStudent} loadingStudent={loadingStudent} />
            )}

            {[
              "ABSENCE_WARNING_1",
              "ABSENCE_WARNING_2",
              "COURSE_DEPRIVATION"
            ].includes(selectedTemplate) && (
              <AbsenceWarningEditor
                form={form}
                update={update}
                setForm={setForm}
                loadStudent={loadStudent}
                loadingStudent={loadingStudent}
              />
            )}

            {[
              "GRADE_WARNING_1",
              "GRADE_WARNING_2",
              "GRADE_WARNING_3"
            ].includes(selectedTemplate) && (
              <GradeWarningEditor
                form={form}
                update={update}
                loadStudent={loadStudent}
                loadingStudent={loadingStudent}
              />
            )}

            {[
              "FINANCIAL_WARNING_1",
              "FINANCIAL_WARNING_2"
            ].includes(selectedTemplate) && (
              <FinancialWarningEditor
                form={form}
                update={update}
                loadStudent={loadStudent}
                loadingStudent={loadingStudent}
                isSecond={
                  selectedTemplate ===
                  "FINANCIAL_WARNING_2"
                }
              />
            )}

            {[
              "REGISTRATION_REJECTED",
              "DROPPED_STATEMENT",
              "COURSE_STUDIED_WAITING_EXAM",
              "NOT_REGISTERED_LETTER"
            ].includes(selectedTemplate) && (
              <GeneralLetterEditor
                form={form}
                update={update}
                setForm={setForm}
                loadStudent={loadStudent}
                loadingStudent={loadingStudent}
                formCode={selectedTemplate}
              />
            )}

            <Stack
              direction="row"
              justifyContent="center"
              spacing={isPhone ? 0.45 : isTablet ? 0.65 : 1.2}
              sx={uiLayout.withUiSx({
                width: "100%",
                flexWrap: "nowrap"
              }, uiLayout.actionBarSx)}
            >
              <Button
                variant="contained"
                startIcon={
                  saving
                    ? (
                      <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    )
                    : <SaveIcon />
                }
                onClick={saveDocument}
                disabled={
                  saving ||
                  (
                    selectedTemplate ===
                      "HOURS_STATEMENT" &&
                    !form.eligible
                  )
                }
                sx={uiLayout.withUiSx({
                  minWidth: isPhone ? 0 : isTablet ? 120 : 180,
                  flex: isCompact ? 1 : "initial",
                  background:
                    "linear-gradient(135deg,#057546,#034d31)",
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                }, uiLayout.buttonSx)}
              >
                حفظ النموذج
              </Button>

              <Button
                variant="outlined"
                startIcon={
                  exportingPdf ? (
                    <CircularProgress
                      size={isPhone ? 13 : 16}
                      color="inherit"
                    />
                  ) : isCompact ? (
                    <PictureAsPdfIcon />
                  ) : (
                    <PrintIcon />
                  )
                }
                onClick={handleExportPdf}
                disabled={
                  !form.documentGuid ||
                  exportingPdf
                }
                sx={uiLayout.withUiSx({
                  flex: isCompact ? 1 : "initial",
                  minWidth: isPhone ? 0 : isTablet ? 120 : undefined,
                  fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
                }, uiLayout.buttonSx)}
              >
                {isCompact
                  ? exportingPdf
                    ? "جاري التصدير..."
                    : "تصدير PDF"
                  : "تصدير PDF / طباعة"}
              </Button>
            </Stack>
          </Paper>
        )}
      </PageContainer>

      <Box
        sx={{
          position: "fixed",
          left: "-100000px",
          top: 0,
          width: "210mm",
          height:
            selectedTemplate === "COOP_TRAINING"
              ? "594mm"
              : "297mm",
          overflow: "visible",
          pointerEvents: "none",
          opacity: 0
        }}
      >
        {/* Print output is always rendered under the fixed, light-only
            PRINT_THEME (see definition above) so exported/printed documents
            never inherit the app's current dark-mode colors. */}
        <ThemeProvider theme={PRINT_THEME}>
        {selectedTemplate ===
        "REGISTERED_LETTER" ? (
          <RegisteredLetterPrint
            ref={printRef}
            model={form}
          />
        ) : selectedTemplate ===
          "COOP_TRAINING" ? (
          <CoopTrainingPrint
            ref={printRef}
            model={form}
          />
        ) : selectedTemplate === "EXAM_SCHEDULE" ? (
          <ExamSchedulePrint ref={printRef} model={form} />
        ) : [
          "REGISTRATION_REJECTED",
          "DROPPED_STATEMENT",
          "COURSE_STUDIED_WAITING_EXAM",
          "NOT_REGISTERED_LETTER"
        ].includes(selectedTemplate) ? (
          <GeneralLetterPrint
            ref={printRef}
            model={form}
          />
        ) : [
          "FINANCIAL_WARNING_1",
          "FINANCIAL_WARNING_2"
        ].includes(selectedTemplate) ? (
          <FinancialWarningPrint
            ref={printRef}
            model={form}
          />
        ) : [
          "ABSENCE_WARNING_1",
          "ABSENCE_WARNING_2",
          "COURSE_DEPRIVATION",
          "GRADE_WARNING_1",
          "GRADE_WARNING_2",
          "GRADE_WARNING_3"
        ].includes(selectedTemplate) ? (
          <AbsenceWarningPrint
            ref={printRef}
            model={form}
          />
        ) : (
          <HoursStatementPrint
            ref={printRef}
            model={form}
          />
        )}
        </ThemeProvider>
      </Box>
    </Box></NavigationShell>
  );
};

const Section = ({
  title,
  children
}) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1,
      mb: 1,
      borderRadius: 2,

      [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
        p: 0.85,
        mb: 0.85,
        borderRadius: 2
      },

      "@media (max-width:599px)": {
        p: 0.55,
        mb: 0.55,
        borderRadius: 1.5
      }
    }}
  >
    <Typography
      sx={{
        fontFamily: "Cairo",
        color: "#057546",
        fontWeight: 900,
        mb: 0.75,

        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          mb: 0.55,
          fontSize: "0.75rem"
        },

        "@media (max-width:599px)": {
          mb: 0.4,
          fontSize: "0.75rem"
        }
      }}
    >
      {title}
    </Typography>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2,minmax(0,1fr))",
          sm: "repeat(2,minmax(0,1fr))",
          md: "1fr 1fr"
        },
        columnGap: {
          xs: 1.05,
          sm: 1.25,
          md: 1.5
        },
        rowGap: {
          xs: 1.4,
          sm: 1.55,
          md: 1.5
        },

        "& > *": {
          minWidth: 0
        }
      }}
    >
      {children}
    </Box>
  </Paper>
);

const compactTextAreaSx = {
  ...fieldSx,

  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
    "& .MuiInputLabel-root": {
      fontSize: "0.5rem !important"
    },

    "& textarea": {
      fontSize: "0.54rem !important",
      lineHeight: "1.45 !important",
      padding: "0 !important"
    },

    "& .MuiOutlinedInput-root": {
      padding: "7px 9px !important"
    }
  },

  "@media (max-width:599px)": {
    "& .MuiInputLabel-root": {
      fontSize: "0.42rem !important"
    },

    "& textarea": {
      fontSize: "0.46rem !important",
      lineHeight: "1.4 !important",
      padding: "0 !important"
    },

    "& .MuiOutlinedInput-root": {
      padding: "5px 7px !important"
    }
  }
};

const ReadOnlyField = ({
  label,
  value
}) => (
  <TextField InputLabelProps={{ shrink: true }}
    label={label}
    value={value || ""}
    sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
    InputProps={{
      readOnly: true
    }}
  />
);

const PRINT_COLORS = {
  green: "#057546",
  greenDark: "#034d31",
  greenSoft: "#eef8f3",
  greenLine: "#78a993",
  ink: "#101512",
  muted: "#4c5f56",
  line: "#9fbaae",
  paper: "#ffffff",
  warning: "#9a6511",
  warningSoft: "#fff7e7"
};

const PRINT_PAGE_SX = {
  width: "210mm",
  height: "297mm",
  minWidth: "210mm",
  maxWidth: "210mm",
  minHeight: "297mm",
  maxHeight: "297mm",
  margin: 0,
  padding: 0,
  position: "relative",
  overflow: "hidden",
  backgroundColor: PRINT_COLORS.paper,
  color: PRINT_COLORS.ink,
  colorScheme: "light",
  direction: "rtl",
  fontFamily: "Cairo, Tahoma, Arial, sans-serif",
  boxSizing: "border-box"
};

const PrintPage = React.forwardRef(
  ({ children, className = "print-sheet" }, ref) => (
    <Box ref={ref} className={className} sx={PRINT_PAGE_SX}>
      {children}
    </Box>
  )
);

const PrintWatermark = () => (
  <Box
    component="img"
    src="/watermark-logo.png"
    alt=""
    sx={{
      position: "absolute",
      left: "50%",
      top: "49%",
      transform: "translate(-50%, -50%)",
      width: "92mm",
      height: "104mm",
      objectFit: "contain",
      opacity: 0.042,
      zIndex: 0,
      pointerEvents: "none"
    }}
  />
);

const PrintHeader = ({ model, title, subtitle }) => (
  <Box sx={{ position: "relative", zIndex: 2, flexShrink: 0 }}>
    <Box
      component="img"
      src="/headerveno.png"
      alt="الهيدر"
      sx={{
        width: "100%",
        height: "29mm",
        display: "block",
        objectFit: "contain"
      }}
    />

    <Box
      sx={{
        mt: "1.2mm",
        pb: "1.8mm",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "6mm",
        borderBottom: `1px solid ${PRINT_COLORS.greenLine}`,
        direction: "rtl"
      }}
    >
      <Typography
        sx={{
          fontSize: "8.4pt",
          fontWeight: 800,
          color: PRINT_COLORS.ink,
          whiteSpace: "nowrap"
        }}
      >
        التاريخ: {model.hijriDate || "-"}
      </Typography>

      <Typography
        sx={{
          fontSize: "8.4pt",
          fontWeight: 800,
          color: PRINT_COLORS.ink,
          whiteSpace: "nowrap"
        }}
      >
        صادر رقم / {model.documentNo || "-"}
      </Typography>
    </Box>

    {title && (
      <Typography
        align="center"
        sx={{
          mt: "2.6mm",
          fontSize: "12.4pt",
          lineHeight: 1.45,
          fontWeight: 900,
          color: PRINT_COLORS.greenDark
        }}
      >
        {title}
      </Typography>
    )}

    {subtitle && (
      <Typography
        align="center"
        sx={{
          mt: "0.7mm",
          fontSize: "8pt",
          lineHeight: 1.5,
          fontWeight: 700,
          color: PRINT_COLORS.muted
        }}
      >
        {subtitle}
      </Typography>
    )}
  </Box>
);

const PrintFooter = () => (
  <Box
    component="img"
    src="/footerveno.png"
    alt="الفوتر"
    sx={{
      position: "absolute",
      bottom: "11mm",
      left: "12mm",
      right: "12mm",
      width: "calc(100% - 24mm)",
      height: "17.5mm",
      objectFit: "contain",
      objectPosition: "center bottom",
      display: "block",
      zIndex: 2
    }}
  />
);

const PrintPageBody = ({ children, sx = {} }) => (
  <Box
    className="print-page-body"
    sx={{
      position: "relative",
      zIndex: 1,
      height: "100%",
      minHeight: 0,
      px: "12mm",
      pt: "7mm",
      pb: "35mm",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      transformOrigin: "top right",
      ...sx
    }}
  >
    {children}
  </Box>
);

const PrintTable = ({ columns, values, mt = "5mm" }) => (
  <Box
    component="table"
    sx={{
      width: "100%",
      tableLayout: "fixed",
      borderCollapse: "collapse",
      mt,
      direction: "rtl",
      border: `1px solid ${PRINT_COLORS.greenLine}`,
      "& th, & td": {
        border: `1px solid ${PRINT_COLORS.greenLine}`,
        py: "1.7mm",
        px: "1.5mm",
        textAlign: "center",
        verticalAlign: "middle",
        overflowWrap: "anywhere"
      },
      "& th": {
        fontSize: "8.2pt",
        fontWeight: 900,
        color: PRINT_COLORS.greenDark,
        backgroundColor: PRINT_COLORS.greenSoft
      },
      "& td": {
        fontSize: "8.25pt",
        fontWeight: 800,
        color: PRINT_COLORS.ink,
        backgroundColor: "#ffffff"
      }
    }}
  >
    <thead>
      <tr>
        {columns.map((column) => (
          <th key={column}>{column}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      <tr>
        {values.map((value, index) => (
          <td key={`${columns[index]}-${index}`}>{value || "-"}</td>
        ))}
      </tr>
    </tbody>
  </Box>
);

const PrintBodyCard = ({ children, sx = {} }) => (
  <Box
    sx={{
      mt: "3.5mm",
      p: "3.2mm 4.2mm",
      border: `1px solid ${PRINT_COLORS.line}`,
      borderRadius: "2.2mm",
      backgroundColor: "rgba(255,255,255,.94)",
      color: PRINT_COLORS.ink,
      direction: "rtl",
      ...sx
    }}
  >
    {children}
  </Box>
);

const PrintVerificationAndSignature = ({
  model,
  verificationUrl,
  verificationLabel = "موثوقية المستند",
  supervisorLabel = "مشرف التدريب"
}) => (
  <Box
    sx={{
      mt: "6mm",
      pt: "4mm",
      borderTop: `1px solid ${PRINT_COLORS.greenLine}`,
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.65fr) minmax(40mm, .92fr) 36mm",
      columnGap: "5mm",
      alignItems: "stretch",
      direction: "rtl",
      minHeight: "43mm",
      flexShrink: 0,
      breakInside: "avoid",
      pageBreakInside: "avoid"
    }}
  >
    {/* Manager approval: text and signature are deliberately separated into
        independent zones so the signature can never touch the title/name. */}
    <Box
      sx={{
        minWidth: 0,
        minHeight: "40mm",
        px: "5mm",
        py: "3.4mm",
        border: `1px solid ${PRINT_COLORS.line}`,
        borderRadius: "2.2mm",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        boxSizing: "border-box",
        overflow: "hidden"
      }}
    >
      <Typography
        sx={{
          fontSize: "7.3pt",
          lineHeight: 1.35,
          fontWeight: 850,
          color: PRINT_COLORS.muted,
          mb: "1.2mm"
        }}
      >
        اعتماد مدير المعهد
      </Typography>

      <Box
        sx={{
          width: "100%",
          minHeight: "10.5mm",
          px: "2mm",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          rowGap: "0.7mm",
          boxSizing: "border-box"
        }}
      >
        <Typography
          sx={{
            fontSize: "8.8pt",
            lineHeight: 1.45,
            fontWeight: 900,
            color: PRINT_COLORS.greenDark,
            maxWidth: "68mm",
            overflowWrap: "break-word"
          }}
        >
          {model.managerName || "مدير المعهد السعودي"}
        </Typography>

        {model.managerTitle && (
          <Typography
            sx={{
              fontSize: "7.7pt",
              lineHeight: 1.4,
              fontWeight: 750,
              color: PRINT_COLORS.muted,
              maxWidth: "68mm",
              overflowWrap: "break-word"
            }}
          >
            {model.managerTitle}
          </Typography>
        )}
      </Box>

      {/* Dedicated signature zone with real breathing room above it. */}
      <Box
        sx={{
          mt: "4.5mm",
          width: "48mm",
          minHeight: "13mm",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          boxSizing: "border-box"
        }}
      >
        <Box
          sx={{
            width: "44mm",
            height: "9.8mm",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pb: "1mm",
            borderBottom: `1px solid ${PRINT_COLORS.greenLine}`,
            boxSizing: "border-box"
          }}
        >
          <Box
            component="img"
            src="/signveno.png"
            alt="التوقيع"
            sx={{
              width: "29mm",
              height: "7.8mm",
              objectFit: "contain",
              objectPosition: "center",
              display: "block",
              flexShrink: 0
            }}
          />
        </Box>

        <Typography
          sx={{
            mt: "1.1mm",
            fontSize: "6.8pt",
            lineHeight: 1.2,
            fontWeight: 800,
            color: PRINT_COLORS.muted
          }}
        >
          التوقيع
        </Typography>
      </Box>
    </Box>

    {/* Official stamp: independent and centered with safe padding. */}
    <Box
      sx={{
        minWidth: 0,
        minHeight: "40mm",
        px: "3.5mm",
        py: "3.4mm",
        border: `1px solid ${PRINT_COLORS.line}`,
        borderRadius: "2.2mm",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        textAlign: "center",
        boxSizing: "border-box",
        overflow: "hidden"
      }}
    >
      <Typography
        sx={{
          fontSize: "7.2pt",
          lineHeight: 1.3,
          fontWeight: 900,
          color: PRINT_COLORS.greenDark,
          mb: "2.8mm"
        }}
      >
        الختم الرسمي
      </Typography>

      <Box
        sx={{
          flex: 1,
          width: "100%",
          minHeight: "24mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: "1.5mm",
          boxSizing: "border-box"
        }}
      >
        <Box
          component="img"
          src="/stampveno.jpeg"
          onError={(event) => {
            event.currentTarget.src = "/stampveno.png";
          }}
          alt="الختم الرسمي"
          sx={{
            width: "32mm",
            height: "16mm",
            maxWidth: "100%",
            objectFit: "contain",
            objectPosition: "center",
            display: "block",
            flexShrink: 0
          }}
        />
      </Box>
    </Box>

    {/* Verification QR: same card height, compact content, no visual crowding. */}
    <Box
      sx={{
        width: "36mm",
        minHeight: "40mm",
        px: "3mm",
        py: "3.4mm",
        border: `1px solid ${PRINT_COLORS.line}`,
        borderRadius: "2.2mm",
        backgroundColor: PRINT_COLORS.greenSoft,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        textAlign: "center",
        boxSizing: "border-box",
        overflow: "hidden"
      }}
    >
      <Typography
        sx={{
          fontSize: "7.1pt",
          lineHeight: 1.3,
          fontWeight: 900,
          color: PRINT_COLORS.greenDark,
          mb: "2mm",
          maxWidth: "29mm"
        }}
      >
        {supervisorLabel}
      </Typography>

      <Box
        sx={{
          p: "1.2mm",
          backgroundColor: "#ffffff",
          border: `1px solid ${PRINT_COLORS.greenLine}`,
          borderRadius: "1.5mm",
          lineHeight: 0,
          flexShrink: 0
        }}
      >
        <QRCodeSVG
          value={String(verificationUrl || " ")}
          size={48}
          level="M"
          bgColor="#ffffff"
          fgColor="#111111"
        />
      </Box>

      <Typography
        sx={{
          mt: "1.5mm",
          fontSize: "6.55pt",
          lineHeight: 1.25,
          fontWeight: 800,
          color: PRINT_COLORS.muted,
          maxWidth: "29mm",
          overflowWrap: "break-word"
        }}
      >
        {verificationLabel}
      </Typography>
    </Box>
  </Box>
);

const HoursStatementPrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      `${window.location.origin}/quality-forms/verify/${model.documentGuid}`;

    const detailRows = [
      ["نظام الدراسة الملتحق به", model.studySystem],
      ["تخصص المتدرب الدقيق", model.specialization],
      ["تاريخ بداية الدراسة", model.studyStartDate],
      ["حالة المتدرب الدراسية", model.studentStatus],
      ["عدد الساعات المقررة على الدبلوم", model.totalHours],
      ["عدد الساعات المكتسبة", model.earnedHours]
    ];

    return (
      <PrintPage ref={ref}>
        <PrintWatermark />
        <PrintPageBody>
          <PrintHeader
            model={model}
            title={model.toText || "إلى من يهمه الأمر"}
            subtitle="مشهد ساعات تدريبي"
          />

          <PrintTable
            columns={["الاسم", "السجل المدني", "الجنسية", "الرقم التدريبي"]}
            values={[
              model.studentName,
              <bdi dir="ltr">{model.nationalId || "-"}</bdi>,
              model.nationality,
              model.trainingNo
            ]}
          />

          <Typography
            align="center"
            sx={{
              mt: "4mm",
              fontSize: "9pt",
              fontWeight: 900,
              lineHeight: 1.7
            }}
          >
            السلام عليكم ورحمة الله وبركاته، وبعد
          </Typography>

          <PrintBodyCard sx={{ mt: "3mm", py: "3.5mm" }}>
            <Typography
              sx={{
                fontSize: "8.7pt",
                fontWeight: 800,
                lineHeight: 1.85,
                textAlign: "center"
              }}
            >
              نفيد سعادتكم بأن المتدرب الموضح بياناته أعلاه أحد متدربي المعهد
              بدبلوم «{model.specialization || "-"}»، ومدة الدبلوم سنتان ونصف،
              ونفيدكم بالبيانات الدراسية التالية:
            </Typography>
          </PrintBodyCard>

          <Box
            sx={{
              mt: "3mm",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderTop: `1px solid ${PRINT_COLORS.greenLine}`,
              borderInlineStart: `1px solid ${PRINT_COLORS.greenLine}`
            }}
          >
            {detailRows.map(([title, value]) => (
              <Box
                key={title}
                sx={{
                  minHeight: "11mm",
                  px: "3mm",
                  py: "2mm",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "1mm",
                  borderInlineEnd: `1px solid ${PRINT_COLORS.greenLine}`,
                  borderBottom: `1px solid ${PRINT_COLORS.greenLine}`,
                  backgroundColor: "rgba(255,255,255,.94)"
                }}
              >
                <Typography
                  sx={{
                    fontSize: "7.7pt",
                    fontWeight: 900,
                    color: PRINT_COLORS.greenDark
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "8.4pt",
                    fontWeight: 800,
                    color: PRINT_COLORS.ink
                  }}
                >
                  {value || "-"}
                </Typography>
              </Box>
            ))}
          </Box>

          <Typography
            align="center"
            sx={{
              mt: "4mm",
              fontSize: "9.2pt",
              fontWeight: 900,
              color: PRINT_COLORS.greenDark
            }}
          >
            وهذا للعلم، والله الموفق،،،
          </Typography>

          <PrintVerificationAndSignature
            model={model}
            verificationUrl={verificationUrl}
            verificationLabel="موثوقية المشهد"
          />
        </PrintPageBody>
        <PrintFooter />
      </PrintPage>
    );
  }
);

const CoopTrainingPrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      `${window.location.origin}/quality-forms/verify/${model.documentGuid}`;

    const coopEmail = model.email || "Saudi_board@sstli.com";
    const coopPhone = model.coopPhone || model.earnedHours || "";

    return (
      <Box
        ref={ref}
        className="print-document"
        sx={{
          width: "210mm",
          margin: 0,
          padding: 0,
          backgroundColor: "#ffffff",
          color: "#111111",
          colorScheme: "light"
        }}
      >
        <PrintPage className="print-page">
          <PrintWatermark />
          <PrintPageBody>
            <PrintHeader
              model={model}
              title="نموذج البحث عن فرصة تدريبية"
              subtitle="خطاب تدريب تعاوني"
            />

            <Typography
              sx={{
                mt: "5mm",
                fontSize: "9pt",
                fontWeight: 900,
                textAlign: "right"
              }}
            >
              {model.toText || "سعادة /"}
            </Typography>

            <PrintBodyCard sx={{ mt: "3mm" }}>
              <Typography
                sx={{
                  fontSize: "8.8pt",
                  fontWeight: 800,
                  lineHeight: 1.9,
                  textAlign: "justify"
                }}
              >
                نفيد سعادتكم أن المتدرب / {model.studentName || "-"}، هوية رقم /{" "}
                <bdi dir="ltr">{model.nationalId || "-"}</bdi>، أحد متدربي المعهد
                المسجلين بدبلوم تخصص «{model.specialization || "-"}»، ويرغب في إكمال
                متطلب التدريب التعاوني لديكم بدوام كامل دون أن يترتب على ذلك أي
                التزامات مالية على المنشأة، وذلك لاستكمال متطلبات التخرج.
              </Typography>
            </PrintBodyCard>

            <Box
              sx={{
                mt: "3mm",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "2.5mm"
              }}
            >
              {[
                ["فترة التدريب", model.studySystem || "-"],
                ["ساعات التدريب", model.totalHours || "-"],
                ["الحالة", model.studentStatus || "مستمر"]
              ].map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    p: "2.5mm",
                    border: `1px solid ${PRINT_COLORS.greenLine}`,
                    borderRadius: "2mm",
                    backgroundColor: PRINT_COLORS.greenSoft,
                    textAlign: "center"
                  }}
                >
                  <Typography sx={{ fontSize: "7.6pt", fontWeight: 900, color: PRINT_COLORS.greenDark }}>
                    {label}
                  </Typography>
                  <Typography sx={{ mt: ".8mm", fontSize: "8.2pt", fontWeight: 800 }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography
              sx={{
                mt: "4mm",
                fontSize: "8.6pt",
                fontWeight: 800,
                lineHeight: 1.9,
                textAlign: "justify"
              }}
            >
              في حال الموافقة، نرجو من سعادتكم تزويدنا بالرد. ولأي استفسارات يمكنكم
              التواصل مع إدارة التدريب التعاوني عبر البريد الإلكتروني:{" "}
              <Box component="span" dir="ltr" sx={{ display: "inline-block", fontWeight: 900 }}>
                {coopEmail}
              </Box>
            </Typography>

            <Typography
              align="center"
              sx={{ mt: "3mm", fontSize: "8.7pt", fontWeight: 900 }}
            >
              للاستفسار والتواصل مع مشرف التدريب التعاوني بالمعهد / جوال رقم{" "}
              <bdi dir="ltr">{coopPhone || "-"}</bdi>
            </Typography>

            <Typography
              align="center"
              sx={{ mt: "2mm", fontSize: "8.8pt", fontWeight: 900, color: PRINT_COLORS.greenDark }}
            >
              وتفضلوا بقبول وافر التحية والتقدير
            </Typography>

            <PrintVerificationAndSignature
              model={model}
              verificationUrl={verificationUrl}
              verificationLabel="موثوقية الخطاب"
            />
          </PrintPageBody>
          <PrintFooter />
        </PrintPage>

        <PrintPage className="print-page">
          <PrintWatermark />
          <PrintPageBody>
            <PrintHeader
              model={model}
              title="اعتماد جهة التدريب"
              subtitle="الصفحة الثانية من نموذج التدريب التعاوني"
            />

            <Typography
              align="center"
              sx={{ mt: "5mm", fontSize: "9pt", fontWeight: 900 }}
            >
              السلام عليكم ورحمة الله وبركاته، وبعد
            </Typography>

            <PrintBodyCard sx={{ mt: "4mm" }}>
              <Typography
                sx={{
                  fontSize: "8.8pt",
                  fontWeight: 800,
                  lineHeight: 1.9,
                  textAlign: "justify"
                }}
              >
                إشارة إلى خطابكم أعلاه حول قبول المتدرب في برنامج التدريب التعاوني
                للفصل التدريبي، نأمل تحديد حالة الطلب واستكمال بيانات منشأة التدريب
                ومشرف التدريب أدناه.
              </Typography>
            </PrintBodyCard>

            <Box sx={{ mt: "4mm", display: "grid", gap: "2.5mm" }}>
              {["الموافقة على قبول المتدرب في برنامج التدريب التعاوني", "الاعتذار عن قبول المتدرب في برنامج التدريب التعاوني"].map((item) => (
                <Box
                  key={item}
                  sx={{
                    p: "3mm",
                    border: `1px solid ${PRINT_COLORS.greenLine}`,
                    borderRadius: "2mm",
                    fontSize: "8.7pt",
                    fontWeight: 800,
                    backgroundColor: "#ffffff"
                  }}
                >
                  □ {item}
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                mt: "5mm",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "3mm"
              }}
            >
              {["اسم المنشأة التدريبية", "عنوان المنشأة", "اسم المسؤول", "جوال المسؤول"].map((label) => (
                <Box
                  key={label}
                  sx={{
                    minHeight: "17mm",
                    p: "3mm",
                    border: `1px solid ${PRINT_COLORS.line}`,
                    borderRadius: "2mm"
                  }}
                >
                  <Typography sx={{ fontSize: "8pt", fontWeight: 900, color: PRINT_COLORS.greenDark }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                mt: "5mm",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6mm"
              }}
            >
              <Box sx={{ minHeight: "42mm", p: "3mm", border: `1px solid ${PRINT_COLORS.line}`, borderRadius: "2mm" }}>
                <Typography sx={{ fontSize: "8.4pt", fontWeight: 900, color: PRINT_COLORS.greenDark }}>
                  التوقيع
                </Typography>
              </Box>
              <Box sx={{ minHeight: "42mm", p: "3mm", border: `1px solid ${PRINT_COLORS.line}`, borderRadius: "2mm" }}>
                <Typography sx={{ fontSize: "8.4pt", fontWeight: 900, color: PRINT_COLORS.greenDark }}>
                  الختم
                </Typography>
              </Box>
            </Box>
          </PrintPageBody>
          <PrintFooter />
        </PrintPage>
      </Box>
    );
  }
);

const RegisteredLetterPrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      `${window.location.origin}/quality-forms/verify/${model.documentGuid}`;

    return (
      <PrintPage ref={ref}>
        <PrintWatermark />
        <PrintPageBody>
          <PrintHeader
            model={model}
            title={model.toText || "إلى من يهمه الأمر"}
            subtitle="إفادة تسجيل متدرب"
          />

          <PrintTable
            columns={["الاسم", "رقم السجل المدني", "الدبلوم"]}
            values={[
              model.studentName,
              <bdi dir="ltr">{model.nationalId || "-"}</bdi>,
              model.specialization
            ]}
          />

          <Typography
            align="center"
            sx={{ mt: "4mm", fontSize: "9.8pt", fontWeight: 900, lineHeight: 1.85 }}
          >
            السلام عليكم ورحمة الله وبركاته
            <br />
            تحية طيبة وبعد،،،
          </Typography>

          <PrintBodyCard sx={{ mt: "3mm" }}>
            <Typography
              component="div"
              dir="rtl"
              sx={{
                fontSize: "8.9pt",
                fontWeight: 800,
                lineHeight: 2,
                textAlign: "justify",
                direction: "rtl"
              }}
            >
              نفيد سعادتكم بأن الموضح بياناته أعلاه مسجل لدينا في{" "}
              <strong>{model.specialization || "الدبلوم"}</strong>، والدبلوم معتمد من
              المؤسسة العامة للتدريب التقني والمهني بعدد ساعات{" "}
              <strong>{model.totalHours || "-"}</strong>، والدراسة بالفترة{" "}
              <strong>{model.studyPeriod === "صباحية" ? "الصباحية" : "المسائية"}</strong>،
              ولا تتعارض مع أوقات العمل الرسمية، وتاريخ بداية الدراسة{" "}
              <Box component="span" dir="ltr" sx={{ display: "inline-block", fontWeight: 900 }}>
                {model.studyStartDate || "-"} هـ
              </Box>.
            </Typography>
          </PrintBodyCard>

          <Typography
            align="center"
            sx={{
              mt: "4mm",
              fontSize: "9.2pt",
              fontWeight: 900,
              color: PRINT_COLORS.greenDark
            }}
          >
            وهذا للعلم، والله الموفق،،،
          </Typography>

          <PrintVerificationAndSignature
            model={model}
            verificationUrl={verificationUrl}
            verificationLabel="موثوقية الخطاب"
          />
        </PrintPageBody>
        <PrintFooter />
      </PrintPage>
    );
  }
);

const StudentLookupFields = ({
  form,
  update,
  loadStudent,
  loadingStudent,
  hideDiploma = false
}) => (
  <>
    <TextField InputLabelProps={{ shrink: true }}
      label="رقم السجل المدني"
      value={form.nationalId}
      onChange={update("nationalId")}
      inputProps={{
        maxLength: 10,
        inputMode: "numeric"
      , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
      InputProps={{
        endAdornment: loadingStudent ? (
          <InputAdornment position="end">
            <CircularProgress size={16} thickness={5} sx={{ color: "#67C99D" }} />
          </InputAdornment>
        ) : null
      }}
      sx={uiLayout.withUiSx({
        ...fieldSx,
        "& .MuiInputBase-input": {
          paddingInline: "10px",
          textAlign: "right"
        }
      }, uiLayout.formFieldSx)}
    />

    <ReadOnlyField
      label="الاسم"
      value={form.studentName}
    />

    <ReadOnlyField
      label="التاريخ الهجري"
      value={form.hijriDate}
    />

    {!hideDiploma && (
      <ReadOnlyField
        label="الدبلوم"
        value={form.specialization}
      />
    )}
  </>
);

const createEmptyExamRow = () => ({
  dayDate: "",
  examDateValue: "",
  courseName: "",
  timeOne: "",
  timeOneValue: "",
  courseTwo: "",
  timeTwo: "",
  timeTwoValue: ""
});

const formatExamHijriDate = (gregorianValue) => {
  if (!gregorianValue) return "";

  try {
    const [year, month, day] = String(gregorianValue)
      .split("-")
      .map(Number);

    if (!year || !month || !day) return "";

    const date = new Date(
      year,
      month - 1,
      day,
      12,
      0,
      0
    );

    const weekday = new Intl.DateTimeFormat(
      "ar-SA",
      {
        weekday: "long"
      }
    ).format(date);

    const hijriDate = new Intl.DateTimeFormat(
      "ar-SA-u-ca-islamic-umalqura",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).format(date);

    return `${weekday} ${hijriDate}`;
  } catch {
    return "";
  }
};

const formatExamTime = (timeValue) => {
  if (!timeValue) return "";

  try {
    const [hour, minute] = String(timeValue)
      .split(":")
      .map(Number);

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute)
    ) {
      return "";
    }

    const date = new Date(
      2000,
      0,
      1,
      hour,
      minute,
      0
    );

    return new Intl.DateTimeFormat(
      "ar-SA",
      {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      }
    ).format(date);
  } catch {
    return "";
  }
};

const EXAM_ROW_PLACEHOLDERS = {
  dayDate: "مثال: الاثنين 1445/04/04 هـ",
  courseName: "مثال: الخوارزميات والمنطق",
  timeOne: "مثال: 5-4 مساءً",
  courseTwo: "مثال: تطبيقات الحاسب المتقدمة",
  timeTwo: "مثال: 6-5 مساءً"
};

const ExamScheduleEditor = ({
  form,
  setForm,
  update,
  loadStudent,
  loadingStudent
}) => {
  const rows =
    Array.isArray(form.examRows) &&
    form.examRows.length > 0
      ? form.examRows
      : [createEmptyExamRow()];

  const changeRow = (
    index,
    field,
    value
  ) => {
    setForm((current) => {
      const currentRows =
        Array.isArray(current.examRows) &&
        current.examRows.length > 0
          ? current.examRows
          : [createEmptyExamRow()];

      return {
        ...current,
        examRows: currentRows.map(
          (row, rowIndex) =>
            rowIndex === index
              ? {
                  ...row,
                  [field]: value
                }
              : row
        ),
        documentGuid: "",
        documentNo: "",
        verificationUrl: ""
      };
    });
  };

  const changeRowFields = (
    index,
    patch
  ) => {
    setForm((current) => {
      const currentRows =
        Array.isArray(current.examRows) &&
        current.examRows.length > 0
          ? current.examRows
          : [createEmptyExamRow()];

      return {
        ...current,
        examRows: currentRows.map(
          (row, rowIndex) =>
            rowIndex === index
              ? {
                  ...row,
                  ...patch
                }
              : row
        ),
        documentGuid: "",
        documentNo: "",
        verificationUrl: ""
      };
    });
  };

  const addExamDay = () => {
    setForm((current) => ({
      ...current,
      examRows: [
        ...(
          Array.isArray(current.examRows) &&
          current.examRows.length > 0
            ? current.examRows
            : [createEmptyExamRow()]
        ),
        createEmptyExamRow()
      ],
      documentGuid: "",
      documentNo: "",
      verificationUrl: ""
    }));
  };

  const deleteExamDay = (index) => {
    setForm((current) => {
      const currentRows =
        Array.isArray(current.examRows) &&
        current.examRows.length > 0
          ? current.examRows
          : [createEmptyExamRow()];

      const nextRows =
        currentRows.length === 1
          ? [createEmptyExamRow()]
          : currentRows.filter(
              (_, rowIndex) =>
                rowIndex !== index
            );

      return {
        ...current,
        examRows: nextRows,
        documentGuid: "",
        documentNo: "",
        verificationUrl: ""
      };
    });
  };

  return (
    <>
      <Section title="بيانات جدول الاختبارات">
        <StudentLookupFields
          form={form}
          update={update}
          loadStudent={loadStudent}
          loadingStudent={loadingStudent}
        />

        <ReadOnlyField
          label="المستوى"
          value={form.levelName}
        />

        <TextField InputLabelProps={{ shrink: true }}
          label="إلى"
          value={form.toText}
          onChange={update("toText")}
          sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
        />
      </Section>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
            p: 0.75,
            mb: 0.85,
            borderRadius: 2
          },
          "@media (max-width:599px)": {
            p: 0.55,
            mb: 0.65,
            borderRadius: 1.5
          }
        }}
      >
        <Typography
          sx={{
            fontFamily: "Cairo",
            color: "#057546",
            fontWeight: 900,
            mb: 1,
            [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
              mb: 0.45,
              fontSize: "0.75rem"
            },
            "@media (max-width:599px)": {
              mb: 0.3,
              fontSize: "0.75rem"
            }
          }}
        >
          نص الخطاب
        </Typography>

        <TextField InputLabelProps={{ shrink: true }}
          fullWidth
          multiline
          minRows={1}
          maxRows={3}
          value={form.statementText}
          onChange={update("statementText")}
          sx={uiLayout.withUiSx(compactTextAreaSx, uiLayout.formFieldSx)}
        />
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          overflowX: "hidden",

          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
            p: 0.75,
            mb: 0.85,
            borderRadius: 2
          },

          "@media (max-width:599px)": {
            p: 0.55,
            mb: 0.65,
            borderRadius: 1.5
          }
        }}
      >
        <Stack
          direction={{
            xs: "column",
            sm: "row"
          }}
          alignItems={{
            xs: "stretch",
            sm: "center"
          }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "Cairo",
                color: "#057546",
                fontWeight: 900
              }}
            >
              بيانات الاختبارات
            </Typography>

          </Box>

          <Button
            variant="contained"
            onClick={addExamDay}
            startIcon={
              <AddCircleOutlineIcon />
            }
            sx={uiLayout.withUiSx({
              minWidth: {
                xs: 78,
                sm: 92,
                lg: 155
              },
              minHeight: {
                xs: 30,
                sm: 33
              },
              fontSize: {
                xs: "0.75rem",
                sm: "0.75rem",
                lg: undefined
              },
              fontFamily: "Cairo",
              background:
                "linear-gradient(135deg,#057546,#034d31)"
            }, uiLayout.buttonSx)}
          >
            إضافة يوم
          </Button>
        </Stack>

        {/* Mobile / Tablet: compact cards, no horizontal table */}
        <Box
          sx={{
            display: {
              xs: "block",
              md: "block",
              lg: "none"
            }
          }}
        >
          <Stack
            spacing={{
              xs: 0.65,
              sm: 0.85
            }}
          >
            {rows.map((row, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{
                  p: {
                    xs: 0.5,
                    sm: 0.7
                  },
                  borderRadius: {
                    xs: 1.25,
                    sm: 1.6
                  },
                  background: "#fbfefc"
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    mb: {
                      xs: 0.45,
                      sm: 0.6
                    }
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: "#057546",
                      fontSize: {
                        xs: "0.75rem",
                        sm: "0.75rem"
                      }
                    }}
                  >
                    يوم الاختبار {index + 1}
                  </Typography>

                  <IconButton
                    color="error"
                    size="small"
                    onClick={() =>
                      deleteExamDay(index)
                    }
                    sx={{
                      width: {
                        xs: 25,
                        sm: 29
                      },
                      height: {
                        xs: 25,
                        sm: 29
                      }
                    }}
                  >
                    <DeleteOutlineIcon
                      sx={{
                        fontSize: {
                          xs: 15,
                          sm: 17
                        }
                      }}
                    />
                  </IconButton>
                </Stack>

                <Box
                  sx={uiLayout.withUiSx({
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2,minmax(0,1fr))",
                    columnGap: {
                      xs: 0.55,
                      sm: 0.75
                    },
                    rowGap: {
                      xs: 0.75,
                      sm: 0.95
                    }
                  }, uiLayout.formSectionSx)}
                >
                  <TextField
                    type="date"
                    label="اليوم / التاريخ"
                    value={row.examDateValue || ""}
                    onChange={(event) => {
                      const value = event.target.value;

                      changeRowFields(
                        index,
                        {
                          examDateValue: value,
                          dayDate:
                            formatExamHijriDate(
                              value
                            )
                        }
                      );
                    }}
                    InputLabelProps={{
                      shrink: true
                    }}
                    helperText={
                      row.dayDate ||
                      "اختر التاريخ"
                    }
                    sx={uiLayout.withUiSx({
                      ...fieldSx,
                      "& .MuiFormHelperText-root": {
                        m: 0,
                        mt: 0.25,
                        textAlign: "right",
                        color: "#057546",
                        fontWeight: 900,
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.75rem"
                        },
                        lineHeight: 1.25
                      }
                    }, uiLayout.formFieldSx)}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                  <TextField InputLabelProps={{ shrink: true }}
                    label="المقرر الأول"
                    value={row.courseName || ""}
                    placeholder={
                      EXAM_ROW_PLACEHOLDERS.courseName
                    }
                    onChange={(event) =>
                      changeRow(
                        index,
                        "courseName",
                        event.target.value
                      )
                    }
                    sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                  />

                  <TextField
                    type="time"
                    label="التوقيت الأول"
                    value={row.timeOneValue || ""}
                    onChange={(event) => {
                      const value = event.target.value;

                      changeRowFields(
                        index,
                        {
                          timeOneValue: value,
                          timeOne:
                            formatExamTime(value)
                        }
                      );
                    }}
                    InputLabelProps={{
                      shrink: true
                    }}
                    helperText={
                      row.timeOne || "اختر الوقت"
                    }
                    sx={uiLayout.withUiSx({
                      ...fieldSx,
                      "& .MuiFormHelperText-root": {
                        m: 0,
                        mt: 0.25,
                        textAlign: "right",
                        color: "#057546",
                        fontWeight: 850,
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.75rem"
                        },
                        lineHeight: 1.2
                      }
                    }, uiLayout.formFieldSx)}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                  <TextField InputLabelProps={{ shrink: true }}
                    label="المقرر الثاني"
                    value={row.courseTwo || ""}
                    placeholder={
                      EXAM_ROW_PLACEHOLDERS.courseTwo
                    }
                    onChange={(event) =>
                      changeRow(
                        index,
                        "courseTwo",
                        event.target.value
                      )
                    }
                    sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
                  />

                  <TextField
                    type="time"
                    label="التوقيت الثاني"
                    value={row.timeTwoValue || ""}
                    onChange={(event) => {
                      const value = event.target.value;

                      changeRowFields(
                        index,
                        {
                          timeTwoValue: value,
                          timeTwo:
                            formatExamTime(value)
                        }
                      );
                    }}
                    InputLabelProps={{
                      shrink: true
                    }}
                    helperText={
                      row.timeTwo || "اختر الوقت"
                    }
                    sx={uiLayout.withUiSx({
                      ...fieldSx,
                      gridColumn: "1 / -1",
                      "& .MuiFormHelperText-root": {
                        m: 0,
                        mt: 0.25,
                        textAlign: "right",
                        color: "#057546",
                        fontWeight: 850,
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.75rem"
                        },
                        lineHeight: 1.2
                      }
                    }, uiLayout.formFieldSx)}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>

        {/* Desktop: keep table layout */}
        <Box
          sx={{
            display: {
              xs: "none",
              lg: "grid"
            },
            minWidth: 980,
            gridTemplateColumns:
              "46px 1.35fr 1fr .8fr 1fr .8fr",
            gap: 1,
            direction: "rtl",
            alignItems: "center"
          }}
        >
          <Box />

          {[
            "اليوم / التاريخ",
            "المقرر الأول",
            "التوقيت الأول",
            "المقرر الثاني",
            "التوقيت الثاني"
          ].map((title) => (
            <Typography
              key={title}
              align="center"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900
              }}
            >
              {title}
            </Typography>
          ))}

          {rows.map((row, index) => (
            <React.Fragment key={index}>
              <Button
                color="error"
                variant="outlined"
                onClick={() =>
                  deleteExamDay(index)
                }
                sx={uiLayout.withUiSx({
                  minWidth: 42,
                  width: 42,
                  height: 42,
                  p: 0
                }, uiLayout.buttonSx)}
              >
                <DeleteOutlineIcon />
              </Button>

              <TextField
                type="date"
                label="التاريخ"
                value={row.examDateValue || ""}
                onChange={(event) => {
                  const value = event.target.value;

                  changeRowFields(
                    index,
                    {
                      examDateValue: value,
                      dayDate:
                        formatExamHijriDate(value)
                    }
                  );
                }}
                InputLabelProps={{
                  shrink: true
                }}
                helperText={row.dayDate || ""}
                sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField InputLabelProps={{ shrink: true }}
                value={row.courseName || ""}
                placeholder={
                  EXAM_ROW_PLACEHOLDERS.courseName
                }
                onChange={(event) =>
                  changeRow(
                    index,
                    "courseName",
                    event.target.value
                  )
                }
                sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
              />

              <TextField
                type="time"
                label="التوقيت الأول"
                value={row.timeOneValue || ""}
                onChange={(event) => {
                  const value = event.target.value;

                  changeRowFields(
                    index,
                    {
                      timeOneValue: value,
                      timeOne:
                        formatExamTime(value)
                    }
                  );
                }}
                InputLabelProps={{
                  shrink: true
                }}
                helperText={row.timeOne || ""}
                sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField InputLabelProps={{ shrink: true }}
                value={row.courseTwo || ""}
                placeholder={
                  EXAM_ROW_PLACEHOLDERS.courseTwo
                }
                onChange={(event) =>
                  changeRow(
                    index,
                    "courseTwo",
                    event.target.value
                  )
                }
                sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
              />

              <TextField
                type="time"
                label="التوقيت الثاني"
                value={row.timeTwoValue || ""}
                onChange={(event) => {
                  const value = event.target.value;

                  changeRowFields(
                    index,
                    {
                      timeTwoValue: value,
                      timeTwo:
                        formatExamTime(value)
                    }
                  );
                }}
                InputLabelProps={{
                  shrink: true
                }}
                helperText={row.timeTwo || ""}
                sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            </React.Fragment>
          ))}
        </Box>
      </Paper>
    </>
  );
};


const CourseListEditor = ({
  value,
  setForm
}) => {
  const [newCourse, setNewCourse] = useState("");

  const courses = String(value || "")
    .split(/[،,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const commit = (nextCourses) => {
    setForm((current) => ({
      ...current,
      courses: nextCourses.join("، "),
      documentGuid: "",
      documentNo: "",
      verificationUrl: ""
    }));
  };

  const addCourse = () => {
    const cleanValue = newCourse.trim();

    if (!cleanValue) return;

    commit([...courses, cleanValue]);
    setNewCourse("");
  };

  const removeCourse = (index) => {
    commit(
      courses.filter(
        (_, courseIndex) =>
          courseIndex !== index
      )
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={uiLayout.withUiSx({
        p: 2,
        mb: 2,
        borderRadius: 3,

        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          p: 0.75,
          mb: 0.85,
          borderRadius: 2
        },

        "@media (max-width:599px)": {
          p: 0.55,
          mb: 0.65,
          borderRadius: 1.5
        }
      }, uiLayout.pageHeaderSx)}
    >
      <Typography
        sx={{
          fontFamily: "Cairo",
          color: "#057546",
          fontWeight: 900,
          mb: 1,

          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
            mb: 0.55,
            fontSize: "0.75rem"
          },

          "@media (max-width:599px)": {
            mb: 0.4,
            fontSize: "0.75rem"
          }
        }}
      >
        المقررات
      </Typography>

      <Stack
        direction="row"
        spacing={{
          xs: 0.45,
          sm: 0.65,
          md: 1
        }}
        alignItems="center"
        sx={uiLayout.withUiSx({ mb: courses.length ? 0.6 : 0 }, uiLayout.filterBarSx)}
      >
        <TextField InputLabelProps={{ shrink: true }}
          fullWidth
          size="small"
          label="اسم المقرر"
          placeholder="اكتب المقرر"
          value={newCourse}
          onChange={(event) =>
            setNewCourse(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCourse();
            }
          }}
          sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
        />

        <Button
          variant="contained"
          onClick={addCourse}
          startIcon={<AddCircleOutlineIcon />}
          sx={uiLayout.withUiSx({
            flexShrink: 0,
            minWidth: {
              xs: 72,
              sm: 86,
              md: 105
            },
            minHeight: {
              xs: 31,
              sm: 34
            },
            fontFamily: "Cairo",
            fontWeight: 900,
            background:
              "linear-gradient(135deg,#057546,#034d31)",
            fontSize: {
              xs: "0.75rem",
              sm: "0.75rem",
              md: "0.75rem"
            }
          }, uiLayout.buttonSx)}
        >
          إضافة
        </Button>
      </Stack>

      {courses.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: {
              xs: 0.4,
              sm: 0.55,
              md: 0.75
            }
          }}
        >
          {courses.map((course, index) => (
            <Box
              key={`${course}-${index}`}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.25,
                border: (theme) => theme.palette.mode === "dark" ? "1px solid #67C99D" : "1px solid #cfe7dc",
                background: (theme) => theme.palette.mode === "dark" ? theme.palette.surfaces.nested : "#f4fbf7",
                borderRadius: 999,
                py: {
                  xs: 0.2,
                  sm: 0.3
                },
                pr: {
                  xs: 0.55,
                  sm: 0.7
                },
                pl: {
                  xs: 0.25,
                  sm: 0.35
                },
                maxWidth: "100%"
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  color: "#17372b",
                  fontSize: {
                    xs: "0.75rem",
                    sm: "0.75rem",
                    md: "0.75rem"
                  },
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: {
                    xs: 150,
                    sm: 220,
                    md: 320
                  }
                }}
              >
                {course}
              </Typography>

              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  removeCourse(index)
                }
                sx={{
                  width: {
                    xs: 21,
                    sm: 24
                  },
                  height: {
                    xs: 21,
                    sm: 24
                  },
                  p: 0
                }}
              >
                <DeleteOutlineIcon
                  sx={{
                    fontSize: {
                      xs: 13,
                      sm: 15
                    }
                  }}
                />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

const AbsenceWarningEditor = ({ form, update, setForm, loadStudent, loadingStudent }) => <>
  <Section title="البيانات الأساسية">
    <StudentLookupFields form={form} update={update} loadStudent={loadStudent} loadingStudent={loadingStudent} />
    <TextField InputLabelProps={{ shrink: true }} label="الفصل التدريبي" value={form.termName} onChange={update("termName")} sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}/>
    <TextField InputLabelProps={{ shrink: true }} label="رقم الجلسة" value={form.sessionNo} onChange={update("sessionNo")} sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}/>
    <TextField InputLabelProps={{ shrink: true }} label="تاريخ اللائحة" value={form.sessionHijriDate} onChange={update("sessionHijriDate")} sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}/>
    <TextField InputLabelProps={{ shrink: true }} label="رقم المادة" value={form.articleNo} onChange={update("articleNo")} sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}/>
    <TextField InputLabelProps={{ shrink: true }} label="رقم الإنذار" value={form.warningNo} onChange={update("warningNo")} sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}/>
  </Section>
  <Section title="إعدادات الإنذار">
    <TextField InputLabelProps={{ shrink: true }} label="نسبة الإنذار" value={form.absencePercent} onChange={update("absencePercent")} sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}/>
    <TextField InputLabelProps={{ shrink: true }} label="نسبة الحرمان النهائية" value={form.denialPercent} onChange={update("denialPercent")} sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}/>
  </Section>
  <CourseListEditor
    value={form.courses}
    setForm={setForm}
  />
</>;

const GradeWarningEditor = ({
  form,
  update,
  loadStudent,
  loadingStudent
}) => (
  <>
    <Section title="البيانات الأساسية">
      <StudentLookupFields
        form={form}
        update={update}
        loadStudent={loadStudent}
        loadingStudent={loadingStudent}
      />

      <TextField InputLabelProps={{ shrink: true }}
        label="رقم الجلسة"
        value={form.sessionNo}
        onChange={update("sessionNo")}
        sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
      />

      <TextField InputLabelProps={{ shrink: true }}
        label="تاريخ اللائحة"
        value={form.sessionHijriDate}
        onChange={update("sessionHijriDate")}
        sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
      />

      <TextField InputLabelProps={{ shrink: true }}
        label="رقم المادة"
        value={form.articleNo}
        onChange={update("articleNo")}
        sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
      />

      <TextField InputLabelProps={{ shrink: true }}
        label="رقم الإنذار"
        value={form.warningNo}
        onChange={update("warningNo")}
        sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
      />
    </Section>

    <Section title="إعدادات انخفاض المعدل">
      <TextField InputLabelProps={{ shrink: true }}
        label="المعدل أقل من"
        value={form.gradeValue}
        onChange={update("gradeValue")}
        placeholder="مثال: 2.00"
        sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
      />

      <TextField InputLabelProps={{ shrink: true }}
        label="من"
        value={form.gradeMax}
        onChange={update("gradeMax")}
        placeholder="مثال: 5.00"
        sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
      />

      <TextField InputLabelProps={{ shrink: true }}
        label="الفترة التدريبية"
        value={form.periodHijriText}
        onChange={update("periodHijriText")}
        placeholder="مثال: الفصل التدريبي الأول لعام 1448هـ"
        sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
      />
    </Section>

    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 3,
        [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
          p: 0.75,
          mb: 0.85,
          borderRadius: 2
        },
        "@media (max-width:599px)": {
          p: 0.55,
          mb: 0.65,
          borderRadius: 1.5
        }
      }}
    >
      <Typography
        sx={{
          fontFamily: "Cairo",
          color: "#057546",
          fontWeight: 900,
          mb: 1,
          [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
            mb: 0.5,
            fontSize: "0.75rem"
          },
          "@media (max-width:599px)": {
            mb: 0.35,
            fontSize: "0.75rem"
          }
        }}
      >
        سبب انخفاض المعدل
      </Typography>

      <TextField InputLabelProps={{ shrink: true }}
        fullWidth
        multiline
        minRows={1}
        maxRows={3}
        value={form.reasonText}
        onChange={update("reasonText")}
        placeholder="مثال: نظراً لحرمانك / غيابك عن أداء الاختبارات"
        sx={uiLayout.withUiSx(compactTextAreaSx, uiLayout.formFieldSx)}
      />
    </Paper>
  </>
);

const FinancialWarningEditor = ({
  form,
  update,
  loadStudent,
  loadingStudent,
  isSecond
}) => (
  <>
    <Section title="بيانات المتدرب">
      <StudentLookupFields
        form={form}
        update={update}
        loadStudent={loadStudent}
        loadingStudent={loadingStudent}
      />
    </Section>

    <Section title="بيانات الإنذار المالي">
      <TextField InputLabelProps={{ shrink: true }}
        label="قيمة المستحقات المالية"
        value={form.financialAmount}
        onChange={update("financialAmount")}
        placeholder="مثال: 2500"
        inputProps={{
          inputMode: "decimal"
        }}
        sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
      />

      {isSecond && (
        <TextField InputLabelProps={{ shrink: true }}
          label="تاريخ الإنذار المالي الأول"
          value={form.firstWarningDate}
          onChange={update("firstWarningDate")}
          placeholder="مثال: 1448/02/18 هـ"
          sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
        />
      )}
    </Section>
  </>
);

const GeneralLetterEditor = ({
  form,
  update,
  setForm,
  loadStudent,
  loadingStudent,
  formCode
}) => {
  const isRejected =
    formCode === "REGISTRATION_REJECTED";

  const isDropped =
    formCode === "DROPPED_STATEMENT";

  const isCourseWaiting =
    formCode === "COURSE_STUDIED_WAITING_EXAM";

  const isNotRegistered =
    formCode === "NOT_REGISTERED_LETTER";

  return (
    <>
      <Section title="بيانات الخطاب">
        <StudentLookupFields
          form={form}
          update={update}
          loadStudent={loadStudent}
          loadingStudent={loadingStudent}
          hideDiploma={
            isCourseWaiting ||
            isNotRegistered
          }
        />

        {!isRejected && !isDropped && (
          <TextField InputLabelProps={{ shrink: true }}
            label={
              isCourseWaiting
                ? "الدورة"
                : isNotRegistered
                  ? "الدبلوم / دورة"
                  : "الدبلوم"
            }
            value={form.letterProgramName}
            onChange={update("letterProgramName")}
            placeholder={
              isCourseWaiting
                ? "مثال: دورة تطبيقات الحاسب"
                : isNotRegistered
                  ? "اكتب اسم الدبلوم أو الدورة"
                  : "مثال: دبلوم إدارة المستشفيات"
            }
            sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
          />
        )}

        {isRejected && (
          <>
            <TextField InputLabelProps={{ shrink: true }}
              label="دورة / دبلوم الموافقة"
              value={form.letterApprovedProgramName}
              onChange={update("letterApprovedProgramName")}
              placeholder="اكتب البرنامج الوارد بخطاب الموافقة"
              sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
            />

            <TextField InputLabelProps={{ shrink: true }}
              label="تاريخ بداية الموافقة"
              value={form.letterStartDate}
              onChange={update("letterStartDate")}
              placeholder="مثال: 1448/02/18 هـ"
              sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
            />
          </>
        )}

        {isDropped && (
          <TextField InputLabelProps={{ shrink: true }}
            label="تاريخ طي القيد"
            value={form.letterRegisterDate}
            onChange={update("letterRegisterDate")}
            placeholder="مثال: 1448/02/18 هـ"
            sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
          />
        )}

        {isCourseWaiting && (
          <>
            <TextField InputLabelProps={{ shrink: true }}
              label="تاريخ بداية الدراسة"
              value={form.letterStartDate}
              onChange={update("letterStartDate")}
              placeholder="مثال: 1448/02/18 هـ"
              sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
            />

            <TextField InputLabelProps={{ shrink: true }}
              label="تاريخ نهاية الدراسة"
              value={form.letterEndDate}
              onChange={update("letterEndDate")}
              placeholder="مثال: 1448/05/18 هـ"
              sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
            />

            <TextField InputLabelProps={{ shrink: true }}
              label="عدد ساعات الدورة"
              value={form.letterStudyHours}
              onChange={update("letterStudyHours")}
              placeholder="مثال: 180"
              inputProps={{
                inputMode: "numeric"
              }}
              sx={uiLayout.withUiSx(fieldSx, uiLayout.formFieldSx)}
            />
          </>
        )}
      </Section>

      {isRejected && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            direction: "rtl",

            [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
              p: 0.75,
              mb: 0.85,
              borderRadius: 2
            },

            "@media (max-width:599px)": {
              p: 0.55,
              mb: 0.65,
              borderRadius: 1.5
            }
          }}
        >
          <Typography
            sx={{
              fontFamily: "Cairo",
              color: "#057546",
              fontWeight: 900,
              mb: 1,

              [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                mb: 0.45,
                fontSize: "0.75rem"
              },

              "@media (max-width:599px)": {
                mb: 0.3,
                fontSize: "0.75rem"
              }
            }}
          >
            أسباب تعذر التسجيل
          </Typography>

          <Stack
            spacing={{
              xs: 0.35,
              sm: 0.5,
              md: 1
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(
                    form.letterReasonFees
                  )}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      letterReasonFees:
                        event.target.checked
                    }))
                  }
                />
              }
              label="عدم استكمال إجراءات التسجيل وسداد الرسوم الدراسية"
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                    fontSize: "0.75rem",
                    lineHeight: 1.35
                  },
                  "@media (max-width:599px)": {
                    fontSize: "0.75rem",
                    lineHeight: 1.3
                  }
                },
                "& .MuiCheckbox-root": {
                  "@media (max-width:599px)": {
                    padding: "4px"
                  }
                },
                "& .MuiSvgIcon-root": {
                  "@media (max-width:599px)": {
                    fontSize: "17px"
                  }
                }
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(
                    form.letterReasonCapacity
                  )}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      letterReasonCapacity:
                        event.target.checked
                    }))
                  }
                />
              }
              label="اكتمال أعداد المتدربين وزيادة الطاقة الاستيعابية بالمعهد"
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  [`@media (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`]: {
                    fontSize: "0.75rem",
                    lineHeight: 1.35
                  },
                  "@media (max-width:599px)": {
                    fontSize: "0.75rem",
                    lineHeight: 1.3
                  }
                },
                "& .MuiCheckbox-root": {
                  "@media (max-width:599px)": {
                    padding: "4px"
                  }
                },
                "& .MuiSvgIcon-root": {
                  "@media (max-width:599px)": {
                    fontSize: "17px"
                  }
                }
              }}
            />
          </Stack>
        </Paper>
      )}
    </>
  );
};



const ExamSchedulePrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      String(model.documentGuid || "");

    return (
      <PrintPage ref={ref}>
        <PrintWatermark />
        <PrintPageBody>
          <PrintHeader
            model={model}
            title={model.toText || "إلى من يهمه الأمر"}
            subtitle="جدول اختبارات معتمد"
          />

          <PrintTable
            columns={["اسم المتدرب", "رقم الهوية", "الدبلوم", "المستوى"]}
            values={[
              model.studentName,
              <bdi dir="ltr">{model.nationalId || "-"}</bdi>,
              model.specialization,
              model.levelName
            ]}
          />

          {model.statementText && (
            <Typography
              sx={{
                mt: "4mm",
                fontSize: "8.5pt",
                fontWeight: 800,
                lineHeight: 1.7,
                textAlign: "right"
              }}
            >
              {model.statementText}
            </Typography>
          )}

          <Box
            component="table"
            sx={{
              width: "100%",
              tableLayout: "fixed",
              borderCollapse: "collapse",
              mt: "4mm",
              border: `1px solid ${PRINT_COLORS.greenLine}`,
              "& th, & td": {
                border: `1px solid ${PRINT_COLORS.greenLine}`,
                px: "1mm",
                py: "2mm",
                textAlign: "center",
                verticalAlign: "middle",
                fontSize: "7.6pt",
                fontWeight: 800
              },
              "& th": {
                backgroundColor: PRINT_COLORS.greenSoft,
                color: PRINT_COLORS.greenDark,
                fontWeight: 900
              }
            }}
          >
            <thead>
              <tr>
                <th>اليوم / التاريخ</th>
                <th>المقرر الأول</th>
                <th>التوقيت الأول</th>
                <th>المقرر الثاني</th>
                <th>التوقيت الثاني</th>
              </tr>
            </thead>
            <tbody>
              {(model.examRows || []).slice(0, 4).map((row, index) => (
                <tr key={index} style={{ height: "12mm" }}>
                  <td>{row.dayDate || "-"}</td>
                  <td>{row.courseName || "-"}</td>
                  <td>{row.timeOne || "-"}</td>
                  <td>{row.courseTwo || "-"}</td>
                  <td>{row.timeTwo || "-"}</td>
                </tr>
              ))}
            </tbody>
          </Box>

          <Typography
            align="center"
            sx={{ mt: "4mm", fontSize: "8.7pt", fontWeight: 900, color: PRINT_COLORS.greenDark }}
          >
            وتفضلوا بقبول وافر التحية،،،
          </Typography>

          <PrintVerificationAndSignature
            model={model}
            verificationUrl={verificationUrl}
            verificationLabel="موثوقية الجدول"
          />
        </PrintPageBody>
        <PrintFooter />
      </PrintPage>
    );
  }
);

const GeneralLetterPrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      String(model.documentGuid || "");

    const formCode = model.formCode || "";
    const isRejected = formCode === "REGISTRATION_REJECTED";
    const isDropped = formCode === "DROPPED_STATEMENT";
    const isCourseWaiting = formCode === "COURSE_STUDIED_WAITING_EXAM";
    const isNotRegistered = formCode === "NOT_REGISTERED_LETTER";

    const programTitle = isCourseWaiting
      ? "الدورة"
      : isNotRegistered
        ? "الدبلوم / دورة"
        : isDropped
          ? "الدبلوم"
          : "الدورة / الدبلوم";

    const mainText = isDropped
      ? `نفيد سعادتكم بأن الموضح بياناته أعلاه كان مسجلاً لدينا في دبلوم ${model.specialization || ""} وتقدم بطلب طي قيده بتاريخ ${model.letterRegisterDate || ""} بناءً على طلبه، وقد تم إنهاء جميع إجراءات طي قيده بالمعهد، وتم طي قيده من موقع المؤسسة العامة للتدريب التقني والمهني.`
      : isCourseWaiting
        ? `نفيد سعادتكم بأن الموضح بياناته أعلاه مسجل لدينا في دورة ${model.letterProgramName || ""}، معتمدة من المؤسسة العامة للتدريب التقني والمهني بعدد ساعات ${model.letterStudyHours || ""} ساعة، وتبدأ الدراسة في ${model.letterStartDate || ""} وتنتهي في ${model.letterEndDate || ""}، وقد أنهى جميع مقررات الدورة كاملة وهو في انتظار تحديد موعد اختبار المؤسسة العامة للتدريب التقني والمهني.`
        : isNotRegistered
          ? `نفيد سعادتكم بأن الموضح بياناته أعلاه تقدم بطلب للمعهد للحصول على موافقة لدبلوم / دورة ${model.letterProgramName || ""}، ولم يستكمل إجراءات القبول والتسجيل لدينا وسداد الرسوم الدراسية، مما ترتب على ذلك عدم تسجيل المتدرب بأنظمة المؤسسة العامة للتدريب التقني والمهني. وبناءً على ما سبق نؤكد عدم تسجيل المتدرب لدى المعهد السعودي المتخصص العالي للتدريب بأي برنامج تدريبي حتى تاريخه.`
          : `نفيد سعادتكم بأن الموضح بياناته أعلاه تعذر تسجيله بالدورة / الدبلوم المقرر اعتماده له والموضحة له تاريخ البدء لها في خطاب الموافقة لدورة / دبلوم ${model.letterApprovedProgramName || ""} والمحدد بتاريخ ${model.letterStartDate || ""}.`;

    const columns = isDropped
      ? ["رقم السجل المدني", "الاسم"]
      : [programTitle, "رقم السجل المدني", "الاسم"];

    const values = isDropped
      ? [<bdi dir="ltr">{model.nationalId || "-"}</bdi>, model.studentName]
      : [
          isRejected ? model.specialization : model.letterProgramName,
          <bdi dir="ltr">{model.nationalId || "-"}</bdi>,
          model.studentName
        ];

    return (
      <PrintPage ref={ref}>
        <PrintWatermark />
        <PrintPageBody>
          <PrintHeader
            model={model}
            title="إلى من يهمه الأمر"
            subtitle={model.formName || "خطاب جودة"}
          />

          <PrintTable columns={columns} values={values} />

          <Typography
            align="center"
            sx={{ mt: "4mm", fontSize: "9pt", fontWeight: 900, lineHeight: 1.8 }}
          >
            السلام عليكم ورحمة الله وبركاته
            <br />
            تحية طيبة وبعد،،،
          </Typography>

          <PrintBodyCard sx={{ mt: "3mm" }}>
            <Typography
              sx={{
                fontSize: "8.8pt",
                fontWeight: 800,
                lineHeight: 2,
                textAlign: "justify",
                direction: "rtl"
              }}
            >
              {mainText}
            </Typography>

            {isRejected && (
              <Box sx={{ mt: "2.5mm", display: "grid", gap: "1.5mm" }}>
                {model.letterReasonFees && (
                  <Typography sx={{ fontSize: "8.4pt", fontWeight: 800 }}>
                    □ وذلك لعدم استكمال المتدرب إجراءات التسجيل وسداد الرسوم الدراسية.
                  </Typography>
                )}
                {model.letterReasonCapacity && (
                  <Typography sx={{ fontSize: "8.4pt", fontWeight: 800 }}>
                    □ وذلك لاكتمال أعداد المتدربين وزيادة الطاقة الاستيعابية بالمعهد.
                  </Typography>
                )}
                {!model.letterReasonFees && !model.letterReasonCapacity && (
                  <Typography sx={{ fontSize: "8.4pt", fontWeight: 800 }}>
                    □ وذلك حسب أنظمة القبول والتسجيل المعمول بها.
                  </Typography>
                )}
              </Box>
            )}
          </PrintBodyCard>

          <Typography
            align="center"
            sx={{ mt: "4mm", fontSize: "8.6pt", fontWeight: 800, color: PRINT_COLORS.muted }}
          >
            وقد أعطي هذا المشهد بناءً على طلبه دون أدنى مسؤولية على المعهد.
          </Typography>

          <PrintVerificationAndSignature
            model={model}
            verificationUrl={verificationUrl}
            verificationLabel="موثوقية الخطاب"
          />
        </PrintPageBody>
        <PrintFooter />
      </PrintPage>
    );
  }
);

const FinancialWarningPrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      String(model.documentGuid || "");

    const isSecond = model.formCode === "FINANCIAL_WARNING_2";
    const title = isSecond ? "الإنذار المالي رقم (2) الأخير" : "إنذار مالي رقم (1)";

    return (
      <PrintPage ref={ref}>
        <PrintWatermark />
        <PrintPageBody>
          <PrintHeader
            model={model}
            title={title}
            subtitle="إشعار مالي رسمي"
          />

          <PrintTable
            columns={["الاسم", "رقم السجل المدني", "الدبلوم"]}
            values={[
              model.studentName,
              <bdi dir="ltr">{model.nationalId || "-"}</bdi>,
              model.specialization
            ]}
          />

          {isSecond && (
            <Typography
              sx={{
                mt: "3mm",
                fontSize: "8.3pt",
                fontWeight: 800,
                color: PRINT_COLORS.warning,
                textAlign: "center"
              }}
            >
              بناءً على الإنذار الأول المرسل بتاريخ: {model.firstWarningDate || "/      /      هـ"}
            </Typography>
          )}

          <Typography
            align="center"
            sx={{ mt: "4mm", fontSize: "9pt", fontWeight: 900 }}
          >
            السلام عليكم ورحمة الله وبركاته، وبعد
          </Typography>

          <PrintBodyCard
            sx={{
              mt: "3mm",
              borderColor: "#d6b36f",
              backgroundColor: PRINT_COLORS.warningSoft
            }}
          >
            <Typography
              sx={{
                fontSize: "8.8pt",
                fontWeight: 800,
                lineHeight: 2,
                textAlign: "justify",
                color: PRINT_COLORS.ink
              }}
            >
              {isSecond ? (
                <>
                  ونظراً لتوقفكم عن سداد مستحقات مالية متأخرة عليكم بقيمة{" "}
                  <strong>{model.financialAmount || "0"} ريال سعودي</strong>، ورغم تواصل
                  المعهد المستمر وإرسال الإنذار الأول والتنبيه بوجوب البدء في خطة جدولة
                  المديونية، ورغم التسهيلات المقدمة من المعهد إلا أن انقطاعكم عن البدء في
                  خطة السداد وعدم الالتزام تجاه حقوق المعهد المالية، نعلمكم أنه في حال
                  عدم الاستجابة للإنذار الثاني خلال 15 يومًا فإن المعهد سيتخذ الإجراء
                  النهائي وإيقاف خدماتكم التدريبية مع الاستمرار بالمطالبة بالمستحقات عبر
                  الطرق القانونية التي يوفرها النظام. نرجو الاستجابة والالتزام ولكم منا التقدير.
                </>
              ) : (
                <>
                  نظراً لانقطاعكم عن التواصل مع المعهد وعدم الوفاء بالتزاماتكم ووجود
                  مستحقات مالية متأخرة بقيمة <strong>{model.financialAmount || "0"} ريال سعودي</strong>،
                  ورغم تواصل المعهد معكم أكثر من مرة دون جدوى، نعلمكم أنه في حالة عدم
                  البدء في جدولة وسداد هذه المستحقات في موعد أقصاه 15 يومًا من تاريخ
                  الإنذار الأول سيتم استكمال الإجراءات القانونية. نأمل سرعة الاستجابة
                  ولكم كل التقدير.
                </>
              )}
            </Typography>
          </PrintBodyCard>

          <PrintVerificationAndSignature
            model={model}
            verificationUrl={verificationUrl}
            verificationLabel="موثوقية الإنذار المالي"
          />
        </PrintPageBody>
        <PrintFooter />
      </PrintPage>
    );
  }
);

const AbsenceWarningPrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      String(model.documentGuid || "");

    const isCourseDeprivation = model.formCode === "COURSE_DEPRIVATION";
    const isGradeWarning = [
      "GRADE_WARNING_1",
      "GRADE_WARNING_2",
      "GRADE_WARNING_3"
    ].includes(model.formCode);

    const warningNumber =
      model.formCode === "GRADE_WARNING_3"
        ? "3"
        : model.formCode === "GRADE_WARNING_2"
          ? "2"
          : model.formCode === "GRADE_WARNING_1"
            ? "1"
            : isCourseDeprivation
              ? "3"
              : model.warningNo || "1";

    const absencePercent = isCourseDeprivation
      ? model.absencePercent || "25"
      : model.absencePercent || "10";

    const verificationLabel = isCourseDeprivation
      ? "موثوقية الحرمان"
      : "موثوقية الإنذار";

    const printTitle = isGradeWarning
      ? `إنذار رقم (${warningNumber}) - انخفاض المعدل`
      : isCourseDeprivation
        ? "إشعار حرمان من مقرر"
        : `إنذار رقم (${warningNumber}) - تعليمات الانتظام`;

    return (
      <PrintPage ref={ref}>
        <PrintWatermark />
        <PrintPageBody>
          <PrintHeader
            model={model}
            title={printTitle}
            subtitle={isCourseDeprivation ? "إشعار أكاديمي" : "إنذار تدريبي رسمي"}
          />

          <PrintTable
            columns={["الاسم", "رقم السجل المدني", "الدبلوم"]}
            values={[
              model.studentName,
              <bdi dir="ltr">{model.nationalId || "-"}</bdi>,
              model.specialization
            ]}
          />

          <Typography
            align="center"
            sx={{ mt: "4mm", fontSize: "9.8pt", fontWeight: 900, lineHeight: 1.85 }}
          >
            السلام عليكم ورحمة الله وبركاته
            <br />
            تحية طيبة وبعد،،،
          </Typography>

          <PrintBodyCard sx={{ mt: "3.5mm", p: "4mm 5mm" }}>
            <Typography
              sx={{
                fontSize: "10pt",
                fontWeight: 750,
                lineHeight: 1.85,
                textAlign: "justify",
                direction: "rtl",
                color: PRINT_COLORS.ink,
                letterSpacing: 0,
                overflowWrap: "break-word"
              }}
            >
              بعد الاطلاع على اللائحة التدريبية الأهلية المعتمدة من مجلس الإدارة
              بالجلسة رقم ({model.sessionNo || 108}) وتاريخ{" "}
              {model.sessionHijriDate || "1440/11/02 هـ"}، والاطلاع على دليل تعليمات
              التدريب لمنشآت التدريب الأهلية، وتم الإشارة إليها في اتفاقية التدريب
              مسبقاً؛ وفقاً للمادة ({model.articleNo || (isGradeWarning ? 15 : 13)}) من
              دليل تعليمات التدريب لمنشآت التدريب الأهلية:{" "}
              {isGradeWarning ? (
                <>
                  تعليمات الإنذارات وطي القيد. نفيدكم أن معدلكم التراكمي انخفض عن
                  ({model.gradeValue || "2.00"} من {model.gradeMax || "5.00"}) خلال
                  الفترة التدريبية {model.periodHijriText || "-"}، وذلك{" "}
                  {model.reasonText || "نظراً لحرمانك / غيابك عن أداء الاختبارات"}.
                  لذا نأمل الالتزام خلال الفترة التدريبية الحالية، وإلا سنضطر آسفين
                  إلى إنهاء إجراءات طي القيد.
                </>
              ) : (
                <>
                  تعليمات الانتظام والانسحاب والانتقال. نحيطكم بأن نسبة غيابكم قد
                  تجاوزت <strong>{absencePercent}%</strong> من إجمالي ساعات المقررات الآتية:{" "}
                  {model.courses || "المقررات المسجلة بالفصل التدريبي"}، بالفصل التدريبي{" "}
                  {model.termName || "-"}.{" "}
                  {isCourseDeprivation ? (
                    <>
                      ولذلك تم اعتباركم محرومين في المقررات، ولا يحق لكم دخول اختبار
                      هذه المقررات في نهاية الفترة التدريبية. لذا نأمل منكم الالتزام
                      بالحضور وفق الجدول التدريبي للمحاضرات في الفصل التدريبي القادم.
                    </>
                  ) : (
                    <>
                      وفي حال عدم الالتزام بالحضور وزيادة نسبة الغياب عن{" "}
                      {model.denialPercent || 25}% من إجمالي ساعات المقرر فإنه يتم
                      اعتباركم محرومين في المقررات، ولا يحق لكم دخول اختبار المقرر في
                      نهاية الفترة التدريبية. لذا نأمل منكم الالتزام بالحضور وفق الجدول
                      التدريبي للمحاضرات.
                    </>
                  )}
                </>
              )}
            </Typography>
          </PrintBodyCard>

          <Typography
            align="center"
            sx={{
              mt: "4mm",
              fontSize: "9.6pt",
              lineHeight: 1.5,
              fontWeight: 900,
              color: PRINT_COLORS.greenDark
            }}
          >
            هذا لإحاطتكم والتنبيه، والله ولي التوفيق
          </Typography>

          <PrintVerificationAndSignature
            model={model}
            verificationUrl={verificationUrl}
            verificationLabel={verificationLabel}
          />
        </PrintPageBody>
        <PrintFooter />
      </PrintPage>
    );
  }
);

export default QualityFormsPage;