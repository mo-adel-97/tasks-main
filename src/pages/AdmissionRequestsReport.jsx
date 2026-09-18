import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  GlobalStyles,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
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
import StarIcon from "@mui/icons-material/Star";
import ClearIcon from "@mui/icons-material/Clear";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const DARK_BORDER = "#67C99D";
const DARK_TEXT = "#9BE0C1";

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

const shortStudentName = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 2) {
    return parts.join(" ");
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
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
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === "dark";
  const surfaces = muiTheme.palette.surfaces || {};
  const darkCard = surfaces.card || "#13251d";
  const darkSection = surfaces.section || "#172b22";
  const darkNested = surfaces.nested || "#1b3328";
  const darkHover = surfaces.hover || "#214333";

  const isPhone = useMediaQuery(
    muiTheme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isCompact = isPhone || isTablet;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

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

  const columns = useMemo(() => {
    const vipColumn = {
      field: "vip",
      headerName: isCompact ? "" : "VIP",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: isPhone ? 38 : isTablet ? 44 : 72,
      minWidth: isPhone ? 38 : isTablet ? 44 : 72,
      maxWidth: isPhone ? 38 : isTablet ? 44 : 72,
      align: "center",
      headerAlign: "center",
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
                  width: isPhone ? 24 : isTablet ? 28 : 34,
                  height: isPhone ? 24 : isTablet ? 28 : 34,
                  p: 0,
                  color: isDark
                    ? DARK_TEXT
                    : confirmed
                      ? "#d4a017"
                      : undefined,
                  backgroundColor: isDark
                    ? "transparent"
                    : isCompact && confirmed
                      ? "#fff8df"
                      : undefined,
                  border: isDark
                    ? `1px solid ${DARK_BORDER}`
                    : undefined
                }}
              >
                <StarIcon
                  sx={{
                    fontSize: isPhone ? 14 : isTablet ? 16 : 19
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        );
      }
    };

    const statusColumn = {
      field: "orderStatus",
      headerName: "الحالة",
      flex: isPhone ? 0.7 : 0.85,
      minWidth: isPhone ? 62 : 82,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const confirmed =
          isConfirmedOrder(params.value);

        return (
          <Box
            component="span"
            sx={{
              px: isPhone ? 0.5 : 0.75,
              py: isPhone ? 0.15 : 0.25,
              borderRadius: 999,
              whiteSpace: "nowrap",
              fontFamily: "Cairo",
              fontWeight: 900,
              fontSize: isPhone
                ? "0.75rem"
                : isTablet
                  ? "0.75rem"
                  : "0.75rem",
              color: isDark
                ? DARK_TEXT
                : confirmed
                  ? "#1b5e20"
                  : "#b71c1c",
              backgroundColor: isDark
                ? "transparent"
                : confirmed
                  ? "#e8f5e9"
                  : "#ffebee",
              border: isDark
                ? `1px solid ${DARK_BORDER}`
                : "1px solid transparent"
            }}
          >
            {params.value || "-"}
          </Box>
        );
      }
    };

    if (isPhone) {
      return [
        {
          field: "studentName",
          headerName: "الطالب",
          flex: 1.1,
          minWidth: 88,
          align: "center",
          headerAlign: "center",
          renderCell: (params) =>
            shortStudentName(
              params.row.studentName
            )
        },
        {
          field: "nationalId",
          headerName: "الهوية",
          flex: 0.9,
          minWidth: 74,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "registerUserName",
          headerName: "المندوب",
          flex: 0.9,
          minWidth: 74,
          align: "center",
          headerAlign: "center"
        },
        statusColumn,
        vipColumn
      ];
    }

    if (isTablet) {
      return [
        {
          field: "orderDate",
          headerName: "التاريخ",
          flex: 0.72,
          minWidth: 84,
          align: "center",
          headerAlign: "center",
          renderCell: (params) =>
            formatGregorianDate(
              params.row.orderDate
            )
        },
        {
          field: "studentName",
          headerName: "الطالب",
          flex: 1.05,
          minWidth: 108,
          align: "center",
          headerAlign: "center",
          renderCell: (params) =>
            shortStudentName(
              params.row.studentName
            )
        },
        {
          field: "nationalId",
          headerName: "الهوية",
          flex: 0.82,
          minWidth: 90,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "registerUserName",
          headerName: "مسئول التسجيل",
          flex: 0.9,
          minWidth: 96,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "batchName",
          headerName: "الدفعة",
          flex: 0.82,
          minWidth: 90,
          align: "center",
          headerAlign: "center"
        },
        statusColumn,
        vipColumn
      ];
    }

    return [
      {
        field: "orderDate",
        headerName: "تاريخ الطلب",
        type: "date",
        flex: 0.82,
        minWidth: 100,
        renderCell: (params) =>
          formatGregorianDate(
            params.row.orderDate
          )
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        type: "string",
        flex: 1.25,
        minWidth: 140
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        type: "string",
        flex: 0.9,
        minWidth: 105
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        type: "string",
        flex: 0.9,
        minWidth: 105
      },
      {
        field: "registerUserName",
        headerName: "مسئول التسجيل",
        type: "string",
        flex: 1,
        minWidth: 115
      },
      statusColumn,
      {
        field: "salesNotes",
        headerName: "ملاحظات المبيعات",
        type: "string",
        flex: 1.35,
        minWidth: 150
      },
      {
        field: "batchName",
        headerName: "الدفعة",
        type: "string",
        flex: 0.9,
        minWidth: 105
      },
      vipColumn
    ];
  }, [isPhone, isTablet, isCompact, isDark]);

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
        <div class="vip-summary-card" style="
          text-align:right;
          direction:rtl;
          line-height:2;
          font-family:Cairo,Arial,sans-serif;
          background:#f6faf8;
          border:1px solid #e4eeea;
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
        dir: "rtl"
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
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        background: isDark ? muiTheme.palette.background.default : "#f5f8f7",
        color: "text.primary",
        direction: "rtl",
        ...(isDark && {
          "& .MuiButton-root": {
            backgroundColor: "transparent !important",
            backgroundImage: "none !important",
            color: `${DARK_TEXT} !important`,
            border: `1px solid ${DARK_BORDER} !important`,
            boxShadow: "none !important",
            fontWeight: "800 !important"
          },
          "& .MuiButton-root:hover": {
            backgroundColor: "transparent !important",
            color: "#C9F2DF !important",
            borderColor: `${DARK_BORDER} !important`,
            boxShadow: "0 0 0 1px rgba(103,201,157,.16) !important"
          },
          "& .MuiButton-root.Mui-disabled": {
            backgroundColor: "transparent !important",
            color: "rgba(155,224,193,.42) !important",
            borderColor: "rgba(103,201,157,.34) !important",
            boxShadow: "none !important"
          },
          "& .MuiIconButton-root": {
            backgroundColor: "transparent !important",
            backgroundImage: "none !important",
            color: `${DARK_TEXT} !important`,
            border: `1px solid ${DARK_BORDER} !important`,
            boxShadow: "none !important"
          },
          "& .MuiIconButton-root:hover": {
            backgroundColor: "transparent !important",
            color: "#C9F2DF !important"
          },
          "& .MuiOutlinedInput-root": {
            backgroundColor: "transparent !important",
            backgroundImage: "none !important",
            color: `${muiTheme.palette.text.primary} !important`
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: `${DARK_BORDER} !important`
          },
          "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, & .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: `${DARK_BORDER} !important`
          },
          "& .MuiInputLabel-root": {
            color: `${muiTheme.palette.text.secondary} !important`
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: `${DARK_TEXT} !important`
          },
          "& .MuiInputAdornment-root, & .MuiInputAdornment-root .MuiSvgIcon-root": {
            color: `${DARK_TEXT} !important`
          },
          "& input[type='date']": {
            colorScheme: "dark"
          }
        })
      }}
    >
      <GlobalStyles
        styles={{
          ...(isDark
            ? {
                ".MuiMenu-paper, .MuiPopover-paper, .MuiDataGrid-panel": {
                  backgroundColor: `${darkSection} !important`,
                  backgroundImage: "none !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "0 14px 34px rgba(3,20,13,.28) !important"
                },
                ".MuiMenuItem-root": {
                  backgroundColor: "transparent !important",
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".MuiMenuItem-root:hover": {
                  backgroundColor: `${darkHover} !important`
                },
                ".MuiMenuItem-root.Mui-selected": {
                  backgroundColor: "transparent !important",
                  color: `${DARK_TEXT} !important`,
                  borderInlineStart: `2px solid ${DARK_BORDER} !important`
                },
                ".swal2-popup": {
                  backgroundColor: `${darkCard} !important`,
                  backgroundImage: "none !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "0 18px 50px rgba(2,18,12,.34) !important"
                },
                ".swal2-title, .swal2-html-container, .swal2-input-label": {
                  color: `${muiTheme.palette.text.primary} !important`
                },
                ".swal2-confirm, .swal2-deny, .swal2-cancel": {
                  backgroundColor: "transparent !important",
                  backgroundImage: "none !important",
                  color: `${DARK_TEXT} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".swal2-confirm:hover, .swal2-deny:hover, .swal2-cancel:hover": {
                  backgroundColor: "transparent !important",
                  color: "#C9F2DF !important"
                },
                ".swal2-textarea, .swal2-input, .swal2-select": {
                  backgroundColor: "transparent !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`,
                  boxShadow: "none !important"
                },
                ".swal2-html-container [style*='background']": {
                  background: "transparent !important",
                  color: `${muiTheme.palette.text.primary} !important`,
                  borderColor: `${DARK_BORDER} !important`
                },
                ".vip-summary-card": {
                  background: `${darkSection} !important`,
                  color: `${muiTheme.palette.text.primary} !important`,
                  border: `1px solid ${DARK_BORDER} !important`
                }
              }
            : {})
        }}
      />

      {!isDesktop && (
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
                : isTablet
                  ? "540px !important"
                  : undefined,
              padding: isPhone
                ? "0.75rem !important"
                : isTablet
                  ? "1rem !important"
                  : undefined
            },
            ".swal2-title": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.82rem !important"
                : isTablet
                  ? "1rem !important"
                  : undefined
            },
            ".swal2-html-container, .swal2-input-label": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.56rem !important"
                : isTablet
                  ? "0.68rem !important"
                  : undefined
            },
            ".swal2-confirm, .swal2-cancel": {
              fontFamily: "Cairo !important",
              fontSize: isPhone
                ? "0.5rem !important"
                : isTablet
                  ? "0.6rem !important"
                  : undefined
            }
          }}
        />
      )}

      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            zIndex: 1400,
            background: isDark ? darkSection : "rgba(255,255,255,.97)",
            backdropFilter: "blur(14px)",
            color: isDark ? muiTheme.palette.text.primary : "#17372b",
            borderBottom: isDark
              ? `1px solid ${DARK_BORDER}`
              : "1px solid rgba(5,117,70,.12)",
            direction: "rtl"
          }}
        >
          <Toolbar
            sx={{
              direction: "rtl",
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)"
              },
              px: { xs: 0.75, sm: 1 },
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
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                color: isDark ? DARK_TEXT : "#fff",
                background: isDark
                  ? "transparent"
                  : "linear-gradient(135deg,#057546,#034d31)",
                border: isDark ? `1px solid ${DARK_BORDER}` : "none",
                boxShadow: isDark
                  ? "none"
                  : "0 5px 14px rgba(5,117,70,.20)"
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
                  sm: "0.79rem"
                },
                color: isDark ? muiTheme.palette.text.primary : "#17372b",
                textAlign: "start",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              مكتب الاستقبال
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      <PageContainer
        component="main"
        sx={{
          ml: 0,
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          minHeight: "100dvh",
          
          
          direction: "rtl",
          boxSizing: "border-box",
          overflowX: "hidden",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            mt: 0,
            p: 2.5
          },
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: isPhone ? 1.4 : isTablet ? 1.9 : 4,
            overflow: "hidden",

            border: isDark
              ? `1px solid ${DARK_BORDER}`
              : "1px solid rgba(5,117,70,0.14)",

            background: isDark ? darkCard : "#fff",
            backgroundImage: "none"
          }}
        >
          <Box
            sx={{
              p: isPhone
                ? 0.7
                : isTablet
                  ? 1
                  : 2.5,

              background: isDark
                ? darkSection
                : "linear-gradient(135deg, #ffffff 0%, #edf8f3 100%)",

              borderBottom: isDark
                ? `1px solid ${DARK_BORDER}`
                : "1px solid rgba(5,117,70,0.12)"
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: "Cairo",
                fontWeight: 900,
                color: isDark ? muiTheme.palette.text.primary : "#034d31",
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.88rem"
                    : undefined
              }}
            >
              تقرير طلبات الالتحاق
            </Typography>

            <Typography
              sx={{
                mt: isPhone ? 0.15 : 0.5,
                fontFamily: "Cairo",
                color: isDark ? muiTheme.palette.text.secondary : "#61756d",
                fontSize: isPhone
                  ? "0.75rem"
                  : isTablet
                    ? "0.75rem"
                    : undefined,
                display: isPhone
                  ? "none"
                  : "block"
              }}
            >
              عرض ومتابعة طلبات الالتحاق خلال الفترة المحددة
            </Typography>
          </Box>

          <Box
            sx={{
              p: isPhone
                ? 0.6
                : isTablet
                  ? 0.9
                  : 2.5
            }}
          >
            <Box
              sx={uiLayout.withUiSx({
                display: "grid",
                gridTemplateColumns: isPhone
                  ? "repeat(2,minmax(0,1fr))"
                  : isTablet
                    ? "repeat(4,minmax(0,1fr))"
                    : "minmax(150px,180px) minmax(150px,180px) minmax(260px,1fr)",
                gap: isPhone
                  ? 0.5
                  : isTablet
                    ? 0.7
                    : 1,
                mb: isPhone
                  ? 0.7
                  : isTablet
                    ? 0.9
                    : 1.5,
                alignItems: "center",

                "& .MuiInputLabel-root": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined
                },

                "& .MuiInputBase-input": {
                  fontFamily: "Cairo",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  py: isPhone
                    ? 0.45
                    : isTablet
                      ? 0.55
                      : undefined
                },

                "& .MuiOutlinedInput-root": {
                  minHeight: isPhone
                    ? 31
                    : isTablet
                      ? 34
                      : undefined,
                  borderRadius: isCompact
                    ? 1.1
                    : undefined
                },

                "& .MuiButton-root": {
                  minHeight: isPhone
                    ? 30
                    : isTablet
                      ? 33
                      : undefined,
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined,
                  px: isPhone
                    ? 0.55
                    : isTablet
                      ? 0.8
                      : undefined
                },

                "& .MuiSvgIcon-root": {
                  fontSize: isPhone
                    ? 14
                    : isTablet
                      ? 16
                      : undefined
                }
              }, uiLayout.filterBarSx)}
            >
              <TextField sx={uiLayout.formFieldSx}
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
                fullWidth
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField sx={uiLayout.formFieldSx}
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
                fullWidth
               inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

              <TextField InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                label="بحث شامل داخل التقرير"
                value={globalFilter}
                onChange={(event) =>
                  setGlobalFilter(
                    event.target.value
                  )
                }
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
                          onClick={() =>
                            setGlobalFilter("")
                          }
                        >
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                }}
                sx={uiLayout.withUiSx({
                  gridColumn: isPhone ? "1 / -1" : undefined
                }, uiLayout.formFieldSx)}
              />

              <Box
                sx={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 0.55,
                  pt: isCompact ? 0 : 0.2
                }}
              >
                <Button
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={loadReport}
                  disabled={loading}
                  sx={uiLayout.buttonSx}
                >
                  عرض
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadReport}
                  disabled={loading}
                  sx={uiLayout.buttonSx}
                >
                  تحديث
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportToExcel}
                  disabled={loading || filteredRows.length === 0}
                  sx={uiLayout.withUiSx({
                    color: isDark ? DARK_TEXT : "#ae1e21",
                    borderColor: isDark ? DARK_BORDER : "#ae1e21"
                  }, uiLayout.buttonSx)}
                >
                  تصدير Excel
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<FilterAltOffIcon />}
                  onClick={clearFilters}
                  sx={uiLayout.withUiSx({
                    color: isDark ? DARK_TEXT : "#ae1e21",
                    borderColor: isDark ? DARK_BORDER : "#ae1e21"
                  }, uiLayout.buttonSx)}
                >
                  مسح الفلاتر
                </Button>

                <Box sx={{ flex: 1 }} />

                <Box
                  sx={{
                    px: 1,
                    py: 0.55,
                    borderRadius: 1.4,
                    background: isDark ? "transparent" : "#edf8f3",
                    border: isDark
                      ? `1px solid ${DARK_BORDER}`
                      : "1px solid rgba(5,117,70,.10)",
                    color: isDark ? DARK_TEXT : "#034d31",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: "0.75rem",
                    whiteSpace: "nowrap"
                  }}
                >
                  العدد: {filteredRows.length}
                </Box>
              </Box>
            </Box>

            <Box
              sx={uiLayout.withUiSx({
                width: "100%",
                height: isPhone
                  ? "calc(100dvh - 380px)"
                  : isTablet
                    ? "calc(100dvh - 325px)"
                    : 700,
                minHeight: isPhone
                  ? 360
                  : isTablet
                    ? 430
                    : 520,
                border: isDark
                  ? `1px solid ${DARK_BORDER}`
                  : "1px solid rgba(5,117,70,0.14)",
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: isDark ? darkSection : "#fff"
              }, uiLayout.tableContainerSx)}
            >
              <DataGrid
                rows={dataGridRows}
                columns={columns}
                loading={loading}
                disableRowSelectionOnClick
                showToolbar={!isPhone}
                disableColumnMenu={isPhone}
                disableColumnFilter={isPhone}
                rowHeight={
                  isPhone
                    ? 34
                    : isTablet
                      ? 40
                      : undefined
                }
                columnHeaderHeight={
                  isPhone
                    ? 32
                    : isTablet
                      ? 38
                      : undefined
                }
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
                sx={uiLayout.withUiSx({
                  border: 0,
                  direction: "rtl",
                  fontFamily: "Cairo",

                  "& .MuiDataGrid-main": {
                    overflowX: isCompact
                      ? "hidden"
                      : undefined
                  },

                  "& .MuiDataGrid-virtualScroller": {
                    overflowX: "auto"
                  },

                  "& .MuiDataGrid-scrollbar--horizontal": {
                    display: "block"
                  },

                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: isDark
                      ? darkNested
                      : "#057546",
                    color: isDark
                      ? muiTheme.palette.text.primary
                      : "#fff",
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    borderBottom: 0
                  },

                  "& .MuiDataGrid-columnHeader": {
                    backgroundColor: isDark
                      ? darkNested
                      : "#057546"
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    textAlign: "center",
                    width: "100%",
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined,
                    lineHeight: 1.2
                  },

                  "& .MuiDataGrid-columnSeparator": {
                    color: isDark
                      ? "rgba(103,201,157,.55)"
                      : "rgba(255,255,255,0.55)",
                    visibility: "visible"
                  },

                  "& .MuiDataGrid-cell": {
                    fontFamily: "Cairo",
                    textAlign: "center",
                    justifyContent: "center",
                    whiteSpace: "normal",
                    lineHeight: 1.3,
                    borderColor: isDark
                      ? "rgba(103,201,157,.22)"
                      : "#e6ece9",
                    color: isDark
                      ? muiTheme.palette.text.primary
                      : "inherit",
                    px: isPhone
                      ? 0.3
                      : isTablet
                        ? 0.5
                        : undefined,
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined
                  },

                  "& .MuiDataGrid-row:nth-of-type(even)": {
                    backgroundColor: isDark
                      ? darkCard
                      : "#fbfdfc"
                  },

                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: isDark
                      ? darkHover
                      : "#f1faf6"
                  },

                  "& .MuiDataGrid-toolbarContainer": {
                    display: isPhone
                      ? "none"
                      : "flex",
                    p: isTablet ? 0.45 : 1,
                    gap: isTablet ? 0.45 : 1,
                    borderBottom: isDark
                      ? `1px solid ${DARK_BORDER}`
                      : "1px solid #e6ece9",
                    backgroundColor: isDark
                      ? darkSection
                      : "#f8fbf9",
                    direction: "rtl"
                  },

                  "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    color: isDark ? DARK_TEXT : "#057546"
                  },

                  "& .MuiDataGrid-footerContainer": {
                    direction: "rtl",
                    fontFamily: "Cairo",
                    backgroundColor: isDark ? darkSection : "#fff",
                    color: isDark
                      ? muiTheme.palette.text.primary
                      : "inherit",
                    borderTop: isDark
                      ? `1px solid ${DARK_BORDER}`
                      : undefined,
                    minHeight: isPhone
                      ? 34
                      : isTablet
                        ? 38
                        : undefined,
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined
                  }
                }, uiLayout.dataGridSx)}
              />
            </Box>
          </Box>
        </Paper>
      </PageContainer>
    </Box></NavigationShell>
  );
};

export default AdmissionRequestsReport;