import React from "react";
import RegistrationRequestsPage from "../components/RegistrationRequestsPage";

const OnlineRegistrationRequests = () => (
  <RegistrationRequestsPage
    mode="online"
    title="طلبات دراسة عن بعد"
    subtitle="عرض طلبات الدراسة عن بعد خلال الفترة المحددة"
    exportFileName="تقرير تسجيلات عن بعد الموقع.xlsx"
  />
);

export default OnlineRegistrationRequests;
