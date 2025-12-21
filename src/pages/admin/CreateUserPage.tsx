import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { createUserSchema } from '../../shared/schemas/admin.schema';

const CreateUserPage = () => {
  const navigate = useNavigate();

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      await api.post('/admin/users', values);
      toast.success('User created successfully!');
      navigate('/admin/users');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
      setSubmitting(false);
    }
  };

  // Auto-detect IMAP host based on email domain
  const detectImapHost = (email: string): string => {
    const domain = email.split('@')[1]?.toLowerCase();
    const imapHosts: { [key: string]: string } = {
      'gmail.com': 'imap.gmail.com',
      'yahoo.com': 'imap.mail.yahoo.com',
      'outlook.com': 'outlook.office365.com',
      'hotmail.com': 'outlook.office365.com',
      'live.com': 'outlook.office365.com',
      'icloud.com': 'imap.mail.me.com',
      'me.com': 'imap.mail.me.com',
      'aol.com': 'imap.aol.com',
    };
    return imapHosts[domain] || '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/users')}
            className="flex items-center text-indigo-600 hover:text-indigo-700 mb-2"
          >
            <span className="mr-2">←</span>
            <span>Back to Users</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
          <p className="text-gray-600 mt-1">Add a new user to the system</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm p-8">
        <Formik
          initialValues={{
            name: '',
            email: '',
            password: '',
            role: 'user',
            imap_host: '',
            imap_port: 993,
            imap_user: '',
            imap_password: '',
            use_ssl: true,
          }}
          validationSchema={createUserSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, setFieldValue }) => (
            <Form className="space-y-6">
              {/* User Information Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">👤</span>
                  User Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      onBlur={(e: any) => {
                        const email = e.target.value;
                        if (email && !values.imap_host) {
                          setFieldValue('imap_host', detectImapHost(email));
                          setFieldValue('imap_user', email);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="select"
                      name="role"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="user">👤 User</option>
                      <option value="admin">👨‍💼 Admin</option>
                    </Field>
                    <ErrorMessage
                      name="role"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* IMAP Configuration Section */}
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📧</span>
                  Email Account Configuration (Optional)
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Configure IMAP settings to automatically sync emails
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* IMAP Host */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IMAP Host
                    </label>
                    <Field
                      name="imap_host"
                      type="text"
                      placeholder="imap.gmail.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-detected for common providers
                    </p>
                  </div>

                  {/* IMAP Port */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IMAP Port
                    </label>
                    <Field
                      name="imap_port"
                      type="number"
                      placeholder="993"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {/* IMAP User */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IMAP Username
                    </label>
                    <Field
                      name="imap_user"
                      type="text"
                      placeholder="john@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usually the same as email
                    </p>
                  </div>

                  {/* IMAP Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IMAP Password
                    </label>
                    <Field
                      name="imap_password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      App password for Gmail/Outlook
                    </p>
                  </div>

                  {/* Use SSL */}
                  <div className="flex items-center">
                    <Field
                      name="use_ssl"
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Use SSL/TLS
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>➕</span>
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
          <span className="mr-2">ℹ️</span>
          Important Information
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>IMAP configuration is optional. You can add email accounts later.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>For Gmail, use an App Password instead of your regular password.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Admin users have full access to all system features.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Regular users can only manage their own emails and labels.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CreateUserPage;
