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
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

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
              <Stack
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
                <TextField
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
                  onClick={loadData}
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
              sx={{
                width: "100%",
                height: 730,
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

export default RewardsList;
