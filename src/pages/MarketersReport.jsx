import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  IconButton,
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
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import AssessmentIcon from "@mui/icons-material/Assessment";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const pad2 = (value) =>
  String(value).padStart(2, "0");

const toIsoDate = (date) =>
  `${date.getFullYear()}-${pad2(
    date.getMonth() + 1
  )}-${pad2(date.getDate())}`;

const getMonthStart = () => {
  const now = new Date();

  return toIsoDate(
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    )
  );
};

const getToday = () =>
  toIsoDate(new Date());

const normalizeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isGuidColumn = (field) => {
  const normalized =
    normalizeKey(field);

  return (
    normalized === "sellerguid" ||
    normalized === "userguid" ||
    normalized.endsWith("guid")
  );
};

const unwrapValue = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value !== "object" ||
    value instanceof Date
  ) {
    return value;
  }

  const candidates = [
    value.value,
    value.Value,
    value.data,
    value.Data,
    value.amount,
    value.Amount,
    value.number,
    value.Number,
    value.decimal,
    value.Decimal,
    value.int32,
    value.Int32,
    value.int64,
    value.Int64,
    value.double,
    value.Double,
    value.single,
    value.Single,
    value.string,
    value.String
  ];

  for (const candidate of candidates) {
    if (
      candidate !== undefined &&
      candidate !== null &&
      candidate !== value
    ) {
      return unwrapValue(candidate);
    }
  }

  return "";
};

const displayValue = (value) => {
  const unwrapped =
    unwrapValue(value);

  if (
    unwrapped === null ||
    unwrapped === undefined
  ) {
    return "";
  }

  return String(unwrapped);
};

const numberValue = (value) => {
  const unwrapped =
    unwrapValue(value);

  if (
    unwrapped === null ||
    unwrapped === undefined ||
    unwrapped === ""
  ) {
    return null;
  }

  const result = Number(unwrapped);

  return Number.isFinite(result)
    ? result
    : null;
};

const isNumericValue = (value) =>
  numberValue(value) !== null;

const formatNumber = (value) => {
  const number =
    numberValue(value);

  if (number === null) {
    return displayValue(value);
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits:
        Number.isInteger(number)
          ? 0
          : 2,
      maximumFractionDigits: 2
    }
  ).format(number);
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

const MarketersReport = () => {
  const theme = useTheme();

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    "(min-width:600px) and (max-width:1599px)"
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

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
    useState(getMonthStart());

  const [toDate, setToDate] =
    useState(getToday());

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [migrating, setMigrating] =
    useState(false);

  const [detailsRow, setDetailsRow] =
    useState(null);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const openDetails = (row) => {
    setDetailsRow(row);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsRow(null);
  };

  const loadReport = useCallback(
    async () => {
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
          `${API_BASE_URL}/api/marketers-report?${params.toString()}`,
          {
            headers: {
              Accept:
                "application/json"
            }
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل تقرير المسوقين"
          );
        }

        const normalizedRows =
          Array.isArray(result?.data)
            ? result.data.map((row) => {
                const normalizedRow = {};

                Object.entries(
                  row || {}
                ).forEach(
                  ([key, value]) => {
                    normalizedRow[key] =
                      unwrapValue(value);
                  }
                );

                return normalizedRow;
              })
            : [];

        setRows(normalizedRows);
      } catch (error) {
        setRows([]);

        await showError(
          error?.message ||
          "حدث خطأ أثناء تحميل التقرير"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      userGuid,
      fromDate,
      toDate
    ]
  );

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const visibleFields = useMemo(() => {
    const allFields =
      rows.reduce(
        (result, row) => {
          Object.keys(row || {})
            .forEach((field) => {
              if (
                !result.includes(field) &&
                !isGuidColumn(field)
              ) {
                result.push(field);
              }
            });

          return result;
        },
        []
      );

    const employeeIndex =
      allFields.findIndex(
        (field) =>
          field === "اسم الموظف"
      );

    if (employeeIndex > 0) {
      const [employeeField] =
        allFields.splice(
          employeeIndex,
          1
        );

      allFields.unshift(
        employeeField
      );
    }

    return allFields;
  }, [rows]);

  const columns = useMemo(() => {
    return visibleFields.map(
      (field) => {
        const sample =
          rows.find(
            (row) =>
              row?.[field] !== null &&
              row?.[field] !== undefined &&
              row?.[field] !== ""
          )?.[field];

        const numeric =
          isNumericValue(sample);

        return {
          field,
          headerName: field,
          type:
            numeric
              ? "number"
              : "string",
          minWidth:
            field === "اسم الموظف"
              ? 190
              : 115,
          flex:
            field === "اسم الموظف"
              ? 1.5
              : 1,
          renderCell: (params) => {
            const rawValue =
              params?.row?.[field] ??
              params?.value;

            return numeric
              ? formatNumber(rawValue)
              : displayValue(rawValue);
          }
        };
      }
    );
  }, [
    visibleFields,
    rows
  ]);

  const compactColumns = useMemo(() => {
    const findField = (...names) =>
      visibleFields.find((field) =>
        names.some(
          (name) =>
            normalizeKey(field) ===
            normalizeKey(name)
        )
      );

    const employeeField =
      findField(
        "اسم الموظف",
        "الموظف",
        "اسم المسوق",
        "المسوق"
      ) || visibleFields[0];

    const totalRegistrationField =
      findField(
        "اجمالي التسجيل",
        "إجمالي التسجيل",
        "إجمالي التسجيلات",
        "اجمالي التسجيلات"
      );

    const civilField =
      findField(
        "مسجل مدني",
        "المسجل مدني",
        "مدني",
        "تسجيل مدني",
        "مسجلين مدني"
      );

    const militaryField =
      findField(
        "مسجل عسكري",
        "المسجل عسكري",
        "عسكري",
        "تسجيل عسكري",
        "مسجلين عسكري"
      );

    const preferredFields = [
      employeeField,
      totalRegistrationField,
      civilField,
      militaryField
    ];

    const fallbackFields =
      visibleFields.filter(
        (field) =>
          !preferredFields.includes(field)
      );

    const chosenFields = [
      ...preferredFields.filter(Boolean),
      ...fallbackFields
    ]
      .filter(
        (field, index, array) =>
          field &&
          array.indexOf(field) === index
      )
      .slice(0, 4);

    const getCompactHeader = (field) => {
      if (field === employeeField) {
        return "الموظف";
      }

      if (field === totalRegistrationField) {
        return isPhone
          ? "الإجمالي"
          : "إجمالي التسجيل";
      }

      if (field === civilField) {
        return isPhone
          ? "مدني"
          : "مسجل مدني";
      }

      if (field === militaryField) {
        return isPhone
          ? "عسكري"
          : "مسجل عسكري";
      }

      return field;
    };

    const dataColumns =
      chosenFields.map((field) => {
        const sample =
          rows.find(
            (row) =>
              row?.[field] !== null &&
              row?.[field] !== undefined &&
              row?.[field] !== ""
          )?.[field];

        const numeric =
          isNumericValue(sample);

        const isEmployee =
          field === employeeField;

        return {
  field,

  headerName:
    getCompactHeader(field),

  sortable: false,
  disableColumnMenu: true,
  resizable: false,

  type: numeric
    ? "number"
    : "string",

  ...(isPhone
    ? {
        flex:
          field === employeeField
            ? 1.55
            : 1,

        minWidth: 0
      }
    : {
        flex: isEmployee
          ? 1.35
          : 0.9,

        minWidth: isEmployee
          ? 150
          : 108
      }),

  renderCell: (params) => {
    const rawValue =
      params?.row?.[field] ??
      params?.value;

    return numeric
      ? formatNumber(rawValue)
      : displayValue(rawValue);
  }
};
      });

    const detailsColumn = {
      field: "__details",
      headerName: "تفاصيل",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: isPhone ? 34 : 54,
      minWidth: isPhone ? 34 : 54,
      maxWidth: isPhone ? 34 : 54,
      align: "center",
      headerAlign: "center",

      renderCell: (params) => (
        <IconButton
          size="small"
          title="عرض التفاصيل"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            openDetails(params.row);
          }}
          sx={{
            width: isPhone ? 24 : 32,
            height: isPhone ? 24 : 32,
            p: 0,
            color: "#057546",
            border:
              "1px solid rgba(5,117,70,.28)",
            backgroundColor: "#eef8f3"
          }}
        >
          <VisibilityOutlinedIcon
            sx={{
              fontSize: isPhone ? 14 : 19
            }}
          />
        </IconButton>
      )
    };

    return [
      ...dataColumns,
      detailsColumn
    ];
  }, [
    visibleFields,
    rows,
    isPhone,
    isTablet
  ]);

  const dataGridRows = useMemo(
    () =>
      rows.map(
        (row, index) => ({
          id:
            row.UserGuid ||
            row.userGuid ||
            row.SellerGuid ||
            row.sellerGuid ||
            `marketer-${index}`,
          ...row
        })
      ),
    [rows]
  );

  const totals = useMemo(() => {
    const result = {};

    visibleFields.forEach(
      (field) => {
        const numericRows =
          rows
            .map((row) =>
              numberValue(
                row?.[field]
              )
            )
            .filter(
              (value) =>
                value !== null
            );

        if (
          numericRows.length ===
          rows.length &&
          rows.length > 0
        ) {
          result[field] =
            numericRows.reduce(
              (sum, value) =>
                sum + value,
              0
            );
        }
      }
    );

    return result;
  }, [
    rows,
    visibleFields
  ]);

  const totalRegistration =
    totals["اجمالي التسجيل"] ??
    totals["إجمالي التسجيل"] ??
    0;

  const totalCommission =
    totals["اجمالي العمولة"] ??
    totals["إجمالي العمولة"] ??
    0;

  const exportCsv = () => {
    if (rows.length === 0) {
      return;
    }

    const escapeValue = (value) =>
      `"${String(
        value ?? ""
      ).replaceAll('"', '""')}"`;

    const csv = [
      visibleFields
        .map(escapeValue)
        .join(","),

      ...rows.map((row) =>
        visibleFields
          .map((field) =>
            escapeValue(
              unwrapValue(
                row?.[field]
              )
            )
          )
          .join(",")
      )
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF", csv],
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
      `تقرير المسوقين ${fromDate} إلى ${toDate}.csv`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const migrateToRewards = async () => {
    if (rows.length === 0) {
      await showError(
        "لا توجد بيانات لترحيلها"
      );
      return;
    }

    const confirmation =
      await Swal.fire({
        icon: "question",
        title:
          "ترحيل لشيت المكافآت",
        html: `
          <div style="
            font-family:Cairo,Arial;
            direction:rtl;
            line-height:2;
          ">
            سيتم ترحيل عمولة التسجيل
            لكل الموظفين عن الفترة:
            <br />
            <strong>
              ${fromDate}
              إلى
              ${toDate}
            </strong>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText:
          "نعم، ترحيل",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    setMigrating(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/marketers-report/migrate-rewards`,
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
            fromDate,
            toDate
          })
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر ترحيل البيانات"
        );
      }

      await Swal.fire({
        icon: "success",
        title: "تم الترحيل",
        html: `
          <div style="
            font-family:Cairo,Arial;
            direction:rtl;
            line-height:2;
          ">
            مضاف:
            <strong>
              ${result?.data?.inserted ?? 0}
            </strong>
            <br />
            موجود مسبقًا:
            <strong>
              ${result?.data?.existed ?? 0}
            </strong>
            <br />
            فشل:
            <strong>
              ${result?.data?.failed ?? 0}
            </strong>
          </div>
        `,
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });
    } catch (error) {
      await showError(
        error?.message ||
        "حدث خطأ أثناء الترحيل"
      );
    } finally {
      setMigrating(false);
    }
  };

  return (
    isDesktop ? (
    <NavigationShell variant="standard" ><Box
      sx={{
        minHeight: "100vh",
        background: "#f5f8f7",
        direction: "rtl"
      }}
    >
      

      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          p: {
            xs: 1.5,
            md: 3
          },
          direction: "rtl",
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.14)",
            background: "#fff"
          }}
        >
          <Box
            sx={{
              p: {
                xs: 2,
                md: 3
              },
              background:
                "linear-gradient(135deg,#fff 0%,#edf8f3 100%)",
              borderBottom:
                "1px solid rgba(5,117,70,0.12)"
            }}
          >
            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
            >
              <AssessmentIcon
                sx={{
                  color: "#057546",
                  fontSize: 36
                }}
              />

              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    color: "#034d31"
                  }}
                >
                  تقرير المسوقين
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    fontFamily: "Cairo",
                    color: "#61756d"
                  }}
                >
                  متابعة التسجيلات والعمولات وترحيل عمولة التسجيل لشيت المكافآت
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: {
                xs: 2,
                md: 3
              }
            }}
          >
            <Paper
              elevation={0}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 3,
                border:
                  "1px solid rgba(5,117,70,0.13)",
                background:
                  "#fbfdfc"
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  lg: "row"
                }}
                spacing={1.5}
                alignItems={{
                  xs: "stretch",
                  lg: "center"
                }}
              >
                <TextField
                  type="date"
                  size="small"
                  label="الفترة من"
                  value={fromDate}
                  onChange={(event) =>
                    setFromDate(
                      event.target.value
                    )
                  }
                  InputLabelProps={{
                    shrink: true
                  }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <TextField
                  type="date"
                  size="small"
                  label="الفترة إلى"
                  value={toDate}
                  onChange={(event) =>
                    setToDate(
                      event.target.value
                    )
                  }
                  InputLabelProps={{
                    shrink: true
                  }}
                 inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                <Button
                  variant="contained"
                  startIcon={
                    <SearchIcon />
                  }
                  onClick={loadReport}
                  disabled={loading}
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    background: "#057546"
                  }}
                >
                  عرض
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <RefreshIcon />
                  }
                  onClick={loadReport}
                  disabled={loading}
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900
                  }}
                >
                  تحديث
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <FileDownloadIcon />
                  }
                  onClick={exportCsv}
                  disabled={
                    loading ||
                    rows.length === 0
                  }
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    color: "#ae1e21",
                    borderColor: "#ae1e21"
                  }}
                >
                  تصدير
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    <MoveToInboxIcon />
                  }
                  onClick={
                    migrateToRewards
                  }
                  disabled={
                    loading ||
                    migrating ||
                    rows.length === 0
                  }
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    background: "#184f90"
                  }}
                >
                  {migrating
                    ? "جارٍ الترحيل..."
                    : "ترحيل لشيت المكافآت"}
                </Button>
              </Stack>
            </Paper>

            <Stack
              direction={{
                xs: "column",
                md: "row"
              }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <Chip
                label={`عدد الموظفين: ${rows.length}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#edf8f3",
                  color: "#034d31"
                }}
              />

              <Chip
                label={`إجمالي التسجيل: ${formatNumber(totalRegistration)}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#fff7cc",
                  color: "#735c00"
                }}
              />

              <Chip
                label={`إجمالي العمولة: ${formatNumber(totalCommission)}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#eef4ff",
                  color: "#184f90"
                }}
              />
            </Stack>

            <Box
              sx={{
                width: "100%",
                height: 690,
                border:
                  "1px solid rgba(5,117,70,0.14)",
                borderRadius: 3,
                overflow: "hidden"
              }}
            >
              <DataGrid
                rows={dataGridRows}
                columns={columns}
                loading={loading}
                disableRowSelectionOnClick
                showToolbar
                slots={{
                  toolbar: GridToolbar
                }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: {
                      debounceMs: 300
                    },
                    csvOptions: {
                      utf8WithBom: true,
                      fileName:
                        "تقرير المسوقين"
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
                    "بحث داخل التقرير...",
                  filterPanelAddFilter:
                    "إضافة فلتر",
                  filterPanelOperator:
                    "نوع المقارنة",
                  filterPanelColumns:
                    "العمود",
                  filterPanelInputLabel:
                    "القيمة"
                }}
                sx={{
                  border: 0,
                  direction: "rtl",
                  fontFamily: "Cairo",
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor:
                      "#057546",
                    color: "#fff",
                    fontWeight: 900
                  },
                  "& .MuiDataGrid-columnHeader": {
                    backgroundColor:
                      "#057546"
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    textAlign: "center",
                    whiteSpace: "normal",
                    lineHeight: 1.3
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
                    borderColor: "#e6ece9"
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
                    p: 1,
                    direction: "rtl",
                    borderBottom:
                      "1px solid #e6ece9",
                    backgroundColor:
                      "#f8fbf9"
                  },
                  "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    color: "#057546"
                  }
                }}
              />
            </Box>

            {Object.keys(totals).length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 2.5,
                  border:
                    "1px solid rgba(5,117,70,0.12)",
                  background: "#f7faf8"
                }}
              >
                <Typography
                  sx={{
                    mb: 1,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    color: "#034d31"
                  }}
                >
                  إجماليات التقرير
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  flexWrap="wrap"
                >
                  {Object.entries(totals)
                    .map(([field, value]) => (
                      <Chip
                        key={field}
                        label={`${field}: ${formatNumber(value)}`}
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 800
                        }}
                      />
                    ))}
                </Stack>
              </Paper>
            )}
          </Box>
        </Paper>
      </Box>
    </Box></NavigationShell>
    ) : (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        background: "#f5f8f7",
        direction: "rtl"
      }}
    >
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
              : "540px !important",
            fontFamily:
              "Cairo !important"
          },
          ".swal2-title": {
            fontFamily:
              "Cairo !important",
            fontSize: isPhone
              ? "0.82rem !important"
              : "1rem !important"
          },
          ".swal2-html-container": {
            fontFamily:
              "Cairo !important",
            fontSize: isPhone
              ? "0.55rem !important"
              : "0.68rem !important"
          }
        }}
      />

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
          backdropFilter: "blur(14px)",
          color: "#17372b",
          borderBottom:
            "1px solid rgba(5,117,70,.12)",
          direction: "rtl"
        }}
      >
        <Toolbar
          sx={{
            minHeight: {
              xs: "50px !important",
              sm: "56px !important"
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
                xs: "0.67rem",
                sm: "0.79rem"
              },
              color: "#17372b",
              textAlign: "start"
            }}
          >
            تقرير المسوقين
          </Typography>
        </Toolbar>
      </AppBar>

      

      <Box
        component="main"
        sx={{
          mt: {
            xs: "50px",
            sm: "56px"
          },
          width: "100%",
          maxWidth: "100%",
          minHeight: "100dvh",
          px: {
            xs: 0.45,
            sm: 0.7
          },
          py: {
            xs: 0.45,
            sm: 0.7
          },
          boxSizing: "border-box",
          overflowX: "hidden",
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: isPhone
              ? 1.4
              : 1.8,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.14)",
            background: "#fff"
          }}
        >
          <Box
            sx={{
              px: isPhone ? 0.75 : 1,
              py: isPhone ? 0.65 : 0.85,
              background:
                "linear-gradient(135deg,#fff 0%,#edf8f3 100%)",
              borderBottom:
                "1px solid rgba(5,117,70,0.12)"
            }}
          >
            <Stack
              direction="row"
              spacing={0.6}
              alignItems="center"
            >
              <AssessmentIcon
                sx={{
                  color: "#057546",
                  fontSize: isPhone
                    ? 20
                    : 24
                }}
              />

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 950,
                    color: "#034d31",
                    fontSize: isPhone
                      ? "0.68rem"
                      : "0.82rem"
                  }}
                >
                  تقرير المسوقين
                </Typography>

                {!isPhone && (
                  <Typography
                    sx={{
                      mt: 0.15,
                      fontFamily: "Cairo",
                      color: "#61756d",
                      fontSize: "0.44rem"
                    }}
                  >
                    متابعة التسجيلات والعمولات وترحيل عمولة التسجيل لشيت المكافآت
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: isPhone ? 0.6 : 0.85
            }}
          >
            <Paper
              elevation={0}
              sx={{
                mb: isPhone ? 0.6 : 0.8,
                p: isPhone ? 0.55 : 0.75,
                borderRadius: 1.4,
                border:
                  "1px solid rgba(5,117,70,0.13)",
                background: "#fbfdfc"
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: isPhone
                    ? "repeat(2,minmax(0,1fr))"
                    : "repeat(4,minmax(0,1fr))",
                  gap: isPhone ? 0.45 : 0.6,

                  "& .MuiInputLabel-root": {
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.38rem"
                      : "0.46rem"
                  },

                  "& .MuiInputBase-root": {
                    minHeight: isPhone
                      ? 31
                      : 34,
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.46rem"
                      : "0.54rem"
                  },

                  "& .MuiButton-root": {
                    minHeight: isPhone
                      ? 30
                      : 33,
                    minWidth: 0,
                    px: isPhone
                      ? 0.4
                      : 0.6,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.4rem"
                      : "0.5rem"
                  },

                  "& .MuiSvgIcon-root": {
                    fontSize: isPhone
                      ? 14
                      : 16
                  }
                }}
              >
                <TextField
                  type="date"
                  size="small"
                  label="الفترة من"
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

                <TextField
                  type="date"
                  size="small"
                  label="الفترة إلى"
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

                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={loadReport}
                  disabled={loading}
                  sx={{
                    background: "#057546"
                  }}
                >
                  عرض
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadReport}
                  disabled={loading}
                >
                  تحديث
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportCsv}
                  disabled={
                    loading ||
                    rows.length === 0
                  }
                  sx={{
                    color: "#ae1e21",
                    borderColor: "#ae1e21"
                  }}
                >
                  تصدير
                </Button>

                <Button
                  variant="contained"
                  startIcon={<MoveToInboxIcon />}
                  onClick={migrateToRewards}
                  disabled={
                    loading ||
                    migrating ||
                    rows.length === 0
                  }
                  sx={{
                    background: "#184f90",
                    gridColumn: isPhone
                      ? "span 1"
                      : "span 2"
                  }}
                >
                  {migrating
                    ? "جارٍ الترحيل..."
                    : "ترحيل للمكافآت"}
                </Button>
              </Box>
            </Paper>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3,minmax(0,1fr))",
                gap: isPhone ? 0.35 : 0.5,
                mb: isPhone ? 0.6 : 0.8
              }}
            >
              <Chip
                label={`الموظفين: ${rows.length}`}
                sx={{
                  height: isPhone ? 26 : 30,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone
                    ? "0.36rem"
                    : "0.44rem",
                  background: "#edf8f3",
                  color: "#034d31",
                  "& .MuiChip-label": {
                    px: 0.45
                  }
                }}
              />

              <Chip
                label={`التسجيل: ${formatNumber(totalRegistration)}`}
                sx={{
                  height: isPhone ? 26 : 30,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone
                    ? "0.36rem"
                    : "0.44rem",
                  background: "#fff7cc",
                  color: "#735c00",
                  "& .MuiChip-label": {
                    px: 0.45
                  }
                }}
              />

              <Chip
                label={`العمولة: ${formatNumber(totalCommission)}`}
                sx={{
                  height: isPhone ? 26 : 30,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone
                    ? "0.36rem"
                    : "0.44rem",
                  background: "#eef4ff",
                  color: "#184f90",
                  "& .MuiChip-label": {
                    px: 0.45
                  }
                }}
              />
            </Box>

            <Box
              sx={{
                width: "100%",
                height: isPhone
                  ? "calc(100dvh - 292px)"
                  : "calc(100dvh - 250px)",
                minHeight: isPhone
                  ? 380
                  : 520,
                border:
                  "1px solid rgba(5,117,70,0.14)",
                borderRadius: 1.4,
                overflow: "hidden"
              }}
            >
              <DataGrid
                rows={dataGridRows}
                columns={compactColumns}
                loading={loading}
                disableColumnMenu
                disableColumnResize
                disableRowSelectionOnClick
                rowHeight={
                  isPhone ? 36 : 46
                }
                columnHeaderHeight={
                  isPhone ? 36 : 54
                }
                pageSizeOptions={[
                  10,
                  25,
                  50
                ]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      page: 0,
                      pageSize: 25
                    }
                  }
                }}
                localeText={{
                  noRowsLabel:
                    "لا توجد بيانات",
                  noResultsOverlayLabel:
                    "لا توجد نتائج مطابقة"
                }}
                sx={{
                  border: 0,
                  direction: "rtl",
                  fontFamily: "Cairo",

                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#057546",
                    color: "#fff",
                    fontWeight: 900
                  },

                  "& .MuiDataGrid-columnHeader": {
                    backgroundColor: "#057546",
                    px: isPhone ? 0.08 : 0.25
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.34rem"
                      : "0.56rem",
                    textAlign: "center",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  },

                  "& .MuiDataGrid-columnHeaderTitleContainer": {
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "hidden",
                    minWidth: 0
                  },

                  "& .MuiDataGrid-columnSeparator": {
                    display: "none"
                  },

                  "& .MuiDataGrid-cell": {
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.4rem"
                      : "0.54rem",
                    textAlign: "center",
                    justifyContent: "center",
                    px: isPhone ? 0.06 : 0.35,
                    borderColor: "#e6ece9"
                  },

                  "& .MuiDataGrid-row:nth-of-type(even)": {
                    backgroundColor: "#fbfdfc"
                  },

                  "& .MuiDataGrid-main": {
                    overflowX: "hidden"
                  },

                  "& .MuiDataGrid-virtualScroller": {
                    overflowX: "hidden !important"
                  },

                  "& .MuiDataGrid-scrollbar--horizontal": {
                    display: "none"
                  },

                  "& .MuiDataGrid-footerContainer": {
                    minHeight: isPhone ? 36 : 44
                  },

                  "& .MuiTablePagination-toolbar": {
                    minHeight: isPhone ? 36 : 44,
                    px: isPhone ? 0.25 : 0.6
                  },

                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.42rem"
                      : "0.54rem"
                  }
                }}
              />
            </Box>

            {Object.keys(totals).length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  mt: isPhone ? 0.6 : 0.8,
                  p: isPhone ? 0.55 : 0.75,
                  borderRadius: 1.3,
                  border:
                    "1px solid rgba(5,117,70,0.12)",
                  background: "#f7faf8"
                }}
              >
                <Typography
                  sx={{
                    mb: 0.45,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    color: "#034d31",
                    fontSize: isPhone
                      ? "0.48rem"
                      : "0.56rem"
                  }}
                >
                  إجماليات التقرير
                </Typography>

                <Stack
                  direction="row"
                  spacing={0.35}
                  useFlexGap
                  flexWrap="wrap"
                >
                  {Object.entries(totals)
                    .map(([field, value]) => (
                      <Chip
                        key={field}
                        label={`${field}: ${formatNumber(value)}`}
                        sx={{
                          height: isPhone ? 24 : 28,
                          fontFamily: "Cairo",
                          fontWeight: 800,
                          fontSize: isPhone
                            ? "0.34rem"
                            : "0.42rem"
                        }}
                      />
                    ))}
                </Stack>
              </Paper>
            )}

            <Dialog
              open={detailsOpen}
              onClose={closeDetails}
              fullWidth
              maxWidth="lg"
              dir="rtl"
              PaperProps={{
                sx: {
                  width: isPhone
                    ? "94vw"
                    : "90vw",
                  maxWidth: isPhone
                    ? "94vw"
                    : "980px",
                  maxHeight: isPhone
                    ? "86dvh"
                    : "84dvh",
                  m: 1,
                  borderRadius: 2.5,
                  overflow: "hidden"
                }
              }}
            >
              <DialogTitle
                sx={{
                  px: isPhone ? 1 : 1.5,
                  py: isPhone ? 0.8 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 0.6,
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  color: "#057546",
                  fontSize: isPhone
                    ? "0.78rem"
                    : "0.96rem"
                }}
              >
                <span>تفاصيل الموظف</span>

                <IconButton
                  onClick={closeDetails}
                  sx={{
                    width: isPhone ? 30 : 34,
                    height: isPhone ? 30 : 34,
                    color: "#ae1e21"
                  }}
                >
                  <CloseIcon
                    sx={{
                      fontSize: isPhone
                        ? 18
                        : 20
                    }}
                  />
                </IconButton>
              </DialogTitle>

              <DialogContent
                dividers
                sx={{
                  p: isPhone ? 0.8 : 1.1,
                  overflowY: "auto"
                }}
              >
                {detailsRow ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: isPhone
                        ? "repeat(2,minmax(0,1fr))"
                        : "repeat(3,minmax(0,1fr))",
                      gap: isPhone ? 0.45 : 0.65
                    }}
                  >
                    {visibleFields.map((field) => {
                      const rawValue =
                        detailsRow?.[field];

                      const numeric =
                        isNumericValue(rawValue);

                      return (
                        <Box
                          key={field}
                          sx={{
                            minWidth: 0,
                            p: isPhone
                              ? 0.55
                              : 0.72,
                            border:
                              "1px solid rgba(5,117,70,.14)",
                            borderRadius: 1.3,
                            backgroundColor:
                              "#fbfdfc"
                          }}
                        >
                          <Typography
                            sx={{
                              mb: 0.25,
                              fontFamily: "Cairo",
                              fontWeight: 900,
                              color: "#60756d",
                              fontSize: isPhone
                                ? "0.4rem"
                                : "0.5rem"
                            }}
                          >
                            {field}
                          </Typography>

                          <Typography
                            sx={{
                              fontFamily: "Cairo",
                              fontWeight: 800,
                              color: "#1f2d3d",
                              fontSize: isPhone
                                ? "0.52rem"
                                : "0.64rem",
                              wordBreak: "break-word"
                            }}
                          >
                            {numeric
                              ? formatNumber(rawValue)
                              : displayValue(rawValue) || "-"}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                ) : null}
              </DialogContent>

              <DialogActions
                sx={{
                  px: isPhone ? 1 : 1.5,
                  py: isPhone ? 0.7 : 1
                }}
              >
                <Button
                  variant="contained"
                  onClick={closeDetails}
                  sx={{
                    backgroundColor: "#057546",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.48rem"
                      : "0.58rem"
                  }}
                >
                  إغلاق
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Paper>
      </Box>
    </Box></NavigationShell>
    )
  );
};

export default MarketersReport;
