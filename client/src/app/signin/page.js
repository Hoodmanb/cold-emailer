'use client';
import React, { useState } from 'react';
import styles from '../styles/components.module.css';
import Link from 'next/link';

const SignInForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sign-in data:', formData);
    // Add your sign-in logic here
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.imageContainer}>
      <h1 className={styles.componentHeader}>Welcome Back! Please sign in</h1>
      <form className={styles.formGroup} onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          className={styles.input}
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className={styles.input}
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" className={styles.primaryButton}>
          Sign In
        </button>
      </form>

      <div className={styles.flexText}>
        <p>Don’t have an account?</p>
        <Link href="/signup" className={styles.buttonLink}>
          <button className={styles.buttonLink}>
            Register
          </button>
        </Link>
      </div>
      </div>
    </div>
  );
};

export default SignInForm;
