import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Checkbox,
  Divider,
  FormControlLabel,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import PrintIcon from "@mui/icons-material/Print";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Swal from "sweetalert2";
import { QRCodeSVG } from "qrcode.react";
import Sidebar from "../components/Sidebar";
import { mt } from "date-fns/locale";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

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
      courseName: "",
      timeOne: "",
      courseTwo: "",
      timeTwo: ""
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

const fieldSx = {
  "& .MuiInputBase-root": {
    fontFamily: "Cairo"
  },
  "& .MuiInputLabel-root": {
    fontFamily: "Cairo"
  }
};

const QualityFormsPage = () => {
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
      <html lang="ar" dir="ltr">
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
              overflow: visible !important;

              font-family:
                Cairo,
                Tahoma,
                Arial,
                sans-serif !important;

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

            .print-sheet,
            .print-page {
              width: 210mm !important;
              min-width: 210mm !important;
              max-width: 210mm !important;

              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;

              margin: 0 !important;
              padding: 0 !important;

              overflow: hidden !important;
              box-shadow: none !important;

              page-break-inside: avoid !important;
              break-inside: avoid-page !important;
            }

            .print-document {
              width: 210mm !important;
              min-width: 210mm !important;
              max-width: 210mm !important;

              margin: 0 !important;
              padding: 0 !important;
            }

            .print-page {
              page-break-after: always !important;
              break-after: page !important;
            }

            .print-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }

            img {
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
            }

            @media print {
              html,
              body {
                width: 210mm !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
          </style>
        </head>

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

                setTimeout(() => {
                  window.focus();
                  window.print();
                }, 700);
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        direction: "ltr",
        background:
          "linear-gradient(135deg,#f5faf7 0%,#fff 55%,#eef8f3 100%)"
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          ml: {
            xs: 0,
            md: `${SIDEBAR_WIDTH}px`
          },
          p: {
            xs: 1.2,
            md: 2
          }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,.14)",
            direction: "ltr"
          }}
        >
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
          >
            <DescriptionIcon
              sx={{
                color: "#057546",
                fontSize: 40
              }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: "1.25rem",
                  color: "#173b2b"
                }}
              >
                نماذج الجودة
              </Typography>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  color: "#708179",
                  fontSize: ".78rem"
                }}
              >
                إنشاء وحفظ وتصدير نماذج الجودة بصيغة PDF
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,.14)",
            direction: "ltr"
          }}
        >
          <FormControl
            fullWidth
            sx={fieldSx}
          >
            <InputLabel>
              اختر نوع النموذج
            </InputLabel>

            <Select
              value={selectedTemplate}
              label="اختر نوع النموذج"
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
                      courseName: "",
                      timeOne: "",
                      courseTwo: "",
                      timeTwo: ""
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
            elevation={0}
            sx={{
              p: {
                xs: 1.5,
                md: 2.5
              },
              borderRadius: 4,
              border:
                "1px solid rgba(5,117,70,.14)",
              direction: "ltr"
            }}
          >
            <Typography
              align="center"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: "2rem",
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
                mb: 2
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
                label="السجل المدني"
                value={form.nationalId}
                onChange={update("nationalId")}
                inputProps={{
                  maxLength: 10,
                  inputMode: "numeric"
                }}
                sx={fieldSx}
                InputProps={{
                  endAdornment:
                    loadingStudent
                      ? (
                        <CircularProgress
                          size={20}
                        />
                      )
                      : (
                        <Button
                          onClick={() =>
                            loadStudent()
                          }
                          startIcon={
                            <SearchIcon />
                          }
                        >
                          تحميل
                        </Button>
                      )
                }}
              />

              <ReadOnlyField
                label="الاسم"
                value={form.studentName}
              />

              <ReadOnlyField
                label="التاريخ الهجري"
                value={form.hijriDate}
              />

              <TextField
                label="الرقم التدريبي"
                value={form.trainingNo}
                onChange={update("trainingNo")}
                sx={fieldSx}
              />

              <ReadOnlyField
                label="الجنسية"
                value={form.nationality}
              />

              <TextField
                label="إلى"
                value={form.toText}
                onChange={update("toText")}
                sx={fieldSx}
              />
            </Section>

            <Section
              title="بيانات الدراسة"
            >
              {selectedTemplate ===
                "COOP_TRAINING" ? (
                <TextField
                  label="مدة التدريب التعاوني"
                  value={form.studySystem}
                  onChange={update("studySystem")}
                  sx={fieldSx}
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
                <TextField
                  label="تاريخ بداية ونهاية التدريب"
                  value={form.studyStartDate}
                  onChange={update("studyStartDate")}
                  sx={fieldSx}
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
                <TextField
                  label="أيام العمل"
                  value={form.studentStatus}
                  onChange={update("studentStatus")}
                  sx={fieldSx}
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
                <TextField
                  label="عدد ساعات التدريب يوميًا"
                  value={form.totalHours}
                  onChange={update("totalHours")}
                  sx={fieldSx}
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
                  sx={fieldSx}
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
                <TextField
                  label="عدد الساعات المكتسبة"
                  value={form.earnedHours}
                  onChange={update("earnedHours")}
                  sx={fieldSx}
                />
              )}

              {selectedTemplate ===
                "HOURS_STATEMENT" && (
                <TextField
                  label="البريد الإلكتروني"
                  value={form.email}
                  onChange={update("email")}
                  sx={fieldSx}
                />
              )}

              {selectedTemplate ===
                "COOP_TRAINING" && (
                <TextField
                  label="رقم الجوال"
                  value={form.coopPhone}
                  onChange={update("coopPhone")}
                  inputProps={{
                    inputMode: "tel",
                    maxLength: 20
                  }}
                  sx={fieldSx}
                />
              )}

              {selectedTemplate ===
                "COOP_TRAINING" && (
                <TextField
                  label="البريد الإلكتروني"
                  value={form.email}
                  onChange={update("email")}
                  sx={fieldSx}
                />
              )}

              <TextField
                label={
                  selectedTemplate ===
                  "COOP_TRAINING"
                    ? "اسم مشرف التدريب"
                    : "اسم المدير"
                }
                value={form.managerName}
                onChange={update("managerName")}
                sx={fieldSx}
              />

              <TextField
                label={
                  selectedTemplate ===
                  "COOP_TRAINING"
                    ? "صفة مشرف التدريب"
                    : "صفة المدير"
                }
                value={form.managerTitle}
                onChange={update("managerTitle")}
                sx={fieldSx}
              />
            </Section>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 3
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  color: "#057546",
                  fontWeight: 900,
                  mb: 1
                }}
              >
                {selectedTemplate ===
                "COOP_TRAINING"
                  ? "تخصص التدريب التعاوني"
                  : "تخصص المتدرب الدقيق"}
              </Typography>

              <TextField
                multiline
                minRows={3}
                fullWidth
                value={form.specialization}
                onChange={update("specialization")}
                sx={fieldSx}
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
              direction={{
                xs: "column",
                sm: "row"
              }}
              justifyContent="center"
              spacing={1.2}
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
                sx={{
                  minWidth: 180,
                  background:
                    "linear-gradient(135deg,#057546,#034d31)"
                }}
              >
                حفظ النموذج
              </Button>

              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={exportPdfDirect}
                disabled={!form.documentGuid}
              >
                تصدير PDF / طباعة
              </Button>
            </Stack>
          </Paper>
        )}
      </Box>

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
      </Box>
    </Box>
  );
};

const Section = ({
  title,
  children
}) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      mb: 2,
      borderRadius: 3
    }}
  >
    <Typography
      sx={{
        fontFamily: "Cairo",
        color: "#057546",
        fontWeight: 900,
        mb: 1.5
      }}
    >
      {title}
    </Typography>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "1fr 1fr"
        },
        gap: 1.5
      }}
    >
      {children}
    </Box>
  </Paper>
);

const ReadOnlyField = ({
  label,
  value
}) => (
  <TextField
    label={label}
    value={value || ""}
    sx={fieldSx}
    InputProps={{
      readOnly: true
    }}
  />
);

const HoursStatementPrint =
  React.forwardRef(
    ({ model }, ref) => {
      const verificationUrl =
        model.verificationUrl ||
        `${window.location.origin}/quality-forms/verify/${model.documentGuid}`;

      return (
        <Box
          ref={ref}
          className="print-sheet"
          sx={{
            width: "210mm",
            height: "297mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            margin: 0,
            background: "#fff",
            position: "relative",
            overflow: "hidden",
            direction: "ltr",
            color: "#111",
            fontFamily:
              "Cairo, Tahoma, Arial, sans-serif"
          }}
        >
          <Box
            component="img"
            src="/watermark-logo.png"
            alt=""
            sx={{
              position: "absolute",
              left: "50%",
              top: "148mm",
              transform: "translate(-50%, -50%)",
              width: "124mm",
              height: "155mm",
              objectFit: "contain",
              opacity: 0.11,
              zIndex: 0,
              pointerEvents: "none"
            }}
          />

          <Box
            component="img"
            src="/headerveno.png"
            alt="الهيدر"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "210mm",
              height: "43mm",
              objectFit: "fill",
              zIndex: 1,
              display: "block"
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: "30mm",
              right: "1mm",
              width: "52mm",
              zIndex: 3,
              direction: "ltr",
              textAlign: "left",
              fontSize: "9.5pt",
              fontWeight: 900,
              lineHeight: 1.55,
              whiteSpace: "nowrap"
            }}
          >
            <div>
              التاريخ: {model.hijriDate || "-"}
            </div>
            <div>
              صـــــادر رقـــــــم / {model.documentNo || "-"}
            </div>
          </Box>

          <Box
            sx={{
              position: "absolute",
              top: "52mm",
              left: "18mm",
              right: "18mm",
              bottom: "39mm",
              zIndex: 2,
              fontSize: "10.4pt",
              fontWeight: 700,
              lineHeight: 1.82
            }}
          >
            <Typography
              align="center"
              sx={{
                fontFamily: "inherit",
                fontWeight: 900,
                fontSize: "12.6pt",
                lineHeight: 1.6
              }}
            >
              {model.toText || "إلى من يهمه الأمر"}
            </Typography>

            <Typography
              align="center"
              sx={{
                fontFamily: "inherit",
                fontWeight: 900,
                fontSize: "12.2pt",
                mt: 0.7,
                lineHeight: 1.6
              }}
            >
              السلام عليكم ورحمة الله وبركاته
            </Typography>

            <Box
              sx={{
                mt: 3.2,
                borderBottom: "1.2px solid #222"
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.6fr 1fr 1fr 1fr",
                  textAlign: "center",
                  pb: 0.55,
                  fontWeight: 900,
                  fontSize: "10.5pt"
                }}
              >
                <strong>الاسم</strong>
                <strong>السجل المدني</strong>
                <strong>الجنسية</strong>
                <strong>الرقم التدريبي</strong>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "1.6fr 1fr 1fr 1fr",
                textAlign: "center",
                pt: 0.8,
                fontWeight: 800,
                fontSize: "10.5pt"
              }}
            >
              <span>{model.studentName || "-"}</span>
              <span>{model.nationalId || "-"}</span>
              <span>{model.nationality || "-"}</span>
              <span>{model.trainingNo || "-"}</span>
            </Box>

            <Typography
              align="center"
              sx={{
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: "10.45pt",
                mt: 3.1,
                lineHeight: 2.02
              }}
            >
              نفيد سعادتكم علمًا بأن المتدرب المذكور بعاليه أحد متدربي المعهد بدبلوم
              {" "}
              «{model.specialization || "-"}»
              <br />
              ومدة الدبلوم سنتين ونصف كما نفيدكم بالتالي
            </Typography>

            <Divider
              sx={{
                my: 1.55,
                borderColor: "#777"
              }}
            />

            <PrintPair
              title="نظام الدراسة الملتحق به"
              value={model.studySystem}
            />
            <PrintPair
              title="تخصص المتدرب الدقيق"
              value={`«${model.specialization || "-"}»`}
            />
            <PrintPair
              title="تاريخ بداية الدراسة"
              value={model.studyStartDate}
            />
            <PrintPair
              title="حالة المتدرب الدراسية"
              value={model.studentStatus}
            />
            <PrintPair
              title="عدد الساعات المقررة على الدبلوم"
              value={model.totalHours}
            />
            <PrintPair
              title="عدد الساعات المكتسبة"
              value={model.earnedHours}
            />

            <Divider
              sx={{
                my: 1.55,
                borderColor: "#777"
              }}
            />

            <Typography
              align="center"
              sx={{
                fontFamily: "inherit",
                fontWeight: 900,
                fontSize: "12.5pt",
                lineHeight: 1.55
              }}
            >
              وهـــذا للـــعـــلــم والــلــه الــمــوفــق،،،،،،
            </Typography>

<Box
  sx={{
    position: "absolute",
    left: 0,
    right: 0,

    // ارفع الجزء كله لفوق
    bottom: "8mm",

    height: "48mm",
    display: "flex",

    // يخلي كل بوكس في أقصى جهة
    justifyContent: "space-between",
    alignItems: "flex-end",

    // عكس ترتيب البوكسين عندك
    flexDirection: "row-reverse",

    // تقليل المسافات الجانبية عشان يوصلوا للأطراف
    px: "2mm"
  }}
>
  {/* التوقيع والختم */}
  <Box
    sx={{
      width: "100mm",
      height: "48mm",
      ml:"230px"
    }}
  >
    <Typography
      sx={{
        fontFamily: "inherit",
        fontWeight: 900,
        fontSize: "10.2pt",
        lineHeight: 1.4,
        textAlign: "center",
        whiteSpace: "nowrap",
        mb: 1
      }}
    >
      {model.managerName || "مدير المعهد السعودي"}{" "}
      {model.managerTitle || "المتخصص العالي للتدريب"}
    </Typography>

    {/* التوقيع */}
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4mm",
        height: "14mm",
        mb: "1mm"
      }}
    >
      <Typography
        component="strong"
        sx={{
          fontFamily: "inherit",
          fontWeight: 900,
          fontSize: "10.5pt",
          whiteSpace: "nowrap"
        }}
      >
        التوقيع:
      </Typography>

      <Box
        component="img"
        src="/signveno.png"
        alt="التوقيع"
        sx={{
          width: "43mm",
          height: "14mm",
          objectFit: "contain"
        }}
      />
    </Box>

    {/* الختم */}
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4mm",
        height: "25mm"
      }}
    >
      <Typography
        component="strong"
        sx={{
          fontFamily: "inherit",
          fontWeight: 900,
          fontSize: "10.5pt",
          whiteSpace: "nowrap"
        }}
      >
        الختم:
      </Typography>

      <Box
        component="img"
        src="/stampveno.jpeg"
        onError={(event) => {
          event.currentTarget.src = "/stampveno.png";
        }}
        alt="الختم"
        sx={{
          width: "46mm",
          height: "25mm",
          objectFit: "contain"
        }}
      />
    </Box>
  </Box>

  {/* موثوقية المشهد */}
  <Box
    sx={{
      width: "48mm",
      flexShrink: 0,
      textAlign: "center",
      mb:"30px",

      // يزقه لأقصى الجهة
      transform: "translateX(6mm)"
    }}
  >
    <QRCodeSVG
      value={verificationUrl}
      size={88}
      level="M"
    />

    <Typography
      component="div"
      sx={{
        mt: 0.5,
        fontFamily: "inherit",
        fontWeight: 900,
        fontSize: "10pt",
        textAlign: "center",
        whiteSpace: "nowrap"
      }}
    >
      موثوقية المشهد
    </Typography>
  </Box>
</Box>
          </Box>

          <Box
            component="img"
            src="/footerveno.png"
            alt="الفوتر"
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "210mm",
              height: "34mm",
              objectFit: "fill",
              zIndex: 1,
              display: "block"
            }}
          />
        </Box>
      );
    }
  );



const CoopTrainingPrint =
  React.forwardRef(
    ({ model }, ref) => {
      const verificationUrl =
        model.verificationUrl ||
        `${window.location.origin}/quality-forms/verify/${model.documentGuid}`;

      const coopEmail =
        model.email ||
        "Saudi_board@sstli.com";

      const coopPhone =
        model.coopPhone ||
        model.earnedHours ||
        "";

      const pageSx = {
        width: "210mm",
        height: "297mm",
        minHeight: "297mm",
        maxHeight: "297mm",
        margin: 0,
        background: "#fff",
        position: "relative",
        overflow: "hidden",
        direction: "ltr",
        color: "#111",
        fontFamily:
          "Cairo, Tahoma, Arial, sans-serif"
      };

      return (
        <Box
          ref={ref}
          className="print-document"
          sx={{
            width: "210mm",
            margin: 0,
            padding: 0,
            background: "#fff"
          }}
        >
          {/* الصفحة الأولى */}
          <Box
            className="print-page"
            sx={pageSx}
          >
            <Box
              component="img"
              src="/watermark-logo.png"
              alt=""
              sx={{
                position: "absolute",
                left: "50%",
                top: "151mm",
                transform:
                  "translate(-50%, -50%)",
                width: "126mm",
                height: "160mm",
                objectFit: "contain",
                opacity: 0.1,
                zIndex: 0,
                pointerEvents: "none"
              }}
            />

            <Box
              component="img"
              src="/headerveno.png"
              alt="الهيدر"
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "210mm",
                height: "43mm",
                objectFit: "fill",
                zIndex: 1
              }}
            />

            <Box
              sx={{
                position: "absolute",
                top: "29mm",
                right: "2mm",
                width: "54mm",
                zIndex: 3,
                direction: "ltr",
                textAlign: "left",
                fontSize: "9.4pt",
                fontWeight: 900,
                lineHeight: 1.55,
                whiteSpace: "nowrap"
              }}
            >
              <div>
                التاريخ: {model.hijriDate || "-"}
              </div>
              <div>
                صــــــادر رقــــــم / {model.documentNo || "-"}
              </div>
            </Box>

            <Box
              sx={{
                position: "absolute",
                top: "47mm",
                left: "19mm",
                right: "19mm",
                bottom: "35mm",
                zIndex: 2,
                fontSize: "10.35pt",
                fontWeight: 700,
                lineHeight: 1.75,
                direction: "rtl"
              }}
            >
              <Typography
                align="center"
                sx={{
                  fontFamily: "inherit",
                  fontWeight: 900,
                  fontSize: "15pt",
                  mb: 2.1
                }}
              >
                نموذج البحث عن فرصة تدريبية
              </Typography>

              <Typography
                sx={{
                  fontFamily: "inherit",
                  fontWeight: 900,
                  fontSize: "10.8pt",
                  textAlign: "left",
                  mb: 2.2
                }}
              >
                {model.toText || "سعادة /"}
              </Typography>

              <Typography
                sx={{
                  fontFamily: "inherit",
                  fontWeight: 800,
                  fontSize: "10.6pt",
                  textAlign: "left",
                  lineHeight: 1.9,
                  mb: 2.3
                }}
              >
                نفيد سعادتكم أن المتدرب / {model.studentName || "-"}
                {" "} هوية رقم / {model.nationalId || "-"}
              </Typography>

              <Typography
                sx={{
                  fontFamily: "inherit",
                  fontWeight: 800,
                  fontSize: "10.45pt",
                  textAlign: "justify",
                  textAlignLast: "left",
                  lineHeight: 1.95,
                  mb: 2.4
                }}
              >
                هو أحد متدربي المعهد المسجلين بدبلوم تخصص
                {" "}«{model.specialization || "-"}»
                {" "}ويرغب في إكمال متطلب التدريب التعاوني لديكم
                بدوام كامل دون أن يترتب على ذلك أي التزامات مالية على
                المنشأة، وذلك لاستكمال متطلبات التخرج
              </Typography>

              <Box
                sx={{
                  direction: "ltr"
                }}
              >
                <Typography sx={coopBulletSx}>
                  • فترة التدريب: {model.studySystem || "-"}
                </Typography>

                <Typography sx={coopBulletSx}>
                  • ساعات التدريب: {model.totalHours || "-"}
                </Typography>

                <Typography sx={coopBulletSx}>
                  • {model.studentStatus || "مستمر"}، مع الالتزام بساعات العمل الرسمية لديكم.
                </Typography>
              </Box>

             <Typography
  sx={{
    mt: "50px",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: "10.25pt",
    lineHeight: 1.9,
    direction: "ltr",
    textAlign: "justify",
    textAlignLast: "left"
  }}
>
  في حال الموافقة، نرجو من سعادتكم تزويدنا بالرد، ولأي استفسارات يمكنكم
  التواصل مع إدارة التدريب التعاوني عبر البريد الإلكتروني:{" "}
  <Box
    component="span"
    dir="ltr"
    sx={{
      display: "inline-block",
      direction: "ltr",
      unicodeBidi: "isolate",
      fontWeight: 900,
      whiteSpace: "nowrap"
    }}
  >
    {coopEmail}
  </Box>
</Typography>

              <Typography
                align="center"
                sx={{
                  mt: 5,
                  fontFamily: "inherit",
                  fontWeight: 900,
                  fontSize: "10.7pt",
                  direction:"ltr"
                }}
              >
                للاستفسار والتواصل مع مشرف التدريب التعاوني بالمعهد /      جوال رقم {coopPhone || "-"}
              </Typography>

              <Typography
                align="center"
                sx={{
                  mt: 1.4,
                  fontFamily: "inherit",
                  fontWeight: 900,
                  fontSize: "10.8pt"
                }}
              >
                وتفضلوا بقبول وافر التحية والتقدير
              </Typography>

              <Box
  sx={{
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "8mm",
    height: "48mm",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexDirection: "row-reverse",
    px: "2mm",
    direction: "ltr"
  }}
>
  {/* التوقيع والختم */}
  <Box
    sx={{
      width: "100mm",
      height: "48mm",
      ml: "230px"
    }}
  >
    {/* التوقيع */}
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4mm",
        height: "14mm",
        mb: "1mm"
      }}
    >
      <Typography
        component="strong"
        sx={{
          fontFamily: "inherit",
          fontWeight: 900,
          fontSize: "10.5pt",
          whiteSpace: "nowrap"
        }}
      >
        التوقيع:
      </Typography>

      <Box
        component="img"
        src="/signveno.png"
        alt="التوقيع"
        sx={{
          width: "43mm",
          height: "14mm",
          objectFit: "contain"
        }}
      />
    </Box>

    {/* الختم */}
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4mm",
        height: "25mm"
      }}
    >
      <Typography
        component="strong"
        sx={{
          fontFamily: "inherit",
          fontWeight: 900,
          fontSize: "10.5pt",
          whiteSpace: "nowrap"
        }}
      >
        الختم:
      </Typography>

      <Box
        component="img"
        src="/stampveno.jpeg"
        onError={(event) => {
          event.currentTarget.src =
            "/stampveno.png";
        }}
        alt="الختم"
        sx={{
          width: "46mm",
          height: "25mm",
          objectFit: "contain"
        }}
      />
    </Box>
  </Box>

  {/* موثوقية المشهد */}
  <Box
    sx={{
      width: "48mm",
      flexShrink: 0,
      textAlign: "center",
      mb: "30px",
      transform: "translateX(6mm)"
    }}
  >
    <QRCodeSVG
      value={verificationUrl}
      size={88}
      level="M"
    />

    <Typography
      component="div"
      sx={{
        mt: 0.5,
        fontFamily: "inherit",
        fontWeight: 900,
        fontSize: "10pt",
        textAlign: "center",
        whiteSpace: "nowrap"
      }}
    >
      موثوقية المشهد
    </Typography>
  </Box>
</Box>
            </Box>

            <Box
              component="img"
              src="/footerveno.png"
              alt="الفوتر"
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "210mm",
                height: "34mm",
                objectFit: "fill",
                zIndex: 1
              }}
            />
          </Box>

          {/* الصفحة الثانية */}
          <Box
            className="print-page"
            sx={pageSx}
          >
            <Box
              sx={{
                position: "absolute",
                top: "28mm",
                left: "25mm",
                right: "25mm",
                bottom: "25mm",
                fontSize: "10.7pt",
                fontWeight: 700,
                lineHeight: 1.9,
                direction: "ltr"
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  alignItems: "center",
                  mb: 5,
                  direction: "ltr"
                }}
              >
                <Typography
                  sx={{
                    ...coopPageTwoTitleSx,
                    textAlign: "left",
                    direction: "ltr"
                  }}
                >
                  المحترم
                </Typography>

                <Typography
                  sx={{
                    ...coopPageTwoTitleSx,
                    textAlign: "right",
                    direction: "ltr"
                  }}
                >
                  سعادة مشرف التدريب بالمعهد
                </Typography>
              </Box>

              <Typography
                align="center"
                sx={{
                  fontFamily: "inherit",
                  fontWeight: 900,
                  fontSize: "11pt",
                  mb: 4.5
                }}
              >
                السلام عليكم ورحمة الله وبركاته وبعد،
              </Typography>

              <Typography
                sx={{
                  fontFamily: "inherit",
                  fontWeight: 800,
                  fontSize: "10.6pt",
                  textAlign: "justify",
                  textAlignLast: "left",
                  lineHeight: 2,
                  mb: 4
                }}
              >
                إشارة إلى خطابكم أعلاه حول قبول المتدرب في برنامج التدريب
                التعاوني للفصل التدريبي، عليه نفيد سعادتكم
              </Typography>

              <Typography sx={coopPageTwoLineSx}>
                • بالموافقة على قبول المتدرب في برنامج التدريب التعاوني، عليه نفيد سعادتكم
              </Typography>

              <Typography sx={coopPageTwoLineSx}>
                • بالاعتذار عن قبول المتدرب في برنامج التدريب التعاوني
              </Typography>

              <Typography
                sx={{
                  ...coopPageTwoLineSx,
                  mt: 10
                }}
              >
                معلومات منشأة التدريب: اسم المنشأة التدريبية:
                .................................... عنوان المنشأة:
                ....................................
              </Typography>

              <Typography
                sx={{
                  ...coopPageTwoLineSx,
                  mt: 4.5
                }}
              >
                معلومات مشرف التدريب بالمنشأة:
              </Typography>

              <Box
                sx={{
                  mt: 5,
                  minHeight: "60mm",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gridTemplateRows: "24mm 24mm",
                  direction: "ltr",
                  alignItems: "start"
                }}
              >
                <Typography
                  sx={{
                    gridColumn: "1",
                    gridRow: "1",
                    fontFamily: "inherit",
                    fontWeight: 900,
                    fontSize: "10.8pt",
                    textAlign: "left",
                    direction: "ltr"
                  }}
                >
                  الختم:
                </Typography>

                <Typography
                  sx={{
                    gridColumn: "2",
                    gridRow: "1",
                    fontFamily: "inherit",
                    fontWeight: 900,
                    fontSize: "10.8pt",
                    textAlign: "left",
                    direction: "ltr"
                  }}
                >
                  اسم المسؤول:
                </Typography>

                <Typography
                  sx={{
                    gridColumn: "2",
                    gridRow: "2",
                    fontFamily: "inherit",
                    fontWeight: 900,
                    fontSize: "10.8pt",
                    textAlign: "left",
                    direction: "ltr"
                  }}
                >
                  التوقيع:
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      );
    }
  );

const coopBulletSx = {
  fontFamily: "inherit",
  fontWeight: 900,
  fontSize: "10.45pt",
  lineHeight: 1.9,
  mb: 1.1,
  textAlign: "left"
};

const coopSignLabelSx = {
  fontFamily: "inherit",
  fontWeight: 900,
  fontSize: "10.5pt",
  whiteSpace: "nowrap"
};

const coopPageTwoTitleSx = {
  fontFamily: "inherit",
  fontWeight: 900,
  fontSize: "11.4pt",
  direction: "ltr"
};

const coopPageTwoLineSx = {
  fontFamily: "inherit",
  fontWeight: 800,
  fontSize: "9.55pt",
  lineHeight: 2,
  textAlign: "left",
  direction: "ltr",
  mb: 3,
  mt:5,
};


const RegisteredLetterPrint =
  React.forwardRef(
    ({ model }, ref) => {
      const verificationUrl =
        model.verificationUrl ||
        `${window.location.origin}/quality-forms/verify/${model.documentGuid}`;

      const hoursNumber =
        String(model.totalHours || "")
          .replace(/[^\d]/g, "") ||
        "79";

      return (
        <Box
          ref={ref}
          className="print-sheet"
          sx={{
            width: "210mm",
            height: "297mm",
            minHeight: "297mm",
            maxHeight: "297mm",
            margin: 0,
            background: "#fff",
            position: "relative",
            overflow: "hidden",
            direction: "ltr",
            color: "#111",
            fontFamily:
              "Cairo, Tahoma, Arial, sans-serif"
          }}
        >
          <Box
            component="img"
            src="/watermark-logo.png"
            alt=""
            sx={{
              position: "absolute",
              left: "50%",
              top: "150mm",
              transform: "translate(-50%, -50%)",
              width: "126mm",
              height: "160mm",
              objectFit: "contain",
              opacity: 0.11,
              zIndex: 0,
              pointerEvents: "none"
            }}
          />

          <Box
            component="img"
            src="/headerveno.png"
            alt="الهيدر"
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "210mm",
              height: "43mm",
              objectFit: "fill",
              zIndex: 1,
              display: "block"
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: "29mm",
              right: "2mm",
              width: "54mm",
              zIndex: 3,
              direction: "ltr",
              textAlign: "left",
              fontSize: "9.5pt",
              fontWeight: 900,
              lineHeight: 1.55,
              whiteSpace: "nowrap"
            }}
          >
            <div>
              التاريخ: {model.hijriDate || "-"}
            </div>
            <div>
              صــــــادر رقــــــم / {model.documentNo || "-"}
            </div>
          </Box>

          <Box
            sx={{
              position: "absolute",
              top: "54mm",
              left: "17mm",
              right: "17mm",
              bottom: "38mm",
              zIndex: 2,
              fontSize: "10.35pt",
              fontWeight: 700,
              lineHeight: 1.85,
              direction: "ltr"
            }}
          >
            <Typography
              align="center"
              sx={{
                fontFamily: "inherit",
                fontWeight: 900,
                fontSize: "12.6pt"
              }}
            >
              {model.toText || "إلى من يهمه الأمر"}
            </Typography>

            <Box
              sx={{
                mt: 2.2,
                display: "grid",
                gridTemplateColumns:
                  "1.15fr 1fr 1.35fr",
                border: "1.2px solid #222",
                borderBottom: 0,
                textAlign: "center",
                fontWeight: 900,
                fontSize: "10.5pt"
              }}
            >
              <Box sx={{ p: 0.8, borderRight: "1.2px solid #222" }}>
                الاسم
              </Box>
              <Box sx={{ p: 0.8, borderRight: "1.2px solid #222" }}>
                رقم السجل المدني
              </Box>
              <Box sx={{ p: 0.8 }}>
                الدبلوم
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "1.15fr 1fr 1.35fr",
                border: "1.2px solid #222",
                textAlign: "center",
                fontWeight: 800,
                fontSize: "10.4pt"
              }}
            >
              <Box sx={{ p: 1, borderRight: "1.2px solid #222" }}>
                {model.studentName || "-"}
              </Box>
              <Box sx={{ p: 1, borderRight: "1.2px solid #222" }}>
                {model.nationalId || "-"}
              </Box>
              <Box sx={{ p: 1 }}>
                {model.specialization || "-"}
              </Box>
            </Box>

            <Typography
              align="center"
              sx={{
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: "11pt",
                mt: 2.4
              }}
            >
              السلام عليكم ورحمة الله وبركاته
            </Typography>

            <Typography
              align="center"
              sx={{
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: "11pt",
                mt: 0.7
              }}
            >
              تحية طيبة وبعد ،،،
            </Typography>

            <Divider sx={{ my: 1.5, borderColor: "#333" }} />

<Box
  sx={{
    mx: "auto",
    width: "100%",
    maxWidth: "172mm",
    px: "6mm",
    py: "3mm",
    borderTop: "1px solid #333",
    borderBottom: "1px solid #333",
    direction: "rtl"
  }}
>
  <Typography
    component="div"
    dir="rtl"
    sx={{
      fontFamily: "inherit",
      fontWeight: 800,
      fontSize: "11.2pt",
      lineHeight: 2,
      textAlign: "justify",
      textAlignLast: "center",
      direction: "rtl",
      unicodeBidi: "plaintext",
      whiteSpace: "normal"
    }}
  >
    نفيد سعادتكم بأن الموضح بياناته أعلاه مسجل لدينا في{" "}

    <strong>
      {model.specialization || "الدبلوم"}
    </strong>

    ، والدبلوم معتمد من المؤسسة العامة للتدريب التقني والمهني بعدد ساعات{" "}

    <strong>
      {model.totalHours || "-"}
    </strong>

    ، والدراسة بالفترة{" "}

    <strong>
      {model.studyPeriod === "صباحية"
        ? "الصباحية"
        : "المسائية"}
    </strong>

    {" "}ولا تتعارض مع أوقات العمل الرسمية، وتاريخ بداية الدراسة{" "}

    <Box
      component="span"
      sx={{
        display: "inline-flex",
        direction: "ltr",
        unicodeBidi: "isolate",
        alignItems: "center",
        gap: "4px",
        fontWeight: 900,
        whiteSpace: "nowrap"
      }}
    >
      <span>{model.studyStartDate || "-"}</span>
      <span>هـ</span>
    </Box>
  </Typography>
</Box>

            <Divider sx={{ my: 1.5, borderColor: "#333" }} />

            <Typography
              align="center"
              sx={{
                fontFamily: "inherit",
                fontWeight: 900,
                fontSize: "12.2pt"
              }}
            >
              وهذا للــعـــلــم والــلــه الـــمـــوفــــق،،،،،،
            </Typography>

            <Box
              sx={{
                position: "absolute",
                left: 0,
                mb:"60px",
                right: 0,
                bottom: "8mm",
                height: "48mm",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexDirection: "row-reverse",
                px: "2mm",
                direction: "ltr"
              }}
            >
              <Box
                sx={{
                  width: "100mm",
                  height: "48mm",
                  ml: "230px"
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "inherit",
                    fontWeight: 900,
                    fontSize: "10.2pt",
                    lineHeight: 1.4,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    mb: 1
                  }}
                >
                  {model.managerName || "مدير المعهد السعودي"}{" "}
                  {model.managerTitle || "المتخصص العالي للتدريب"}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4mm",
                    height: "14mm",
                    mb: "1mm"
                  }}
                >
                  <Typography
                    component="strong"
                    sx={{
                      fontFamily: "inherit",
                      fontWeight: 900,
                      fontSize: "10.5pt",
                      whiteSpace: "nowrap"
                    }}
                  >
                    التوقيع:
                  </Typography>

                  <Box
                    component="img"
                    src="/signveno.png"
                    alt="التوقيع"
                    sx={{
                      width: "43mm",
                      height: "14mm",
                      objectFit: "contain"
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4mm",
                    height: "25mm"
                  }}
                >
                  <Typography
                    component="strong"
                    sx={{
                      fontFamily: "inherit",
                      fontWeight: 900,
                      fontSize: "10.5pt",
                      whiteSpace: "nowrap"
                    }}
                  >
                    الختم:
                  </Typography>

                  <Box
                    component="img"
                    src="/stampveno.jpeg"
                    onError={(event) => {
                      event.currentTarget.src =
                        "/stampveno.png";
                    }}
                    alt="الختم"
                    sx={{
                      width: "46mm",
                      height: "25mm",
                      objectFit: "contain"
                    }}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  width: "48mm",
                  flexShrink: 0,
                  textAlign: "center",
                  mb: "30px",
                  transform: "translateX(6mm)"
                }}
              >
                <QRCodeSVG
                  value={verificationUrl}
                  size={88}
                  level="M"
                />

                <Typography
                  component="div"
                  sx={{
                    mt: 0.5,
                    fontFamily: "inherit",
                    fontWeight: 900,
                    fontSize: "10pt",
                    textAlign: "center",
                    whiteSpace: "nowrap"
                  }}
                >
                  موثوقية المشهد
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            component="img"
            src="/footerveno.png"
            alt="الفوتر"
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "210mm",
              height: "34mm",
              objectFit: "fill",
              zIndex: 1,
              display: "block"
            }}
          />
        </Box>
      );
    }
  );

const PrintPair = ({
  title,
  value
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns:
        "1fr 1fr",
      minHeight: "8.8mm",
      alignItems: "center",
      direction: "ltr",
      fontSize: "10.25pt"
    }}
  >
    <strong
      style={{
        textAlign: "right"
      }}
    >
      {title}
    </strong>

    <span
      style={{
        textAlign: "center",
        fontWeight: 800
      }}
    >
      {value || "-"}
    </span>
  </Box>
);



const StudentLookupFields = ({
  form,
  update,
  loadStudent,
  loadingStudent,
  hideDiploma = false
}) => (
  <>
    <TextField
      label="رقم السجل المدني"
      value={form.nationalId}
      onChange={update("nationalId")}
      inputProps={{
        maxLength: 10,
        inputMode: "numeric"
      }}
      sx={fieldSx}
      InputProps={{
        endAdornment: loadingStudent ? (
          <CircularProgress size={20} />
        ) : (
          <Button
            onClick={() => loadStudent()}
            startIcon={<SearchIcon />}
          >
            تحميل
          </Button>
        )
      }}
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
  courseName: "",
  timeOne: "",
  courseTwo: "",
  timeTwo: ""
});

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

        <TextField
          label="إلى"
          value={form.toText}
          onChange={update("toText")}
          sx={fieldSx}
        />
      </Section>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3
        }}
      >
        <Typography
          sx={{
            fontFamily: "Cairo",
            color: "#057546",
            fontWeight: 900,
            mb: 1
          }}
        >
          نص الخطاب
        </Typography>

        <TextField
          fullWidth
          multiline
          minRows={2}
          value={form.statementText}
          onChange={update("statementText")}
          sx={fieldSx}
        />
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          overflowX: "auto"
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
            sx={{
              minWidth: 155,
              fontFamily: "Cairo",
              background:
                "linear-gradient(135deg,#057546,#034d31)"
            }}
          >
            إضافة يوم
          </Button>
        </Stack>

        <Box
          sx={{
            minWidth: 980,
            display: "grid",
            gridTemplateColumns:
              "46px 1.35fr 1fr .8fr 1fr .8fr",
            gap: 1,
            direction: "ltr",
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
                title="حذف اليوم"
                aria-label={`حذف اليوم ${
                  index + 1
                }`}
                sx={{
                  minWidth: 42,
                  width: 42,
                  height: 42,
                  p: 0
                }}
              >
                <DeleteOutlineIcon />
              </Button>

              <TextField
                value={row.dayDate || ""}
                placeholder={
                  EXAM_ROW_PLACEHOLDERS.dayDate
                }
                onChange={(event) =>
                  changeRow(
                    index,
                    "dayDate",
                    event.target.value
                  )
                }
                sx={fieldSx}
                inputProps={{
                  "aria-label":
                    "اليوم والتاريخ"
                }}
              />

              <TextField
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
                sx={fieldSx}
                inputProps={{
                  "aria-label":
                    "المقرر الأول"
                }}
              />

              <TextField
                value={row.timeOne || ""}
                placeholder={
                  EXAM_ROW_PLACEHOLDERS.timeOne
                }
                onChange={(event) =>
                  changeRow(
                    index,
                    "timeOne",
                    event.target.value
                  )
                }
                sx={fieldSx}
                inputProps={{
                  "aria-label":
                    "التوقيت الأول"
                }}
              />

              <TextField
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
                sx={fieldSx}
                inputProps={{
                  "aria-label":
                    "المقرر الثاني"
                }}
              />

              <TextField
                value={row.timeTwo || ""}
                placeholder={
                  EXAM_ROW_PLACEHOLDERS.timeTwo
                }
                onChange={(event) =>
                  changeRow(
                    index,
                    "timeTwo",
                    event.target.value
                  )
                }
                sx={fieldSx}
                inputProps={{
                  "aria-label":
                    "التوقيت الثاني"
                }}
              />
            </React.Fragment>
          ))}
        </Box>
      </Paper>
    </>
  );
};

const AbsenceWarningEditor = ({ form, update, loadStudent, loadingStudent }) => <>
  <Section title="البيانات الأساسية">
    <StudentLookupFields form={form} update={update} loadStudent={loadStudent} loadingStudent={loadingStudent} />
    <TextField label="الفصل التدريبي" value={form.termName} onChange={update("termName")} sx={fieldSx}/>
    <TextField label="رقم الجلسة" value={form.sessionNo} onChange={update("sessionNo")} sx={fieldSx}/>
    <TextField label="تاريخ اللائحة" value={form.sessionHijriDate} onChange={update("sessionHijriDate")} sx={fieldSx}/>
    <TextField label="رقم المادة" value={form.articleNo} onChange={update("articleNo")} sx={fieldSx}/>
    <TextField label="رقم الإنذار" value={form.warningNo} onChange={update("warningNo")} sx={fieldSx}/>
  </Section>
  <Section title="إعدادات الإنذار">
    <TextField label="نسبة الإنذار" value={form.absencePercent} onChange={update("absencePercent")} sx={fieldSx}/>
    <TextField label="نسبة الحرمان النهائية" value={form.denialPercent} onChange={update("denialPercent")} sx={fieldSx}/>
  </Section>
  <Paper variant="outlined" sx={{p:2,mb:2,borderRadius:3}}>
    <Typography sx={{fontFamily:"Cairo",color:"#057546",fontWeight:900,mb:1}}>المقررات</Typography>
    <TextField fullWidth multiline minRows={3} placeholder="مثال: الرياضيات، اللغة الإنجليزية، تطبيقات الحاسب" value={form.courses} onChange={update("courses")} sx={fieldSx}/>
  </Paper>
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

      <TextField
        label="رقم الجلسة"
        value={form.sessionNo}
        onChange={update("sessionNo")}
        sx={fieldSx}
      />

      <TextField
        label="تاريخ اللائحة"
        value={form.sessionHijriDate}
        onChange={update("sessionHijriDate")}
        sx={fieldSx}
      />

      <TextField
        label="رقم المادة"
        value={form.articleNo}
        onChange={update("articleNo")}
        sx={fieldSx}
      />

      <TextField
        label="رقم الإنذار"
        value={form.warningNo}
        onChange={update("warningNo")}
        sx={fieldSx}
      />
    </Section>

    <Section title="إعدادات انخفاض المعدل">
      <TextField
        label="المعدل أقل من"
        value={form.gradeValue}
        onChange={update("gradeValue")}
        placeholder="مثال: 2.00"
        sx={fieldSx}
      />

      <TextField
        label="من"
        value={form.gradeMax}
        onChange={update("gradeMax")}
        placeholder="مثال: 5.00"
        sx={fieldSx}
      />

      <TextField
        label="الفترة التدريبية"
        value={form.periodHijriText}
        onChange={update("periodHijriText")}
        placeholder="مثال: الفصل التدريبي الأول لعام 1448هـ"
        sx={fieldSx}
      />
    </Section>

    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 3
      }}
    >
      <Typography
        sx={{
          fontFamily: "Cairo",
          color: "#057546",
          fontWeight: 900,
          mb: 1
        }}
      >
        سبب انخفاض المعدل
      </Typography>

      <TextField
        fullWidth
        multiline
        minRows={3}
        value={form.reasonText}
        onChange={update("reasonText")}
        placeholder="مثال: نظراً لحرمانك / غيابك عن أداء الاختبارات"
        sx={fieldSx}
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
      <TextField
        label="قيمة المستحقات المالية"
        value={form.financialAmount}
        onChange={update("financialAmount")}
        placeholder="مثال: 2500"
        inputProps={{
          inputMode: "decimal"
        }}
        sx={fieldSx}
      />

      {isSecond && (
        <TextField
          label="تاريخ الإنذار المالي الأول"
          value={form.firstWarningDate}
          onChange={update("firstWarningDate")}
          placeholder="مثال: 1448/02/18 هـ"
          sx={fieldSx}
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
          <TextField
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
            sx={fieldSx}
          />
        )}

        {isRejected && (
          <>
            <TextField
              label="دورة / دبلوم الموافقة"
              value={form.letterApprovedProgramName}
              onChange={update("letterApprovedProgramName")}
              placeholder="اكتب البرنامج الوارد بخطاب الموافقة"
              sx={fieldSx}
            />

            <TextField
              label="تاريخ بداية الموافقة"
              value={form.letterStartDate}
              onChange={update("letterStartDate")}
              placeholder="مثال: 1448/02/18 هـ"
              sx={fieldSx}
            />
          </>
        )}

        {isDropped && (
          <TextField
            label="تاريخ طي القيد"
            value={form.letterRegisterDate}
            onChange={update("letterRegisterDate")}
            placeholder="مثال: 1448/02/18 هـ"
            sx={fieldSx}
          />
        )}

        {isCourseWaiting && (
          <>
            <TextField
              label="تاريخ بداية الدراسة"
              value={form.letterStartDate}
              onChange={update("letterStartDate")}
              placeholder="مثال: 1448/02/18 هـ"
              sx={fieldSx}
            />

            <TextField
              label="تاريخ نهاية الدراسة"
              value={form.letterEndDate}
              onChange={update("letterEndDate")}
              placeholder="مثال: 1448/05/18 هـ"
              sx={fieldSx}
            />

            <TextField
              label="عدد ساعات الدورة"
              value={form.letterStudyHours}
              onChange={update("letterStudyHours")}
              placeholder="مثال: 180"
              inputProps={{
                inputMode: "numeric"
              }}
              sx={fieldSx}
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
            direction: "rtl"
          }}
        >
          <Typography
            sx={{
              fontFamily: "Cairo",
              color: "#057546",
              fontWeight: 900,
              mb: 1
            }}
          >
            أسباب تعذر التسجيل
          </Typography>

          <Stack spacing={1}>
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
                  fontWeight: 800
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
                  fontWeight: 800
                }
              }}
            />
          </Stack>
        </Paper>
      )}
    </>
  );
};

const SheetFrame = React.forwardRef(({children}, ref) => <Box ref={ref} className="print-sheet" sx={{width:"210mm",height:"297mm",position:"relative",background:"#fff",direction:"ltr",fontFamily:"Cairo, Tahoma, Arial",overflow:"hidden",p:"12mm 16mm 15mm"}}>{children}</Box>);

const PrintHeader = ({model,title}) => <>
  <Box component="img" src="/headerveno.png" sx={{width:"100%",height:"34mm",objectFit:"fill"}}/>
  <Typography align="right" sx={{fontSize:"9pt",fontWeight:800,mt:"-14mm",direction:"ltr",mr:"40px"}}>التاريخ: {model.hijriDate}</Typography>
  <Typography align="right" sx={{fontSize:"9pt",fontWeight:800,mr:"60px"}}>صادر رقم / {model.documentNo}</Typography>
  <Typography align="center" sx={{fontSize:"16pt",fontWeight:900,mt:"13mm"}}>{title}</Typography>
</>;

const PrintFooter = () => <Box component="img" src="/footerveno.png" sx={{position:"absolute",bottom:"5mm",left:"12mm",right:"12mm",width:"calc(100% - 24mm)",height:"22mm",objectFit:"fill"}}/>;

const ExamSchedulePrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      String(model.documentGuid || "");

    return (
      <Box
        ref={ref}
        className="print-sheet"
        sx={{
          width: "210mm",
          height: "297mm",
          minHeight: "297mm",
          maxHeight: "297mm",
          position: "relative",
          overflow: "hidden",
          background: "#fff",
          direction: "ltr",
          fontFamily:
            "Cairo, Tahoma, Arial, sans-serif",

          // هامش داخلي أعلى وأسفل خاص بصفحة جدول الاختبارات فقط
          pt: "14mm",
          px: "16mm",
          pb: "38mm",
          boxSizing: "border-box"
        }}
      >
        <PrintHeader
          model={model}
          title={
            model.toText ||
            "إلى من يهمه الأمر"
          }
        />

        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            mt: "8mm",
            "& td": {
              border: "1px solid #111",
              p: "2mm",
              fontSize: "8.5pt",
              fontWeight: 800
            }
          }}
        >
          <tbody>
            <tr>
              <td>
                جدول اختبارات دبلوم:{" "}
                {model.specialization}
              </td>
              <td>
                المستوى: {model.levelName}
              </td>
            </tr>

            <tr>
              <td>
                اسم المتدرب:{" "}
                {model.studentName}
              </td>
              <td>
                هوية رقم: {model.nationalId}
              </td>
            </tr>
          </tbody>
        </Box>

        <Typography
          sx={{
            fontSize: "9pt",
            fontWeight: 800,
            mt: "6mm",
            mb: "5mm"
          }}
        >
          {model.statementText}
        </Typography>

        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            "& th, & td": {
              border: "1px solid #111",
              p: "2mm",
              textAlign: "center",
              fontSize: "8pt",
              fontWeight: 800
            },
            "& th": {
              background: "#e5e5e5"
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
            {(model.examRows || [])
              .slice(0, 4)
              .map((row, index) => (
                <tr
                  key={index}
                  style={{
                    height: "14mm"
                  }}
                >
                  <td>{row.dayDate}</td>
                  <td>{row.courseName}</td>
                  <td>{row.timeOne}</td>
                  <td>{row.courseTwo}</td>
                  <td>{row.timeTwo}</td>
                </tr>
              ))}
          </tbody>
        </Box>

        <Typography
          align="center"
          sx={{
            fontSize: "9pt",
            fontWeight: 800,
            mt: "13mm"
          }}
        >
          وتفضلوا بقبول وافر التحية،،،
        </Typography>

        {/* الجزء السفلي الخاص بجدول الاختبارات فقط */}
        <Box
          sx={{
            position: "absolute",
            left: "18mm",
            right: "18mm",

            // تنزيل الجزء قليلًا مع تركه أعلى الفوتر
            bottom: "60mm",

            minHeight: "49mm",
            display: "grid",
            gridTemplateColumns:
              "64mm 1fr",
            columnGap: "18mm",
            alignItems: "end",
            direction: "ltr"
          }}
        >
          {/* موثوقية الجدول */}
          <Box
            sx={{
              width: "50mm",
              textAlign: "center",
              justifySelf: "start"
            }}
          >
            <Typography
              sx={{
                fontSize: "9.5pt",
                fontWeight: 900,
                mb: "2mm",
                textAlign: "center"
              }}
            >
              مشرف التدريب
            </Typography>

            <QRCodeSVG
              value={verificationUrl}
              size={88}
              level="M"
            />

            <Typography
              sx={{
                mt: "1mm",
                fontSize: "8.8pt",
                fontWeight: 900,
                textAlign: "center",
                whiteSpace: "nowrap"
              }}
            >
              موثوقية الجدول
            </Typography>
          </Box>

          {/* التوقيع والختم */}
          <Box
            sx={{
              width: "105mm",
              justifySelf: "end",
              direction: "ltr"
            }}
          >
            <Typography
              sx={{
                fontSize: "9.5pt",
                fontWeight: 900,
                textAlign: "center",
                mb: "2.5mm",
                whiteSpace: "nowrap"
              }}
            >
              المعهد السعودي المتخصص العالي للتدريب
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "20mm 1fr",
                alignItems: "center",
                minHeight: "14mm",
                mb: "1.5mm"
              }}
            >
              <Typography
                sx={{
                  fontSize: "9.5pt",
                  fontWeight: 900,
                  textAlign: "right",
                  mr:"-45px",
                  whiteSpace: "nowrap"
                }}
              >
                التوقيع:
              </Typography>

              <Box
                component="img"
                src="/signveno.png"
                alt="التوقيع"
                sx={{
                  width: "42mm",
                  height: "13mm",
                  objectFit: "contain",
                  justifySelf: "center"
                }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "20mm 1fr",
                alignItems: "center",
                minHeight: "28mm"
              }}
            >
              <Typography
                sx={{
                  fontSize: "9.5pt",
                  fontWeight: 900,
                   mr:"-30px",
                   mt:"-40px",
                  textAlign: "right",
                  whiteSpace: "nowrap"
                }}
              >
                الختم:
              </Typography>

              <Box
                component="img"
                src="/stampveno.jpeg"
                onError={(event) => {
                  event.currentTarget.src =
                    "/stampveno.png";
                }}
                alt="الختم"
                sx={{
                  width: "48mm",
                  height: "28mm",
                  objectFit: "contain",
                  justifySelf: "center"
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* فوتر أكبر مع مسافة سفلية مرتبة */}
        <Box
          component="img"
          src="/footerveno.png"
          alt="الفوتر"
          sx={{
            position: "absolute",
            bottom: "4mm",
            left: "8mm",
            right: "8mm",
            width: "calc(100% - 16mm)",
            height: "29mm",
            objectFit: "fill",
            display: "block"
          }}
        />
      </Box>
    );
  }
);

const GeneralLetterPrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      String(model.documentGuid || "");

    const formCode =
      model.formCode || "";

    const isRejected =
      formCode === "REGISTRATION_REJECTED";

    const isDropped =
      formCode === "DROPPED_STATEMENT";

    const isCourseWaiting =
      formCode === "COURSE_STUDIED_WAITING_EXAM";

    const isNotRegistered =
      formCode === "NOT_REGISTERED_LETTER";

    const programTitle =
      isCourseWaiting
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

    return (
      <Box
        ref={ref}
        className="print-sheet"
        sx={{
          width: "210mm",
          height: "297mm",
          minHeight: "297mm",
          maxHeight: "297mm",
          position: "relative",
          overflow: "hidden",
          background: "#fff",
          direction: "ltr",
          fontFamily:
            "Cairo, Tahoma, Arial, sans-serif",
          pt: "14mm",
          px: "16mm",
          pb: "38mm",
          boxSizing: "border-box"
        }}
      >
        <PrintHeader
          model={model}
          title="إلى من يهمه الأمر"
        />

        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            mt: "8mm",
            direction: "rtl",
            "& th, & td": {
              border: "1px solid #111",
              p: "3mm",
              fontSize: "9pt",
              fontWeight: 800,
              textAlign: "center"
            }
          }}
        >
          <tbody>
            <tr>
              {!isDropped && (
                <th>{programTitle}</th>
              )}
              <th>رقم السجل المدني</th>
              <th>الاسم</th>
            </tr>

            <tr>
              {!isDropped && (
                <td>
                  {isRejected || isDropped
                    ? model.specialization
                    : model.letterProgramName}
                </td>
              )}
              <td>{model.nationalId}</td>
              <td>{model.studentName}</td>
            </tr>
          </tbody>
        </Box>

        <Typography
          align="center"
          sx={{
            fontSize: "10pt",
            fontWeight: 900,
            mt: "6mm",
            lineHeight: 2
          }}
        >
          السلام عليكم ورحمة الله وبركاته
          <br />
          تحية طيبة وبعد ،،،
        </Typography>

        <Divider
          sx={{
            my: "4mm",
            borderColor: "#111"
          }}
        />

        <Typography
          sx={{
            fontSize: "9.5pt",
            fontWeight: 800,
            lineHeight: 2.35,
            textAlign: "justify",
            direction: "ltr"
          }}
        >
          {mainText}
        </Typography>

        {isRejected && (
          <Box
            sx={{
              mt: "4mm",
              direction: "ltr"
            }}
          >
            {model.letterReasonFees && (
              <Typography
                sx={{
                  fontSize: "9.3pt",
                  fontWeight: 800,
                  lineHeight: 2
                }}
              >
                □ وذلك لعدم استكمال المتدرب إجراءات التسجيل وسداد الرسوم الدراسية.
              </Typography>
            )}

            {model.letterReasonCapacity && (
              <Typography
                sx={{
                  fontSize: "9.3pt",
                  fontWeight: 800,
                  lineHeight: 2
                }}
              >
                □ وذلك لاكتمال أعداد المتدربين وزيادة الطاقة الاستيعابية بالمعهد.
              </Typography>
            )}

            {!model.letterReasonFees &&
              !model.letterReasonCapacity && (
              <Typography
                sx={{
                  fontSize: "9.3pt",
                  fontWeight: 800,
                  lineHeight: 2
                }}
              >
                □ وذلك حسب أنظمة القبول والتسجيل المعمول بها.
              </Typography>
            )}
          </Box>
        )}

        <Divider
          sx={{
            my: "5mm",
            borderColor: "#111"
          }}
        />

        <Typography
          align="center"
          sx={{
            fontSize: "9pt",
            fontWeight: 800
          }}
        >
          وقد أعطي هذا المشهد بناءً على طلبه دون أدنى مسؤولية على المعهد.
        </Typography>

        {/* نفس الاستايل والاتجاهات الحالية بدون تعديل */}
        <Box
          sx={{
            position: "absolute",
            left: "18mm",
            right: "18mm",
            bottom: "40mm",
            minHeight: "49mm",
            display: "grid",
            gridTemplateColumns:
              "64mm 1fr",
            columnGap: "18mm",
            alignItems: "end",
            direction: "ltr"
          }}
        >
          <Box
            sx={{
              width: "50mm",
              textAlign: "center",
              justifySelf: "start",
              position: "relative",
              top: "-15mm"
            }}
          >
            <Typography
              sx={{
                fontSize: "9.5pt",
                fontWeight: 900,
                mb: "2mm",
                textAlign: "center"
              }}
            >
              مشرف التدريب
            </Typography>

            <QRCodeSVG
              value={verificationUrl}
              size={88}
              level="M"
            />

            <Typography
              sx={{
                mt: "1mm",
                fontSize: "8.8pt",
                fontWeight: 900,
                textAlign: "center",
                whiteSpace: "nowrap"
              }}
            >
              موثوقية الخطاب
            </Typography>
          </Box>

          <Box
            sx={{
              width: "105mm",
              justifySelf: "end",
              direction: "ltr"
            }}
          >
            <Typography
              sx={{
                fontSize: "9.5pt",
                fontWeight: 900,
                textAlign: "center",
                mb: "2.5mm",
                whiteSpace: "nowrap"
              }}
            >
              المعهد السعودي المتخصص العالي للتدريب
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "20mm 1fr",
                alignItems: "center",
                minHeight: "16mm",
                mb: "1.5mm"
              }}
            >
              <Typography
                sx={{
                  fontSize: "9.5pt",
                  fontWeight: 900,
                  textAlign: "right",
                  mr: "-45px",
                  whiteSpace: "nowrap"
                }}
              >
                التوقيع:
              </Typography>

              <Box
                component="img"
                src="/signveno.png"
                alt="التوقيع"
                sx={{
                  width: "50mm",
                  height: "16mm",
                  objectFit: "contain",
                  justifySelf: "center"
                }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "20mm 1fr",
                alignItems: "center",
                minHeight: "28mm"
              }}
            >
              <Typography
                sx={{
                  fontSize: "9.5pt",
                  fontWeight: 900,
                  mr: "-30px",
                  mt: "-40px",
                  textAlign: "right",
                  whiteSpace: "nowrap"
                }}
              >
                الختم:
              </Typography>

              <Box
                component="img"
                src="/stampveno.jpeg"
                onError={(event) => {
                  event.currentTarget.src =
                    "/stampveno.png";
                }}
                alt="الختم"
                sx={{
                  width: "48mm",
                  height: "28mm",
                  objectFit: "contain",
                  justifySelf: "center"
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box
          component="img"
          src="/footerveno.png"
          alt="الفوتر"
          sx={{
            position: "absolute",
            bottom: "4mm",
            left: "8mm",
            right: "8mm",
            width: "calc(100% - 16mm)",
            height: "29mm",
            objectFit: "fill",
            display: "block"
          }}
        />
      </Box>
    );
  }
);

const FinancialWarningPrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      String(model.documentGuid || "");

    const isSecond =
      model.formCode === "FINANCIAL_WARNING_2";

    const title = isSecond
      ? "الإنذار المالي رقم (2) الأخير"
      : "إنذار مالي رقم (1)";

    return (
      <Box
        ref={ref}
        className="print-sheet"
        sx={{
          width: "210mm",
          height: "297mm",
          minHeight: "297mm",
          maxHeight: "297mm",
          position: "relative",
          overflow: "hidden",
          background: "#fff",
          direction: "ltr",
          fontFamily:
            "Cairo, Tahoma, Arial, sans-serif",
          pt: "14mm",
          px: "16mm",
          pb: "38mm",
          boxSizing: "border-box"
        }}
      >
        <PrintHeader
          model={model}
          title={title}
        />

        <Typography
          sx={{
            mt: "11mm",
            fontSize: "10pt",
            fontWeight: 800,
            textAlign: "center",
            direction: "ltr"
          }}
        >
          السلام عليكم ورحمة الله وبركاته.
        </Typography>

        <Box
          sx={{
            mt: "8mm",
            direction: "ltr",
            display: "grid",
            rowGap: "5mm"
          }}
        >
          <Typography
            sx={{
              fontSize: "10pt",
              fontWeight: 800,
              borderBottom:
                "1px dotted #111",
              pb: "1.5mm"
            }}
          >
            السيد / {model.studentName || "........................"}
          </Typography>

          <Typography
            sx={{
              fontSize: "10pt",
              fontWeight: 800,
              borderBottom:
                "1px dotted #111",
              pb: "1.5mm"
            }}
          >
            هوية رقم / {model.nationalId || "........................"}
          </Typography>

          <Typography
            sx={{
              fontSize: "10pt",
              fontWeight: 800,
              borderBottom:
                "1px dotted #111",
              pb: "1.5mm"
            }}
          >
            المسجل بدبلوم /{" "}
            {model.specialization || "........................"}
          </Typography>

          {isSecond && (
            <Typography
              sx={{
                fontSize: "10pt",
                fontWeight: 800,
                borderBottom:
                  "1px dotted #111",
                pb: "1.5mm"
              }}
            >
              بناءً على الإنذار الأول والمرسل بتاريخ:{" "}
              {model.firstWarningDate || "/      /      هـ"}
            </Typography>
          )}
        </Box>

        <Typography
          sx={{
            mt: "8mm",
            fontSize: "9.6pt",
            fontWeight: 800,
            lineHeight: 3.3,
            textAlign: "justify",
            direction: "ltr"
          }}
        >
          {isSecond ? (
            <>
              ونظراً لتوقفكم عن سداد مستحقات مالية متأخرة عليكم بقيمة{" "}
              {model.financialAmount || "0"} ريال سعودي، ورغم تواصل
              المعهد المستمر وإرسال الإنذار الأول والتنبيه بوجوب البدء
              في خطة جدولة المديونية، ورغم التسهيلات المقدمة من المعهد
              إلا أن انقطاعكم عن البدء في خطة السداد وعدم الالتزام تجاه
              حقوق المعهد المالية، نعلمكم أنه في حال عدم الاستجابة
              للإنذار الثاني خلال 15 يومًا فإن المعهد سيتخذ الإجراء
              النهائي وإيقاف خدماتكم التدريبية مع الاستمرار بالمطالبة
              بالمستحقات عبر الطرق القانونية التي يوفرها النظام. نرجو
              الاستجابة والالتزام ولكم منا التقدير.
            </>
          ) : (
            <>
              نظراً لانقطاعكم عن التواصل مع المعهد وعدم الوفاء
              بالتزاماتكم ووجود مستحقات مالية متأخرة بقيمة{" "}
              {model.financialAmount || "0"} ريال سعودي، ورغم تواصل
              المعهد معكم أكثر من مرة دون جدوى، نعلمكم أنه في حالة عدم
              البدء في جدولة وسداد هذه المستحقات في موعد أقصاه 15 يومًا
              من تاريخ الإنذار الأول سيتم استكمال الإجراءات القانونية.
              نأمل سرعة الاستجابة ولكم كل التقدير.
            </>
          )}
        </Typography>

        {/* نفس مكان واستايل الجزء السفلي الحالي */}
        <Box
          sx={{
            position: "absolute",
            left: "18mm",
            right: "18mm",
            bottom: "40mm",
            minHeight: "49mm",
            display: "grid",
            gridTemplateColumns:
              "64mm 1fr",
            columnGap: "18mm",
            alignItems: "end",
            direction: "ltr"
          }}
        >
          <Box
            sx={{
              width: "50mm",
              textAlign: "center",
              justifySelf: "start",
              position: "relative",
              top: "-15mm"
            }}
          >
            <Typography
              sx={{
                fontSize: "9.5pt",
                fontWeight: 900,
                mb: "2mm",
                textAlign: "center"
              }}
            >
              مشرف التدريب
            </Typography>

            <QRCodeSVG
              value={verificationUrl}
              size={88}
              level="M"
            />

            <Typography
              sx={{
                mt: "1mm",
                fontSize: "8.8pt",
                fontWeight: 900,
                textAlign: "center",
                whiteSpace: "nowrap"
              }}
            >
              موثوقية الإنذار المالي
            </Typography>
          </Box>

          <Box
            sx={{
              width: "105mm",
              justifySelf: "end",
              direction: "ltr"
            }}
          >
            <Typography
              sx={{
                fontSize: "9.5pt",
                fontWeight: 900,
                textAlign: "center",
                mb: "2.5mm",
                whiteSpace: "nowrap"
              }}
            >
              المعهد السعودي المتخصص العالي للتدريب
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "20mm 1fr",
                alignItems: "center",
                minHeight: "16mm",
                mb: "1.5mm"
              }}
            >
              <Typography
                sx={{
                  fontSize: "9.5pt",
                  fontWeight: 900,
                  textAlign: "right",
                  mr: "-45px",
                  whiteSpace: "nowrap"
                }}
              >
                التوقيع:
              </Typography>

              <Box
                component="img"
                src="/signveno.png"
                alt="التوقيع"
                sx={{
                  width: "50mm",
                  height: "16mm",
                  objectFit: "contain",
                  justifySelf: "center"
                }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "20mm 1fr",
                alignItems: "center",
                minHeight: "28mm"
              }}
            >
              <Typography
                sx={{
                  fontSize: "9.5pt",
                  fontWeight: 900,
                  mr: "-30px",
                  mt: "-40px",
                  textAlign: "right",
                  whiteSpace: "nowrap"
                }}
              >
                الختم:
              </Typography>

              <Box
                component="img"
                src="/stampveno.jpeg"
                onError={(event) => {
                  event.currentTarget.src =
                    "/stampveno.png";
                }}
                alt="الختم"
                sx={{
                  width: "48mm",
                  height: "28mm",
                  objectFit: "contain",
                  justifySelf: "center"
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box
          component="img"
          src="/footerveno.png"
          alt="الفوتر"
          sx={{
            position: "absolute",
            bottom: "4mm",
            left: "8mm",
            right: "8mm",
            width: "calc(100% - 16mm)",
            height: "29mm",
            objectFit: "fill",
            display: "block"
          }}
        />
      </Box>
    );
  }
);

const AbsenceWarningPrint = React.forwardRef(
  ({ model }, ref) => {
    const verificationUrl =
      model.verificationUrl ||
      String(model.documentGuid || "");

    const isCourseDeprivation =
      model.formCode === "COURSE_DEPRIVATION";

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

    const absencePercent =
      isCourseDeprivation
        ? model.absencePercent || "25"
        : model.absencePercent || "10";

    const verificationLabel =
      isCourseDeprivation
        ? "موثوقية الحرمان"
        : "موثوقية الإنذار";

    const printTitle =
      isGradeWarning
        ? `إنذار رقم (${warningNumber}) - انخفاض المعدل`
        : `إنذار رقم (${warningNumber}) - تعليمات الانتظام`;

    return (
      <Box
        ref={ref}
        className="print-sheet"
        sx={{
          width: "210mm",
          height: "297mm",
          minHeight: "297mm",
          maxHeight: "297mm",
          position: "relative",
          overflow: "hidden",
          background: "#fff",
          direction: "ltr",
          fontFamily:
            "Cairo, Tahoma, Arial, sans-serif",
          pt: "14mm",
          px: "16mm",
          pb: "38mm",
          boxSizing: "border-box"
        }}
      >
        <PrintHeader
          model={model}
          title={printTitle}
        />

        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            mt: "8mm",
            "th,td": {
              border: "1px solid #111",
              p: "3mm",
              fontSize: "9pt",
              fontWeight: 800,
              textAlign: "center"
            }
          }}
        >
          <tbody>
            <tr>
              <th>الاسم</th>
              <th>رقم السجل المدني</th>
              <th>الدبلوم</th>
            </tr>

            <tr>
              <td>{model.studentName}</td>
              <td>{model.nationalId}</td>
              <td>{model.specialization}</td>
            </tr>
          </tbody>
        </Box>

        <Typography
          align="center"
          sx={{
            fontSize: "10pt",
            fontWeight: 900,
            mt: "6mm",
            lineHeight: 2
          }}
        >
          السلام عليكم ورحمة الله وبركاته
          <br />
          تحية طيبة وبعد ،،،
        </Typography>

        <Divider
          sx={{
            my: "4mm",
            borderColor: "#111"
          }}
        />

        <Typography
          sx={{
            fontSize: "9.3pt",
            fontWeight: 800,
            lineHeight: 2.3,
            textAlign: "justify"
          }}
        >
          بعد الاطلاع على اللائحة التدريبية الأهلية المعتمدة من مجلس
          الإدارة بالجلسة رقم ({model.sessionNo || 108}) وتاريخ{" "}
          {model.sessionHijriDate || "1440/11/02 هـ"}، والاطلاع على دليل
          تعليمات التدريب لمنشآت التدريب الأهلية، وتم الإشارة إليها في
          اتفاقية التدريب مسبقاً؛ وفقاً للمادة ({model.articleNo ||
            (isGradeWarning ? 15 : 13)}) من دليل تعليمات التدريب لمنشآت
          التدريب الأهلية:{" "}
          {isGradeWarning ? (
            <>
              تعليمات الإنذارات وطي القيد. نفيدكم أن معدلكم التراكمي
              انخفض عن ({model.gradeValue || "2.00"} من{" "}
              {model.gradeMax || "5.00"}) خلال الفترة التدريبية{" "}
              {model.periodHijriText || "-"}، وذلك{" "}
              {model.reasonText ||
                "نظراً لحرمانك / غيابك عن أداء الاختبارات"}. لذا نأمل
              الالتزام خلال الفترة التدريبية الحالية، وإلا سنضطر آسفين
              إلى إنهاء إجراءات طي القيد.
            </>
          ) : (
            <>
              تعليمات الانتظام والانسحاب والانتقال. نحيطكم بأن نسبة
              غيابكم قد تجاوزت {absencePercent}% من إجمالي ساعات
              المقررات الآتية:{" "}
              {model.courses ||
                "المقررات المسجلة بالفصل التدريبي"}، بالفصل التدريبي{" "}
              {model.termName || "-"}.{" "}
              {isCourseDeprivation ? (
                <>
                  ولذلك تم اعتباركم محرومين في المقررات، ولا يحق لكم
                  دخول اختبار هذه المقررات في نهاية الفترة التدريبية.
                  لذا نأمل منكم الالتزام بالحضور وفق الجدول التدريبي
                  للمحاضرات في الفصل التدريبي القادم.
                </>
              ) : (
                <>
                  وفي حال عدم الالتزام بالحضور وزيادة نسبة الغياب عن{" "}
                  {model.denialPercent || 25}% من إجمالي ساعات المقرر
                  فإنه يتم اعتباركم محرومين في المقررات، ولا يحق لكم
                  دخول اختبار المقرر في نهاية الفترة التدريبية. لذا
                  نأمل منكم الالتزام بالحضور وفق الجدول التدريبي
                  للمحاضرات.
                </>
              )}
            </>
          )}
        </Typography>

        <Divider
          sx={{
            my: "5mm",
            borderColor: "#111"
          }}
        />

        <Typography
          align="center"
          sx={{
            fontSize: "9pt",
            fontWeight: 800
          }}
        >
          هذا لإحاطتكم والتنبيه، والله ولي التوفيق
        </Typography>

        {/* الجزء السفلي للإنذار بنفس استايل جدول الاختبارات */}
        <Box
          sx={{
            position: "absolute",
            left: "18mm",
            right: "18mm",
            bottom: "40mm",
            minHeight: "49mm",
            display: "grid",
            gridTemplateColumns:
              "64mm 1fr",
            columnGap: "18mm",
            alignItems: "end",
            direction: "ltr"
          }}
        >
          {/* موثوقية الإنذار */}
<Box
  sx={{
    width: "50mm",
    textAlign: "center",
    justifySelf: "start",
    position: "relative",
    top: "-15mm"
  }}
>
            <Typography
              sx={{
                fontSize: "9.5pt",
                fontWeight: 900,
                mb: "2mm",
                textAlign: "center"
              }}
            >
              مشرف التدريب
            </Typography>

            <QRCodeSVG
              value={verificationUrl}
              size={88}
              level="M"
            />

            <Typography
              sx={{
                mt: "1mm",
                fontSize: "8.8pt",
                fontWeight: 900,
                textAlign: "center",
                whiteSpace: "nowrap"
              }}
            >
              {verificationLabel}
            </Typography>
          </Box>

          {/* التوقيع والختم */}
          <Box
            sx={{
              width: "105mm",
              justifySelf: "end",
              direction: "ltr"
            }}
          >
            <Typography
              sx={{
                fontSize: "9.5pt",
                fontWeight: 900,
                textAlign: "center",
                mb: "2.5mm",
                whiteSpace: "nowrap"
              }}
            >
              المعهد السعودي المتخصص العالي للتدريب
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "20mm 1fr",
                alignItems: "center",
                minHeight: "16mm",
                mb: "1.5mm"
              }}
            >
              <Typography
                sx={{
                  fontSize: "9.5pt",
                  fontWeight: 900,
                  textAlign: "right",
                  mr: "-45px",
                  whiteSpace: "nowrap"
                }}
              >
                التوقيع:
              </Typography>

              <Box
                component="img"
                src="/signveno.png"
                alt="التوقيع"
                sx={{
                  width: "50mm",
                  height: "16mm",
                  objectFit: "contain",
                  justifySelf: "center"
                }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "20mm 1fr",
                alignItems: "center",
                minHeight: "28mm"
              }}
            >
              <Typography
                sx={{
                  fontSize: "9.5pt",
                  fontWeight: 900,
                  mr: "-30px",
                  mt: "-40px",
                  textAlign: "right",
                  whiteSpace: "nowrap"
                }}
              >
                الختم:
              </Typography>

              <Box
                component="img"
                src="/stampveno.jpeg"
                onError={(event) => {
                  event.currentTarget.src =
                    "/stampveno.png";
                }}
                alt="الختم"
                sx={{
                  width: "48mm",
                  height: "28mm",
                  objectFit: "contain",
                  justifySelf: "center"
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box
          component="img"
          src="/footerveno.png"
          alt="الفوتر"
          sx={{
            position: "absolute",
            bottom: "4mm",
            left: "8mm",
            right: "8mm",
            width: "calc(100% - 16mm)",
            height: "29mm",
            objectFit: "fill",
            display: "block"
          }}
        />
      </Box>
    );
  }
);

export default QualityFormsPage;