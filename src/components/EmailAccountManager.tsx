import { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import styles from './EmailAccountManager.module.css';

const API_URL = 'http://localhost:4000/api';

interface EmailAccount {
  id?: number;
  email: string;
  accountName: string;
  autoFetch: boolean;
  fetchInterval: number;
  enableAILabeling: boolean;
  customLabels: string[];
  monitoredLabels: string[];
  status: 'pending' | 'connected' | 'error';
  providerType: 'gmail' | 'imap';
  lastSync?: string;
}

// IMAP provider auto-detection
const IMAP_CONFIGS: Record<string, { host: string; port: number }> = {
  'gmail.com': { host: 'imap.gmail.com', port: 993 },
  'outlook.com': { host: 'outlook.office365.com', port: 993 },
  'hotmail.com': { host: 'outlook.office365.com', port: 993 },
  'yahoo.com': { host: 'imap.mail.yahoo.com', port: 993 },
  'icloud.com': { host: 'imap.mail.me.com', port: 993 },
};

// Validation schema
const accountValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  accountName: Yup.string()
    .min(2, 'Account name must be at least 2 characters')
    .required('Account name is required'),
  providerType: Yup.string()
    .oneOf(['gmail', 'imap'], 'Invalid provider type')
    .required('Provider type is required'),
  autoFetch: Yup.boolean(),
  fetchInterval: Yup.number()
    .min(5, 'Fetch interval must be at least 5 minutes')
    .max(1440, 'Fetch interval cannot exceed 1440 minutes (24 hours)'),
  enableAILabeling: Yup.boolean(),
  monitoredLabels: Yup.array().min(1, 'At least one label must be monitored'),

  // Gmail fields
  oauthClientId: Yup.string().when('providerType', {
    is: 'gmail',
    then: (schema) => schema.required('Client ID is required for Gmail'),
  }),
  oauthClientSecret: Yup.string().when('providerType', {
    is: 'gmail',
    then: (schema) => schema.required('Client Secret is required for Gmail'),
  }),
  oauthRefreshToken: Yup.string().when('providerType', {
    is: 'gmail',
    then: (schema) => schema.required('Refresh Token is required for Gmail'),
  }),

  // IMAP fields
  imapHost: Yup.string().when('providerType', {
    is: 'imap',
    then: (schema) => schema.required('IMAP Host is required'),
  }),
  imapPort: Yup.number().when('providerType', {
    is: 'imap',
    then: (schema) => schema.required('IMAP Port is required').positive('Port must be positive'),
  }),
  imapPassword: Yup.string().when('providerType', {
    is: 'imap',
    then: (schema) => schema.required('Password is required for IMAP'),
  }),
});

export default function EmailAccountManager() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [monitoredLabel, setMonitoredLabel] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/accounts`);
      setAccounts(response.data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleFetchEmails = async (accountId: number) => {
    try {
      const response = await axios.get(`${API_URL}/accounts/${accountId}/fetch`);
      alert(`✅ Fetched ${response.data.fetched} emails!`);
      loadAccounts();
    } catch (error: any) {
      alert('Failed to fetch emails: ' + error.message);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to remove this email account?')) return;

    try {
      await axios.delete(`${API_URL}/accounts/${accountId}`);
      loadAccounts();
    } catch (error: any) {
      alert('Failed to delete account: ' + error.message);
    }
  };

  const initialValues = {
    email: '',
    accountName: '',
    autoFetch: true,
    fetchInterval: 15,
    enableAILabeling: true,
    customLabels: [],
    monitoredLabels: ['INBOX'],
    providerType: 'gmail' as 'gmail' | 'imap',
    oauthClientId: '',
    oauthClientSecret: '',
    oauthRefreshToken: '',
    imapHost: '',
    imapPort: 993,
    imapUsername: '',
    imapPassword: '',
  };

  const handleSubmit = async (values: any, { setSubmitting, setFieldError, resetForm }: any) => {
    try {
      const accountData: any = {
        email: values.email,
        accountName: values.accountName,
        autoFetch: values.autoFetch,
        fetchInterval: values.fetchInterval,
        enableAILabeling: values.enableAILabeling,
        customLabels: values.customLabels,
        monitoredLabels: values.monitoredLabels,
        providerType: values.providerType,
      };

      if (values.providerType === 'gmail') {
        accountData.oauthClientId = values.oauthClientId;
        accountData.oauthClientSecret = values.oauthClientSecret;
        accountData.oauthRefreshToken = values.oauthRefreshToken;
      } else {
        accountData.imapHost = values.imapHost;
        accountData.imapPort = values.imapPort;
        accountData.imapUsername = values.imapUsername || values.email;
        accountData.imapPassword = values.imapPassword;
      }

      await axios.post(`${API_URL}/accounts`, accountData);
      alert('✅ Email account added successfully!');
      setShowAddForm(false);
      resetForm();
      loadAccounts();
    } catch (error: any) {
      setFieldError('general', error.response?.data?.error || error.message || 'Failed to add account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Email Account Management</h2>
        <button
          className={styles.addButton}
          onClick={() => setShowAddForm(true)}
        >
          + Add Email Account
        </button>
      </div>

      {showAddForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Email Account</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>

            <Formik
              initialValues={initialValues}
              validationSchema={accountValidationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, errors, setFieldValue, isSubmitting }) => (
                <Form>
                  <div className={styles.formContainer}>
                    {errors.general && (
                      <div className={styles.alertBox}>{errors.general}</div>
                    )}

                    {/* Provider Type */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Provider Type *</label>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}>
                          <Field type="radio" name="providerType" value="gmail" />
                          <span>Gmail (OAuth)</span>
                        </label>
                        <label className={styles.radioLabel}>
                          <Field type="radio" name="providerType" value="imap" />
                          <span>IMAP (Outlook, Yahoo, etc.)</span>
                        </label>
                      </div>
                      <ErrorMessage name="providerType" component="div" className={styles.errorMessage} />
                    </div>

                    {/* Email */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email Address *</label>
                      <Field
                        type="email"
                        name="email"
                        className={styles.input}
                        placeholder="user@example.com"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFieldValue('email', e.target.value);
                          // Auto-detect IMAP settings
                          if (values.providerType === 'imap') {
                            const domain = e.target.value.split('@')[1]?.toLowerCase();
                            if (domain && IMAP_CONFIGS[domain]) {
                              setFieldValue('imapHost', IMAP_CONFIGS[domain].host);
                              setFieldValue('imapPort', IMAP_CONFIGS[domain].port);
                              setFieldValue('imapUsername', e.target.value);
                            }
                          }
                        }}
                      />
                      <ErrorMessage name="email" component="div" className={styles.errorMessage} />
                    </div>

                    {/* Account Name */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Account Name *</label>
                      <Field
                        type="text"
                        name="accountName"
                        className={styles.input}
                        placeholder="Work Email, Personal, etc."
                      />
                      <ErrorMessage name="accountName" component="div" className={styles.errorMessage} />
                    </div>

                    {/* Gmail OAuth Fields */}
                    {values.providerType === 'gmail' && (
                      <div className={`${styles.providerSection} ${styles.gmailSection}`}>
                        <h4 className={styles.sectionTitle}>Gmail OAuth Credentials</h4>
                        <p className={styles.helperText}>
                          Generate these credentials from your Google Cloud Console and OAuth Playground.
                        </p>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Client ID *</label>
                          <Field
                            type="text"
                            name="oauthClientId"
                            className={styles.input}
                            placeholder="xxxxx.apps.googleusercontent.com"
                          />
                          <ErrorMessage name="oauthClientId" component="div" className={styles.errorMessage} />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Client Secret *</label>
                          <Field
                            type="password"
                            name="oauthClientSecret"
                            className={styles.input}
                            placeholder="Your OAuth Client Secret"
                          />
                          <ErrorMessage name="oauthClientSecret" component="div" className={styles.errorMessage} />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>Refresh Token *</label>
                          <Field
                            as="textarea"
                            name="oauthRefreshToken"
                            className={styles.textarea}
                            rows={3}
                            placeholder="Your OAuth Refresh Token"
                          />
                          <ErrorMessage name="oauthRefreshToken" component="div" className={styles.errorMessage} />
                        </div>
                      </div>
                    )}

                    {/* IMAP Fields */}
                    {values.providerType === 'imap' && (
                      <div className={`${styles.providerSection} ${styles.imapSection}`}>
                        <h4 className={styles.sectionTitle}>IMAP Credentials</h4>
                        <p className={styles.helperText}>
                          Use app-specific password for better security. Settings auto-detected for common providers.
                        </p>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>IMAP Host *</label>
                          <Field
                            type="text"
                            name="imapHost"
                            className={styles.input}
                            placeholder="imap.example.com"
                          />
                          <ErrorMessage name="imapHost" component="div" className={styles.errorMessage} />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>IMAP Port *</label>
                          <Field
                            type="number"
                            name="imapPort"
                            className={styles.input}
                          />
                          <ErrorMessage name="imapPort" component="div" className={styles.errorMessage} />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>IMAP Username</label>
                          <Field
                            type="text"
                            name="imapUsername"
                            className={styles.input}
                            placeholder="Usually same as email"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.label}>App Password *</label>
                          <Field
                            type="password"
                            name="imapPassword"
                            className={styles.input}
                            placeholder="Your app-specific password"
                          />
                          <ErrorMessage name="imapPassword" component="div" className={styles.errorMessage} />
                        </div>
                      </div>
                    )}

                    {/* Monitored Labels */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Labels/Folders to Monitor *</label>
                      <p className={styles.helperText}>
                        Specify which labels or folders to extract emails from (e.g., INBOX, Orders, etc.)
                      </p>
                      <div className={styles.tagContainer}>
                        <input
                          type="text"
                          className={`${styles.input} ${styles.tagInput}`}
                          placeholder="Add label (e.g., INBOX, Orders)"
                          value={monitoredLabel}
                          onChange={(e) => setMonitoredLabel(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (monitoredLabel.trim() && !values.monitoredLabels.includes(monitoredLabel.trim())) {
                                setFieldValue('monitoredLabels', [...values.monitoredLabels, monitoredLabel.trim()]);
                                setMonitoredLabel('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className={styles.addTagButton}
                          onClick={() => {
                            if (monitoredLabel.trim() && !values.monitoredLabels.includes(monitoredLabel.trim())) {
                              setFieldValue('monitoredLabels', [...values.monitoredLabels, monitoredLabel.trim()]);
                              setMonitoredLabel('');
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div className={styles.tags}>
                        {values.monitoredLabels.map((label: string, idx: number) => (
                          <span key={idx} className={styles.tag}>
                            {label}
                            {values.monitoredLabels.length > 1 && (
                              <button
                                type="button"
                                className={styles.removeTagButton}
                                onClick={() => {
                                  setFieldValue('monitoredLabels', values.monitoredLabels.filter((l: string) => l !== label));
                                }}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      <ErrorMessage name="monitoredLabels" component="div" className={styles.errorMessage} />
                    </div>

                    {/* Auto Fetch */}
                    <div className={styles.formGroup}>
                      <label className={styles.checkbox}>
                        <Field type="checkbox" name="autoFetch" />
                        <span>Auto-fetch emails periodically</span>
                      </label>
                    </div>

                    {values.autoFetch && (
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Fetch Interval (minutes)</label>
                        <Field
                          type="number"
                          name="fetchInterval"
                          className={styles.input}
                          min="5"
                          max="1440"
                        />
                        <ErrorMessage name="fetchInterval" component="div" className={styles.errorMessage} />
                      </div>
                    )}

                    {/* AI Labeling */}
                    <div className={styles.formGroup}>
                      <label className={styles.checkbox}>
                        <Field type="checkbox" name="enableAILabeling" />
                        <span>Enable AI-powered labeling</span>
                      </label>
                    </div>

                    {/* Custom Labels */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Custom Labels (Optional)</label>
                      <div className={styles.tagContainer}>
                        <input
                          type="text"
                          className={`${styles.input} ${styles.tagInput}`}
                          placeholder="Add custom label"
                          value={customLabel}
                          onChange={(e) => setCustomLabel(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customLabel.trim() && !values.customLabels.includes(customLabel.trim())) {
                                setFieldValue('customLabels', [...values.customLabels, customLabel.trim()]);
                                setCustomLabel('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className={styles.addTagButton}
                          onClick={() => {
                            if (customLabel.trim() && !values.customLabels.includes(customLabel.trim())) {
                              setFieldValue('customLabels', [...values.customLabels, customLabel.trim()]);
                              setCustomLabel('');
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                      <div className={styles.tags}>
                        {values.customLabels.map((label: string, idx: number) => (
                          <span key={idx} className={styles.tag}>
                            {label}
                            <button
                              type="button"
                              className={styles.removeTagButton}
                              onClick={() => {
                                setFieldValue('customLabels', values.customLabels.filter((l: string) => l !== label));
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.modalFooter}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setShowAddForm(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Account'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className={styles.accountsGrid}>
        {accounts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>📧</div>
              <h3 className={styles.emptyTitle}>No email accounts connected</h3>
              <p className={styles.emptyText}>Add your first email account to start managing emails with AI</p>
            </div>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className={styles.accountCard}>
              <div className={styles.accountHeader}>
                <div className={styles.accountInfo}>
                  <h4>
                    <span style={{ fontSize: '1.5rem' }}>
                      {account.providerType === 'gmail' ? '📧' : '📨'}
                    </span>
                    {account.accountName}
                  </h4>
                  <p>{account.email}</p>
                  <span>{account.providerType === 'gmail' ? 'Gmail OAuth' : 'IMAP Protocol'}</span>
                </div>
                <div className={`${styles.statusBadge} ${
                  account.status === 'connected' ? styles.statusConnected :
                  account.status === 'pending' ? styles.statusPending :
                  styles.statusError
                }`}>
                  {account.status === 'connected' && '✓ Connected'}
                  {account.status === 'pending' && '⏳ Pending'}
                  {account.status === 'error' && '⚠ Error'}
                </div>
              </div>

              <div className={styles.accountDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>⚡ Auto-fetch:</span>
                  <span className={styles.detailValue}>
                    {account.autoFetch ? `Every ${account.fetchInterval} min` : 'Manual'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>🤖 AI Labeling:</span>
                  <span className={styles.detailValue}>
                    {account.enableAILabeling ? 'Enabled ✓' : 'Disabled'}
                  </span>
                </div>
                {account.monitoredLabels?.length > 0 && (
                  <div className={styles.monitoringSection}>
                    <span className={styles.monitoringLabel}>📂 Monitoring:</span>
                    <div className={styles.monitoredTags}>
                      {account.monitoredLabels.map((label, idx) => (
                        <span key={idx} className={styles.monitoredTag}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {account.lastSync && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>🕐 Last Sync:</span>
                    <span className={styles.detailValue}>
                      {new Date(account.lastSync).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.accountActions}>
                {account.status === 'connected' && (
                  <button
                    className={styles.fetchButton}
                    onClick={() => handleFetchEmails(account.id!)}
                  >
                    📥 Fetch Emails
                  </button>
                )}
                <button
                  className={styles.removeButton}
                  onClick={() => handleDeleteAccount(account.id!)}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
