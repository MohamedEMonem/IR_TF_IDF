import { Outlet } from "react-router-dom";
import Footer from "../pages/Footer";
import HeaderUpload from "../pages/HeaderUpload";

export default function HomeLayout() {
  return (
    <div className=" bg-white">
      <HeaderUpload />

      <Outlet />
      <Footer />
    </div>
  );
}
