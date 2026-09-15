import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useEffect,
  useMemo,
  useRef,
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
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const getToday = () =>
  new Date()
    .toISOString()
    .slice(0, 10);


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
    const possibleValues = [
      value.value,
      value.date,
      value.regDate,
      value.RegDate,
      value.date_,
      value.Date_,
      value.orderDate,
      value.OrderDate,
      value.createdAt,
      value.CreatedAt,
      value.$date
    ];

    for (const candidate of possibleValues) {
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

    const year = Number(
      value.year ??
      value.Year ??
      value.y
    );

    const month = Number(
      value.month ??
      value.Month ??
      value.m
    );

    const day = Number(
      value.day ??
      value.Day ??
      value.d
    );

    if (
      Number.isInteger(year) &&
      Number.isInteger(month) &&
      Number.isInteger(day)
    ) {
      return new Date(
        year,
        month - 1,
        day
      );
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

const escapeCsvValue = (
  value
) => {
  return `"${String(
    value ?? ""
  ).replaceAll('"', '""')}"`;
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

const TrainingAgreementsFollow = () => {
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

  const [loading, setLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("الكل");

  const [salesmanFilter, setSalesmanFilter] =
    useState("الكل");



  const statusFilterInitialized =
    useRef(false);

  const salesmen = useMemo(() => {
    return rows
      .map((row) =>
        String(
          row.salesmanName || ""
        ).trim()
      )
      .filter(Boolean)
      .filter(
        (value, index, array) =>
          array.indexOf(value) === index
      )
      .sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const search =
      normalize(searchText);

    return rows.filter((row) => {
      if (
        salesmanFilter !== "الكل" &&
        row.salesmanName !== salesmanFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return normalize(
        [
          row.regDocCode,
          formatGregorianDate(row.regDate),
          row.branchName,
          row.studentName,
          row.studentTel,
          row.nationalId,
          row.registeredDays,
          row.batchName,
          row.salesmanName
        ].join(" ")
      ).includes(search);
    });
  }, [
    rows,
    searchText,
    salesmanFilter
  ]);

  const dataGridRows = useMemo(() => {
    return filteredRows.map(
      (row, index) => ({
        id:
          row.regDocGuid ||
          row.regDocCode ||
          `row-${index}`,

        regDocCode:
          row.regDocCode || "",

        regDate:
          toValidDate(
            row.regDate
          ),

        branchName:
          row.branchName || "",

        studentName:
          row.studentName || "",

        studentTel:
          row.studentTel || "",

        nationalId:
          row.nationalId || "",

        registeredDays:
          Number(
            row.registeredDays || 0
          ),

        batchName:
          row.batchName || "",

        salesmanName:
          row.salesmanName || ""
      })
    );
  }, [filteredRows]);

  const columns = useMemo(() => {
    if (isPhone) {
      return [
        {
          field: "studentName",
          headerName: "الطالب",
          flex: 1.15,
          minWidth: 105,
          renderCell: (params) =>
            shortStudentName(
              params.row.studentName
            )
        },
        {
          field: "nationalId",
          headerName: "الهوية",
          flex: 0.9,
          minWidth: 90
        },
        {
          field: "registeredDays",
          headerName: "منذ",
          type: "number",
          flex: 0.55,
          minWidth: 55,
          renderCell: (params) =>
            `${params.row.registeredDays || 0} يوم`
        },
        {
          field: "salesmanName",
          headerName: "المندوب",
          flex: 0.9,
          minWidth: 85
        }
      ];
    }

    if (isTablet) {
      return [
        {
          field: "studentName",
          headerName: "اسم الطالب",
          flex: 1.2,
          minWidth: 125,
          renderCell: (params) =>
            shortStudentName(
              params.row.studentName
            )
        },
        {
          field: "nationalId",
          headerName: "رقم الهوية",
          flex: 0.9,
          minWidth: 100
        },
        {
          field: "branchName",
          headerName: "الفرع",
          flex: 1.1,
          minWidth: 120
        },
        {
          field: "registeredDays",
          headerName: "تسجيل منذ",
          type: "number",
          flex: 0.65,
          minWidth: 75,
          renderCell: (params) =>
            `${params.row.registeredDays || 0} يوم`
        },
        {
          field: "salesmanName",
          headerName: "مندوب البيع",
          flex: 0.9,
          minWidth: 100
        }
      ];
    }

    return [
      {
        field: "regDocCode",
        headerName: "رقم الاستمارة",
        type: "string",
        flex: 0.8,
        minWidth: 105
      },
      {
        field: "regDate",
        headerName: "التاريخ",
        type: "date",
        flex: 0.85,
        minWidth: 110,
        renderCell: (params) =>
          formatGregorianDate(
            params.row.regDate
          )
      },
      {
        field: "branchName",
        headerName: "الفرع",
        type: "string",
        flex: 1.45,
        minWidth: 140
      },
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
        flex: 0.95,
        minWidth: 115
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        type: "string",
        flex: 0.95,
        minWidth: 110
      },
      {
        field: "registeredDays",
        headerName: "تسجيل منذ",
        type: "number",
        flex: 0.7,
        minWidth: 90,
        renderCell: (params) =>
          `${params.row.registeredDays || 0} يوم`
      },
      {
        field: "batchName",
        headerName: "الدفعة",
        type: "string",
        flex: 0.9,
        minWidth: 110
      },
      {
        field: "salesmanName",
        headerName: "مندوب البيع",
        type: "string",
        flex: 0.95,
        minWidth: 120
      }
    ];
  }, [isPhone, isTablet]);


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
        statusFilter ===
        "تم التوقيع"
      ) {
        params.set(
          "contractStatus",
          "signed"
        );
      }
      else if (
        statusFilter ===
        "لم يتم التوقيع"
      ) {
        params.set(
          "contractStatus",
          "not-signed"
        );
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/training-agreements-follow?${params.toString()}`,
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
            "تعذر تحميل متابعة اتفاقيات التدريب"
        );
      }

      setRows(
        Array.isArray(
          result?.data?.rows
        )
          ? result.data.rows
          : []
      );

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

  useEffect(() => {
    if (!statusFilterInitialized.current) {
      statusFilterInitialized.current = true;
      return;
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("الكل");
    setSalesmanFilter("الكل");
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
        "رقم الاستمارة",
        "التاريخ",
        "الفرع",
        "اسم الطالب",
        "رقم الجوال",
        "رقم الهوية",
        "تسجيل منذ",
        "الدفعة",
        "مندوب البيع"
      ];

      const csvRows = [
        headers
          .map(escapeCsvValue)
          .join(","),

        ...filteredRows.map(
          (row) =>
            [
              row.regDocCode,
              formatGregorianDate(
                row.regDate
              ),
              row.branchName,
              row.studentName,
              row.studentTel,
              row.nationalId,
              row.registeredDays,
              row.batchName,
              row.salesmanName
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
        "متابعة اتفاقيات التدريب.csv";

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
              متابعة اتفاقيات التدريب
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
              متابعة اتفاقيات التدريب
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
              متابعة حالة توقيع الاتفاقيات بدون كشف الحساب أو فتح ملفات الاتفاقيات
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
                    : "repeat(5,minmax(120px,1fr)) auto auto auto auto auto",
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

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                select
                size="small"
                label="حالة الاتفاقية"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
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
                <MenuItem value="تم التوقيع">
                  تم التوقيع
                </MenuItem>
                <MenuItem value="لم يتم التوقيع">
                  لم يتم التوقيع
                </MenuItem>
              </TextField>

              <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                select
                size="small"
                label="مندوب البيع"
                value={salesmanFilter}
                onChange={(event) =>
                  setSalesmanFilter(
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

                {salesmen.map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField InputLabelProps={{ shrink: true }}
                size="small"
                label="بحث شامل"
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

              <Button
                variant="outlined"
                startIcon={<ClearAllIcon />}
                onClick={clearFilters}
                sx={uiLayout.withUiSx({
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
                  ? "calc(100dvh - 365px)"
                  : isTablet
                    ? "calc(100dvh - 330px)"
                    : 700,
                minHeight: isPhone
                  ? 360
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
                        "متابعة اتفاقيات التدريب"
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
                  columnMenuLabel:
                    "القائمة",
                  columnMenuShowColumns:
                    "إظهار الأعمدة",
                  columnMenuManageColumns:
                    "إدارة الأعمدة",
                  columnMenuFilter:
                    "فلترة",
                  columnMenuHideColumn:
                    "إخفاء العمود",
                  columnMenuUnsort:
                    "إلغاء الترتيب",
                  columnMenuSortAsc:
                    "ترتيب تصاعدي",
                  columnMenuSortDesc:
                    "ترتيب تنازلي",
                  footerRowSelected: (
                    count
                  ) =>
                    `${count} صف محدد`,
                  footerTotalRows:
                    "إجمالي الصفوف:"
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
                    color: "#ffffff",
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
                    lineHeight: 1.25
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
                    display: isPhone ? "none" : "flex",
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

                  "& .MuiDataGrid-filterForm": {
                    direction: "rtl",
                    fontFamily: "Cairo",
                    fontSize: isTablet
                      ? "0.75rem"
                      : undefined
                  },

                  "& .MuiDataGrid-panel": {
                    maxWidth: isCompact
                      ? "calc(100vw - 20px)"
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
                  },

                  "& .MuiTablePagination-root": {
                    fontFamily: "Cairo"
                  },

                  "& .MuiDataGrid-overlay": {
                    fontFamily: "Cairo"
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

export default TrainingAgreementsFollow;