import { Outlet } from "react-router-dom";
import Footer from "../pages/Footer";

export default function HomeLayout() {
  return (
    <div className=" bg-white">
      <Outlet />
      <Footer />
    </div>
  );
}
