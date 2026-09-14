import * as uiLayout from './common/uiLayout';
import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
  Stack,
  Button,
  Skeleton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { 
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Engineering as EngineeringIcon,
  Task as TaskIcon,
  Lightbulb as LightbulbIcon,
  Checklist as DiplomaIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';

const ReportViewer = ({ report, onBack }) => {
  const renderStatusChip = (status) => {
    const statusMap = {
      present: { label: 'حاضر', color: 'success' },
      absent: { label: 'غائب', color: 'error' },
      permission: { label: 'استئذان', color: 'warning' },
      leave: { label: 'إجازة', color: 'info' }
    };

    return (
      <Chip 
        label={statusMap[status]?.label || 'غير محدد'} 
        color={statusMap[status]?.color || 'default'} 
        size="small"
        sx={styles.chip}
      />
    );
  };

  const renderEmployeeSection = () => (
    <Accordion defaultExpanded sx={styles.accordion}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PeopleIcon color="primary" />
          <Typography variant="h6">حضور الموظفين ({report.employee_attendance?.length || 0})</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper} sx={uiLayout.withUiSx(styles.tableContainer, uiLayout.tableContainerSx)}>
          <Table size="small">
            <TableHead sx={styles.tableHead}>
              <TableRow>
                <TableCell width="70%">اسم الموظف</TableCell>
                <TableCell width="30%">الحالة</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {report.employee_attendance?.map((emp, index) => (
                <TableRow key={index} hover>
                  <TableCell>{emp.employee_name}</TableCell>
                  <TableCell>{renderStatusChip(emp.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );

  const renderListSection = (title, items = [], icon) => (
    <Accordion defaultExpanded sx={styles.accordion}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" alignItems="center" spacing={1}>
          {icon}
          <Typography variant="h6">{title} ({items.length})</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        {items.length > 0 ? (
          <List dense sx={styles.list}>
            {items.map((item, index) => (
              <ListItem key={index} sx={styles.listItem}>
                <ListItemText 
                  primary={`${index + 1}. ${item.item_text || item.visit_text || item.task_text}`}
                  primaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={styles.noItems}>
            لا توجد عناصر متاحة
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );

  const renderDiplomaStats = () => (
    <Paper sx={styles.sectionPaper}>
      <Box sx={styles.sectionHeader}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <DiplomaIcon color="primary" />
          <Typography variant="h5">إحصائيات الدبلومات</Typography>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={styles.gridContainer}>
        <Grid item xs={12} md={4}>
          <Paper sx={styles.diplomaCard}>
            <Typography variant="h6" gutterBottom sx={styles.diplomaTitle}>
              التسجيلات
            </Typography>
            {report.diploma_registrations?.map((item, index) => (
              <Box key={index} sx={styles.diplomaItem}>
                <Typography variant="subtitle1">{item.diploma_name}</Typography>
                <Stack direction="row" spacing={2} sx={styles.diplomaStats}>
                  <Chip label={`العدد: ${item.count}`} size="small" />
                  <Chip label={`الدفعة: ${item.batch}`} size="small" color="info" />
                </Stack>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={styles.diplomaCard}>
            <Typography variant="h6" gutterBottom sx={{ ...styles.diplomaTitle, color: 'success.main' }}>
              الحضور
            </Typography>
            {report.diploma_attendance?.map((item, index) => (
              <Box key={index} sx={styles.diplomaItem}>
                <Typography variant="subtitle1">{item.diploma_name}</Typography>
                <Chip 
                  label={`العدد: ${item.count}`} 
                  size="small" 
                  sx={styles.attendanceChip} 
                  color="success"
                />
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={styles.diplomaCard}>
            <Typography variant="h6" gutterBottom sx={{ ...styles.diplomaTitle, color: 'warning.main' }}>
              الموافقات
            </Typography>
            {report.diploma_approvals?.map((item, index) => (
              <Box key={index} sx={styles.diplomaItem}>
                <Typography variant="subtitle1">{item.diploma_name}</Typography>
                <Stack direction="row" spacing={2} sx={styles.diplomaStats}>
                  <Chip label={`العدد: ${item.count}`} size="small" />
                  <Chip label={`الدفعة: ${item.batch}`} size="small" color="warning" />
                </Stack>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderFeedbackSection = () => (
    <Paper sx={styles.sectionPaper}>
      <Box sx={styles.sectionHeader}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LightbulbIcon color="primary" />
          <Typography variant="h5">الشكاوي والمقترحات</Typography>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={styles.feedbackCard}>
            <Typography variant="h6" gutterBottom sx={styles.complaintTitle}>
              الشكاوي ({report.complaints?.length || 0})
            </Typography>
            <List dense>
              {report.complaints?.map((item, index) => (
                <ListItem key={index} sx={styles.feedbackItem}>
                  <ListItemText 
                    primary={`${index + 1}. ${item.complaint_text}`}
                    primaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={styles.feedbackCard}>
            <Typography variant="h6" gutterBottom sx={styles.suggestionTitle}>
              المقترحات ({report.suggestions?.length || 0})
            </Typography>
            <List dense>
              {report.suggestions?.map((item, index) => (
                <ListItem key={index} sx={styles.feedbackItem}>
                  <ListItemText 
                    primary={`${index + 1}. ${item.suggestion_text}`}
                    primaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );

  if (!report) {
    return (
      <Box sx={styles.loadingContainer}>
        <Skeleton variant="rectangular" width="100%" height={200} />
        <Skeleton variant="rectangular" width="100%" height={400} sx={{ mt: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      <Paper sx={styles.headerPaper}>
        <Box sx={styles.headerContent}>
          {onBack && (
            <Button 
              startIcon={<BackIcon />}
              onClick={onBack}
              sx={uiLayout.withUiSx(styles.backButton, uiLayout.buttonSx)}
            >
              العودة
            </Button>
          )}
          <Typography variant="h4" gutterBottom sx={styles.reportTitle}>
            التقرير اليومي
          </Typography>
          <Typography color="textSecondary" sx={styles.reportDate}>
            تاريخ التقرير: {new Date(report.report_info?.created_at).toLocaleDateString('ar-EG')}
          </Typography>
        </Box>
      </Paper>

      {renderEmployeeSection()}

      {renderListSection(
        "مراجعة التدريب الأهلي",
        report.training_review_items,
        <SchoolIcon color="primary" />
      )}

      {renderListSection(
        "الزيارات الإشرافية",
        report.supervisory_visits,
        <AssignmentIcon color="primary" />
      )}

      {renderListSection(
        "أعمال غير اعتيادية",
        report.unusual_work_items,
        <EngineeringIcon color="primary" />
      )}

      {renderListSection(
        "المهام اليومية",
        report.daily_tasks,
        <TaskIcon color="primary" />
      )}

      {renderDiplomaStats()}

      {renderFeedbackSection()}
    </Box>
  );
};

const styles = {
  container: {
    py: 3
  },
  headerPaper: {
    p: 3,
    mb: 3,
    borderRadius: '12px',
    backgroundColor: 'background.paper'
  },
  headerContent: {
    position: 'relative'
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0
  },
  reportTitle: {
    color: 'primary.main',
    textAlign: 'center',
    mb: 1
  },
  reportDate: {
    textAlign: 'center',
    display: 'block'
  },
  accordion: {
    mb: 3,
    borderRadius: '8px',
    overflow: 'hidden',
    '&:before': {
      display: 'none'
    }
  },
  tableContainer: {
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: 'none',
    border: '1px solid',
    borderColor: 'divider'
  },
  tableHead: {
    backgroundColor: 'action.hover'
  },
  chip: {
    fontWeight: '500',
    minWidth: '80px'
  },
  list: {
    p: 0,
    backgroundColor: 'background.paper',
    borderRadius: '8px'
  },
  listItem: {
    py: 1,
    borderBottom: '1px solid',
    borderColor: 'divider',
    '&:last-child': {
      borderBottom: 'none'
    }
  },
  noItems: {
    textAlign: 'center',
    py: 2
  },
  sectionPaper: {
    mb: 3,
    p: 3,
    borderRadius: '12px',
    backgroundColor: 'background.paper'
  },
  sectionHeader: {
    backgroundColor: 'action.selected',
    borderRadius: '8px',
    p: 2,
    mb: 3,
    borderInlineStart: '4px solid',
    borderColor: 'primary.main'
  },
  gridContainer: {
    mb: 2
  },
  diplomaCard: {
    p: 2,
    borderRadius: '8px',
    boxShadow: 1,
    height: '100%',
    border: '1px solid',
    borderColor: 'divider',
    backgroundColor: 'background.default'
  },
  diplomaTitle: {
    color: 'primary.main',
    pb: 1,
    borderBottom: '1px solid',
    borderColor: 'divider',
    mb: 2
  },
  diplomaItem: {
    mb: 2,
    p: 1,
    minWidth:"200px",
    borderRadius: '4px',
    backgroundColor: 'background.paper'
  },
  diplomaStats: {
    mt: 1
  },
  attendanceChip: {
    mt: 1
  },
  feedbackCard: {
    p: 2,
    borderRadius: '8px',
    height: '100%',
    minWidth:"250px",
    backgroundColor: 'background.default'
  },
  complaintTitle: {
    color: 'error.main',
    pb: 1,
    borderBottom: '1px solid',
    borderColor: 'divider',
    mb: 2
  },
  suggestionTitle: {
    color: 'success.main',
    pb: 1,
    borderBottom: '1px solid',
    borderColor: 'divider',
    mb: 2
  },
  feedbackItem: {
    py: 1,
    px: 0,
    '&:not(:last-child)': {
      borderBottom: '1px solid',
      borderColor: 'divider'
    }
  },
  loadingContainer: {
    py: 3
  }
};

export default ReportViewer;