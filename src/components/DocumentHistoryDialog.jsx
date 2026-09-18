import * as uiLayout from './common/uiLayout';
import React, { useEffect, useRef, useState } from "react";
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
const accentColor = "#ae1e21";

const DocumentHistoryDialog = ({
  open,
  onClose,
  actionGuid,
  documentNo,
  apiBaseUrl
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !actionGuid) return undefined;

    const controller = new AbortController();

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");
        setRows([]);

        const params = new URLSearchParams({ actionGuid });

        const response = await fetch(
          `${apiBaseUrl}/api/reception-office/student-statement/document-history?${params.toString()}`,
          { signal: controller.signal }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.message ||
              result?.error ||
              "تعذر تحميل سجل العمليات"
          );
        }

        setRows(Array.isArray(result?.data) ? result.data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "حدث خطأ أثناء تحميل العمليات");
        }
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    return () => controller.abort();
  }, [open, actionGuid, apiBaseUrl]);

  // Lazy-mount guard: this dialog is mounted eagerly (but closed) as soon
  // as the parent page loads, so skip building its JSX until it has
  // actually been opened once. Once opened, later closes still render
  // normally so the MUI exit transition keeps working.
  const hasOpenedRef = useRef(open);
  if (open) hasOpenedRef.current = true;
  if (!hasOpenedRef.current) return null;

  const columns = [
    {
      field: "userName",
      headerName: "اسم المستخدم",
      flex: 1,
      minWidth: 180,
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
      flex: 1,
      minWidth: 150,
      align: "center",
      headerAlign: "center"
    },
    {
      field: "notes",
      headerName: "ملاحظات",
      flex: 1.5,
      minWidth: 140,
      align: "center",
      headerAlign: "center"
    }
  ];

  return (
    <Dialog sx={uiLayout.dialogLayoutSx}
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      dir="rtl"
      PaperProps={{
        sx: (theme) => ({
          borderRadius: 3,
          overflow: "hidden",
          border: theme.palette.mode === "dark" ? "1px solid #67C99D" : undefined
        })
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: primaryColor,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.5
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HistoryIcon />

          <Box>
            <Typography sx={{ fontWeight: 950 }}>
              العمليات التي تمت على المستند
            </Typography>

            <Typography sx={{ fontSize: "0.78rem", opacity: 0.9 }}>
              رقم المستند: {documentNo || "-"}
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {loading ? (
          <Box
            sx={{
              height: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box
            sx={{
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accentColor,
              fontWeight: 900
            }}
          >
            {error}
          </Box>
        ) : (
          <Box sx={uiLayout.withUiSx({ height: 360, mt: 1 }, uiLayout.tableContainerSx)}>
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
                }
              }}
              localeText={{
                noRowsLabel: "لا توجد عمليات مسجلة"
              }}
              sx={uiLayout.withUiSx({
                borderRadius: 2,
                direction: "rtl",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: (theme) => theme.palette.mode === "dark" ? "rgba(237,137,54,.16)" : "#f7ead0",
                  color: (theme) => theme.palette.mode === "dark" ? theme.palette.text.primary : "#1f2d3d",
                  fontWeight: 950
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                  fontWeight: 950
                },
                "& .MuiDataGrid-cell": {
                  textAlign: "center",
                  fontWeight: 750
                }
              }, uiLayout.dataGridSx, (theme) => (theme.palette.mode !== "dark" ? {} : {
                border: "1px solid #67C99D",
                "& .MuiDataGrid-columnHeaders": { borderBottom: "1px solid #67C99D" },
                "& .MuiDataGrid-cell": { borderColor: "#67C99D" },
                "& .MuiDataGrid-footerContainer": { borderTop: "1px solid #67C99D" }
              }))}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={uiLayout.withUiSx({ px: 2, pb: 2 }, uiLayout.dialogActionsSx)}>
        <Button
          variant="outlined"
          color="error"
          onClick={onClose}
          sx={uiLayout.withUiSx({ minWidth: 110, fontWeight: 900 }, uiLayout.buttonSx)}
        >
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentHistoryDialog;