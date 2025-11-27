import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

interface EmailAccount {
    id: number;
    email: string;
    account_name: string;
    provider_type: string;
    status: string;
    last_sync: string;
    created_at: string;
}

interface AdminUserAccountManagerProps {
    user: User;
    onClose: () => void;
}

// IMAP provider auto-detection
const IMAP_CONFIGS: Record<string, { host: string; port: number }> = {
    'gmail.com': { host: 'imap.gmail.com', port: 993 },
    'outlook.com': { host: 'outlook.office365.com', port: 993 },
    'hotmail.com': { host: 'outlook.office365.com', port: 993 },
    'yahoo.com': { host: 'imap.mail.yahoo.com', port: 993 },
    'icloud.com': { host: 'imap.mail.me.com', port: 993 },
};

const detectImapConfig = (email: string) => {
    const domain = email.split('@')[1];
    return IMAP_CONFIGS[domain] || { host: '', port: 993 };
};

export default function AdminUserAccountManager({ user, onClose }: AdminUserAccountManagerProps) {
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [providerType, setProviderType] = useState<'gmail' | 'imap'>('imap');
    const [email, setEmail] = useState('');
    const [accountName, setAccountName] = useState('');
    const [imapHost, setImapHost] = useState('');
    const [imapPort, setImapPort] = useState(993);
    const [imapPassword, setImapPassword] = useState('');
    const [gmailClientId, setGmailClientId] = useState('');
    const [gmailClientSecret, setGmailClientSecret] = useState('');
    const [gmailRefreshToken, setGmailRefreshToken] = useState('');

    useEffect(() => {
        loadAccounts();
    }, [user.id]);

    useEffect(() => {
        // Auto-detect IMAP config when email changes
        if (email && providerType === 'imap') {
            const config = detectImapConfig(email);
            setImapHost(config.host);
            setImapPort(config.port);
        }
    }, [email, providerType]);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/users/${user.id}/accounts`);
            setAccounts(response.data.data || []);
        } catch (error) {
            console.error('Failed to load accounts:', error);
            setError('Failed to load user accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const accountData: any = {
                email,
                account_name: accountName,
                provider_type: providerType,
                auto_fetch: true,
                fetch_interval: 15,
                enable_ai_labeling: true,
                monitored_labels: ['INBOX'],
            };

            if (providerType === 'gmail') {
                accountData.oauth_client_id = gmailClientId;
                accountData.oauth_client_secret = gmailClientSecret;
                accountData.oauth_refresh_token = gmailRefreshToken;
            } else {
                accountData.imap_host = imapHost;
                accountData.imap_port = imapPort;
                accountData.imap_username = email;
                accountData.imap_password = imapPassword;
            }

            await api.post(`/admin/users/${user.id}/accounts`, accountData);
            setSuccess('Email account added successfully!');
            setShowAddForm(false);
            resetForm();
            loadAccounts();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to add email account');
        }
    };

    const handleDeleteAccount = async (accountId: number) => {
        if (!confirm('Are you sure you want to delete this email account?')) return;

        try {
            await api.delete(`/admin/users/${user.id}/accounts/${accountId}`);
            setSuccess('Email account deleted successfully');
            loadAccounts();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to delete account');
        }
    };

    const resetForm = () => {
        setEmail('');
        setAccountName('');
        setImapHost('');
        setImapPort(993);
        setImapPassword('');
        setGmailClientId('');
        setGmailClientSecret('');
        setGmailRefreshToken('');
        setProviderType('imap');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            Manage Email Accounts
                        </h2>
                        <p className="text-slate-400 text-sm">
                            User: <span className="font-semibold text-slate-300">{user.name}</span> ({user.email})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                    >
                        ✕ Close
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Alert Messages */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
                            {success}
                        </div>
                    )}

                    {/* Add Account Button */}
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full mb-6 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">➕</span> Add Email Account for {user.name}
                        </button>
                    )}

                    {/* Add Account Form */}
                    {showAddForm && (
                        <div className="mb-6 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Add New Email Account</h3>
                                <button
                                    onClick={() => {
                                        setShowAddForm(false);
                                        resetForm();
                                    }}
                                    className="text-slate-400 hover:text-white transition"
                                >
                                    ✕ Cancel
                                </button>
                            </div>

                            <form onSubmit={handleAddAccount} className="space-y-4">
                                {/* Provider Type */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Provider Type
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="imap"
                                                checked={providerType === 'imap'}
                                                onChange={(e) => setProviderType(e.target.value as 'imap')}
                                                className="form-radio text-blue-600"
                                            />
                                            <span className="text-white">IMAP (Password)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                value="gmail"
                                                checked={providerType === 'gmail'}
                                                onChange={(e) => setProviderType(e.target.value as 'gmail')}
                                                className="form-radio text-blue-600"
                                            />
                                            <span className="text-white">Gmail (OAuth)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="user@example.com"
                                    />
                                </div>

                                {/* Account Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Account Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Work Email"
                                    />
                                </div>

                                {/* IMAP Fields */}
                                {providerType === 'imap' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                    IMAP Host *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={imapHost}
                                                    onChange={(e) => setImapHost(e.target.value)}
                                                    required
                                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="imap.gmail.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                    IMAP Port *
                                                </label>
                                                <input
                                                    type="number"
                                                    value={imapPort}
                                                    onChange={(e) => setImapPort(parseInt(e.target.value))}
                                                    required
                                                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="993"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                IMAP Password / App Password *
                                            </label>
                                            <input
                                                type="password"
                                                value={imapPassword}
                                                onChange={(e) => setImapPassword(e.target.value)}
                                                required
                                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="••••••••"
                                            />
                                            <p className="text-xs text-slate-400 mt-1">
                                                For Gmail, use an App Password (not your regular password)
                                            </p>
                                        </div>
                                    </>
                                )}

                                {/* Gmail OAuth Fields */}
                                {providerType === 'gmail' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                OAuth Client ID *
                                            </label>
                                            <input
                                                type="text"
                                                value={gmailClientId}
                                                onChange={(e) => setGmailClientId(e.target.value)}
                                                required
                                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                OAuth Client Secret *
                                            </label>
                                            <input
                                                type="password"
                                                value={gmailClientSecret}
                                                onChange={(e) => setGmailClientSecret(e.target.value)}
                                                required
                                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                OAuth Refresh Token *
                                            </label>
                                            <input
                                                type="password"
                                                value={gmailRefreshToken}
                                                onChange={(e) => setGmailRefreshToken(e.target.value)}
                                                required
                                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
                                >
                                    ✅ Add Account
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Accounts List */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">
                            {user.name}'s Email Accounts ({accounts.length})
                        </h3>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                <p className="text-slate-400">Loading accounts...</p>
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="text-center py-12 px-5 text-slate-400">
                                <span className="text-6xl mb-4 block">📧</span>
                                <p className="text-lg font-medium">No email accounts yet</p>
                                <p className="text-sm mt-2">Add an email account to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {accounts.map((account) => (
                                    <div
                                        key={account.id}
                                        className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="text-lg font-semibold text-white">
                                                        {account.account_name}
                                                    </h4>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        account.status === 'connected'
                                                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                            : account.status === 'pending'
                                                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    }`}>
                                                        {account.status.toUpperCase()}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        account.provider_type === 'gmail'
                                                            ? 'bg-blue-500/20 text-blue-300'
                                                            : 'bg-purple-500/20 text-purple-300'
                                                    }`}>
                                                        {account.provider_type.toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="text-slate-300 mb-1">📧 {account.email}</p>
                                                {account.last_sync && (
                                                    <p className="text-sm text-slate-400">
                                                        Last synced: {new Date(account.last_sync).toLocaleString()}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Added: {new Date(account.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAccount(account.id)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-semibold"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
