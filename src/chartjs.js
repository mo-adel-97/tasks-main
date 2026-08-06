// src/chartjs.js
import { Chart as ChartJS, registerables } from 'chart.js';

let registered = false;

export function getChart() {
  if (!registered) {
    ChartJS.register(...registerables);
    registered = true;
  }
  return ChartJS;
}
