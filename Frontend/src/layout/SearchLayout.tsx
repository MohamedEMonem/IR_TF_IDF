import { Outlet } from "react-router-dom";
import Header from "../pages/Header";
import Footer from "../pages/Footer";

export default function SearchLayout() {
  return (
    <div className=" bg-white">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}
