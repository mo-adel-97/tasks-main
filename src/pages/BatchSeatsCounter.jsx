import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LayersIcon from "@mui/icons-material/Layers";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

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
  }, [programType]);

  const detailsColumns = useMemo(
    () => [
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
    ],
    [programType]
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
                "linear-gradient(135deg,#ffffff 0%,#edf8f3 45%,#dff3ea 100%)",
              borderBottom:
                "1px solid rgba(5,117,70,0.14)",
              boxShadow:
                "0 12px 32px rgba(5,117,70,0.10)",
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 4,
                background:
                  "linear-gradient(90deg,#057546 0%,#18a66b 60%,#d89400 100%)"
              }
            }}
          >
            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg,#057546 0%,#034d31 100%)",
                  boxShadow:
                    "0 10px 24px rgba(5,117,70,0.22)"
                }}
              >
                <AccountTreeIcon
                  sx={{
                    color: "#fff",
                    fontSize: 30
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    color: "#034d31"
                  }}
                >
                  عداد الدفعات
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    fontFamily: "Cairo",
                    color: "#61756d"
                  }}
                >
                  متابعة المقاعد والمسجلين والمتاح لكل دفعة وبرنامج
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
                mb: 2.25,
                p: {
                  xs: 1.5,
                  md: 2
                },
                borderRadius: 3.5,
                border:
                  "1px solid rgba(5,117,70,0.14)",
                background:
                  "linear-gradient(135deg,#ffffff 0%,#f3faf6 100%)",
                boxShadow:
                  "0 10px 28px rgba(31,45,61,0.06)"
              }}
            >
              <Typography
                sx={{
                  mb: 1.4,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: "#034d31"
                }}
              >
                خيارات العرض
              </Typography>

              <Stack
                direction={{
                  xs: "column",
                  md: "row"
                }}
                spacing={1.5}
              >
              <TextField
                select
                size="small"
                label="نوع البرنامج"
                value={programType}
                onChange={
                  handleProgramTypeChange
                }
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 210
                  }
                }}
              >
                {PROGRAM_TYPES.map(
                  (item) => (
                    <MenuItem
                      key={item.value}
                      value={item.value}
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
                onChange={(
                  event,
                  value
                ) => {
                  /*
                   * نغيّر الفرع فقط.
                   * loadSummary سيحافظ على الدفعة
                   * لو ما زالت موجودة في الفرع الجديد.
                   */
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
                  minWidth: {
                    xs: "100%",
                    md: 430
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="الفرع"
                    placeholder="ابحث باسم الفرع أو الكود"
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
                startIcon={<SearchIcon />}
                onClick={loadSummary}
                disabled={
                  loadingSummary ||
                  !selectedBranch?.guid
                }
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
                onClick={async () => {
                  await loadBranches();
                  await loadSummary();
                }}
                disabled={
                  loadingBranches ||
                  loadingSummary
                }
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900
                }}
              >
                تحديث
              </Button>
              </Stack>
            </Paper>

            <Stack
              direction={{
                xs: "column",
                md: "row"
              }}
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
              sx={{
                mb: 2.2,
                p: 1.6,
                borderRadius: 4,
                border:
                  "1px solid rgba(5,117,70,0.10)",
                background:
                  "linear-gradient(135deg,#ffffff 0%,#fbfdfc 55%,#f2faf6 100%)",
                boxShadow:
                  "0 10px 24px rgba(10,50,32,0.06)"
              }}
            >
              <Chip
                label={`إجمالي المقاعد: ${totals.totalSeats}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#eef4ff",
                  color: "#184f90"
                }}
              />

              <Chip
                label={`المسجلين: ${totals.registeredSeats}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#fff7cc",
                  color: "#735c00"
                }}
              />

              <Chip
                label={`المتاح: ${totals.availableSeats}`}
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  background: "#e6f3ee",
                  color: "#057546"
                }}
              />

              {selectedBatch ? (
                <Chip
                  icon={
                    <CheckCircleIcon />
                  }
                  label={`الدفعة المختارة: ${selectedBatch.batchName}`}
                  sx={{
                    height: 38,
                    px: 0.75,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    background:
                      "linear-gradient(135deg,#ae1e21 0%,#7f1518 100%)",
                    color: "#fff",
                    boxShadow:
                      "0 8px 20px rgba(174,30,33,0.25)",
                    "& .MuiChip-icon": {
                      color: "#fff"
                    }
                  }}
                />
              ) : (
                <Chip
                  label="اختر دفعة من الجدول لعرض التفاصيل"
                  sx={{
                    height: 38,
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    background: "#f2f4f3",
                    color: "#61756d"
                  }}
                />
              )}
            </Stack>

            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
              sx={{ mb: 1.2 }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg,#057546 0%,#034d31 100%)",
                  boxShadow:
                    "0 8px 18px rgba(5,117,70,0.20)"
                }}
              >
              <LayersIcon
                sx={{
                  color: "#fff",
                  fontSize: 22
                }}
              />
              </Box>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  color: "#034d31"
                }}
              >
                ملخص الدفعات
              </Typography>

              <Typography
                sx={{
                  fontFamily: "Cairo",
                  color: "#71837c",
                  fontSize: "0.82rem"
                }}
              >
                اضغط على أي دفعة لعرض تفاصيل المقاعد
              </Typography>
            </Stack>

            <Box
              sx={{
                height:
                  programType === 0
                    ? 440
                    : 490,
                width: "100%",
                mb: 2.6,
                border:
                  "1px solid rgba(5,117,70,0.14)",
                borderRadius: 4,
                overflow: "hidden",
                background: "#fff",
                boxShadow:
                  "0 12px 32px rgba(31,45,61,0.08)"
              }}
            >
              <DataGrid
                rows={summaryRows}
                columns={summaryColumns}
                loading={loadingSummary}
                getRowHeight={() => "auto"}
                columnHeaderHeight={60}
                disableRowSelectionOnClick
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
                        "عداد الدفعات - الملخص"
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
                    "لا توجد دفعات",
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
                    "بحث داخل الدفعات..."
                }}
                sx={{
                  ...gridSx,

                  "& .MuiDataGrid-cell": {
                    ...gridSx["& .MuiDataGrid-cell"],
                    minHeight: "62px !important",
                    display: "flex",
                    alignItems: "center"
                  },

                  "& .selected-batch-row": {
                    background:
                      "linear-gradient(90deg,#fff4d8 0%,#ffe3a1 48%,#fff4d8 100%) !important",
                    color: "#7a4d00",
                    fontWeight: 900,
                    boxShadow:
                      "inset 5px 0 0 #d89400, inset -5px 0 0 #d89400"
                  },

                  "& .selected-batch-row:hover": {
                    background:
                      "linear-gradient(90deg,#ffe9b8 0%,#ffd579 48%,#ffe9b8 100%) !important"
                  },

                  "& .selected-batch-row .MuiDataGrid-cell": {
                    borderTop:
                      "1px solid rgba(216,148,0,0.35)",
                    borderBottom:
                      "1px solid rgba(216,148,0,0.35)"
                  }
                }}
              />
            </Box>

            <Paper
              elevation={0}
              sx={{
                mb: 1.3,
                p: 1.5,
                borderRadius: 3.5,
                border:
                  "1px solid rgba(5,117,70,0.12)",
                background:
                  selectedBatch
                    ? "linear-gradient(135deg,#edf8f3 0%,#ffffff 55%,#f8fdfa 100%)"
                    : "#f7f9f8",
                boxShadow:
                  "0 8px 20px rgba(31,45,61,0.05)"
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <CheckCircleIcon
                  sx={{
                    color: selectedBatch
                      ? "#057546"
                      : "#9aa7a1"
                  }}
                />

                <Box>
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: selectedBatch
                        ? "#034d31"
                        : "#71837c"
                    }}
                  >
                    تفاصيل المقاعد للدفعة المختارة
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,
                      fontFamily: "Cairo",
                      color: "#71837c",
                      fontSize: "0.82rem"
                    }}
                  >
                    {selectedBatch
                      ? `الدفعة الحالية: ${selectedBatch.batchName}`
                      : "لم يتم اختيار دفعة حتى الآن"}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Box
              sx={{
                height: 430,
                width: "100%",
                border:
                  "1px solid rgba(5,117,70,0.14)",
                borderRadius: 4,
                overflow: "hidden",
                background: "#fff",
                boxShadow:
                  "0 12px 32px rgba(31,45,61,0.08)"
              }}
            >
              <DataGrid
                rows={detailsRows}
                columns={detailsColumns}
                loading={loadingDetails}
                getRowHeight={() => "auto"}
                columnHeaderHeight={58}
                disableRowSelectionOnClick
                getRowId={(row) =>
                  row.programGuid ||
                  `${row.programName}-${row.id}`
                }
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
                        "عداد الدفعات - التفاصيل"
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
                    "لا توجد تفاصيل",
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
                    "بحث داخل التفاصيل..."
                }}
                sx={{
                  ...gridSx,

                  "& .MuiDataGrid-cell": {
                    ...gridSx[
                      "& .MuiDataGrid-cell"
                    ],
                    minHeight: "64px !important",
                    display: "flex",
                    alignItems: "center"
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    ...gridSx[
                      "& .MuiDataGrid-columnHeaderTitle"
                    ],
                    whiteSpace: "normal",
                    lineHeight: 1.35
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

const gridSx = {
  border: 0,
  direction: "ltr",
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
    direction: "ltr"
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
};

export default BatchSeatsCounter;