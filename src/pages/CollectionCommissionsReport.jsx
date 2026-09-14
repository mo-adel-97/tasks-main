import { designTokens } from '../config/designTokens';
import PageContainer from '../components/common/PageContainer';
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
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import PaidIcon from "@mui/icons-material/Paid";
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

const getToday = () =>
  toIsoDate(new Date());

const normalizeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isGuidColumn = (field) => {
  const key = normalizeKey(field);

  return (
    key === "user guid" ||
    key === "userguid" ||
    key === "trainerguid" ||
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

  const result = Number(scalar);

  return Number.isFinite(result)
    ? result
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

const CollectionCommissionsReport = () => {
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

  const [fromDate, setFromDate] =
    useState(getToday());

  const [toDate, setToDate] =
    useState(getToday());

  const [branches, setBranches] =
    useState([]);

  const [selectedBranch, setSelectedBranch] =
    useState(null);

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [loadingBranches, setLoadingBranches] =
    useState(false);

  const [migrating, setMigrating] =
    useState(false);

  const loadBranches = useCallback(
    async () => {
      setLoadingBranches(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/collection-commissions-report/branches?userGuid=${encodeURIComponent(userGuid)}`,
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
            "تعذر تحميل الفروع"
          );
        }

        setBranches(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (error) {
        await showError(
          error?.message ||
          "حدث خطأ أثناء تحميل الفروع"
        );
      } finally {
        setLoadingBranches(false);
      }
    },
    [userGuid]
  );

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

        if (selectedBranch?.guid) {
          params.set(
            "branchGuid",
            selectedBranch.guid
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/api/collection-commissions-report?${params.toString()}`,
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
            "تعذر تحميل تقرير عمولات التحصيل"
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
          "حدث خطأ أثناء تحميل التقرير"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      userGuid,
      fromDate,
      toDate,
      selectedBranch
    ]
  );

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

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

    const preferredNameFields = [
      "مسؤول الاتصال",
      "اسم الموظف",
      "الموظف"
    ];

    const employeeField =
      preferredNameFields.find(
        (field) =>
          fields.includes(field)
      );

    if (employeeField) {
      const index =
        fields.indexOf(employeeField);

      fields.splice(index, 1);
      fields.unshift(employeeField);
    }

    return fields;
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

        return {
          field,
          headerName: field,
          headerAlign: "center",
  align: "center",
          type:
            numeric
              ? "number"
              : "string",
          minWidth:
            [
              "مسؤول الاتصال",
              "اسم الموظف",
              "الموظف"
            ].includes(field)
              ? 230
              : 125,
          flex:
            [
              "مسؤول الاتصال",
              "اسم الموظف",
              "الموظف"
            ].includes(field)
              ? 1.7
              : 1,
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
        "مسؤول الاتصال",
        "اسم الموظف",
        "الموظف"
      ) || visibleFields[0];

    const studentsField =
      findField(
        "عدد الطلاب",
        "إجمالي الطلاب",
        "اجمالي الطلاب"
      );

    const collectionField =
      findField(
        "إجمالي التحصيل",
        "اجمالي التحصيل",
        "التحصيل"
      );

    const commissionField =
      findField(
        "العمولة",
        "إجمالي العمولة",
        "اجمالي العمولة"
      );

    const percentField =
      findField(
        "نسبة التحصيل",
        "نسبة",
        "نسبة التحصيل %"
      );

    const preferredFields = [
      employeeField,
      studentsField,
      collectionField,
      commissionField,
      percentField
    ];

    const fallbackFields =
      visibleFields.filter(
        (field) =>
          !preferredFields.includes(field)
      );

    const desiredCount =
      isPhone ? 4 : 5;

    const chosenFields = [
      ...preferredFields.filter(Boolean),
      ...fallbackFields
    ]
      .filter(
        (field, index, array) =>
          field &&
          array.indexOf(field) === index
      )
      .slice(0, desiredCount);

    const shortHeader = (field) => {
      if (field === employeeField) {
        return "الموظف";
      }

      if (field === studentsField) {
        return isPhone
          ? "الطلاب"
          : "عدد الطلاب";
      }

      if (field === collectionField) {
        return isPhone
          ? "التحصيل"
          : "إجمالي التحصيل";
      }

      if (field === commissionField) {
        return isPhone
          ? "العمولة"
          : "إجمالي العمولة";
      }

      if (field === percentField) {
        return "النسبة";
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
          numberValue(sample) !== null;

        const isEmployee =
          field === employeeField;

        return {
          field,
          headerName: shortHeader(field),
          type: numeric
            ? "number"
            : "string",
          sortable: false,
          disableColumnMenu: true,
          resizable: false,

          ...(isPhone
            ? {
                flex: isEmployee
                  ? 1.45
                  : 1,
                minWidth: 0
              }
            : {
                flex: isEmployee
                  ? 1.45
                  : 0.95,
                minWidth: isEmployee
                  ? 135
                  : 90
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
      ...dataColumns,
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
              width: isPhone ? 24 : 29,
              height: isPhone ? 24 : 29,
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
                  : 17
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
          row["User Guid"] ||
          row.UserGuid ||
          row.userGuid ||
          row.trainerguid ||
          `collection-${index}`,
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

  const totalStudents =
    totals["عدد الطلاب"] ??
    totals["إجمالي الطلاب"] ??
    totals["اجمالي الطلاب"] ??
    0;

  const totalCollection =
    totals["إجمالي التحصيل"] ??
    totals["اجمالي التحصيل"] ??
    0;

  const totalCommission =
    totals["العمولة"] ??
    totals["إجمالي العمولة"] ??
    totals["اجمالي العمولة"] ??
    0;

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
        .map(escapeValue)
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
      `تقرير عمولات التحصيل ${fromDate} إلى ${toDate}.csv`;

    document.body.appendChild(link);
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
          "ترحيل عمولات التحصيل",
        text:
          "سيتم ترحيل عمولات التحصيل الظاهرة إلى شيت المكافآت.",
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
        `${API_BASE_URL}/api/collection-commissions-report/migrate-rewards`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            userGuid,
            fromDate,
            toDate,
            branchGuid:
              selectedBranch?.guid ||
              null
          })
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر ترحيل عمولات التحصيل"
        );
      }

      await Swal.fire({
        icon: "success",
        title: "تم تنفيذ الترحيل",
        html: `
          <div style="
            direction:rtl;
            font-family:Cairo,Arial;
            line-height:2;
          ">
            مضاف:
            <strong>
              ${result?.data?.inserted ?? 0}
            </strong>
            <br />
            محدث:
            <strong>
              ${result?.data?.updated ?? 0}
            </strong>
            <br />
            تخطي بدون مستخدم:
            <strong>
              ${result?.data?.skippedNoUser ?? 0}
            </strong>
            <br />
            تخطي بدون مبلغ:
            <strong>
              ${result?.data?.skippedNoAmount ?? 0}
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
      

      <PageContainer
        component="main"
        sx={{
          minHeight: "100vh",
          
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
              p: designTokens.cardPadding,
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
              <PaidIcon
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
                  تقرير عمولات التحصيل
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    fontFamily: "Cairo",
                    color: "#61756d"
                  }}
                >
                  متابعة تحصيل الموظفين ونسب التحصيل وترحيل العمولات لشيت المكافآت
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: designTokens.cardPadding
            }}
          >
            <Paper
              elevation={0}
              sx={{
                mb: 2,
                p: designTokens.cardPadding,
                borderRadius: 3,
                border:
                  "1px solid rgba(5,117,70,0.13)",
                background: "#fbfdfc"
              }}
            >
              <Stack sx={uiLayout.filterBarSx}
                direction={{
                  xs: "column",
                  xl: "row"
                }}
                spacing={1.4}
                alignItems={{
                  xs: "stretch",
                  xl: "center"
                }}
              >
                <TextField sx={uiLayout.formFieldSx}
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

                <TextField sx={uiLayout.formFieldSx}
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

                <Autocomplete
                  options={branches}
                  value={selectedBranch}
                  loading={loadingBranches}
                  onChange={(
                    event,
                    value
                  ) =>
                    setSelectedBranch(
                      value
                    )
                  }
                  isOptionEqualToValue={(
                    option,
                    value
                  ) =>
                    option.guid ===
                    value.guid
                  }
                  getOptionLabel={(option) =>
                    option?.name || ""
                  }
                  sx={{
                    minWidth: {
                      xs: "100%",
                      xl: 330
                    }
                  }}
                  renderInput={(params) => (
                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      {...params}
                      size="small"
                      label="الفرع"
                      placeholder="كل الفروع"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingBranches ? (
                              <CircularProgress
                                size={18}
                              />
                            ) : null}

                            {
                              params
                                .InputProps
                                .endAdornment
                            }
                          </>
                        )
                      }}
                    />
                  )}
                />

                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={loadReport}
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
                  onClick={loadReport}
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
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    background: "#184f90"
                  }, uiLayout.buttonSx)}
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
              spacing={1.4}
              sx={{ mb: 2 }}
            >
              <Chip
                label={`عدد الصفوف: ${rows.length}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#edf8f3",
                  color: "#034d31"
                }}
              />

              <Chip
                label={`إجمالي الطلاب: ${formatNumber(totalStudents)}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#fff7cc",
                  color: "#735c00"
                }}
              />

              <Chip
                label={`إجمالي التحصيل: ${formatNumber(totalCollection)}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#eef4ff",
                  color: "#184f90"
                }}
              />

              <Chip
                label={`إجمالي العمولة: ${formatNumber(totalCommission)}`}
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
                height: designTokens.dataRegionHeight,
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
                        "تقرير عمولات التحصيل"
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
                sx={uiLayout.withUiSx({
                  border: 0,
                  direction: "rtl",
                  textAlign:"center",
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
      </PageContainer>
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
                sm: "0.76rem"
              },
              color: "#17372b",
              textAlign: "start"
            }}
          >
            تقرير عمولات التحصيل
          </Typography>
        </Toolbar>
      </AppBar>

      

      <PageContainer
        component="main"
        sx={{
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          width: "100%",
          maxWidth: "100%",
          
          
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
              <PaidIcon
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
                  تقرير عمولات التحصيل
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
                    متابعة تحصيل الموظفين ونسب التحصيل وترحيل العمولات لشيت المكافآت
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
                <TextField sx={uiLayout.formFieldSx}
                  type="date"
                  size="small"
                  label="من"
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
                  label="إلى"
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

                <Autocomplete
                  options={branches}
                  value={selectedBranch}
                  loading={loadingBranches}
                  onChange={(
                    event,
                    value
                  ) =>
                    setSelectedBranch(value)
                  }
                  isOptionEqualToValue={(
                    option,
                    value
                  ) =>
                    option.guid ===
                    value.guid
                  }
                  getOptionLabel={(option) =>
                    option?.name || ""
                  }
                  sx={{
                    gridColumn: isPhone
                      ? "1 / -1"
                      : "span 2"
                  }}
                  renderInput={(params) => (
                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      {...params}
                      size="small"
                      label="الفرع"
                      placeholder="كل الفروع"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingBranches ? (
                              <CircularProgress
                                size={16}
                              />
                            ) : null}

                            {
                              params
                                .InputProps
                                .endAdornment
                            }
                          </>
                        )
                      }}
                    />
                  )}
                />

                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={loadReport}
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
                  sx={uiLayout.withUiSx({
                    color: "#ae1e21",
                    borderColor: "#ae1e21"
                  }, uiLayout.buttonSx)}
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
                  sx={uiLayout.withUiSx({
                    background: "#184f90"
                  }, uiLayout.buttonSx)}
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
                  "الصفوف",
                  rows.length,
                  "#edf8f3",
                  "#034d31"
                ],
                [
                  "الطلاب",
                  totalStudents,
                  "#fff7cc",
                  "#735c00"
                ],
                [
                  "التحصيل",
                  totalCollection,
                  "#eef4ff",
                  "#184f90"
                ],
                [
                  "العمولة",
                  totalCommission,
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
                  ? "calc(100dvh - 325px)"
                  : "calc(100dvh - 285px)",
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
                  },

                  "& .MuiDataGrid-footerContainer": {
                    minHeight: isPhone
                      ? 36
                      : 42
                  },

                  "& .MuiTablePagination-toolbar": {
                    minHeight: isPhone
                      ? 36
                      : 42,
                    px: isPhone
                      ? 0.2
                      : 0.5
                  },

                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem"
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
                  تفاصيل عمولة التحصيل
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
                              {field}
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
      </PageContainer>
    </Box></NavigationShell>
    )
  );
};

export default CollectionCommissionsReport;
