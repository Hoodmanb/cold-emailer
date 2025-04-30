import React from 'react';
import Link from 'next/link';
import styles from '../styles/components.module.css';
import Image from 'next/image';
import PenIcon from '../assets/icons/pen.png';

const Welcome = ({ setSelectedContent }) => {
  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.navbar}>
        <h1></h1>
      <div className={styles.btnGroup}>
        <Link href="/signup" className={styles.buttonLink}>
        <button
          className={styles.buttonLink}
        >
          Create an account
        </button>
        </Link>

        <Link href="/signin" className={styles.buttonLink}>
        <button
          className={styles.primaryButton}
          onClick={() => setSelectedContent('create-email')}
        >
          Sign In
        </button>
        </Link>
      </div>

      </div>
      <div className={styles.header}>
        <h1>Welcome to Cold Emailer</h1>
        <Image
          src={PenIcon}
          className={styles.penIcon}
          alt="Pen Icon"
        />
      </div>

      <h3>Where your outreach transforms into opportunities! </h3>
      <h4>With Cold Emailer, you can:</h4>
      <ul>
        <li>Craft irresistible emails with ease.</li>
        <li>Organize your emails effortlessly.</li>
        <li>Organize recipients and categories with ease.</li>
      </ul>
      <h3>Here’s to turning every email into a success story! </h3>
      <button
        className={styles.primaryButton}
        onClick={() => setSelectedContent('create-email')}
      >
        Get Started
      </button>

    </div>
  );
};

export default Welcome;
