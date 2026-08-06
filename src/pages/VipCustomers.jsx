import React, {
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const getToday = () => {
  return new Date()
    .toISOString()
    .slice(0, 10);
};

const getMonthAgo = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);

  return date
    .toISOString()
    .slice(0, 10);
};

const formatGregorianDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
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

const normalizeText = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("أ", "ا")
    .replaceAll("إ", "ا")
    .replaceAll("آ", "ا")
    .replaceAll("ة", "ه")
    .replace(/\s+/g, " ");
};

const escapeCsvValue = (value) => {
  return `"${String(value ?? "")
    .replaceAll('"', '""')}"`;
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

const showSuccess = async (message) => {
  await Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#057546"
  });
};

const VipCustomers = () => {
  const user = useMemo(() => {
    return JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  }, []);

  const userGuid = String(
    user?.guid ||
    user?.Guid ||
    ""
  ).trim();

  const [fromDate, setFromDate] =
    useState(getMonthAgo());

  const [toDate, setToDate] =
    useState(getToday());

  const [searchText, setSearchText] =
    useState("");

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [page, setPage] =
    useState(0);

  const [rowsPerPage, setRowsPerPage] =
    useState(25);

  const columns = useMemo(() => [
    {
      key: "id",
      title: "م",
      render: (row) => row.id || "-"
    },
    {
      key: "regOrderCode",
      title: "رقم الطلب",
      render: (row) =>
        row.regOrderCode || "-"
    },
    {
      key: "studentName",
      title: "اسم العميل",
      render: (row) =>
        row.studentName || "-"
    },
    {
      key: "studentTel",
      title: "رقم الجوال",
      render: (row) =>
        row.studentTel || "-"
    },
    {
      key: "nationalId",
      title: "رقم الهوية",
      render: (row) =>
        row.nationalId || "-"
    },
    {
      key: "branchName",
      title: "الفرع",
      render: (row) =>
        row.branchName || "-"
    },
    {
      key: "batchName",
      title: "الدفعة",
      render: (row) =>
        row.batchName || "-"
    },
    {
      key: "diplomName",
      title: "الدبلوم / الدورة",
      render: (row) =>
        row.diplomName || "-"
    },
    {
      key: "registerUserName",
      title: "مسئول التسجيل",
      render: (row) =>
        row.registerUserName || "-"
    },
    {
      key: "orderStatus",
      title: "حالة الطلب",
      render: (row) =>
        row.orderStatus || "غير مؤكد"
    },
    {
      key: "vipNotes",
      title: "ملاحظات VIP",
      render: (row) =>
        row.vipNotes || "-"
    },
    {
      key: "createdAt",
      title: "تاريخ الإضافة",
      render: (row) =>
        formatGregorianDate(
          row.createdAt
        )
    }
  ], []);

  const filteredRows = useMemo(() => {
    const filter =
      normalizeText(searchText);

    if (!filter) {
      return rows;
    }

    return rows.filter((row) =>
      columns.some((column) =>
        normalizeText(
          column.render(row)
        ).includes(filter)
      )
    );
  }, [
    rows,
    searchText,
    columns
  ]);

  const paginatedRows = useMemo(() => {
    const start =
      page * rowsPerPage;

    return filteredRows.slice(
      start,
      start + rowsPerPage
    );
  }, [
    filteredRows,
    page,
    rowsPerPage
  ]);

  const stats = useMemo(() => {
    const today = getToday();

    return {
      totalCount:
        filteredRows.length,

      todayCount:
        filteredRows.filter(
          (row) =>
            String(
              row.createdAt || ""
            ).slice(0, 10) === today
        ).length,

      withNotesCount:
        filteredRows.filter(
          (row) =>
            String(
              row.vipNotes || ""
            ).trim() !== ""
        ).length
    };
  }, [filteredRows]);

  useEffect(() => {
    setPage(0);
  }, [
    searchText,
    rowsPerPage
  ]);

  const loadData = async () => {
    if (!userGuid) {
      await showError(
        "بيانات المستخدم غير موجودة"
      );
      return;
    }

    if (!fromDate || !toDate) {
      await showError(
        "برجاء تحديد تاريخ البداية والنهاية"
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
        `${API_BASE_URL}/api/vip-customers?${params.toString()}`,
        {
          headers: {
            Accept: "application/json"
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
          "تعذر تحميل عملاء VIP"
        );
      }

      setRows(
        Array.isArray(
          result?.data?.rows
        )
          ? result.data.rows
          : []
      );

      setPage(0);
    } catch (exception) {
      setRows([]);

      await showError(
        exception?.message ||
        "حدث خطأ أثناء تحميل عملاء VIP"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = async () => {
    setSearchText("");
    setFromDate(getMonthAgo());
    setToDate(getToday());

    await loadData();
  };

  const changeStatus = async (
    customer,
    newStatus
  ) => {
    const confirmation =
      await Swal.fire({
        icon: "question",
        title: "تأكيد تغيير الحالة",
        text:
          `هل تريد تغيير حالة العميل إلى: ${newStatus}؟`,
        showCancelButton: true,
        confirmButtonText: "نعم",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    Swal.fire({
      title:
        "جارٍ تحديث حالة العميل",
      text:
        "برجاء الانتظار",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () =>
        Swal.showLoading()
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vip-customers/${customer.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json"
          },
          body: JSON.stringify({
            userGuid,
            status: newStatus
          })
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
          "تعذر تحديث حالة العميل"
        );
      }

      setRows((current) =>
        current.map((item) =>
          item.id === customer.id
            ? {
                ...item,
                orderStatus:
                  newStatus
              }
            : item
        )
      );

      Swal.close();

      await showSuccess(
        result?.message ||
        "تم تحديث حالة العميل بنجاح"
      );
    } catch (exception) {
      Swal.close();

      await showError(
        exception?.message ||
        "حدث خطأ أثناء تحديث الحالة"
      );
    }
  };

  const exportToExcel = async () => {
    if (filteredRows.length === 0) {
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
      const headers =
        columns.map(
          (column) => column.title
        );

      const csvRows = [
        headers
          .map(escapeCsvValue)
          .join(","),

        ...filteredRows.map((row) =>
          columns
            .map((column) =>
              column.render(row)
            )
            .map(escapeCsvValue)
            .join(",")
        )
      ];

      const blob = new Blob(
        [
          "\uFEFF",
          csvRows.join("\r\n")
        ],
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
        "عملاء VIP.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      await showSuccess(
        "تم تصدير عملاء VIP بنجاح"
      );
    } catch (exception) {
      await showError(
        exception?.message ||
        "تعذر تصدير البيانات"
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
                "linear-gradient(135deg, #ffffff 0%, #edf8f3 100%)",

              borderBottom:
                "1px solid rgba(5,117,70,0.12)"
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: "#057546"
              }}
            >
              قائمة عملاء VIP
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
              alignItems={{
                xs: "stretch",
                md: "center"
              }}
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
                label="بحث"
                placeholder="الاسم / الهوية / الجوال / الفرع / الدبلوم"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                sx={{
                  minWidth: {
                    md: 330
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),

                  endAdornment:
                    searchText ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSearchText(
                              ""
                            )
                          }
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                }}
              />

              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={loadData}
                disabled={loading}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  background: "#057546"
                }}
              >
                بحث
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refreshData}
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
                onClick={exportToExcel}
                disabled={
                  loading ||
                  filteredRows.length === 0
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
            </Stack>

            <Stack
              direction={{
                xs: "column",
                md: "row"
              }}
              spacing={2}
              sx={{
                mb: 2.5
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  border:
                    "1px solid rgba(5,117,70,0.22)",
                  textAlign: "center",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: "#057546"
                }}
              >
                إجمالي عملاء VIP
                <br />
                {stats.totalCount}
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  border:
                    "1px solid rgba(212,160,23,0.35)",
                  textAlign: "center",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: "#d4a017"
                }}
              >
                المضافين اليوم
                <br />
                {stats.todayCount}
              </Box>

              <Box
                sx={{
                  flex: 1,
                  p: 1.5,
                  border:
                    "1px solid rgba(174,30,33,0.25)",
                  textAlign: "center",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: "#ae1e21"
                }}
              >
                لديهم ملاحظات
                <br />
                {stats.withNotesCount}
              </Box>
            </Stack>

            <Box
              sx={{
                border:
                  "1px solid rgba(5,117,70,0.14)",
                borderRadius: 3,
                overflow: "auto",
                minHeight: 400
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    minHeight: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center"
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : (
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    minWidth: 1650,
                    borderCollapse:
                      "collapse",
                    direction: "ltr",

                    "& th": {
                      px: 1.2,
                      py: 1.3,
                      background:
                        "#f5f7fa",
                      color: "#29332f",
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      position: "sticky",
                      top: 0,
                      zIndex: 2
                    },

                    "& td": {
                      px: 1.2,
                      py: 1.15,
                      borderBottom:
                        "1px solid #e5ebe8",
                      fontFamily: "Cairo",
                      textAlign: "center",
                      whiteSpace: "nowrap"
                    },

                    "& tbody tr:hover": {
                      background: "#f1faf6"
                    }
                  }}
                >
                  <thead>
                    <tr>
                      {columns.map(
                        (column) => (
                          <th key={column.key}>
                            {column.title}
                          </th>
                        )
                      )}

                      <th>الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={
                            columns.length + 1
                          }
                        >
                          لا توجد بيانات
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map(
                        (row) => {
                          const confirmed =
                            normalizeText(
                              row.orderStatus
                            ).includes("مؤكد") &&
                            !normalizeText(
                              row.orderStatus
                            ).includes("غير");

                          return (
                            <tr key={row.id}>
                              {columns.map(
                                (column) => (
                                  <td
                                    key={
                                      column.key
                                    }
                                    style={
                                      column.key ===
                                      "orderStatus"
                                        ? {
                                            background:
                                              confirmed
                                                ? "#005ab4"
                                                : "#ffc107",
                                            color:
                                              confirmed
                                                ? "#fff"
                                                : "#3c2d00",
                                            fontWeight:
                                              900
                                          }
                                        : column.key ===
                                            "vipNotes" &&
                                          row.vipNotes
                                        ? {
                                            background:
                                              "#fff8e1",
                                            color:
                                              "#785500",
                                            fontWeight:
                                              800
                                          }
                                        : undefined
                                    }
                                  >
                                    {column.render(
                                      row
                                    )}
                                  </td>
                                )
                              )}

                              <td>
                                <Tooltip title="تغيير الحالة إلى مؤكد">
                                  <IconButton
                                    onClick={() =>
                                      changeStatus(
                                        row,
                                        "مؤكد"
                                      )
                                    }
                                    sx={{
                                      color:
                                        "#057546"
                                    }}
                                  >
                                    <CheckCircleIcon />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="تغيير الحالة إلى غير مؤكد">
                                  <IconButton
                                    onClick={() =>
                                      changeStatus(
                                        row,
                                        "غير مؤكد"
                                      )
                                    }
                                    sx={{
                                      color:
                                        "#ae1e21"
                                    }}
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                </Tooltip>
                              </td>
                            </tr>
                          );
                        }
                      )
                    )}
                  </tbody>
                </Box>
              )}
            </Box>

            <TablePagination
              component="div"
              count={filteredRows.length}
              page={page}
              onPageChange={(
                event,
                newPage
              ) =>
                setPage(newPage)
              }
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(
                event
              ) => {
                setRowsPerPage(
                  Number(
                    event.target.value
                  )
                );
                setPage(0);
              }}
              rowsPerPageOptions={[
                10,
                25,
                50,
                100
              ]}
              labelRowsPerPage="عدد الصفوف:"
              labelDisplayedRows={({
                from,
                to,
                count
              }) =>
                `${from}-${to} من ${count}`
              }
              sx={{
                direction: "ltr",

                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontFamily: "Cairo"
                }
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default VipCustomers;
