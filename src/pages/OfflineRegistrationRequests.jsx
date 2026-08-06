import React from "react";
import RegistrationRequestsPage from "../components/RegistrationRequestsPage";

const OfflineRegistrationRequests = () => (
  <RegistrationRequestsPage
    mode="offline"
    title="طلبات الدراسة الحضوري"
    subtitle="عرض طلبات الدراسة الحضوري خلال الفترة المحددة"
    exportFileName="تقرير تسجيلات حضوري الموقع.csv"
  />
);

export default OfflineRegistrationRequests;
