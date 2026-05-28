/**
 * Centralized Yup-style Native Schema Validator Registry for CareerBot.
 * Exposes simple validation rules natively with zero external dependencies,
 * preventing package build/install failures.
 */

const { ValidationError } = require('../errors/customErrors');

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const SCHEMAS = {
  signup: {
    validate: (data) => {
      const errors = {};
      const name = String(data?.name || '').trim();
      const email = String(data?.email || '').trim();
      const password = String(data?.password || '');

      if (!name) errors.name = 'Name is required';
      if (!email) {
        errors.email = 'Email is required';
      } else if (!validateEmail(email)) {
        errors.email = 'Invalid email formatting';
      }
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationError('Signup validation failed', errors);
      }
      return { name, email, password };
    }
  },

  login: {
    validate: (data) => {
      const errors = {};
      const email = String(data?.email || '').trim();
      const password = String(data?.password || '');

      if (!email) {
        errors.email = 'Email is required';
      } else if (!validateEmail(email)) {
        errors.email = 'Invalid email formatting';
      }
      if (!password) errors.password = 'Password is required';

      if (Object.keys(errors).length > 0) {
        throw new ValidationError('Login validation failed', errors);
      }
      return { email, password };
    }
  },

  job: {
    validate: (data) => {
      const errors = {};
      const title = String(data?.title || '').trim();
      const company = String(data?.company || '').trim();
      const rawDescription = String(data?.rawDescription || '').trim();

      if (!title) errors.title = 'Job title is required';
      if (!company) errors.company = 'Company name is required';
      if (!rawDescription) errors.rawDescription = 'Raw job description is required';

      if (Object.keys(errors).length > 0) {
        throw new ValidationError('Job validation failed', errors);
      }
      return data;
    }
  },

  profile: {
    validate: (data) => {
      const errors = {};
      if (!data || typeof data !== 'object') {
        throw new ValidationError('Profile must be a structured object');
      }
      // Structural check
      if (data.skills && !Array.isArray(data.skills)) {
        errors.skills = 'Skills must be a list';
      }
      if (data.experience !== undefined && !Array.isArray(data.experience)) {
        errors.experience = 'Experience must be a list';
      }
      if (data.certificates !== undefined && !Array.isArray(data.certificates)) {
        errors.certificates = 'Certificates must be a list';
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationError('Profile validation failed', errors);
      }
      return data;
    }
  },

  email: {
    validate: (data) => {
      const errors = {};
      const to = String(data?.to || '').trim();
      const subject = String(data?.subject || '').trim();
      const body = String(data?.body || '').trim();
      const status = String(data?.status || 'draft').trim();

      if (!to) {
        errors.to = 'Recipient address is required';
      } else if (!validateEmail(to)) {
        errors.to = 'Recipient is an invalid email';
      }
      if (!subject) errors.subject = 'Subject line is required';
      if (!body) errors.body = 'Email body is required';
      
      const allowedStatuses = ['draft', 'approved', 'queued', 'sent', 'failed', 'void'];
      if (!allowedStatuses.includes(status)) {
        errors.status = `Status '${status}' is not recognized`;
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationError('Email validation failed', errors);
      }
      return data;
    }
  }
};

module.exports = SCHEMAS;
