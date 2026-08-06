import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
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

        const result = await response.json().catch(() => null);

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

  const columns = [
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden"
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
          py: 1.4
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <HistoryIcon />

          <Box>
            <Typography
              sx={{
                fontWeight: 950,
                fontSize: "1.05rem"
              }}
            >
              العمليات التي تمت على الطالب
            </Typography>

            <Typography
              sx={{
                fontSize: "0.78rem",
                opacity: 0.92
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
          sx={{ color: "#fff" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {loading ? (
          <Box
            sx={{
              height: 320,
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <CircularProgress sx={{ color: primaryColor }} />
          </Box>
        ) : error ? (
          <Box
            sx={{
              minHeight: 220,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: accentColor,
              fontWeight: 900
            }}
          >
            {error}
          </Box>
        ) : (
          <Box sx={{ height: 420, mt: 1 }}>
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
                noRowsLabel: "لا توجد عمليات مسجلة على الطالب"
              }}
              sx={{
                borderRadius: 2,
                direction: "ltr",
                borderColor: primaryLight,

                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: primaryColor,
                  color: "#fff",
                  fontWeight: 950
                },

                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 950
                },

                "& .MuiDataGrid-cell": {
                  color: textColor,
                  fontWeight: 800,
                  textAlign: "center"
                },

                "& .MuiDataGrid-row:nth-of-type(even)": {
                  backgroundColor: "#fbfdfc"
                }
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          pb: 2,
          pt: 0
        }}
      >
        <Button
          variant="outlined"
          color="error"
          onClick={onClose}
          sx={{
            minWidth: 110,
            fontWeight: 900
          }}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentOperationsDialog;
