import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
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
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import StarIcon from "@mui/icons-material/Star";
import ClearIcon from "@mui/icons-material/Clear";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

const getValue = (row, possibleNames) => {
  for (const name of possibleNames) {
    const value = row?.[name];

    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};

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
      value.orderDate,
      value.OrderDate,
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

const formatGregorianDate = (value) => {
  const date = toValidDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
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

const normalizeStatus = (value) => {
  return normalizeText(value);
};

const isConfirmedOrder = (status) => {
  const normalized = normalizeStatus(status);

  return (
    normalized.includes("تم التاكيد") ||
    normalized.includes("مؤكد") ||
    normalized.includes("موكد") ||
    normalized.includes("تم التسجيل")
  );
};

const escapeCsvValue = (value) => {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
};

const safeHtml = (value) => {
  return String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const fireError = async (message) => {
  await Swal.fire({
    icon: "error",
    title: "حدث خطأ",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });
};

const fireSuccess = async (message) => {
  await Swal.fire({
    icon: "success",
    title: "تم بنجاح",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#057546"
  });
};

const AdmissionRequestsReport = () => {
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
    useState(getToday());

  const [toDate, setToDate] =
    useState(getToday());

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [globalFilter, setGlobalFilter] =
    useState("");



  const filteredRows = useMemo(() => {
    const normalizedGlobal =
      normalizeText(globalFilter);

    if (!normalizedGlobal) {
      return rows;
    }

    return rows.filter((row) => {
      return normalizeText(
        [
          getValue(row, [
            "Code",
            "RegOrderCode"
          ]),

          formatGregorianDate(
            getValue(row, [
              "OrderDate",
              "Date_"
            ])
          ),

          getValue(row, [
            "StudentName",
            "StudentFullName"
          ]),

          getValue(row, [
            "StudentTel",
            "Mobile"
          ]),

          getValue(row, [
            "NationalId"
          ]),

          getValue(row, [
            "FullName",
            "RegisterUserName"
          ]),

          getValue(row, [
            "ORDERSTAUT",
            "OrderStatus"
          ]),

          getValue(row, [
            "SalesNotes"
          ]),

          getValue(row, [
            "BatchName",
            "Batch",
            "DofaName"
          ])
        ].join(" ")
      ).includes(normalizedGlobal);
    });
  }, [
    rows,
    globalFilter
  ]);

  const dataGridRows = useMemo(() => {
    return filteredRows.map(
      (row, index) => ({
        id:
          getValue(
            row,
            [
              "ORDERGUID",
              "OrderGuid",
              "RegOrderGuid",
              "Guid"
            ]
          ) ||
          `${getValue(
            row,
            [
              "Code",
              "RegOrderCode"
            ]
          )}-${index}`,

        originalRow: row,

        code:
          getValue(row, [
            "Code",
            "RegOrderCode"
          ]),

        orderDate:
          toValidDate(
            getValue(row, [
              "OrderDate",
              "Date_"
            ])
          ),

        studentName:
          getValue(row, [
            "StudentName",
            "StudentFullName"
          ]),

        studentTel:
          getValue(row, [
            "StudentTel",
            "Mobile"
          ]),

        nationalId:
          getValue(row, [
            "NationalId"
          ]),

        registerUserName:
          getValue(row, [
            "FullName",
            "RegisterUserName"
          ]),

        orderStatus:
          getValue(row, [
            "ORDERSTAUT",
            "OrderStatus"
          ]),

        salesNotes:
          getValue(row, [
            "SalesNotes"
          ]),

        batchName:
          getValue(row, [
            "BatchName",
            "Batch",
            "DofaName"
          ])
      })
    );
  }, [filteredRows]);

  const columns = useMemo(
    () => [
      {
        field: "code",
        headerName: "رقم الطلب",
        type: "string",
        flex: 0.75,
        minWidth: 90
      },
      {
        field: "orderDate",
        headerName: "تاريخ الطلب",
        type: "date",
        flex: 0.85,
        minWidth: 105,
        renderCell: (params) =>
          formatGregorianDate(
            params.row.orderDate
          )
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        type: "string",
        flex: 1.3,
        minWidth: 145
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        type: "string",
        flex: 0.95,
        minWidth: 110
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        type: "string",
        flex: 0.95,
        minWidth: 110
      },
      {
        field: "registerUserName",
        headerName: "مسئول التسجيل",
        type: "string",
        flex: 1.1,
        minWidth: 125
      },
      {
        field: "orderStatus",
        headerName: "حالة التسجيل",
        type: "string",
        flex: 1.05,
        minWidth: 120
      },
      {
        field: "salesNotes",
        headerName: "ملاحظات المبيعات",
        type: "string",
        flex: 1.3,
        minWidth: 145
      },
      {
        field: "batchName",
        headerName: "الدفعة",
        type: "string",
        flex: 0.95,
        minWidth: 110
      },
      {
        field: "vip",
        headerName: "VIP",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        width: 82,
        renderCell: (params) => {
          const confirmed =
            isConfirmedOrder(
              params.row.orderStatus
            );

          return (
            <Tooltip
              title={
                confirmed
                  ? "تحويل إلى عميل VIP"
                  : "الطلب غير مؤكد"
              }
            >
              <span>
                <IconButton
                  disabled={!confirmed}
                  onClick={() =>
                    openVipDialog(
                      params.row.originalRow
                    )
                  }
                  sx={{
                    color: confirmed
                      ? "#d4a017"
                      : undefined
                  }}
                >
                  <StarIcon />
                </IconButton>
              </span>
            </Tooltip>
          );
        }
      }
    ],
    []
  );

  const clearFilters = () => {
    setGlobalFilter("");
  };

  const loadReport = async () => {
    if (!userGuid) {
      await fireError(
        "بيانات المستخدم غير موجودة"
      );
      return;
    }

    if (!fromDate || !toDate) {
      await fireError(
        "برجاء تحديد تاريخ البداية والنهاية"
      );
      return;
    }

    if (fromDate > toDate) {
      await fireError(
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
        `${API_BASE_URL}/api/admission-requests-report?${params.toString()}`,
        {
          method: "GET",
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
          "تعذر تحميل تقرير طلبات الالتحاق"
        );
      }

      const resultRows =
        Array.isArray(
          result?.data?.rows
        )
          ? result.data.rows
          : [];

      setRows(resultRows);

      if (resultRows.length === 0) {
        await Swal.fire({
          icon: "info",
          title: "لا توجد بيانات",
          text:
            "لا توجد طلبات خلال الفترة المحددة",
          confirmButtonText: "حسنًا",
          confirmButtonColor: "#057546"
        });
      }
    } catch (exception) {
      setRows([]);

      await fireError(
        exception?.message ||
        "حدث خطأ أثناء تحميل التقرير"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const headers = [
        "رقم الطلب",
        "تاريخ الطلب",
        "اسم الطالب",
        "رقم الجوال",
        "رقم الهوية",
        "مسئول التسجيل",
        "حالة التسجيل",
        "ملاحظات المبيعات",
        "الدفعة"
      ];

      const csvRows = [
        headers
          .map(escapeCsvValue)
          .join(","),

        ...filteredRows.map((row) => {
          return [
            getValue(row, [
              "Code",
              "RegOrderCode"
            ]),

            formatGregorianDate(
              getValue(row, [
                "OrderDate",
                "Date_"
              ])
            ),

            getValue(row, [
              "StudentName",
              "StudentFullName"
            ]),

            getValue(row, [
              "StudentTel",
              "Mobile"
            ]),

            getValue(row, [
              "NationalId"
            ]),

            getValue(row, [
              "FullName",
              "RegisterUserName"
            ]),

            getValue(row, [
              "ORDERSTAUT",
              "OrderStatus"
            ]),

            getValue(row, [
              "SalesNotes"
            ]),

            getValue(row, [
              "BatchName",
              "Batch",
              "DofaName"
            ])
          ]
            .map(escapeCsvValue)
            .join(",");
        })
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
        "تقرير طلبات الالتحاق.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      await fireSuccess(
        "تم تصدير البيانات بنجاح"
      );
    } catch (exception) {
      await fireError(
        exception?.message ||
        "تعذر تصدير البيانات"
      );
    }
  };

  const openVipDialog = async (row) => {
    const status = getValue(row, [
      "ORDERSTAUT",
      "OrderStatus"
    ]);

    if (!isConfirmedOrder(status)) {
      await Swal.fire({
        icon: "warning",
        title: "غير مسموح",
        text:
          "لا يمكن تحويل العميل إلى VIP إلا إذا كان الطلب مؤكدًا",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#ae1e21"
      });
      return;
    }

    const studentName = getValue(
      row,
      [
        "StudentName",
        "StudentFullName"
      ]
    ) || "-";

    const nationalId = getValue(
      row,
      ["NationalId"]
    ) || "-";

    const studentTel = getValue(
      row,
      [
        "StudentTel",
        "Mobile"
      ]
    ) || "-";

    const orderCode = getValue(
      row,
      [
        "Code",
        "RegOrderCode"
      ]
    ) || "-";

    const registerUserName =
      getValue(
        row,
        [
          "FullName",
          "RegisterUserName"
        ]
      ) || "-";

    const result = await Swal.fire({
      title: "تحويل إلى عميل VIP",
      html: `
        <div style="
          text-align:left;
          direction:ltr;
          line-height:2;
          font-family:Cairo,Arial,sans-serif;
          background:#f6faf8;
          border-radius:12px;
          padding:14px;
          margin-bottom:12px;
        ">
          <div><strong>رقم الطلب:</strong> ${safeHtml(orderCode)}</div>
          <div><strong>اسم العميل:</strong> ${safeHtml(studentName)}</div>
          <div><strong>رقم الهوية:</strong> ${safeHtml(nationalId)}</div>
          <div><strong>رقم الجوال:</strong> ${safeHtml(studentTel)}</div>
          <div><strong>مسئول التسجيل:</strong> ${safeHtml(registerUserName)}</div>
        </div>
      `,
      input: "textarea",
      inputLabel: "ملاحظة VIP",
      inputPlaceholder:
        "اكتب ملاحظة المتابعة أو اتركها فارغة",
      inputAttributes: {
        dir: "ltr"
      },
      showCancelButton: true,
      confirmButtonText:
        "تأكيد التحويل",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#057546",
      cancelButtonColor: "#ae1e21",
      reverseButtons: true,
      focusConfirm: false,
      allowOutsideClick: false
    });

    if (!result.isConfirmed) {
      return;
    }

    const confirmation =
      await Swal.fire({
        icon: "question",
        title: "تأكيد العملية",
        text:
          "هل أنت متأكد من تحويل هذا العميل إلى VIP؟",
        showCancelButton: true,
        confirmButtonText: "نعم، تحويل",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#057546",
        cancelButtonColor: "#ae1e21",
        reverseButtons: true,
        allowOutsideClick: false
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    await saveVip(
      row,
      result.value || ""
    );
  };

  const saveVip = async (
    selectedRow,
    vipNotes
  ) => {
    if (!selectedRow) {
      await fireError(
        "لم يتم اختيار طلب صالح"
      );
      return;
    }

    Swal.fire({
      title:
        "جارٍ تحويل العميل إلى VIP",
      text:
        "برجاء الانتظار حتى اكتمال العملية",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const payload = {
        userGuid,

        regOrderGuid: getValue(
          selectedRow,
          [
            "ORDERGUID",
            "OrderGuid",
            "RegOrderGuid",
            "Guid"
          ]
        ),

        regOrderCode:
          Number(
            getValue(
              selectedRow,
              [
                "Code",
                "RegOrderCode"
              ]
            )
          ) || null,

        studentGuid: getValue(
          selectedRow,
          [
            "StudentGuid",
            "STUDENTGUID"
          ]
        ),

        accountGuid: getValue(
          selectedRow,
          [
            "AccountGuid",
            "ACCOUNTGUID"
          ]
        ),

        studentName: getValue(
          selectedRow,
          [
            "StudentName",
            "StudentFullName"
          ]
        ),

        studentTel: getValue(
          selectedRow,
          [
            "StudentTel",
            "Mobile"
          ]
        ),

        nationalId: getValue(
          selectedRow,
          ["NationalId"]
        ),

        email: getValue(
          selectedRow,
          [
            "Email",
            "StudentEmail"
          ]
        ),

        batchGuid: getValue(
          selectedRow,
          [
            "BatchGuid",
            "BATCHGUID",
            "DofaaGuid",
            "DofaGuid"
          ]
        ),

        batchName: getValue(
          selectedRow,
          [
            "BatchName",
            "Batch",
            "DofaName"
          ]
        ),

        registerUserGuid: getValue(
          selectedRow,
          [
            "UserGuid",
            "CreatedByUserGuid",
            "RegisterUserGuid",
            "SalesManGuid"
          ]
        ),

        registerUserName: getValue(
          selectedRow,
          [
            "FullName",
            "RegisterUserName"
          ]
        ),

        orderStatus: getValue(
          selectedRow,
          [
            "ORDERSTAUT",
            "OrderStatus"
          ]
        ),

        salesNotes: getValue(
          selectedRow,
          ["SalesNotes"]
        ),

        vipNotes
      };

      const response = await fetch(
        `${API_BASE_URL}/api/admission-requests-report/vip`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json"
          },
          body: JSON.stringify(payload)
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
          "تعذر تحويل العميل إلى VIP"
        );
      }

      Swal.close();

      await fireSuccess(
        result?.message ||
        "تم تحويل العميل إلى VIP بنجاح"
      );
    } catch (exception) {
      Swal.close();

      await fireError(
        exception?.message ||
        "حدث خطأ أثناء تحويل العميل إلى VIP"
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
            md: `calc(100% - ${SIDEBAR_WIDTH}px)`
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
                color: "#034d31"
              }}
            >
              تقرير طلبات الالتحاق
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                fontFamily: "Cairo",
                color: "#61756d"
              }}
            >
              عرض ومتابعة طلبات الالتحاق خلال الفترة المحددة
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
              sx={{
                mb: 2
              }}
            >
              <TextField
                type="date"
                size="small"
                label="من تاريخ"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(
                    event.target.value
                  );
                }}
                InputLabelProps={{
                  shrink: true
                }}
              />

              <TextField
                type="date"
                size="small"
                label="إلى تاريخ"
                value={toDate}
                onChange={(event) => {
                  setToDate(
                    event.target.value
                  );
                }}
                InputLabelProps={{
                  shrink: true
                }}
              />

              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={loadReport}
                disabled={loading}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  background: "#057546",

                  "&:hover": {
                    background: "#034d31"
                  }
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

              <Box sx={{ flexGrow: 1 }} />

              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  background: "#edf8f3",
                  color: "#034d31",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  whiteSpace: "nowrap"
                }}
              >
                العدد: {filteredRows.length}
              </Box>
            </Stack>

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
              sx={{
                mb: 2
              }}
            >
              <TextField
                fullWidth
                size="small"
                label="بحث شامل داخل التقرير"
                value={globalFilter}
                onChange={(event) => {
                  setGlobalFilter(
                    event.target.value
                  );
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),

                  endAdornment:
                    globalFilter ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setGlobalFilter(
                              ""
                            );
                          }}
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                }}
              />

              <Button
                variant="outlined"
                startIcon={
                  <FilterAltOffIcon />
                }
                onClick={clearFilters}
                sx={{
                  whiteSpace: "nowrap",
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  color: "#ae1e21",
                  borderColor: "#ae1e21"
                }}
              >
                مسح الفلاتر
              </Button>
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
                        "تقرير طلبات الالتحاق"
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

export default AdmissionRequestsReport;