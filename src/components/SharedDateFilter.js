import * as uiLayout from './common/uiLayout';
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
      <Box sx={uiLayout.withUiSx({ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }, uiLayout.filterBarSx)}>
        <DatePicker
          label="من تاريخ"
          value={fromDate}
          onChange={onFromDateChange}
          renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} size="small" />}
        />
        <DatePicker
          label="إلى تاريخ"
          value={toDate}
          onChange={onToDateChange}
          renderInput={(params) => <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }} {...params} size="small" />}
          minDate={fromDate}
        />
        <Button 
          variant="contained" 
          onClick={onFilter}
          sx={uiLayout.withUiSx({ marginInlineStart: 2 }, uiLayout.buttonSx)}
        >
          تطبيق
        </Button>
        <Button sx={uiLayout.buttonSx} 
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