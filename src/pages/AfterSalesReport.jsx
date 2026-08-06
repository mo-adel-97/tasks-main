import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import {
  DataGrid,
  GridToolbar
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const getToday = () =>
  new Date()
    .toISOString()
    .slice(0, 10);


const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("أ", "ا")
    .replaceAll("إ", "ا")
    .replaceAll("آ", "ا")
    .replaceAll("ة", "ه")
    .replace(/\s+/g, " ");

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
    const candidates = [
      value.value,
      value.date,
      value.notesDate,
      value.NotesDate,
      value.date_,
      value.Date_,
      value.createdAt,
      value.CreatedAt,
      value.$date
    ];

    for (const candidate of candidates) {
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

const escapeCsvValue = (
  value
) => {
  return `"${String(
    value ?? ""
  ).replaceAll('"', '""')}"`;
};

const escapeHtml = (
  value
) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

const AfterSalesReport = () => {
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

  const [serverFilters, setServerFilters] =
    useState({
      batches: [],
      followUsers: [],
      salesmen: [],
      callStatuses: []
    });

  const [loading, setLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [batchFilter, setBatchFilter] =
    useState("الكل");

  const [followUserFilter, setFollowUserFilter] =
    useState("الكل");

  const [callStatusFilter, setCallStatusFilter] =
    useState("الكل");

  const [salesmanFilter, setSalesmanFilter] =
    useState("الكل");


  const filteredRows = useMemo(() => {
    const search =
      normalize(searchText);

    return rows.filter((row) => {
      if (
        batchFilter !== "الكل" &&
        row.batchName !== batchFilter
      ) {
        return false;
      }

      if (
        followUserFilter !== "الكل" &&
        row.followUpName !==
          followUserFilter
      ) {
        return false;
      }

      if (
        callStatusFilter !== "الكل" &&
        row.callStatus !==
          callStatusFilter
      ) {
        return false;
      }

      if (
        salesmanFilter !== "الكل" &&
        row.salesmanName !==
          salesmanFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return normalize(
        [
          row.rowNumber,
          formatGregorianDate(
            row.notesDate
          ),
          row.studentName,
          row.studentTel,
          row.diplomName,
          row.batchName,
          row.salesmanName,
          row.followUpName,
          row.notes,
          row.callStatus,
          row.rating,
          row.grade
        ].join(" ")
      ).includes(search);
    });
  }, [
    rows,
    searchText,
    batchFilter,
    followUserFilter,
    callStatusFilter,
    salesmanFilter
  ]);

  const dataGridRows = useMemo(() => {
    return filteredRows.map(
      (row, index) => ({
        id:
          `${row.rowNumber || index}-${index}`,

        rowNumber:
          Number(row.rowNumber || index + 1),

        notesDate:
          toValidDate(
            row.notesDate
          ),

        studentName:
          row.studentName || "",

        studentTel:
          row.studentTel || "",

        diplomName:
          row.diplomName || "",

        batchName:
          row.batchName || "",

        salesmanName:
          row.salesmanName || "",

        followUpName:
          row.followUpName || "",

        callStatus:
          row.callStatus ||
          "لم يتحدد الموقف",

        rating:
          Number(row.rating || 0),

        grade:
          row.grade || "",

        notes:
          row.notes || ""
      })
    );
  }, [filteredRows]);

  const columns = useMemo(
    () => [
      {
        field: "notesDate",
        headerName: "التاريخ",
        type: "date",
        flex: 0.9,
        minWidth: 105,
        renderCell: (params) =>
          formatGregorianDate(
            params.row.notesDate
          )
      },
      {
        field: "rowNumber",
        headerName: "رقم",
        type: "number",
        flex: 0.55,
        minWidth: 70
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        type: "string",
        flex: 1.35,
        minWidth: 145
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        type: "string",
        flex: 1,
        minWidth: 115
      },
      {
        field: "diplomName",
        headerName: "الدبلوم/الدورة",
        type: "string",
        flex: 1.45,
        minWidth: 155
      },
      {
        field: "batchName",
        headerName: "الدفعة",
        type: "string",
        flex: 0.95,
        minWidth: 105
      },
      {
        field: "salesmanName",
        headerName: "مندوب البيع",
        type: "string",
        flex: 1.05,
        minWidth: 120
      },
      {
        field: "followUpName",
        headerName: "القائم بالمتابعة",
        type: "string",
        flex: 1.15,
        minWidth: 130
      },
      {
        field: "callStatus",
        headerName: "حالة الاتصال",
        type: "singleSelect",
        valueOptions: [
          "تم الرد",
          "لم يتم الرد",
          "لم يتحدد الموقف"
        ],
        flex: 1.05,
        minWidth: 125,
        renderCell: (params) => (
          <Box
            component="span"
            sx={{
              px: 1,
              py: 0.4,
              borderRadius: 999,
              fontWeight: 900,
              color:
                params.value === "تم الرد"
                  ? "#057546"
                  : params.value === "لم يتم الرد"
                  ? "#ae1e21"
                  : "#735c00",
              background:
                params.value === "تم الرد"
                  ? "#e6f3ee"
                  : params.value === "لم يتم الرد"
                  ? "#fdecec"
                  : "#fff7cc"
            }}
          >
            {params.value ||
              "لم يتحدد الموقف"}
          </Box>
        )
      },
      {
        field: "rating",
        headerName: "التقييم",
        type: "number",
        flex: 0.75,
        minWidth: 90,
        renderCell: (params) =>
          Number(params.value) > 0
            ? `${params.value}/5`
            : "-"
      },
      {
        field: "grade",
        headerName: "التقدير",
        type: "string",
        flex: 0.85,
        minWidth: 95
      },
      {
        field: "notes",
        headerName: "الملاحظات",
        type: "string",
        flex: 1.6,
        minWidth: 170
      },
      {
        field: "actions",
        headerName: "مشاهدة",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        width: 85,
        renderCell: (params) => (
          <Tooltip title="عرض التفاصيل">
            <span>
              <IconButton
                disabled={
                  !params.row.notes
                }
                onClick={() =>
                  viewNotes(
                    params.row
                  )
                }
                sx={{
                  color: "#057546"
                }}
              >
                <VisibilityIcon />
              </IconButton>
            </span>
          </Tooltip>
        )
      }
    ],
    []
  );

  const filteredStats = useMemo(() => {
    const rated =
      filteredRows.filter(
        (row) =>
          Number(row.rating) > 0
      );

    const average =
      rated.length === 0
        ? 0
        : rated.reduce(
            (sum, row) =>
              sum +
              Number(
                row.rating || 0
              ),
            0
          ) / rated.length;

    const rounded =
      average > 0
        ? Math.max(
            1,
            Math.min(
              5,
              Math.round(average)
            )
          )
        : 0;

    const grades = {
      5: "ممتاز",
      4: "جيد جدًا",
      3: "جيد",
      2: "مقبول",
      1: "ضعيف",
      0: "غير متاح"
    };

    return {
      count:
        filteredRows.length,

      ratedCount:
        rated.length,

      average,

      grade:
        grades[rounded] ||
        "غير متاح"
    };
  }, [filteredRows]);


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

      const response =
        await fetch(
          `${API_BASE_URL}/api/after-sales-report?${params.toString()}`,
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
            "تعذر تحميل تقرير متابعة العملاء"
        );
      }

      setRows(
        Array.isArray(
          result?.data?.rows
        )
          ? result.data.rows
          : []
      );

      setServerFilters({
        batches:
          result?.data?.filters
            ?.batches || [],

        followUsers:
          result?.data?.filters
            ?.followUsers || [],

        salesmen:
          result?.data?.filters
            ?.salesmen || [],

        callStatuses:
          result?.data?.filters
            ?.callStatuses || []
      });

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
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setSearchText("");
    setBatchFilter("الكل");
    setFollowUserFilter("الكل");
    setCallStatusFilter("الكل");
    setSalesmanFilter("الكل");
  };

  const viewNotes = async (
    row
  ) => {
    const notes =
      String(
        row?.notes || ""
      ).trim();

    if (!notes) {
      await Swal.fire({
        icon: "info",
        title: "الملاحظات",
        text:
          "لا توجد ملاحظات لهذا الصف",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      return;
    }

    const lines =
      notes
        .replaceAll("\r\n", "\n")
        .replaceAll("\r", "\n")
        .split("\n")
        .filter((line) =>
          line.trim() !== ""
        );

    const prettyLines =
      lines.map((line) => {
        const clean =
          escapeHtml(
            line.trim()
          );

        if (
          clean.includes(
            "نموذج متابعة ما بعد البيع"
          )
        ) {
          return `
            <div style="
              font-size:20px;
              font-weight:900;
              color:#034d31;
              margin-bottom:12px;
            ">
              ${clean}
            </div>
          `;
        }

        if (
          clean.includes(
            "التقييم"
          )
        ) {
          return `
            <div style="
              padding:10px 12px;
              margin:7px 0;
              border-radius:10px;
              background:#fff7cc;
              color:#735c00;
              font-weight:900;
            ">
              ${clean}
            </div>
          `;
        }

        if (
          clean.includes(
            "ملاحظة إضافية"
          )
        ) {
          return `
            <div style="
              padding:10px 12px;
              margin:7px 0;
              border-radius:10px;
              background:#eef4ff;
              color:#184f90;
              font-weight:700;
            ">
              ${clean}
            </div>
          `;
        }

        return `
          <div style="
            padding:8px 10px;
            margin:5px 0;
            border-radius:9px;
            background:#f7faf8;
            border:1px solid #e5ece8;
          ">
            ${clean}
          </div>
        `;
      }).join("");

    const result =
      await Swal.fire({
        title:
          "تفاصيل الملاحظات",
        html: `
          <div style="
            direction:rtl;
            text-align:right;
            font-family:Cairo,Arial,sans-serif;
            max-height:60vh;
            overflow:auto;
            padding:4px;
          ">
            ${prettyLines}
          </div>
        `,
        width: 850,
        showCancelButton: true,
        confirmButtonText: "نسخ",
        cancelButtonText: "إغلاق",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#6c757d",
        reverseButtons: true
      });

    if (result.isConfirmed) {
      try {
        await navigator.clipboard
          .writeText(notes);

        await Swal.fire({
          icon: "success",
          title: "تم النسخ",
          text:
            "تم نسخ تفاصيل الملاحظات",
          timer: 1300,
          showConfirmButton: false
        });
      } catch {
        await showError(
          "تعذر نسخ الملاحظات"
        );
      }
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
        "التاريخ",
        "رقم",
        "اسم الطالب",
        "رقم الجوال",
        "الدبلوم/الدورة",
        "الدفعة",
        "مندوب البيع",
        "القائم بالمتابعة",
        "حالة الاتصال",
        "التقييم",
        "التقدير",
        "الملاحظات"
      ];

      const csvRows = [
        headers
          .map(escapeCsvValue)
          .join(","),

        ...filteredRows.map(
          (row) =>
            [
              formatGregorianDate(
                row.notesDate
              ),
              row.rowNumber,
              row.studentName,
              row.studentTel,
              row.diplomName,
              row.batchName,
              row.salesmanName,
              row.followUpName,
              row.callStatus,
              row.rating ||
                "",
              row.grade ||
                "",
              row.notes
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
        "تقرير متابعة العملاء.csv";

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

  const optionsWithAll = (
    values
  ) => [
    "الكل",
    ...values
  ];

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
              تقرير متابعة العملاء
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontFamily: "Cairo",
                color: "#61756d"
              }}
            >
              عرض تقارير متابعة ما بعد البيع ومتوسط التقييم
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
                    md: 280
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
            </Stack>

            <Stack
              direction={{
                xs: "column",
                lg: "row"
              }}
              spacing={1.5}
              sx={{ mb: 2 }}
            >
              <TextField
                select
                fullWidth
                size="small"
                label="الدفعة"
                value={batchFilter}
                onChange={(event) =>
                  setBatchFilter(
                    event.target.value
                  )
                }
              >
                {optionsWithAll(
                  serverFilters.batches
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="القائم بالمتابعة"
                value={
                  followUserFilter
                }
                onChange={(event) =>
                  setFollowUserFilter(
                    event.target.value
                  )
                }
              >
                {optionsWithAll(
                  serverFilters.followUsers
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="حالة الاتصال"
                value={
                  callStatusFilter
                }
                onChange={(event) =>
                  setCallStatusFilter(
                    event.target.value
                  )
                }
              >
                {optionsWithAll(
                  serverFilters.callStatuses
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                label="مندوب البيع"
                value={
                  salesmanFilter
                }
                onChange={(event) =>
                  setSalesmanFilter(
                    event.target.value
                  )
                }
              >
                {optionsWithAll(
                  serverFilters.salesmen
                ).map((value) => (
                  <MenuItem
                    key={value}
                    value={value}
                  >
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack
              direction={{
                xs: "column",
                md: "row"
              }}
              spacing={2}
              sx={{ mb: 2.5 }}
            >
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  textAlign: "center",
                  background: "#fff9c4",
                  color: "#ae1e21",
                  fontFamily: "Cairo",
                  fontWeight: 900
                }}
              >
                العدد
                <br />
                {filteredStats.count}
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  textAlign: "center",
                  background: "#edf8f3",
                  color: "#034d31",
                  fontFamily: "Cairo",
                  fontWeight: 900
                }}
              >
                متوسط التقييم
                <br />
                {filteredStats.average > 0
                  ? `${filteredStats.average.toFixed(2)}/5 (${filteredStats.grade})`
                  : "غير متاح"}
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 2,
                  textAlign: "center",
                  background: "#eef4ff",
                  color: "#184f90",
                  fontFamily: "Cairo",
                  fontWeight: 900
                }}
              >
                عدد التقييمات
                <br />
                {filteredStats.ratedCount}
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
                        "تقرير متابعة العملاء"
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
                  columnMenuFilter:
                    "فلترة",
                  columnMenuHideColumn:
                    "إخفاء العمود",
                  columnMenuSortAsc:
                    "ترتيب تصاعدي",
                  columnMenuSortDesc:
                    "ترتيب تنازلي",
                  columnMenuUnsort:
                    "إلغاء الترتيب"
                }}
                sx={{
                  border: 0,
                  direction: "ltr",
                  fontFamily: "Cairo",

                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor:
                      "#057546",
                    color: "#fff",
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

                  "& .MuiDataGrid-footerContainer": {
                    direction: "ltr",
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

export default AfterSalesReport;