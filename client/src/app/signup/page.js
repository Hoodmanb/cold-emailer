'use client';
import React, { useState } from 'react';
import styles from '../styles/components.module.css';
import Link from 'next/link';
import Image from 'next/image';
import mailImg from '../assets/Images/signMail.png';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    emailGeneratedPassword: '',
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
    console.log('Form submitted:', formData);
    // Add your signup logic here
  };

  return (
    <div className={styles.signupContainer}>
      <h1 className={styles.componentHeader}>Please take your time to signup</h1>

      <div className={styles.flexTextImage}>
        <section>
          <Image
            src={mailImg}
            alt="Sign Up Image"
            className={styles.mailImg}
          />
        </section>

        <section>
          <div>
            <form className={styles.formGroup} onSubmit={handleSubmit}>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                className={styles.input}
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                className={styles.input}
                value={formData.username}
                onChange={handleChange}
                required
              />
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
              <input
                type="text"
                name="emailGeneratedPassword"
                placeholder="Email Generated Password"
                className={styles.input}
                value={formData.emailGeneratedPassword}
                onChange={handleChange}
                required
              />
              <button type="submit" className={styles.primaryButton}>
                Sign Up
              </button>
            </form>

            {/* ✅ Moved directly under the form */}
            <div className={styles.flexText}>
              <p>Already have an account?</p>
              <Link href="/signin" className={styles.buttonLink}>
                <button className={styles.buttonLink}>Sign In</button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SignupForm;
