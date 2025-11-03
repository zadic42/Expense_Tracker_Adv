import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import GoogleOAuthButton from '../components/GoogleOAuthButton'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

const UserLogin = () => {
    const navigate = useNavigate()
    const { login, isAuthenticated } = useAuth()
    const { showSuccess, showError } = useToast()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard')
        }
    }, [isAuthenticated, navigate])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const result = await login(formData.email, formData.password)
        
        if (result.success) {
            showSuccess('Login successful!')
            navigate('/dashboard')
        } else {
            showError(result.message || 'Login failed')
        }
        
        setLoading(false)
    }

    // Google OAuth login is handled by the GoogleOAuthButton component

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10  rounded-2xl">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link to="/signup" className="font-medium text-lg text-blue-600 hover:text-blue-500">
                            create a new account
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Email address"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Password"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg'
                                }`}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>

                        <p className="mt-2 text-center text-sm text-gray-600">
                            <Link to="/forgot-password" className="font-medium text-sm text-blue-600 hover:text-blue-500">
                                Forgot Password?
                            </Link>
                        </p>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <GoogleOAuthButton />
                    </div>
                </form>
            </div>
        </div>
    )
}

export default UserLogin
