import { Formik, Form, Field, ErrorMessage } from 'formik';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../store/authApi';
import { useAppDispatch } from '../../../shared/hooks/redux';
import { setCredentials } from '../store/authSlice';
import { loginSchema } from '../../../shared/schemas/auth.schema';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [login, { isLoading }] = useLoginMutation();
    const dispatch = useAppDispatch();

    const handleSubmit = async (values: { email: string; password: string }, { setFieldError }: any) => {
        try {
            const response = await login(values).unwrap();
            const responseData = response.data || response;

            dispatch(setCredentials({
                user: responseData.user,
                token: responseData.token,
            }));

            // Redirect based on role
            if (responseData.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setFieldError('email', err.data?.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 z-10 items-center">
                {/* Left Side: Hero Content */}
                <div className="text-white space-y-8 animate-fade-in-up">
                    <div>
                        <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-semibold mb-6 backdrop-blur-sm">
                            ✨ Next Gen Email Management
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-200">
                            Email RAG <br />
                            <span className="text-blue-500">Intelligence</span>
                        </h1>
                        <p className="text-lg text-blue-100/80 max-w-xl leading-relaxed">
                            Transform your inbox with AI-powered classification, smart reminders, and automated meeting tracking.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { icon: '🤖', title: 'Smart Classification', desc: 'AI-driven email categorization' },
                            { icon: '⚡', title: 'Urgent Detection', desc: 'Never miss critical updates' },
                            { icon: '📝', title: 'MoM Tracking', desc: 'Automated meeting minutes' },
                            { icon: '📊', title: 'Analytics', desc: 'Insightful email statistics' },
                        ].map((feature, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                                <div className="text-2xl mb-2">{feature.icon}</div>
                                <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                                <p className="text-sm text-blue-200/60">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Login Card */}
                <div className="flex justify-center lg:justify-end">
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl relative">
                        <div className="absolute -top-12 -right-12 text-9xl opacity-10 rotate-12 pointer-events-none">
                            📧
                        </div>

                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-blue-200/70">Sign in to access your dashboard</p>
                            <p className="text-xs text-blue-300/60 mt-2">Contact your administrator to create an account</p>
                        </div>

                        <Formik
                            initialValues={{ email: '', password: '' }}
                            validationSchema={loginSchema}
                            onSubmit={handleSubmit}
                        >
                            {({ errors, touched }) => (
                                <Form className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-bold text-blue-200 mb-2">
                                            Email Address
                                        </label>
                                        <Field
                                            id="email"
                                            name="email"
                                            type="email"
                                            className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.email && touched.email ? 'border-red-500' : 'border-white/20'
                                                } text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm`}
                                            placeholder="your@email.com"
                                        />
                                        <ErrorMessage name="email" component="div" className="text-red-400 text-sm mt-1" />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-bold text-blue-200 mb-2">
                                            Password
                                        </label>
                                        <Field
                                            id="password"
                                            name="password"
                                            type="password"
                                            className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${errors.password && touched.password ? 'border-red-500' : 'border-white/20'
                                                } text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm`}
                                            placeholder="••••••••"
                                        />
                                        <ErrorMessage name="password" component="div" className="text-red-400 text-sm mt-1" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full group relative flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xl">🔐</span>
                                                Sign In
                                            </>
                                        )}
                                    </button>
                                </Form>
                            )}
                        </Formik>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-blue-200/40">
                                By signing in, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
