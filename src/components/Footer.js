import React from "react";

const footerStyle = {
  position: "fixed",
  left: 0,
  bottom: 0,
  width: "100%",
  zIndex: 2000,
  background: "linear-gradient(90deg, #2c3e50, #3498db 80%)",
  padding: "10px 0",
};

export default function Footer() {
  const text = "تم تطويره بواسطة فريق الدعم الفني وتطوير البرمجيات ";

  return (
    <footer style={footerStyle}>
      <div
        style={{
          direction: "rtl",
          textAlign: "center",
          width: "100%",
          fontWeight: "bold",
          fontSize: "1rem",
          color: "#fff",
          fontFamily: "Cairo, sans-serif",
          letterSpacing: "0.5px",
        }}
      >
        {text}
      </div>
    </footer>
  );
}
