'use client';
import React, { useState, useEffect } from 'react';
import styles from '../styles/components.module.css';
import Link from 'next/link';
import Image from 'next/image';
import mailImg from '../assets/Images/signMail.png';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext'; 

const SignInForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth(); 

  useEffect(() => {
    if (user) router.push('/home');
  }, [user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      router.push('/home');
    } catch (error) {
      setError('Invalid email or password. Please try again.');
      console.error('Sign-in error:', error.message);
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
            <Link href="/signup">
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
