'use client';
import React from 'react';
import styles from '../styles/components.module.css';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();
  const userInitial = user?.displayName?.charAt(0).toUpperCase() || '';

  return (
    <nav className={styles.navbar}>
      <h2 className={styles.logo}></h2>

      {user && (
        <div className={styles.profileCircle}>
          {userInitial}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
