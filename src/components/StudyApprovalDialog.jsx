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
  FormControlLabel,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";
import SchoolIcon from "@mui/icons-material/School";
import Swal from "sweetalert2";

const primaryColor = "#057546";
const accentColor = "#ae1e21";

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
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "";
};

const approvalTypes = [
  { value: 0, label: "دبلوم" },
  { value: 1, label: "دورة تأهيلية" },
  { value: 2, label: "دورة تطويرية" }
];

const StudyApprovalDialog = ({
  open,
  student,
  apiBaseUrl,
  editMode = false,
  orderGuid = "",
  orderCode = "",
  onClose,
  onSaved
}) => {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery("(min-width:600px) and (max-width:1599px)");
  const isCompact = isPhone || isTablet;

  const compactMenuProps = {
    anchorOrigin: { vertical: "bottom", horizontal: "right" },
    transformOrigin: { vertical: "top", horizontal: "right" },
    MenuListProps: {
      dense: true,
      sx: { p: isCompact ? 0.25 : 0.75 }
    },
    PaperProps: {
      sx: {
        maxHeight: isPhone ? 190 : isTablet ? 230 : 340,
        mt: 0.3,
        borderRadius: isCompact ? 1.2 : 2,
        boxShadow: "0 10px 26px rgba(31,45,61,0.16)",
        "& .MuiMenuItem-root": {
          minHeight: isPhone ? 30 : isTablet ? 34 : 40,
          py: isPhone ? 0.35 : isTablet ? 0.48 : 0.75,
          pr: isPhone ? 0.65 : isTablet ? 0.85 : 1.5,
          pl: isPhone ? 2.1 : isTablet ? 2.6 : 1.5,
          fontSize: isPhone ? "0.48rem" : isTablet ? "0.56rem" : "0.875rem",
          fontWeight: 850,
          lineHeight: 1.15,
          whiteSpace: "normal"
        }
      }
    }
  };

  const currentUser = useMemo(() => getCurrentUser(), []);
  const userGuid = useMemo(() => getUserGuid(currentUser), [currentUser]);

  const currentSellerGuid =
    currentUser?.sellerGuid ||
    currentUser?.SellerGuid ||
    currentUser?.salesManGuid ||
    currentUser?.SalesManGuid ||
    "";

  const currentUserFullName =
    currentUser?.fullName ||
    currentUser?.FullName ||
    currentUser?.userName ||
    currentUser?.UserName ||
    currentUser?.name ||
    currentUser?.Name ||
    "";

  const studentName = readValue(student, "studentName", "StudentName");
  const nationalId = readValue(student, "nationalId", "NationalId");
  const studentTel = readValue(student, "studentTel", "StudentTel", "tel");
  const accountGuid = readValue(
    student,
    "accountGuid",
    "AccountGuid",
    "studentGuid",
    "StudentGuid"
  );

  const initialStudyType = Number(
    readValue(student, "studyType", "StudyType") || 0
  );

  const [programType, setProgramType] = useState(0);
  const [studyType, setStudyType] = useState(initialStudyType === 1 ? 1 : 0);

  const [branches, setBranches] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [branchGuid, setBranchGuid] = useState("");
  const [sectorGuid, setSectorGuid] = useState("");
  const [sellerGuid, setSellerGuid] = useState("");
  const [batchGuid, setBatchGuid] = useState("");
  const [diplomGuid, setDiplomGuid] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startDateGregorian, setStartDateGregorian] = useState("");
  const [endDateGregorian, setEndDateGregorian] = useState("");
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [showGregorian, setShowGregorian] = useState(false);

  const [loadingLookups, setLoadingLookups] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedOrder, setSavedOrder] = useState(null);

  const [currentOrderGuid, setCurrentOrderGuid] = useState("");
  const [currentOrderCode, setCurrentOrderCode] = useState("");
  const [currentStudentGuid, setCurrentStudentGuid] = useState(accountGuid || "");

  const hydratingEditRef = useRef(false);
  const skipAutomaticDateCalculationRef = useRef(false);

  const selectedBranch = branches.find((x) => x.guid === branchGuid);
  const selectedSector = sectors.find((x) => x.guid === sectorGuid);
  const selectedSeller = sellers.find((x) => x.guid === sellerGuid);
  const selectedBatch = batches.find((x) => x.guid === batchGuid);
  const selectedProgram = programs.find((x) => x.guid === diplomGuid);

  const selectedBatchRemaining = Number(
    selectedBatch?.remainingApprovals ??
    selectedBatch?.available ??
    0
  );

  const fetchList = async (url) => {
    const response = await fetch(url, { cache: "no-store" });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.error ||
          result?.message ||
          "تعذر تحميل البيانات"
      );
    }

    return Array.isArray(result?.data) ? result.data : [];
  };

  const loadBaseLookups = async () => {
    try {
      setLoadingLookups(true);
      setError("");

      const [branchData, sectorData, sellerData] = await Promise.all([
        fetchList(`${apiBaseUrl}/api/study-approvals/lookups/branches`),
        fetchList(`${apiBaseUrl}/api/study-approvals/lookups/sectors`),
        fetchList(`${apiBaseUrl}/api/study-approvals/lookups/sellers`)
      ]);

      setBranches(branchData);
      setSectors(sectorData);
      setSellers(sellerData);

      const matchingSeller =
        sellerData.find(
          (item) =>
            String(item.guid).toLowerCase() ===
            String(currentSellerGuid).toLowerCase()
        ) ||
        sellerData.find(
          (item) =>
            String(item.userGuid || "").toLowerCase() ===
            String(userGuid).toLowerCase()
        );

      if (matchingSeller?.guid) {
        setSellerGuid(matchingSeller.guid);
      }
    } catch (e) {
      setError(e.message || "تعذر تحميل القوائم");
    } finally {
      setLoadingLookups(false);
    }
  };

  const loadBatches = async ({
    preserveSelection = false,
    selectedValue = ""
  } = {}) => {
    if (!branchGuid || programType === 2) {
      setBatches([]);

      if (!preserveSelection) {
        setBatchGuid("");
      }

      return [];
    }

    try {
      const data = await fetchList(
        `${apiBaseUrl}/api/study-approvals/lookups/batches?programType=${programType}&branchGuid=${encodeURIComponent(
          branchGuid
        )}`
      );

      setBatches(data);

      if (preserveSelection && selectedValue) {
        setBatchGuid(selectedValue);
      }

      return data;
    } catch (e) {
      setBatches([]);

      if (!preserveSelection) {
        setBatchGuid("");
      }

      setError(e.message || "تعذر تحميل الدفعات");
      return [];
    }
  };

  const loadPrograms = async ({
    preserveSelection = false,
    selectedValue = ""
  } = {}) => {
    if (!branchGuid) {
      setPrograms([]);

      if (!preserveSelection) {
        setDiplomGuid("");
      }

      return [];
    }

    if (programType === 1 && !batchGuid) {
      setPrograms([]);

      if (!preserveSelection) {
        setDiplomGuid("");
      }

      return [];
    }

    try {
      const params = new URLSearchParams({
        programType: String(programType),
        branchGuid,
        // في الديسكتوب قائمة الدبلومات واحدة للحضوري وعن بعد.
        // StudyType يخص حفظ الموافقة والطباعة وليس مصدر قائمة الدبلومات.
        studyType: programType === 0 ? "0" : String(studyType)
      });

      if (batchGuid) params.set("batchGuid", batchGuid);

      const data = await fetchList(
        `${apiBaseUrl}/api/study-approvals/lookups/programs?${params.toString()}`
      );

      // حماية إضافية مطابقة لمنطق الديسكتوب:
      // عند اختيار "دبلوم" لا نعرض الدورات التأهيلية أو الخدمات،
      // حتى لو رجعت بالخطأ من البروسيجر أو من نسخة API قديمة.
      const filteredData =
        programType === 0
          ? data.filter((item) =>
              String(item?.name || "").includes("دبلوم")
            )
          : data;

      setPrograms(filteredData);

      if (preserveSelection && selectedValue) {
        setDiplomGuid(selectedValue);
      }

      return data;
    } catch (e) {
      setPrograms([]);

      if (!preserveSelection) {
        setDiplomGuid("");
      }

      setError(e.message || "تعذر تحميل البرامج");
      return [];
    }
  };


  const loadExistingApproval = async () => {
    if (!editMode) return;

    const requestedGuid =
      orderGuid ||
      readValue(
        student,
        "approvalOrderGuid",
        "orderGuid",
        "OrderGuid",
        "guid",
        "Guid"
      );

    const requestedCode =
      orderCode ||
      readValue(
        student,
        "approvalOrderCode",
        "orderCode",
        "OrderCode",
        "code",
        "Code"
      );

    if (!requestedGuid && !requestedCode) {
      throw new Error("تعذر تحديد الموافقة المطلوب تعديلها");
    }

    setLoadingOrder(true);
    hydratingEditRef.current = true;
    skipAutomaticDateCalculationRef.current = true;

    try {
      const params = new URLSearchParams();

      if (requestedGuid) {
        params.set("orderGuid", requestedGuid);
      }

      if (requestedCode) {
        params.set("orderCode", String(requestedCode));
      }

      const response = await fetch(
        `${apiBaseUrl}/api/study-approvals/edit-data?${params.toString()}`,
        {
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          "تعذر تحميل بيانات الموافقة"
        );
      }

      const data = result?.data || {};

      const loadedOrderGuid = readValue(
        data,
        "orderGuid",
        "OrderGuid",
        "guid",
        "Guid"
      );

      const loadedOrderCode = readValue(
        data,
        "code",
        "Code",
        "orderCode",
        "OrderCode"
      );

      const loadedStudentGuid = readValue(
        data,
        "studentGuid",
        "StudentGuid",
        "accountGuid",
        "AccountGuid"
      );

      const loadedBranchGuid = readValue(
        data,
        "branchGuid",
        "BranchGuid"
      );

      const loadedSectorGuid = readValue(
        data,
        "sectorGuid",
        "SectorGuid"
      );

      const loadedSellerGuid = readValue(
        data,
        "salesManGuid",
        "SalesManGuid",
        "sellerGuid",
        "SellerGuid"
      );

      const loadedBatchGuid = readValue(
        data,
        "batchGuid",
        "BatchGuid"
      );

      const loadedDiplomGuid = readValue(
        data,
        "diplomGuid",
        "DiplomGuid"
      );

      const loadedProgramType = Number(
        readValue(
          data,
          "programType",
          "ProgramType"
        ) || 0
      );

      const loadedStudyType = Number(
        readValue(
          data,
          "studyType",
          "StudyType"
        ) || 0
      );

      setCurrentOrderGuid(loadedOrderGuid || requestedGuid || "");
      setCurrentOrderCode(String(loadedOrderCode || requestedCode || ""));
      setCurrentStudentGuid(loadedStudentGuid || accountGuid || "");

      setProgramType(
        [0, 1, 2].includes(loadedProgramType)
          ? loadedProgramType
          : 0
      );

      setStudyType(loadedStudyType === 1 ? 1 : 0);
      setBranchGuid(loadedBranchGuid || "");
      setSectorGuid(loadedSectorGuid || "");
      setSellerGuid(loadedSellerGuid || currentSellerGuid || "");
      setBatchGuid(loadedBatchGuid || "");
      setDiplomGuid(loadedDiplomGuid || "");

      setStartDate(
        readValue(
          data,
          "studyStartDate",
          "StudyStartDate"
        )
      );

      setEndDate(
        readValue(
          data,
          "studyEndDate",
          "StudyEndDate"
        )
      );

      setStartDateGregorian(
        readValue(
          data,
          "startDateGregorian",
          "StartDateGregorian"
        )
      );

      setEndDateGregorian(
        readValue(
          data,
          "endDateGregorian",
          "EndDateGregorian"
        )
      );

      setHours(
        String(
          readValue(
            data,
            "studyHours",
            "StudyHours"
          ) || ""
        )
      );

      setNotes(
        readValue(
          data,
          "orderNotes",
          "OrderNotes",
          "notes",
          "Notes"
        )
      );

      setShowGregorian(
        Boolean(
          readValue(
            data,
            "showGregorian",
            "ShowGregorian"
          )
        )
      );

      setSavedOrder({
        orderGuid: loadedOrderGuid || requestedGuid || "",
        code: loadedOrderCode || requestedCode || ""
      });

      await Promise.all([
        loadBatches({
          preserveSelection: true,
          selectedValue: loadedBatchGuid || ""
        }),
        loadPrograms({
          preserveSelection: true,
          selectedValue: loadedDiplomGuid || ""
        })
      ]);
    } finally {
      hydratingEditRef.current = false;
      setLoadingOrder(false);

      window.setTimeout(() => {
        skipAutomaticDateCalculationRef.current = false;
      }, 250);
    }
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const initializeDialog = async () => {
      try {
        setError("");
        setCurrentOrderGuid("");
        setCurrentOrderCode("");
        setCurrentStudentGuid(accountGuid || "");

        if (!editMode) {
          setProgramType(0);
          setStudyType(initialStudyType === 1 ? 1 : 0);
          setBranchGuid("");
          setSectorGuid("");
          setSellerGuid(currentSellerGuid || "");
          setBatchGuid("");
          setDiplomGuid("");
          setStartDate("");
          setEndDate("");
          setStartDateGregorian("");
          setEndDateGregorian("");
          setHours("");
          setNotes("");
          setShowGregorian(false);
          setSavedOrder(null);
        }

        await loadBaseLookups();

        if (!cancelled && editMode) {
          await loadExistingApproval();
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e.message ||
            "تعذر تجهيز شاشة الموافقة"
          );
        }
      }
    };

    initializeDialog();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    editMode,
    orderGuid,
    orderCode
  ]);

  useEffect(() => {
    if (!open || hydratingEditRef.current) return;

    if (!editMode) {
      setBatchGuid("");
      setDiplomGuid("");
      setPrograms([]);
      setStartDate("");
      setEndDate("");
      setStartDateGregorian("");
      setEndDateGregorian("");
      setHours("");
    }

    loadBatches({
      preserveSelection: editMode,
      selectedValue: editMode ? batchGuid : ""
    });
  }, [programType, branchGuid]);

  useEffect(() => {
    if (!open || hydratingEditRef.current) return;

    // في الدبلوم: اختيار الدفعة لا يمسح البرنامج المختار.
    // في التأهيلي: البرنامج يعتمد على الدفعة، لذلك يتصفّر عند تغييرها.
    if (!editMode && programType !== 0) {
      setDiplomGuid("");
    }

    setPrograms([]);

    loadPrograms({
      preserveSelection: editMode,
      selectedValue: editMode ? diplomGuid : ""
    });
  }, [programType, branchGuid, sectorGuid, batchGuid]);

  useEffect(() => {
    if (skipAutomaticDateCalculationRef.current) return;
    if (!selectedBatch || programType === 2) return;

    calculateStudyDates({
      selectedProgramType: programType,
      selectedBatchItem: selectedBatch,
      selectedDiplomGuid: diplomGuid
    });
  }, [selectedBatch, programType, diplomGuid]);


  useEffect(() => {
    if (skipAutomaticDateCalculationRef.current) return;
    if (!selectedProgram) return;

    if (programType === 0) {
      setHours(String(getDiplomaHours(selectedProgram.name)));

      if (selectedBatch) {
        calculateStudyDates({
          selectedProgramType: 0,
          selectedBatchItem: selectedBatch,
          selectedDiplomGuid: selectedProgram.guid
        });
      }

      return;
    }

    if (programType === 1) {
      const courseHours = getCourseHours(selectedProgram.name);
      setHours(courseHours > 0 ? String(courseHours) : "");

      if (selectedBatch) {
        calculateStudyDates({
          selectedProgramType: 1,
          selectedBatchItem: selectedBatch,
          selectedDiplomGuid: selectedProgram.guid
        });
      }

      return;
    }

    if (selectedProgram.hours) {
      setHours(String(selectedProgram.hours));
    } else {
      const courseHours = getCourseHours(selectedProgram.name);
      setHours(courseHours > 0 ? String(courseHours) : "");
    }

    if (selectedProgram.startDate) {
      setStartDate(selectedProgram.startDate);
    }

    if (selectedProgram.endDate) {
      setEndDate(selectedProgram.endDate);
    }

    setStartDateGregorian(
      selectedProgram.startDateGregorian ||
      selectedProgram.startDateMiladi ||
      ""
    );

    setEndDateGregorian(
      selectedProgram.endDateGregorian ||
      selectedProgram.endDateMiladi ||
      ""
    );
  }, [selectedProgram, programType]);

  const normalizeArabicDigits = (value) =>
    String(value || "")
      .replace(/[٠-٩]/g, (digit) =>
        String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
      );

  const extractHijriDateFromBatchName = (value) => {
    const normalized = normalizeArabicDigits(value);
    const match = normalized.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    return match?.[0] || "";
  };

  const getDiplomaHours = (name) => {
    const value = String(name || "").trim();

    if (value.includes("إدارة التمريض")) return 75;
    if (
      value.includes("إدارة المستشفيات") ||
      value.includes("الخدمات الصحية")
    ) return 84;
    if (value.includes("إدارة السلامة")) return 73;
    if (value.includes("الأمن السيبراني") || value.includes("السيبراني")) return 76;
    if (value.includes("القانون")) return 84;
    if (value.includes("إدارة الأعمال")) return 87;
    if (value.includes("الموارد البشرية")) return 79;
    if (
      value.includes("الادارة المكتبية") ||
      value.includes("الإدارة المكتبية")
    ) return 80;

    return 84;
  };

  const getCourseHours = (name) => {
    const value = String(name || "").trim();

    if (
      value.includes("استخدام الحاسب الالي فى الاعمال المكتبية") ||
      value.includes("استخدام الحاسب الآلي في الأعمال المكتبية") ||
      value.includes("استخدام الحاسب الالي في الاعمال المكتبية")
    ) return 120;

    if (
      value.includes("ادخال البيانات ومعالجة النصوص") ||
      value.includes("إدخال البيانات ومعالجة النصوص")
    ) return 240;

    if (
      value.includes("الادارة المكتبيه 3 شهور") ||
      value.includes("الإدارة المكتبية 3 شهور")
    ) return 180;

    if (
      value.includes("الادارة المكتبية المتقدمة 6 شهور") ||
      value.includes("الإدارة المكتبية المتقدمة 6 شهور")
    ) return 360;

    return 0;
  };

  const calculateStudyDates = async ({
    selectedProgramType = programType,
    selectedBatchItem = selectedBatch,
    selectedDiplomGuid = diplomGuid
  } = {}) => {
    if (!selectedBatchItem?.name || selectedProgramType === 2) {
      return;
    }

    if (selectedProgramType === 1 && !selectedDiplomGuid) {
      setStartDate(
        extractHijriDateFromBatchName(selectedBatchItem.name)
      );
      setEndDate("");
      setStartDateGregorian("");
      setEndDateGregorian("");
      return;
    }

    try {
      setError("");

      const params = new URLSearchParams({
        programType: String(selectedProgramType),
        batchName: selectedBatchItem.name
      });

      if (selectedDiplomGuid) {
        params.set("diplomGuid", selectedDiplomGuid);
      }

      const response = await fetch(
        `${apiBaseUrl}/api/study-approvals/calculate-study-dates?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر حساب تواريخ الدراسة"
        );
      }

      setStartDate(result?.data?.startDateHijri || "");
      setEndDate(result?.data?.endDateHijri || "");
      setStartDateGregorian(result?.data?.startDateGregorian || "");
      setEndDateGregorian(result?.data?.endDateGregorian || "");
    } catch (e) {
      setEndDate("");
      setStartDateGregorian("");
      setEndDateGregorian("");
      setError(
        e.message ||
          "حدث خطأ أثناء حساب تاريخ نهاية الدراسة"
      );
    }
  };

  const validate = () => {
    if (!(currentStudentGuid || accountGuid)) return "رقم حساب الطالب غير موجود";
    if (!branchGuid) return "برجاء اختيار فرع الدراسة";
    if (!sectorGuid) return "برجاء اختيار القطاع";
    if (programType !== 2 && !batchGuid) return "برجاء اختيار الدفعة";
    if (programType !== 2 && selectedBatchRemaining <= 0) {
      return programType === 0
        ? "تم اكتمال عدد الموافقات المحدد في هذه الدفعة"
        : "هذه الدفعة غير متاح لها موافقات";
    }
    if (!diplomGuid) return "برجاء اختيار البرنامج";
    if (!startDate.trim()) return "برجاء إدخال تاريخ بداية الدراسة";
    if (!endDate.trim()) return "برجاء إدخال تاريخ نهاية الدراسة";
    if (!hours || Number(hours) <= 0) return "برجاء إدخال عدد الساعات";
    if (!userGuid) return "بيانات المستخدم غير موجودة";

    return "";
  };

  const save = async () => {
    const validationMessage = validate();

    if (validationMessage) {
      await Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: validationMessage,
        confirmButtonColor: accentColor
      });
      return;
    }

    try {
      setSaving(true);
      setError("");

      const effectiveOrderGuid =
        currentOrderGuid ||
        orderGuid ||
        readValue(
          student,
          "approvalOrderGuid",
          "orderGuid",
          "OrderGuid",
          "guid",
          "Guid"
        );

      const effectiveOrderCode =
        currentOrderCode ||
        orderCode ||
        readValue(
          student,
          "approvalOrderCode",
          "orderCode",
          "OrderCode",
          "code",
          "Code"
        );

      const isEditing =
        editMode &&
        Boolean(effectiveOrderGuid);

      if (editMode && !effectiveOrderGuid) {
        throw new Error("تعذر قراءة معرف الموافقة المطلوب تعديلها");
      }

      const requestUrl = isEditing
        ? `${apiBaseUrl}/api/study-approvals/${encodeURIComponent(
            effectiveOrderGuid
          )}`
        : `${apiBaseUrl}/api/study-approvals`;

      const response = await fetch(
        requestUrl,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            orderGuid: isEditing ? effectiveOrderGuid : null,
            orderCode: effectiveOrderCode || null,
            studentGuid: currentStudentGuid || accountGuid,
            branchGuid,
            sectorGuid,
            diplomGuid,
            batchGuid: programType === 2 ? null : batchGuid,
            studyStartDate: startDate.trim(),
            studyEndDate: endDate.trim(),
            // مطابق لمنطق الديسكتوب: نخزن UserGuid الخاص بمن أنشأ الموافقة
            salesManGuid: userGuid,
            orderNotes: notes.trim(),
            programType,
            studyType,
            studyHours: Number(hours),
            userGuid
          })
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر حفظ الموافقة"
        );
      }

      setSavedOrder(result?.data || null);

      if (!editMode && programType !== 2 && batchGuid) {
        setBatches((current) =>
          current.map((item) => {
            if (item.guid !== batchGuid) return item;

            const oldRemaining = Number(
              item.remainingApprovals ?? item.available ?? 0
            );
            const newRemaining = Math.max(oldRemaining - 1, 0);

            return {
              ...item,
              usedApprovals: Number(item.usedApprovals || 0) + 1,
              remainingApprovals: newRemaining,
              available: newRemaining,
              canSelect: newRemaining > 0
            };
          })
        );
      }

      await Swal.fire({
        icon: "success",
        title: editMode ? "تم التعديل" : "تم الحفظ",
        text:
          result?.message ||
          (
            editMode
              ? "تم تعديل الموافقة الدراسية بنجاح"
              : "تم حفظ الموافقة الدراسية بنجاح"
          ),
        confirmButtonColor: primaryColor
      });

      onSaved?.(result);
    } catch (e) {
      setError(e.message || editMode ? "حدث خطأ أثناء تعديل الموافقة" : "حدث خطأ أثناء حفظ الموافقة");
    } finally {
      setSaving(false);
    }
  };

  const print = async () => {
    if (!savedOrder?.orderGuid) {
      await Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "برجاء حفظ الموافقة أولاً",
        confirmButtonColor: accentColor
      });
      return;
    }

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/study-approvals/${savedOrder.orderGuid}/print-data`,
        { cache: "no-store" }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "تعذر تحميل بيانات الطباعة"
        );
      }

      const d = result?.data || {};
      const qrUrl = `https://filesregsiteration.sstli.com/Auth.php?orderGuid=${savedOrder.orderGuid}&code=${savedOrder.code}`;

      const printWindow = window.open("", "_blank", "width=900,height=1100");

      if (!printWindow) {
        throw new Error("المتصفح منع نافذة الطباعة");
      }

      const approvalType =
        programType === 0
          ? "دبلوم"
          : programType === 1
            ? "دورة تأهيلية"
            : "دورة تطويرية";
      const programName =
        d.DiplomName ||
        d.diplomName ||
        selectedProgram?.name ||
        "";

      const branchName =
        d.BrName ||
        d.BranchName ||
        selectedBranch?.name ||
        "";

      const displayProgramName =
        studyType === 1 && !programName.includes("عن بعد")
          ? `${programName} (عن بعد)`
          : programName;

      const assetBaseUrl = window.location.origin;
      const headerUrl = `${assetBaseUrl}/headerveno.png`;
      const footerUrl = `${assetBaseUrl}/footerveno.png`;
      const signUrl = `${assetBaseUrl}/signveno.png`;
      const stampUrl = `${assetBaseUrl}/stampveno.jpeg`;
      const watermarkUrl = `${assetBaseUrl}/watermark-logo.png`;

     const formatGregorian = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
};

      const startDateLine =
        showGregorian && startDateGregorian
          ? `${startDate} هـ الموافق ${formatGregorian(startDateGregorian)} م`
          : `${startDate} هـ`;

      const endDateLine =
        showGregorian && endDateGregorian
          ? `${endDate} هـ الموافق ${formatGregorian(endDateGregorian)} م`
          : `${endDate} هـ`;


      const remoteBranchCityByGuid = {
        "efa4a3ba-df60-4b8d-815c-345bfd5c36d1": "الرياض",
        "5407eb67-52a7-4ede-bd68-77e5fab52ed3": "حفر الباطن",
        "2b713291-a695-4070-8eae-e1a679a7e172": "خميس مشيط"
      };

      const selectedBranchGuidNormalized = String(
        branchGuid ||
        d.BranchGuid ||
        d.branchGuid ||
        selectedBranch?.guid ||
        ""
      )
        .trim()
        .toLowerCase();

      const remoteBranchCity =
        remoteBranchCityByGuid[selectedBranchGuidNormalized] || "";

      const studyLine =
        studyType === 1
          ? remoteBranchCity
            ? `والدراسة بفرع المعهد بمدينة ${remoteBranchCity}، ولا تتعارض أوقات الدراسة مع أوقات العمل الرسمية،`
            : "والدراسة بنظام التدريب عن بعد، ولا تتعارض أوقات الدراسة مع أوقات العمل الرسمية،"
          : `والدراسة في ${branchName}، ولا تتعارض أوقات الدراسة مع أوقات العمل الرسمية،`;

      // الدبلوم: ساعة معتمدة
      // الدورات التأهيلية والتطويرية: ساعة تدريبية
      const hoursLabel =
        programType === 0
          ? "ساعة معتمدة"
          : "ساعة تدريبية";

      printWindow.document.write(`
        <!doctype html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>موافقة ${savedOrder.code}</title>

          <style>
            @page {
              size: A4;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #d8d8d8;
              font-family: Tahoma, Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .page {
              position: relative;
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: #ffffff;
              overflow: hidden;
            }

            .watermark {
              position: absolute;
              inset: 0;
              z-index: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              pointer-events: none;
              opacity: 0.052;
            }

            .watermark img {
              width: 73%;
              max-height: 72%;
              object-fit: contain;
            }

            .header-image {
              position: relative;
              z-index: 2;
              display: block;
              width: 100%;
              height: auto;
              margin: 8mm 0 0;
            }

            .content {
              position: relative;
              z-index: 2;
              padding: 5mm 6mm 46mm;
              color: #111;
            }

            .issue-date {
              margin: 0 0 6px;
              text-align: left;
              font-size: 12px;
              font-weight: 700;
            }

            .document-title {
              margin: 2px 0 10px;
              text-align: center;
              font-size: 24px;
              font-weight: 800;
            }

            .student-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              margin-bottom: 8px;
              font-size: 13px;
            }

            .student-table td {
              border: 1px solid #111;
              padding: 6px 5px;
              text-align: center;
              vertical-align: middle;
              font-weight: 700;
            }

            .greeting {
              margin: 8px 0 2px;
              text-align: center;
              font-size: 15px;
              font-weight: 700;
              line-height: 1.9;
            }

            .separator {
              width: 100%;
              margin: 7px 0 10px;
              border-top: 1px solid #111;
            }

            .approval-body {
              width: 100%;
              margin: 0 auto;
              text-align: center;
              font-size: 14px;
              font-weight: 700;
              line-height: 2.48;
              letter-spacing: -0.08px;
            }

            .closing-text {
              margin: 10px 0 0;
              text-align: center;
              font-size: 15px;
              font-weight: 700;
            }

            .auth-section {
              width: 94%;
              margin: 82px 0 0;
              display: grid;
              grid-template-columns: 1.7fr 0.7fr;
              gap: 24px;
              align-items: start;
              direction: ltr;
            }

            .signature-area {
              direction: rtl;
              justify-self: start;
              width: 365px;
              max-width: 100%;
              margin-left: 0;
              padding-left: 0;
              transform: translateX(-24px);
            }

            .institute-name {
              width: 100%;
              margin-bottom: 7px;
              text-align: right;
              font-size: 15px;
              font-weight: 700;
            }

            .signature-line,
            .stamp-line {
              direction: rtl;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: flex-start;
              gap: isCompact ? 0.35 : 1,
          py: isPhone ? 0.42 : isTablet ? 0.6 : 1.5,
          px: isPhone ? 0.7 : isTablet ? 0.95 : 2,
          fontSize: isPhone ? "0.58rem" : isTablet ? "0.7rem" : undefined,
          flexShrink: 00px;
              width: 100%;
              text-align: right;
            }

            .signature-line {
              margin-top: 2px;
            }

            .stamp-line {
              margin-top: -5px;
            }

            .signature-line img {
              display: block;
              width: 132px;
              height: 52px;
              object-fit: contain;
              object-position: left center;
            }

            .stamp-line img {
              display: block;
              width: 162px;
              height: 96px;
              object-fit: contain;
              object-position: left center;
            }

            .signature-label,
            .stamp-label {
              width: 78px;
              min-width: 78px;
              text-align: right;
              direction: rtl;
              font-size: 15px;
              font-weight: 700;
              white-space: nowrap;
            }

            .verification-area {
              direction: rtl;
              text-align: center;
              align-self: start;
              padding-bottom: 0;
              transform: translateY(4px);
            }

            .verification-area img {
              display: block;
              width: 108px;
              height: 108px;
              margin: 0 auto 5px;
            }

            .verification-caption {
              font-size: 12px;
              font-weight: 700;
            }

            .footer-image {
              position: absolute;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 1;
              display: block;
              width: 100%;
              height: auto;
              margin: 0;
            }

            @media print {
              html,
              body {
                background: #fff;
              }

              .page {
                margin: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="page">
            <div class="watermark">
              <img src="${watermarkUrl}" alt="" />
            </div>

            <img
              class="header-image"
              src="${headerUrl}"
              alt="رأس الخطاب"
            />

            <main class="content">
              <div class="issue-date">
                تاريخ إصدار الموافقة:
                ${new Date().toLocaleDateString("ar-SA")} هـ
              </div>

              <div class="document-title">طلب موافقة</div>

              <table class="student-table">
                <tr>
                  <td>الاسم</td>
                  <td>رقم السجل المدني</td>
                  <td>طلب موافقة (${approvalType})</td>
                </tr>
                <tr>
                  <td>${studentName}</td>
                  <td>${nationalId}</td>
                  <td>${displayProgramName}</td>
                </tr>
              </table>

              <div class="greeting">
                السلام عليكم ورحمة الله وبركاته<br />
                تحية طيبة وبعد ،،،،
              </div>

              <div class="separator"></div>

              <div class="approval-body">
                نفيد سعادتكم بأن الموضح بياناته أعلاه لا مانع لدينا من تسجيله في
                ${displayProgramName}، والمعتمد من المؤسسة العامة للتدريب التقني والمهني،
                وبعدد ساعات (${hours}) ${hoursLabel}، ${studyLine}
                وعدد الساعات حتى تاريخه صفر، وفي حال الموافقة تكون الدراسة ابتداءً من
                <span style="white-space: nowrap">${startDateLine}</span>،
                وتكون نهاية الدراسة المتوقعة بتاريخ
                <span style="white-space: nowrap">${endDateLine}</span>،
                وقد أُعطي هذا المشهد بناءً على طلبه، دون أدنى مسؤولية على المعهد.
              </div>

              <div class="separator"></div>

              <div class="closing-text">
                هذا لإحاطة سعادتكم، والله ولي التوفيق
              </div>

              <section class="auth-section">
                <div class="signature-area">
                  <div class="institute-name">
                    المعهد السعودي المتخصص العالي للتدريب
                  </div>

                  <div class="signature-line">
                    <span class="signature-label"> التوقيع :</span>
                    <img src="${signUrl}" alt="التوقيع" />
                  </div>

                  <div class="stamp-line">
                    <span class="stamp-label"> الـخـتـم :  </span>
                    <img src="${stampUrl}" alt="الختم" />
                  </div>
                </div>

                <div class="verification-area">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      qrUrl
                    )}"
                    alt="رمز التحقق"
                  />
                  <div class="verification-caption">
                    فحص موثوقية الموافقة
                  </div>
                </div>
              </section>
            </main>

            <img
              class="footer-image"
              src="${footerUrl}"
              alt="تذييل الخطاب"
            />
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => window.print(), 650);
            };
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
    } catch (e) {
      setError(e.message || "تعذر طباعة الموافقة");
    }
  };

  return (
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
      }, uiLayout.dialogLayoutSx)}
      PaperProps={{
        sx: {
          width: isPhone ? "100vw" : isTablet ? "96vw" : "95vw",
          maxWidth: isPhone ? "100vw" : isTablet ? "1100px" : 1500,
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
          fontWeight: 950,
          color: primaryColor,
          display: "flex",
          alignItems: "center",
          gap: 1
        }}
      >
        <SchoolIcon sx={{ fontSize: isPhone ? 14 : isTablet ? 17 : undefined }} />
        {editMode
          ? `تعديل موافقة دراسية رقم ${
              currentOrderCode ||
              orderCode ||
              ""
            }`
          : "طلب موافقة دراسية"}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          px: isPhone ? 1.2 : isTablet ? 1.5 : 3,
py: isPhone ? 0.8 : isTablet ? 1 : 3,
          overflowY: "auto",
          flex: 1,
          minHeight: 0,
          "& .MuiInputLabel-root": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          },
          "& .MuiInputBase-input, & .MuiSelect-select": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            py: isPhone ? 0.5 : isTablet ? 0.65 : undefined
          },
          "& .MuiOutlinedInput-root": {
            minHeight: isPhone ? 31 : isTablet ? 35 : undefined,
            borderRadius: isCompact ? 1.2 : undefined
          },
          "& .MuiFormLabel-root": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            fontWeight: 900,
            mb: isPhone ? 0.35 : isTablet ? 0.45 : undefined
          },
          "& .MuiFormControlLabel-label": {
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined,
            fontWeight: 800
          },
          "& .MuiRadio-root": {
            p: isPhone ? 0.35 : isTablet ? 0.5 : undefined
          },
          "& .MuiRadio-root svg": {
            fontSize: isPhone ? 17 : isTablet ? 19 : undefined
          },

          "& .MuiFormControl-root": {
            mb: isPhone ? 0.25 : isTablet ? 0.35 : undefined
          },

          "& .MuiTextField-root": {
            mt: isPhone ? 0.05 : isTablet ? 0.08 : undefined
          }
        }}
      >
        {error ? (
          <Alert
            severity="error"
            sx={{
              mb: isCompact ? 0.4 : 2,
              py: isCompact ? 0.15 : undefined,
              fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
            }}
          >
            {error}
          </Alert>
        ) : null}

        {loadingLookups || loadingOrder ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack sx={uiLayout.formGridSx} spacing={isPhone ? 0.9 : isTablet ? 1.1 : 2}>
            <Grid container spacing={isPhone ? 0.75 : isTablet ? 0.95 : 1.5}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="اسم الطالب"
                  value={studentName}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid item xs={12} sm={3} md={4}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="رقم الهوية"
                  value={nationalId}
                  InputProps={{ readOnly: true }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              </Grid>

              <Grid item xs={12} sm={3} md={4}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="رقم الجوال"
                  value={studentTel}
                  InputProps={{ readOnly: true }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              </Grid>
            </Grid>

            <FormControl
  sx={uiLayout.withUiSx({
    pl: isPhone ? 1.2 : isTablet ? 1.5 : 0
  }, uiLayout.formFieldSx)}
>
  <FormLabel>نوع البرنامج</FormLabel>

  <RadioGroup sx={uiLayout.radioGroupSx}
    row
    value={programType}
    onChange={(e) => setProgramType(Number(e.target.value))}
  >
    {approvalTypes.map((item) => (
      <FormControlLabel
        key={item.value}
        value={item.value}
        control={<Radio />}
        label={item.label}
      />
    ))}
  </RadioGroup>
</FormControl>

          <FormControl
  sx={uiLayout.withUiSx({
    pl: isPhone ? 1.2 : isTablet ? 1.5 : 0
  }, uiLayout.formFieldSx)}
>
  <FormLabel>نوع الدراسة</FormLabel>

  <RadioGroup sx={uiLayout.radioGroupSx}
    row
    value={studyType}
    onChange={(e) => setStudyType(Number(e.target.value))}
  >
    <FormControlLabel
      value={0}
      control={<Radio />}
      label="حضوري"
    />

    <FormControlLabel
      value={1}
      control={<Radio />}
      label="عن بعد"
    />
  </RadioGroup>
</FormControl>

            <Grid container spacing={isPhone ? 0.8 : isTablet ? 1 : 2}>
              <Grid item xs={12} sm={6} md={6}>
                <FormControl sx={uiLayout.formFieldSx} fullWidth>
                  <InputLabel>فرع الدراسة</InputLabel>
                  <Select
                    value={branchGuid}
                    label="فرع الدراسة"
                    onChange={(e) => setBranchGuid(e.target.value)}
                    MenuProps={compactMenuProps}
                  >
                    {branches.map((item) => (
                      <MenuItem key={item.guid} value={item.guid}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={6}>
                <FormControl sx={uiLayout.formFieldSx} fullWidth>
                  <InputLabel>القطاع التابع له المتدرب</InputLabel>
                  <Select
                    value={sectorGuid}
                    label="القطاع التابع له المتدرب"
                    onChange={(e) => setSectorGuid(e.target.value)}
                    MenuProps={compactMenuProps}
                  >
                    {sectors.map((item) => (
                      <MenuItem key={item.guid} value={item.guid}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {programType === 0 ? (
                <>
                  <Grid item xs={12} sm={6} md={6}>
                    <FormControl sx={uiLayout.formFieldSx} fullWidth>
                      <InputLabel>البرنامج المراد التسجيل به</InputLabel>
                      <Select
                        value={diplomGuid}
                        label="البرنامج المراد التسجيل به"
                        onChange={(e) => setDiplomGuid(e.target.value)}
                        MenuProps={compactMenuProps}
                        disabled={!branchGuid}
                      >
                        {programs.map((item) => (
                          <MenuItem key={item.guid} value={item.guid}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={6}>
                    <FormControl sx={uiLayout.formFieldSx} fullWidth>
                      <InputLabel>الدفعة</InputLabel>
                      <Select
                        value={batchGuid}
                        label="الدفعة"
                        onChange={(e) => setBatchGuid(e.target.value)}
                        MenuProps={compactMenuProps}
                        disabled={!branchGuid}
                      >
                        {batches.map((item) => {
                          const remaining = Number(
                            item.remainingApprovals ?? item.available ?? 0
                          );

                          return (
                            <MenuItem
                              key={item.guid}
                              value={item.guid}
                              disabled={remaining <= 0}
                            >
                              {item.name} — الموافقات: {item.totalApprovals || 0}
                              {` | المستخدم: ${item.usedApprovals || 0}`}
                              {` | المتبقي: ${remaining}`}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              ) : programType === 1 ? (
                <>
                  <Grid item xs={12} sm={6} md={6}>
                    <FormControl sx={uiLayout.formFieldSx} fullWidth>
                      <InputLabel>الدفعة</InputLabel>
                      <Select
                        value={batchGuid}
                        label="الدفعة"
                        onChange={(e) => setBatchGuid(e.target.value)}
                        MenuProps={compactMenuProps}
                        disabled={!branchGuid}
                      >
                        {batches.map((item) => {
                          const remaining = Number(
                            item.remainingApprovals ?? item.available ?? 0
                          );

                          return (
                            <MenuItem
                              key={item.guid}
                              value={item.guid}
                              disabled={remaining <= 0}
                            >
                              {item.name} — الموافقات: {item.totalApprovals || 0}
                              {` | المستخدم: ${item.usedApprovals || 0}`}
                              {` | المتبقي: ${remaining}`}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={6}>
                    <FormControl sx={uiLayout.formFieldSx} fullWidth>
                      <InputLabel>البرنامج المراد التسجيل به</InputLabel>
                      <Select
                        value={diplomGuid}
                        label="البرنامج المراد التسجيل به"
                        onChange={(e) => setDiplomGuid(e.target.value)}
                        MenuProps={compactMenuProps}
                        disabled={!branchGuid || !batchGuid}
                      >
                        {programs.map((item) => (
                          <MenuItem key={item.guid} value={item.guid}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12} sm={6} md={6}>
                  <FormControl sx={uiLayout.formFieldSx} fullWidth>
                    <InputLabel>البرنامج المراد التسجيل به</InputLabel>
                    <Select
                      value={diplomGuid}
                      label="البرنامج المراد التسجيل به"
                      onChange={(e) => setDiplomGuid(e.target.value)}
                      MenuProps={compactMenuProps}
                      disabled={!branchGuid}
                    >
                      {programs.map((item) => (
                        <MenuItem key={item.guid} value={item.guid}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {programType !== 2 && selectedBatch ? (
                <Grid item xs={12}>
                  <Alert
                    severity={selectedBatchRemaining > 0 ? "success" : "error"}
                  >
                    الدفعة: <strong>{selectedBatch.name}</strong>
                    {" — "}الموافقات المحددة: {selectedBatch.totalApprovals || 0}
                    {" — "}المستخدمة: {selectedBatch.usedApprovals || 0}
                    {" — "}المتبقية: <strong>{selectedBatchRemaining}</strong>
                  </Alert>
                </Grid>
              ) : null}

              <Grid item xs={12} sm={6} md={6}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="القائم بالتسجيل"
                  value={currentUserFullName || selectedSeller?.name || ""}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid item xs={12} sm={3} md={3}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="تاريخ بدء الدراسة هـ"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputProps={{
                    readOnly: programType !== 2
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={3} md={3}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="تاريخ نهاية الدراسة هـ"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputProps={{
                    readOnly: programType !== 2
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={3} md={3}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  type="number"
                  label="عدد الساعات"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
              </Grid>

              <Grid
  item
  xs={6}
  sm={3}
  md={3}
  sx={{
   pl: {
  xs: "20px !important",
  sm: "24px !important",
  md: "24px !important"
}
  }}
>
  <FormControlLabel
    control={
      <Radio
        checked={showGregorian}
        onClick={() => setShowGregorian((v) => !v)}
      />
    }
    label="إظهار الميلادي في الموافقة"
  />
</Grid>
            </Grid>

            <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
              fullWidth
              multiline
              minRows={isPhone ? 2 : isTablet ? 3 : 5}
              label="ملاحظات"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {savedOrder ? (
              <Alert severity="success">
                تم حفظ الموافقة رقم {savedOrder.code}
              </Alert>
            ) : null}
          </Stack>
        )}
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
          disabled={saving || loadingLookups || loadingOrder}
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveIcon />
            )
          }
          sx={uiLayout.withUiSx({
            backgroundColor: primaryColor,
            minWidth: isPhone ? 90 : isTablet ? 108 : 140,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            px: isPhone ? 0.7 : isTablet ? 1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          {editMode ? "تعديل" : "حفظ"}
        </Button>

        <Button
          variant="outlined"
          onClick={print}
          disabled={!savedOrder?.orderGuid}
          startIcon={<PrintIcon />}
          sx={uiLayout.withUiSx({
            color: primaryColor,
            borderColor: primaryColor,
            minWidth: isPhone ? 78 : isTablet ? 95 : 130,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            px: isPhone ? 0.7 : isTablet ? 1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          طباعة
        </Button>

        <Button
          onClick={onClose}
          disabled={saving}
          sx={uiLayout.withUiSx({
            color: accentColor,
            fontWeight: 900,
            minHeight: isPhone ? 30 : isTablet ? 34 : undefined,
            px: isPhone ? 0.7 : isTablet ? 1 : undefined,
            fontSize: isPhone ? "0.75rem" : isTablet ? "0.75rem" : undefined
          }, uiLayout.buttonSx)}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudyApprovalDialog;