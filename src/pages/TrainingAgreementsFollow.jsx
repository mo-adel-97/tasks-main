import React, {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Box,
  Button,
  MenuItem,
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
import ClearAllIcon from "@mui/icons-material/ClearAll";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

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

  const columns = useMemo(
    () => [
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
        flex: 1.65,
        minWidth: 170
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        type: "string",
        flex: 1.35,
        minWidth: 150
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        type: "string",
        flex: 1,
        minWidth: 125
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        type: "string",
        flex: 1,
        minWidth: 125
      },
      {
        field: "registeredDays",
        headerName: "تسجيل منذ",
        type: "number",
        flex: 0.75,
        minWidth: 100
      },
      {
        field: "batchName",
        headerName: "الدفعة",
        type: "string",
        flex: 0.95,
        minWidth: 120
      },
      {
        field: "salesmanName",
        headerName: "مندوب البيع",
        type: "string",
        flex: 1,
        minWidth: 130
      }
    ],
    []
  );


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
            <Typography
              variant="h5"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#034d31"
              }}
            >
              متابعة اتفاقيات التدريب
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontFamily: "Cairo",
                color: "#61756d"
              }}
            >
              متابعة حالة توقيع الاتفاقيات بدون كشف الحساب أو فتح ملفات الاتفاقيات
            </Typography>
          </Box>

          <Box
            sx={{
              p: {
                xs: 2,
                md: 3
              }
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row"
              }}
              spacing={1.5}
              sx={{ mb: 2 }}
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
              />

              <TextField
                select
                size="small"
                label="حالة الاتفاقية"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                sx={{
                  minWidth: 190
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

              <TextField
                select
                size="small"
                label="مندوب البيع"
                value={salesmanFilter}
                onChange={(event) =>
                  setSalesmanFilter(
                    event.target.value
                  )
                }
                sx={{
                  minWidth: 190
                }}
              >
                <MenuItem value="الكل">
                  الكل
                </MenuItem>

                {salesmen.map(
                  (value) => (
                    <MenuItem
                      key={value}
                      value={value}
                    >
                      {value}
                    </MenuItem>
                  )
                )}
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
                sx={{
                  minWidth: {
                    md: 260
                  }
                }}
              />

              <Button
                variant="contained"
                startIcon={
                  <SearchIcon />
                }
                onClick={loadData}
                disabled={loading}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
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
                onClick={loadData}
                disabled={loading}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800
                }}
              >
                تحديث
              </Button>

              <Button
                variant="outlined"
                startIcon={
                  <FileDownloadIcon />
                }
                onClick={
                  exportToExcel
                }
                disabled={
                  loading ||
                  filteredRows.length ===
                    0
                }
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  color: "#ae1e21",
                  borderColor: "#ae1e21"
                }}
              >
                تصدير Excel
              </Button>

              <Button
                variant="outlined"
                startIcon={
                  <ClearAllIcon />
                }
                onClick={
                  clearFilters
                }
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800
                }}
              >
                مسح الفلاتر
              </Button>

              <Box sx={{ flexGrow: 1 }} />

              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  background: "#fff9c4",
                  color: "#ae1e21",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  whiteSpace: "nowrap"
                }}
              >
                العدد: {filteredRows.length}
              </Box>
            </Stack>

            <Box
              sx={{
                width: "100%",
                height: 740,
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
                sx={{
                  border: 0,
                  direction: "ltr",
                  fontFamily: "Cairo",

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
                    width: "100%"
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
                    lineHeight: 1.45,
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
                    gap: 1,
                    borderBottom:
                      "1px solid #e6ece9",
                    backgroundColor:
                      "#f8fbf9",
                    direction: "rtl"
                  },

                  "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    color: "#057546"
                  },

                  "& .MuiDataGrid-filterForm": {
                    direction: "rtl",
                    fontFamily: "Cairo"
                  },

                  "& .MuiDataGrid-footerContainer": {
                    direction: "ltr",
                    fontFamily: "Cairo"
                  },

                  "& .MuiTablePagination-root": {
                    fontFamily: "Cairo"
                  },

                  "& .MuiDataGrid-overlay": {
                    fontFamily: "Cairo"
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

export default TrainingAgreementsFollow;