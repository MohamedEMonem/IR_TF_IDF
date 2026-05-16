import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import HomeLayout from "../layout/HomeLayout";
import SearchLayout from "../layout/SearchLayout";
import Search from "../pages/Search";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Define your routes here */}
      <Route path="/" element={<HomeLayout />}>
        <Route index element={<Home />} />
        <Route path="/search" element={<SearchLayout />}>
          <Route index element={<Search />} />
        </Route>
      </Route>
    </Routes>
  );
}
