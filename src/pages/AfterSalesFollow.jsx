import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  AppBar,
  Box,
  Button,
  GlobalStyles,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  DataGrid,
  GridToolbar
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const getToday = () =>
  new Date()
    .toISOString()
    .slice(0, 10);

const getMonthAgo = () => {
  const value = new Date();
  value.setMonth(
    value.getMonth() - 1
  );

  return value
    .toISOString()
    .slice(0, 10);
};

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("أ", "ا")
    .replaceAll("إ", "ا")
    .replaceAll("آ", "ا")
    .replaceAll("ة", "ه")
    .replace(/\s+/g, " ");

const shortStudentName = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 2) {
    return parts.join(" ");
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
};

const showError = async (message) => {
  await Swal.fire({
    icon: "error",
    title: "حدث خطأ",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });
};

const showSuccess = async (message) => {
  await Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#057546"
  });
};

const questions = [
  "هل تم الرد على جميع استفساراتك بشكل كافي أثناء التسجيل؟",
  "هل تم تأكيد معلومات الدبلوم: مدة الدراسة وعدد الساعات والسعر؟",
  "هل تم تأكيد أن الدراسة حضوري بجدول محاضرات مرن؟",
  "هل تم تأكيد الالتزام بحضور الاختبارات الفصلية؟",
  "هل تم تأكيد الالتزام بسداد الأقساط الشهرية؟"
];

const AfterSalesFollow = () => {
  const muiTheme = useTheme();

  const isPhone = useMediaQuery(
    muiTheme.breakpoints.down("sm")
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

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const user = useMemo(
    () =>
      JSON.parse(
        localStorage.getItem("user") ||
          "{}"
      ),
    []
  );

  const userGuid = String(
    user?.guid ||
      user?.Guid ||
      ""
  ).trim();

  const [fromDate, setFromDate] =
    useState(getToday());

  const [toDate, setToDate] =
    useState(getToday());

  const [rows, setRows] =
    useState([]);

  const [serverFilters, setServerFilters] =
    useState({
      batches: [],
      followUsers: [],
      salesmen: [],
      callStatuses: []
    });

  const [loading, setLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [batchFilter, setBatchFilter] =
    useState("الكل");

  const [followUserFilter, setFollowUserFilter] =
    useState("الكل");

  const [callStatusFilter, setCallStatusFilter] =
    useState("الكل");

  const [salesmanFilter, setSalesmanFilter] =
    useState("الكل");



  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const selectChecks = [
        batchFilter === "الكل" ||
          row.batchName === batchFilter,

        followUserFilter === "الكل" ||
          row.followUpName === followUserFilter,

        callStatusFilter === "الكل" ||
          row.callStatus === callStatusFilter,

        salesmanFilter === "الكل" ||
          row.salesmanName === salesmanFilter
      ];

      return selectChecks.every(Boolean);
    });
  }, [
    rows,
    batchFilter,
    followUserFilter,
    callStatusFilter,
    salesmanFilter
  ]);

  const dataGridRows = useMemo(() => {
    return filteredRows.map(
      (row, index) => ({
        id:
          row.regDocGuid ||
          `after-sales-${index}`,

        regDocGuid:
          row.regDocGuid || "",

        studentName:
          row.studentName || "",

        studentTel:
          row.studentTel || "",

        nationalId:
          row.nationalId || "",

        diplomName:
          row.diplomName || "",

        branchName:
          row.branchName || "",

        batchName:
          row.batchName || "",

        salesmanName:
          row.salesmanName || "",

        followUpName:
          row.followUpName || "",

        callStatus:
          row.callStatus ||
          "لم يتحدد الموقف",

        studyType:
          row.studyType || "",

        lastNotes:
          row.lastNotes || ""
      })
    );
  }, [filteredRows]);

  const columns = useMemo(() => {
    const statusColumn = {
      field: "callStatus",
      headerName: "الحالة",
      type: "singleSelect",
      valueOptions: [
        "تم الرد",
        "لم يتم الرد",
        "لم يتحدد الموقف"
      ],
      flex: 0.85,
      minWidth: isPhone ? 78 : 100,
      renderCell: (params) => (
        <Box
          component="span"
          sx={{
            px: isPhone ? 0.45 : 0.7,
            py: isPhone ? 0.15 : 0.25,
            borderRadius: 999,
            fontWeight: 900,
            fontSize: isPhone
              ? "0.75rem"
              : isTablet
                ? "0.75rem"
                : undefined,
            color:
              params.value === "تم الرد"
                ? "#057546"
                : params.value === "لم يتم الرد"
                  ? "#ae1e21"
                  : "#735c00",
            background:
              params.value === "تم الرد"
                ? "#e6f3ee"
                : params.value === "لم يتم الرد"
                  ? "#fdecec"
                  : "#fff7cc"
          }}
        >
          {params.value || "لم يتحدد الموقف"}
        </Box>
      )
    };

    const actionColumn = {
      field: "actions",
      headerName: isCompact ? "" : "إجراء",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: isPhone ? 42 : isTablet ? 50 : 90,
      minWidth: isPhone ? 42 : isTablet ? 50 : 90,
      maxWidth: isPhone ? 42 : isTablet ? 50 : 90,
      renderCell: (params) => (
        <Tooltip
          title={
            params.row.lastNotes
              ? `آخر ملاحظة: ${params.row.lastNotes}`
              : "إضافة ملاحظة"
          }
        >
          <IconButton
            onClick={() =>
              openNotesForm(params.row)
            }
            sx={{
              color: "#057546",
              width: isPhone ? 27 : isTablet ? 30 : 36,
              height: isPhone ? 27 : isTablet ? 30 : 36,
              p: 0,
              backgroundColor: isCompact
                ? "#eef8f3"
                : undefined
            }}
          >
            <NoteAddIcon
              sx={{
                fontSize: isPhone
                  ? 15
                  : isTablet
                    ? 17
                    : 20
              }}
            />
          </IconButton>
        </Tooltip>
      )
    };

   if (isPhone) {
  return [
    {
      field: "studentName",
      headerName: "الطالب",
      flex: 1.1,
      minWidth: 95,
      renderCell: (params) =>
        shortStudentName(
          params.row.studentName
        )
    },
    {
      field: "nationalId",
      headerName: "الهوية",
      flex: 0.85,
      minWidth: 82
    },
    {
      field: "salesmanName",
      headerName: "المندوب",
      flex: 0.85,
      minWidth: 80
    },
    statusColumn,
    actionColumn
  ];
}

  if (isTablet) {
  return [
    {
      field: "studentName",
      headerName: "الطالب",
      flex: 1.05,
      minWidth: 115,
      renderCell: (params) =>
        shortStudentName(
          params.row.studentName
        )
    },
    {
      field: "nationalId",
      headerName: "الهوية",
      flex: 0.8,
      minWidth: 90
    },
    {
      field: "diplomName",
      headerName: "التخصص",
      flex: 1,
      minWidth: 110
    },
    {
      field: "salesmanName",
      headerName: "مندوب البيع",
      flex: 0.9,
      minWidth: 95
    },
    {
      field: "followUpName",
      headerName: "المتابع",
      flex: 0.85,
      minWidth: 90
    },
    statusColumn,
    actionColumn
  ];
}

    return [
      {
        field: "studentName",
        headerName: "اسم الطالب",
        type: "string",
        flex: 1.3,
        minWidth: 140
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        type: "string",
        flex: 1,
        minWidth: 120
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        type: "string",
        flex: 1,
        minWidth: 110
      },
      {
        field: "diplomName",
        headerName: "التخصص",
        type: "string",
        flex: 1.3,
        minWidth: 150
      },
      {
        field: "branchName",
        headerName: "الفرع",
        type: "string",
        flex: 1.45,
        minWidth: 140
      },
      {
        field: "batchName",
        headerName: "الدفعة",
        type: "string",
        flex: 1,
        minWidth: 120
      },
      {
        field: "salesmanName",
        headerName: "مندوب البيع",
        type: "string",
        flex: 1,
        minWidth: 125
      },
      {
        field: "followUpName",
        headerName: "القائم بالمتابعة",
        type: "string",
        flex: 1.1,
        minWidth: 135
      },
      statusColumn,
      {
        field: "studyType",
        headerName: "نوع الدراسة",
        type: "string",
        flex: 0.95,
        minWidth: 110
      },
      actionColumn
    ];
  }, [isPhone, isTablet, isCompact]);

  const loadData = async () => {
    if (!userGuid) {
      await showError(
        "بيانات المستخدم غير موجودة"
      );
      return;
    }

    if (!fromDate || !toDate) {
      await showError(
        "برجاء تحديد الفترة"
      );
      return;
    }

    if (fromDate > toDate) {
      await showError(
        "تاريخ البداية يجب ألا يتجاوز تاريخ النهاية"
      );
      return;
    }

    setLoading(true);

    try {
      const params =
        new URLSearchParams({
          userGuid,
          fromDate,
          toDate
        });

      const response = await fetch(
        `${API_BASE_URL}/api/after-sales-follow?${params.toString()}`,
        {
          headers: {
            Accept:
              "application/json"
          }
        }
      );

      const responseText =
        await response.text();

      let result = {};

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          "الخادم لم يرجع استجابة JSON صحيحة"
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر تحميل متابعة ما بعد البيع"
        );
      }

      setRows(
        Array.isArray(
          result?.data?.rows
        )
          ? result.data.rows
          : []
      );

      setServerFilters({
        batches:
          result?.data?.filters
            ?.batches || [],

        followUsers:
          result?.data?.filters
            ?.followUsers || [],

        salesmen:
          result?.data?.filters
            ?.salesmen || [],

        callStatuses:
          result?.data?.filters
            ?.callStatuses || []
      });

    } catch (error) {
      setRows([]);

      await showError(
        error?.message ||
          "حدث خطأ أثناء تحميل البيانات"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setBatchFilter("الكل");
    setFollowUserFilter("الكل");
    setCallStatusFilter("الكل");
    setSalesmanFilter("الكل");
  };

  const openNotesForm = async (row) => {
    if (!row?.regDocGuid) {
      await showError(
        "لا يمكن قراءة رقم الاستمارة"
      );
      return;
    }

    const callResult =
      await Swal.fire({
        icon: "question",
        title:
          "نموذج متابعة ما بعد البيع",
        text:
          "هل تم الرد على الاتصال؟",
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "نعم",
        denyButtonText: "لا",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        denyButtonColor: "#ae1e21",
        reverseButtons: true,
        allowOutsideClick: false
      });

    if (callResult.isDismissed) {
      return;
    }

    if (callResult.isDenied) {
      const noAnswer =
        await Swal.fire({
          title:
            "لم يتم الرد على الاتصال",
          input: "textarea",
          inputLabel:
            "ملاحظة إضافية",
          inputPlaceholder:
            "اكتب ملاحظة اختيارية...",
          showCancelButton: true,
          confirmButtonText: "حفظ",
          cancelButtonText: "إلغاء",
          confirmButtonColor:
            "#057546",
          cancelButtonColor:
            "#ae1e21",
          reverseButtons: true
        });

      if (!noAnswer.isConfirmed) {
        return;
      }

      await saveNotes(
        row.regDocGuid,
        {
          callAnswered: false,
          answers: [],
          rating: null,
          extraNotes:
            noAnswer.value || ""
        }
      );

      return;
    }

    const answers = [];

    for (
      let index = 0;
      index < questions.length;
      index++
    ) {
      const answerResult =
        await Swal.fire({
          icon: "question",
          title:
            `السؤال ${index + 1} من ${questions.length}`,
          text: questions[index],
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "نعم",
          denyButtonText: "لا",
          cancelButtonText: "إلغاء",
          confirmButtonColor:
            "#057546",
          denyButtonColor:
            "#ae1e21",
          reverseButtons: true,
          allowOutsideClick: false
        });

      if (answerResult.isDismissed) {
        return;
      }

      if (
        answerResult.isConfirmed
      ) {
        answers.push({
          answer: true,
          reason: ""
        });

        continue;
      }

      const reasonResult =
        await Swal.fire({
          icon: "warning",
          title:
            "سبب اختيار لا",
          input: "textarea",
          inputLabel:
            questions[index],
          inputPlaceholder:
            "اكتب السبب...",
          inputValidator: (
            value
          ) => {
            if (
              !String(value || "")
                .trim()
            ) {
              return "برجاء كتابة السبب";
            }

            return undefined;
          },
          showCancelButton: true,
          confirmButtonText:
            "متابعة",
          cancelButtonText: "إلغاء",
          confirmButtonColor:
            "#057546",
          cancelButtonColor:
            "#ae1e21",
          reverseButtons: true,
          allowOutsideClick: false
        });

      if (!reasonResult.isConfirmed) {
        return;
      }

      answers.push({
        answer: false,
        reason:
          reasonResult.value || ""
      });
    }

    const ratingResult =
      await Swal.fire({
        title:
          "تقييم خدمة القبول والتسجيل",
        html:
          '<div id="after-sales-rating-root"></div>',
        showCancelButton: true,
        confirmButtonText: "متابعة",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true,
        didOpen: () => {
          const root =
            document.getElementById(
              "after-sales-rating-root"
            );

          if (!root) return;

          root.innerHTML = `
            <div style="font-family:Cairo;margin-bottom:12px">
              اختر تقييمًا من 1 إلى 5
            </div>
            <select id="after-sales-rating"
              style="
                width:100%;
                padding:10px;
                border:1px solid #ccc;
                border-radius:8px;
                font-size:16px;
              ">
              <option value="">اختر التقييم</option>
              <option value="1">1 - ضعيف</option>
              <option value="2">2</option>
              <option value="3">3 - جيد</option>
              <option value="4">4</option>
              <option value="5">5 - ممتاز</option>
            </select>
          `;
        },
        preConfirm: () => {
          const element =
            document.getElementById(
              "after-sales-rating"
            );

          const value =
            Number(element?.value);

          if (
            !Number.isInteger(value) ||
            value < 1 ||
            value > 5
          ) {
            Swal.showValidationMessage(
              "برجاء اختيار التقييم"
            );

            return false;
          }

          return value;
        }
      });

    if (!ratingResult.isConfirmed) {
      return;
    }

    const notesResult =
      await Swal.fire({
        title: "ملاحظة إضافية",
        input: "textarea",
        inputPlaceholder:
          "اكتب ملاحظة اختيارية...",
        showCancelButton: true,
        confirmButtonText:
          "مراجعة وحفظ",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true
      });

    if (!notesResult.isConfirmed) {
      return;
    }

    const confirmation =
      await Swal.fire({
        icon: "question",
        title: "تأكيد الحفظ",
        text:
          "هل تريد حفظ نموذج متابعة ما بعد البيع؟",
        showCancelButton: true,
        confirmButtonText:
          "نعم، حفظ",
        cancelButtonText: "إلغاء",
        confirmButtonColor:
          "#057546",
        cancelButtonColor:
          "#ae1e21",
        reverseButtons: true,
        allowOutsideClick: false
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    await saveNotes(
      row.regDocGuid,
      {
        callAnswered: true,
        answers,
        rating:
          ratingResult.value,
        extraNotes:
          notesResult.value || ""
      }
    );
  };

  const saveNotes = async (
    regDocGuid,
    formData
  ) => {
    Swal.fire({
      title:
        "جارٍ حفظ نموذج المتابعة",
      text:
        "برجاء الانتظار...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () =>
        Swal.showLoading()
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/after-sales-follow/${encodeURIComponent(regDocGuid)}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json"
          },
          body: JSON.stringify({
            userGuid,
            ...formData
          })
        }
      );

      const responseText =
        await response.text();

      let result = {};

      try {
        result = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          "الخادم لم يرجع استجابة JSON صحيحة"
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر حفظ نموذج المتابعة"
        );
      }

      Swal.close();

      await showSuccess(
        result?.message ||
          "تم حفظ نموذج المتابعة بنجاح"
      );

      await loadData();
    } catch (error) {
      Swal.close();

      await showError(
        error?.message ||
          "حدث خطأ أثناء حفظ المتابعة"
      );
    }
  };

  const filterOptions = (
    values
  ) => [
    "الكل",
    ...values
  ];

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        background: "#f5f8f7",
        direction: "rtl"
      }}
    >
      {!isDesktop && (
        <GlobalStyles
          styles={{
            ".MuiDrawer-root": {
              zIndex: "2100 !important"
            },
            ".MuiDrawer-root .MuiBackdrop-root": {
              zIndex: "2099 !important"
            },
            ".MuiDrawer-root .MuiDrawer-paper": {
              zIndex: "2101 !important"
            },

            ".swal2-popup": {
              width: isPhone
                ? "88vw !important"
                : isTablet
                  ? "520px !important"
                  : undefined,
              padding: isPhone
                ? "0.8rem !important"
                : isTablet
                  ? "1rem !important"
                  : undefined
            },

            ".swal2-title": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.82rem !important"
                : isTablet
                  ? "1rem !important"
                  : undefined
            },

            ".swal2-html-container, .swal2-input-label": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.58rem !important"
                : isTablet
                  ? "0.7rem !important"
                  : undefined
            },

            ".swal2-confirm, .swal2-deny, .swal2-cancel": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.52rem !important"
                : isTablet
                  ? "0.62rem !important"
                  : undefined,
              padding: isPhone
                ? "0.42rem 0.7rem !important"
                : undefined
            },

            ".swal2-textarea, .swal2-select": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.58rem !important"
                : isTablet
                  ? "0.68rem !important"
                  : undefined
            }
          }}
        />
      )}

      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            zIndex: 1400,
            background: "rgba(255,255,255,.97)",
            backdropFilter: "blur(14px)",
            color: "#17372b",
            borderBottom:
              "1px solid rgba(5,117,70,.12)",
            direction: "rtl"
          }}
        >
          <Toolbar
            sx={{
              direction: "rtl",
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)"
              },
              px: { xs: 0.75, sm: 1 },
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
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                color: "#fff",
                background:
                  "linear-gradient(135deg,#057546,#034d31)",
                boxShadow:
                  "0 5px 14px rgba(5,117,70,.20)"
              }}
            >
              <MenuRoundedIcon
                sx={{
                  fontSize: {
                    xs: 20,
                    sm: 22
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
                  sm: "0.79rem"
                },
                color: "#17372b",
                textAlign: "start",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              متابعة ما بعد البيع
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      <PageContainer
        component="main"
        sx={{
          ml: 0,
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          minHeight: "100dvh",
          
          direction: "rtl",
          boxSizing: "border-box",
          overflowX: "hidden",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            mt: 0,
            p: 2.5
          },
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: isPhone ? 1.5 : isTablet ? 2 : 4,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.14)",
            background: "#fff"
          }}
        >
          <Box
            sx={{
              p: isPhone
                ? 0.7
                : isTablet
                  ? 1
                  : 2.5,

              background:
                "linear-gradient(135deg,#fff 0%,#edf8f3 100%)",

              borderBottom:
                "1px solid rgba(5,117,70,0.12)"
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#034d31",
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.88rem"
                    : undefined
              }}
            >
              متابعة ما بعد البيع
            </Typography>

            <Typography
              sx={{
                mt: isPhone ? 0.15 : 0.5,
                fontFamily: "Cairo",
                color: "#61756d",
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : undefined,
                display: isPhone
                  ? "none"
                  : "block"
              }}
            >
              متابعة العملاء وإضافة نموذج الاتصال بعد البيع
            </Typography>
          </Box>

          <Box
            sx={{
              p: isPhone
                ? 0.6
                : isTablet
                  ? 0.9
                  : 2.5
            }}
          >
            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns: isPhone
                  ? "repeat(2,minmax(0,1fr))"
                  : isTablet
                    ? "repeat(4,minmax(0,1fr))"
                    : "repeat(7,minmax(120px,1fr)) auto auto auto auto",
                gap: isPhone
                  ? 0.5
                  : isTablet
                    ? 0.7
                    : 1,
                mb: isPhone
                  ? 0.7
                  : isTablet
                    ? 0.9
                    : 2,
                alignItems: "center",

                "& .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined
                },

                "& .MuiInputBase-input": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  py: isPhone
                    ? 0.45
                    : isTablet
                      ? 0.55
                      : undefined
                },

                "& .MuiOutlinedInput-root": {
                  minHeight: isPhone
                    ? 31
                    : isTablet
                      ? 34
                      : undefined,
                  borderRadius: isCompact
                    ? 1.1
                    : undefined
                },

                "& .MuiButton-root": {
                  minHeight: isPhone
                    ? 30
                    : isTablet
                      ? 33
                      : undefined,
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  px: isPhone
                    ? 0.55
                    : isTablet
                      ? 0.8
                      : undefined
                },

                "& .MuiSvgIcon-root": {
                  fontSize: isPhone
                    ? 14
                    : isTablet
                      ? 16
                      : undefined
                }
              }, uiLayout.filterBarSx)}
            >
              <TextField sx={uiLayout.formFieldSx}
                type="date"
                size="small"
                label="من تاريخ"
                value={fromDate}
                onChange={(event) =>
                  setFromDate(event.target.value)
                }
                InputLabelProps={{
                  shrink: true
                }}
                fullWidth
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx}
                type="date"
                size="small"
                label="إلى تاريخ"
                value={toDate}
                onChange={(event) =>
                  setToDate(event.target.value)
                }
                InputLabelProps={{
                  shrink: true
                }}
                fullWidth
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                select
                fullWidth
                size="small"
                label="الدفعة"
                value={batchFilter}
                onChange={(event) =>
                  setBatchFilter(event.target.value)
                }
              >
                {filterOptions(
                  serverFilters.batches
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                select
                fullWidth
                size="small"
                label="القائم بالمتابعة"
                value={followUserFilter}
                onChange={(event) =>
                  setFollowUserFilter(
                    event.target.value
                  )
                }
              >
                {filterOptions(
                  serverFilters.followUsers
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                select
                fullWidth
                size="small"
                label="حالة الاتصال"
                value={callStatusFilter}
                onChange={(event) =>
                  setCallStatusFilter(
                    event.target.value
                  )
                }
              >
                {filterOptions(
                  serverFilters.callStatuses
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                select
                fullWidth
                size="small"
                label="مندوب البيع"
                value={salesmanFilter}
                onChange={(event) =>
                  setSalesmanFilter(
                    event.target.value
                  )
                }
              >
                {filterOptions(
                  serverFilters.salesmen
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                label="بحث شامل"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                sx={uiLayout.withUiSx({
                  gridColumn: isPhone
                    ? "1 / -1"
                    : undefined
                }, uiLayout.formFieldSx)}
              />

              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={loadData}
                disabled={loading}
                sx={uiLayout.withUiSx({
                  background: "#057546"
                }, uiLayout.buttonSx)}
              >
                عرض
              </Button>

              <Button sx={uiLayout.buttonSx}
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
              >
                تحديث
              </Button>

              <Button
                variant="outlined"
                startIcon={<ClearAllIcon />}
                onClick={clearFilters}
                sx={uiLayout.withUiSx({
                  color: "#ae1e21",
                  borderColor: "#ae1e21",
                  gridColumn: isPhone
                    ? "1 / -1"
                    : undefined
                }, uiLayout.buttonSx)}
              >
                مسح الفلاتر
              </Button>

              <Box
                sx={{
                  px: isPhone
                    ? 0.6
                    : isTablet
                      ? 0.8
                      : 1.2,
                  py: isPhone
                    ? 0.5
                    : isTablet
                      ? 0.6
                      : 0.8,
                  borderRadius: isCompact
                    ? 1.1
                    : 2,
                  background: "#fff9c4",
                  color: "#ae1e21",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  gridColumn: isPhone
                    ? "1 / -1"
                    : undefined
                }}
              >
                العدد: {filteredRows.length}
              </Box>
            </Box>

            <Box
              sx={uiLayout.withUiSx({
                width: "100%",
                height: isPhone
                  ? "calc(100dvh - 430px)"
                  : isTablet
                    ? "calc(100dvh - 365px)"
                    : 700,
                minHeight: isPhone
                  ? 350
                  : isTablet
                    ? 430
                    : 520,
                border:
                  "1px solid rgba(5,117,70,0.14)",
                borderRadius: 3,
                overflow: "hidden"
              }, uiLayout.tableContainerSx)}
            >
              <DataGrid
                rows={dataGridRows}
                columns={columns}
                loading={loading}
                disableRowSelectionOnClick
                showToolbar={!isPhone}
                disableColumnMenu={isPhone}
                disableColumnFilter={isPhone}
                rowHeight={
                  isPhone
                    ? 34
                    : isTablet
                      ? 40
                      : undefined
                }
                columnHeaderHeight={
                  isPhone
                    ? 32
                    : isTablet
                      ? 38
                      : undefined
                }
                slots={{
                  toolbar: GridToolbar
                }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: {
                      debounceMs: 350
                    },
                    csvOptions: {
                      utf8WithBom: true,
                      fileName:
                        "متابعة ما بعد البيع"
                    },
                    printOptions: {
                      disableToolbarButton: true
                    }
                  }
                }}
                initialState={{
                  pagination: {
                    paginationModel: {
                      page: 0,
                      pageSize: 25
                    }
                  }
                }}
                pageSizeOptions={[
                  10,
                  25,
                  50,
                  100
                ]}
                localeText={{
                  noRowsLabel:
                    "لا توجد بيانات",
                  noResultsOverlayLabel:
                    "لا توجد نتائج مطابقة",
                  toolbarColumns:
                    "الأعمدة",
                  toolbarFilters:
                    "الفلاتر",
                  toolbarDensity:
                    "الكثافة",
                  toolbarExport:
                    "تصدير",
                  toolbarQuickFilterPlaceholder:
                    "بحث داخل الجريد...",
                  filterPanelAddFilter:
                    "إضافة فلتر",
                  filterPanelRemoveAll:
                    "مسح الكل",
                  filterPanelOperator:
                    "نوع المقارنة",
                  filterPanelColumns:
                    "العمود",
                  filterPanelInputLabel:
                    "القيمة",
                  filterOperatorContains:
                    "يحتوي على",
                  filterOperatorDoesNotContain:
                    "لا يحتوي على",
                  filterOperatorEquals:
                    "يساوي",
                  filterOperatorDoesNotEqual:
                    "لا يساوي",
                  filterOperatorStartsWith:
                    "يبدأ بـ",
                  filterOperatorEndsWith:
                    "ينتهي بـ",
                  filterOperatorIsEmpty:
                    "فارغ",
                  filterOperatorIsNotEmpty:
                    "غير فارغ",
                  filterOperatorIsAnyOf:
                    "واحد من",
                  columnMenuFilter:
                    "فلترة",
                  columnMenuHideColumn:
                    "إخفاء العمود",
                  columnMenuSortAsc:
                    "ترتيب تصاعدي",
                  columnMenuSortDesc:
                    "ترتيب تنازلي",
                  columnMenuUnsort:
                    "إلغاء الترتيب"
                }}
                sx={uiLayout.withUiSx({
                  border: 0,
                  direction: "rtl",
                  fontFamily: "Cairo",

                  "& .MuiDataGrid-main": {
                    overflowX: isCompact
                      ? "hidden"
                      : undefined
                  },

                  "& .MuiDataGrid-virtualScroller": {
                    overflowX: "auto"
                  },

                  "& .MuiDataGrid-scrollbar--horizontal": {
                    display: "block"
                  },

                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor:
                      "#057546",
                    color: "#fff",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    borderBottom: 0
                  },

                  "& .MuiDataGrid-columnHeader": {
                    backgroundColor:
                      "#057546"
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    textAlign: "center",
                    width: "100%",
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined,
                    lineHeight: 1.2
                  },

                  "& .MuiDataGrid-columnSeparator": {
                    color:
                      "rgba(255,255,255,0.55)",
                    visibility: "visible"
                  },

                  "& .MuiDataGrid-cell": {
                    fontFamily: "Cairo",
                    textAlign: "center",
                    justifyContent: "center",
                    whiteSpace: "normal",
                    lineHeight: 1.35,
                    borderColor: "#e6ece9",
                    px: isPhone
                      ? 0.35
                      : isTablet
                        ? 0.55
                        : undefined,
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined
                  },

                  "& .MuiDataGrid-row:nth-of-type(even)": {
                    backgroundColor:
                      "#fbfdfc"
                  },

                  "& .MuiDataGrid-row:hover": {
                    backgroundColor:
                      "#fff3d6"
                  },

                  "& .MuiDataGrid-toolbarContainer": {
                    display: isPhone
                      ? "none"
                      : "flex",
                    p: isTablet ? 0.45 : 1,
                    gap: isTablet ? 0.45 : 1,
                    borderBottom:
                      "1px solid #e6ece9",
                    backgroundColor:
                      "#f8fbf9",
                    direction: "rtl"
                  },

                  "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    color: "#057546",
                    fontSize: isTablet
                      ? "0.75rem"
                      : undefined,
                    minWidth: isTablet
                      ? 0
                      : undefined,
                    px: isTablet
                      ? 0.5
                      : undefined
                  },

                  "& .MuiDataGrid-toolbarContainer .MuiInputBase-input": {
                    fontSize: isTablet
                      ? "0.75rem"
                      : undefined
                  },

                  "& .MuiDataGrid-footerContainer": {
                    direction: "rtl",
                    fontFamily: "Cairo",
                    minHeight: isPhone
                      ? 34
                      : isTablet
                        ? 38
                        : undefined,
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined
                  }
                }, uiLayout.dataGridSx)}
              />
            </Box>
          </Box>
        </Paper>
      </PageContainer>
    </Box></NavigationShell>
  );
};

export default AfterSalesFollow;