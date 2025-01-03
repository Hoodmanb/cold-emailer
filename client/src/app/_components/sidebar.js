import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../styles/page.module.css';

const Sidebar = ({ setSelectedContent }) => {
  const [emailsOpen, setEmailsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);

  const toggleDropdown = (section) => {
    if (section === 'emails') {
      setEmailsOpen(!emailsOpen);
    } else if (section === 'categories') {
      setCategoriesOpen(!categoriesOpen);
    } else if (section === 'recipients') {
      setRecipientsOpen(!recipientsOpen);
    }
  };

  return (
    <div className={styles.sidebar}>
      <h2>
        <Link href="/" onClick={() => setSelectedContent('welcome')}>Cold Emailer</Link>
      </h2>
      <ul>
        <li>
          <div onClick={() => toggleDropdown('emails')} className={styles.dropdownToggle}>
            <span>Emails</span>
          </div>
          <ul className={`${styles.dropdownMenu} ${emailsOpen ? styles.open : ''}`}>
            <li><Link href="/create-email" onClick={() => setSelectedContent('create-email')}>Create New Email</Link></li>
            <li><Link href="/view-emails" onClick={() => setSelectedContent('view-email')}>View All Emails</Link></li>
            <li><Link href="/send-email" onClick={() => setSelectedContent('send-email')}>Send Email</Link></li>
            <li><Link href="/schedule-email" onClick={() => setSelectedContent('schedule-email')}>Schedule Email</Link></li>
          </ul>
        </li>
        <li>
          <div onClick={() => toggleDropdown('categories')} className={styles.dropdownToggle}>
            <span>Categories</span>
          </div>
          <ul className={`${styles.dropdownMenu} ${categoriesOpen ? styles.open : ''}`}>
            <li><Link href="/manage-categories" onClick={() => setSelectedContent('manage-categories')}>Manage Categories</Link></li>
          </ul>
        </li>
        <li>
          <div onClick={() => toggleDropdown('recipients')} className={styles.dropdownToggle}>
            <span>Recipients</span>
          </div>
          <ul className={`${styles.dropdownMenu} ${recipientsOpen ? styles.open : ''}`}>
            <li><Link href="/manage-recipients" onClick={() => setSelectedContent('manage-recipients')}>Manage Recipients</Link></li>
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
