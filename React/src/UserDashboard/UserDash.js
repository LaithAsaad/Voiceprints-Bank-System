import Header from "../Components/Header"
import Navbar from "../Components/Navbar"
import "../init.css"
import "../Components/Navbar.css"
import "../AdminDashboard/dashboard.css"
import { Outlet } from "react-router-dom"

export default function UserDash() {
    return (
        <div >
            <Header />
            <Navbar />
            <div>
                <div className="row-container">
                    <div style={{ width: "100%" }}>
                        <Outlet />
                    </div>
                </div>

            </div>
        </div>
    )
}
