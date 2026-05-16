import { Outlet } from "react-router-dom";
import Header from "../pages/Header";

export default function SearchLayout() {
  return (
    <div className=" bg-white">
      <Header />
      <Outlet />
    </div>
  );
}
