import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";

const primaryColor = "#057546";
const primaryLight = "#e6f3ee";
const accentColor = "#ae1e21";
const textColor = "#1f2d3d";

const StudentOperationsDialog = ({
  open,
  onClose,
  student,
  apiBaseUrl
}) => {
  const theme = useTheme();

  const isPhone = useMediaQuery(
    theme.breakpoints.down("sm")
  );

  const isTablet = useMediaQuery(
    "(min-width:600px) and (max-width:1599px)"
  );

  const isCompact = isPhone || isTablet;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const actionGuid =
    student?.actionHistoryGuid ||
    student?.ActionHistoryGuid ||
    student?.raw?.__index_10 ||
    student?.accountGuid ||
    "";

  useEffect(() => {
    if (!open || !actionGuid) return undefined;

    const controller = new AbortController();

    const loadOperations = async () => {
      try {
        setLoading(true);
        setError("");
        setRows([]);

        const params = new URLSearchParams({
          actionGuid
        });

        const response = await fetch(
          `${apiBaseUrl}/api/reception-office/students/operations?${params.toString()}`,
          {
            signal: controller.signal
          }
        );

        const result =
          await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
              result?.error ||
              "تعذر تحميل عمليات الطالب"
          );
        }

        setRows(
          Array.isArray(result?.data)
            ? result.data
            : []
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message ||
              "حدث خطأ أثناء تحميل عمليات الطالب"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadOperations();

    return () => controller.abort();
  }, [open, actionGuid, apiBaseUrl]);

  /*
   * على الموبايل نخفي عمود الملاحظات،
   * ونركز على:
   * المستخدم + العملية + التاريخ
   *
   * على التابلت نظهر الملاحظات لكن بعرض أصغر.
   */
  const columns = useMemo(() => {
    if (isPhone) {
      return [
        {
          field: "userName",
          headerName: "المستخدم",
          flex: 1,
          minWidth: 85,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "actionName",
          headerName: "العملية",
          flex: 1,
          minWidth: 82,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "actionDate",
          headerName: "التاريخ",
          flex: 1.1,
          minWidth: 95,
          align: "center",
          headerAlign: "center"
        }
      ];
    }

    if (isTablet) {
      return [
        {
          field: "userName",
          headerName: "اسم المستخدم",
          flex: 1,
          minWidth: 120,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "actionName",
          headerName: "العملية",
          flex: 0.9,
          minWidth: 105,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "actionDate",
          headerName: "تاريخ العملية",
          flex: 1,
          minWidth: 130,
          align: "center",
          headerAlign: "center"
        },
        {
          field: "actionReason",
          headerName: "ملاحظات",
          flex: 1.2,
          minWidth: 150,
          align: "center",
          headerAlign: "center"
        }
      ];
    }

    return [
      {
        field: "userName",
        headerName: "اسم المستخدم",
        flex: 1,
        minWidth: 170,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "actionDate",
        headerName: "تاريخ العملية",
        flex: 1,
        minWidth: 180,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "actionName",
        headerName: "العملية",
        flex: 0.8,
        minWidth: 130,
        align: "center",
        headerAlign: "center"
      },
      {
        field: "actionReason",
        headerName: "ملاحظات",
        flex: 1.5,
        minWidth: 220,
        align: "center",
        headerAlign: "center"
      }
    ];
  }, [isPhone, isTablet]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={isPhone}
      dir="rtl"
      sx={{
        "& .MuiDialog-container": {
          pt: isPhone
            ? "58px"
            : isTablet
              ? "64px"
              : 1.5,

          px: isPhone
            ? 0
            : isTablet
              ? 0.5
              : 1.5,

          pb: isPhone
            ? 0
            : isTablet
              ? 0.5
              : 1.5,

          alignItems: isPhone
            ? "stretch"
            : "center"
        }
      }}
      PaperProps={{
        sx: {
          width: isPhone
            ? "100vw"
            : isTablet
              ? "95vw"
              : undefined,

          maxWidth: isPhone
            ? "100vw"
            : isTablet
              ? "900px"
              : undefined,

          height: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "78vh",

          maxHeight: isPhone
            ? "calc(100dvh - 58px)"
            : isTablet
              ? "calc(100dvh - 72px)"
              : "78vh",

          minHeight: 0,
          m: 0,

          borderRadius: isPhone
            ? 0
            : isTablet
              ? 2
              : 3,

          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: primaryColor,
          color: "#fff",

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          px: isPhone
            ? 0.65
            : isTablet
              ? 0.9
              : 2,

          py: isPhone
            ? 0.4
            : isTablet
              ? 0.55
              : 1.4,

          flexShrink: 0
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",

            gap: isPhone
              ? 0.35
              : isTablet
                ? 0.55
                : 1,

            minWidth: 0
          }}
        >
          <HistoryIcon
            sx={{
              fontSize: isPhone
                ? 15
                : isTablet
                  ? 18
                  : undefined,

              flexShrink: 0
            }}
          />

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 950,

                fontSize: isPhone
                  ? "0.58rem"
                  : isTablet
                    ? "0.7rem"
                    : "1.05rem",

                lineHeight: 1.15,

                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              العمليات التي تمت على الطالب
            </Typography>

            <Typography
              sx={{
                fontSize: isPhone
                  ? "0.4rem"
                  : isTablet
                    ? "0.48rem"
                    : "0.78rem",

                opacity: 0.92,
                lineHeight: 1.15,

                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {student?.studentName || "-"}
              {" - "}
              {student?.nationalId || "-"}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            color: "#fff",

            width: isPhone
              ? 26
              : isTablet
                ? 30
                : 40,

            height: isPhone
              ? 26
              : isTablet
                ? 30
                : 40,

            flexShrink: 0
          }}
        >
          <CloseIcon
            sx={{
              fontSize: isPhone
                ? 15
                : isTablet
                  ? 18
                  : undefined
            }}
          />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          /*
           * Padding متساوي من الناحيتين
           * عشان الجريد ياخد عرض الشاشة صح.
           */
          px: isPhone
            ? 0.45
            : isTablet
              ? 0.7
              : 2,

          py: isPhone
            ? 0.45
            : isTablet
              ? 0.7
              : 2,

          flex: 1,
          minHeight: 0,

          overflow: "hidden"
        }}
      >
        {loading ? (
          <Box
            sx={{
              height: "100%",

              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <CircularProgress
              size={
                isPhone
                  ? 24
                  : isTablet
                    ? 30
                    : 40
              }
              sx={{
                color: primaryColor
              }}
            />
          </Box>
        ) : error ? (
          <Box
            sx={{
              height: "100%",

              display: "flex",
              justifyContent: "center",
              alignItems: "center",

              color: accentColor,
              fontWeight: 900,

              px: 1,

              textAlign: "center",

              fontSize: isPhone
                ? "0.5rem"
                : isTablet
                  ? "0.58rem"
                  : undefined
            }}
          >
            {error}
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              minHeight: 0,

              mt: isCompact
                ? 0
                : 1
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns}

              disableRowSelectionOnClick

              pageSizeOptions={[10, 25, 50]}

              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
                    page: 0
                  }
                },

                sorting: {
                  sortModel: [
                    {
                      field: "actionDate",
                      sort: "desc"
                    }
                  ]
                }
              }}

              localeText={{
                noRowsLabel:
                  "لا توجد عمليات مسجلة على الطالب"
              }}

              sx={{
                width: "100%",
                height: "100%",

                minWidth: 0,

                borderRadius: isCompact
                  ? 1.3
                  : 2,

                direction: "ltr",
                borderColor: primaryLight,

                "& .MuiDataGrid-main": {
                  minWidth: 0
                },

                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor:
                    primaryColor,

                  color: "#fff",
                  fontWeight: 950,

                  minHeight: `${
                    isPhone
                      ? 30
                      : isTablet
                        ? 36
                        : 56
                  }px !important`,

                  maxHeight: `${
                    isPhone
                      ? 30
                      : isTablet
                        ? 36
                        : 56
                  }px !important`
                },

                "& .MuiDataGrid-columnHeader": {
                  px: isPhone
                    ? 0.15
                    : isTablet
                      ? 0.3
                      : undefined
                },

                "& .MuiDataGrid-columnHeaderTitle":
                  {
                    fontWeight: 950,

                    fontSize: isPhone
                      ? "0.42rem"
                      : isTablet
                        ? "0.51rem"
                        : undefined,

                    lineHeight: 1,

                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  },

                "& .MuiDataGrid-cell": {
                  color: textColor,
                  fontWeight: 800,

                  textAlign: "center",

                  fontSize: isPhone
                    ? "0.43rem"
                    : isTablet
                      ? "0.52rem"
                      : undefined,

                  px: isPhone
                    ? 0.15
                    : isTablet
                      ? 0.3
                      : undefined,

                  overflow: "hidden"
                },

                "& .MuiDataGrid-cellContent": {
                  width: "100%",

                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",

                  textAlign: "center"
                },

                "& .MuiDataGrid-row": {
                  minHeight: `${
                    isPhone
                      ? 34
                      : isTablet
                        ? 39
                        : 52
                  }px !important`,

                  maxHeight: `${
                    isPhone
                      ? 34
                      : isTablet
                        ? 39
                        : 52
                  }px !important`
                },

                "& .MuiDataGrid-row:nth-of-type(even)":
                  {
                    backgroundColor:
                      "#fbfdfc"
                  },

                "& .MuiDataGrid-footerContainer":
                  {
                    minHeight: isPhone
                      ? 38
                      : isTablet
                        ? 44
                        : undefined,

                    fontSize: isPhone
                      ? "0.44rem"
                      : isTablet
                        ? "0.52rem"
                        : undefined
                  },

                "& .MuiTablePagination-root": {
                  fontSize: isPhone
                    ? "0.44rem"
                    : isTablet
                      ? "0.52rem"
                      : undefined
                },

                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                  {
                    fontSize: isPhone
                      ? "0.42rem"
                      : isTablet
                        ? "0.5rem"
                        : undefined
                  },

                "& .MuiDataGrid-menuIconButton": {
                  width: isPhone
                    ? 22
                    : undefined,

                  height: isPhone
                    ? 22
                    : undefined
                },

                "& .MuiDataGrid-iconButtonContainer .MuiSvgIcon-root":
                  {
                    fontSize: isPhone
                      ? 14
                      : isTablet
                        ? 17
                        : undefined
                  }
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: isPhone
            ? 0.45
            : isTablet
              ? 0.7
              : 2,

          py: isPhone
            ? 0.3
            : isTablet
              ? 0.4
              : 1,

          flexShrink: 0
        }}
      >
        <Button
          variant="outlined"
          color="error"
          onClick={onClose}
          sx={{
            minWidth: isPhone
              ? 65
              : isTablet
                ? 80
                : 110,

            minHeight: isPhone
              ? 29
              : isTablet
                ? 33
                : undefined,

            fontWeight: 900,

            fontSize: isPhone
              ? "0.46rem"
              : isTablet
                ? "0.54rem"
                : undefined
          }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentOperationsDialog;