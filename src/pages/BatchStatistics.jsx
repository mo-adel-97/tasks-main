import { designTokens } from '../config/designTokens';
import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  AppBar,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  GlobalStyles,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
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
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CorporateFareOutlinedIcon from "@mui/icons-material/CorporateFareOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CloseIcon from "@mui/icons-material/Close";

import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

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
      p: designTokens.cardPadding,
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
              fontSize: 12,
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
  const theme = useTheme();

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
  );

  const isDesktop = useMediaQuery(
    `(min-width:${DESKTOP_BREAKPOINT}px)`,
    { noSsr: true }
  );

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [detailsRow, setDetailsRow] =
    useState(null);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  const openDetails = (row) => {
    setDetailsRow(row);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsRow(null);
  };

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
                      textAlign: "start",
                      direction: "rtl",
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

  const compactColumns = useMemo(() => {
    const diplomaField =
      diplomaFieldName ||
      visibleFields.find((field) =>
        isDiplomaField(field)
      );

    const totalField =
      visibleFields.find((field) =>
        isTotalField(field)
      ) ||
      originalTotalFieldName;

    const importantFields = [
      diplomaField,
      totalField,
      "__maleTotal",
      "__femaleTotal"
    ].filter(Boolean);

    const fallbackFields =
      visibleFields.filter(
        (field) =>
          !importantFields.includes(field) &&
          !isDiplomaField(field)
      );

    const desiredCount =
      isPhone ? 4 : 5;

    const chosenFields = [
      ...importantFields,
      ...fallbackFields
    ]
      .filter(
        (field, index, array) =>
          field &&
          array.indexOf(field) === index
      )
      .slice(0, desiredCount);

    const getHeaderName = (field) => {
      if (field === diplomaField) {
        return "الدبلوم";
      }

      if (field === "__maleTotal") {
        return isPhone
          ? "رجال"
          : "إجمالي الرجال";
      }

      if (field === "__femaleTotal") {
        return isPhone
          ? "نساء"
          : "إجمالي النساء";
      }

      if (
        field === totalField ||
        isTotalField(field)
      ) {
        return "الإجمالي";
      }

      return field;
    };

    const dataColumns =
      chosenFields.map((field) => {
        const isCalculatedMale =
          field === "__maleTotal";

        const isCalculatedFemale =
          field === "__femaleTotal";

        const isCalculated =
          isCalculatedMale ||
          isCalculatedFemale;

        const sample =
          filteredRows.find(
            (row) =>
              row?.[field] !== null &&
              row?.[field] !== undefined &&
              row?.[field] !== ""
          )?.[field];

        const numeric =
          isCalculated ||
          numberValue(sample) !== null;

        const isDiploma =
          field === diplomaField ||
          isDiplomaField(field);

        return {
          field,
          headerName: getHeaderName(field),
          sortable: false,
          filterable: false,
          disableColumnMenu: true,
          resizable: false,
          align: "center",
          headerAlign: "center",
          type: numeric ? "number" : "string",

          ...(isPhone
            ? {
                flex: isDiploma
                  ? 1.7
                  : 1,
                minWidth: 0
              }
            : {
                flex: isDiploma
                  ? 1.7
                  : 1,
                minWidth: isDiploma
                  ? 165
                  : 95
              }),

          renderCell: (params) => {
            const value =
              params?.row?.[field] ??
              params?.value;

            if (isDiploma) {
              return (
                <Typography
                  component="span"
                  sx={{
                    width: "100%",
                    fontFamily: "Cairo",
                    fontWeight: 800,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem",
                    lineHeight: 1.35,
                    textAlign: "center",
                    whiteSpace: "normal",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical"
                  }}
                >
                  {String(
                    unwrapValue(value) ?? ""
                  )}
                </Typography>
              );
            }

            return (
              <Typography
                component="span"
                sx={{
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone
                    ? "0.75rem"
                    : "0.75rem",
                  color: isCalculated
                    ? COLORS.danger
                    : COLORS.primaryDark
                }}
              >
                {numeric
                  ? formatNumber(value)
                  : String(
                      unwrapValue(value) ?? ""
                    )}
              </Typography>
            );
          }
        };
      });

    return [
      ...dataColumns,
      {
        field: "__details",
        headerName: "",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        resizable: false,
        width: isPhone ? 34 : 44,
        minWidth: isPhone ? 34 : 44,
        maxWidth: isPhone ? 34 : 44,
        align: "center",
        headerAlign: "center",

        renderCell: (params) => (
          <IconButton
            size="small"
            title="عرض التفاصيل"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openDetails(params.row);
            }}
            sx={{
              width: isPhone ? 24 : 30,
              height: isPhone ? 24 : 30,
              p: 0,
              color: COLORS.primary,
              border:
                "1px solid rgba(11,107,70,.28)",
              backgroundColor:
                COLORS.primarySoft
            }}
          >
            <VisibilityOutlinedIcon
              sx={{
                fontSize: isPhone
                  ? 14
                  : 18
              }}
            />
          </IconButton>
        )
      }
    ];
  }, [
    visibleFields,
    filteredRows,
    diplomaFieldName,
    originalTotalFieldName,
    isDiplomaField,
    isTotalField,
    isPhone,
    isTablet
  ]);

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
    isDesktop ? (
    <NavigationShell variant="standard" ><Box
      sx={{
        minHeight: "100vh",
        background: theme.palette.mode === 'dark' ? theme.palette.background.default : COLORS.background,
        direction: "rtl"
      }}
    >
      

      
        <GlobalStyles
          styles={{
            ...(theme.palette.mode === "dark"
              ? {
                  ".sstli-unified-dark-root": {
                    backgroundColor: `${theme.palette.background.default} !important`,
                    color: `${theme.palette.text.primary} !important`
                  },

                  ".sstli-unified-dark-root .MuiPaper-root, .sstli-unified-dark-root .MuiCard-root": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "#67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".sstli-unified-dark-root .MuiPaper-root .MuiPaper-root, .sstli-unified-dark-root .MuiCard-root .MuiPaper-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    borderColor: "#67C99D !important"
                  },

                  ".sstli-unified-dark-root .MuiButton-root, .MuiDialog-paper .MuiButton-root, .MuiPopover-paper .MuiButton-root": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: "#9BE0C1 !important",
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important",
                    minHeight: "34px !important",
                    padding: "5px 10px !important",
                    borderRadius: "9px !important",
                    fontWeight: "800 !important"
                  },
                  ".sstli-unified-dark-root .MuiButton-root:hover, .MuiDialog-paper .MuiButton-root:hover, .MuiPopover-paper .MuiButton-root:hover": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    color: "#C9F2DF !important",
                    borderColor: "#67C99D !important",
                    boxShadow: "0 0 0 1px rgba(103,201,157,.16) !important"
                  },
                  ".sstli-unified-dark-root .MuiButton-root.Mui-disabled, .MuiDialog-paper .MuiButton-root.Mui-disabled": {
                    background: "transparent !important",
                    color: "rgba(155,224,193,.42) !important",
                    borderColor: "rgba(103,201,157,.34) !important",
                    boxShadow: "none !important"
                  },

                  ".sstli-unified-dark-root .MuiIconButton-root, .MuiDialog-paper .MuiIconButton-root": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: "#9BE0C1 !important",
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".sstli-unified-dark-root .MuiIconButton-root:hover, .MuiDialog-paper .MuiIconButton-root:hover": {
                    background: "transparent !important",
                    color: "#C9F2DF !important"
                  },

                  ".sstli-unified-dark-root .MuiChip-root, .MuiDialog-paper .MuiChip-root, .sstli-unified-dark-root .MuiBadge-badge": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: "#9BE0C1 !important",
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".sstli-unified-dark-root .MuiChip-root": {
                    height: "28px !important"
                  },

                  ".sstli-unified-dark-root .MuiToggleButton-root, .MuiDialog-paper .MuiToggleButton-root": {
                    background: "transparent !important",
                    color: "#9BE0C1 !important",
                    borderColor: "#67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiToggleButton-root.Mui-selected, .MuiDialog-paper .MuiToggleButton-root.Mui-selected": {
                    background: "transparent !important",
                    color: "#C9F2DF !important",
                    boxShadow: "inset 0 0 0 1px #67C99D !important"
                  },

                  ".sstli-unified-dark-root .MuiOutlinedInput-root, .MuiDialog-paper .MuiOutlinedInput-root, .MuiPopover-paper .MuiOutlinedInput-root": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    minHeight: "38px !important"
                  },
                  ".sstli-unified-dark-root .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-notchedOutline, .MuiPopover-paper .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#67C99D !important",
                    borderWidth: "1px !important"
                  },
                  ".sstli-unified-dark-root .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, .sstli-unified-dark-root .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#67C99D !important",
                    borderWidth: "1px !important"
                  },
                  ".sstli-unified-dark-root .MuiInputLabel-root, .MuiDialog-paper .MuiInputLabel-root, .MuiPopover-paper .MuiInputLabel-root, .sstli-unified-dark-root .MuiFormHelperText-root, .MuiDialog-paper .MuiFormHelperText-root": {
                    color: `${theme.palette.text.secondary} !important`
                  },
                  ".sstli-unified-dark-root .MuiInputLabel-root.Mui-focused, .MuiDialog-paper .MuiInputLabel-root.Mui-focused": {
                    color: "#9BE0C1 !important"
                  },
                  ".sstli-unified-dark-root .MuiInputAdornment-root, .sstli-unified-dark-root .MuiInputAdornment-root .MuiSvgIcon-root, .sstli-unified-dark-root .MuiSelect-icon, .MuiDialog-paper .MuiSelect-icon": {
                    color: "#9BE0C1 !important"
                  },

                  ".sstli-unified-dark-root .MuiCheckbox-root, .MuiDialog-paper .MuiCheckbox-root": {
                    color: "#67C99D !important"
                  },

                  ".sstli-unified-dark-root .MuiTabs-root, .MuiDialog-paper .MuiTabs-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    border: "1px solid #67C99D !important",
                    borderRadius: "10px !important",
                    minHeight: "38px !important"
                  },
                  ".sstli-unified-dark-root .MuiTab-root, .MuiDialog-paper .MuiTab-root": {
                    background: "transparent !important",
                    color: `${theme.palette.text.secondary} !important`,
                    minHeight: "36px !important"
                  },
                  ".sstli-unified-dark-root .MuiTab-root.Mui-selected, .MuiDialog-paper .MuiTab-root.Mui-selected": {
                    background: "transparent !important",
                    color: "#9BE0C1 !important"
                  },
                  ".sstli-unified-dark-root .MuiTabs-indicator, .MuiDialog-paper .MuiTabs-indicator": {
                    backgroundColor: "#67C99D !important",
                    height: "2px !important"
                  },

                  ".sstli-unified-dark-root .MuiAlert-root, .MuiDialog-paper .MuiAlert-root": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".sstli-unified-dark-root .MuiAlert-icon, .MuiDialog-paper .MuiAlert-icon, .sstli-unified-dark-root .MuiCircularProgress-root, .MuiDialog-paper .MuiCircularProgress-root": {
                    color: "#67C99D !important"
                  },

                  ".sstli-unified-dark-root .MuiDivider-root, .MuiDialog-paper .MuiDivider-root": {
                    borderColor: "#67C99D !important"
                  },

                  ".sstli-unified-dark-root .MuiTableContainer-root": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important",
                    border: "1px solid #67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiTableHead-root .MuiTableCell-root, .MuiDialog-paper .MuiTableHead-root .MuiTableCell-root": {
                    background: `${theme.palette.surfaces?.nested || "#1b3328"} !important`,
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "#67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiTableBody-root .MuiTableCell-root, .MuiDialog-paper .MuiTableBody-root .MuiTableCell-root": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "rgba(103,201,157,.24) !important"
                  },
                  ".sstli-unified-dark-root .MuiTableRow-root:hover .MuiTableCell-root, .MuiDialog-paper .MuiTableRow-root:hover .MuiTableCell-root": {
                    background: `${theme.palette.surfaces?.hover || "#214333"} !important`
                  },

                  ".sstli-unified-dark-root .MuiDataGrid-root": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-columnHeaders, .sstli-unified-dark-root .MuiDataGrid-columnHeader": {
                    background: `${theme.palette.surfaces?.nested || "#1b3328"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "#67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-cell": {
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "rgba(103,201,157,.24) !important"
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-row, .sstli-unified-dark-root .paid-row, .sstli-unified-dark-root .unpaid-row, .sstli-unified-dark-root .critical-row, .sstli-unified-dark-root .warning-row, .sstli-unified-dark-root .stopped-row": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important"
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-row:hover": {
                    background: `${theme.palette.surfaces?.hover || "#214333"} !important`
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-toolbarContainer, .sstli-unified-dark-root .MuiDataGrid-footerContainer": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "#67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-columnSeparator": {
                    color: "rgba(103,201,157,.55) !important"
                  },

                  ".sstli-unified-dark-root .MuiPaginationItem-root": {
                    background: "transparent !important",
                    color: "#9BE0C1 !important",
                    border: "1px solid #67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiPaginationItem-root.Mui-selected": {
                    background: "transparent !important",
                    color: "#C9F2DF !important",
                    boxShadow: "inset 0 0 0 1px #67C99D !important"
                  },

                  ".MuiDialog-paper": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important",
                    boxShadow: "0 18px 50px rgba(2,18,12,.34) !important"
                  },
                  ".MuiDialogTitle-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    borderBottom: "1px solid #67C99D !important"
                  },
                  ".MuiDialogContent-root": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    color: `${theme.palette.text.primary} !important`
                  },
                  ".MuiDialogActions-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    borderTop: "1px solid #67C99D !important"
                  },
                  ".MuiDialog-paper .MuiPaper-root, .MuiDialog-paper .MuiCard-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "#67C99D !important"
                  },

                  ".MuiMenu-paper, .MuiPopover-paper, .MuiAutocomplete-paper, .MuiDataGrid-panel": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important",
                    boxShadow: "0 14px 34px rgba(3,20,13,.28) !important"
                  },
                  ".MuiMenuItem-root, .MuiAutocomplete-option": {
                    background: "transparent !important",
                    color: `${theme.palette.text.primary} !important`
                  },
                  ".MuiMenuItem-root:hover, .MuiAutocomplete-option:hover": {
                    background: `${theme.palette.surfaces?.hover || "#214333"} !important`
                  },
                  ".MuiMenuItem-root.Mui-selected, .MuiAutocomplete-option[aria-selected='true']": {
                    background: "transparent !important",
                    color: "#9BE0C1 !important",
                    borderInlineStart: "2px solid #67C99D !important"
                  },

                  ".MuiAppBar-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    borderBottom: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },

                  ".swal2-popup": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important"
                  },
                  ".swal2-title, .swal2-html-container, .swal2-input-label": {
                    color: `${theme.palette.text.primary} !important`
                  },
                  ".swal2-confirm, .swal2-deny, .swal2-cancel, .sstli-swal-confirm, .sstli-swal-cancel": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: "#9BE0C1 !important",
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".swal2-input, .swal2-textarea, .swal2-select, .sstli-swal-input": {
                    background: "transparent !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".swal2-validation-message": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    color: `${theme.palette.text.primary} !important`
                  },

                  ".sstli-unified-dark-root input[type='date'], .sstli-unified-dark-root input[type='datetime-local'], .sstli-unified-dark-root input[type='time'], .MuiDialog-paper input[type='date'], .MuiDialog-paper input[type='datetime-local'], .MuiDialog-paper input[type='time']": {
                    colorScheme: "dark"
                  }
                }
              : {})
          }}
        />

<PageContainer className="sstli-unified-dark-root"
        component="main"
        sx={{
          minHeight: "100vh",
          
          direction: "rtl",
          ...navigationContentSx
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
                      <TextField InputLabelProps={{ shrink: true }}
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
                        sx={uiLayout.withUiSx({
                          direction: "rtl",
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
                        }, uiLayout.formFieldSx)}
                      />
                    )}
                  />
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={uiLayout.withUiSx({ pt: { lg: 2.75 } }, uiLayout.actionBarSx)}
                >
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={loadReport}
                    disabled={loading || !selectedBatch?.guid}
                    sx={uiLayout.withUiSx({
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
                    }, uiLayout.buttonSx)}
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
                    sx={uiLayout.withUiSx({
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
                    }, uiLayout.buttonSx)}
                  >
                    تحديث
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportCsv}
                    disabled={loading || rows.length === 0}
                    sx={uiLayout.withUiSx({
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
                    }, uiLayout.buttonSx)}
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
                    direction: "rtl",
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

              <Box sx={uiLayout.withUiSx({ width: "100%", height: { xs: 590, md: 690 } }, uiLayout.tableContainerSx)}>
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
                  sx={uiLayout.withUiSx({
                    border: 0,
                    direction: "rtl",
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
                      direction: "rtl",
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
                      direction: "rtl",
                      borderTop: `1px solid ${COLORS.border}`,
                      background: "#fbfdfc"
                    },

                    "& .MuiTablePagination-root": {
                      fontFamily: "Cairo"
                    },

                    "& .MuiDataGrid-overlay": {
                      fontFamily: "Cairo"
                    }
                  }, uiLayout.dataGridSx)}
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
      </PageContainer>
    </Box></NavigationShell>
    ) : (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() =>
          setMobileSidebarOpen(false)
        }><Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        background: theme.palette.mode === 'dark' ? theme.palette.background.default : COLORS.background,
        direction: "rtl"
      }}
    >
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
          }
        }}
      />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          zIndex: 1400,
          background:
            "rgba(255,255,255,.97)",
          backdropFilter: "blur(14px)",
          color: COLORS.text,
          borderBottom:
            `1px solid ${COLORS.border}`,
          direction: "rtl"
        }}
      >
        <Toolbar
          sx={{
            minHeight: {
              xs: "var(--app-header-height, 56px)",
              sm: "var(--app-header-height, 56px)"
            },
            px: {
              xs: 0.75,
              sm: 1
            },
            gap: 0.8
          }}
        >
          <IconButton
            onClick={() =>
              setMobileSidebarOpen(
                (current) => !current
              )
            }
            sx={{
              width: {
                xs: 36,
                sm: 40
              },
              height: {
                xs: 36,
                sm: 40
              },
              color: "#fff",
              background:
                `linear-gradient(135deg,${COLORS.primary},${COLORS.primaryDark})`,
              boxShadow:
                "0 5px 14px rgba(5,117,70,.20)"
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
                sm: "0.78rem"
              },
              color: COLORS.text,
              textAlign: "start"
            }}
          >
            إحصائيات الدفعات
          </Typography>
        </Toolbar>
      </AppBar>

      

      
        <GlobalStyles
          styles={{
            ...(theme.palette.mode === "dark"
              ? {
                  ".sstli-unified-dark-root": {
                    backgroundColor: `${theme.palette.background.default} !important`,
                    color: `${theme.palette.text.primary} !important`
                  },

                  ".sstli-unified-dark-root .MuiPaper-root, .sstli-unified-dark-root .MuiCard-root": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "#67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".sstli-unified-dark-root .MuiPaper-root .MuiPaper-root, .sstli-unified-dark-root .MuiCard-root .MuiPaper-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    borderColor: "#67C99D !important"
                  },

                  ".sstli-unified-dark-root .MuiButton-root, .MuiDialog-paper .MuiButton-root, .MuiPopover-paper .MuiButton-root": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: "#9BE0C1 !important",
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important",
                    minHeight: "34px !important",
                    padding: "5px 10px !important",
                    borderRadius: "9px !important",
                    fontWeight: "800 !important"
                  },
                  ".sstli-unified-dark-root .MuiButton-root:hover, .MuiDialog-paper .MuiButton-root:hover, .MuiPopover-paper .MuiButton-root:hover": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    color: "#C9F2DF !important",
                    borderColor: "#67C99D !important",
                    boxShadow: "0 0 0 1px rgba(103,201,157,.16) !important"
                  },
                  ".sstli-unified-dark-root .MuiButton-root.Mui-disabled, .MuiDialog-paper .MuiButton-root.Mui-disabled": {
                    background: "transparent !important",
                    color: "rgba(155,224,193,.42) !important",
                    borderColor: "rgba(103,201,157,.34) !important",
                    boxShadow: "none !important"
                  },

                  ".sstli-unified-dark-root .MuiIconButton-root, .MuiDialog-paper .MuiIconButton-root": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: "#9BE0C1 !important",
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".sstli-unified-dark-root .MuiIconButton-root:hover, .MuiDialog-paper .MuiIconButton-root:hover": {
                    background: "transparent !important",
                    color: "#C9F2DF !important"
                  },

                  ".sstli-unified-dark-root .MuiChip-root, .MuiDialog-paper .MuiChip-root, .sstli-unified-dark-root .MuiBadge-badge": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: "#9BE0C1 !important",
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".sstli-unified-dark-root .MuiChip-root": {
                    height: "28px !important"
                  },

                  ".sstli-unified-dark-root .MuiToggleButton-root, .MuiDialog-paper .MuiToggleButton-root": {
                    background: "transparent !important",
                    color: "#9BE0C1 !important",
                    borderColor: "#67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiToggleButton-root.Mui-selected, .MuiDialog-paper .MuiToggleButton-root.Mui-selected": {
                    background: "transparent !important",
                    color: "#C9F2DF !important",
                    boxShadow: "inset 0 0 0 1px #67C99D !important"
                  },

                  ".sstli-unified-dark-root .MuiOutlinedInput-root, .MuiDialog-paper .MuiOutlinedInput-root, .MuiPopover-paper .MuiOutlinedInput-root": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    minHeight: "38px !important"
                  },
                  ".sstli-unified-dark-root .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-notchedOutline, .MuiPopover-paper .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#67C99D !important",
                    borderWidth: "1px !important"
                  },
                  ".sstli-unified-dark-root .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, .sstli-unified-dark-root .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, .MuiDialog-paper .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#67C99D !important",
                    borderWidth: "1px !important"
                  },
                  ".sstli-unified-dark-root .MuiInputLabel-root, .MuiDialog-paper .MuiInputLabel-root, .MuiPopover-paper .MuiInputLabel-root, .sstli-unified-dark-root .MuiFormHelperText-root, .MuiDialog-paper .MuiFormHelperText-root": {
                    color: `${theme.palette.text.secondary} !important`
                  },
                  ".sstli-unified-dark-root .MuiInputLabel-root.Mui-focused, .MuiDialog-paper .MuiInputLabel-root.Mui-focused": {
                    color: "#9BE0C1 !important"
                  },
                  ".sstli-unified-dark-root .MuiInputAdornment-root, .sstli-unified-dark-root .MuiInputAdornment-root .MuiSvgIcon-root, .sstli-unified-dark-root .MuiSelect-icon, .MuiDialog-paper .MuiSelect-icon": {
                    color: "#9BE0C1 !important"
                  },

                  ".sstli-unified-dark-root .MuiCheckbox-root, .MuiDialog-paper .MuiCheckbox-root": {
                    color: "#67C99D !important"
                  },

                  ".sstli-unified-dark-root .MuiTabs-root, .MuiDialog-paper .MuiTabs-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    border: "1px solid #67C99D !important",
                    borderRadius: "10px !important",
                    minHeight: "38px !important"
                  },
                  ".sstli-unified-dark-root .MuiTab-root, .MuiDialog-paper .MuiTab-root": {
                    background: "transparent !important",
                    color: `${theme.palette.text.secondary} !important`,
                    minHeight: "36px !important"
                  },
                  ".sstli-unified-dark-root .MuiTab-root.Mui-selected, .MuiDialog-paper .MuiTab-root.Mui-selected": {
                    background: "transparent !important",
                    color: "#9BE0C1 !important"
                  },
                  ".sstli-unified-dark-root .MuiTabs-indicator, .MuiDialog-paper .MuiTabs-indicator": {
                    backgroundColor: "#67C99D !important",
                    height: "2px !important"
                  },

                  ".sstli-unified-dark-root .MuiAlert-root, .MuiDialog-paper .MuiAlert-root": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".sstli-unified-dark-root .MuiAlert-icon, .MuiDialog-paper .MuiAlert-icon, .sstli-unified-dark-root .MuiCircularProgress-root, .MuiDialog-paper .MuiCircularProgress-root": {
                    color: "#67C99D !important"
                  },

                  ".sstli-unified-dark-root .MuiDivider-root, .MuiDialog-paper .MuiDivider-root": {
                    borderColor: "#67C99D !important"
                  },

                  ".sstli-unified-dark-root .MuiTableContainer-root": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important",
                    border: "1px solid #67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiTableHead-root .MuiTableCell-root, .MuiDialog-paper .MuiTableHead-root .MuiTableCell-root": {
                    background: `${theme.palette.surfaces?.nested || "#1b3328"} !important`,
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "#67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiTableBody-root .MuiTableCell-root, .MuiDialog-paper .MuiTableBody-root .MuiTableCell-root": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "rgba(103,201,157,.24) !important"
                  },
                  ".sstli-unified-dark-root .MuiTableRow-root:hover .MuiTableCell-root, .MuiDialog-paper .MuiTableRow-root:hover .MuiTableCell-root": {
                    background: `${theme.palette.surfaces?.hover || "#214333"} !important`
                  },

                  ".sstli-unified-dark-root .MuiDataGrid-root": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-columnHeaders, .sstli-unified-dark-root .MuiDataGrid-columnHeader": {
                    background: `${theme.palette.surfaces?.nested || "#1b3328"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "#67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-cell": {
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "rgba(103,201,157,.24) !important"
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-row, .sstli-unified-dark-root .paid-row, .sstli-unified-dark-root .unpaid-row, .sstli-unified-dark-root .critical-row, .sstli-unified-dark-root .warning-row, .sstli-unified-dark-root .stopped-row": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important"
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-row:hover": {
                    background: `${theme.palette.surfaces?.hover || "#214333"} !important`
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-toolbarContainer, .sstli-unified-dark-root .MuiDataGrid-footerContainer": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "#67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiDataGrid-columnSeparator": {
                    color: "rgba(103,201,157,.55) !important"
                  },

                  ".sstli-unified-dark-root .MuiPaginationItem-root": {
                    background: "transparent !important",
                    color: "#9BE0C1 !important",
                    border: "1px solid #67C99D !important"
                  },
                  ".sstli-unified-dark-root .MuiPaginationItem-root.Mui-selected": {
                    background: "transparent !important",
                    color: "#C9F2DF !important",
                    boxShadow: "inset 0 0 0 1px #67C99D !important"
                  },

                  ".MuiDialog-paper": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important",
                    boxShadow: "0 18px 50px rgba(2,18,12,.34) !important"
                  },
                  ".MuiDialogTitle-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    borderBottom: "1px solid #67C99D !important"
                  },
                  ".MuiDialogContent-root": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    color: `${theme.palette.text.primary} !important`
                  },
                  ".MuiDialogActions-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    borderTop: "1px solid #67C99D !important"
                  },
                  ".MuiDialog-paper .MuiPaper-root, .MuiDialog-paper .MuiCard-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    borderColor: "#67C99D !important"
                  },

                  ".MuiMenu-paper, .MuiPopover-paper, .MuiAutocomplete-paper, .MuiDataGrid-panel": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important",
                    boxShadow: "0 14px 34px rgba(3,20,13,.28) !important"
                  },
                  ".MuiMenuItem-root, .MuiAutocomplete-option": {
                    background: "transparent !important",
                    color: `${theme.palette.text.primary} !important`
                  },
                  ".MuiMenuItem-root:hover, .MuiAutocomplete-option:hover": {
                    background: `${theme.palette.surfaces?.hover || "#214333"} !important`
                  },
                  ".MuiMenuItem-root.Mui-selected, .MuiAutocomplete-option[aria-selected='true']": {
                    background: "transparent !important",
                    color: "#9BE0C1 !important",
                    borderInlineStart: "2px solid #67C99D !important"
                  },

                  ".MuiAppBar-root": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    borderBottom: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },

                  ".swal2-popup": {
                    background: `${theme.palette.surfaces?.card || "#13251d"} !important`,
                    backgroundImage: "none !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important"
                  },
                  ".swal2-title, .swal2-html-container, .swal2-input-label": {
                    color: `${theme.palette.text.primary} !important`
                  },
                  ".swal2-confirm, .swal2-deny, .swal2-cancel, .sstli-swal-confirm, .sstli-swal-cancel": {
                    background: "transparent !important",
                    backgroundColor: "transparent !important",
                    backgroundImage: "none !important",
                    color: "#9BE0C1 !important",
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".swal2-input, .swal2-textarea, .swal2-select, .sstli-swal-input": {
                    background: "transparent !important",
                    color: `${theme.palette.text.primary} !important`,
                    border: "1px solid #67C99D !important",
                    boxShadow: "none !important"
                  },
                  ".swal2-validation-message": {
                    background: `${theme.palette.surfaces?.section || "#172b22"} !important`,
                    color: `${theme.palette.text.primary} !important`
                  },

                  ".sstli-unified-dark-root input[type='date'], .sstli-unified-dark-root input[type='datetime-local'], .sstli-unified-dark-root input[type='time'], .MuiDialog-paper input[type='date'], .MuiDialog-paper input[type='datetime-local'], .MuiDialog-paper input[type='time']": {
                    colorScheme: "dark"
                  }
                }
              : {})
          }}
        />

<PageContainer className="sstli-unified-dark-root"
        component="main"
        sx={{
          mt: {
            xs: "var(--app-header-height, 56px)",
            sm: "var(--app-header-height, 56px)"
          },
          width: "100%",
          maxWidth: "100%",
          minHeight: "100dvh",
          
          
          boxSizing: "border-box",
          overflowX: "hidden",
          ...navigationContentSx
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: isPhone
              ? 1.4
              : 1.8,
            overflow: "hidden",
            border:
              `1px solid ${COLORS.border}`,
            background: "#fff"
          }}
        >
          <Box
            sx={{
              px: isPhone ? 0.75 : 1,
              py: isPhone ? 0.65 : 0.85,
              background:
                "linear-gradient(135deg,#fff 0%,#edf8f3 100%)",
              borderBottom:
                `1px solid ${COLORS.border}`
            }}
          >
            <Stack
              direction="row"
              spacing={0.6}
              alignItems="center"
            >
              <QueryStatsIcon
                sx={{
                  color: COLORS.primary,
                  fontSize: isPhone
                    ? 20
                    : 24
                }}
              />

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontFamily: "Cairo",
                    fontWeight: 950,
                    color: COLORS.primaryDark,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.82rem"
                  }}
                >
                  إحصائيات الدفعات
                </Typography>

                {!isPhone && (
                  <Typography
                    sx={{
                      mt: 0.15,
                      fontFamily: "Cairo",
                      color: COLORS.muted,
                      fontSize: "0.75rem"
                    }}
                  >
                    عرض توزيع التسجيلات على الفروع حسب الدفعة
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: isPhone
                ? 0.6
                : 0.85
            }}
          >
            <Paper
              elevation={0}
              sx={{
                mb: isPhone
                  ? 0.6
                  : 0.8,
                p: isPhone
                  ? 0.55
                  : 0.75,
                borderRadius: 1.4,
                border:
                  `1px solid ${COLORS.border}`,
                background: "#fbfdfc"
              }}
            >
              <Box
                sx={uiLayout.withUiSx({
                  display: "grid",
                  gridTemplateColumns: isPhone
                    ? "repeat(2,minmax(0,1fr))"
                    : "repeat(4,minmax(0,1fr))",
                  gap: isPhone
                    ? 0.45
                    : 0.6,

                  "& .MuiInputBase-root": {
                    minHeight: isPhone
                      ? 31
                      : 35,
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem"
                  },

                  "& .MuiButton-root": {
                    minHeight: isPhone
                      ? 30
                      : 34,
                    minWidth: 0,
                    px: isPhone
                      ? 0.35
                      : 0.6,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem"
                  },

                  "& .MuiSvgIcon-root": {
                    fontSize: isPhone
                      ? 14
                      : 16
                  }
                }, uiLayout.filterBarSx)}
              >
                <Autocomplete
                  options={batches}
                  value={selectedBatch}
                  loading={loadingBatches}
                  onChange={(_, value) =>
                    setSelectedBatch(value)
                  }
                  isOptionEqualToValue={(
                    option,
                    value
                  ) =>
                    option.guid === value.guid
                  }
                  getOptionLabel={(option) =>
                    option?.name || ""
                  }
                  popupIcon={
                    <KeyboardArrowDownRoundedIcon />
                  }
                  noOptionsText="لا توجد دفعات"
                  loadingText="جارٍ تحميل الدفعات..."
                  sx={{
                    gridColumn: "1 / -1"
                  }}
                  renderInput={(params) => (
                    <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                      {...params}
                      size="small"
                      placeholder="اختر الدفعة"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment
                            position="start"
                          >
                            <SearchIcon
                              sx={{
                                color:
                                  COLORS.muted
                              }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <>
                            {loadingBatches ? (
                              <CircularProgress
                                size={16}
                              />
                            ) : null}
                            {
                              params
                                .InputProps
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
                  onClick={loadReport}
                  disabled={
                    loading ||
                    !selectedBatch?.guid
                  }
                  sx={uiLayout.withUiSx({
                    background:
                      COLORS.primary
                  }, uiLayout.buttonSx)}
                >
                  عرض
                </Button>

                <Button sx={uiLayout.buttonSx}
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={async () => {
                    await loadBatches();

                    if (
                      selectedBatch?.guid
                    ) {
                      await loadReport();
                    }
                  }}
                  disabled={
                    loading ||
                    loadingBatches
                  }
                >
                  تحديث
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <FileDownloadIcon />
                  }
                  onClick={exportCsv}
                  disabled={
                    loading ||
                    rows.length === 0
                  }
                  sx={uiLayout.withUiSx({
                    color: COLORS.danger,
                    borderColor:
                      "rgba(167,37,42,.28)",
                    gridColumn: isPhone
                      ? "1 / -1"
                      : "span 2"
                  }, uiLayout.buttonSx)}
                >
                  تصدير CSV
                </Button>
              </Box>
            </Paper>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3,minmax(0,1fr))",
                gap: isPhone
                  ? 0.3
                  : 0.45,
                mb: isPhone
                  ? 0.6
                  : 0.8
              }}
            >
              <Chip
                label={`الفروع: ${formatNumber(rows.length)}`}
                sx={{
                  height: isPhone
                    ? 25
                    : 29,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone
                    ? "0.75rem"
                    : "0.75rem",
                  background:
                    COLORS.primarySoft,
                  color:
                    COLORS.primaryDark,
                  "& .MuiChip-label": {
                    px: isPhone
                      ? 0.25
                      : 0.45
                  }
                }}
              />

              <Chip
                label={`رجال: ${formatNumber(groupedBranchTotals.maleTotal)}`}
                sx={{
                  height: isPhone
                    ? 25
                    : 29,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone
                    ? "0.75rem"
                    : "0.75rem",
                  background:
                    COLORS.infoSoft,
                  color: COLORS.info,
                  "& .MuiChip-label": {
                    px: isPhone
                      ? 0.25
                      : 0.45
                  }
                }}
              />

              <Chip
                label={`نساء: ${formatNumber(groupedBranchTotals.femaleTotal)}`}
                sx={{
                  height: isPhone
                    ? 25
                    : 29,
                  fontFamily: "Cairo",
                  fontWeight: 900,
                  fontSize: isPhone
                    ? "0.75rem"
                    : "0.75rem",
                  background:
                    "rgba(167,37,42,.07)",
                  color: COLORS.danger,
                  "& .MuiChip-label": {
                    px: isPhone
                      ? 0.25
                      : 0.45
                  }
                }}
              />
            </Box>

            <Paper
              elevation={0}
              sx={{
                mb: isPhone
                  ? 0.6
                  : 0.8,
                p: isPhone
                  ? 0.5
                  : 0.7,
                borderRadius: 1.4,
                border:
                  `1px solid ${COLORS.border}`,
                background: "#fbfdfc"
              }}
            >
              <ToggleButtonGroup
                exclusive
                value={branchGenderFilter}
                onChange={(_, value) => {
                  if (value) {
                    setBranchGenderFilter(
                      value
                    );
                  }
                }}
                size="small"
                fullWidth
                sx={{
                  width: "100%",
                  direction: "rtl",

                  "& .MuiToggleButtonGroup-grouped": {
                    flex: 1,
                    minWidth: 0,
                    px: isPhone
                      ? 0.25
                      : 0.5,
                    py: isPhone
                      ? 0.5
                      : 0.65,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem",
                    borderColor:
                      `${COLORS.border} !important`
                  },

                  "& .Mui-selected": {
                    color:
                      "#fff !important",
                    backgroundColor:
                      `${COLORS.primary} !important`
                  }
                }}
              >
                <ToggleButton value="all">
                  الكل
                </ToggleButton>

                <ToggleButton value="male">
                  رجال
                </ToggleButton>

                <ToggleButton value="female">
                  نساء
                </ToggleButton>
              </ToggleButtonGroup>
            </Paper>

            <Box
              sx={uiLayout.withUiSx({
                width: "100%",
                height: isPhone
                  ? "calc(100dvh - 375px)"
                  : "calc(100dvh - 340px)",
                minHeight: isPhone
                  ? 330
                  : 440,
                border:
                  `1px solid ${COLORS.border}`,
                borderRadius: 1.4,
                overflow: "hidden"
              }, uiLayout.tableContainerSx)}
            >
              <DataGrid
                rows={dataGridRows}
                columns={compactColumns}
                loading={loading}
                disableRowSelectionOnClick
                disableColumnMenu
                rowHeight={
                  isPhone ? 42 : 48
                }
                columnHeaderHeight={
                  isPhone ? 38 : 50
                }
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
                  50
                ]}
                localeText={{
                  noRowsLabel:
                    "اختر دفعة لعرض الإحصائيات",
                  noResultsOverlayLabel:
                    "لا توجد نتائج مطابقة"
                }}
                sx={uiLayout.withUiSx({
                  border: 0,
                  direction: "rtl",
                  fontFamily: "Cairo",
                  color: COLORS.text,

                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor:
                      COLORS.primaryDark,
                    color: "#fff",
                    fontWeight: 900
                  },

                  "& .MuiDataGrid-columnHeader": {
                    backgroundColor:
                      COLORS.primaryDark,
                    px: isPhone
                      ? 0.05
                      : 0.25
                  },

                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem",
                    textAlign: "center",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  },

                  "& .MuiDataGrid-columnHeaderTitleContainer": {
                    justifyContent: "center",
                    minWidth: 0,
                    overflow: "hidden"
                  },

                  "& .MuiDataGrid-menuIcon, & .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-sortIcon": {
                    display: "none"
                  },

                  "& .MuiDataGrid-columnSeparator": {
                    display: "none"
                  },

                  "& .MuiDataGrid-cell": {
                    fontFamily: "Cairo",
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem",
                    textAlign: "center",
                    justifyContent: "center",
                    px: isPhone
                      ? 0.03
                      : 0.28,
                    borderColor:
                      "#edf1ef"
                  },

                  "& .MuiDataGrid-row:nth-of-type(even)": {
                    backgroundColor:
                      "#fafcfb"
                  },

                  "& .MuiDataGrid-main": {
                    overflowX: "hidden"
                  },

                  "& .MuiDataGrid-virtualScroller": {
                    overflowX:
                      "auto"
                  },

                  "& .MuiDataGrid-scrollbar--horizontal": {
                    display: "block"
                  }
                }, uiLayout.dataGridSx)}
              />
            </Box>

            {Object.keys(totals).length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  mt: isPhone ? 0.7 : 1,
                  p: isPhone ? 0.7 : 1,
                  borderRadius: 1.6,
                  border:
                    `1px solid ${COLORS.border}`,
                  background:
                    "linear-gradient(180deg,#ffffff 0%,#f8fbf9 100%)",
                  overflow: "hidden"
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={0.6}
                  sx={{
                    mb: isPhone ? 0.65 : 0.9
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 950,
                        color: COLORS.primaryDark,
                        fontSize: isPhone
                          ? "0.75rem"
                          : "0.76rem"
                      }}
                    >
                      إجماليات الدفعة
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.1,
                        fontFamily: "Cairo",
                        color: COLORS.muted,
                        fontSize: isPhone
                          ? "0.75rem"
                          : "0.75rem"
                      }}
                    >
                      ملخص سريع لأهم أرقام الدفعة الحالية
                    </Typography>
                  </Box>

                  <Chip
                    label={`الإجمالي: ${formatNumber(visibleReportTotal)}`}
                    sx={{
                      height: isPhone ? 27 : 31,
                      fontFamily: "Cairo",
                      fontWeight: 950,
                      fontSize: isPhone
                        ? "0.75rem"
                        : "0.75rem",
                      color: "#fff",
                      background: COLORS.primary,
                      "& .MuiChip-label": {
                        px: isPhone ? 0.55 : 0.8
                      }
                    }}
                  />
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isPhone
                      ? "repeat(2,minmax(0,1fr))"
                      : "repeat(3,minmax(0,1fr))",
                    gap: isPhone ? 0.45 : 0.65
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: isPhone ? 0.6 : 0.8,
                      borderRadius: 1.4,
                      border:
                        `1px solid ${COLORS.border}`,
                      background: COLORS.infoSoft
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        color: COLORS.info,
                        fontSize: isPhone
                          ? "0.75rem"
                          : "0.75rem"
                      }}
                    >
                      إجمالي الرجال
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontFamily: "Cairo",
                        fontWeight: 950,
                        color: COLORS.info,
                        fontSize: isPhone
                          ? "0.75rem"
                          : "0.9rem"
                      }}
                    >
                      {formatNumber(
                        groupedBranchTotals.maleTotal
                      )}
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: isPhone ? 0.6 : 0.8,
                      borderRadius: 1.4,
                      border:
                        `1px solid rgba(167,37,42,.14)`,
                      background:
                        "rgba(167,37,42,.06)"
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        color: COLORS.danger,
                        fontSize: isPhone
                          ? "0.75rem"
                          : "0.75rem"
                      }}
                    >
                      إجمالي النساء
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontFamily: "Cairo",
                        fontWeight: 950,
                        color: COLORS.danger,
                        fontSize: isPhone
                          ? "0.75rem"
                          : "0.9rem"
                      }}
                    >
                      {formatNumber(
                        groupedBranchTotals.femaleTotal
                      )}
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: isPhone ? 0.6 : 0.8,
                      borderRadius: 1.4,
                      border:
                        `1px solid ${COLORS.border}`,
                      background: COLORS.primarySoft,
                      gridColumn: isPhone
                        ? "1 / -1"
                        : "auto"
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Cairo",
                        fontWeight: 900,
                        color: COLORS.primaryDark,
                        fontSize: isPhone
                          ? "0.75rem"
                          : "0.75rem"
                      }}
                    >
                      عدد الفروع
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontFamily: "Cairo",
                        fontWeight: 950,
                        color: COLORS.primaryDark,
                        fontSize: isPhone
                          ? "0.75rem"
                          : "0.9rem"
                      }}
                    >
                      {formatNumber(
                        branchGenderFilter === "male"
                          ? maleBranchFields.length
                          : branchGenderFilter === "female"
                            ? femaleBranchFields.length
                            : maleBranchFields.length +
                              femaleBranchFields.length
                      )}
                    </Typography>
                  </Paper>
                </Box>

                <Divider
                  sx={{
                    my: isPhone ? 0.65 : 0.9,
                    borderColor: COLORS.border
                  }}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: isPhone
                      ? "repeat(2,minmax(0,1fr))"
                      : "repeat(3,minmax(0,1fr))",
                    gap: isPhone ? 0.32 : 0.55
                  }}
                >
                  {(branchGenderFilter === "female"
                    ? groupedBranchTotals.female
                    : branchGenderFilter === "male"
                      ? groupedBranchTotals.male
                      : [
                          ...groupedBranchTotals.male,
                          ...groupedBranchTotals.female
                        ]
                  )
                    .map(({ field, value }) => (
                      <Box
                        key={field}
                        sx={{
                          minWidth: 0,
                          px: isPhone ? 0.45 : 0.7,
                          py: isPhone ? 0.38 : 0.6,
                          borderRadius: 1.1,
                          border:
                            `1px solid ${COLORS.border}`,
                          background: "#fff"
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Cairo",
                            fontWeight: 800,
                            color: COLORS.muted,
                            fontSize: isPhone
                              ? "0.75rem"
                              : "0.75rem",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {field}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.12,
                            fontFamily: "Cairo",
                            fontWeight: 950,
                            color: COLORS.text,
                            fontSize: isPhone
                              ? "0.75rem"
                              : "0.75rem"
                          }}
                        >
                          {formatNumber(value)}
                        </Typography>
                      </Box>
                    ))}
                </Box>


              </Paper>
            )}

            <Dialog sx={uiLayout.dialogLayoutSx}
              open={detailsOpen}
              onClose={closeDetails}
              fullWidth
              maxWidth="lg"
              dir="rtl"
              PaperProps={{
                sx: {
                  width: isPhone
                    ? "94vw"
                    : "90vw",
                  maxWidth: isPhone
                    ? "94vw"
                    : "1050px",
                  maxHeight: isPhone
                    ? "86dvh"
                    : "84dvh",
                  m: 1,
                  borderRadius: 2.5,
                  overflow: "hidden"
                }
              }}
            >
              <DialogTitle
                sx={{
                  px: isPhone
                    ? 1
                    : 1.5,
                  py: isPhone
                    ? 0.8
                    : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 0.6,
                  fontFamily: "Cairo",
                  fontWeight: 950,
                  color:
                    COLORS.primaryDark,
                  fontSize: isPhone
                    ? "0.76rem"
                    : "0.94rem"
                }}
              >
                <span>
                  تفاصيل توزيع الدفعة
                </span>

                <IconButton
                  onClick={closeDetails}
                  sx={{
                    width: isPhone
                      ? 30
                      : 34,
                    height: isPhone
                      ? 30
                      : 34,
                    color: COLORS.danger
                  }}
                >
                  <CloseIcon
                    sx={{
                      fontSize: isPhone
                        ? 18
                        : 20
                    }}
                  />
                </IconButton>
              </DialogTitle>

              <DialogContent
                dividers
                sx={{
                  p: isPhone
                    ? 0.8
                    : 1.1,
                  overflowY: "auto"
                }}
              >
                {detailsRow ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        isPhone
                          ? "repeat(2,minmax(0,1fr))"
                          : "repeat(3,minmax(0,1fr))",
                      gap: isPhone
                        ? 0.45
                        : 0.65
                    }}
                  >
                    {[
                      ...allFields,
                      "__maleTotal",
                      "__femaleTotal"
                    ]
                      .filter(
                        (field, index, array) =>
                          field &&
                          array.indexOf(field) === index
                      )
                      .map((field) => {
                        const rawValue =
                          detailsRow?.[field];

                        const numeric =
                          field === "__maleTotal" ||
                          field === "__femaleTotal" ||
                          numberValue(
                            rawValue
                          ) !== null;

                        const label =
                          field === "__maleTotal"
                            ? "إجمالي الرجال"
                            : field === "__femaleTotal"
                              ? "إجمالي النساء"
                              : field;

                        return (
                          <Box
                            key={field}
                            sx={{
                              minWidth: 0,
                              p: isPhone
                                ? 0.55
                                : 0.72,
                              border:
                                `1px solid ${COLORS.border}`,
                              borderRadius: 1.3,
                              backgroundColor:
                                "#fbfdfc"
                            }}
                          >
                            <Typography
                              sx={{
                                mb: 0.2,
                                fontFamily:
                                  "Cairo",
                                fontWeight: 900,
                                color:
                                  COLORS.muted,
                                fontSize:
                                  isPhone
                                    ? "0.75rem"
                                    : "0.75rem"
                              }}
                            >
                              {label}
                            </Typography>

                            <Typography
                              sx={{
                                fontFamily:
                                  "Cairo",
                                fontWeight: 800,
                                color:
                                  COLORS.text,
                                fontSize:
                                  isPhone
                                    ? "0.75rem"
                                    : "0.75rem",
                                wordBreak:
                                  "break-word"
                              }}
                            >
                              {numeric
                                ? formatNumber(
                                    rawValue
                                  )
                                : String(
                                    unwrapValue(
                                      rawValue
                                    ) ?? "-"
                                  )}
                            </Typography>
                          </Box>
                        );
                      })}
                  </Box>
                ) : null}
              </DialogContent>

              <DialogActions
                sx={uiLayout.withUiSx({
                  px: isPhone
                    ? 1
                    : 1.5,
                  py: isPhone
                    ? 0.7
                    : 1
                }, uiLayout.dialogActionsSx)}
              >
                <Button
                  variant="contained"
                  onClick={closeDetails}
                  sx={uiLayout.withUiSx({
                    backgroundColor:
                      COLORS.primary,
                    fontFamily: "Cairo",
                    fontWeight: 900,
                    fontSize: isPhone
                      ? "0.75rem"
                      : "0.75rem"
                  }, uiLayout.buttonSx)}
                >
                  إغلاق
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Paper>
      </PageContainer>
    </Box></NavigationShell>
    )
  );
};

export default BatchStatistics;