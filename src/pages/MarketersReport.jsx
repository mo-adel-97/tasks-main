import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
  TextField
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
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const SIDEBAR_WIDTH = 280;

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
    <Box
      sx={{
        minHeight: "100vh",
        background: "#f5f8f7",
        direction: "ltr"
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          marginLeft: {
            xs: 0,
            md:
              `${SIDEBAR_WIDTH}px`
          },
          width: {
            xs: "100%",
            md:
              `calc(100% - ${SIDEBAR_WIDTH}px)`
          },
          minHeight: "100vh",
          p: {
            xs: 1.5,
            md: 3
          },
          direction: "ltr"
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
                />

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
                />

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
                  direction: "ltr",
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
                    direction: "ltr",
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
    </Box>
  );
};

export default MarketersReport;
