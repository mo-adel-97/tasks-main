import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography
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
            md: `${SIDEBAR_WIDTH}px`
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
              <Stack
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
                    <TextField
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
                  startIcon={<RefreshIcon />}
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
              sx={{
                width: "100%",
                height: 710,
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
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default CollectionCommissionsReport;
