import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./Management/ProtectedRoute";
import Dashboard from "./AdminDashboard/Dashboard";
import Login from "./Authentication/Login";
import PersistLogin from "./Management/PersistLogin";
import Users from "./AdminDashboard/Users";
import EditUser from "./AdminDashboard/EditUser";
import AddUser from "./AdminDashboard/AddUser";
import FolderSelector from "./AdminDashboard/FolderSelector";
import UserDash from "./UserDashboard/UserDash";
import MultiFileUploader from "./Pages/MultiFileUploader";
import AdminHome from "./AdminDashboard/AdminHome";
import UserHome from "./UserDashboard/UserHome";
import Landing from "./Pages/Landing"
import Search from "./Pages/Search"
import SearchDetails from "./Pages/SearchDetails"


export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Landing />}></Route>
        <Route path="/login" element={<Login />} />
        <Route path="/res" element={<SearchDetails />}></Route>
        <Route element={<PersistLogin />}>

          <Route element={<ProtectedRoute isAdminRoute={true} />}>
            <Route path="/dashboard" element={<Dashboard />}>
              <Route path="home" element={<AdminHome />} />
              <Route path="users" element={<Users />} />
              <Route path="users/:id" element={<EditUser />} />
              <Route path="users/add" element={<AddUser />} />
              <Route path="settings" element={<FolderSelector />} />
              <Route path="upload" element={<MultiFileUploader />} />
              <Route path="search" element={<Search />} />
            </Route>
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard/user" element={<UserDash />} >
              <Route path="home" element={<UserHome />} />
              <Route path="upload" element={<MultiFileUploader />} />
              <Route path="search" element={<Search />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </div>
  );
}
