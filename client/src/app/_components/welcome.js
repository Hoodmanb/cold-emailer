import React from 'react';
import styles from '../styles/components.module.css';
import Image from 'next/image';
import PenIcon from '../assets/icons/pen.png';
import Link from 'next/link'

const welcome = () => {
  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.header}>
        <h1>Welcome to Cold Emailer</h1>
        <Image
          src={PenIcon}
          className={styles.penIcon}
        />
      </div>
      
      <h3>Where your outreach transforms into opportunities! </h3>
      <h4>With Cold Emailer, you can:</h4>
      <ul>
        <li>Craft irresistible emails with ease.</li>
        <li>Organize your emails effortlessly.</li>
        <li>Organise recipients and categories with ease</li>
      </ul>
        <h3>Here’s to turning every email into a success story! </h3>
        <Link href='/create-email'>
          <button className={styles.primaryButton}>Get Started</button>
        </Link>
        
    </div>
  )
}

export default welcome