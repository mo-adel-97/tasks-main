import { adaptiveInlineStyle } from '../config/themeColors';
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
  CircularProgress,
  GlobalStyles,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const getToday = () => {
  return new Date()
    .toISOString()
    .slice(0, 10);
};

const getMonthAgo = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);

  return date
    .toISOString()
    .slice(0, 10);
};

const formatGregorianDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
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

const normalizeText = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("أ", "ا")
    .replaceAll("إ", "ا")
    .replaceAll("آ", "ا")
    .replaceAll("ة", "ه")
    .replace(/\s+/g, " ");
};

const escapeCsvValue = (value) => {
  return `"${String(value ?? "")
    .replaceAll('"', '""')}"`;
};

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

const VipCustomers = () => {
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

  const user = useMemo(() => {
    return JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  }, []);

  const userGuid = String(
    user?.guid ||
    user?.Guid ||
    ""
  ).trim();

  const [fromDate, setFromDate] =
    useState(getMonthAgo());

  const [toDate, setToDate] =
    useState(getToday());

  const [searchText, setSearchText] =
    useState("");

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [page, setPage] =
    useState(0);

  const [rowsPerPage, setRowsPerPage] =
    useState(25);

  const exportColumns = useMemo(() => [
    {
      key: "id",
      title: "م",
      render: (row) => row.id || "-"
    },
    {
      key: "regOrderCode",
      title: "رقم الطلب",
      render: (row) =>
        row.regOrderCode || "-"
    },
    {
      key: "studentName",
      title: "اسم العميل",
      render: (row) =>
        row.studentName || "-"
    },
    {
      key: "studentTel",
      title: "رقم الجوال",
      render: (row) =>
        row.studentTel || "-"
    },
    {
      key: "nationalId",
      title: "رقم الهوية",
      render: (row) =>
        row.nationalId || "-"
    },
    {
      key: "branchName",
      title: "الفرع",
      render: (row) =>
        row.branchName || "-"
    },
    {
      key: "batchName",
      title: "الدفعة",
      render: (row) =>
        row.batchName || "-"
    },
    {
      key: "diplomName",
      title: "الدبلوم / الدورة",
      render: (row) =>
        row.diplomName || "-"
    },
    {
      key: "registerUserName",
      title: "مسئول التسجيل",
      render: (row) =>
        row.registerUserName || "-"
    },
    {
      key: "orderStatus",
      title: "حالة الطلب",
      render: (row) =>
        row.orderStatus || "غير مؤكد"
    },
    {
      key: "vipNotes",
      title: "ملاحظات VIP",
      render: (row) =>
        row.vipNotes || "-"
    },
    {
      key: "createdAt",
      title: "تاريخ الإضافة",
      render: (row) =>
        formatGregorianDate(
          row.createdAt
        )
    }
  ], []);

  const columns = useMemo(() => {
    if (isPhone) {
      return [
        {
          key: "studentName",
          title: "العميل",
          render: (row) =>
            shortStudentName(
              row.studentName
            ) || "-"
        },
        {
          key: "nationalId",
          title: "الهوية",
          render: (row) =>
            row.nationalId || "-"
        },
        {
          key: "registerUserName",
          title: "المندوب",
          render: (row) =>
            row.registerUserName || "-"
        },
        {
          key: "orderStatus",
          title: "الحالة",
          render: (row) =>
            row.orderStatus || "غير مؤكد"
        }
      ];
    }

    if (isTablet) {
      return [
        {
          key: "studentName",
          title: "العميل",
          render: (row) =>
            shortStudentName(
              row.studentName
            ) || "-"
        },
        {
          key: "studentTel",
          title: "الجوال",
          render: (row) =>
            row.studentTel || "-"
        },
        {
          key: "nationalId",
          title: "الهوية",
          render: (row) =>
            row.nationalId || "-"
        },
        {
          key: "diplomName",
          title: "الدبلوم / الدورة",
          render: (row) =>
            row.diplomName || "-"
        },
        {
          key: "registerUserName",
          title: "مسئول التسجيل",
          render: (row) =>
            row.registerUserName || "-"
        },
        {
          key: "orderStatus",
          title: "الحالة",
          render: (row) =>
            row.orderStatus || "غير مؤكد"
        }
      ];
    }

    return [
      {
        key: "studentName",
        title: "اسم العميل",
        render: (row) =>
          row.studentName || "-"
      },
      {
        key: "studentTel",
        title: "رقم الجوال",
        render: (row) =>
          row.studentTel || "-"
      },
      {
        key: "nationalId",
        title: "رقم الهوية",
        render: (row) =>
          row.nationalId || "-"
      },
      {
        key: "branchName",
        title: "الفرع",
        render: (row) =>
          row.branchName || "-"
      },
      {
        key: "batchName",
        title: "الدفعة",
        render: (row) =>
          row.batchName || "-"
      },
      {
        key: "diplomName",
        title: "الدبلوم / الدورة",
        render: (row) =>
          row.diplomName || "-"
      },
      {
        key: "registerUserName",
        title: "مسئول التسجيل",
        render: (row) =>
          row.registerUserName || "-"
      },
      {
        key: "orderStatus",
        title: "حالة الطلب",
        render: (row) =>
          row.orderStatus || "غير مؤكد"
      },
      {
        key: "vipNotes",
        title: "ملاحظات VIP",
        render: (row) =>
          row.vipNotes || "-"
      },
      {
        key: "createdAt",
        title: "تاريخ الإضافة",
        render: (row) =>
          formatGregorianDate(
            row.createdAt
          )
      }
    ];
  }, [isPhone, isTablet]);

  const filteredRows = useMemo(() => {
    const filter =
      normalizeText(searchText);

    if (!filter) {
      return rows;
    }

    return rows.filter((row) =>
      exportColumns.some((column) =>
        normalizeText(
          column.render(row)
        ).includes(filter)
      )
    );
  }, [
    rows,
    searchText,
    exportColumns
  ]);

  const paginatedRows = useMemo(() => {
    const start =
      page * rowsPerPage;

    return filteredRows.slice(
      start,
      start + rowsPerPage
    );
  }, [
    filteredRows,
    page,
    rowsPerPage
  ]);

  const stats = useMemo(() => {
    const today = getToday();

    return {
      totalCount:
        filteredRows.length,

      todayCount:
        filteredRows.filter(
          (row) =>
            String(
              row.createdAt || ""
            ).slice(0, 10) === today
        ).length,

      withNotesCount:
        filteredRows.filter(
          (row) =>
            String(
              row.vipNotes || ""
            ).trim() !== ""
        ).length
    };
  }, [filteredRows]);

  useEffect(() => {
    setPage(0);
  }, [
    searchText,
    rowsPerPage
  ]);

  const loadData = async () => {
    if (!userGuid) {
      await showError(
        "بيانات المستخدم غير موجودة"
      );
      return;
    }

    if (!fromDate || !toDate) {
      await showError(
        "برجاء تحديد تاريخ البداية والنهاية"
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
        `${API_BASE_URL}/api/vip-customers?${params.toString()}`,
        {
          headers: {
            Accept: "application/json"
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
          "تعذر تحميل عملاء VIP"
        );
      }

      setRows(
        Array.isArray(
          result?.data?.rows
        )
          ? result.data.rows
          : []
      );

      setPage(0);
    } catch (exception) {
      setRows([]);

      await showError(
        exception?.message ||
        "حدث خطأ أثناء تحميل عملاء VIP"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = async () => {
    setSearchText("");
    setFromDate(getMonthAgo());
    setToDate(getToday());

    await loadData();
  };

  const changeStatus = async (
    customer,
    newStatus
  ) => {
    const confirmation =
      await Swal.fire({
        icon: "question",
        title: "تأكيد تغيير الحالة",
        text:
          `هل تريد تغيير حالة العميل إلى: ${newStatus}؟`,
        showCancelButton: true,
        confirmButtonText: "نعم",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    Swal.fire({
      title:
        "جارٍ تحديث حالة العميل",
      text:
        "برجاء الانتظار",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () =>
        Swal.showLoading()
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vip-customers/${customer.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json"
          },
          body: JSON.stringify({
            userGuid,
            status: newStatus
          })
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحديث حالة العميل"
        );
      }

      setRows((current) =>
        current.map((item) =>
          item.id === customer.id
            ? {
                ...item,
                orderStatus:
                  newStatus
              }
            : item
        )
      );

      Swal.close();

      await showSuccess(
        result?.message ||
        "تم تحديث حالة العميل بنجاح"
      );
    } catch (exception) {
      Swal.close();

      await showError(
        exception?.message ||
        "حدث خطأ أثناء تحديث الحالة"
      );
    }
  };

  const exportToExcel = async () => {
    if (filteredRows.length === 0) {
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
      const headers =
        exportColumns.map(
          (column) => column.title
        );

      const csvRows = [
        headers
          .map(escapeCsvValue)
          .join(","),

        ...filteredRows.map((row) =>
          exportColumns
            .map((column) =>
              column.render(row)
            )
            .map(escapeCsvValue)
            .join(",")
        )
      ];

      const blob = new Blob(
        [
          "\uFEFF",
          csvRows.join("\r\n")
        ],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        "عملاء VIP.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      await showSuccess(
        "تم تصدير عملاء VIP بنجاح"
      );
    } catch (exception) {
      await showError(
        exception?.message ||
        "تعذر تصدير البيانات"
      );
    }
  };

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

            ".swal2-confirm, .swal2-cancel": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.5rem !important"
                : isTablet
                  ? "0.6rem !important"
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
            background:
              "rgba(255,255,255,.97)",
            backdropFilter:
              "blur(14px)",
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
              قائمة عملاء VIP
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
            borderRadius: isPhone ? 1.4 : isTablet ? 1.9 : 4,
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
                "linear-gradient(135deg, #ffffff 0%, #edf8f3 100%)",

              borderBottom:
                "1px solid rgba(5,117,70,0.12)"
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#057546",
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.88rem"
                    : undefined
              }}
            >
              قائمة عملاء VIP
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
                    : "auto auto minmax(260px,1fr) auto auto auto",
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
                  setFromDate(
                    event.target.value
                  )
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
                  setToDate(
                    event.target.value
                  )
                }
                InputLabelProps={{
                  shrink: true
                }}
                fullWidth
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField InputLabelProps={{ shrink: true }}
                size="small"
                label="بحث"
                placeholder="الاسم / الهوية / الجوال / الفرع / الدبلوم"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                fullWidth
                sx={uiLayout.withUiSx({
                  gridColumn: isPhone
                    ? "1 / -1"
                    : undefined
                }, uiLayout.formFieldSx)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment:
                    searchText ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSearchText("")
                          }
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                }}
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
                بحث
              </Button>

              <Button sx={uiLayout.buttonSx}
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refreshData}
                disabled={loading}
              >
                تحديث
              </Button>

              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={exportToExcel}
                disabled={
                  loading ||
                  filteredRows.length === 0
                }
                sx={uiLayout.withUiSx({
                  color: "#ae1e21",
                  borderColor: "#ae1e21",
                  gridColumn: isPhone
                    ? "1 / -1"
                    : undefined
                }, uiLayout.buttonSx)}
              >
                تصدير Excel
              </Button>
            </Box>

            <Stack
              direction="row"
              spacing={isPhone ? 0.4 : isTablet ? 0.6 : 2}
              sx={{
                mb: isPhone ? 0.7 : isTablet ? 0.9 : 2.5
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  p: isPhone ? 0.5 : isTablet ? 0.7 : 1.5,
                  border:
                    "1px solid rgba(5,117,70,0.22)",
                  textAlign: "center",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: "#057546",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  lineHeight: 1.5
                }}
              >
                إجمالي عملاء VIP
                <br />
                {stats.totalCount}
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: isPhone ? 0.5 : isTablet ? 0.7 : 1.5,
                  border:
                    "1px solid rgba(212,160,23,0.35)",
                  textAlign: "center",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: "#d4a017",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  lineHeight: 1.5
                }}
              >
                المضافين اليوم
                <br />
                {stats.todayCount}
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: isPhone ? 0.5 : isTablet ? 0.7 : 1.5,
                  border:
                    "1px solid rgba(174,30,33,0.25)",
                  textAlign: "center",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: "#ae1e21",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  lineHeight: 1.5
                }}
              >
                لديهم ملاحظات
                <br />
                {stats.withNotesCount}
              </Box>
            </Stack>

            <Box
              sx={{
                border:
                  "1px solid rgba(5,117,70,0.14)",
                borderRadius: isPhone ? 1.3 : isTablet ? 1.7 : 3,
                overflow: "hidden",
                minHeight: isPhone
                  ? 360
                  : isTablet
                    ? 420
                    : 400
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    minHeight: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center"
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : isCompact ? (
                <Box
                  sx={{
                    display: "grid",
                    gap: isPhone ? 0.4 : 0.6,
                    p: isPhone ? 0.4 : 0.6
                  }}
                >
                  {paginatedRows.length === 0 ? (
                    <Box
                      sx={{
                        minHeight: 300,
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "Cairo",
                        fontWeight: 800,
                        color: "#789",
                        fontSize: isPhone
                          ? "0.75rem"
                          : "0.75rem"
                      }}
                    >
                      لا توجد بيانات
                    </Box>
                  ) : (
                    paginatedRows.map((row) => {
                      const confirmed =
                        normalizeText(
                          row.orderStatus
                        ).includes("مؤكد") &&
                        !normalizeText(
                          row.orderStatus
                        ).includes("غير");

                      return (
                        <Paper
                          key={row.id}
                          variant="outlined"
                          sx={{
                            p: isPhone ? 0.55 : 0.75,
                            borderRadius: isPhone ? 1.1 : 1.4,
                            borderColor:
                              "rgba(5,117,70,.12)",
                            background: "#fff"
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={0.5}
                          >
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontWeight: 950,
                                  fontSize: isPhone
                                    ? "0.75rem"
                                    : "0.75rem",
                                  color: "#1f2d3d",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                {shortStudentName(row.studentName) || "-"}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.1,
                                  fontFamily: "Cairo",
                                  fontSize: isPhone
                                    ? "0.75rem"
                                    : "0.75rem",
                                  color: "#789"
                                }}
                              >
                                <bdi dir="ltr">{row.nationalId || "-"}</bdi> • <bdi dir="ltr">{row.studentTel || "-"}</bdi>
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                px: isPhone ? 0.55 : 0.7,
                                py: isPhone ? 0.15 : 0.2,
                                borderRadius: 999,
                                fontFamily: "Cairo",
                                fontWeight: 900,
                                fontSize: isPhone
                                  ? "0.75rem"
                                  : "0.75rem",
                                whiteSpace: "nowrap",
                                color: confirmed
                                  ? "#1b5e20"
                                  : "#b71c1c",
                                backgroundColor: confirmed
                                  ? "#e8f5e9"
                                  : "#ffebee"
                              }}
                            >
                              {row.orderStatus || "غير مؤكد"}
                            </Box>
                          </Stack>

                          <Box
                            sx={{
                              mt: 0.5,
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(2,minmax(0,1fr))",
                              gap: isPhone ? 0.4 : 0.55
                            }}
                          >
                            <Box>
                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontSize: isPhone
                                    ? "0.75rem"
                                    : "0.75rem",
                                  color: "#8a9993"
                                }}
                              >
                                مسئول التسجيل
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontWeight: 850,
                                  fontSize: isPhone
                                    ? "0.75rem"
                                    : "0.75rem"
                                }}
                              >
                                {row.registerUserName || "-"}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontSize: isPhone
                                    ? "0.75rem"
                                    : "0.75rem",
                                  color: "#8a9993"
                                }}
                              >
                                الدبلوم / الدورة
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontWeight: 850,
                                  fontSize: isPhone
                                    ? "0.75rem"
                                    : "0.75rem"
                                }}
                              >
                                {row.diplomName || "-"}
                              </Typography>
                            </Box>

                            {!isPhone && (
                              <>
                                <Box>
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontSize: "0.75rem",
                                      color: "#8a9993"
                                    }}
                                  >
                                    الفرع
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontWeight: 850,
                                      fontSize: "0.75rem"
                                    }}
                                  >
                                    {row.branchName || "-"}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontSize: "0.75rem",
                                      color: "#8a9993"
                                    }}
                                  >
                                    الدفعة
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontWeight: 850,
                                      fontSize: "0.75rem"
                                    }}
                                  >
                                    {row.batchName || "-"}
                                  </Typography>
                                </Box>
                              </>
                            )}
                          </Box>

                          {row.vipNotes ? (
                            <Typography
                              sx={{
                                mt: 0.5,
                                p: 0.4,
                                borderRadius: 1,
                                background: "#fff8e1",
                                color: "#785500",
                                fontFamily: "Cairo",
                                fontWeight: 800,
                                fontSize: isPhone
                                  ? "0.75rem"
                                  : "0.75rem",
                                lineHeight: 1.4
                              }}
                            >
                              {row.vipNotes}
                            </Typography>
                          ) : null}

                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={0.4}
                            sx={{ mt: 0.5 }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Cairo",
                                fontSize: isPhone
                                  ? "0.75rem"
                                  : "0.75rem",
                                color: "#789"
                              }}
                            >
                              {formatGregorianDate(row.createdAt)}
                            </Typography>

                            <Stack
                              direction="row"
                              spacing={0.25}
                            >
                              <Tooltip title="تغيير الحالة إلى مؤكد">
                                <IconButton
                                  onClick={() =>
                                    changeStatus(
                                      row,
                                      "مؤكد"
                                    )
                                  }
                                  sx={{
                                    width: isPhone ? 25 : 29,
                                    height: isPhone ? 25 : 29,
                                    p: 0,
                                    color: "#057546",
                                    background: "#eef8f3"
                                  }}
                                >
                                  <CheckCircleIcon
                                    sx={{
                                      fontSize: isPhone ? 15 : 17
                                    }}
                                  />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="تغيير الحالة إلى غير مؤكد">
                                <IconButton
                                  onClick={() =>
                                    changeStatus(
                                      row,
                                      "غير مؤكد"
                                    )
                                  }
                                  sx={{
                                    width: isPhone ? 25 : 29,
                                    height: isPhone ? 25 : 29,
                                    p: 0,
                                    color: "#ae1e21",
                                    background: "#fff0f0"
                                  }}
                                >
                                  <CancelIcon
                                    sx={{
                                      fontSize: isPhone ? 15 : 17
                                    }}
                                  />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </Paper>
                      );
                    })
                  )}
                </Box>
              ) : (
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    minWidth: 1650,
                    borderCollapse:
                      "collapse",
                    direction: "rtl",

                    "& th": {
                      px: 1.2,
                      py: 1.3,
                      background:
                        "#f5f7fa",
                      color: "#29332f",
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      position: "sticky",
                      top: 0,
                      zIndex: 2
                    },

                    "& td": {
                      px: 1.2,
                      py: 1.15,
                      borderBottom:
                        "1px solid #e5ebe8",
                      fontFamily: "Cairo",
                      textAlign: "center",
                      whiteSpace: "nowrap"
                    },

                    "& tbody tr:hover": {
                      background: "#f1faf6"
                    }
                  }}
                >
                  <thead>
                    <tr>
                      {columns.map(
                        (column) => (
                          <th key={column.key}>
                            {column.title}
                          </th>
                        )
                      )}

                      <th>الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            columns.length + 1
                          }
                        >
                          لا توجد بيانات
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map(
                        (row) => {
                          const confirmed =
                            normalizeText(
                              row.orderStatus
                            ).includes("مؤكد") &&
                            !normalizeText(
                              row.orderStatus
                            ).includes("غير");

                          return (
                            <tr key={row.id}>
                              {columns.map(
                                (column) => (
                                  <td
                                    key={
                                      column.key
                                    }
                                    style={
                                      adaptiveInlineStyle(column.key ===
                                      "orderStatus"
                                        ? {
                                            background:
                                              confirmed
                                                ? "#005ab4"
                                                : "#ffc107",
                                            color:
                                              confirmed
                                                ? "#fff"
                                                : "#3c2d00",
                                            fontWeight:
                                              900
                                          }
                                        : column.key ===
                                            "vipNotes" &&
                                          row.vipNotes
                                        ? {
                                            background:
                                              "#fff8e1",
                                            color:
                                              "#785500",
                                            fontWeight:
                                              800
                                          }
                                        : undefined)
                                    }
                                  >
                                    {column.render(
                                      row
                                    )}
                                  </td>
                                )
                              )}

                              <td>
                                <Tooltip title="تغيير الحالة إلى مؤكد">
                                  <IconButton
                                    onClick={() =>
                                      changeStatus(
                                        row,
                                        "مؤكد"
                                      )
                                    }
                                    sx={{
                                      color:
                                        "#057546"
                                    }}
                                  >
                                    <CheckCircleIcon />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="تغيير الحالة إلى غير مؤكد">
                                  <IconButton
                                    onClick={() =>
                                      changeStatus(
                                        row,
                                        "غير مؤكد"
                                      )
                                    }
                                    sx={{
                                      color:
                                        "#ae1e21"
                                    }}
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                </Tooltip>
                              </td>
                            </tr>
                          );
                        }
                      )
                    )}
                  </tbody>
                </Box>
              )}
            </Box>

            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={(
                event,
                newPage
              ) =>
                setPage(newPage)
              }
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(
                event
              ) => {
                setRowsPerPage(
                  Number(
                    event.target.value
                  )
                );
                setPage(0);
              }}
              rowsPerPageOptions={[
                10,
                25,
                50,
                100
              ]}
              labelRowsPerPage="عدد الصفوف:"
              labelDisplayedRows={({
                from,
                to,
                count
              }) =>
                `${from}-${to} من ${count}`
              }
              sx={uiLayout.withUiSx({
                direction: "rtl",
                minHeight: isPhone ? 36 : isTablet ? 40 : undefined,
                "& .MuiTablePagination-toolbar": {
                  minHeight: isPhone ? 36 : isTablet ? 40 : undefined,
                  px: isPhone ? 0.4 : isTablet ? 0.6 : undefined
                },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined
                },
                "& .MuiTablePagination-select": {
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined
                },
                "& .MuiIconButton-root": {
                  width: isPhone ? 28 : isTablet ? 31 : undefined,
                  height: isPhone ? 28 : isTablet ? 31 : undefined
                },

              }, uiLayout.tablePaginationSx)}
            />
          </Box>
        </Paper>
      </PageContainer>
    </Box></NavigationShell>
  );
};

export default VipCustomers;
