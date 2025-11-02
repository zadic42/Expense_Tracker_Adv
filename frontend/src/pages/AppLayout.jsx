import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import TransactionManager from "./Transaction";
import { Dashboard } from "./Dashboard";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import MultiAccountManager from "./MultiAccountManager";
import DataManagement from "./DataManagement";
import SettingsDashboard from "./Settings";
import BudgetManagement from "./BudgetManagement";


export const AppLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <>
            <Navbar />
            <div className="flex min-h-screen bg-white">
                {/* Sidebar */}
                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                {/* Main Content */}
                <div
                    className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-48" : "ml-16"
                        }`}
                >
                    <div className="p-6">
                        <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/transaction-management" element={<TransactionManager />} />
                            <Route path="/accounts" element={<MultiAccountManager />} />
                            <Route path="/budgets" element={<BudgetManagement />} />
                            <Route path="/data-management" element={<DataManagement />} />
                            <Route path="/settings" element={<SettingsDashboard />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </>
    );
};
