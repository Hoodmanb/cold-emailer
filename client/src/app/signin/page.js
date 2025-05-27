'use client';
import React, { useState } from 'react';
import styles from '../styles/components.module.css';
import Link from 'next/link';
import Image from 'next/image';
import mailImg from '../assets/Images/signMail.png';
import { auth } from '../firebaseConfig'; // adjust the path if needed
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const SignInForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      console.log('User signed in:', user);

      // Redirect to dashboard or home
      router.push('/');
    } catch (error) {
      console.error('Sign-in error:', error.message);
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className={styles.signupContainer}>
      <h1 className={styles.componentHeader}>Welcome Back! Please sign in</h1>
      <div className={styles.flexTextImage}>
        <section>
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
            {error && <p className={styles.errorText}>{error}</p>}
          </form>

          <div className={styles.flexText}>
            <p>Don’t have an account?</p>
            <Link href="/signup" className={styles.buttonLink}>
              <button className={styles.buttonLink}>Register</button>
            </Link>
          </div>
        </section>
        <section>
          <Image
            src={mailImg}
            alt="Sign In Image"
            width={500}
            height={500}
            className={styles.mailImg}
          />
        </section>
      </div>
    </div>
  );
};

export default SignInForm;
