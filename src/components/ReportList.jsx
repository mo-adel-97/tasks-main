import React from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Chip,
  Button,
  TablePagination,
  Skeleton
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

const ReportList = ({ reports = [], onSelectReport, selectedDate, loading }) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (reports.length === 0 && !loading) {
    return (
      <Box sx={styles.emptyState}>
        <Typography variant="h6" color="textSecondary">
          {selectedDate 
            ? 'لا توجد تقارير متاحة للتاريخ المحدد'
            : 'لا توجد تقارير متاحة'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={styles.sectionTitle}>
        {selectedDate 
          ? `التقارير بتاريخ ${format(selectedDate, 'yyyy-MM-dd', { locale: ar })}`
          : 'جميع التقارير'}
      </Typography>
      
      <TableContainer component={Paper} sx={styles.tableContainer}>
        <Table sx={styles.table}>
          <TableHead sx={styles.tableHead}>
            <TableRow>
              <TableCell sx={styles.headerCell}>رقم التقرير</TableCell>
              <TableCell sx={styles.headerCell}>تاريخ الإنشاء</TableCell>
              <TableCell sx={styles.headerCell}>عدد الموظفين</TableCell>
              <TableCell sx={styles.headerCell}>المهام اليومية</TableCell>
              <TableCell sx={styles.headerCell}>الزيارات الإشرافية</TableCell>
              <TableCell sx={styles.headerCell}>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(rowsPerPage)).map((_, index) => (
                <TableRow key={index}>
                  {Array.from(new Array(6)).map((_, i) => (
                    <TableCell key={i}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              reports
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((report) => (
                  <TableRow key={report.report_info.id} hover>
                    <TableCell>{report.report_info.id}</TableCell>
                    <TableCell>
                      {format(parseISO(report.report_info.created_at), 'yyyy-MM-dd HH:mm', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.employee_attendance.length} 
                        color="primary" 
                        size="small" 
                        sx={styles.chip}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.daily_tasks.length} 
                        color="secondary" 
                        size="small" 
                        sx={styles.chip}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.supervisory_visits.length} 
                        color="info" 
                        size="small" 
                        sx={styles.chip}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onSelectReport(report)}
                        sx={styles.detailsButton}
                      >
                        عرض التفاصيل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={reports.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="عدد الصفوف:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
        sx={styles.pagination}
      />
    </Box>
  );
};

const styles = {
  emptyState: {
    textAlign: 'center',
    py: 6
  },
  sectionTitle: {
    mb: 2,
    color: 'text.primary',
    fontWeight: '600'
  },
  tableContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'none',
    border: '1px solid',
    borderColor: 'divider'
  },
  table: {
    minWidth: 650
  },
  tableHead: {
    backgroundColor: 'background.paper'
  },
  headerCell: {
    fontWeight: 'bold',
    color: 'text.secondary',
    borderBottom: '2px solid',
    borderColor: 'divider'
  },
  chip: {
    fontWeight: '500',
    minWidth: '60px'
  },
  detailsButton: {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: '500'
  },
  pagination: {
    border: 'none',
    '& .MuiTablePagination-toolbar': {
      paddingLeft: 0
    }
  }
};

export default ReportList;