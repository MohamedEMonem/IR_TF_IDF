import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import HomeLayout from "../layout/HomeLayout";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Define your routes here */}
      <Route path="/" element={<HomeLayout />}>
        <Route index element={<Home />} />
      </Route>
    </Routes>
  );
}
