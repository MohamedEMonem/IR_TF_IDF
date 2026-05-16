import { Outlet } from "react-router-dom";
import Footer from "../pages/Footer";
import UploadHeader from "../pages/uploadHeader";

export default function UploadLayout() {
  return (
    <div className=" bg-white">
      <UploadHeader />
      <Outlet />
      <Footer />
    </div>
  );
}
