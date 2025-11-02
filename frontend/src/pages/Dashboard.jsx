import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    BanknotesIcon,
    ArrowTrendingUpIcon,
    ChartBarIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";
import Navbar from "../components/Navbar";
import { dashboardAPI } from "../services/api";
import { useToast } from "../hooks/useToast";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];

export const Dashboard = () => {
    const { showError } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        expenseData: [],
        incomeVsExpense: [],
        accountBalances: [],
        recentTransactions: [],
        topCategories: [],
        summary: { totalIncome: 0, totalExpense: 0, balance: 0 },
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await dashboardAPI.getStats();
            const data = response.data;

            // Format expense data for pie chart
            const expenseData = data.expenseData || [];

            // Format income vs expense data
            const incomeVsExpense = data.incomeVsExpense || [];

            // Format account balances
            const accountBalances = data.accountBalances || [];

            // Format recent transactions
            const recentTransactions = (data.recentTransactions || []).map((tx) => ({
                id: tx._id,
                name: tx.payee,
                amount: tx.type === "income" ? tx.amount : -tx.amount,
                date: new Date(tx.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
            }));

            // Format top categories
            const topCategories = data.topCategories || [];

            setStats({
                expenseData,
                incomeVsExpense,
                accountBalances,
                recentTransactions,
                topCategories,
                summary: data.summary || { totalIncome: 0, totalExpense: 0, balance: 0 },
            });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            showError("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-600">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <>
            <div className="flex bg-gray-50 min-h-screen">
                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="text-sm font-medium mb-2">Total Income</div>
                            <div className="text-3xl font-bold">₹{stats.summary.totalIncome.toFixed(2)}</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                            <div className="text-sm font-medium mb-2">Total Expenses</div>
                            <div className="text-3xl font-bold">₹{stats.summary.totalExpense.toFixed(2)}</div>
                        </div>
                        <div className={`bg-gradient-to-br ${stats.summary.balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} rounded-2xl p-6 text-white shadow-lg`}>
                            <div className="text-sm font-medium mb-2">Balance</div>
                            <div className="text-3xl font-bold">₹{stats.summary.balance.toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Expense Breakdown */}
                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold mb-2 flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-indigo-500" />
                                Expense Breakdown
                            </h2>
                            {stats.expenseData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={stats.expenseData}
                                            dataKey="value"
                                            nameKey="name"
                                            outerRadius={90}
                                            label
                                        >
                                            {stats.expenseData.map((entry, index) => (
                                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-400">
                                    No expense data available
                                </div>
                            )}
                        </div>

                        {/* Income vs Expense */}
                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold mb-2 flex items-center gap-2">
                                <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                                Income vs Expense
                            </h2>
                            {stats.incomeVsExpense.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={stats.incomeVsExpense}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="income" fill="#10b981" />
                                        <Bar dataKey="expense" fill="#ef4444" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-400">
                                    No data available
                                </div>
                            )}
                        </div>

                        {/* Monthly Spending Trend */}
                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold mb-2 flex items-center gap-2">
                                <BanknotesIcon className="w-5 h-5 text-blue-500" />
                                Spending Trends
                            </h2>
                            {stats.incomeVsExpense.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={stats.incomeVsExpense}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="expense" stroke="#6366f1" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-400">
                                    No data available
                                </div>
                            )}
                        </div>

                        {/* Account Balances */}
                        <div className="bg-white rounded-2xl shadow p-4 xl:col-span-1">
                            <h2 className="font-semibold mb-2 flex items-center gap-2">
                                <BanknotesIcon className="w-5 h-5 text-yellow-500" />
                                Account Balances
                            </h2>
                            {stats.accountBalances.length > 0 ? (
                                <ul className="space-y-2">
                                    {stats.accountBalances.map((acc, i) => (
                                        <li
                                            key={i}
                                            className="flex justify-between border-b pb-2 text-gray-700"
                                        >
                                            <span>{acc.name}</span>
                                            <span
                                                className={`font-semibold ${acc.balance < 0 ? "text-red-500" : "text-green-600"
                                                    }`}
                                            >
                                                ₹{acc.balance.toLocaleString()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-8 text-center text-gray-400">
                                    No accounts found
                                </div>
                            )}
                        </div>

                        {/* Top Categories */}
                        <div className="bg-white rounded-2xl shadow p-4 xl:col-span-1">
                            <h2 className="font-semibold mb-2 flex items-center gap-2">
                                <ChartBarIcon className="w-5 h-5 text-purple-500" />
                                Top Categories
                            </h2>
                            {stats.topCategories.length > 0 ? (
                                <ul className="space-y-2">
                                    {stats.topCategories.map((cat, i) => (
                                        <li
                                            key={i}
                                            className="flex justify-between border-b pb-2 text-gray-700"
                                        >
                                            <span>{cat.name}</span>
                                            <span>₹{cat.value.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-8 text-center text-gray-400">
                                    No categories found
                                </div>
                            )}
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-white rounded-2xl shadow p-4 xl:col-span-1">
                            <h2 className="font-semibold mb-2 flex items-center gap-2">
                                <ClockIcon className="w-5 h-5 text-gray-500" />
                                Recent Transactions
                            </h2>
                            {stats.recentTransactions.length > 0 ? (
                                <ul className="space-y-2">
                                    {stats.recentTransactions.map((tx) => (
                                        <li
                                            key={tx.id}
                                            className="flex justify-between border-b pb-2 text-gray-700"
                                        >
                                            <div>
                                                <p className="font-medium">{tx.name}</p>
                                                <p className="text-sm text-gray-400">{tx.date}</p>
                                            </div>
                                            <span
                                                className={`font-semibold ${tx.amount < 0 ? "text-red-500" : "text-green-600"
                                                    }`}
                                            >
                                                {tx.amount < 0 ? "-" : "+"}₹{Math.abs(tx.amount).toFixed(2)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-8 text-center text-gray-400">
                                    No recent transactions
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
