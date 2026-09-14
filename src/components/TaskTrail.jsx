import * as uiLayout from './common/uiLayout';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Chip, Paper
} from '@mui/material';
import axios from 'axios';

const TASK_FLOW_API = "https://api3.sstli.com/api/TaskFlow/History";
const USERS_API = "https://api1.sstli.com/api/userinfo";

export default function TaskTrail({ subTaskGuid, currentUserGuid }) {
  const [trail, setTrail] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchTrail = async () => {
    setLoading(true);
    try {
      const usersResp = await axios.get(USERS_API);
      const usersArr = usersResp.data || [];
      const usersObj = {};
      usersArr.forEach(u => {
        usersObj[u.guid] = u.fullName || u.userName || 'غير معروف';
      });
      setUsersMap(usersObj);

      const trailResp = await axios.get(`${TASK_FLOW_API}?subTaskGuid=${subTaskGuid}`);
      setTrail(trailResp.data || []);
    } catch {
      setTrail([]);
    }
    setLoading(false);
  };

  // لما يفتح الديالوج، جيب الداتا لو مش موجودة
  const handleOpen = () => {
    setOpen(true);
    fetchTrail();
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        sx={{
          color: "#2563eb",
          fontWeight: 700,
          mb: 1,
          fontSize: 16,
          display: "inline-block"
        }}>
        مسار المهمة
      </Typography>
      <Button
        variant="outlined"
        size="small"
        sx={uiLayout.withUiSx({ ml: 2, fontSize: 14, borderRadius: 2, py: 0.5, px: 2 }, uiLayout.buttonSx)}
        onClick={handleOpen}
      >
        عرض مسار المهمة
      </Button>
      <Dialog sx={uiLayout.dialogLayoutSx} open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "#2563eb" }}>
          🧭 مسار المهمة
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress size={22} />
            </Box>
          ) : !trail.length ? (
            <Typography sx={{ color: '#aaa', fontSize: 15, my: 2 }}>
              لا يوجد سجل لمسار المهمة بعد.
            </Typography>
          ) : (
            <Paper elevation={0} sx={uiLayout.withUiSx({
              borderRadius: 3,
              boxShadow: '0 1px 8px #e0e7ef44',
              maxWidth: 700,
              mx: 'auto',
              mb: 2,
              overflowX: 'auto'
            }, uiLayout.tableContainerSx)}>
              <Table
                size="small"
                sx={{
                  minWidth: 400,
                  borderCollapse: 'separate',
                  borderSpacing: 0
                }}
              >
                <TableHead>
                  <TableRow sx={{ bgcolor: "#e0e7ff" }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: 15 }}>من</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 15 }}>إلى</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 15 }}>الحالة</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 15 }}>التاريخ</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 15 }}>ملاحظة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trail.map((row, idx) => {
                    // هل المستخدم الحالي طرف في التمريرة؟
                    const isCurrent =
                      row.fromUserGuid === currentUserGuid ||
                      row.toUserGuid === currentUserGuid;
                    return (
                      <TableRow
                        key={idx}
                        sx={{
                          background: isCurrent
                            ? "rgba(99,102,241,0.08)" // لون هادي مع شفافية
                            : "transparent",
                          backdropFilter: isCurrent ? "blur(1px)" : "none"
                        }}
                      >
                        <TableCell>
                          <Chip label={usersMap[row.fromUserGuid] || "غير معروف"}
                            size="small"
                            color={row.fromUserGuid === currentUserGuid ? "primary" : "default"}
                            sx={{
                              fontWeight: 600,
                              fontSize: 14,
                              opacity: row.fromUserGuid === currentUserGuid ? 1 : .85
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={usersMap[row.toUserGuid] || "غير معروف"}
                            size="small"
                            color={row.toUserGuid === currentUserGuid ? "secondary" : "default"}
                            sx={{
                              fontWeight: 600,
                              fontSize: 14,
                              opacity: row.toUserGuid === currentUserGuid ? 1 : .85
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.status} size="small"
                            color={
                              row.status === "مكتملة"
                                ? "success"
                                : row.status === "مرفوضة"
                                  ? "error"
                                  : row.status === "جاري التنفيذ"
                                    ? "warning"
                                    : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {/* التاريخ والساعة */}
                          <span style={{ fontWeight: 500 }}>
                            {row.dateMoved
                              ? new Date(row.dateMoved)
                                  .toLocaleString('ar-EG', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                  })
                              : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span style={{ color: '#444', fontSize: 13 }}>{row.note || '-'}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
