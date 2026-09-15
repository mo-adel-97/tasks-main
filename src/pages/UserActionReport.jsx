import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";




const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f7fbf9";

const pad2 = (value) =>
  String(value).padStart(2, "0");

const todayLocal = () => {
  const now = new Date();

  return [
    now.getFullYear(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate())
  ].join("-");
};

const normalizeColumn = (value) =>
  String(value || "")
    .replace(/[\s_.\-]/g, "")
    .toLowerCase();

const friendlyCaption = (column) => {
  const key = normalizeColumn(column);

  const map = {
    // بيانات الحركة
    actiondate: "تاريخ الحركة",
    date: "التاريخ",
    date_: "التاريخ",
    actiontime: "وقت الحركة",
    time: "الوقت",
    time_: "الوقت",

    // المستخدم
    fullname: "اسم المستخدم",
    full_name: "اسم المستخدم",
    username: "اسم المستخدم",
    userfullname: "اسم المستخدم",
    userfull_name: "اسم المستخدم",
    userguid: "معرّف المستخدم",
    user_guid: "معرّف المستخدم",
    usercode: "كود المستخدم",

    // الإجراء / الشاشة
    actionreason: "سبب الإجراء",
    action_reason: "سبب الإجراء",
    notes: "نوع الإجراء",
    notes_: "نوع الإجراء",
    actioncode: "كود العملية",
    action_code: "كود العملية",
    actionguid: "معرّف العملية",
    action_guid: "معرّف العملية",
    actiontypeguid: "معرّف نوع العملية",
    action_type_guid: "معرّف نوع العملية",
    actionname: "اسم العملية",
    formname: "اسم الشاشة",
    form_name: "اسم الشاشة",
    name: "اسم الشاشة",

    // بيانات الجهاز والاتصال - نفس الأعمدة الظاهرة في الديسكتوب
    device: "تاريخ / جهاز التنفيذ",
    devicedate: "تاريخ الجهاز",
    device_date: "تاريخ الجهاز",

    sql: "رقم جلسة SQL",
    sqlid: "رقم جلسة SQL",
    sql_id: "رقم جلسة SQL",
    sqlspid: "رقم جلسة SQL",
    sql_spid: "رقم جلسة SQL",
    spid: "رقم جلسة SQL",
    sessionid: "رقم جلسة SQL",

    sqll: "مستخدم SQL",
    sqllogin: "مستخدم SQL",
    sql_login: "مستخدم SQL",
    sqlloginname: "مستخدم SQL",
    sql_login_name: "مستخدم SQL",
    loginname: "مستخدم SQL",

    programname: "اسم البرنامج",
    program_name: "اسم البرنامج",
    applicationname: "اسم البرنامج",

    ipadd: "عنوان IP",
    ipaddress: "عنوان IP",
    ip_address: "عنوان IP",
    clientip: "عنوان IP",
    client_ip: "عنوان IP",

    machin: "اسم الجهاز",
    machine: "اسم الجهاز",
    machinename: "اسم الجهاز",
    machine_name: "اسم الجهاز",
    hostname: "اسم الجهاز",
    host_name: "اسم الجهاز",

    // حقول شائعة إضافية من تقارير النشاط
    code: "الكود",
    guid: "المعرّف",
    id: "الرقم",
    typeguid: "معرّف النوع",
    type_guid: "معرّف النوع",
    actiontype: "نوع العملية",
    action_type: "نوع العملية",
    status: "الحالة",
    isuse: "الحالة",
    branchname: "الفرع",
    branch_name: "الفرع",
    branchguid: "معرّف الفرع",
    branch_guid: "معرّف الفرع"
  };

  if (map[key]) {
    return map[key];
  }

  // التعامل مع أسماء مكررة أضاف لها الكنترولر __2 / __3
  const withoutDuplicateSuffix =
    String(column || "").replace(/__\d+$/, "");

  const baseKey = normalizeColumn(withoutDuplicateSuffix);

  if (map[baseKey]) {
    return map[baseKey];
  }

  // لا نخفي أي عمود غير معروف؛ نظهر اسمه كما رجع من الإجراء المخزن.
  return withoutDuplicateSuffix || column;
};

const formatCell = (column, value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const key = normalizeColumn(column);

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  ) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      if (
        key.includes("time") &&
        !key.includes("date")
      ) {
        return date.toLocaleTimeString(
          "en-GB",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          }
        );
      }

      return date.toLocaleDateString(
        "en-GB"
      );
    }
  }

  return String(value);
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");


const getRowValueByKeys = (row, keys = []) => {
  if (!row || typeof row !== "object") {
    return "";
  }

  const rowEntries = Object.entries(row);

  for (const wanted of keys) {
    const wantedKey = normalizeColumn(wanted);

    const found = rowEntries.find(
      ([key]) =>
        normalizeColumn(key) === wantedKey
    );

    if (found) {
      return found[1] ?? "";
    }
  }

  return "";
};

const uniqueSorted = (values) =>
  Array.from(
    new Set(
      values
        .map((value) =>
          String(value ?? "").trim()
        )
        .filter(Boolean)
    )
  ).sort((a, b) =>
    a.localeCompare(b, "ar")
  );

export default function UserActionReport() {
  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [fromDate, setFromDate] =
    useState(todayLocal());

  const [toDate, setToDate] =
    useState(todayLocal());

  const [loading, setLoading] =
    useState(false);

  const [searched, setSearched] =
    useState(false);

  const [columns, setColumns] =
    useState([]);

  const [columnCaptions, setColumnCaptions] =
    useState({});

  const [rows, setRows] =
    useState([]);


  const [filterText, setFilterText] =
    useState("");

  const [filterUser, setFilterUser] =
    useState("");

  const [filterAction, setFilterAction] =
    useState("");

  const [filterScreen, setFilterScreen] =
    useState("");

  const [filterDevice, setFilterDevice] =
    useState("");

  const [filterIp, setFilterIp] =
    useState("");

  const [showAdvancedFilters, setShowAdvancedFilters] =
    useState(true);


  const [columnFilters, setColumnFilters] =
    useState({});

  const displayColumns = useMemo(
    () => Array.isArray(columns) ? columns : [],
    [columns]
  );


  const getColumnCaption = (column) =>
    columnCaptions?.[column] ||
    friendlyCaption(column);

  const dynamicFilterColumns = useMemo(
    () =>
      displayColumns.map((column) => ({
        key: column,
        caption: getColumnCaption(column)
      })),
    [displayColumns, columnCaptions]
  );


  const filterOptions = useMemo(() => {
    return {
      users: uniqueSorted(
        rows.map((row) =>
          getRowValueByKeys(row, [
            "FullName",
            "UserFullName",
            "UserName",
            "اسم المستخدم"
          ])
        )
      ),

      actions: uniqueSorted(
        rows.map((row) =>
          getRowValueByKeys(row, [
            "Notes",
            "Notes_",
            "ActionName",
            "نوع الإجراء"
          ])
        )
      ),

      screens: uniqueSorted(
        rows.map((row) =>
          getRowValueByKeys(row, [
            "Name",
            "FormName",
            "ActionName",
            "اسم الشاشة"
          ])
        )
      ),

      devices: uniqueSorted(
        rows.map((row) =>
          getRowValueByKeys(row, [
            "MachineName",
            "Machine",
            "Device",
            "اسم الجهاز"
          ])
        )
      )
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const textValue =
      filterText.trim().toLowerCase();

    const ipValue =
      filterIp.trim().toLowerCase();

    return rows.filter((row) => {
      const userValue = String(
        getRowValueByKeys(row, [
          "FullName",
          "UserFullName",
          "UserName",
          "اسم المستخدم"
        ])
      ).trim();

      const actionValue = String(
        getRowValueByKeys(row, [
          "Notes",
          "Notes_",
          "ActionName",
          "نوع الإجراء"
        ])
      ).trim();

      const screenValue = String(
        getRowValueByKeys(row, [
          "Name",
          "FormName",
          "ActionName",
          "اسم الشاشة"
        ])
      ).trim();

      const deviceValue = String(
        getRowValueByKeys(row, [
          "MachineName",
          "Machine",
          "Device",
          "اسم الجهاز"
        ])
      ).trim();

      const ipCell = String(
        getRowValueByKeys(row, [
          "IpAddress",
          "IPAdd",
          "IP",
          "ip",
          "عنوان IP"
        ])
      ).trim();

      if (
        filterUser &&
        userValue !== filterUser
      ) {
        return false;
      }

      if (
        filterAction &&
        actionValue !== filterAction
      ) {
        return false;
      }

      if (
        filterScreen &&
        screenValue !== filterScreen
      ) {
        return false;
      }

      if (
        filterDevice &&
        deviceValue !== filterDevice
      ) {
        return false;
      }

      if (
        ipValue &&
        !ipCell.toLowerCase().includes(ipValue)
      ) {
        return false;
      }

      if (textValue) {
        const rowText =
          Object.values(row)
            .map((value) =>
              String(value ?? "")
                .toLowerCase()
            )
            .join(" ");

        if (!rowText.includes(textValue)) {
          return false;
        }
      }

      for (const [column, filterValue] of Object.entries(columnFilters)) {
        const wanted = String(filterValue ?? "")
          .trim()
          .toLowerCase();

        if (!wanted) {
          continue;
        }

        const cellValue = String(
          row?.[column] ?? ""
        ).toLowerCase();

        if (!cellValue.includes(wanted)) {
          return false;
        }
      }

      return true;
    });
  }, [
    rows,
    filterText,
    filterUser,
    filterAction,
    filterScreen,
    filterDevice,
    filterIp,
    columnFilters
  ]);

  const clearAdvancedFilters = () => {
    setFilterText("");
    setFilterUser("");
    setFilterAction("");
    setFilterScreen("");
    setFilterDevice("");
    setFilterIp("");
    setColumnFilters({});
  };

  const hasActiveFilters =
    Boolean(
      filterText ||
      filterUser ||
      filterAction ||
      filterScreen ||
      filterDevice ||
      filterIp ||
      Object.values(columnFilters).some(
        (value) =>
          String(value ?? "").trim() !== ""
      )
    );

  const search = async () => {
    if (!fromDate || !toDate) {
      await Swal.fire({
        icon: "warning",
        title: "حدد الفترة",
        text: "برجاء اختيار الفترة من وإلى"
      });
      return;
    }

    if (toDate < fromDate) {
      await Swal.fire({
        icon: "warning",
        title: "الفترة غير صحيحة",
        text:
          "الفترة إلى يجب أن تكون أكبر من أو تساوي الفترة من"
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/user-action-report/search`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            fromDate:
              `${fromDate}T00:00:00`,
            toDate:
              `${toDate}T00:00:00`
          })
        }
      );

      const raw =
        await response.text();

      let result = null;

      try {
        result =
          raw ? JSON.parse(raw) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          [
            result?.message,
            result?.error,
            result?.detail
          ]
            .filter(Boolean)
            .join(" — ") ||
            raw ||
            "تعذر تحميل التقرير"
        );
      }

      setColumns(
        result?.data?.columns || []
      );

      setColumnCaptions(
        result?.data?.columnCaptions || {}
      );

      setRows(
        result?.data?.rows || []
      );

      setSearched(true);
    } catch (error) {
      setColumns([]);
      setColumnCaptions({});
      setRows([]);
      setSearched(true);

      await Swal.fire({
        icon: "error",
        title:
          "تعذر تحميل نشاط المستخدمين",
        text:
          error?.message ||
          "تعذر تحميل التقرير"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!filteredRows.length) {
      Swal.fire({
        icon: "info",
        title: "لا توجد بيانات",
        text:
          "اعرض التقرير أولًا ثم قم بالتصدير"
      });
      return;
    }

    /*
     * تصدير Excel بدون مكتبات إضافية:
     * Excel يفتح HTML Table بصيغة .xls مباشرة.
     */
    const head = displayColumns
      .map(
        (column) =>
          `<th>${escapeHtml(
            getColumnCaption(column)
          )}</th>`
      )
      .join("");

    const body = filteredRows
      .map(
        (row) =>
          `<tr>${displayColumns
            .map(
              (column) =>
                `<td>${escapeHtml(
                  formatCell(
                    column,
                    row?.[column]
                  )
                )}</td>`
            )
            .join("")}</tr>`
      )
      .join("");

    const html = `
      <html dir="rtl">
        <head>
          <meta charset="utf-8" />
        </head>
        <body>
          <table border="1">
            <thead><tr>${head}</tr></thead>
            <tbody>${body}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob =
      new Blob(
        ["\ufeff", html],
        {
          type:
            "application/vnd.ms-excel;charset=utf-8"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `نشاط_المستخدمين_${fromDate}_${toDate}.xls`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const resetToday = () => {
    const today = todayLocal();

    setFromDate(today);
    setToDate(today);
    setRows([]);
    setColumns([]);
    setColumnCaptions({});
    setSearched(false);
    clearAdvancedFilters();
  };

  const content = (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        bgcolor: soft,
        p: {
          xs: 0.35,
          sm: 0.7,
          md: 1
        },
        overflowX: "hidden"
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border:
            `1px solid ${border}`,
          borderRadius: {
            xs: 1.2,
            sm: 2.2
          },
          overflow: "hidden"
        }}
      >
        <Box
          sx={uiLayout.withUiSx({
            minHeight: {
              xs: 48,
              sm: 62
            },
            bgcolor: primaryDark,
            color: "#fff",
            px: {
              xs: 0.65,
              sm: 1.3
            },
            py: {
              xs: 0.55,
              sm: 0.9
            },
            display: "flex",
            alignItems: "center",
            gap: 0.6
          }, uiLayout.mobileHeaderSx)}
        >
          {!isDesktop && (
            <IconButton
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              sx={{
                color: "#fff",
                p: 0.25
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <ManageHistoryIcon
            sx={{
              fontSize: {
                xs: 20,
                sm: 29
              }
            }}
          />

          <Box
            sx={{
              flex: 1,
              minWidth: 0
            }}
          >
            <Typography
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: {
                  xs: 14,
                  sm: 21
                }
              }}
            >
              نشاط المستخدمين
            </Typography>

          </Box>

          <Chip
            size="small"
            label={hasActiveFilters ? `${filteredRows.length} من ${rows.length}` : `${rows.length} حركة`}
            sx={{
              display:
                searched
                  ? "flex"
                  : "none",
              bgcolor: "#fff",
              color: primaryDark,
              fontWeight: 900,
              fontSize: {
                xs: 12,
                sm: 12
              }
            }}
          />
        </Box>

        <Box
          sx={uiLayout.withUiSx({
            p: {
              xs: 0.55,
              sm: 0.9
            },
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              md:
                "170px 170px 120px 120px 50px 1fr"
            },
            gap: {
              xs: 0.45,
              sm: 0.7
            },
            alignItems: "center"
          }, uiLayout.filterBarSx)}
        >
          <TextField
            type="date"
            size="small"
            label="الفترة من"
            value={fromDate}
            onChange={(e) =>
              setFromDate(e.target.value)
            }
            InputLabelProps={{
              shrink: true
            }}
            sx={uiLayout.withUiSx({
              "& .MuiInputBase-input":
                {
                  fontSize: {
                    xs: 12,
                    sm: 12.5
                  },
                  py: {
                    xs: 0.55,
                    sm: 0.75
                  }
                },
              "& .MuiInputLabel-root":
                {
                  fontSize: {
                    xs: 12,
                    sm: 12
                  }
                }
            }, uiLayout.formFieldSx)}
           inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

          <TextField
            type="date"
            size="small"
            label="الفترة إلى"
            value={toDate}
            onChange={(e) =>
              setToDate(e.target.value)
            }
            InputLabelProps={{
              shrink: true
            }}
            sx={uiLayout.withUiSx({
              "& .MuiInputBase-input":
                {
                  fontSize: {
                    xs: 12,
                    sm: 12.5
                  },
                  py: {
                    xs: 0.55,
                    sm: 0.75
                  }
                },
              "& .MuiInputLabel-root":
                {
                  fontSize: {
                    xs: 12,
                    sm: 12
                  }
                }
            }, uiLayout.formFieldSx)}
           inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

          <Button
            variant="contained"
            startIcon={
              loading ? (
                <CircularProgress
                  size={14}
                  color="inherit"
                />
              ) : (
                <SearchIcon />
              )
            }
            disabled={loading}
            onClick={search}
            sx={uiLayout.withUiSx({
              bgcolor: "#1565c0",
              fontFamily: "Cairo",
              fontWeight: 900,
              fontSize: {
                xs: 12,
                sm: 12
              },
              minHeight: {
                xs: 32,
                sm: 40
              }
            }, uiLayout.buttonSx)}
          >
            عرض
          </Button>

          <Button
            variant="outlined"
            color="success"
            startIcon={<FileDownloadIcon />}
            disabled={
              loading ||
              rows.length === 0
            }
            onClick={exportExcel}
            sx={uiLayout.withUiSx({
              fontFamily: "Cairo",
              fontWeight: 900,
              fontSize: {
                xs: 12,
                sm: 12
              },
              minHeight: {
                xs: 32,
                sm: 40
              }
            }, uiLayout.buttonSx)}
          >
            Excel
          </Button>

          <Tooltip title="العودة لتاريخ اليوم">
            <span>
              <IconButton
                onClick={resetToday}
                disabled={loading}
                sx={{
                  border:
                    `1px solid ${border}`,
                  borderRadius: 1.3
                }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {searched && rows.length > 0 && (
          <Box
            sx={{
              mx: {
                xs: 0.55,
                sm: 0.9
              },
              mb: 0.8,
              border:
                `1px solid ${border}`,
              borderRadius: 1.5,
              bgcolor: "#fbfefc",
              overflow: "hidden"
            }}
          >
            <Box
              sx={{
                px: {
                  xs: 0.6,
                  sm: 0.9
                },
                py: {
                  xs: 0.45,
                  sm: 0.6
                },
                display: "flex",
                alignItems: "center",
                gap: 0.6,
                borderBottom:
                  showAdvancedFilters
                    ? `1px solid ${border}`
                    : "none"
              }}
            >
              <Button
                size="small"
                startIcon={<FilterAltIcon />}
                onClick={() =>
                  setShowAdvancedFilters(
                    (current) => !current
                  )
                }
                sx={uiLayout.withUiSx({
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: {
                    xs: 12,
                    sm: 12
                  },
                  px: {
                    xs: 0.7,
                    sm: 1
                  }
                }, uiLayout.buttonSx)}
              >
                فلاتر متقدمة
              </Button>

              {hasActiveFilters && (
                <Chip
                  size="small"
                  label={`${filteredRows.length} نتيجة`}
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontFamily: "Cairo",
                    fontSize: {
                      xs: 12,
                      sm: 12
                    }
                  }}
                />
              )}

              <Box sx={{ flex: 1 }} />

              <Tooltip title="مسح كل الفلاتر">
                <span>
                  <IconButton
                    size="small"
                    disabled={!hasActiveFilters}
                    onClick={clearAdvancedFilters}
                    sx={{
                      border:
                        `1px solid ${border}`,
                      borderRadius: 1.2
                    }}
                  >
                    <ClearAllIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            {showAdvancedFilters && (
              <Box
                sx={uiLayout.withUiSx({
                  p: {
                    xs: 0.55,
                    sm: 0.8
                  },
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr 1fr",
                    sm: "repeat(3, minmax(0, 1fr))",
                    lg: "repeat(6, minmax(0, 1fr))"
                  },
                  gap: {
                    xs: 0.45,
                    sm: 0.65
                  }
                }, uiLayout.formSectionSx)}
              >
                <TextField InputLabelProps={{ shrink: true }}
                  size="small"
                  label="بحث شامل"
                  value={filterText}
                  onChange={(e) =>
                    setFilterText(e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          sx={{
                            fontSize: {
                              xs: 15,
                              sm: 18
                            }
                          }}
                        />
                      </InputAdornment>
                    )
                  }}
                  sx={uiLayout.withUiSx({
                    "& .MuiInputBase-input": {
                      textAlign: "center",
                      fontFamily: "Cairo",
                      fontSize: {
                        xs: 12,
                        sm: 12
                      }
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Cairo",
                      fontSize: {
                        xs: 12,
                        sm: 12
                      }
                    }
                  }, uiLayout.formFieldSx)}
                />

                <TextField InputLabelProps={{ shrink: true }}
                  select
                  size="small"
                  label="المستخدم"
                  value={filterUser}
                  onChange={(e) =>
                    setFilterUser(e.target.value)
                  }
                  sx={uiLayout.withUiSx({
                    "& .MuiSelect-select": {
                      textAlign: "center",
                      fontFamily: "Cairo",
                      fontSize: {
                        xs: 12,
                        sm: 12
                      }
                    }
                  }, uiLayout.formFieldSx)}
                >
                  <MenuItem value="">
                    الكل
                  </MenuItem>
                  {filterOptions.users.map(
                    (value) => (
                      <MenuItem
                        key={value}
                        value={value}
                        sx={{
                          fontFamily: "Cairo",
                          fontSize: 12,
                          justifyContent: "center"
                        }}
                      >
                        {value}
                      </MenuItem>
                    )
                  )}
                </TextField>

                <TextField InputLabelProps={{ shrink: true }}
                  select
                  size="small"
                  label="نوع الإجراء"
                  value={filterAction}
                  onChange={(e) =>
                    setFilterAction(e.target.value)
                  }
                  sx={uiLayout.withUiSx({
                    "& .MuiSelect-select": {
                      textAlign: "center",
                      fontFamily: "Cairo",
                      fontSize: {
                        xs: 12,
                        sm: 12
                      }
                    }
                  }, uiLayout.formFieldSx)}
                >
                  <MenuItem value="">
                    الكل
                  </MenuItem>
                  {filterOptions.actions.map(
                    (value) => (
                      <MenuItem
                        key={value}
                        value={value}
                        sx={{
                          fontFamily: "Cairo",
                          fontSize: 12,
                          justifyContent: "center"
                        }}
                      >
                        {value}
                      </MenuItem>
                    )
                  )}
                </TextField>

                <TextField InputLabelProps={{ shrink: true }}
                  select
                  size="small"
                  label="الشاشة"
                  value={filterScreen}
                  onChange={(e) =>
                    setFilterScreen(e.target.value)
                  }
                  sx={uiLayout.withUiSx({
                    "& .MuiSelect-select": {
                      textAlign: "center",
                      fontFamily: "Cairo",
                      fontSize: {
                        xs: 12,
                        sm: 12
                      }
                    }
                  }, uiLayout.formFieldSx)}
                >
                  <MenuItem value="">
                    الكل
                  </MenuItem>
                  {filterOptions.screens.map(
                    (value) => (
                      <MenuItem
                        key={value}
                        value={value}
                        sx={{
                          fontFamily: "Cairo",
                          fontSize: 12,
                          justifyContent: "center"
                        }}
                      >
                        {value}
                      </MenuItem>
                    )
                  )}
                </TextField>

                <TextField InputLabelProps={{ shrink: true }}
                  select
                  size="small"
                  label="الجهاز"
                  value={filterDevice}
                  onChange={(e) =>
                    setFilterDevice(e.target.value)
                  }
                  sx={uiLayout.withUiSx({
                    "& .MuiSelect-select": {
                      textAlign: "center",
                      fontFamily: "Cairo",
                      fontSize: {
                        xs: 12,
                        sm: 12
                      }
                    }
                  }, uiLayout.formFieldSx)}
                >
                  <MenuItem value="">
                    الكل
                  </MenuItem>
                  {filterOptions.devices.map(
                    (value) => (
                      <MenuItem
                        key={value}
                        value={value}
                        sx={{
                          fontFamily: "Cairo",
                          fontSize: 12,
                          justifyContent: "center"
                        }}
                      >
                        {value}
                      </MenuItem>
                    )
                  )}
                </TextField>

                <TextField InputLabelProps={{ shrink: true }}
                  size="small"
                  label="IP"
                  value={filterIp}
                  onChange={(e) =>
                    setFilterIp(e.target.value)
                  }
                  sx={uiLayout.withUiSx({
                    "& .MuiInputBase-input": {
                      textAlign: "center",
                      fontFamily: "Cairo",
                      fontSize: {
                        xs: 12,
                        sm: 12
                      }
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Cairo",
                      fontSize: {
                        xs: 12,
                        sm: 12
                      }
                    }
                  }, uiLayout.formFieldSx)}
                />


                {dynamicFilterColumns.map(
                  ({ key, caption }) => (
                    <TextField InputLabelProps={{ shrink: true }}
                      key={`filter-${key}`}
                      size="small"
                      label={caption}
                      value={
                        columnFilters?.[key] || ""
                      }
                      onChange={(e) =>
                        setColumnFilters(
                          (current) => ({
                            ...current,
                            [key]: e.target.value
                          })
                        )
                      }
                      placeholder={`فلتر ${caption}`}
                      sx={uiLayout.withUiSx({
                        "& .MuiInputBase-input": {
                          textAlign: "center",
                          fontFamily: "Cairo",
                          fontSize: {
                            xs: 12,
                            sm: 12
                          }
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily: "Cairo",
                          fontSize: {
                            xs: 12,
                            sm: 12
                          }
                        }
                      }, uiLayout.formFieldSx)}
                    />
                  )
                )}
              </Box>
            )}
          </Box>
        )}

        {!searched && !loading && (
          <Alert
            severity="info"
            sx={{
              mx: {
                xs: 0.55,
                sm: 0.9
              },
              mb: 0.8,
              fontFamily: "Cairo",
              fontSize: {
                xs: 12,
                sm: 12
              }
            }}
          >
            اختر الفترة ثم اضغط عرض. التاريخ الافتراضي من اليوم إلى اليوم.
          </Alert>
        )}

        {searched &&
          !loading &&
          rows.length === 0 && (
            <Alert
              severity="warning"
              sx={{
                mx: {
                  xs: 0.55,
                  sm: 0.9
                },
                mb: 0.8,
                fontFamily: "Cairo",
                fontSize: {
                  xs: 12,
                  sm: 12
                }
              }}
            >
              لا توجد حركات مستخدمين خلال الفترة المحددة.
            </Alert>
          )}

        {searched &&
          !loading &&
          rows.length > 0 &&
          filteredRows.length === 0 && (
            <Alert
              severity="warning"
              sx={{
                mx: {
                  xs: 0.55,
                  sm: 0.9
                },
                mb: 0.8,
                fontFamily: "Cairo",
                fontSize: {
                  xs: 12,
                  sm: 12
                }
              }}
            >
              لا توجد نتائج مطابقة للفلاتر الحالية.
            </Alert>
          )}

        <Box
          sx={{
            mx: {
              xs: 0.45,
              sm: 0.8
            },
            mb: {
              xs: 0.45,
              sm: 0.8
            },
            border:
              `1px solid ${border}`,
            borderRadius: 1.5,
            overflow: "auto",
            maxHeight:
              "calc(100vh - 265px)",
            bgcolor: "#fff"
          }}
        >
          {filteredRows.length > 0 && (
            <Box
              component="table"
              sx={{
                width: "max-content",
                minWidth: "100%",
                borderCollapse:
                  "separate",
                borderSpacing: 0,
                tableLayout: "auto",
                direction: "rtl",
                "& th": {
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                  bgcolor: "#e8f3ef",
                  color: "#17352c",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: {
                    xs: 12,
                    sm: 12
                  },
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  verticalAlign: "middle",
                  minWidth: 105,
                  px: {
                    xs: 0.65,
                    sm: 1
                  },
                  py: {
                    xs: 0.55,
                    sm: 0.75
                  },
                  borderBottom:
                    `1px solid ${border}`
                },
                "& td": {
                  fontFamily: "Cairo",
                  fontWeight: 600,
                  fontSize: {
                    xs: 12,
                    sm: 12
                  },
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  verticalAlign: "middle",
                  minWidth: 105,
                  maxWidth: "none",
                  overflow: "visible",
                  textOverflow: "clip",
                  px: {
                    xs: 0.65,
                    sm: 1
                  },
                  py: {
                    xs: 0.5,
                    sm: 0.65
                  },
                  borderBottom:
                    "1px solid #edf2ef"
                },
                "& tbody tr:nth-of-type(even)":
                  {
                    bgcolor:
                      "#fbfdfc"
                  },
                "& tbody tr:hover":
                  {
                    bgcolor:
                      "#f0f8f5"
                  }
              }}
            >
              <thead>
                <tr>
                  {displayColumns.map(
                    (column) => (
                       <th
  key={column}
  style={
    normalizeColumn(column) === "actionreason"
      ? {
          minWidth: "55px",
          width: "55px",
          maxWidth: "55px",
          paddingLeft: "4px",
          paddingRight: "4px"
        }
      : undefined
  }
>
  {getColumnCaption(column)}
</th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredRows.map(
                  (row, rowIndex) => (
                    <tr
                      key={
                        row?.Guid ||
                        row?.guid ||
                        rowIndex
                      }
                    >
                      {displayColumns.map(
                        (column) => (
                          <Tooltip
                            key={column}
                            title={formatCell(
                              column,
                              row?.[
                                column
                              ]
                            )}
                            arrow
                          >
                            <td
  style={
    normalizeColumn(column) === "actionreason"
      ? {
          minWidth: "55px",
          width: "55px",
          maxWidth: "55px",
          paddingLeft: "4px",
          paddingRight: "4px",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }
      : undefined
  }
>
  {formatCell(column, row?.[column])}
</td>
                          </Tooltip>
                        )
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={
              mobileSidebarOpen
            } onMobileClose={() =>
              setMobileSidebarOpen(
                false
              )
            }><Box
      sx={{
        minHeight: "100vh",
        bgcolor: soft
      }}
    >
      {isDesktop ? (
        <>
          
          <Box
            sx={{
              ...navigationContentSx
            }}
          >
            {content}
          </Box>
        </>
      ) : (
        <>
          
          {content}
        </>
      )}
    </Box></NavigationShell>
  );
}
