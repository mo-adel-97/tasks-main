import React from "react";
import { Grid } from "@mui/material";
import { motion } from "framer-motion";

// استيراد الكومبوننتات
import SalaryCard from "../cards/SalaryCard";
import DeductionsCard from "../cards/DeductionsCard";

const SalaryTab = ({ employeeData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SalaryCard data={employeeData.salary} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DeductionsCard data={employeeData.deductions} />
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default SalaryTab;