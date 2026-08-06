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
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material";
import {
  DataGrid,
  GridToolbar
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";

const SIDEBAR_WIDTH = 280;
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const dateValue = () => {
  const value = new Date();
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0")
  ].join("-");
};

const readJson = async (response) => {
  const text = await response.text();
  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
      result?.details ||
      text?.replace(/<[^>]*>/g, " ")
        ?.replace(/\s+/g, " ")
        ?.trim()
        ?.slice(0, 700) ||
      `HTTP ${response.status}`
    );
  }

  return result;
};

const unwrapGridValue = (value) => {
  if (
    value &&
    typeof value === "object" &&
    Object.prototype.hasOwnProperty.call(
      value,
      "value"
    )
  ) {
    return value.value;
  }

  return value;
};

const toNumber = (value) => {
  const raw = unwrapGridValue(value);

  if (
    raw === null ||
    raw === undefined ||
    raw === ""
  ) {
    return 0;
  }

  if (typeof raw === "number") {
    return Number.isFinite(raw)
      ? raw
      : 0;
  }

  const normalized = String(raw)
    .replace(/,/g, "")
    .trim();

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

const money = (value) =>
  toNumber(value).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );

const formatDate = (value) => {
  const raw = unwrapGridValue(value);

  if (
    raw === null ||
    raw === undefined ||
    raw === ""
  ) {
    return "";
  }

  const date = new Date(raw);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(raw);
  }

  return date.toLocaleDateString(
    "en-GB"
  );
};

const showError = (message) =>
  Swal.fire({
    icon: "error",
    title: "تنبيه",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: "#ae1e21"
  });

const getValue = (row, ...keys) => {
  const source = row || {};

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        source,
        key
      ) &&
      source[key] !== null &&
      source[key] !== undefined
    ) {
      return source[key];
    }
  }

  const lowerKeys =
    Object.keys(source).reduce(
      (result, key) => {
        result[
          String(key).toLowerCase()
        ] = source[key];

        return result;
      },
      {}
    );

  for (const key of keys) {
    const value =
      lowerKeys[
        String(key).toLowerCase()
      ];

    if (
      value !== null &&
      value !== undefined
    ) {
      return value;
    }
  }

  return "";
};

const normalizeStatementRow = (
  row,
  index
) => ({
  id:
    String(
      getValue(
        row,
        "Guid",
        "guid",
        "ID",
        "Id",
        "id"
      ) ||
      `statement-${index}`
    ),

  code:
    getValue(
      row,
      "Code",
      "code"
    ),

  dayDate:
    getValue(
      row,
      "DayDate",
      "dayDate",
      "Date_",
      "date"
    ),

  documentName:
    getValue(
      row,
      "Name",
      "name",
      "DocumentName",
      "documentName"
    ),

  actionCode:
    getValue(
      row,
      "ActionCode",
      "actionCode"
    ),

  maden:
    toNumber(
      getValue(
        row,
        "Maden",
        "maden"
      )
    ),

  daen:
    toNumber(
      getValue(
        row,
        "Daen",
        "daen"
      )
    ),

  balance:
    toNumber(
      getValue(
        row,
        "Balance",
        "balance"
      )
    ),

  notes:
    String(
      getValue(
        row,
        "Notes",
        "notes"
      ) || ""
    ),

  centerName:
    String(
      getValue(
        row,
        "CenterName",
        "centerName"
      ) || ""
    ),

  branchName:
    String(
      getValue(
        row,
        "BrEName",
        "brEName",
        "BranchName",
        "branchName"
      ) || ""
    )
});

const normalizePayOrderRow = (
  row,
  index
) => ({
  id:
    String(
      getValue(
        row,
        "Guid",
        "guid",
        "ID",
        "Id",
        "id"
      ) ||
      `pay-${index}`
    ),

  code:
    getValue(
      row,
      "Code",
      "code"
    ),

  orderDate:
    getValue(
      row,
      "OrderDate",
      "orderDate",
      "Date_",
      "date"
    ),

  studentName:
    String(
      getValue(
        row,
        "StudentName",
        "studentName"
      ) || ""
    ),

  nationalId:
    String(
      getValue(
        row,
        "NationalId",
        "nationalId"
      ) || ""
    ),

  studentTel:
    String(
      getValue(
        row,
        "StudentTel",
        "studentTel",
        "PhoneNumber",
        "phoneNumber"
      ) || ""
    ),

  orderSubTotal:
    toNumber(
      getValue(
        row,
        "OrderSubTotal",
        "orderSubTotal",
        "SubTotal",
        "subTotal"
      )
    ),

  orderTax:
    toNumber(
      getValue(
        row,
        "OrderTax",
        "orderTax",
        "Tax",
        "tax"
      )
    ),

  orderTotal:
    toNumber(
      getValue(
        row,
        "OrderTotal",
        "orderTotal",
        "Total",
        "total"
      )
    ),

  cashName:
    String(
      getValue(
        row,
        "CashName",
        "cashName",
        "AccountName",
        "accountName"
      ) || ""
    )
});

const BranchDailyReport = () => {
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const userGuid = String(
    currentUser?.guid ||
    currentUser?.Guid ||
    ""
  ).trim();

  const branchGuid = String(
    currentUser?.branchForWork ||
    currentUser?.BranchForWork ||
    currentUser?.branchGuid ||
    ""
  ).trim();

  const [fromDate, setFromDate] =
    useState(dateValue());

  const [toDate, setToDate] =
    useState(dateValue());

  const [tab, setTab] =
    useState(0);

  const [loadingInfo, setLoadingInfo] =
    useState(false);

  const [loadingData, setLoadingData] =
    useState(false);

  const [branchInfo, setBranchInfo] =
    useState({
      branchName: "",
      cashBoxName: "",
      cashBoxGuid: ""
    });

  const [statementRows, setStatementRows] =
    useState([]);

  const [payOrderRows, setPayOrderRows] =
    useState([]);

  const loadBranchInfo =
    useCallback(async () => {
      if (!userGuid || !branchGuid) {
        return;
      }

      try {
        setLoadingInfo(true);

        const params =
          new URLSearchParams({
            userGuid,
            branchGuid
          });

        const response = await fetch(
          `${API_BASE_URL}/api/branch-daily/info?${params.toString()}`,
          { cache: "no-store" }
        );

        const result =
          await readJson(response);

        setBranchInfo(
          result?.data || {}
        );
      } catch (error) {
        await showError(
          error?.message ||
          "تعذر تحميل بيانات الفرع والخزينة"
        );
      } finally {
        setLoadingInfo(false);
      }
    }, [userGuid, branchGuid]);

  useEffect(() => {
    loadBranchInfo();
  }, [loadBranchInfo]);

  const loadData =
    useCallback(async () => {
      if (!userGuid || !branchGuid) {
        await showError(
          "لا يوجد فرع عمل محدد للمستخدم"
        );
        return;
      }

      if (!fromDate || !toDate) {
        await showError(
          "برجاء تحديد الفترة"
        );
        return;
      }

      if (
        new Date(fromDate) >
        new Date(toDate)
      ) {
        await showError(
          "تاريخ البداية يجب ألا يتجاوز تاريخ النهاية"
        );
        return;
      }

      try {
        setLoadingData(true);

        const params =
          new URLSearchParams({
            userGuid,
            branchGuid,
            fromDate,
            toDate
          });

        const response = await fetch(
          `${API_BASE_URL}/api/branch-daily/report?${params.toString()}`,
          { cache: "no-store" }
        );

        const result =
          await readJson(response);

        setStatementRows(
          Array.isArray(
            result?.data?.cashStatement
          )
            ? result.data.cashStatement
            : []
        );

        setPayOrderRows(
          Array.isArray(
            result?.data?.payOrders
          )
            ? result.data.payOrders
            : []
        );

        if (result?.data?.branchInfo) {
          setBranchInfo(
            result.data.branchInfo
          );
        }
      } catch (error) {
        setStatementRows([]);
        setPayOrderRows([]);

        await showError(
          error?.message ||
          "تعذر تحميل يومية الفرع"
        );
      } finally {
        setLoadingData(false);
      }
    }, [
      userGuid,
      branchGuid,
      fromDate,
      toDate
    ]);

  const statementData = useMemo(
    () =>
      statementRows.map(
        normalizeStatementRow
      ),
    [statementRows]
  );

  const payOrderData = useMemo(
    () =>
      payOrderRows.map(
        normalizePayOrderRow
      ),
    [payOrderRows]
  );

  const totals = useMemo(() => {
    const totalMaden =
      statementData.reduce(
        (sum, row) =>
          sum + toNumber(row.maden),
        0
      );

    const totalDaen =
      statementData.reduce(
        (sum, row) =>
          sum + toNumber(row.daen),
        0
      );

    return {
      maden: totalMaden,
      daen: totalDaen,
      balance:
        totalMaden - totalDaen
    };
  }, [statementData]);

  const statementColumns = useMemo(
    () => [
      {
        field: "code",
        headerName: "رقم القيد",
        minWidth: 100,
        flex: 0.7
      },
      {
        field: "dayDate",
        headerName: "تاريخ القيد",
        minWidth: 120,
        flex: 0.85,
        valueFormatter: (value) =>
          formatDate(value)
      },
      {
        field: "documentName",
        headerName: "نوع المستند",
        minWidth: 135,
        flex: 1
      },
      {
        field: "actionCode",
        headerName: "رقم المستند",
        minWidth: 110,
        flex: 0.8
      },
      {
        field: "maden",
        headerName: "مدين",
        type: "number",
        minWidth: 105,
        flex: 0.75,
        valueFormatter: (value) =>
          money(value)
      },
      {
        field: "daen",
        headerName: "دائن",
        type: "number",
        minWidth: 105,
        flex: 0.75,
        valueFormatter: (value) =>
          money(value)
      },
      {
        field: "balance",
        headerName: "الرصيد",
        type: "number",
        minWidth: 115,
        flex: 0.85,
        valueFormatter: (value) =>
          money(value)
      },
      {
        field: "notes",
        headerName: "بيان",
        minWidth: 220,
        flex: 1.7
      },
      {
        field: "centerName",
        headerName: "مركز التكلفة",
        minWidth: 190,
        flex: 1.35
      },
      {
        field: "branchName",
        headerName: "الفرع",
        minWidth: 200,
        flex: 1.4
      }
    ],
    []
  );

  const payOrderColumns = useMemo(
    () => [
      {
        field: "code",
        headerName: "كود",
        minWidth: 90,
        flex: 0.6
      },
      {
        field: "orderDate",
        headerName: "التاريخ",
        minWidth: 120,
        flex: 0.8,
        valueFormatter: (value) =>
          formatDate(value)
      },
      {
        field: "studentName",
        headerName: "اسم الطالب",
        minWidth: 220,
        flex: 1.5
      },
      {
        field: "nationalId",
        headerName: "رقم الهوية",
        minWidth: 130,
        flex: 0.9
      },
      {
        field: "studentTel",
        headerName: "رقم الجوال",
        minWidth: 130,
        flex: 0.9
      },
      {
        field: "orderSubTotal",
        headerName: "الإجمالي",
        type: "number",
        minWidth: 110,
        flex: 0.75,
        valueFormatter: (value) =>
          money(value)
      },
      {
        field: "orderTax",
        headerName: "الضريبة",
        type: "number",
        minWidth: 105,
        flex: 0.7,
        valueFormatter: (value) =>
          money(value)
      },
      {
        field: "orderTotal",
        headerName: "الصافي",
        type: "number",
        minWidth: 110,
        flex: 0.75,
        valueFormatter: (value) =>
          money(value)
      },
      {
        field: "cashName",
        headerName: "الخزينة/البنك",
        minWidth: 190,
        flex: 1.25
      }
    ],
    []
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        direction: "ltr",
        background:
          "linear-gradient(135deg,#f5faf7 0%,#fff 55%,#eef8f3 100%)"
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          ml: {
            xs: 0,
            md: `${SIDEBAR_WIDTH}px`
          },
          p: {
            xs: 1.2,
            md: 2
          }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,.14)"
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row"
            }}
            spacing={1.2}
            alignItems={{
              xs: "stretch",
              md: "center"
            }}
          >
            <MenuBookIcon
              sx={{
                color: "#057546",
                fontSize: 40
              }}
            />

            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: "1.18rem",
                  color: "#173b2b"
                }}
              >
                يومية الفرع
              </Typography>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  color: "#708179",
                  fontSize: ".76rem"
                }}
              >
                طلبات السداد وحركة خزينة الفرع
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadBranchInfo}
              disabled={loadingInfo}
            >
              تحديث
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 1.5,
            borderRadius: 4,
            border:
              "1px solid rgba(5,117,70,.14)"
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr"
              },
              gap: 1.2
            }}
          >
            <TextField
              type="date"
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

            <TextField
              label="الفرع"
              value={
                branchInfo?.branchName ||
                ""
              }
              InputProps={{
                readOnly: true
              }}
            />

            <TextField
              label="الخزينة / البنك"
              value={
                branchInfo?.cashBoxName ||
                ""
              }
              InputProps={{
                readOnly: true
              }}
            />
          </Box>

          <Stack
            direction="row"
            justifyContent="flex-end"
            sx={{ mt: 1.5 }}
          >
            <Button
              variant="contained"
              startIcon={
                loadingData
                  ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  )
                  : <SearchIcon />
              }
              onClick={loadData}
              disabled={
                loadingData ||
                loadingInfo
              }
              sx={{
                minWidth: 130,
                background:
                  "linear-gradient(135deg,#057546,#034d31)"
              }}
            >
              عرض
            </Button>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,.14)"
          }}
        >
          <Tabs
            value={tab}
            onChange={(
              _event,
              value
            ) => setTab(value)}
            variant="fullWidth"
          >
            <Tab
              icon={<ReceiptLongIcon />}
              iconPosition="start"
              label="طلبات السداد"
            />

            <Tab
              icon={
                <AccountBalanceWalletIcon />
              }
              iconPosition="start"
              label="حركة الخزينة"
            />
          </Tabs>

          {tab === 1 && (
            <Stack
              direction={{
                xs: "column",
                sm: "row"
              }}
              spacing={1}
              sx={{
                px: 2,
                pt: 1.5
              }}
            >
              <Chip
                label={`إجمالي مدين: ${money(totals.maden)}`}
              />
              <Chip
                label={`إجمالي دائن: ${money(totals.daen)}`}
              />
              <Chip
                label={`الرصيد: ${money(totals.balance)}`}
                color="success"
              />
            </Stack>
          )}

          <Box
            sx={{
              height: {
                xs: 580,
                md: 670
              },
              width: "100%",
              p: 1.2
            }}
          >
            <DataGrid
              rows={
                tab === 0
                  ? payOrderData
                  : statementData
              }
              columns={
                tab === 0
                  ? payOrderColumns
                  : statementColumns
              }
              loading={loadingData}
              disableRowSelectionOnClick
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
                    utf8WithBom: true
                  },
                  printOptions: {
                    disableToolbarButton:
                      true
                  }
                }
              }}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 50,
                    page: 0
                  }
                }
              }}
              pageSizeOptions={[
                25,
                50,
                100
              ]}
              sx={{
                border: 0,
                direction: "ltr",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor:
                    "#edf7f2",
                  fontWeight: 900
                },
                "& .MuiDataGrid-cell": {
                  fontFamily: "Cairo",
                  fontWeight: 600,
                  direction: "ltr"
                },
                "& .MuiDataGrid-cellContent": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default BranchDailyReport;
