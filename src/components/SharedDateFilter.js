import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const SharedDateFilter = ({ 
  fromDate, 
  toDate, 
  onFromDateChange, 
  onToDateChange, 
  onFilter, 
  onReset 
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <DatePicker
          label="من تاريخ"
          value={fromDate}
          onChange={onFromDateChange}
          renderInput={(params) => <TextField {...params} size="small" />}
        />
        <DatePicker
          label="إلى تاريخ"
          value={toDate}
          onChange={onToDateChange}
          renderInput={(params) => <TextField {...params} size="small" />}
          minDate={fromDate}
        />
        <Button 
          variant="contained" 
          onClick={onFilter}
          sx={{ ml: 2 }}
        >
          تطبيق
        </Button>
        <Button 
          variant="outlined" 
          onClick={onReset}
        >
          إعادة تعيين
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default SharedDateFilter;