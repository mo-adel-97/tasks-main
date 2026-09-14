import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
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
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const pad2 = (value) =>
  String(value).padStart(2, "0");

const getCurrentMonth = () => {
  const now = new Date();

  return `${now.getFullYear()}-${pad2(
    now.getMonth() + 1
  )}`;
};

const normalizeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isGuidColumn = (field) => {
  const key = normalizeKey(field);

  return (
    key === "guid" ||
    key.endsWith("guid")
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

const numberValue = (value) => {
  const scalar = unwrapValue(value);

  if (
    scalar === null ||
    scalar === undefined ||
    scalar === ""
  ) {
    return null;
  }

  const parsed = Number(scalar);

  return Number.isFinite(parsed)
    ? parsed
    : null;
};

const formatNumber = (value) => {
  const number = numberValue(value);

  if (number === null) {
    return String(
      unwrapValue(value) ?? ""
    );
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(number);
};

const COLUMN_CAPTIONS = {
  FullName: "اسم الموظف",
  BrEName: "الفرع",
  Registration: "التسجيلات",
  Collection: "التحصيلات",
  Marriage: "بدل زواج",
  Newborn: "بدل مولود",
  Housing: "بدل سكن",
  Transport: "بدل مواصلات",
  Vacation: "بدل إجازة",
  Other: "بدلات أخرى",
  OtherReward1: "مكافأة كنترول",
  OtherReward2: "مكافأة عمل",
  Total: "الإجمالي",
  EmpIbn: "رقم الآيبان",
  OtherAllowancesNote:
    "ملاحظات البدلات",
  USERSTAUT: "الحالة",
  OtherReward: "م. تحصيل أخرى"
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

const RewardsList = () => {
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

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [detailsRow, setDetailsRow] =
    useState(null);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const openDetails = (row) => {
    setDetailsRow(row);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsRow(null);
  };

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

  const [selectedMonth, setSelectedMonth] =
    useState(getCurrentMonth());

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const loadData = useCallback(
    async () => {
      if (!userGuid) {
        await showError(
          "بيانات المستخدم غير موجودة"
        );
        return;
      }

      if (!selectedMonth) {
        await showError(
          "برجاء تحديد الشهر"
        );
        return;
      }

      setLoading(true);

      try {
        const [yearText, monthText] =
          selectedMonth.split("-");

        const params =
          new URLSearchParams({
            userGuid,
            year: yearText,
            month: monthText
          });

        const response = await fetch(
          `${API_BASE_URL}/api/rewards-list?${params.toString()}`,
          {
            headers: {
              Accept: "application/json"
            }
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل قائمة المكافآت"
          );
        }

        const normalizedRows =
          Array.isArray(result?.data)
            ? result.data.map((row) => {
                const normalized = {};

                Object.entries(
                  row || {}
                ).forEach(
                  ([key, value]) => {
                    normalized[key] =
                      unwrapValue(value);
                  }
                );

                return normalized;
              })
            : [];

        setRows(normalizedRows);
      } catch (error) {
        setRows([]);

        await showError(
          error?.message ||
          "حدث خطأ أثناء تحميل قائمة المكافآت"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      userGuid,
      selectedMonth
    ]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleFields = useMemo(() => {
    const fields = [];

    rows.forEach((row) => {
      Object.keys(row || {})
        .forEach((field) => {
          if (
            !fields.includes(field) &&
            !isGuidColumn(field)
          ) {
            fields.push(field);
          }
        });
    });

    const preferredOrder = [
      "FullName",
      "USERSTAUT",
      "Registration",
      "Collection",
      "Marriage",
      "Newborn",
      "Housing",
      "Transport",
      "Vacation",
      "Other",
      "OtherReward1",
      "OtherReward2",
      "OtherReward",
      "Total",
      "EmpIbn",
      "BrEName",
      "OtherAllowancesNote"
    ];

    return [
      ...preferredOrder.filter(
        (field) =>
          fields.includes(field)
      ),
      ...fields.filter(
        (field) =>
          !preferredOrder.includes(field)
      )
    ];
  }, [rows]);

  const columns = useMemo(
    () =>
      visibleFields.map((field) => {
        const sample =
          rows.find(
            (row) =>
              row?.[field] !== null &&
              row?.[field] !== undefined &&
              row?.[field] !== ""
          )?.[field];

        const numeric =
          numberValue(sample) !== null;

        const isWideText =
          [
            "FullName",
            "BrEName",
            "OtherAllowancesNote",
            "EmpIbn"
          ].includes(field);

        return {
          field,
          headerName:
            COLUMN_CAPTIONS[field] ||
            field,
          type:
            numeric
              ? "number"
              : "string",
          minWidth:
            field === "FullName"
              ? 210
              : isWideText
              ? 170
              : 105,
          flex:
            field === "FullName"
              ? 1.5
              : isWideText
              ? 1.2
              : 0.85,
          renderCell: (params) => {
            const value =
              params?.row?.[field] ??
              params?.value;

            return numeric
              ? formatNumber(value)
              : String(
                  unwrapValue(value) ?? ""
                );
          }
        };
      }),
    [
      visibleFields,
      rows
    ]
  );

  const compactColumns = useMemo(() => {
    const importantFields = isPhone
      ? [
          "FullName",
          "Registration",
          "Collection",
          "Total"
        ]
      : [
          "FullName",
          "USERSTAUT",
          "Registration",
          "Collection",
          "Total"
        ];

    const availableFields = importantFields.filter(
      (field) => visibleFields.includes(field)
    );

    const fallbackFields = visibleFields.filter(
      (field) => !availableFields.includes(field)
    );

    const desiredCount = isPhone ? 4 : 5;

    const chosenFields = [
      ...availableFields,
      ...fallbackFields
    ].slice(0, desiredCount);

    const compactDataColumns =
      chosenFields.map((field) => {
        const sample =
          rows.find(
            (row) =>
              row?.[field] !== null &&
              row?.[field] !== undefined &&
              row?.[field] !== ""
          )?.[field];

        const numeric =
          numberValue(sample) !== null;

        const headerName =
          field === "FullName"
            ? "الموظف"
            : field === "Registration"
              ? isPhone
                ? "التسجيل"
                : "التسجيلات"
              : field === "Collection"
                ? isPhone
                  ? "التحصيل"
                  : "التحصيلات"
                : field === "Total"
                  ? "الإجمالي"
                  : field === "USERSTAUT"
                    ? "الحالة"
                    : COLUMN_CAPTIONS[field] || field;

        return {
          field,
          headerName,
          sortable: false,
          filterable: false,
          disableColumnMenu: true,
          resizable: false,
          align: "center",
          headerAlign: "center",
          type: numeric ? "number" : "string",

          ...(isPhone
            ? {
                flex:
                  field === "FullName"
                    ? 1.45
                    : 1,
                minWidth: 0
              }
            : {
                flex:
                  field === "FullName"
                    ? 1.35
                    : 1,
                minWidth:
                  field === "FullName"
                    ? 145
                    : 95
              }),

          renderCell: (params) => {
            const value =
              params?.row?.[field] ??
              params?.value;

            return numeric
              ? formatNumber(value)
              : String(
                  unwrapValue(value) ?? ""
                );
          }
        };
      });

    return [
      ...compactDataColumns,
      {
        field: "__details",
        headerName: "",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        resizable: false,
        width: isPhone ? 34 : 44,
        minWidth: isPhone ? 34 : 44,
        maxWidth: isPhone ? 34 : 44,
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
              width: isPhone ? 24 : 30,
              height: isPhone ? 24 : 30,
              p: 0,
              color: "#057546",
              border:
                "1px solid rgba(5,117,70,.28)",
              backgroundColor: "#eef8f3"
            }}
          >
            <VisibilityOutlinedIcon
              sx={{
                fontSize: isPhone
                  ? 14
                  : 18
              }}
            />
          </IconButton>
        )
      }
    ];
  }, [
    visibleFields,
    rows,
    isPhone,
    isTablet
  ]);

  const dataGridRows = useMemo(
    () =>
      rows.map((row, index) => ({
        id:
          row.Guid ||
          row.guid ||
          `reward-${index}`,
        ...row
      })),
    [rows]
  );

  const totals = useMemo(() => {
    const result = {};

    visibleFields.forEach((field) => {
      const values = rows
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
        rows.length > 0 &&
        values.length === rows.length
      ) {
        result[field] =
          values.reduce(
            (sum, value) =>
              sum + value,
            0
          );
      }
    });

    return result;
  }, [
    visibleFields,
    rows
  ]);

  const totalRewards =
    totals.Total ?? 0;

  const registrationTotal =
    totals.Registration ?? 0;

  const collectionTotal =
    totals.Collection ?? 0;

  const exportCsv = () => {
    if (rows.length === 0) {
      return;
    }

    const escapeValue = (value) =>
      `"${String(
        unwrapValue(value) ?? ""
      ).replaceAll('"', '""')}"`;

    const csv = [
      visibleFields
        .map((field) =>
          escapeValue(
            COLUMN_CAPTIONS[field] ||
            field
          )
        )
        .join(","),

      ...rows.map((row) =>
        visibleFields
          .map((field) =>
            escapeValue(
              row?.[field]
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
      `قائمة المكافآت ${selectedMonth}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
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
              <EmojiEventsOutlinedIcon
                sx={{
                  color: "#057546",
                  fontSize: 38
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
                  قائمة المكافآت
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    fontFamily: "Cairo",
                    color: "#61756d"
                  }}
                >
                  عرض التسجيلات والتحصيلات والبدلات والمكافآت الشهرية للموظفين
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
                background: "#fbfdfc"
              }}
            >
              <Stack sx={uiLayout.filterBarSx}
                direction={{
                  xs: "column",
                  md: "row"
                }}
                spacing={1.4}
                alignItems={{
                  xs: "stretch",
                  md: "center"
                }}
              >
                <TextField sx={uiLayout.formFieldSx}
                  type="month"
                  size="small"
                  label="فترة عرض البدلات"
                  value={selectedMonth}
                  onChange={(event) =>
                    setSelectedMonth(
                      event.target.value
                    )
                  }
                  InputLabelProps={{
                    shrink: true
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={loadData}
                  disabled={loading}
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    background: "#057546"
                  }, uiLayout.buttonSx)}
                >
                  عرض
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadData}
                  disabled={loading}
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo",
                    fontWeight: 900
                  }, uiLayout.buttonSx)}
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
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    color: "#ae1e21",
                    borderColor: "#ae1e21"
                  }, uiLayout.buttonSx)}
                >
                  تصدير
                </Button>
              </Stack>
            </Paper>

            <Stack
              direction={{
                xs: "column",
                md: "row"
              }}
              spacing={1.4}
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
                label={`التسجيلات: ${formatNumber(registrationTotal)}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#fff7cc",
                  color: "#735c00"
                }}
              />

              <Chip
                label={`التحصيلات: ${formatNumber(collectionTotal)}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#eef4ff",
                  color: "#184f90"
                }}
              />

              <Chip
                label={`الإجمالي: ${formatNumber(totalRewards)}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#fdecec",
                  color: "#ae1e21"
                }}
              />
            </Stack>

            <Box
              sx={uiLayout.withUiSx({
                width: "100%",
                height: 730,
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
                        "قائمة المكافآت"
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
                    "بحث داخل القائمة...",
                  filterPanelAddFilter:
                    "إضافة فلتر",
                  filterPanelOperator:
                    "نوع المقارنة",
                  filterPanelColumns:
                    "العمود",
                  filterPanelInputLabel:
                    "القيمة"
                }}
                sx={uiLayout.withUiSx({
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
                }, uiLayout.dataGridSx)}
              />
            </Box>
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
            onClick={() =>
              setMobileSidebarOpen(
                (current) => !current
              )
            }
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
                sm: "0.78rem"
              },
              color: "#17372b",
              textAlign: "start"
            }}
          >
            قائمة المكافآت
          </Typography>
        </Toolbar>
      </AppBar>

      

      <Box
        component="main"
        sx={{
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
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
              "1px solid rgba(5,117,70,.14)",
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
                "1px solid rgba(5,117,70,.12)"
            }}
          >
            <Stack
              direction="row"
              spacing={0.6}
              alignItems="center"
            >
              <EmojiEventsOutlinedIcon
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
                      ? "0.75rem"
                      : "0.82rem"
                  }}
                >
                  قائمة المكافآت
                </Typography>

                {!isPhone && (
                  <Typography
                    sx={{
                      mt: 0.15,
                      fontFamily: "Cairo",
                      color: "#61756d",
                      fontSize: "0.75rem"
                    }}
                  >
                    عرض التسجيلات والتحصيلات والبدلات والمكافآت الشهرية للموظفين
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: isPhone
                ? 0.6
                : 0.85
            }}
          >
            <Paper
              elevation={0}
              sx={{
                mb: isPhone
                  ? 0.6
                  : 0.8,
                p: isPhone
                  ? 0.55
                  : 0.75,
                borderRadius: 1.4,
                border:
                  "1px solid rgba(5,117,70,.13)",
                background: "#fbfdfc"
              }}
            >
              <Box
                sx={uiLayout.withUiSx({
                  display: "grid",
                  gridTemplateColumns: isPhone
                    ? "repeat(2,minmax(0,1fr))"
                    : "repeat(4,minmax(0,1fr))",
                  gap: isPhone
                    ? 0.45
                    : 0.6,

                  "& .MuiInputLabel-root": {
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem"
                  },

                  "& .MuiInputBase-root": {
                    minHeight: isPhone
                      ? 31
                      : 34,
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem"
                  },

                  "& .MuiButton-root": {
                    minHeight: isPhone
                      ? 30
                      : 33,
                    minWidth: 0,
                    px: isPhone
                      ? 0.35
                      : 0.6,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem"
                  },

                  "& .MuiSvgIcon-root": {
                    fontSize: isPhone
                      ? 14
                      : 16
                  }
                }, uiLayout.filterBarSx)}
              >
                <TextField
                  type="month"
                  size="small"
                  label="الشهر"
                  value={selectedMonth}
                  onChange={(event) =>
                    setSelectedMonth(
                      event.target.value
                    )
                  }
                  InputLabelProps={{
                    shrink: true
                  }}
                  fullWidth
                  sx={uiLayout.withUiSx({
                    gridColumn: isPhone
                      ? "1 / -1"
                      : "span 2"
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
                  onClick={exportCsv}
                  disabled={
                    loading ||
                    rows.length === 0
                  }
                  sx={uiLayout.withUiSx({
                    gridColumn: isPhone
                      ? "1 / -1"
                      : "span 2",
                    color: "#ae1e21",
                    borderColor: "#ae1e21"
                  }, uiLayout.buttonSx)}
                >
                  تصدير
                </Button>
              </Box>
            </Paper>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4,minmax(0,1fr))",
                gap: isPhone
                  ? 0.3
                  : 0.45,
                mb: isPhone
                  ? 0.6
                  : 0.8
              }}
            >
              {[
                [
                  "الموظفين",
                  rows.length,
                  "#edf8f3",
                  "#034d31"
                ],
                [
                  "التسجيل",
                  registrationTotal,
                  "#fff7cc",
                  "#735c00"
                ],
                [
                  "التحصيل",
                  collectionTotal,
                  "#eef4ff",
                  "#184f90"
                ],
                [
                  "الإجمالي",
                  totalRewards,
                  "#fdecec",
                  "#ae1e21"
                ]
              ].map(
                ([
                  label,
                  value,
                  background,
                  color
                ]) => (
                  <Chip
                    key={label}
                    label={`${label}: ${formatNumber(value)}`}
                    sx={{
                      height: isPhone
                        ? 25
                        : 29,
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: isPhone
                        ? "0.75rem"
                        : "0.75rem",
                      background,
                      color,

                      "& .MuiChip-label": {
                        px: isPhone
                          ? 0.25
                          : 0.45
                      }
                    }}
                  />
                )
              )}
            </Box>

            <Box
              sx={uiLayout.withUiSx({
                width: "100%",
                height: isPhone
                  ? "calc(100dvh - 310px)"
                  : "calc(100dvh - 270px)",
                minHeight: isPhone
                  ? 390
                  : 520,
                border:
                  "1px solid rgba(5,117,70,.14)",
                borderRadius: 1.4,
                overflow: "hidden"
              }, uiLayout.tableContainerSx)}
            >
              <DataGrid
                rows={dataGridRows}
                columns={compactColumns}
                loading={loading}
                disableRowSelectionOnClick
                disableColumnMenu
                rowHeight={
                  isPhone ? 36 : 44
                }
                columnHeaderHeight={
                  isPhone ? 36 : 50
                }
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
                  50
                ]}
                localeText={{
                  noRowsLabel:
                    "لا توجد بيانات",
                  noResultsOverlayLabel:
                    "لا توجد نتائج مطابقة"
                }}
                sx={uiLayout.withUiSx({
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
                      "#057546",
                    px: isPhone
                      ? 0.06
                      : 0.25
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem",
                    textAlign: "center",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  },

                  "& .MuiDataGrid-columnHeaderTitleContainer": {
                    justifyContent: "center",
                    minWidth: 0,
                    overflow: "hidden"
                  },

                  "& .MuiDataGrid-menuIcon, & .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-sortIcon": {
                    display: "none"
                  },

                  "& .MuiDataGrid-columnSeparator": {
                    display: "none"
                  },

                  "& .MuiDataGrid-cell": {
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem",
                    textAlign: "center",
                    justifyContent: "center",
                    px: isPhone
                      ? 0.04
                      : 0.3,
                    borderColor: "#e6ece9"
                  },

                  "& .MuiDataGrid-row:nth-of-type(even)": {
                    backgroundColor: "#fbfdfc"
                  },

                  "& .MuiDataGrid-main": {
                    overflowX: "hidden"
                  },

                  "& .MuiDataGrid-virtualScroller": {
                    overflowX:
                      "auto"
                  },

                  "& .MuiDataGrid-scrollbar--horizontal": {
                    display: "block"
                  }
                }, uiLayout.dataGridSx)}
              />
            </Box>

            <Dialog sx={uiLayout.dialogLayoutSx}
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
                  px: isPhone
                    ? 1
                    : 1.5,
                  py: isPhone
                    ? 0.8
                    : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 0.6,
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  color: "#057546",
                  fontSize: isPhone
                    ? "0.76rem"
                    : "0.94rem"
                }}
              >
                <span>
                  تفاصيل المكافآت
                </span>

                <IconButton
                  onClick={closeDetails}
                  sx={{
                    width: isPhone
                      ? 30
                      : 34,
                    height: isPhone
                      ? 30
                      : 34,
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
                  p: isPhone
                    ? 0.8
                    : 1.1,
                  overflowY: "auto"
                }}
              >
                {detailsRow ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        isPhone
                          ? "repeat(2,minmax(0,1fr))"
                          : "repeat(3,minmax(0,1fr))",
                      gap: isPhone
                        ? 0.45
                        : 0.65
                    }}
                  >
                    {visibleFields.map(
                      (field) => {
                        const rawValue =
                          detailsRow?.[field];

                        const numeric =
                          numberValue(
                            rawValue
                          ) !== null;

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
                                mb: 0.2,
                                fontFamily:
                                  "Cairo",
                                fontWeight: 900,
                                color: "#60756d",
                                fontSize:
                                  isPhone
                                    ? "0.75rem"
                                    : "0.75rem"
                              }}
                            >
                              {COLUMN_CAPTIONS[field] || field}
                            </Typography>

                            <Typography
                              sx={{
                                fontFamily:
                                  "Cairo",
                                fontWeight: 800,
                                color: "#1f2d3d",
                                fontSize:
                                  isPhone
                                    ? "0.75rem"
                                    : "0.75rem",
                                wordBreak:
                                  "break-word"
                              }}
                            >
                              {numeric
                                ? formatNumber(
                                    rawValue
                                  )
                                : String(
                                    unwrapValue(
                                      rawValue
                                    ) ?? "-"
                                  )}
                            </Typography>
                          </Box>
                        );
                      }
                    )}
                  </Box>
                ) : null}
              </DialogContent>

              <DialogActions
                sx={uiLayout.withUiSx({
                  px: isPhone
                    ? 1
                    : 1.5,
                  py: isPhone
                    ? 0.7
                    : 1
                }, uiLayout.dialogActionsSx)}
              >
                <Button
                  variant="contained"
                  onClick={closeDetails}
                  sx={uiLayout.withUiSx({
                    backgroundColor:
                      "#057546",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem"
                  }, uiLayout.buttonSx)}
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

export default RewardsList;
