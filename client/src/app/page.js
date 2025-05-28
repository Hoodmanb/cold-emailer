'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './styles/homepage.module.css';
const HomePage = () => {
  return (
    <main className={styles.homeContainer}>
      <div className={styles.contentWrapper}>
        <section className={styles.textSection}>
          <h1 className={styles.heading}>Supercharge Your Outreach</h1>
          <p className={styles.subheading}>
            Automate personalized cold emails that convert, scale your campaigns, and grow your business effortlessly.
          </p>
          <div className={styles.buttonGroup}>
            <Link href="/signup" className={styles.primaryButton}>
              Create Account
            </Link>
            <Link href="/signin" className={styles.secondaryButton}>
              Sign In
            </Link>
          </div>
        </section>
        <section className={styles.imageSection}>
          <Image
            src="/hero.png"
            alt="Cold Email Automation"
            width={500}
            height={500}
            className={styles.heroImage}
            priority
          />
        </section>
      </div>
    </main>
  );
};

export default HomePage;
