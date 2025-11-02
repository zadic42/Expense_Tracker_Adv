import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ArrowsRightLeftIcon,
  WalletIcon,
  ChartBarIcon,
  FolderIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/dashboard' },
    { name: 'Transactions', icon: ArrowsRightLeftIcon, path: '/transaction-management' },
    { name: 'Accounts', icon: WalletIcon, path: '/accounts' },
    { name: 'Budgets', icon: ChartBarIcon, path: '/budgets' },
    { name: 'Data Management', icon: FolderIcon, path: '/data-management' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/settings' },
  ]

  return (
    <div className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-40 transition-all duration-300 ${isOpen ? 'w-48' : 'w-16'}`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-4 top-6 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isOpen ? (
          <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Navigation Items */}
      <nav className="h-full overflow-y-auto py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className={`${isOpen ? 'h-5 w-5 mr-3' : 'h-6 w-6 mx-auto'} ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
              {isOpen && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default Sidebar
