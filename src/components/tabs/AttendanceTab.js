import React from "react";
import { Grid } from "@mui/material";
import { motion } from "framer-motion";

// استيراد الكومبوننتات
import AttendanceCard from "../cards/AttendanceCard";
import DeductionsCard from "../cards/DeductionsCard";

const AttendanceTab = ({ employeeData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <AttendanceCard data={employeeData.attendance} />
        </Grid>
        <Grid item xs={12} md={4}>
          <DeductionsCard data={employeeData.deductions} />
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default AttendanceTab;