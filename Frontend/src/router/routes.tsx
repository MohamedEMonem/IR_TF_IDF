import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Define your routes here */}
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
