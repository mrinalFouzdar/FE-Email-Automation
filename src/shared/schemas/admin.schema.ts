import * as Yup from 'yup';

export const createUserSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  role: Yup.string()
    .oneOf(['user', 'admin'], 'Invalid role')
    .required('Role is required'),
  imapHost: Yup.string()
    .when('role', {
      is: 'user',
      then: (schema) => schema.required('IMAP host is required for regular users'),
      otherwise: (schema) => schema.notRequired(),
    }),
  imapPort: Yup.number()
    .when('role', {
      is: 'user',
      then: (schema) => schema
        .positive('Port must be a positive number')
        .integer('Port must be an integer')
        .min(1, 'Port must be between 1 and 65535')
        .max(65535, 'Port must be between 1 and 65535')
        .required('IMAP port is required for regular users'),
      otherwise: (schema) => schema.notRequired(),
    }),
  imapPassword: Yup.string()
    .when('role', {
      is: 'user',
      then: (schema) => schema.required('IMAP password is required for regular users'),
      otherwise: (schema) => schema.notRequired(),
    }),
});
