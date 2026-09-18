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
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const DARK_BORDER = "#67C99D";
const DARK_TEXT = "#9BE0C1";

const getToday = () =>
  new Date()
    .toISOString()
    .slice(0, 10);


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

const extractDateValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return value;
  }

  if (typeof value === "object") {
    const candidates = [
      value.value,
      value.date,
      value.notesDate,
      value.NotesDate,
      value.date_,
      value.Date_,
      value.createdAt,
      value.CreatedAt,
      value.$date
    ];

    for (const candidate of candidates) {
      if (
        candidate !== null &&
        candidate !== undefined &&
        candidate !== value
      ) {
        const extracted =
          extractDateValue(candidate);

        if (extracted) {
          return extracted;
        }
      }
    }
  }

  return null;
};

const toValidDate = (value) => {
  const extracted =
    extractDateValue(value);

  if (!extracted) {
    return null;
  }

  const date =
    extracted instanceof Date
      ? extracted
      : new Date(extracted);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
};

const formatGregorianDate = (
  value
) => {
  const date =
    toValidDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  ).format(date);
};

const escapeCsvValue = (
  value
) => {
  return `"${String(
    value ?? ""
  ).replaceAll('"', '""')}"`;
};

const escapeHtml = (
  value
) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const showError = async (
  message
) => {
  await Swal.fire({
    icon: "error",
    title: "حدث خطأ",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });
};

const AfterSalesReport = () => {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === "dark";
  const surfaces = muiTheme.palette.surfaces || {};
  const darkCard = surfaces.card || "#13251d";
  const darkSection = surfaces.section || "#172b22";
  const darkNested = surfaces.nested || "#1b3328";
  const darkHover = surfaces.hover || "#214333";

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
        localStorage.getItem(
          "user"
        ) || "{}"
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
    const search =
      normalize(searchText);

    return rows.filter((row) => {
      if (
        batchFilter !== "الكل" &&
        row.batchName !== batchFilter
      ) {
        return false;
      }

      if (
        followUserFilter !== "الكل" &&
        row.followUpName !==
          followUserFilter
      ) {
        return false;
      }

      if (
        callStatusFilter !== "الكل" &&
        row.callStatus !==
          callStatusFilter
      ) {
        return false;
      }

      if (
        salesmanFilter !== "الكل" &&
        row.salesmanName !==
          salesmanFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return normalize(
        [
          row.rowNumber,
          formatGregorianDate(
            row.notesDate
          ),
          row.studentName,
          row.studentTel,
          row.diplomName,
          row.batchName,
          row.salesmanName,
          row.followUpName,
          row.notes,
          row.callStatus,
          row.rating,
          row.grade
        ].join(" ")
      ).includes(search);
    });
  }, [
    rows,
    searchText,
    batchFilter,
    followUserFilter,
    callStatusFilter,
    salesmanFilter
  ]);

  const dataGridRows = useMemo(() => {
    return filteredRows.map(
      (row, index) => ({
        id:
          `${row.rowNumber || index}-${index}`,

        rowNumber:
          Number(row.rowNumber || index + 1),

        notesDate:
          toValidDate(
            row.notesDate
          ),

        studentName:
          row.studentName || "",

        studentTel:
          row.studentTel || "",

        diplomName:
          row.diplomName || "",

        batchName:
          row.batchName || "",

        salesmanName:
          row.salesmanName || "",

        followUpName:
          row.followUpName || "",

        callStatus:
          row.callStatus ||
          "لم يتحدد الموقف",

        rating:
          Number(row.rating || 0),

        grade:
          row.grade || "",

        notes:
          row.notes || ""
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
      minWidth: isPhone ? 76 : 96,
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
            color: isDark
              ? DARK_TEXT
              : params.value === "تم الرد"
                ? "#057546"
                : params.value === "لم يتم الرد"
                  ? "#ae1e21"
                  : "#735c00",
            background: isDark
              ? "transparent"
              : params.value === "تم الرد"
                ? "#e6f3ee"
                : params.value === "لم يتم الرد"
                  ? "#fdecec"
                  : "#fff7cc",
            border: isDark
              ? `1px solid ${DARK_BORDER}`
              : "1px solid transparent"
          }}
        >
          {params.value || "لم يتحدد الموقف"}
        </Box>
      )
    };

    const actionColumn = {
      field: "actions",
      headerName: isCompact ? "" : "مشاهدة",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: isPhone ? 42 : isTablet ? 50 : 85,
      minWidth: isPhone ? 42 : isTablet ? 50 : 85,
      maxWidth: isPhone ? 42 : isTablet ? 50 : 85,
      renderCell: (params) => (
        <Tooltip title="عرض التفاصيل">
          <span>
            <IconButton
              disabled={!params.row.notes}
              onClick={() =>
                viewNotes(params.row)
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
              <VisibilityIcon
                sx={{
                  fontSize: isPhone
                    ? 15
                    : isTablet
                      ? 17
                      : 20
                }}
              />
            </IconButton>
          </span>
        </Tooltip>
      )
    };

    if (isPhone) {
      return [
        {
          field: "studentName",
          headerName: "الطالب",
          flex: 1.05,
          minWidth: 92,
          renderCell: (params) =>
            shortStudentName(
              params.row.studentName
            )
        },
        {
          field: "salesmanName",
          headerName: "مندوب البيع",
          flex: 0.85,
          minWidth: 80
        },
        statusColumn,
        {
          field: "rating",
          headerName: "التقييم",
          flex: 0.55,
          minWidth: 55,
          renderCell: (params) =>
            Number(params.value) > 0
              ? `${params.value}/5`
              : "-"
        },
        actionColumn
      ];
    }

    if (isTablet) {
      return [
        {
          field: "notesDate",
          headerName: "التاريخ",
          flex: 0.8,
          minWidth: 90,
          renderCell: (params) =>
            formatGregorianDate(
              params.row.notesDate
            )
        },
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
          field: "diplomName",
          headerName: "الدبلوم/الدورة",
          flex: 1.05,
          minWidth: 115
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
          flex: 0.9,
          minWidth: 95
        },
        statusColumn,
        {
          field: "rating",
          headerName: "التقييم",
          flex: 0.6,
          minWidth: 65,
          renderCell: (params) =>
            Number(params.value) > 0
              ? `${params.value}/5`
              : "-"
        },
        actionColumn
      ];
    }

    return [
      {
        field: "notesDate",
        headerName: "التاريخ",
        type: "date",
        flex: 0.9,
        minWidth: 105,
        renderCell: (params) =>
          formatGregorianDate(
            params.row.notesDate
          )
      },
      {
        field: "rowNumber",
        headerName: "رقم",
        type: "number",
        flex: 0.55,
        minWidth: 70
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        type: "string",
        flex: 1.35,
        minWidth: 140
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        type: "string",
        flex: 1,
        minWidth: 115
      },
      {
        field: "diplomName",
        headerName: "الدبلوم/الدورة",
        type: "string",
        flex: 1.45,
        minWidth: 155
      },
      {
        field: "batchName",
        headerName: "الدفعة",
        type: "string",
        flex: 0.95,
        minWidth: 105
      },
      {
        field: "salesmanName",
        headerName: "مندوب البيع",
        type: "string",
        flex: 1.05,
        minWidth: 120
      },
      {
        field: "followUpName",
        headerName: "القائم بالمتابعة",
        type: "string",
        flex: 1.15,
        minWidth: 130
      },
      statusColumn,
      {
        field: "rating",
        headerName: "التقييم",
        type: "number",
        flex: 0.75,
        minWidth: 90,
        renderCell: (params) =>
          Number(params.value) > 0
            ? `${params.value}/5`
            : "-"
      },
      {
        field: "grade",
        headerName: "التقدير",
        type: "string",
        flex: 0.85,
        minWidth: 95
      },
      {
        field: "notes",
        headerName: "الملاحظات",
        type: "string",
        flex: 1.6,
        minWidth: 140
      },
      actionColumn
    ];
  }, [isPhone, isTablet, isCompact, isDark]);

  const filteredStats = useMemo(() => {
    const rated =
      filteredRows.filter(
        (row) =>
          Number(row.rating) > 0
      );

    const average =
      rated.length === 0
        ? 0
        : rated.reduce(
            (sum, row) =>
              sum +
              Number(
                row.rating || 0
              ),
            0
          ) / rated.length;

    const rounded =
      average > 0
        ? Math.max(
            1,
            Math.min(
              5,
              Math.round(average)
            )
          )
        : 0;

    const grades = {
      5: "ممتاز",
      4: "جيد جدًا",
      3: "جيد",
      2: "مقبول",
      1: "ضعيف",
      0: "غير متاح"
    };

    return {
      count:
        filteredRows.length,

      ratedCount:
        rated.length,

      average,

      grade:
        grades[rounded] ||
        "غير متاح"
    };
  }, [filteredRows]);


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

      const response =
        await fetch(
          `${API_BASE_URL}/api/after-sales-report?${params.toString()}`,
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
            "تعذر تحميل تقرير متابعة العملاء"
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
          "حدث خطأ أثناء تحميل التقرير"
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
    setSearchText("");
    setBatchFilter("الكل");
    setFollowUserFilter("الكل");
    setCallStatusFilter("الكل");
    setSalesmanFilter("الكل");
  };

  const viewNotes = async (
    row
  ) => {
    const notes =
      String(
        row?.notes || ""
      ).trim();

    if (!notes) {
      await Swal.fire({
        icon: "info",
        title: "الملاحظات",
        text:
          "لا توجد ملاحظات لهذا الصف",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      return;
    }

    const lines =
      notes
        .replaceAll("\r\n", "\n")
        .replaceAll("\r", "\n")
        .split("\n")
        .filter((line) =>
          line.trim() !== ""
        );

    const prettyLines =
      lines.map((line) => {
        const clean =
          escapeHtml(
            line.trim()
          );

        if (
          clean.includes(
            "نموذج متابعة ما بعد البيع"
          )
        ) {
          return `
            <div style="
              font-size:20px;
              font-weight:900;
              color:#034d31;
              margin-bottom:12px;
            ">
              ${clean}
            </div>
          `;
        }

        if (
          clean.includes(
            "التقييم"
          )
        ) {
          return `
            <div style="
              padding:10px 12px;
              margin:7px 0;
              border-radius:10px;
              background:#fff7cc;
              color:#735c00;
              font-weight:900;
            ">
              ${clean}
            </div>
          `;
        }

        if (
          clean.includes(
            "ملاحظة إضافية"
          )
        ) {
          return `
            <div style="
              padding:10px 12px;
              margin:7px 0;
              border-radius:10px;
              background:#eef4ff;
              color:#184f90;
              font-weight:700;
            ">
              ${clean}
            </div>
          `;
        }

        return `
          <div style="
            padding:8px 10px;
            margin:5px 0;
            border-radius:9px;
            background:#f7faf8;
            border:1px solid #e5ece8;
          ">
            ${clean}
          </div>
        `;
      }).join("");

    const result =
      await Swal.fire({
        title:
          "تفاصيل الملاحظات",
        html: `
          <div style="
            direction:rtl;
            text-align:right;
            font-family:Cairo,Arial,sans-serif;
            max-height:60vh;
            overflow:auto;
            padding:4px;
          ">
            ${prettyLines}
          </div>
        `,
        width: 850,
        showCancelButton: true,
        confirmButtonText: "نسخ",
        cancelButtonText: "إغلاق",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#6c757d",
        reverseButtons: true
      });

    if (result.isConfirmed) {
      try {
        await navigator.clipboard
          .writeText(notes);

        await Swal.fire({
          icon: "success",
          title: "تم النسخ",
          text:
            "تم نسخ تفاصيل الملاحظات",
          timer: 1300,
          showConfirmButton: false
        });
      } catch {
        await showError(
          "تعذر نسخ الملاحظات"
        );
      }
    }
  };

  const exportToExcel = async () => {
    if (
      filteredRows.length === 0
    ) {
      await Swal.fire({
        icon: "warning",
        title: "لا توجد بيانات",
        text:
          "لا توجد بيانات متاحة للتصدير",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      return;
    }

    try {
      const headers = [
        "التاريخ",
        "رقم",
        "اسم الطالب",
        "رقم الجوال",
        "الدبلوم/الدورة",
        "الدفعة",
        "مندوب البيع",
        "القائم بالمتابعة",
        "حالة الاتصال",
        "التقييم",
        "التقدير",
        "الملاحظات"
      ];

      const csvRows = [
        headers
          .map(escapeCsvValue)
          .join(","),

        ...filteredRows.map(
          (row) =>
            [
              formatGregorianDate(
                row.notesDate
              ),
              row.rowNumber,
              row.studentName,
              row.studentTel,
              row.diplomName,
              row.batchName,
              row.salesmanName,
              row.followUpName,
              row.callStatus,
              row.rating ||
                "",
              row.grade ||
                "",
              row.notes
            ]
              .map(
                escapeCsvValue
              )
              .join(",")
        )
      ];

      const blob =
        new Blob(
          [
            "\uFEFF",
            csvRows.join(
              "\r\n"
            )
          ],
          {
            type:
              "text/csv;charset=utf-8;"
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;
      link.download =
        "تقرير متابعة العملاء.csv";

      document.body.appendChild(
        link
      );

      link.click();
      link.remove();

      URL.revokeObjectURL(
        url
      );

      await Swal.fire({
        icon: "success",
        title: "تم التصدير",
        text:
          "تم تصدير التقرير بنجاح",
        timer: 1400,
        showConfirmButton: false
      });
    } catch (error) {
      await showError(
        error?.message ||
          "تعذر تصدير التقرير"
      );
    }
  };

  const optionsWithAll = (
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
        background: isDark ? muiTheme.palette.background.default : "#f5f8f7",
        color: "text.primary",
        direction: "rtl",

        ...(isDark && {
          "& .MuiButton-root": {
            backgroundColor: "transparent !important",
            backgroundImage: "none !important",
            color: `${DARK_TEXT} !important`,
            border: `1px solid ${DARK_BORDER} !important`,
            boxShadow: "none !important",
            fontWeight: "800 !important"
          },
          "& .MuiButton-root:hover": {
            backgroundColor: "transparent !important",
            color: "#C9F2DF !important",
            borderColor: `${DARK_BORDER} !important`,
            boxShadow: "0 0 0 1px rgba(103,201,157,.16) !important"
          },
          "& .MuiButton-root.Mui-disabled": {
            backgroundColor: "transparent !important",
            color: "rgba(155,224,193,.42) !important",
            borderColor: "rgba(103,201,157,.34) !important",
            boxShadow: "none !important"
          },
          "& .MuiIconButton-root": {
            backgroundColor: "transparent !important",
            backgroundImage: "none !important",
            color: `${DARK_TEXT} !important`,
            border: `1px solid ${DARK_BORDER} !important`,
            boxShadow: "none !important"
          },
          "& .MuiIconButton-root:hover": {
            backgroundColor: "transparent !important",
            color: "#C9F2DF !important"
          },
          "& .MuiOutlinedInput-root": {
            backgroundColor: "transparent !important",
            backgroundImage: "none !important",
            color: `${muiTheme.palette.text.primary} !important`
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: `${DARK_BORDER} !important`
          },
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: `${DARK_BORDER} !important`
          },
          "& .MuiInputLabel-root": {
            color: `${muiTheme.palette.text.secondary} !important`
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: `${DARK_TEXT} !important`
          },
          "& .MuiSelect-icon": {
            color: `${DARK_TEXT} !important`
          },
          "& input[type='date']": {
            colorScheme: "dark"
          }
        })
      }}
    >
      <GlobalStyles
        styles={{
          ...(isDark
            ? {
                ".MuiMenu-paper, .MuiPopover-paper, .MuiDataGrid-panel": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "0 14px 34px rgba(3,20,13,.28) !important"
                },
                ".MuiMenuItem-root": {
                  backgroundColor: "transparent !important",
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".MuiMenuItem-root:hover": {
                  backgroundColor: `${darkHover} !important`
                },
                ".MuiMenuItem-root.Mui-selected": {
                  backgroundColor: "transparent !important",
                  color: `${DARK_TEXT} !important`,
                  borderInlineStart: `2px solid ${DARK_BORDER} !important`
                },

                ".swal2-popup": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`
                },
                ".swal2-title, .swal2-html-container, .swal2-input-label": {
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".swal2-confirm, .swal2-deny, .swal2-cancel": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".swal2-confirm:hover, .swal2-deny:hover, .swal2-cancel:hover": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important"
                },
                ".swal2-textarea, .swal2-select, .swal2-input, #after-sales-rating": {
                  backgroundColor: "transparent !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".swal2-validation-message": {
                  backgroundColor: `${darkSection} !important`,
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".swal2-html-container [style*='background']": {
                  background: "transparent !important",
                  borderColor: `${DARK_BORDER} !important`,
                  color: `${muiTheme.palette.text.primary} !important`
                }
              }
            : {})
        }}
      />

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
                  ? "560px !important"
                  : undefined,
              padding: isPhone
                ? "0.75rem !important"
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

            ".swal2-html-container": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.56rem !important"
                : isTablet
                  ? "0.68rem !important"
                  : undefined
            },

            ".swal2-confirm, .swal2-deny, .swal2-cancel": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.5rem !important"
                : isTablet
                  ? "0.6rem !important"
                  : undefined,
              padding: isPhone
                ? "0.4rem 0.68rem !important"
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
            background: isDark ? darkSection : "rgba(255,255,255,.97)",
            backdropFilter: "blur(14px)",
            color: isDark ? muiTheme.palette.text.primary : "#17372b",
            borderBottom: isDark
              ? `1px solid ${DARK_BORDER}`
              : "1px solid rgba(5,117,70,.12)",
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
                color: isDark ? DARK_TEXT : "#fff",
                background: isDark
                  ? "transparent"
                  : "linear-gradient(135deg,#057546,#034d31)",
                border: isDark ? `1px solid ${DARK_BORDER}` : "none",
                boxShadow: isDark
                  ? "none"
                  : "0 5px 14px rgba(5,117,70,.20)"
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
                color: isDark ? muiTheme.palette.text.primary : "#17372b",
                textAlign: "start",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              تقرير متابعة العملاء
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
            border: isDark
              ? `1px solid ${DARK_BORDER}`
              : "1px solid rgba(5,117,70,0.14)",
            background: isDark ? darkCard : "#fff",
            backgroundImage: "none"
          }}
        >
          <Box
            sx={{
              p: isPhone
                ? 0.7
                : isTablet
                  ? 1
                  : 2.5,

              background: isDark
                ? darkSection
                : "linear-gradient(135deg,#fff 0%,#edf8f3 100%)",

              borderBottom: isDark
                ? `1px solid ${DARK_BORDER}`
                : "1px solid rgba(5,117,70,0.12)"
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: isDark ? muiTheme.palette.text.primary : "#034d31",
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.88rem"
                    : undefined
              }}
            >
              تقرير متابعة العملاء
            </Typography>

            <Typography
              sx={{
                mt: isPhone ? 0.15 : 0.5,
                fontFamily: "Cairo",
                color: isDark ? muiTheme.palette.text.secondary : "#61756d",
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
              عرض تقارير متابعة ما بعد البيع ومتوسط التقييم
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
                    : "repeat(7,minmax(120px,1fr))",
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

              <TextField InputLabelProps={{ shrink: true }}
                size="small"
                label="بحث شامل"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                fullWidth
                sx={uiLayout.withUiSx({
                  gridColumn: isPhone
                    ? "1 / -1"
                    : undefined
                }, uiLayout.formFieldSx)}
              />

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
                {optionsWithAll(
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
                {optionsWithAll(
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
                {optionsWithAll(
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
                {optionsWithAll(
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

              <Box
                sx={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 0.55,
                  pt: isCompact ? 0 : 0.2
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={loadData}
                  disabled={loading}
                  sx={uiLayout.buttonSx}
                >
                  عرض
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadData}
                  disabled={loading}
                  sx={uiLayout.buttonSx}
                >
                  تحديث
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportToExcel}
                  disabled={loading || filteredRows.length === 0}
                  sx={uiLayout.withUiSx({
                    color: isDark ? DARK_TEXT : "#ae1e21",
                    borderColor: isDark ? DARK_BORDER : "#ae1e21"
                  }, uiLayout.buttonSx)}
                >
                  تصدير Excel
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<ClearAllIcon />}
                  onClick={clearFilters}
                  sx={uiLayout.buttonSx}
                >
                  مسح الفلاتر
                </Button>
              </Box>
            </Box>

            <Stack
              direction="row"
              spacing={isPhone ? 0.4 : isTablet ? 0.55 : 0.7}
              sx={{
                mb: isPhone ? 0.65 : isTablet ? 0.75 : 1,
                p: 0.45,
                borderRadius: 1.5,
                border: isDark
                  ? `1px solid ${DARK_BORDER}`
                  : "1px solid rgba(5,117,70,.10)",
                backgroundColor: isDark ? darkCard : "#fff"
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  p: isPhone ? 0.45 : isTablet ? 0.55 : 0.7,
                  borderRadius: isPhone ? 1 : isTablet ? 1.3 : 2,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  lineHeight: 1.5,
                  textAlign: "center",
                  background: isDark ? "transparent" : "#fff9c4",
                  color: isDark ? DARK_TEXT : "#ae1e21",
                  border: isDark ? `1px solid ${DARK_BORDER}` : "none",
                  fontFamily: "Cairo",
                  fontWeight: 900
                }}
              >
                العدد
                <br />
                {filteredStats.count}
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: isPhone ? 0.45 : isTablet ? 0.55 : 0.7,
                  borderRadius: isPhone ? 1 : isTablet ? 1.3 : 2,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  lineHeight: 1.5,
                  textAlign: "center",
                  background: isDark ? "transparent" : "#edf8f3",
                  color: isDark ? DARK_TEXT : "#034d31",
                  border: isDark ? `1px solid ${DARK_BORDER}` : "none",
                  fontFamily: "Cairo",
                  fontWeight: 900
                }}
              >
                متوسط التقييم
                <br />
                {filteredStats.average > 0
                  ? `${filteredStats.average.toFixed(2)}/5 (${filteredStats.grade})`
                  : "غير متاح"}
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: isPhone ? 0.45 : isTablet ? 0.55 : 0.7,
                  borderRadius: isPhone ? 1 : isTablet ? 1.3 : 2,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  lineHeight: 1.5,
                  textAlign: "center",
                  background: isDark ? "transparent" : "#eef4ff",
                  color: isDark ? DARK_TEXT : "#184f90",
                  border: isDark ? `1px solid ${DARK_BORDER}` : "none",
                  fontFamily: "Cairo",
                  fontWeight: 900
                }}
              >
                عدد التقييمات
                <br />
                {filteredStats.ratedCount}
              </Box>
            </Stack>

            <Box
              sx={uiLayout.withUiSx({
                width: "100%",
                height: isPhone
                  ? "calc(100dvh - 455px)"
                  : isTablet
                    ? "calc(100dvh - 390px)"
                    : 700,
                minHeight: isPhone
                  ? 340
                  : isTablet
                    ? 420
                    : 520,
                border: isDark
                  ? `1px solid ${DARK_BORDER}`
                  : "1px solid rgba(5,117,70,0.14)",
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: isDark ? darkSection : "#fff"
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
                        "تقرير متابعة العملاء"
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
                  filterOperatorAfter:
                    "بعد",
                  filterOperatorOnOrAfter:
                    "في أو بعد",
                  filterOperatorBefore:
                    "قبل",
                  filterOperatorOnOrBefore:
                    "في أو قبل",
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
                    backgroundColor: isDark
                      ? darkNested
                      : "#057546",
                    color: isDark
                      ? muiTheme.palette.text.primary
                      : "#fff",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    borderBottom: 0
                  },

                  "& .MuiDataGrid-columnHeader": {
                    backgroundColor: isDark
                      ? darkNested
                      : "#057546"
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
                    color: isDark
                      ? "rgba(103,201,157,.55)"
                      : "rgba(255,255,255,0.55)",
                    visibility: "visible"
                  },

                  "& .MuiDataGrid-cell": {
                    fontFamily: "Cairo",
                    textAlign: "center",
                    justifyContent: "center",
                    whiteSpace: "normal",
                    lineHeight: 1.35,
                    borderColor: isDark
                      ? "rgba(103,201,157,.22)"
                      : "#e6ece9",
                    color: isDark
                      ? muiTheme.palette.text.primary
                      : "inherit",
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
                    backgroundColor: isDark
                      ? darkCard
                      : "#fbfdfc"
                  },

                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: isDark
                      ? darkHover
                      : "#f1faf6"
                  },

                  "& .MuiDataGrid-toolbarContainer": {
                    display: isPhone
                      ? "none"
                      : "flex",
                    p: isTablet ? 0.45 : 1,
                    gap: isTablet ? 0.45 : 1,
                    borderBottom: isDark
                      ? `1px solid ${DARK_BORDER}`
                      : "1px solid #e6ece9",
                    backgroundColor: isDark
                      ? darkSection
                      : "#f8fbf9",
                    direction: "rtl"
                  },

                  "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    color: isDark ? DARK_TEXT : "#057546",
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
                    backgroundColor: isDark ? darkSection : "#fff",
                    color: isDark
                      ? muiTheme.palette.text.primary
                      : "inherit",
                    borderTop: isDark
                      ? `1px solid ${DARK_BORDER}`
                      : undefined,
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

export default AfterSalesReport;