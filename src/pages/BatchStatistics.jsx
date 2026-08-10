import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
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
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CorporateFareOutlinedIcon from "@mui/icons-material/CorporateFareOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const SIDEBAR_WIDTH = 280;

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";

const COLORS = {
  primary: "#0b6b46",
  primaryDark: "#064b33",
  primarySoft: "#eaf6f0",
  border: "#dfe9e4",
  background: "#f4f7f6",
  text: "#17352a",
  muted: "#6b7d75",
  warning: "#a96b00",
  warningSoft: "#fff6df",
  info: "#245f9e",
  infoSoft: "#edf5ff",
  danger: "#a7252a"
};

const unwrapValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "object" || value instanceof Date) {
    return value;
  }

  const candidates = [
    value.value,
    value.Value,
    value.data,
    value.Data,
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
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value) => {
  const parsed = numberValue(value);

  if (parsed === null) {
    return String(unwrapValue(value) ?? "");
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(parsed);
};

const showError = async (message) => {
  await Swal.fire({
    icon: "error",
    title: "حدث خطأ",
    text: message,
    confirmButtonText: "حسنًا",
    confirmButtonColor: COLORS.danger
  });
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconBackground,
  iconColor
}) => (
  <Paper
    elevation={0}
    sx={{
      flex: 1,
      minWidth: { xs: "100%", sm: 220 },
      p: 2,
      borderRadius: 3,
      border: `1px solid ${COLORS.border}`,
      background: "#fff",
      position: "relative",
      overflow: "hidden",
      transition: "transform .2s ease, box-shadow .2s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 12px 28px rgba(13, 70, 48, 0.08)"
      },
      "&::after": {
        content: '""',
        position: "absolute",
        left: 0,
        bottom: 0,
        width: "100%",
        height: 3,
        background: iconColor
      }
    }}
  >
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: "Cairo",
            fontSize: 13,
            fontWeight: 800,
            color: COLORS.muted
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.5,
            fontFamily: "Cairo",
            fontSize: { xs: 22, md: 26 },
            lineHeight: 1.3,
            fontWeight: 900,
            color: COLORS.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {value}
        </Typography>

        {subtitle ? (
          <Typography
            sx={{
              mt: 0.25,
              fontFamily: "Cairo",
              fontSize: 11.5,
              color: COLORS.muted
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      <Avatar
        variant="rounded"
        sx={{
          width: 52,
          height: 52,
          borderRadius: 2.5,
          background: iconBackground,
          color: iconColor
        }}
      >
        {icon}
      </Avatar>
    </Stack>
  </Paper>
);

const BatchStatistics = () => {
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    []
  );

  const userGuid = String(user?.guid || user?.Guid || "").trim();

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [rows, setRows] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branchGenderFilter, setBranchGenderFilter] = useState("all");

  const loadBatches = useCallback(async () => {
    if (!userGuid) {
      return;
    }

    setLoadingBatches(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/batch-statistics/batches?userGuid=${encodeURIComponent(userGuid)}`,
        {
          headers: {
            Accept: "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "تعذر تحميل الدفعات");
      }

      const values = Array.isArray(result?.data) ? result.data : [];
      setBatches(values);

      setSelectedBatch((current) => {
        if (current?.guid) {
          return (
            values.find((item) => item.guid === current.guid) || current
          );
        }

        return null;
      });
    } catch (error) {
      await showError(
        error?.message || "حدث خطأ أثناء تحميل الدفعات"
      );
    } finally {
      setLoadingBatches(false);
    }
  }, [userGuid]);

  const loadReport = useCallback(async () => {
    if (!selectedBatch?.guid) {
      setRows([]);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        userGuid,
        batchGuid: selectedBatch.guid
      });

      const response = await fetch(
        `${API_BASE_URL}/api/batch-statistics?${params.toString()}`,
        {
          headers: {
            Accept: "application/json"
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "تعذر تحميل إحصائيات الدفعة"
        );
      }

      const normalized = Array.isArray(result?.data)
        ? result.data.map((row) => {
            const output = {};

            Object.entries(row || {}).forEach(([key, value]) => {
              output[key] = unwrapValue(value);
            });

            return output;
          })
        : [];

      setRows(normalized);
    } catch (error) {
      setRows([]);

      await showError(
        error?.message || "حدث خطأ أثناء تحميل الإحصائيات"
      );
    } finally {
      setLoading(false);
    }
  }, [userGuid, selectedBatch]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (selectedBatch?.guid) {
      loadReport();
    }
  }, [selectedBatch, loadReport]);

  const isTotalField = useCallback((field) => {
    const normalizedField = String(field || "").trim();

    return (
      normalizedField === "إجمالي" ||
      normalizedField === "الاجمالي" ||
      normalizedField === "الإجمالي"
    );
  }, []);

  const isDiplomaField = useCallback((field) => {
    const normalizedField = String(field || "").trim();

    return (
      normalizedField === "اسم الدبلوم" ||
      normalizedField === "الدبلوم" ||
      normalizedField.toLowerCase() === "diplomname"
    );
  }, []);

  const isFemaleBranchField = useCallback(
    (field) => String(field || "").trim().includes("نسا"),
    []
  );

  const allFields = useMemo(() => {
    const fields = [];

    rows.forEach((row) => {
      Object.keys(row || {}).forEach((field) => {
        if (!fields.includes(field)) {
          fields.push(field);
        }
      });
    });

    const diplomaField = fields.find((field) => isDiplomaField(field));

    if (diplomaField) {
      const index = fields.indexOf(diplomaField);
      fields.splice(index, 1);
      fields.unshift(diplomaField);
    }

    return fields;
  }, [rows, isDiplomaField]);

  const diplomaFieldName = useMemo(
    () => allFields.find((field) => isDiplomaField(field)) || null,
    [allFields, isDiplomaField]
  );

  const originalTotalFieldName = useMemo(
    () => allFields.find((field) => isTotalField(field)) || null,
    [allFields, isTotalField]
  );

  const maleBranchFields = useMemo(
    () =>
      allFields.filter(
        (field) =>
          field !== diplomaFieldName &&
          !isTotalField(field) &&
          !isFemaleBranchField(field)
      ),
    [
      allFields,
      diplomaFieldName,
      isTotalField,
      isFemaleBranchField
    ]
  );

  const femaleBranchFields = useMemo(
    () =>
      allFields.filter(
        (field) =>
          field !== diplomaFieldName &&
          !isTotalField(field) &&
          isFemaleBranchField(field)
      ),
    [
      allFields,
      diplomaFieldName,
      isTotalField,
      isFemaleBranchField
    ]
  );

  const visibleFields = useMemo(() => {
    const fields = diplomaFieldName ? [diplomaFieldName] : [];

    if (branchGenderFilter === "male") {
      return [...fields, ...maleBranchFields, "__maleTotal"];
    }

    if (branchGenderFilter === "female") {
      return [...fields, ...femaleBranchFields, "__femaleTotal"];
    }

    return allFields;
  }, [
    branchGenderFilter,
    diplomaFieldName,
    maleBranchFields,
    femaleBranchFields,
    allFields
  ]);

  const filteredRows = useMemo(
    () =>
      rows.map((row) => {
        const maleTotal = maleBranchFields.reduce(
          (sum, field) => sum + Number(numberValue(row?.[field]) || 0),
          0
        );

        const femaleTotal = femaleBranchFields.reduce(
          (sum, field) => sum + Number(numberValue(row?.[field]) || 0),
          0
        );

        return {
          ...row,
          __maleTotal: maleTotal,
          __femaleTotal: femaleTotal
        };
      }),
    [rows, maleBranchFields, femaleBranchFields]
  );

  const columns = useMemo(
    () =>
      visibleFields.map((field) => {
        const isCalculatedMaleTotal = field === "__maleTotal";
        const isCalculatedFemaleTotal = field === "__femaleTotal";
        const isCalculatedTotal =
          isCalculatedMaleTotal || isCalculatedFemaleTotal;

        const sample = filteredRows.find(
          (row) =>
            row?.[field] !== null &&
            row?.[field] !== undefined &&
            row?.[field] !== ""
        )?.[field];

        const numeric = isCalculatedTotal || numberValue(sample) !== null;
        const isDiploma = isDiplomaField(field);
        const isTextColumn = isDiploma;

        const headerName = isCalculatedMaleTotal
          ? "إجمالي الرجال"
          : isCalculatedFemaleTotal
            ? "إجمالي النساء"
            : field;

        return {
          field,
          headerName,
          type: numeric ? "number" : "string",
          flex: isDiploma ? 2.4 : 1,
          width: isDiploma ? 360 : isCalculatedTotal ? 145 : 135,
          minWidth: isDiploma ? 320 : isCalculatedTotal ? 135 : 110,
          maxWidth: isDiploma ? 560 : isCalculatedTotal ? 180 : 250,
          align: "center",
          headerAlign: "center",
          sortable: true,
          renderCell: (params) => {
            const value = params?.row?.[field] ?? params?.value;

            if (isTextColumn) {
              const textValue = String(unwrapValue(value) ?? "");

              return (
                <Tooltip title={textValue} arrow placement="top">
                  <Typography
                    component="span"
                    sx={{
                      width: "100%",
                      px: 0.5,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      lineHeight: 1.65,
                      textAlign: "left",
                      direction: "ltr",
                      fontFamily: "Cairo",
                      fontWeight: 800,
                      color: COLORS.text
                    }}
                  >
                    {textValue}
                  </Typography>
                </Tooltip>
              );
            }

            return (
              <Typography
                component="span"
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: numeric ? 800 : 600,
                  color: isCalculatedTotal
                    ? COLORS.danger
                    : numeric
                      ? COLORS.primaryDark
                      : COLORS.text
                }}
              >
                {numeric
                  ? formatNumber(value)
                  : String(unwrapValue(value) ?? "")}
              </Typography>
            );
          }
        };
      }),
    [visibleFields, filteredRows, isDiplomaField]
  );

  const dataGridRows = useMemo(
    () =>
      filteredRows.map((row, index) => ({
        id: `${
          diplomaFieldName ? row?.[diplomaFieldName] : "diploma"
        }-${index}`,
        ...row
      })),
    [filteredRows, diplomaFieldName]
  );

  const totals = useMemo(() => {
    const result = {};

    allFields.forEach((field) => {
      if (isDiplomaField(field)) {
        return;
      }

      const values = rows
        .map((row) => numberValue(row?.[field]))
        .filter((value) => value !== null);

      if (rows.length > 0 && values.length === rows.length) {
        result[field] = values.reduce((sum, value) => sum + value, 0);
      }
    });

    return result;
  }, [rows, allFields, isDiplomaField]);

  const grandTotal =
    (originalTotalFieldName
      ? totals[originalTotalFieldName]
      : null) ??
    Object.values(totals).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );

  const groupedBranchTotals = useMemo(() => {
    const female = [];
    const male = [];

    Object.entries(totals).forEach(([field, value]) => {
      const normalizedField = String(field || "").trim();

      if (isTotalField(normalizedField)) {
        return;
      }

      const item = {
        field: normalizedField,
        value
      };

      if (isFemaleBranchField(normalizedField)) {
        female.push(item);
      } else {
        male.push(item);
      }
    });

    return {
      female,
      male,
      femaleTotal: female.reduce(
        (sum, item) => sum + Number(item.value || 0),
        0
      ),
      maleTotal: male.reduce(
        (sum, item) => sum + Number(item.value || 0),
        0
      )
    };
  }, [totals, isTotalField, isFemaleBranchField]);

  const visibleReportTotal = useMemo(() => {
    if (branchGenderFilter === "male") {
      return groupedBranchTotals.maleTotal;
    }

    if (branchGenderFilter === "female") {
      return groupedBranchTotals.femaleTotal;
    }

    return grandTotal;
  }, [
    branchGenderFilter,
    groupedBranchTotals,
    grandTotal
  ]);

  const exportCsv = () => {
    if (filteredRows.length === 0) {
      return;
    }

    const escapeValue = (value) =>
      `"${String(unwrapValue(value) ?? "").replaceAll('"', '""')}"`;

    const exportHeaders = visibleFields.map((field) => {
      if (field === "__maleTotal") {
        return "إجمالي الرجال";
      }

      if (field === "__femaleTotal") {
        return "إجمالي النساء";
      }

      return field;
    });

    const csv = [
      exportHeaders.map(escapeValue).join(","),
      ...filteredRows.map((row) =>
        visibleFields
          .map((field) => escapeValue(row?.[field]))
          .join(",")
      )
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const filterName =
      branchGenderFilter === "male"
        ? "فروع الرجال"
        : branchGenderFilter === "female"
          ? "فروع النساء"
          : "كل الفروع";

    link.href = url;
    link.download = `إحصائيات الدفعات - ${
      selectedBatch?.name || "دفعة"
    } - ${filterName}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: COLORS.background,
        direction: "ltr"
      }}
    >
      <Sidebar />

      <Box
        component="main"
        sx={{
          marginLeft: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          width: { xs: "100%", md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          minHeight: "100vh",
          p: { xs: 1.25, sm: 2, md: 3 },
          direction: "ltr"
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: { xs: 3, md: 4 },
            overflow: "hidden",
            border: `1px solid ${COLORS.border}`,
            background: "#fff",
            boxShadow: "0 18px 48px rgba(14, 66, 47, 0.06)"
          }}
        >
          <Box
            sx={{
              px: { xs: 2, md: 3.5 },
              py: { xs: 2.5, md: 3.25 },
              position: "relative",
              overflow: "hidden",
              background:
                "linear-gradient(125deg, #064b33 0%, #0b6b46 52%, #19855f 100%)",
              color: "#fff",
              "&::before": {
                content: '""',
                position: "absolute",
                width: 220,
                height: 220,
                borderRadius: "50%",
                top: -120,
                left: -50,
                background: "rgba(255,255,255,0.07)"
              },
              "&::after": {
                content: '""',
                position: "absolute",
                width: 180,
                height: 180,
                borderRadius: "50%",
                bottom: -115,
                right: 80,
                background: "rgba(255,255,255,0.05)"
              }
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ position: "relative", zIndex: 1 }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.14)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.18)"
                  }}
                >
                  <QueryStatsIcon sx={{ fontSize: 34 }} />
                </Avatar>

                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      fontSize: { xs: 22, md: 28 }
                    }}
                  >
                    إحصائيات الدفعات
                  </Typography>

                </Box>
              </Stack>

              <Chip
                icon={<CalendarMonthOutlinedIcon />}
                label="تقرير الدفعات"
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 800,
                  color: "#fff",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  "& .MuiChip-icon": { color: "#fff" }
                }}
              />
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 1.5, sm: 2.25, md: 3 } }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, md: 2 },
                mb: 2.25,
                borderRadius: 3,
                border: `1px solid ${COLORS.border}`,
                background: "linear-gradient(180deg,#ffffff 0%,#fbfdfc 100%)"
              }}
            >
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={1.25}
                alignItems={{ xs: "stretch", lg: "center" }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      mb: 0.75,
                      fontFamily: "Cairo",
                      fontSize: 12,
                      fontWeight: 900,
                      color: COLORS.text
                    }}
                  >
                    اختر الدفعة
                  </Typography>

                  <Autocomplete
                    options={batches}
                    value={selectedBatch}
                    loading={loadingBatches}
                    onChange={(_, value) => setSelectedBatch(value)}
                    isOptionEqualToValue={(option, value) =>
                      option.guid === value.guid
                    }
                    getOptionLabel={(option) => option?.name || ""}
                    popupIcon={<KeyboardArrowDownRoundedIcon />}
                    noOptionsText="لا توجد دفعات"
                    loadingText="جارٍ تحميل الدفعات..."
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="ابحث باسم الدفعة أو الكود"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: COLORS.muted }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <>
                              {loadingBatches ? (
                                <CircularProgress size={18} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                        sx={{
                          direction: "ltr",
                          "& .MuiOutlinedInput-root": {
                            height: 48,
                            borderRadius: 2.5,
                            fontFamily: "Cairo",
                            background: "#fff",
                            "& fieldset": { borderColor: COLORS.border },
                            "&:hover fieldset": { borderColor: COLORS.primary },
                            "&.Mui-focused fieldset": {
                              borderColor: COLORS.primary,
                              borderWidth: 1.5
                            }
                          }
                        }}
                      />
                    )}
                  />
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{ pt: { lg: 2.75 } }}
                >
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={loadReport}
                    disabled={loading || !selectedBatch?.guid}
                    sx={{
                      minWidth: 120,
                      height: 48,
                      px: 2.5,
                      borderRadius: 2.5,
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      background: COLORS.primary,
                      boxShadow: "none",
                      "&:hover": {
                        background: COLORS.primaryDark,
                        boxShadow: "none"
                      }
                    }}
                  >
                    عرض التقرير
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={async () => {
                      await loadBatches();
                      if (selectedBatch?.guid) {
                        await loadReport();
                      }
                    }}
                    disabled={loading || loadingBatches}
                    sx={{
                      minWidth: 108,
                      height: 48,
                      borderRadius: 2.5,
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: COLORS.primary,
                      borderColor: COLORS.border,
                      "&:hover": {
                        borderColor: COLORS.primary,
                        background: COLORS.primarySoft
                      }
                    }}
                  >
                    تحديث
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportCsv}
                    disabled={loading || rows.length === 0}
                    sx={{
                      minWidth: 108,
                      height: 48,
                      borderRadius: 2.5,
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: COLORS.danger,
                      borderColor: "rgba(167,37,42,0.28)",
                      "&:hover": {
                        borderColor: COLORS.danger,
                        background: "rgba(167,37,42,0.04)"
                      }
                    }}
                  >
                    تصدير CSV
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              sx={{ mb: 2.25 }}
            >
              <StatCard
                title="الدفعة المختارة"
                value={selectedBatch?.name || "لم يتم الاختيار"}
                subtitle="اختر دفعة لعرض التقرير"
                icon={<AccountTreeOutlinedIcon />}
                iconBackground={COLORS.primarySoft}
                iconColor={COLORS.primary}
              />

              <StatCard
                title="عدد الفروع"
                value={formatNumber(rows.length)}
                subtitle="الفروع الظاهرة في التقرير"
                icon={<CorporateFareOutlinedIcon />}
                iconBackground={COLORS.warningSoft}
                iconColor={COLORS.warning}
              />

              <StatCard
                title="إجمالي التسجيلات"
                value={formatNumber(visibleReportTotal)}
                subtitle={
                  branchGenderFilter === "male"
                    ? "إجمالي تسجيلات فروع الرجال"
                    : branchGenderFilter === "female"
                      ? "إجمالي تسجيلات فروع النساء"
                      : "إجمالي القيم المسجلة"
                }
                icon={<Groups2OutlinedIcon />}
                iconBackground={COLORS.infoSoft}
                iconColor={COLORS.info}
              />
            </Stack>

            <Paper
              elevation={0}
              sx={{
                mb: 2,
                p: { xs: 1.25, md: 1.5 },
                borderRadius: 3,
                border: `1px solid ${COLORS.border}`,
                background: "#fbfdfc"
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
                spacing={1.25}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: COLORS.text
                    }}
                  >
                    تصفية التقرير حسب نوع الفرع
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,
                      fontFamily: "Cairo",
                      fontSize: 12,
                      color: COLORS.muted
                    }}
                  >
                    اختر عرض جميع الفروع أو فروع الرجال أو فروع النساء فقط
                  </Typography>
                </Box>

                <ToggleButtonGroup
                  exclusive
                  value={branchGenderFilter}
                  onChange={(_, value) => {
                    if (value) {
                      setBranchGenderFilter(value);
                    }
                  }}
                  size="small"
                  sx={{
                    direction: "ltr",
                    alignSelf: { xs: "stretch", md: "center" },
                    "& .MuiToggleButtonGroup-grouped": {
                      minWidth: { xs: 0, sm: 120 },
                      flex: { xs: 1, md: "initial" },
                      px: 2,
                      py: 0.9,
                      borderColor: `${COLORS.border} !important`,
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: COLORS.text,
                      textTransform: "none"
                    },
                    "& .Mui-selected": {
                      color: "#fff !important",
                      backgroundColor: `${COLORS.primary} !important`
                    }
                  }}
                >
                  <ToggleButton value="all">
                    كل الفروع
                  </ToggleButton>

                  <ToggleButton value="male">
                    فروع الرجال
                  </ToggleButton>

                  <ToggleButton value="female">
                    فروع النساء
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${COLORS.border}`,
                overflow: "hidden",
                background: "#fff"
              }}
            >
              <Box
                sx={{
                  px: { xs: 1.5, md: 2 },
                  py: 1.5,
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  gap: 1,
                  background: "#fbfdfc",
                  borderBottom: `1px solid ${COLORS.border}`
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: COLORS.text
                    }}
                  >
                    تفاصيل توزيع الدفعة
                  </Typography>
                  <Typography
                    sx={{
                      mt: 0.2,
                      fontFamily: "Cairo",
                      fontSize: 12,
                      color: COLORS.muted
                    }}
                  >
                    يمكنك البحث والتصفية وترتيب الأعمدة من شريط الأدوات
                  </Typography>
                </Box>

                <Chip
                  size="small"
                  label={
                    branchGenderFilter === "male"
                      ? `${formatNumber(maleBranchFields.length)} فرع رجال`
                      : branchGenderFilter === "female"
                        ? `${formatNumber(femaleBranchFields.length)} فرع نساء`
                        : `${formatNumber(
                            maleBranchFields.length +
                              femaleBranchFields.length
                          )} فرع`
                  }
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    background: COLORS.primarySoft,
                    color: COLORS.primaryDark
                  }}
                />
              </Box>

              <Box sx={{ width: "100%", height: { xs: 590, md: 690 } }}>
                <DataGrid
                  rows={dataGridRows}
                  columns={columns}
                  loading={loading}
                  disableRowSelectionOnClick
                  showToolbar
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                      quickFilterProps: { debounceMs: 300 },
                      csvOptions: {
                        utf8WithBom: true,
                        fileName: "إحصائيات الدفعات"
                      },
                      printOptions: { disableToolbarButton: true }
                    }
                  }}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 25 }
                    }
                  }}
                  pageSizeOptions={[10, 25, 50, 100]}
                  getRowHeight={() => "auto"}
                  estimatedRowHeight={64}
                  columnHeaderHeight={64}
                  localeText={{
                    noRowsLabel: "اختر دفعة لعرض الإحصائيات",
                    noResultsOverlayLabel: "لا توجد نتائج مطابقة",
                    toolbarColumns: "الأعمدة",
                    toolbarFilters: "الفلاتر",
                    toolbarDensity: "الكثافة",
                    toolbarExport: "تصدير",
                    toolbarQuickFilterPlaceholder: "بحث داخل الإحصائيات...",
                    filterPanelAddFilter: "إضافة فلتر",
                    filterPanelOperator: "نوع المقارنة",
                    filterPanelColumns: "العمود",
                    filterPanelInputLabel: "القيمة"
                  }}
                  sx={{
                    border: 0,
                    direction: "ltr",
                    fontFamily: "Cairo",
                    color: COLORS.text,

                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: COLORS.primaryDark,
                      color: "#fff",
                      borderBottom: 0
                    },

                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: COLORS.primaryDark
                    },

                    "& .MuiDataGrid-columnHeaderTitle": {
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      textAlign: "center",
                      whiteSpace: "normal",
                      lineHeight: 1.3
                    },

                    "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus": {
                      outline: "none"
                    },

                    "& .MuiDataGrid-columnSeparator": {
                      color: "rgba(255,255,255,0.28)",
                      visibility: "visible"
                    },

                    "& .MuiDataGrid-cell": {
                      fontFamily: "Cairo",
                      textAlign: "center",
                      justifyContent: "center",
                      alignItems: "center",
                      borderColor: "#edf1ef",
                      px: 1,
                      py: 1.1,
                      whiteSpace: "normal !important",
                      lineHeight: "1.65 !important"
                    },

                    "& .MuiDataGrid-row:nth-of-type(even)": {
                      backgroundColor: "#fafcfb"
                    },

                    "& .MuiDataGrid-row:hover": {
                      backgroundColor: "#f1f8f5"
                    },

                    "& .MuiDataGrid-toolbarContainer": {
                      p: 1.25,
                      gap: 0.5,
                      direction: "ltr",
                      borderBottom: `1px solid ${COLORS.border}`,
                      backgroundColor: "#fff"
                    },

                    "& .MuiDataGrid-toolbarContainer .MuiButton-root": {
                      fontFamily: "Cairo",
                      fontWeight: 800,
                      color: COLORS.primary
                    },

                    "& .MuiInputBase-root": {
                      fontFamily: "Cairo"
                    },

                    "& .MuiDataGrid-footerContainer": {
                      direction: "ltr",
                      borderTop: `1px solid ${COLORS.border}`,
                      background: "#fbfdfc"
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
            </Paper>

            {Object.keys(totals).length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: { xs: 1.5, md: 2 },
                  borderRadius: 3,
                  border: `1px solid ${COLORS.border}`,
                  background:
                    "linear-gradient(180deg,#ffffff 0%,#f8fbf9 100%)"
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        color: COLORS.text
                      }}
                    >
                      إجماليات الأعمدة
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.2,
                        fontFamily: "Cairo",
                        fontSize: 12,
                        color: COLORS.muted
                      }}
                    >
                      ملخص سريع للقيم الرقمية الموجودة في التقرير
                    </Typography>
                  </Box>

                  <Chip
                    label={`الإجمالي العام: ${formatNumber(grandTotal)}`}
                    sx={{
                      fontFamily: "Cairo",
                      fontWeight: 900,
                      color: "#fff",
                      background: COLORS.primary
                    }}
                  />
                </Stack>

                <Divider sx={{ my: 1.5, borderColor: COLORS.border }} />

                <Stack spacing={2}>
                  <Box>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: COLORS.primaryDark
                        }}
                      >
                        فروع الرجال
                      </Typography>

                      <Chip
                        size="small"
                        label={`إجمالي الرجال: ${formatNumber(
                          groupedBranchTotals.maleTotal
                        )}`}
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: COLORS.primaryDark,
                          background: COLORS.primarySoft
                        }}
                      />
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                    >
                      {groupedBranchTotals.male.map(({ field, value }) => (
                        <Chip
                          key={field}
                          label={`${field}: ${formatNumber(value)}`}
                          sx={{
                            height: 34,
                            fontFamily: "Cairo",
                            fontWeight: 800,
                            background: "#fff",
                            color: COLORS.text,
                            border: `1px solid ${COLORS.border}`
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Divider sx={{ borderColor: COLORS.border }} />

                  <Box>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: COLORS.danger
                        }}
                      >
                        فروع النساء
                      </Typography>

                      <Chip
                        size="small"
                        label={`إجمالي النساء: ${formatNumber(
                          groupedBranchTotals.femaleTotal
                        )}`}
                        sx={{
                          fontFamily: "Cairo",
                          fontWeight: 900,
                          color: COLORS.danger,
                          background: "rgba(167,37,42,0.07)"
                        }}
                      />
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                    >
                      {groupedBranchTotals.female.map(({ field, value }) => (
                        <Chip
                          key={field}
                          label={`${field}: ${formatNumber(value)}`}
                          sx={{
                            height: 34,
                            fontFamily: "Cairo",
                            fontWeight: 800,
                            background: "#fff",
                            color: COLORS.text,
                            border: `1px solid ${COLORS.border}`
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default BatchStatistics;