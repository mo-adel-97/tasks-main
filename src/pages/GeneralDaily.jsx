import { adaptiveInlineStyle } from '../config/themeColors';
import PageContainer from '../components/common/PageContainer';
import * as uiLayout from '../components/common/uiLayout';
import './rtl-forms-fix.css';
import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  Alert,
  AppBar,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TodayIcon from "@mui/icons-material/Today";






const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com";

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";
const textColor = "#1f2d3d";
const mutedColor = "#6f8a81";
const borderColor = "#dfe9e4";

const localDate = () => {
  const d = new Date();
  const offset =
    d.getTimezoneOffset();

  return new Date(
    d.getTime() - offset * 60000
  )
    .toISOString()
    .slice(0, 10);
};

const currentUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("user") ||
        "{}"
    );
  } catch {
    return {};
  }
};

const getUserGuid = (user) =>
  user?.userGuid ||
  user?.guid ||
  user?.Guid ||
  user?.USER_GUID ||
  "";

const numberValue = (value) => {
  const n =
    Number(value || 0);

  return Number.isFinite(n)
    ? n
    : 0;
};

const money = (value) =>
  numberValue(value).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );

const shortMoney = (value) =>
  numberValue(value).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  );

const dateOnly = (value) => {
  if (!value) {
    return "";
  }

  const text =
    String(value);

  if (
    /^\d{4}-\d{2}-\d{2}/.test(text)
  ) {
    const [y, m, d] =
      text
        .slice(0, 10)
        .split("-");

    return `${d}/${m}/${y}`;
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return text;
  }

  return parsed.toLocaleDateString(
    "en-GB"
  );
};

const csvCell = (value) =>
  `"${String(value ?? "")
    .replace(/"/g, '""')}"`;

const FILTER_FIELDS = [
  {
    key: "dayDate",
    label: "تاريخ القيد",
    formatter: dateOnly
  },
  {
    key: "code",
    label: "رقم القيد"
  },
  {
    key: "name",
    label: "نوع المستند"
  },
  {
    key: "actionCode",
    label: "رقم المستند"
  },
  {
    key: "accountName",
    label: "الحساب"
  },
  {
    key: "maden",
    label: "مدين",
    formatter: shortMoney
  },
  {
    key: "daen",
    label: "دائن",
    formatter: shortMoney
  },
  {
    key: "notes",
    label: "البيان"
  },
  {
    key: "centerName",
    label: "مركز التكلفة"
  },
  {
    key: "branchName",
    label: "الفرع"
  }
];

const createEmptyFilters = () =>
  FILTER_FIELDS.reduce(
    (result, field) => {
      result[field.key] = [];
      return result;
    },
    {}
  );

const selectMenuProps = {
  PaperProps: {
    sx: {
      maxHeight: 330,
      borderRadius: 2,
      mt: 0.4
    }
  },

  MenuListProps: {
    dense: true
  }
};

const getFilterText =
  (row, field) => {
    const value =
      row?.[field.key];

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    if (field.formatter) {
      return String(
        field.formatter(value)
      );
    }

    return String(value).trim();
  };

export default function GeneralDaily() {
  const theme =
    useTheme();

  const isDesktop =
    useMediaQuery(
      `(min-width:${DESKTOP_BREAKPOINT}px)`,
      { noSsr: true }
    );

  const isPhone =
    useMediaQuery(
      theme.breakpoints.down("sm")
    );

  const isTablet =
    useMediaQuery(
      `(min-width:600px) and (max-width:${DESKTOP_BREAKPOINT - 0.05}px)`
    );

  const user =
    useMemo(
      () => currentUser(),
      []
    );

  const userGuid =
    useMemo(
      () =>
        String(
          getUserGuid(user)
        ).trim(),
      [user]
    );

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen
  ] = useState(false);

  const [fromDate, setFromDate] =
    useState(localDate());

  const [toDate, setToDate] =
    useState(localDate());

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    permissionLoading,
    setPermissionLoading
  ] = useState(true);

  const [
    authorized,
    setAuthorized
  ] = useState(false);

  const [
    gridSearch,
    setGridSearch
  ] = useState("");

  const [
    advancedFiltersOpen,
    setAdvancedFiltersOpen
  ] = useState(false);

  const [
    advancedFilters,
    setAdvancedFilters
  ] = useState(
    createEmptyFilters
  );

  const [
    detailRow,
    setDetailRow
  ] = useState(null);

  const [
    detailOpen,
    setDetailOpen
  ] = useState(false);

  const activeRequestRef =
    useRef(null);

  const requestSequenceRef =
    useRef(0);

  // =========================================================
  // Permission
  // =========================================================
  useEffect(() => {
    let alive = true;

    const run =
      async () => {
        if (!userGuid) {
          if (alive) {
            setAuthorized(false);
            setPermissionLoading(
              false
            );
          }

          return;
        }

        try {
          setPermissionLoading(
            true
          );

          const response =
            await fetch(
              `${API_BASE_URL}/api/user-permissions/${encodeURIComponent(
                userGuid
              )}`,
              {
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json"
                }
              }
            );

          const result =
            await response
              .json()
              .catch(() => null);

          if (!response.ok) {
            throw new Error(
              result?.message ||
                "تعذر تحميل الصلاحيات"
            );
          }

          const generalAccounts =
            result?.data
              ?.generalAccounts ||
            {};

          const screens =
            generalAccounts
              ?.screens ||
            {};

          if (alive) {
            setAuthorized(
              generalAccounts
                ?.canView === true &&
                screens
                  ?.generalDaily ===
                  true
            );
          }
        } catch {
          if (alive) {
            setAuthorized(false);
          }
        } finally {
          if (alive) {
            setPermissionLoading(
              false
            );
          }
        }
      };

    run();

    return () => {
      alive = false;
    };
  }, [userGuid]);

  // =========================================================
  // Load daily
  // =========================================================
  const loadData =
    useCallback(async () => {
      if (
        !authorized ||
        !userGuid
      ) {
        return;
      }

      if (
        !fromDate ||
        !toDate
      ) {
        setError(
          "برجاء اختيار الفترة من وإلى"
        );
        return;
      }

      if (
        fromDate > toDate
      ) {
        setError(
          "تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية"
        );
        return;
      }

      if (
        activeRequestRef.current
      ) {
        activeRequestRef.current
          .abort();
      }

      const controller =
        new AbortController();

      activeRequestRef.current =
        controller;

      const requestId =
        ++requestSequenceRef.current;

      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams({
            userGuid,
            fromDate,
            toDate
          });

        const response =
          await fetch(
            `${API_BASE_URL}/api/general-daily?${params.toString()}`,
            {
              cache: "no-store",
              headers: {
                Accept:
                  "application/json"
              },
              signal:
                controller.signal
            }
          );

        const result =
          await response
            .json()
            .catch(() => null);

        if (
          requestId !==
          requestSequenceRef.current
        ) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            result?.message ||
              result?.error ||
              "تعذر تحميل اليومية العامة"
          );
        }

        setRows(
          Array.isArray(
            result?.data
          )
            ? result.data
            : []
        );
      } catch (e) {
        if (
          e?.name ===
          "AbortError"
        ) {
          return;
        }

        if (
          requestId !==
          requestSequenceRef.current
        ) {
          return;
        }

        setRows([]);

        setError(
          e?.message ||
            "تعذر تحميل اليومية العامة"
        );
      } finally {
        if (
          requestId ===
          requestSequenceRef.current
        ) {
          setLoading(false);

          if (
            activeRequestRef
              .current ===
            controller
          ) {
            activeRequestRef.current =
              null;
          }
        }
      }
    }, [
      authorized,
      userGuid,
      fromDate,
      toDate
    ]);

  useEffect(() => {
    return () => {
      activeRequestRef
        .current
        ?.abort?.();
    };
  }, []);

  // =========================================================
  // High-performance filters
  // =========================================================
  // مهم جداً:
  // 1) نبني القيم المميزة مرة واحدة فقط بعد تحميل الداتا.
  // 2) لا نرسم آلاف MenuItem عند فتح الفلتر.
  //    الـ Autocomplete يعرض أول 100 نتيجة فقط ويتيح البحث في الباقي.
  // 3) نستخدم deferred values حتى تظل الواجهة مستجيبة أثناء الفلترة.
  const filterOptions =
    useMemo(() => {
      const sets = {};

      FILTER_FIELDS.forEach((field) => {
        sets[field.key] = new Set();
      });

      // One pass على الصفوف بدلاً من map/filter/set لكل عمود.
      for (const row of rows) {
        for (const field of FILTER_FIELDS) {
          const value =
            getFilterText(
              row,
              field
            );

          if (value) {
            sets[field.key].add(
              value
            );
          }
        }
      }

      const collator =
        new Intl.Collator(
          "ar",
          {
            numeric: true,
            sensitivity: "base"
          }
        );

      const result = {};

      FILTER_FIELDS.forEach(
        (field) => {
          result[field.key] =
            Array.from(
              sets[field.key]
            ).sort(
              collator.compare
            );
        }
      );

      return result;
    }, [rows]);

  const deferredGridSearch =
    useDeferredValue(
      gridSearch
    );

  const deferredAdvancedFilters =
    useDeferredValue(
      advancedFilters
    );

  // Cache للنصوص المستخدمة في البحث والفلترة.
  // يتم بناؤه مرة واحدة فقط عند تغير rows بدلاً من إعادة
  // dateOnly / shortMoney / String لكل صف مع كل ضغطة فلتر.
  const preparedRows =
    useMemo(() => {
      return rows.map((row) => {
        const texts = {};
        const searchParts = [];

        for (
          const field of FILTER_FIELDS
        ) {
          const value =
            getFilterText(
              row,
              field
            );

          texts[field.key] =
            value;

          if (value) {
            searchParts.push(
              value.toLowerCase()
            );
          }
        }

        return {
          row,
          texts,
          searchText:
            searchParts.join(
              "\u0001"
            )
        };
      });
    }, [rows]);

  const activeFilterCount =
    useMemo(
      () =>
        Object.values(
          advancedFilters
        ).filter(
          (value) =>
            Array.isArray(value) &&
            value.length > 0
        ).length,
      [advancedFilters]
    );

  const setMultiFilter =
    useCallback(
      (key, value) => {
        setAdvancedFilters(
          (current) => ({
            ...current,
            [key]:
              Array.isArray(value)
                ? value
                : []
          })
        );
      },
      []
    );

  const filteredRows =
    useMemo(() => {
      const q =
        deferredGridSearch
          .trim()
          .toLowerCase();

      // تحويل القيم المحددة إلى Set يجعل lookup أسرع بكثير
      // من selected.includes(...) داخل كل صف.
      const selectedSets = {};

      FILTER_FIELDS.forEach(
        (field) => {
          const selected =
            deferredAdvancedFilters[
              field.key
            ] || [];

          if (
            selected.length > 0
          ) {
            selectedSets[
              field.key
            ] = new Set(
              selected
            );
          }
        }
      );

      const activeKeys =
        Object.keys(
          selectedSets
        );

      const result = [];

      for (
        const item of preparedRows
      ) {
        if (
          q &&
          !item.searchText.includes(
            q
          )
        ) {
          continue;
        }

        let matches = true;

        for (
          const key of activeKeys
        ) {
          if (
            !selectedSets[
              key
            ].has(
              item.texts[
                key
              ]
            )
          ) {
            matches = false;
            break;
          }
        }

        if (matches) {
          result.push(
            item.row
          );
        }
      }

      return result;
    }, [
      preparedRows,
      deferredGridSearch,
      deferredAdvancedFilters
    ]);

  // =========================================================
  // Totals EXACTLY on visible/filter rows
  // like Desktop ColumnFilterChanged
  // =========================================================
  const totals =
    useMemo(() => {
      return filteredRows.reduce(
        (acc, row) => {
          acc.maden +=
            numberValue(
              row.maden
            );

          acc.daen +=
            numberValue(
              row.daen
            );

          return acc;
        },
        {
          maden: 0,
          daen: 0
        }
      );
    }, [filteredRows]);

  const difference =
    totals.maden -
    totals.daen;

  const exportCsv = () => {
    if (
      filteredRows.length === 0
    ) {
      return;
    }

    const header = [
      "تاريخ القيد",
      "رقم القيد",
      "نوع المستند",
      "رقم المستند",
      "الحساب",
      "مدين",
      "دائن",
      "بيان",
      "مركز التكلفة",
      "الفرع"
    ];

    const lines =
      filteredRows.map(
        (row) =>
          [
            dateOnly(
              row.dayDate
            ),
            row.code,
            row.name,
            row.actionCode,
            row.accountName,
            row.maden,
            row.daen,
            row.notes,
            row.centerName,
            row.branchName
          ]
            .map(csvCell)
            .join(",")
      );

    const csv =
      "\uFEFF" +
      [
        header
          .map(csvCell)
          .join(","),
        ...lines
      ].join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;
    a.download =
      `اليومية-العامة-${fromDate}-${toDate}.csv`;

    a.click();

    URL.revokeObjectURL(
      url
    );
  };

  const desktopColumns =
    useMemo(
      () => [
        {
          field: "dayDate",
          headerName:
            "تاريخ القيد",
          flex: 0.82,
          minWidth: 82,
          align: "center",
          headerAlign:
            "center",
          valueFormatter:
            (params) =>
              dateOnly(
                params.value
              )
        },
        {
          field: "code",
          headerName:
            "رقم القيد",
          flex: 0.68,
          minWidth: 68,
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "name",
          headerName:
            "نوع المستند",
          flex: 0.95,
          minWidth: 86
        },
        {
          field: "actionCode",
          headerName:
            "رقم المستند",
          flex: 0.78,
          minWidth: 74,
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "accountName",
          headerName:
            "الحساب",
          flex: 1.35,
          minWidth: 115
        },
        {
          field: "maden",
          headerName:
            "مدين",
          flex: 0.64,
          minWidth: 64,
          align: "center",
          headerAlign:
            "center",
          valueFormatter:
            (params) =>
              shortMoney(
                params.value
              )
        },
        {
          field: "daen",
          headerName:
            "دائن",
          flex: 0.64,
          minWidth: 64,
          align: "center",
          headerAlign:
            "center",
          valueFormatter:
            (params) =>
              shortMoney(
                params.value
              )
        },
        {
          field: "notes",
          headerName:
            "بيان",
          flex: 1.65,
          minWidth: 135
        },
        {
          field: "centerName",
          headerName:
            "مركز التكلفة",
          flex: 1.28,
          minWidth: 110
        },
        {
          field: "branchName",
          headerName:
            "الفرع",
          flex: 1.15,
          minWidth: 105
        }
      ],
      []
    );

  const compactColumns =
    useMemo(() => {
      const result = [
        {
          field: "dayDate",
          headerName:
            "التاريخ",
          flex: 0.95,
          minWidth: 0,
          sortable: false,
          align: "center",
          headerAlign:
            "center",
          valueFormatter:
            (params) =>
              dateOnly(
                params.value
              )
        },
        {
          field: "actionCode",
          headerName:
            "المستند",
          flex: 0.78,
          minWidth: 0,
          sortable: false,
          align: "center",
          headerAlign:
            "center"
        },
        {
          field: "accountName",
          headerName:
            "الحساب",
          flex: isPhone
            ? 1.45
            : 1.6,
          minWidth: 0,
          sortable: false
        },
        {
          field: "maden",
          headerName:
            "مدين",
          flex: 0.72,
          minWidth: 0,
          sortable: false,
          align: "center",
          headerAlign:
            "center",
          valueFormatter:
            (params) =>
              shortMoney(
                params.value
              )
        },
        {
          field: "daen",
          headerName:
            "دائن",
          flex: 0.72,
          minWidth: 0,
          sortable: false,
          align: "center",
          headerAlign:
            "center",
          valueFormatter:
            (params) =>
              shortMoney(
                params.value
              )
        },
        {
          field: "__details",
          headerName: "",
          width: isPhone
            ? 32
            : 38,
          minWidth: isPhone
            ? 32
            : 38,
          maxWidth: isPhone
            ? 32
            : 38,
          sortable: false,
          filterable: false,
          disableColumnMenu:
            true,
          align: "center",
          renderCell:
            (params) => (
              <IconButton
                size="small"
                onClick={(
                  event
                ) => {
                  event
                    .stopPropagation();

                  setDetailRow(
                    params.row
                  );

                  setDetailOpen(
                    true
                  );
                }}
                sx={{
                  width:
                    isPhone
                      ? 23
                      : 27,
                  height:
                    isPhone
                      ? 23
                      : 27,
                  p: 0,
                  color:
                    primaryColor,
                  bgcolor:
                    "#eef8f3",
                  border:
                    "1px solid rgba(5,117,70,.18)"
                }}
              >
                <VisibilityOutlinedIcon
                  sx={{
                    fontSize:
                      isPhone
                        ? 13
                        : 16
                  }}
                />
              </IconButton>
            )
        }
      ];

      return result;
    }, [isPhone]);

  const renderAdvancedFilter =
    (field) => {
      const selected =
        advancedFilters[
          field.key
        ] || [];

      const options =
        filterOptions[
          field.key
        ] || [];

      return (
        <Autocomplete
          key={field.key}
          multiple
          disableCloseOnSelect
          size="small"
          value={selected}
          options={options}
          onChange={(
            _event,
            value
          ) =>
            setMultiFilter(
              field.key,
              value
            )
          }

          // أهم نقطة في حل التهنيج:
          // مهما كان عندنا آلاف القيم، لا نرسم أكثر من 100 عنصر في DOM.
          // المستخدم يكتب جزءاً من الاسم للوصول لأي قيمة أخرى.
          filterOptions={(
            allOptions,
            state
          ) => {
            const q =
              String(
                state.inputValue ||
                  ""
              )
                .trim()
                .toLowerCase();

            const result = [];

            for (
              const option of allOptions
            ) {
              if (
                !q ||
                String(option)
                  .toLowerCase()
                  .includes(q)
              ) {
                result.push(
                  option
                );

                if (
                  result.length >=
                  100
                ) {
                  break;
                }
              }
            }

            return result;
          }}

          noOptionsText="لا توجد نتائج"
          limitTags={
            isPhone
              ? 1
              : 2
          }
          getOptionLabel={(
            option
          ) =>
            String(
              option ?? ""
            )
          }
          isOptionEqualToValue={(
            option,
            value
          ) =>
            option === value
          }
          renderOption={(
            props,
            option,
            { selected: checked }
          ) => (
            <li
              {...props}
              key={`${field.key}-${option}`}
              style={adaptiveInlineStyle({
                ...props.style,
                fontFamily:
                  "Cairo",
                fontSize: 12,
                minHeight: 34
              })}
            >
              <Checkbox
                size="small"
                checked={
                  checked
                }
                sx={{
                  p: 0.3,
                  mr: 0.5
                }}
              />

              <ListItemText
                primary={
                  option
                }
                primaryTypographyProps={{
                  fontFamily:
                    "Cairo",
                  fontSize: 11,
                  fontWeight: 700,
                  noWrap: true
                }}
              />
            </li>
          )}
          renderInput={(
            params
          ) => (
            <TextField InputLabelProps={{ shrink: true }}
              {...params}
              label={
                field.label
              }
              placeholder={
                selected.length === 0
                  ? "بحث..."
                  : ""
              }
              sx={uiLayout.withUiSx({
                minWidth: 0,

                "& .MuiInputLabel-root":
                  {
                    fontFamily:
                      "Cairo",
                    fontWeight: 800,
                    fontSize:
                      isPhone
                        ? 12
                        : 12
                  },

                "& .MuiOutlinedInput-root":
                  {
                    minHeight:
                      isPhone
                        ? 34
                        : 38,
                    bgcolor: "#fff",
                    py: "2px !important"
                  },

                "& .MuiAutocomplete-input":
                  {
                    fontFamily:
                      "Cairo",
                    fontSize:
                      isPhone
                        ? 12
                        : 12,
                    fontWeight: 800
                  },

                "& .MuiChip-root":
                  {
                    height:
                      isPhone
                        ? 22
                        : 25,
                    fontFamily:
                      "Cairo",
                    fontSize:
                      isPhone
                        ? 12
                        : 12,
                    fontWeight: 800
                  }
              }, uiLayout.formFieldSx)}
            />
          )}
          ListboxProps={{
            style: {
              maxHeight: 320
            }
          }}
        />
      );
    };

  if (permissionLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "#f4f7f6"
        }}
      >
        <Stack
          alignItems="center"
          spacing={1}
        >
          <CircularProgress />

          <Typography
            sx={{
              fontFamily:
                "Cairo",
              fontWeight: 900
            }}
          >
            جاري التحقق من الصلاحيات...
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (!authorized) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          p: 2,
          bgcolor: "#f4f7f6"
        }}
      >
        <Alert
          severity="error"
          sx={{
            fontFamily: "Cairo",
            fontWeight: 900
          }}
        >
          ليس لديك صلاحية الحسابات العامة / اليومية العامة.
        </Alert>
      </Box>
    );
  }

  return (
    <NavigationShell variant="standard" mobileOpen={
          mobileSidebarOpen
        } onMobileClose={() =>
          setMobileSidebarOpen(
            false
          )
        }><Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : "#f4f7f6",

        // مهم: الاتجاه كما هو LTR
        direction: "rtl",

        overflowX: "hidden"
      }}
    >
      

      <PageContainer
        component="main"
        sx={{
          boxSizing: "border-box",
          
          direction: "rtl",
          overflowX: "hidden",
          ...navigationContentSx
        }}
      >
        {!isDesktop && (
          <AppBar
            position="static"
            elevation={0}
            sx={{
              borderRadius:
                isPhone
                  ? "8px 8px 0 0"
                  : 2,

              bgcolor:
                primaryColor,

              mb: 0.5
            }}
          >
            <Toolbar
              variant="dense"
              sx={{
                minHeight:
                  isPhone
                    ? "42px !important"
                    : "var(--app-header-height, 56px)"
              }}
            >
              <IconButton
                onClick={() =>
                  setMobileSidebarOpen(
                    true
                  )
                }
                sx={{
                  color: "#fff"
                }}
              >
                <MenuRoundedIcon />
              </IconButton>

              <Typography
                sx={{
                  flexGrow: 1,
                  fontFamily:
                    "Cairo",
                  fontWeight: 950,
                  fontSize:
                    isPhone
                      ? 14
                      : 16
                }}
              >
                اليومية العامة
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <Paper
          elevation={0}
          sx={{
            border:
              `1px solid ${borderColor}`,
            borderRadius: 2.5,
            overflow: "hidden",
            bgcolor: "#fff"
          }}
        >
          <Box
            sx={{
              px: isPhone
                ? 0.9
                : 1.4,

              py: isPhone
                ? 0.7
                : 1,

              bgcolor:
                primaryColor,

              color: "#fff"
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.8}
            >
              <TodayIcon />

              <Box>
                <Typography
                  sx={{
                    fontFamily:
                      "Cairo",
                    fontWeight: 950,
                    fontSize:
                      isPhone
                        ? 14
                        : 19
                  }}
                >
                  اليومية العامة
                </Typography>

                <Typography
                  sx={{
                    fontFamily:
                      "Cairo",
                    opacity: 0.9,
                    fontSize:
                      isPhone
                        ? 12
                        : 12
                  }}
                >
                  حركة القيود اليومية مع الفلاتر والإجماليات
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              p: isPhone
                ? 0.6
                : 0.9
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: isPhone
                  ? 0.55
                  : 0.8,

                border:
                  `1px solid ${borderColor}`,

                borderRadius: 2,

                bgcolor:
                  "#fbfdfc",

                mb: 0.75
              }}
            >
              <Box
                sx={uiLayout.withUiSx({
                  display:
                    "grid",

                  gridTemplateColumns:
                    isDesktop
                      ? "145px 145px 105px 125px minmax(220px,1fr)"
                      : isTablet
                        ? "repeat(3,minmax(0,1fr))"
                        : "repeat(2,minmax(0,1fr))",

                  gap: isPhone
                    ? 0.4
                    : 0.6,

                  alignItems:
                    "center",

                  direction:
                    "rtl"
                }, uiLayout.filterBarSx)}
              >
                <TextField
                  type="date"
                  label="الفترة من"
                  value={
                    fromDate
                  }
                  onChange={(
                    e
                  ) =>
                    setFromDate(
                      e.target
                        .value
                    )
                  }
                  inputProps={{
                    max:
                      toDate ||
                      undefined
                  , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  size="small"
                  sx={uiLayout.withUiSx({
                    minWidth: 0,

                    "& .MuiInputBase-root":
                      {
                        minHeight:
                          isPhone
                            ? 34
                            : 39
                      },

                    "& input": {
                      fontSize:
                        isPhone
                          ? 12
                          : 12,

                      fontWeight:
                        800
                    }
                  }, uiLayout.formFieldSx)}
                />

                <TextField
                  type="date"
                  label="الفترة إلى"
                  value={
                    toDate
                  }
                  onChange={(
                    e
                  ) =>
                    setToDate(
                      e.target
                        .value
                    )
                  }
                  inputProps={{
                    min:
                      fromDate ||
                      undefined
                  , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  size="small"
                  sx={uiLayout.withUiSx({
                    minWidth: 0,

                    "& .MuiInputBase-root":
                      {
                        minHeight:
                          isPhone
                            ? 34
                            : 39
                      },

                    "& input": {
                      fontSize:
                        isPhone
                          ? 12
                          : 12,

                      fontWeight:
                        800
                    }
                  }, uiLayout.formFieldSx)}
                />

                <Button
                  variant="contained"
                  startIcon={
                    loading
                      ? (
                        <CircularProgress
                          size={14}
                          sx={{
                            color:
                              "#fff"
                          }}
                        />
                      )
                      : (
                        <RefreshIcon />
                      )
                  }
                  onClick={
                    loadData
                  }
                  disabled={
                    loading
                  }
                  sx={uiLayout.withUiSx({
                    minHeight:
                      isPhone
                        ? 34
                        : 39,

                    bgcolor:
                      primaryColor,

                    fontWeight:
                      900,

                    fontSize:
                      isPhone
                        ? 12
                        : 12,

                    "&:hover": {
                      bgcolor:
                        primaryDark
                    }
                  }, uiLayout.buttonSx)}
                >
                  {loading
                    ? "جاري..."
                    : "عرض"}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={
                    <FileDownloadIcon />
                  }
                  onClick={
                    exportCsv
                  }
                  disabled={
                    filteredRows
                      .length === 0
                  }
                  sx={uiLayout.withUiSx({
                    minHeight:
                      isPhone
                        ? 34
                        : 39,

                    fontWeight:
                      900,

                    fontSize:
                      isPhone
                        ? 12
                        : 12,

                    whiteSpace:
                      "nowrap"
                  }, uiLayout.buttonSx)}
                >
                  تصدير Excel
                </Button>

                <TextField InputLabelProps={{ shrink: true }}
                  value={
                    gridSearch
                  }
                  onChange={(
                    e
                  ) =>
                    setGridSearch(
                      e.target
                        .value
                    )
                  }
                  placeholder="بحث في اليومية..."
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          sx={{
                            fontSize:
                              isPhone
                                ? 15
                                : 18
                          }}
                        />
                      </InputAdornment>
                    )
                  }}
                  sx={uiLayout.withUiSx({
                    minWidth: 0,

                    gridColumn:
                      isPhone
                        ? "1 / -1"
                        : "auto",

                    "& .MuiInputBase-root":
                      {
                        minHeight:
                          isPhone
                            ? 34
                            : 39
                      },

                    "& input": {
                      fontSize:
                        isPhone
                          ? 12
                          : 12
                    }
                  }, uiLayout.formFieldSx)}
                />
              </Box>

              <Stack
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={uiLayout.withUiSx({
                  mt: 0.55,
                  direction:
                    "rtl",
                  flexWrap: "wrap",
                  gap: 0.4
                }, uiLayout.actionBarSx)}
              >
                <Button
                  variant={
                    advancedFiltersOpen
                      ? "contained"
                      : "outlined"
                  }
                  startIcon={
                    <TuneOutlinedIcon />
                  }
                  endIcon={
                    advancedFiltersOpen
                      ? (
                        <ExpandLessRoundedIcon />
                      )
                      : (
                        <ExpandMoreRoundedIcon />
                      )
                  }
                  onClick={() =>
                    setAdvancedFiltersOpen(
                      (current) =>
                        !current
                    )
                  }
                  sx={uiLayout.withUiSx({
                    minHeight:
                      isPhone
                        ? 31
                        : 35,

                    bgcolor:
                      advancedFiltersOpen
                        ? primaryColor
                        : undefined,

                    fontWeight:
                      900,

                    fontSize:
                      isPhone
                        ? 12
                        : 12
                  }, uiLayout.buttonSx)}
                >
                  فلاتر متقدمة
                  {activeFilterCount >
                  0
                    ? ` (${activeFilterCount})`
                    : ""}
                </Button>

                {activeFilterCount >
                  0 && (
                  <Button
                    variant="text"
                    color="error"
                    startIcon={
                      <ClearAllOutlinedIcon />
                    }
                    onClick={() =>
                      setAdvancedFilters(
                        createEmptyFilters()
                      )
                    }
                    sx={uiLayout.withUiSx({
                      minHeight:
                        isPhone
                          ? 31
                          : 35,

                      fontWeight:
                        900,

                      fontSize:
                        isPhone
                          ? 12
                          : 12
                    }, uiLayout.buttonSx)}
                  >
                    مسح الفلاتر
                  </Button>
                )}

                <Chip
                  size="small"
                  icon={
                    <FilterAltOutlinedIcon />
                  }
                  label={`المعروض ${filteredRows.length} من ${rows.length}`}
                  sx={{
                    ml: "auto",
                    fontFamily:
                      "Cairo",
                    fontWeight:
                      900,
                    fontSize:
                      isPhone
                        ? 12
                        : 12
                  }}
                />
              </Stack>

              <Collapse
                in={
                  advancedFiltersOpen
                }
              >
                <Box
                  sx={{
                    mt: 0.7,
                    p: isPhone
                      ? 0.5
                      : 0.7,

                    border:
                      "1px solid rgba(5,117,70,.15)",

                    borderRadius:
                      1.5,

                    bgcolor:
                      "#f5faf7",

                    display:
                      "grid",

                    gridTemplateColumns:
                      isDesktop
                        ? "repeat(5,minmax(0,1fr))"
                        : isTablet
                          ? "repeat(3,minmax(0,1fr))"
                          : "repeat(2,minmax(0,1fr))",

                    gap: isPhone
                      ? 0.4
                      : 0.55,

                    direction:
                      "rtl"
                  }}
                >
                  {FILTER_FIELDS.map(
                    renderAdvancedFilter
                  )}
                </Box>
              </Collapse>
            </Paper>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 0.7,
                  fontFamily:
                    "Cairo",
                  fontWeight: 900
                }}
              >
                {error}
              </Alert>
            )}

            {loading && (
              <Paper
                elevation={0}
                sx={{
                  mb: 0.7,
                  p: 0.65,
                  bgcolor:
                    "#eef8f3",
                  border:
                    "1px solid rgba(5,117,70,.18)",
                  borderRadius: 1.5
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.8}
                  alignItems="center"
                >
                  <CircularProgress
                    size={18}
                  />

                  <Typography
                    sx={{
                      fontFamily:
                        "Cairo",
                      color:
                        primaryColor,
                      fontWeight: 900,
                      fontSize:
                        isPhone
                          ? 12
                          : 12
                    }}
                  >
                    جاري تحميل اليومية العامة...
                  </Typography>
                </Stack>
              </Paper>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  isPhone
                    ? "1fr 1fr"
                    : "repeat(3,1fr)",

                gap: isPhone
                  ? 0.4
                  : 0.65,

                mb: 0.75
              }}
            >
              {[
                {
                  title:
                    "إجمالي مدين",
                  value:
                    totals.maden
                },
                {
                  title:
                    "إجمالي دائن",
                  value:
                    totals.daen
                },
                {
                  title:
                    "الفرق",
                  value:
                    difference,
                  accent: true
                }
              ].map(
                (item) => (
                  <Paper
                    key={
                      item.title
                    }
                    elevation={0}
                    sx={{
                      p: isPhone
                        ? 0.55
                        : 0.9,

                      borderRadius:
                        1.7,

                      border:
                        `1px solid ${borderColor}`,

                      gridColumn:
                        isPhone &&
                        item.title ===
                          "الفرق"
                          ? "1 / -1"
                          : "auto"
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily:
                          "Cairo",
                        color:
                          mutedColor,
                        fontWeight:
                          900,
                        fontSize:
                          isPhone
                            ? 12
                            : 12
                      }}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.15,
                        fontFamily:
                          "Cairo",
                        fontWeight:
                          950,
                        fontSize:
                          isPhone
                            ? 13
                            : 19,
                        color:
                          item.accent
                            ? (
                              Math.abs(
                                difference
                              ) <
                              0.005
                                ? primaryColor
                                : accentColor
                            )
                            : textColor
                      }}
                    >
                      {money(
                        item.value
                      )}
                    </Typography>
                  </Paper>
                )
              )}
            </Box>

            <Box
              sx={uiLayout.withUiSx({
                width: "100%",
                height: isPhone
                  ? 430
                  : isTablet
                    ? 525
                    : 610,

                // لا يوجد Scroll أفقي خارجي
                overflowX:
                  "hidden"
              }, uiLayout.tableContainerSx)}
            >
              <DataGrid
                rows={
                  filteredRows
                }

                columns={
                  isDesktop
                    ? desktopColumns
                    : compactColumns
                }

                loading={
                  loading
                }

                density="compact"

                rowHeight={
                  isDesktop
                    ? 39
                    : isPhone
                      ? 34
                      : 37
                }

                columnHeaderHeight={
                  isDesktop
                    ? 42
                    : isPhone
                      ? 34
                      : 38
                }

                disableRowSelectionOnClick

                disableColumnMenu={
                  !isDesktop
                }

                pageSizeOptions={[
                  25,
                  50,
                  100
                ]}

                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize:
                        isPhone
                          ? 25
                          : 50,
                      page: 0
                    }
                  }
                }}

                getRowClassName={(
                  params
                ) =>
                  params
                    .indexRelativeToCurrentPage %
                    2 ===
                  0
                    ? "even-row"
                    : "odd-row"
                }

                sx={uiLayout.withUiSx({
                  border:
                    `1px solid ${borderColor}`,

                  // اتجاه الجريد كما طلبت LTR
                  direction:
                    "rtl",

                  // منع Horizontal Scroll قدر الإمكان:
                  // كل أعمدة الديسكتوب Flex + minWidth صغير
                  "& .MuiDataGrid-virtualScroller":
                    {
                      overflowX:
                        "auto"
                    },

                  "& .MuiDataGrid-columnHeaders":
                    {
                      bgcolor:
                        "#eef7f2",
                      color:
                        primaryDark
                    },

                  "& .MuiDataGrid-columnHeaderTitle":
                    {
                      fontFamily:
                        "Cairo",
                      fontWeight:
                        950,
                      fontSize:
                        isDesktop
                          ? 12
                          : isPhone
                            ? 12
                            : 12,
                      textAlign:
                        "center"
                    },

                  "& .MuiDataGrid-columnHeaderTitleContainer":
                    {
                      justifyContent:
                        "center"
                    },

                  "& .MuiDataGrid-cell":
                    {
                      fontFamily:
                        "Cairo",
                      fontWeight:
                        800,
                      fontSize:
                        isDesktop
                          ? 12
                          : isPhone
                            ? 12
                            : 12,
                      px: isPhone
                        ? 0.12
                        : 0.35,
                      borderColor:
                        "#edf2ef",
                      overflow:
                        "hidden",
                      textOverflow:
                        "ellipsis",
                      whiteSpace:
                        "nowrap"
                    },

                  "& .MuiDataGrid-columnSeparator":
                    {
                      // نظهر الفاصل على الديسكتوب
                      // حتى المستخدم يقدر يوسّع ويضيّق العمود
                      display:
                        isDesktop
                          ? "flex"
                          : "none",
                      opacity:
                        isDesktop
                          ? 0.55
                          : 0
                    },

                  "& .MuiDataGrid-menuIcon":
                    {
                      display:
                        isDesktop
                          ? undefined
                          : "none"
                    },

                  "& .even-row":
                    {
                      bgcolor:
                        "#ffffff"
                    },

                  "& .odd-row":
                    {
                      bgcolor:
                        "#f8fbf9"
                    },

                  "& .MuiDataGrid-row:hover":
                    {
                      bgcolor:
                        "#eef7f2 !important"
                    },

                  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus":
                    {
                      outline:
                        "none"
                    }
                }, uiLayout.dataGridSx)}
              />
            </Box>
          </Box>
        </Paper>
      </PageContainer>

      <Dialog sx={uiLayout.dialogLayoutSx}
        open={detailOpen}
        onClose={() =>
          setDetailOpen(
            false
          )
        }
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            direction: "rtl"
          }
        }}
      >
        <DialogTitle
          sx={{
            fontFamily:
              "Cairo",
            fontWeight: 950,
            color:
              primaryColor
          }}
        >
          تفاصيل القيد
        </DialogTitle>

        <DialogContent
          dividers
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                isPhone
                  ? "1fr"
                  : "1fr 1fr",
              gap: 0.7
            }}
          >
            {[
              [
                "تاريخ القيد",
                dateOnly(
                  detailRow
                    ?.dayDate
                )
              ],
              [
                "رقم القيد",
                detailRow
                  ?.code
              ],
              [
                "نوع المستند",
                detailRow
                  ?.name
              ],
              [
                "رقم المستند",
                detailRow
                  ?.actionCode
              ],
              [
                "الحساب",
                detailRow
                  ?.accountName
              ],
              [
                "مدين",
                money(
                  detailRow
                    ?.maden
                )
              ],
              [
                "دائن",
                money(
                  detailRow
                    ?.daen
                )
              ],
              [
                "مركز التكلفة",
                detailRow
                  ?.centerName
              ],
              [
                "الفرع",
                detailRow
                  ?.branchName
              ]
            ].map(
              ([label, value]) => (
                <Paper
                  key={label}
                  elevation={0}
                  sx={{
                    p: 0.7,
                    border:
                      `1px solid ${borderColor}`,
                    borderRadius:
                      1.5
                  }}
                >
                  <Typography
                    sx={{
                      color:
                        mutedColor,
                      fontFamily:
                        "Cairo",
                      fontWeight:
                        800,
                      fontSize: 12
                    }}
                  >
                    {label}
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily:
                        "Cairo",
                      fontWeight:
                        900,
                      fontSize: 12
                    }}
                  >
                    {value ||
                      "-"}
                  </Typography>
                </Paper>
              )
            )}

            <Paper
              elevation={0}
              sx={{
                p: 0.8,
                border:
                  `1px solid ${borderColor}`,
                borderRadius:
                  1.5,
                gridColumn:
                  "1 / -1"
              }}
            >
              <Typography
                sx={{
                  color:
                    mutedColor,
                  fontFamily:
                    "Cairo",
                  fontWeight:
                    800,
                  fontSize: 12
                }}
              >
                البيان
              </Typography>

              <Typography
                sx={{
                  fontFamily:
                    "Cairo",
                  fontWeight:
                    900,
                  fontSize: 12,
                  whiteSpace:
                    "pre-wrap"
                }}
              >
                {detailRow
                  ?.notes ||
                  "-"}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={uiLayout.dialogActionsSx}>
          <Button sx={uiLayout.buttonSx}
            onClick={() =>
              setDetailOpen(
                false
              )
            }
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box></NavigationShell>
  );
}