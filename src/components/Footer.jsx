import React from "react";
import { FaHeart, FaBolt } from "react-icons/fa"; // Importing icons from react-icons

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <p style={textStyle}>
        Designed with <FaHeart style={heartStyle} /> by dixitk941 | Powered by <FaBolt style={boltStyle} /> AINOR | Mayank Sharma
      </p>
    </footer>
  );
};

const footerStyle = {
  textAlign: "center",
  padding: "1em",
  background: "linear-gradient(90deg, #f3f4f6, #e2e8f0)",
  color: "#333",
  boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const textStyle = {
  margin: 0,
  fontSize: "1em",
  fontFamily: "'Roboto', sans-serif",
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: "0.5em",
  padding: "0 1em",
  flexWrap: "wrap",
};

const heartStyle = {
  color: "red",
  animation: "pulse 1s infinite",
};

const boltStyle = {
  color: "orange",
  animation: "flash 1.5s infinite",
};

export default Footer;