import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="text-8xl mb-4">🚫</div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Access Denied</h1>
                    <p className="text-gray-600 text-lg">
                        You don't have permission to access this page.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <p className="text-gray-700 mb-4">
                        This page is restricted to administrators only. If you believe you should have access, please contact your system administrator.
                    </p>
                </div>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                    >
                        ← Back to Home
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                    >
                        Login as Different User
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
