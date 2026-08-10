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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ClearIcon from "@mui/icons-material/Clear";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
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

const getMonthAgo = () => {
  const date = new Date();

  date.setMonth(
    date.getMonth() - 1
  );

  return date
    .toISOString()
    .slice(0, 10);
};

const formatGregorianDate = (
  value
) => {
  if (!value) return "-";

  const date =
    new Date(value);

  if (Number.isNaN(
        date.getTime()
      ))
  {
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

const RegistrationRequestReport = () => {
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
    useState(getMonthAgo());

  const [toDate, setToDate] =
    useState(getToday());

  const [registrationUserGuid, setRegistrationUserGuid] =
    useState("الكل");

  const [users, setUsers] =
    useState([]);

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("الكل");

  const [page, setPage] =
    useState(0);

  const [rowsPerPage, setRowsPerPage] =
    useState(25);

  const loadUsers = async () => {
    if (!userGuid) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/registration-request-report/users?userGuid=${encodeURIComponent(userGuid)}`,
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
            "تعذر تحميل مسئولي التسجيل"
        );
      }

      setUsers(
        Array.isArray(
          result?.data
        )
          ? result.data
          : []
      );
    } catch (error) {
      await showError(
        error?.message ||
          "حدث خطأ أثناء تحميل مسئولي التسجيل"
      );
    }
  };

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
        registrationUserGuid !==
        "الكل"
      ) {
        params.set(
          "registrationUserGuid",
          registrationUserGuid
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/api/registration-request-report?${params.toString()}`,
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
            "تعذر تحميل تقرير طلب التسجيل"
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
    loadUsers();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const search =
      normalize(searchText);

    return rows.filter((row) => {
      if (
        statusFilter !== "الكل" &&
        row.requestStatus !==
          statusFilter
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      return normalize(
        [
          row.id,
          row.fullNameAr,
          row.fullNameEn,
          row.mobile,
          row.email,
          row.nationalId,
          row.gender,
          row.region,
          row.requestStatus,
          row.registrationUserName,
          row.createdAt
        ].join(" ")
      ).includes(search);
    });
  }, [
    rows,
    searchText,
    statusFilter
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

  useEffect(() => {
    setPage(0);
  }, [
    searchText,
    statusFilter,
    rowsPerPage
  ]);

  const confirmRequest = async (
    row
  ) => {
    if (
      normalize(
        row.requestStatus
      ).includes("تم التاكيد")
    ) {
      await Swal.fire({
        icon: "info",
        title:
          "تم تأكيد الطلب",
        text:
          "هذا الطلب تم تأكيده من قبل",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      return;
    }

    const confirmation =
      await Swal.fire({
        icon: "question",
        title: "تأكيد الطلب",
        html: `
          <div style="
            direction:rtl;
            text-align:right;
            font-family:Cairo,Arial,sans-serif;
            line-height:2;
          ">
            <div><strong>رقم الطلب:</strong> ${row.id}</div>
            <div><strong>اسم الطالب:</strong> ${row.fullNameAr || "-"}</div>
            <div><strong>رقم الهوية:</strong> ${row.nationalId || "-"}</div>
            <div><strong>رقم الجوال:</strong> ${row.mobile || "-"}</div>
            <hr />
            هل تريد تأكيد الطلب وإنشاء طالب جديد؟
          </div>
        `,
        showCancelButton: true,
        confirmButtonText:
          "نعم، تأكيد وإنشاء الطالب",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true,
        allowOutsideClick: false
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    Swal.fire({
      title:
        "جارٍ تأكيد الطلب",
      text:
        "يتم الآن إنشاء حساب الطالب وتسجيل العملية",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () =>
        Swal.showLoading()
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/registration-request-report/${row.id}/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json"
          },
          body: JSON.stringify({
            userGuid
          })
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
            "تعذر تأكيد الطلب"
        );
      }

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "تم بنجاح",
        text:
          result?.message ||
          "تم تأكيد الطلب وإنشاء الطالب بنجاح",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#057546"
      });

      await loadData();
    } catch (error) {
      Swal.close();

      await showError(
        error?.message ||
          "حدث خطأ أثناء تأكيد الطلب"
      );
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
        "رقم الطلب",
        "الاسم العربي",
        "الاسم الإنجليزي",
        "الجوال",
        "البريد الإلكتروني",
        "رقم الهوية",
        "النوع",
        "المنطقة",
        "الحالة",
        "مسئول التسجيل",
        "تاريخ الإضافة"
      ];

      const csvRows = [
        headers
          .map(escapeCsvValue)
          .join(","),

        ...filteredRows.map(
          (row) =>
            [
              row.id,
              row.fullNameAr,
              row.fullNameEn,
              row.mobile,
              row.email,
              row.nationalId,
              row.gender,
              row.region,
              row.requestStatus,
              row.registrationUserName,
              formatGregorianDate(
                row.createdAt
              )
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
        "تقرير طلب التسجيل.csv";

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
              تقرير طلب التسجيل
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontFamily: "Cairo",
                color: "#61756d"
              }}
            >
              متابعة طلبات التسجيل وتأكيد الطلب وإنشاء الطالب
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
                label="مسئول التسجيل"
                value={
                  registrationUserGuid
                }
                onChange={(event) =>
                  setRegistrationUserGuid(
                    event.target.value
                  )
                }
                sx={{
                  minWidth: 240
                }}
              >
                <MenuItem value="الكل">
                  الكل
                </MenuItem>

                {users.map((item) => (
                  <MenuItem
                    key={item.guid}
                    value={item.guid}
                  >
                    {item.fullName}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="الحالة"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                sx={{
                  minWidth: 180
                }}
              >
                <MenuItem value="الكل">
                  الكل
                </MenuItem>

                <MenuItem value="لم يتم التأكيد">
                  لم يتم التأكيد
                </MenuItem>

                <MenuItem value="تم التأكيد">
                  تم التأكيد
                </MenuItem>
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
                بحث
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
                border:
                  "1px solid rgba(5,117,70,0.14)",
                borderRadius: 3,
                overflow: "auto",
                minHeight: 430
              }}
            >
              {loading ? (
                <Box
                  sx={{
                    minHeight: 430,
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
                      background: "#057546",
                      color: "#fff",
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
                      py: 1.1,
                      borderBottom:
                        "1px solid #e6ece9",
                      fontFamily: "Cairo",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      maxWidth: 260,
                      overflow: "hidden",
                      textOverflow:
                        "ellipsis"
                    },

                    "& tbody tr:nth-of-type(even)": {
                      background: "#fbfdfc"
                    },

                    "& tbody tr:hover": {
                      background: "#eef4ff"
                    }
                  }}
                >
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>الاسم العربي</th>
                      <th>الاسم الإنجليزي</th>
                      <th>الجوال</th>
                      <th>البريد الإلكتروني</th>
                      <th>رقم الهوية</th>
                      <th>النوع</th>
                      <th>المنطقة</th>
                      <th>الحالة</th>
                      <th>مسئول التسجيل</th>
                      <th>تاريخ الإضافة</th>
                      <th>تأكيد الطلب</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedRows.length ===
                    0 ? (
                      <tr>
                        <td colSpan={12}>
                          لا توجد بيانات مطابقة
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map(
                        (row) => {
                          const confirmed =
                            normalize(
                              row.requestStatus
                            ).includes(
                              "تم التاكيد"
                            );

                          return (
                            <tr key={row.id}>
                              <td>
                                {row.id}
                              </td>

                              <td title={row.fullNameAr}>
                                {row.fullNameAr ||
                                  "-"}
                              </td>

                              <td title={row.fullNameEn}>
                                {row.fullNameEn ||
                                  "-"}
                              </td>

                              <td>
                                {row.mobile ||
                                  "-"}
                              </td>

                              <td title={row.email}>
                                {row.email ||
                                  "-"}
                              </td>

                              <td>
                                {row.nationalId ||
                                  "-"}
                              </td>

                              <td>
                                {row.gender ||
                                  "-"}
                              </td>

                              <td>
                                {row.region ||
                                  "-"}
                              </td>

                              <td>
                                <Box
                                  component="span"
                                  sx={{
                                    px: 1.2,
                                    py: 0.45,
                                    borderRadius:
                                      999,
                                    fontWeight:
                                      900,
                                    color:
                                      confirmed
                                        ? "#057546"
                                        : "#ae1e21",
                                    background:
                                      confirmed
                                        ? "#e6f3ee"
                                        : "#fdecec"
                                  }}
                                >
                                  {row.requestStatus ||
                                    "لم يتم التأكيد"}
                                </Box>
                              </td>

                              <td title={row.registrationUserName}>
                                {row.registrationUserName ||
                                  "-"}
                              </td>

                              <td>
                                {formatGregorianDate(
                                  row.createdAt
                                )}
                              </td>

                              <td>
                                <Tooltip
                                  title={
                                    confirmed
                                      ? "تم تأكيد الطلب"
                                      : "تأكيد الطلب وإنشاء الطالب"
                                  }
                                >
                                  <span>
                                    <IconButton
                                      disabled={
                                        confirmed
                                      }
                                      onClick={() =>
                                        confirmRequest(
                                          row
                                        )
                                      }
                                      sx={{
                                        color:
                                          confirmed
                                            ? undefined
                                            : "#057546"
                                      }}
                                    >
                                      <CheckCircleIcon />
                                    </IconButton>
                                  </span>
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
              rowsPerPage={
                rowsPerPage
              }
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
                  fontFamily:
                    "Cairo"
                }
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default RegistrationRequestReport;
