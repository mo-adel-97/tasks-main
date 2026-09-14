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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ClearIcon from "@mui/icons-material/Clear";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const SIDEBAR_WIDTH = 280;
const DESKTOP_BREAKPOINT = 1600;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const getToday = () =>
  new Date()
    .toISOString()
    .slice(0, 10);

const getMonthAgo = () => {
  const date = new Date();

  date.setMonth(
    date.getMonth() - 1
  );

  return date
    .toISOString()
    .slice(0, 10);
};

const formatGregorianDate = (
  value
) => {
  if (!value) return "-";

  const date =
    new Date(value);

  if (Number.isNaN(
        date.getTime()
      ))
  {
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

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("أ", "ا")
    .replaceAll("إ", "ا")
    .replaceAll("آ", "ا")
    .replaceAll("ة", "ه")
    .replace(/\s+/g, " ");

const escapeCsvValue = (
  value
) => {
  return `"${String(
    value ?? ""
  ).replaceAll('"', '""')}"`;
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

const RegistrationRequestReport = () => {
  const muiTheme = useTheme();

  const isPhone = useMediaQuery(
    muiTheme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    "(min-width:600px) and (max-width:1599px)"
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
    useState(getMonthAgo());

  const [toDate, setToDate] =
    useState(getToday());

  const [registrationUserGuid, setRegistrationUserGuid] =
    useState("الكل");

  const [users, setUsers] =
    useState([]);

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("الكل");

  const [page, setPage] =
    useState(0);

  const [rowsPerPage, setRowsPerPage] =
    useState(25);

  const loadUsers = async () => {
    if (!userGuid) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/registration-request-report/users?userGuid=${encodeURIComponent(userGuid)}`,
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
            "تعذر تحميل مسئولي التسجيل"
        );
      }

      setUsers(
        Array.isArray(
          result?.data
        )
          ? result.data
          : []
      );
    } catch (error) {
      await showError(
        error?.message ||
          "حدث خطأ أثناء تحميل مسئولي التسجيل"
      );
    }
  };

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

      if (
        registrationUserGuid !==
        "الكل"
      ) {
        params.set(
          "registrationUserGuid",
          registrationUserGuid
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/api/registration-request-report?${params.toString()}`,
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
            "تعذر تحميل تقرير طلب التسجيل"
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
    loadUsers();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const search =
      normalize(searchText);

    return rows.filter((row) => {
      if (
        statusFilter !== "الكل" &&
        row.requestStatus !==
          statusFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return normalize(
        [
          row.id,
          row.fullNameAr,
          row.fullNameEn,
          row.mobile,
          row.email,
          row.nationalId,
          row.gender,
          row.region,
          row.requestStatus,
          row.registrationUserName,
          row.createdAt
        ].join(" ")
      ).includes(search);
    });
  }, [
    rows,
    searchText,
    statusFilter
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

  useEffect(() => {
    setPage(0);
  }, [
    searchText,
    statusFilter,
    rowsPerPage
  ]);

  const confirmRequest = async (
    row
  ) => {
    if (
      normalize(
        row.requestStatus
      ).includes("تم التاكيد")
    ) {
      await Swal.fire({
        icon: "info",
        title:
          "تم تأكيد الطلب",
        text:
          "هذا الطلب تم تأكيده من قبل",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      return;
    }

    const confirmation =
      await Swal.fire({
        icon: "question",
        title: "تأكيد الطلب",
        html: `
          <div style="
            direction:rtl;
            text-align:right;
            font-family:Cairo,Arial,sans-serif;
            line-height:2;
          ">
            <div><strong>رقم الطلب:</strong> ${row.id}</div>
            <div><strong>اسم الطالب:</strong> ${row.fullNameAr || "-"}</div>
            <div><strong>رقم الهوية:</strong> ${row.nationalId || "-"}</div>
            <div><strong>رقم الجوال:</strong> ${row.mobile || "-"}</div>
            <hr />
            هل تريد تأكيد الطلب وإنشاء طالب جديد؟
          </div>
        `,
        showCancelButton: true,
        confirmButtonText:
          "نعم، تأكيد وإنشاء الطالب",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true,
        allowOutsideClick: false
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    Swal.fire({
      title:
        "جارٍ تأكيد الطلب",
      text:
        "يتم الآن إنشاء حساب الطالب وتسجيل العملية",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () =>
        Swal.showLoading()
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/registration-request-report/${row.id}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json"
          },
          body: JSON.stringify({
            userGuid
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
            "تعذر تأكيد الطلب"
        );
      }

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "تم بنجاح",
        text:
          result?.message ||
          "تم تأكيد الطلب وإنشاء الطالب بنجاح",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      await loadData();
    } catch (error) {
      Swal.close();

      await showError(
        error?.message ||
          "حدث خطأ أثناء تأكيد الطلب"
      );
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
        "رقم الطلب",
        "الاسم العربي",
        "الاسم الإنجليزي",
        "الجوال",
        "البريد الإلكتروني",
        "رقم الهوية",
        "النوع",
        "المنطقة",
        "الحالة",
        "مسئول التسجيل",
        "تاريخ الإضافة"
      ];

      const csvRows = [
        headers
          .map(escapeCsvValue)
          .join(","),

        ...filteredRows.map(
          (row) =>
            [
              row.id,
              row.fullNameAr,
              row.fullNameEn,
              row.mobile,
              row.email,
              row.nationalId,
              row.gender,
              row.region,
              row.requestStatus,
              row.registrationUserName,
              formatGregorianDate(
                row.createdAt
              )
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
        "تقرير طلب التسجيل.csv";

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

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        background: "#f5f8f7",
        direction: "ltr"
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
                  ? "540px !important"
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
                  : undefined,
              padding: isPhone
                ? "0.4rem 0.7rem !important"
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
            direction: "ltr"
          }}
        >
          <Toolbar
            sx={{
              direction: "ltr",
              minHeight: {
                xs: "50px !important",
                sm: "56px !important"
              },
              px: {
                xs: 0.75,
                sm: 1
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
              sx={{
                width: {
                  xs: 36,
                  sm: 40
                },
                height: {
                  xs: 36,
                  sm: 40
                },
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
                  xs: "0.67rem",
                  sm: "0.79rem"
                },
                color: "#17372b",
                textAlign: "left",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              تقرير طلب التسجيل
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() =>
          setMobileSidebarOpen(false)
        }
      />

      <Box
        component="main"
        sx={{
          ml: 0,
          mt: {
            xs: "50px",
            sm: "56px"
          },
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          minHeight: "100dvh",
          px: {
            xs: 0.45,
            sm: 0.65,
            md: 0.8
          },
          py: {
            xs: 0.45,
            sm: 0.65,
            md: 0.8
          },
          direction: "ltr",
          boxSizing: "border-box",
          overflowX: "hidden",

          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            ml: `${SIDEBAR_WIDTH}px`,
            width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
            mt: 0,
            p: 2.5
          }
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
                  ? "0.72rem"
                  : isTablet
                    ? "0.88rem"
                    : undefined
              }}
            >
              تقرير طلب التسجيل
            </Typography>

            <Typography
              sx={{
                mt: isPhone ? 0.15 : 0.5,
                fontFamily: "Cairo",
                color: "#61756d",
                fontSize: isPhone
                  ? "0.4rem"
                  : isTablet
                    ? "0.5rem"
                    : undefined,
                display: isPhone
                  ? "none"
                  : "block"
              }}
            >
              متابعة طلبات التسجيل وتأكيد الطلب وإنشاء الطالب
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
              sx={{
                display: "grid",
                gridTemplateColumns: isPhone
                  ? "repeat(2,minmax(0,1fr))"
                  : isTablet
                    ? "repeat(4,minmax(0,1fr))"
                    : "auto auto minmax(180px,220px) minmax(150px,180px) minmax(220px,1fr) auto auto auto auto",
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
                    ? "0.4rem"
                    : isTablet
                      ? "0.48rem"
                      : undefined
                },

                "& .MuiInputBase-input": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.44rem"
                    : isTablet
                      ? "0.52rem"
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
                    ? "0.43rem"
                    : isTablet
                      ? "0.51rem"
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
              }}
            >
              <TextField
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
              />

              <TextField
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
              />

              <TextField
                select
                size="small"
                label="مسئول التسجيل"
                value={registrationUserGuid}
                onChange={(event) =>
                  setRegistrationUserGuid(
                    event.target.value
                  )
                }
                fullWidth
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        "& .MuiMenuItem-root": {
                          minHeight: isPhone
                            ? 28
                            : isTablet
                              ? 31
                              : 40,
                          fontFamily: "Cairo",
                          fontSize: isPhone
                            ? "0.43rem"
                            : isTablet
                              ? "0.51rem"
                              : undefined
                        }
                      }
                    }
                  }
                }}
              >
                <MenuItem value="الكل">
                  الكل
                </MenuItem>

                {users.map((item) => (
                  <MenuItem
                    key={item.guid}
                    value={item.guid}
                  >
                    {item.fullName}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="الحالة"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                fullWidth
              >
                <MenuItem value="الكل">
                  الكل
                </MenuItem>

                <MenuItem value="لم يتم التأكيد">
                  لم يتم التأكيد
                </MenuItem>

                <MenuItem value="تم التأكيد">
                  تم التأكيد
                </MenuItem>
              </TextField>

              <TextField
                size="small"
                label="بحث شامل"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                fullWidth
                sx={{
                  gridColumn: isPhone
                    ? "1 / -1"
                    : undefined
                }}
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
                sx={{
                  background: "#057546"
                }}
              >
                بحث
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
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
                sx={{
                  color: "#ae1e21",
                  borderColor: "#ae1e21",
                  gridColumn: isPhone
                    ? "1 / -1"
                    : undefined
                }}
              >
                تصدير Excel
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
                    ? "0.44rem"
                    : isTablet
                      ? "0.52rem"
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
              sx={{
                border:
                  "1px solid rgba(5,117,70,0.14)",
                borderRadius: isPhone
                  ? 1.3
                  : isTablet
                    ? 1.7
                    : 3,
                overflow: "hidden",
                minHeight: isPhone
                  ? 360
                  : isTablet
                    ? 420
                    : 430
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    minHeight: 430,
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
                          ? "0.48rem"
                          : "0.56rem"
                      }}
                    >
                      لا توجد بيانات مطابقة
                    </Box>
                  ) : (
                    paginatedRows.map((row) => {
                      const confirmed =
                        normalize(
                          row.requestStatus
                        ).includes(
                          "تم التاكيد"
                        );

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
                                    ? "0.5rem"
                                    : "0.58rem",
                                  color: "#1f2d3d",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                              >
                                {shortStudentName(row.fullNameAr) || "-"}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.1,
                                  fontFamily: "Cairo",
                                  fontSize: isPhone
                                    ? "0.36rem"
                                    : "0.43rem",
                                  color: "#789"
                                }}
                              >
                                {row.nationalId || "-"} • {row.mobile || "-"}
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
                                  ? "0.34rem"
                                  : "0.41rem",
                                whiteSpace: "nowrap",
                                color: confirmed
                                  ? "#057546"
                                  : "#ae1e21",
                                background: confirmed
                                  ? "#e6f3ee"
                                  : "#fdecec"
                              }}
                            >
                              {row.requestStatus || "لم يتم التأكيد"}
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
                                    ? "0.31rem"
                                    : "0.38rem",
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
                                    ? "0.42rem"
                                    : "0.49rem"
                                }}
                              >
                                {row.registrationUserName || "-"}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontSize: isPhone
                                    ? "0.31rem"
                                    : "0.38rem",
                                  color: "#8a9993"
                                }}
                              >
                                المنطقة
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: "Cairo",
                                  fontWeight: 850,
                                  fontSize: isPhone
                                    ? "0.42rem"
                                    : "0.49rem"
                                }}
                              >
                                {row.region || "-"}
                              </Typography>
                            </Box>

                            {!isPhone && (
                              <>
                                <Box>
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontSize: "0.38rem",
                                      color: "#8a9993"
                                    }}
                                  >
                                    الاسم الإنجليزي
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontWeight: 850,
                                      fontSize: "0.49rem"
                                    }}
                                  >
                                    {row.fullNameEn || "-"}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontSize: "0.38rem",
                                      color: "#8a9993"
                                    }}
                                  >
                                    البريد الإلكتروني
                                  </Typography>
                                  <Typography
                                    sx={{
                                      fontFamily: "Cairo",
                                      fontWeight: 850,
                                      fontSize: "0.49rem",
                                      overflowWrap: "anywhere"
                                    }}
                                  >
                                    {row.email || "-"}
                                  </Typography>
                                </Box>
                              </>
                            )}
                          </Box>

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
                                  ? "0.31rem"
                                  : "0.38rem",
                                color: "#789"
                              }}
                            >
                              طلب #{row.id} • {formatGregorianDate(row.createdAt)}
                            </Typography>

                            <Tooltip
                              title={
                                confirmed
                                  ? "تم تأكيد الطلب"
                                  : "تأكيد الطلب وإنشاء الطالب"
                              }
                            >
                              <span>
                                <IconButton
                                  disabled={confirmed}
                                  onClick={() =>
                                    confirmRequest(row)
                                  }
                                  sx={{
                                    width: isPhone ? 26 : 30,
                                    height: isPhone ? 26 : 30,
                                    p: 0,
                                    color: confirmed
                                      ? undefined
                                      : "#057546",
                                    background: confirmed
                                      ? "#f2f3f3"
                                      : "#eef8f3"
                                  }}
                                >
                                  <CheckCircleIcon
                                    sx={{
                                      fontSize: isPhone ? 15 : 17
                                    }}
                                  />
                                </IconButton>
                              </span>
                            </Tooltip>
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
                    direction: "ltr",

                    "& th": {
                      px: 1.2,
                      py: 1.3,
                      background: "#057546",
                      color: "#fff",
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
                      py: 1.1,
                      borderBottom:
                        "1px solid #e6ece9",
                      fontFamily: "Cairo",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      maxWidth: 260,
                      overflow: "hidden",
                      textOverflow:
                        "ellipsis"
                    },

                    "& tbody tr:nth-of-type(even)": {
                      background: "#fbfdfc"
                    },

                    "& tbody tr:hover": {
                      background: "#eef4ff"
                    }
                  }}
                >
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>الاسم العربي</th>
                      <th>الاسم الإنجليزي</th>
                      <th>الجوال</th>
                      <th>البريد الإلكتروني</th>
                      <th>رقم الهوية</th>
                      <th>النوع</th>
                      <th>المنطقة</th>
                      <th>الحالة</th>
                      <th>مسئول التسجيل</th>
                      <th>تاريخ الإضافة</th>
                      <th>تأكيد الطلب</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedRows.length ===
                    0 ? (
                      <tr>
                        <td colSpan={12}>
                          لا توجد بيانات مطابقة
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map(
                        (row) => {
                          const confirmed =
                            normalize(
                              row.requestStatus
                            ).includes(
                              "تم التاكيد"
                            );

                          return (
                            <tr key={row.id}>
                              <td>
                                {row.id}
                              </td>

                              <td title={row.fullNameAr}>
                                {row.fullNameAr ||
                                  "-"}
                              </td>

                              <td title={row.fullNameEn}>
                                {row.fullNameEn ||
                                  "-"}
                              </td>

                              <td>
                                {row.mobile ||
                                  "-"}
                              </td>

                              <td title={row.email}>
                                {row.email ||
                                  "-"}
                              </td>

                              <td>
                                {row.nationalId ||
                                  "-"}
                              </td>

                              <td>
                                {row.gender ||
                                  "-"}
                              </td>

                              <td>
                                {row.region ||
                                  "-"}
                              </td>

                              <td>
                                <Box
                                  component="span"
                                  sx={{
                                    px: 1.2,
                                    py: 0.45,
                                    borderRadius:
                                      999,
                                    fontWeight:
                                      900,
                                    color:
                                      confirmed
                                        ? "#057546"
                                        : "#ae1e21",
                                    background:
                                      confirmed
                                        ? "#e6f3ee"
                                        : "#fdecec"
                                  }}
                                >
                                  {row.requestStatus ||
                                    "لم يتم التأكيد"}
                                </Box>
                              </td>

                              <td title={row.registrationUserName}>
                                {row.registrationUserName ||
                                  "-"}
                              </td>

                              <td>
                                {formatGregorianDate(
                                  row.createdAt
                                )}
                              </td>

                              <td>
                                <Tooltip
                                  title={
                                    confirmed
                                      ? "تم تأكيد الطلب"
                                      : "تأكيد الطلب وإنشاء الطالب"
                                  }
                                >
                                  <span>
                                    <IconButton
                                      disabled={
                                        confirmed
                                      }
                                      onClick={() =>
                                        confirmRequest(
                                          row
                                        )
                                      }
                                      sx={{
                                        color:
                                          confirmed
                                            ? undefined
                                            : "#057546"
                                      }}
                                    >
                                      <CheckCircleIcon />
                                    </IconButton>
                                  </span>
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
              rowsPerPage={
                rowsPerPage
              }
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
              sx={{
                direction: "ltr",
                minHeight: isPhone ? 36 : isTablet ? 40 : undefined,
                "& .MuiTablePagination-toolbar": {
                  minHeight: isPhone ? 36 : isTablet ? 40 : undefined,
                  px: isPhone ? 0.4 : isTablet ? 0.6 : undefined
                },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.38rem"
                    : isTablet
                      ? "0.46rem"
                      : undefined
                },
                "& .MuiTablePagination-select": {
                  fontSize: isPhone
                    ? "0.4rem"
                    : isTablet
                      ? "0.48rem"
                      : undefined
                },
                "& .MuiIconButton-root": {
                  width: isPhone ? 28 : isTablet ? 31 : undefined,
                  height: isPhone ? 28 : isTablet ? 31 : undefined
                },

              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default RegistrationRequestReport;
