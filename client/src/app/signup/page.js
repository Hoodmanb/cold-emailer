'use client';
import React, { useState } from 'react';
import styles from '../styles/components.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { auth } from '../firebaseConfig'; 
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import mailImg from '../assets/Images/signMail.png';

const SignupForm = () => {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: formData.username,
      });

      // The emailGeneratedPassword is stored in state but not sent anywhere
      console.log('Email Generated Password (saved locally):', formData.emailGeneratedPassword);
      setSuccess('Signup successful! You can now sign in.')
      router.push('/signin');
    } catch (error) {
      console.error('Signup error:', error.message);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please try another one.');
      }else{
        setError(error.message);
      }
      
    }
  };

  return (
    <div className={styles.signupContainer}>
      <h1 className={styles.componentHeader}>Please take your time to signup</h1>
      <div className={styles.flexTextImage}>
        <section>
          <Image src={mailImg} alt="Sign Up Image" className={styles.mailImg} />
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
                minLength={8}
                required
              />
              <input
                type="text"
                name="emailGeneratedPassword"
                placeholder="Email Generated Password"
                className={styles.input}
                value={formData.emailGeneratedPassword}
                onChange={handleChange}
              />
              <button type="submit" className={styles.primaryButton}>
                Sign Up
              </button>
            </form>

            <div className={styles.flexText}>
              <p>Already have an account?</p>
              <Link href="/signin" className={styles.buttonLink}>
                <button className={styles.buttonLink}>Sign In</button>
              </Link>
            </div>

            {error && <p className={styles.errorText}>{error}</p>}
            {success && <p className={styles.successText}>{error}</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SignupForm;
