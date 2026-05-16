import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import HomeLayout from "../layout/HomeLayout";
import SearchLayout from "../layout/SearchLayout";
import Search from "../pages/Search";
import Upload from "../pages/Upload";
import UploadLayout from "../layout/UploadLayout";

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
      <Route path="/upload" element={<UploadLayout />}>
        <Route index element={<Upload />} />
      </Route>
    </Routes>
  );
}
