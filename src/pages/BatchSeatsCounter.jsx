import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  DataGrid,
  GridToolbar
} from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LayersIcon from "@mui/icons-material/Layers";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const PROGRAM_TYPES = [
  {
    value: 0,
    label: "دبلوم"
  },
  {
    value: 1,
    label: "دورة تأهيلية"
  },
  {
    value: 2,
    label: "دورة تطويرية"
  }
];

const toNumber = (value) => {
  const result = Number(value);
  return Number.isFinite(result)
    ? result
    : 0;
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

const readJson = async (response) => {
  const text = await response.text();

  let result = null;

  if (text.trim()) {
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(
        `الخادم رجّع استجابة غير صالحة - HTTP ${response.status}`
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
      result?.title ||
      text?.replace(/<[^>]*>/g, " ")?.replace(/\s+/g, " ")?.trim()?.slice(0, 500) ||
      `تعذر تنفيذ الطلب - HTTP ${response.status}`
    );
  }

  return result || { data: [] };
};

const BatchSeatsCounter = () => {
  const theme = useTheme();

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    "(min-width:600px) and (max-width:1599px)"
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const isCompact = isPhone || isTablet;

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [programType, setProgramType] =
    useState(0);

  const [branches, setBranches] =
    useState([]);

  const [selectedBranch, setSelectedBranch] =
    useState(null);

  const [summaryRows, setSummaryRows] =
    useState([]);

  const [detailsRows, setDetailsRows] =
    useState([]);

  const [selectedBatch, setSelectedBatch] =
    useState(null);

  const selectedBatchRef =
    useRef(null);

  useEffect(() => {
    selectedBatchRef.current =
      selectedBatch;
  }, [selectedBatch]);

  const [loadingBranches, setLoadingBranches] =
    useState(false);

  const [loadingSummary, setLoadingSummary] =
    useState(false);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const selectedBatchId = useMemo(() => {
    if (!selectedBatch) {
      return null;
    }

    return (
      selectedBatch.batchGuid ||
      `${selectedBatch.code}-${selectedBatch.batchName}`
    );
  }, [selectedBatch]);

  const summaryColumns = useMemo(() => {
    const compactCell = {
      align: "center",
      headerAlign: "center"
    };

    if (isCompact) {
      const compactColumns = [
        {
          field: "batchName",
          headerName: "الدفعة",
          flex: 1.35,
          minWidth: isPhone ? 92 : 145,
          ...compactCell,
          renderCell: (params) => (
            <Box
              title={params.value || ""}
              sx={{
                width: "100%",
                px: 0.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "center",
                fontFamily: "Cairo",
                fontWeight: 900,
                fontSize: isPhone ? "0.75rem" : "0.75rem"
              }}
            >
              {params.value || "-"}
            </Box>
          )
        },
        {
          field: "registeredSeats",
          headerName: "المسجلين",
          flex: 0.72,
          minWidth: isPhone ? 56 : 78,
          type: "number",
          ...compactCell
        },
        {
          field: "availableSeats",
          headerName: "المتاح",
          flex: 0.7,
          minWidth: isPhone ? 54 : 76,
          type: "number",
          ...compactCell
        }
      ];

      if (!isPhone) {
        compactColumns.splice(1, 0, {
          field: "totalSeats",
          headerName: "الإجمالي",
          flex: 0.72,
          minWidth: 78,
          type: "number",
          ...compactCell
        });
      }

      return compactColumns;
    }

    const baseColumns = [
      {
        field: "code",
        headerName: "كود",
        type: "string",
        flex: 0.55,
        minWidth: 70
      },
      {
        field: "batchName",
        headerName: "اسم الدفعة",
        type: "string",
        flex: 1.9,
        minWidth: 240,
        renderCell: (params) => (
          <Box
            title={params.value || ""}
            sx={{
              width: "100%",
              py: 0.85,
              px: 1,
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              lineHeight: 1.55,
              textAlign: "right",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              fontFamily: "Cairo",
              fontWeight: 800,
              color: "#243b32"
            }}
          >
            {params.value || "-"}
          </Box>
        )
      },
      {
        field: "totalSeats",
        headerName: "المقاعد الإجمالية",
        type: "number",
        flex: 1,
        minWidth: 125
      },
      {
        field: "registeredSeats",
        headerName: "المسجلين",
        type: "number",
        flex: 0.9,
        minWidth: 105
      },
      {
        field: "availableSeats",
        headerName: "المقاعد المتاحة",
        type: "number",
        flex: 1,
        minWidth: 120
      }
    ];

    if (
      programType === 1 ||
      programType === 2
    ) {
      baseColumns.push(
        {
          field: "totalApprovals",
          headerName: "الموافقات الإجمالية",
          type: "number",
          flex: 1.1,
          minWidth: 135
        },
        {
          field: "usedApprovals",
          headerName: "الموافقات المستخدمة",
          type: "number",
          flex: 1.15,
          minWidth: 145
        },
        {
          field: "availableApprovals",
          headerName: "الموافقات المتبقية",
          type: "number",
          flex: 1.1,
          minWidth: 135
        }
      );
    }

    return baseColumns;
  }, [programType, isCompact, isPhone]);

  const detailsColumns = useMemo(
    () => {
      if (isCompact) {
        const columns = [
          {
            field: "programName",
            headerName:
              programType === 0
                ? "الدبلوم"
                : "الدورة",
            flex: 1.45,
            minWidth: isPhone ? 110 : 165,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => (
              <Box
                title={params.value || ""}
                sx={{
                  width: "100%",
                  px: 0.15,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "center",
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone ? "0.75rem" : "0.75rem"
                }}
              >
                {params.value || "-"}
              </Box>
            )
          },
          {
            field: "registeredSeats",
            headerName: "المسجلين",
            flex: 0.72,
            minWidth: isPhone ? 58 : 80,
            type: "number",
            align: "center",
            headerAlign: "center"
          },
          {
            field: "availableSeats",
            headerName: "المتاح",
            flex: 0.68,
            minWidth: isPhone ? 54 : 76,
            type: "number",
            align: "center",
            headerAlign: "center"
          }
        ];

        if (!isPhone) {
          columns.splice(1, 0, {
            field: "totalSeats",
            headerName: "الإجمالي",
            flex: 0.72,
            minWidth: 80,
            type: "number",
            align: "center",
            headerAlign: "center"
          });
        }

        return columns;
      }

      return [
        {
          field: "programName",
          headerName:
            programType === 0
              ? "اسم الدبلوم"
              : "اسم الدورة",
          type: "string",
          flex: 3.8,
          minWidth: 440,
          renderCell: (params) => (
            <Box
              title={params.value || ""}
              sx={{
                width: "100%",
                py: 0.95,
                px: 1.25,
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                lineHeight: 1.8,
                textAlign: "right",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                fontFamily: "Cairo",
                fontWeight: 800,
                color: "#243b32"
              }}
            >
              {params.value || "-"}
            </Box>
          )
        },
        {
          field: "totalSeats",
          headerName: "المقاعد الإجمالية",
          type: "number",
          flex: 1,
          minWidth: 130
        },
        {
          field: "registeredSeats",
          headerName: "عدد المسجلين",
          type: "number",
          flex: 1,
          minWidth: 125
        },
        {
          field: "availableSeats",
          headerName: "المقاعد المتبقية",
          type: "number",
          flex: 1,
          minWidth: 135
        }
      ];
    },
    [programType, isCompact, isPhone]
  );

  const loadBranches = useCallback(
    async () => {
      setLoadingBranches(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/batch-seats-counter/branches`,
          {
            headers: {
              Accept: "application/json"
            }
          }
        );

        const result =
          await readJson(response);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل الفروع"
          );
        }

        const values =
          Array.isArray(result?.data)
            ? result.data
            : [];

        setBranches(values);

        /*
         * نحافظ على الفرع المختار كما هو.
         * لا نغيره تلقائيًا عند التحديث.
         * نختار أول فرع فقط عند أول فتح للشاشة.
         */
        setSelectedBranch((current) => {
          if (current?.guid) {
            return (
              values.find(
                (branch) =>
                  branch.guid === current.guid
              ) || current
            );
          }

          return values.length > 0
            ? values[0]
            : null;
        });
      } catch (error) {
        await showError(
          error?.message ||
          "حدث خطأ أثناء تحميل الفروع"
        );
      } finally {
        setLoadingBranches(false);
      }
    },
    []
  );

  const loadDetails = useCallback(
    async (batchRow) => {
      if (
        !selectedBranch?.guid ||
        !batchRow?.batchGuid
      ) {
        setDetailsRows([]);
        return;
      }

      setLoadingDetails(true);

      try {
        const params =
          new URLSearchParams({
            programType:
              String(programType),

            branchGuid:
              selectedBranch.guid,

            batchGuid:
              batchRow.batchGuid
          });

        const response = await fetch(
          `${API_BASE_URL}/api/batch-seats-counter/details?${params.toString()}`,
          {
            headers: {
              Accept:
                "application/json"
            }
          }
        );

        const result =
          await readJson(response);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل تفاصيل المقاعد"
          );
        }

        setDetailsRows(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (error) {
        setDetailsRows([]);

        await showError(
          error?.message ||
          "حدث خطأ أثناء تحميل التفاصيل"
        );
      } finally {
        setLoadingDetails(false);
      }
    },
    [
      programType,
      selectedBranch
    ]
  );

  const loadSummary = useCallback(
    async () => {
      if (!selectedBranch?.guid) {
        setSummaryRows([]);
        setDetailsRows([]);
        return;
      }

      setLoadingSummary(true);

      try {
        const params =
          new URLSearchParams({
            programType:
              String(programType),

            branchGuid:
              selectedBranch.guid
          });

        const response = await fetch(
          `${API_BASE_URL}/api/batch-seats-counter/summary?${params.toString()}`,
          {
            headers: {
              Accept:
                "application/json"
            }
          }
        );

        const result =
          await readJson(response);

        if (!response.ok) {
          throw new Error(
            result?.message ||
            "تعذر تحميل ملخص الدفعات"
          );
        }

        const values =
          Array.isArray(result?.data)
            ? result.data
            : [];

        setSummaryRows(values);

        /*
         * نحافظ على الدفعة المختارة عند تحديث البيانات
         * أو تغيير الفرع/نوع البرنامج لو نفس الدفعة موجودة.
         * لا نختار أول صف تلقائيًا.
         */
        const previousBatch =
          selectedBatchRef.current;

        const currentBatch =
          previousBatch
            ? values.find((row) => {
                if (
                  previousBatch.batchGuid &&
                  row.batchGuid
                ) {
                  return (
                    row.batchGuid ===
                    previousBatch.batchGuid
                  );
                }

                return (
                  String(row.code) ===
                    String(
                      previousBatch.code
                    ) &&
                  row.batchName ===
                    previousBatch.batchName
                );
              })
            : null;

        if (currentBatch) {
          setSelectedBatch(currentBatch);
          await loadDetails(currentBatch);
        } else {
          setSelectedBatch(null);
          setDetailsRows([]);
        }
      } catch (error) {
        setSummaryRows([]);
        setDetailsRows([]);

        await showError(
          error?.message ||
          "حدث خطأ أثناء تحميل الدفعات"
        );
      } finally {
        setLoadingSummary(false);
      }
    },
    [
      programType,
      selectedBranch,
      loadDetails
    ]
  );

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    if (selectedBranch?.guid) {
      loadSummary();
    }
  }, [
    selectedBranch,
    programType,
    loadSummary
  ]);

  const handleProgramTypeChange = (
    event
  ) => {
    /*
     * نغيّر نوع البرنامج فقط.
     * الفرع يظل ثابتًا كما اختاره المستخدم.
     * الدفعة ستظل محددة لو كانت موجودة
     * في النوع الجديد، وإلا يتم إلغاء تحديدها.
     */
    setProgramType(
      Number(event.target.value)
    );
  };

  const handleSummaryRowClick = async (
    params
  ) => {
    const clickedId =
      params.row.batchGuid ||
      `${params.row.code}-${params.row.batchName}`;

    if (clickedId === selectedBatchId) {
      return;
    }

    setSelectedBatch(params.row);
    await loadDetails(params.row);
  };

  const totals = useMemo(() => {
    return summaryRows.reduce(
      (result, row) => ({
        totalSeats:
          result.totalSeats +
          toNumber(row.totalSeats),

        registeredSeats:
          result.registeredSeats +
          toNumber(row.registeredSeats),

        availableSeats:
          result.availableSeats +
          toNumber(row.availableSeats)
      }),
      {
        totalSeats: 0,
        registeredSeats: 0,
        availableSeats: 0
      }
    );
  }, [summaryRows]);

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      dir="rtl"
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
        background: "#f5f8f7",
        fontFamily: "Cairo, Arial, sans-serif",
        position: "relative"
      }}
    >
      {!isDesktop && (
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            top: 0,
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(14px)",
            color: "#17372b",
            borderBottom: "1px solid rgba(5,117,70,0.12)"
          }}
        >
          <Toolbar
            sx={{
              minHeight: {
                xs: "var(--app-header-height, 56px)",
                sm: "var(--app-header-height, 56px)",
                md: "var(--app-header-height, 56px)"
              },
              px: { xs: 0.8, sm: 1.2, md: 1.5 },
              gap: 0.8
            }}
          >
            <IconButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMobileSidebarOpen((current) => !current);
              }}
              aria-label={
                mobileSidebarOpen
                  ? "إغلاق القائمة"
                  : "فتح القائمة"
              }
              aria-expanded={mobileSidebarOpen}
              sx={{
                width: { xs: 36, sm: 40, md: 42 },
                height: { xs: 36, sm: 40, md: 42 },
                flexShrink: 0,
                color: "#fff",
                background:
                  "linear-gradient(135deg,#057546,#034d31)",
                boxShadow:
                  "0 6px 16px rgba(5,117,70,0.22)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg,#034d31,#057546)"
                }
              }}
            >
              <MenuRoundedIcon
                sx={{
                  fontSize: {
                    xs: 20,
                    sm: 22,
                    md: 23
                  }
                }}
              />
            </IconButton>

            <Typography
              sx={{
                flex: 1,
                fontWeight: 900,
                fontSize: {
                  xs: "0.75rem",
                  sm: "0.8rem",
                  md: "0.88rem"
                },
                color: "#17372b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              عداد الدفعات
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      

      <Box
        component="main"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          ml: 0,
          mr: 0,
          minHeight: "100dvh",
          p: {
            xs: 0.45,
            sm: 0.7,
            md: 1,
            lg: 1.3
          },
          boxSizing: "border-box",
          overflowX: "hidden",
          [`@media (min-width:${DESKTOP_BREAKPOINT}px)`]: {
            p: 3
          },
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 1500,
            mx: "auto",
            borderRadius: isPhone
              ? 1.6
              : isTablet
                ? 2.2
                : 4,
            overflow: "hidden",
            border:
              "1px solid rgba(5,117,70,0.14)",
            background: "#fff"
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: isPhone
                ? 0.7
                : isTablet
                  ? 1.1
                  : 3,
              py: isPhone
                ? 0.65
                : isTablet
                  ? 0.9
                  : 3,

              background:
                "linear-gradient(135deg,#ffffff 0%,#edf8f3 45%,#dff3ea 100%)",

              borderBottom:
                "1px solid rgba(5,117,70,0.14)"
            }}
          >
            <Stack
              direction="row"
              spacing={
                isPhone
                  ? 0.5
                  : isTablet
                    ? 0.75
                    : 1.2
              }
              alignItems="center"
            >
              <Box
                sx={{
                  width: isPhone
                    ? 31
                    : isTablet
                      ? 38
                      : 52,

                  height: isPhone
                    ? 31
                    : isTablet
                      ? 38
                      : 52,

                  borderRadius: isPhone
                    ? 1.6
                    : isTablet
                      ? 2
                      : 3,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  background:
                    "linear-gradient(135deg,#057546 0%,#034d31 100%)"
                }}
              >
                <AccountTreeIcon
                  sx={{
                    color: "#fff",
                    fontSize: isPhone
                      ? 17
                      : isTablet
                        ? 21
                        : 30
                  }}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 950,
                    color: "#034d31",
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.88rem"
                        : "1.5rem",
                    lineHeight: 1.15
                  }}
                >
                  عداد الدفعات
                </Typography>

                <Typography
                  sx={{
                    mt: 0.15,
                    fontFamily: "Cairo",
                    color: "#61756d",
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined,
                    lineHeight: 1.35,
                    display: isPhone
                      ? "none"
                      : "block"
                  }}
                >
                  متابعة المقاعد والمسجلين والمتاح
                  لكل دفعة وبرنامج
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: isPhone
                ? 0.55
                : isTablet
                  ? 0.85
                  : 3
            }}
          >
            {/* Filters */}
            <Paper
              elevation={0}
              sx={uiLayout.withUiSx({
                mb: isPhone
                  ? 0.65
                  : isTablet
                    ? 0.9
                    : 2.25,

                p: isPhone
                  ? 0.55
                  : isTablet
                    ? 0.8
                    : 2,

                borderRadius: isPhone
                  ? 1.4
                  : isTablet
                    ? 2
                    : 3.5,

                border:
                  "1px solid rgba(5,117,70,0.14)",

                background:
                  "linear-gradient(135deg,#ffffff 0%,#f3faf6 100%)"
              }, uiLayout.pageHeaderSx)}
            >
              <Typography
                sx={{
                  mb: isPhone
                    ? 0.45
                    : isTablet
                      ? 0.65
                      : 1.4,

                  fontFamily: "Cairo",
                  fontWeight: 950,
                  color: "#034d31",

                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined
                }}
              >
                خيارات العرض
              </Typography>

              <Box
                sx={uiLayout.withUiSx({
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2,minmax(0,1fr))",
                    sm: "repeat(4,minmax(0,1fr))",
                    lg: "210px minmax(300px,430px) auto auto"
                  },
                  gap: isPhone
                    ? 0.45
                    : isTablet
                      ? 0.65
                      : 1.5,
                  alignItems: "center"
                }, uiLayout.filterBarSx)}
              >
                <TextField InputLabelProps={{ shrink: true }}
                  select
                  size="small"
                  label="نوع البرنامج"
                  value={programType}
                  onChange={
                    handleProgramTypeChange
                  }
                  sx={uiLayout.withUiSx({
                    gridColumn: {
                      xs: "1 / 2",
                      sm: "1 / 2"
                    },

                    "& .MuiInputLabel-root": {
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : undefined
                    },

                    "& .MuiSelect-select": {
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
                    }
                  }, uiLayout.formFieldSx)}
                >
                  {PROGRAM_TYPES.map(
                    (item) => (
                      <MenuItem
                        key={item.value}
                        value={item.value}
                        sx={{
                          minHeight: isPhone
                            ? 30
                            : isTablet
                              ? 34
                              : undefined,

                          fontSize: isPhone
                            ? "0.75rem"
                            : isTablet
                              ? "0.75rem"
                              : undefined,

                          py: isPhone
                            ? 0.35
                            : isTablet
                              ? 0.45
                              : undefined,

                          pl: isPhone
                            ? 1.8
                            : isTablet
                              ? 2.2
                              : undefined
                        }}
                      >
                        {item.label}
                      </MenuItem>
                    )
                  )}
                </TextField>

                <Autocomplete
                  options={branches}
                  value={selectedBranch}
                  loading={loadingBranches}
                  onChange={(event, value) => {
                    setSelectedBranch(value);
                  }}
                  isOptionEqualToValue={(
                    option,
                    value
                  ) =>
                    option.guid === value.guid
                  }
                  getOptionLabel={(option) =>
                    option?.name || ""
                  }
                  sx={{
                    gridColumn: {
                      xs: "2 / 3",
                      sm: "2 / 4"
                    },

                    minWidth: 0,

                    "& .MuiInputLabel-root": {
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : undefined
                    },

                    "& .MuiInputBase-input": {
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : undefined
                    }
                  }}
                  slotProps={{
                    paper: {
                      sx: {
                        maxHeight: isPhone
                          ? 210
                          : isTablet
                            ? 250
                            : 340,

                        "& .MuiAutocomplete-option": {
                          minHeight: isPhone
                            ? 30
                            : isTablet
                              ? 34
                              : undefined,

                          py: isPhone
                            ? 0.35
                            : isTablet
                              ? 0.45
                              : undefined,

                          px: isPhone
                            ? 0.65
                            : isTablet
                              ? 0.85
                              : undefined,

                          pl: isPhone
                            ? 1.6
                            : isTablet
                              ? 2
                              : undefined,

                          fontSize: isPhone
                            ? "0.46rem"
                            : isTablet
                              ? "0.54rem"
                              : undefined
                        }
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      {...params}
                      size="small"
                      label="الفرع"
                      placeholder={
                        isPhone
                          ? "اختر الفرع"
                          : "ابحث باسم الفرع أو الكود"
                      }
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingBranches ? (
                              <CircularProgress
                                size={
                                  isPhone
                                    ? 13
                                    : 18
                                }
                              />
                            ) : null}

                            {
                              params.InputProps
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
                  startIcon={
                    <SearchIcon
                      sx={{
                        fontSize: isPhone
                          ? 14
                          : undefined
                      }}
                    />
                  }
                  onClick={loadSummary}
                  disabled={
                    loadingSummary ||
                    !selectedBranch?.guid
                  }
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    background: "#057546",

                    minHeight: isPhone
                      ? 31
                      : isTablet
                        ? 34
                        : undefined,

                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined
                  }, uiLayout.buttonSx)}
                >
                  عرض
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <RefreshIcon
                      sx={{
                        fontSize: isPhone
                          ? 14
                          : undefined
                      }}
                    />
                  }
                  onClick={async () => {
                    await loadBranches();
                    await loadSummary();
                  }}
                  disabled={
                    loadingBranches ||
                    loadingSummary
                  }
                  sx={uiLayout.withUiSx({
                    fontFamily: "Cairo",
                    fontWeight: 900,

                    minHeight: isPhone
                      ? 31
                      : isTablet
                        ? 34
                        : undefined,

                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined
                  }, uiLayout.buttonSx)}
                >
                  تحديث
                </Button>
              </Box>
            </Paper>

            {/* Summary metrics */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3,minmax(0,1fr))",
                gap: isPhone
                  ? 0.35
                  : isTablet
                    ? 0.5
                    : 1.2,

                mb: isPhone
                  ? 0.55
                  : isTablet
                    ? 0.8
                    : 1.5
              }}
            >
              {[
                {
                  label: "إجمالي المقاعد",
                  value: totals.totalSeats,
                  bg: "#eef4ff",
                  color: "#184f90"
                },
                {
                  label: "المسجلين",
                  value: totals.registeredSeats,
                  bg: "#fff7cc",
                  color: "#735c00"
                },
                {
                  label: "المتاح",
                  value: totals.availableSeats,
                  bg: "#e6f3ee",
                  color: "#057546"
                }
              ].map((item) => (
                <Paper
                  key={item.label}
                  variant="outlined"
                  sx={{
                    py: isPhone
                      ? 0.35
                      : isTablet
                        ? 0.5
                        : 0.75,

                    px: isPhone
                      ? 0.2
                      : isTablet
                        ? 0.4
                        : 0.75,

                    textAlign: "center",
                    borderRadius: isPhone
                      ? 1.2
                      : 2,

                    background: item.bg,
                    borderColor: "transparent"
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 950,
                      color: item.color,
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : "0.78rem",

                      lineHeight: 1.2
                    }}
                  >
                    {item.label}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.15,
                      fontFamily: "Cairo",
                      fontWeight: 950,
                      color: item.color,
                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : "1rem"
                    }}
                  >
                    {item.value}
                  </Typography>
                </Paper>
              ))}
            </Box>

            <Paper
              variant="outlined"
              sx={{
                mb: isPhone
                  ? 0.6
                  : isTablet
                    ? 0.85
                    : 1.3,

                py: isPhone
                  ? 0.4
                  : isTablet
                    ? 0.55
                    : 1,

                px: isPhone
                  ? 0.55
                  : isTablet
                    ? 0.75
                    : 1.2,

                borderRadius: isPhone
                  ? 1.3
                  : 2.2,

                background: selectedBatch
                  ? "#edf8f3"
                  : "#f7f9f8"
              }}
            >
              <Stack
                direction="row"
                spacing={
                  isPhone
                    ? 0.35
                    : isTablet
                      ? 0.55
                      : 1
                }
                alignItems="center"
              >
                <CheckCircleIcon
                  sx={{
                    color: selectedBatch
                      ? "#057546"
                      : "#9aa7a1",

                    fontSize: isPhone
                      ? 15
                      : isTablet
                        ? 18
                        : undefined
                  }}
                />

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: selectedBatch
                        ? "#034d31"
                        : "#71837c",

                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : undefined
                    }}
                  >
                    {selectedBatch
                      ? "الدفعة المختارة"
                      : "اختر دفعة لعرض التفاصيل"}
                  </Typography>

                  {selectedBatch ? (
                    <Typography
                      sx={{
                        mt: 0.1,
                        fontFamily: "Cairo",
                        color: "#71837c",
                        fontSize: isPhone
                          ? "0.75rem"
                          : isTablet
                            ? "0.75rem"
                            : "0.82rem",

                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {selectedBatch.batchName}
                    </Typography>
                  ) : null}
                </Box>
              </Stack>
            </Paper>

            {/* Summary title */}
            <Stack
              direction="row"
              spacing={
                isPhone
                  ? 0.35
                  : isTablet
                    ? 0.55
                    : 1.2
              }
              alignItems="center"
              sx={{
                mb: isPhone
                  ? 0.4
                  : isTablet
                    ? 0.55
                    : 1.2
              }}
            >
              <Box
                sx={{
                  width: isPhone
                    ? 27
                    : isTablet
                      ? 32
                      : 38,

                  height: isPhone
                    ? 27
                    : isTablet
                      ? 32
                      : 38,

                  borderRadius: isPhone
                    ? 1.4
                    : 2,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  background:
                    "linear-gradient(135deg,#057546 0%,#034d31 100%)"
                }}
              >
                <LayersIcon
                  sx={{
                    color: "#fff",
                    fontSize: isPhone
                      ? 15
                      : isTablet
                        ? 18
                        : 22
                  }}
                />
              </Box>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  color: "#034d31",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : undefined
                }}
              >
                ملخص الدفعات
              </Typography>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  color: "#71837c",
                  fontSize: isPhone
                    ? "0.75rem"
                    : isTablet
                      ? "0.75rem"
                      : "0.82rem",

                  display: isPhone
                    ? "none"
                    : "block"
                }}
              >
                اضغط على أي دفعة لعرض التفاصيل
              </Typography>
            </Stack>

            {/* Summary grid */}
            <Box
              sx={uiLayout.withUiSx({
                height: isPhone
                  ? 350
                  : isTablet
                    ? 410
                    : programType === 0
                      ? 440
                      : 490,

                width: "100%",

                mb: isPhone
                  ? 0.8
                  : isTablet
                    ? 1.1
                    : 2.6,

                border:
                  "1px solid rgba(5,117,70,0.14)",

                borderRadius: isPhone
                  ? 1.5
                  : isTablet
                    ? 2
                    : 4,

                overflow: "hidden",
                background: "#fff"
              }, uiLayout.tableContainerSx)}
            >
              <DataGrid
                rows={summaryRows}
                columns={summaryColumns}
                loading={loadingSummary}
                rowHeight={
                  isPhone
                    ? 34
                    : isTablet
                      ? 40
                      : undefined
                }
                getRowHeight={
                  isCompact
                    ? undefined
                    : () => "auto"
                }
                columnHeaderHeight={
                  isPhone
                    ? 31
                    : isTablet
                      ? 36
                      : 60
                }
                disableRowSelectionOnClick
                disableColumnFilter={isCompact}
                disableColumnMenu={isCompact}
                onRowClick={
                  handleSummaryRowClick
                }
                getRowClassName={(params) => {
                  const rowId =
                    params.row.batchGuid ||
                    `${params.row.code}-${params.row.batchName}`;

                  return rowId === selectedBatchId
                    ? "selected-batch-row"
                    : "";
                }}
                getRowId={(row) =>
                  row.batchGuid ||
                  `${row.code}-${row.batchName}`
                }
                showToolbar={!isCompact}
                slots={
                  !isCompact
                    ? {
                        toolbar: GridToolbar
                      }
                    : undefined
                }
                slotProps={
                  !isCompact
                    ? {
                        toolbar: {
                          showQuickFilter: true,
                          quickFilterProps: {
                            debounceMs: 300
                          },
                          csvOptions: {
                            utf8WithBom: true,
                            fileName:
                              "عداد الدفعات - الملخص"
                          },
                          printOptions: {
                            disableToolbarButton: true
                          }
                        }
                      }
                    : undefined
                }
                initialState={{
                  pagination: {
                    paginationModel: {
                      page: 0,
                      pageSize: isPhone
                        ? 10
                        : 25
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
                    "لا توجد دفعات",
                  noResultsOverlayLabel:
                    "لا توجد نتائج مطابقة",
                  toolbarColumns: "الأعمدة",
                  toolbarFilters: "الفلاتر",
                  toolbarDensity: "الكثافة",
                  toolbarExport: "تصدير",
                  toolbarQuickFilterPlaceholder:
                    "بحث داخل الدفعات..."
                }}
                sx={uiLayout.withUiSx({
                  ...gridSx,

                  "& .MuiDataGrid-columnHeaders": {
                    ...gridSx[
                      "& .MuiDataGrid-columnHeaders"
                    ],
                    minHeight: `${
                      isPhone
                        ? 31
                        : isTablet
                          ? 36
                          : 60
                    }px !important`,
                    maxHeight: `${
                      isPhone
                        ? 31
                        : isTablet
                          ? 36
                          : 60
                    }px !important`
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    ...gridSx[
                      "& .MuiDataGrid-columnHeaderTitle"
                    ],
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined,
                    whiteSpace: "nowrap",
                    lineHeight: 1
                  },

                  "& .MuiDataGrid-cell": {
                    ...gridSx[
                      "& .MuiDataGrid-cell"
                    ],

                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : "0.92rem",

                    px: isPhone
                      ? 0.1
                      : isTablet
                        ? 0.2
                        : undefined,

                    minHeight: isCompact
                      ? "unset !important"
                      : "62px !important",

                    display: "flex",
                    alignItems: "center"
                  },

                  "& .MuiDataGrid-columnSeparator": {
                    display: isCompact
                      ? "none"
                      : undefined
                  },

                  "& .MuiDataGrid-footerContainer": {
                    minHeight: isPhone
                      ? 38
                      : isTablet
                        ? 44
                        : undefined
                  },

                  "& .MuiTablePagination-root, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined
                  },

                  "& .selected-batch-row": {
                    background:
                      "linear-gradient(90deg,#fff4d8 0%,#ffe3a1 48%,#fff4d8 100%) !important",
                    color: "#7a4d00",
                    fontWeight: 900
                  }
                }, uiLayout.dataGridSx)}
              />
            </Box>

            {/* Details heading */}
            <Paper
              elevation={0}
              sx={{
                mb: isPhone
                  ? 0.45
                  : isTablet
                    ? 0.65
                    : 1.3,

                p: isPhone
                  ? 0.5
                  : isTablet
                    ? 0.7
                    : 1.5,

                borderRadius: isPhone
                  ? 1.4
                  : isTablet
                    ? 2
                    : 3.5,

                border:
                  "1px solid rgba(5,117,70,0.12)",

                background: selectedBatch
                  ? "linear-gradient(135deg,#edf8f3 0%,#ffffff 55%,#f8fdfa 100%)"
                  : "#f7f9f8"
              }}
            >
              <Stack
                direction="row"
                spacing={
                  isPhone
                    ? 0.35
                    : isTablet
                      ? 0.55
                      : 1
                }
                alignItems="center"
              >
                <CheckCircleIcon
                  sx={{
                    color: selectedBatch
                      ? "#057546"
                      : "#9aa7a1",

                    fontSize: isPhone
                      ? 15
                      : isTablet
                        ? 18
                        : undefined
                  }}
                />

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 950,

                      color: selectedBatch
                        ? "#034d31"
                        : "#71837c",

                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : undefined
                    }}
                  >
                    تفاصيل المقاعد للدفعة المختارة
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.1,
                      fontFamily: "Cairo",
                      color: "#71837c",

                      fontSize: isPhone
                        ? "0.75rem"
                        : isTablet
                          ? "0.75rem"
                          : "0.82rem",

                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {selectedBatch
                      ? selectedBatch.batchName
                      : "لم يتم اختيار دفعة حتى الآن"}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Details grid */}
            <Box
              sx={uiLayout.withUiSx({
                height: isPhone
                  ? 340
                  : isTablet
                    ? 400
                    : 430,

                width: "100%",

                border:
                  "1px solid rgba(5,117,70,0.14)",

                borderRadius: isPhone
                  ? 1.5
                  : isTablet
                    ? 2
                    : 4,

                overflow: "hidden",
                background: "#fff"
              }, uiLayout.tableContainerSx)}
            >
              <DataGrid
                rows={detailsRows}
                columns={detailsColumns}
                loading={loadingDetails}
                rowHeight={
                  isPhone
                    ? 34
                    : isTablet
                      ? 40
                      : undefined
                }
                getRowHeight={
                  isCompact
                    ? undefined
                    : () => "auto"
                }
                columnHeaderHeight={
                  isPhone
                    ? 31
                    : isTablet
                      ? 36
                      : 58
                }
                disableRowSelectionOnClick
                disableColumnFilter={isCompact}
                disableColumnMenu={isCompact}
                getRowId={(row) =>
                  row.programGuid ||
                  `${row.programName}-${row.id}`
                }
                showToolbar={!isCompact}
                slots={
                  !isCompact
                    ? {
                        toolbar: GridToolbar
                      }
                    : undefined
                }
                slotProps={
                  !isCompact
                    ? {
                        toolbar: {
                          showQuickFilter: true,
                          quickFilterProps: {
                            debounceMs: 300
                          },
                          csvOptions: {
                            utf8WithBom: true,
                            fileName:
                              "عداد الدفعات - التفاصيل"
                          },
                          printOptions: {
                            disableToolbarButton: true
                          }
                        }
                      }
                    : undefined
                }
                initialState={{
                  pagination: {
                    paginationModel: {
                      page: 0,
                      pageSize: isPhone
                        ? 10
                        : 25
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
                    "لا توجد تفاصيل",
                  noResultsOverlayLabel:
                    "لا توجد نتائج مطابقة",
                  toolbarColumns: "الأعمدة",
                  toolbarFilters: "الفلاتر",
                  toolbarDensity: "الكثافة",
                  toolbarExport: "تصدير",
                  toolbarQuickFilterPlaceholder:
                    "بحث داخل التفاصيل..."
                }}
                sx={uiLayout.withUiSx({
                  ...gridSx,

                  "& .MuiDataGrid-columnHeaders": {
                    ...gridSx[
                      "& .MuiDataGrid-columnHeaders"
                    ],

                    minHeight: `${
                      isPhone
                        ? 31
                        : isTablet
                          ? 36
                          : 58
                    }px !important`,

                    maxHeight: `${
                      isPhone
                        ? 31
                        : isTablet
                          ? 36
                          : 58
                    }px !important`
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    ...gridSx[
                      "& .MuiDataGrid-columnHeaderTitle"
                    ],

                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : undefined,

                    whiteSpace: "nowrap",
                    lineHeight: 1
                  },

                  "& .MuiDataGrid-cell": {
                    ...gridSx[
                      "& .MuiDataGrid-cell"
                    ],

                    fontSize: isPhone
                      ? "0.75rem"
                      : isTablet
                        ? "0.75rem"
                        : "0.92rem",

                    px: isPhone
                      ? 0.1
                      : isTablet
                        ? 0.2
                        : undefined,

                    minHeight: isCompact
                      ? "unset !important"
                      : "64px !important",

                    display: "flex",
                    alignItems: "center"
                  },

                  "& .MuiDataGrid-columnSeparator": {
                    display: isCompact
                      ? "none"
                      : undefined
                  },

                  "& .MuiDataGrid-footerContainer": {
                    minHeight: isPhone
                      ? 38
                      : isTablet
                        ? 44
                        : undefined
                  },

                  "& .MuiTablePagination-root, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
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
      </Box>
    </Box></NavigationShell>
  );
};

const gridSx = {
  border: 0,
  direction: "rtl",
  fontFamily: "Cairo",

  "& .MuiDataGrid-columnHeaders": {
    background:
      "linear-gradient(135deg,#057546 0%,#034d31 100%)",
    color: "#fff",
    fontWeight: 900,
    borderBottom: "none"
  },

  "& .MuiDataGrid-columnHeader": {
    background: "transparent"
  },

  "& .MuiDataGrid-columnHeaderTitle": {
    fontFamily: "Cairo",
    fontWeight: 900,
    textAlign: "center",
    width: "100%",
    whiteSpace: "normal",
    lineHeight: 1.35
  },

  "& .MuiDataGrid-columnSeparator": {
    color: "rgba(255,255,255,0.55)",
    visibility: "visible"
  },

  "& .MuiDataGrid-cell": {
    fontFamily: "Cairo",
    textAlign: "center",
    justifyContent: "center",
    borderColor: "#e6ece9",
    fontSize: "0.92rem",
    color: "#263a32"
  },

  "& .MuiDataGrid-row:nth-of-type(even)": {
    backgroundColor: "#f9fcfa"
  },

  "& .MuiDataGrid-row:nth-of-type(odd)": {
    backgroundColor: "#ffffff"
  },

  "& .MuiDataGrid-row": {
    transition:
      "background-color 0.18s ease, box-shadow 0.18s ease"
  },

  "& .MuiDataGrid-row:hover": {
    backgroundColor: "#fff3d6",
    cursor: "pointer",
    boxShadow: "inset 4px 0 0 #d89400"
  },

  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
    outline: "none"
  },

  "& .MuiDataGrid-toolbarContainer": {
    p: 1.15,
    gap: 1,
    borderBottom: "1px solid #e6ece9",
    background:
      "linear-gradient(135deg,#fbfdfc 0%,#f3faf6 100%)",
    direction: "rtl"
  },

  "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
    fontFamily: "Cairo",
    fontWeight: 800,
    color: "#057546"
  },

  "& .MuiDataGrid-footerContainer": {
    direction: "rtl",
    fontFamily: "Cairo"
  }
};

export default BatchSeatsCounter;