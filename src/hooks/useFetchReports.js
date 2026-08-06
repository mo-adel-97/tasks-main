import { useState, useEffect } from 'react';
import { format } from 'date-fns'; // Add this import

const useFetchReports = (branchGuid, selectedDate) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    if (!branchGuid) {
      setError('Branch information not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let url = `https://filesregsiteration.sstli.com/get_reports_by_branch.php?branch_guid=${branchGuid}`;
      
      if (selectedDate) {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        url += `&report_date=${formattedDate}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch reports');
      }

      setReports(data.reports);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchGuid) {
      fetchReports();
    }
  }, [branchGuid, selectedDate]);

  return { reports, loading, error, fetchReports };
};

export default useFetchReports;