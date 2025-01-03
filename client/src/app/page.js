'use client'

import React, { useState } from 'react';
import styles from './styles/page.module.css';

// COMPONENTS
import Sidebar from './_components/sidebar';
import CreateEmail from './_components/createEmail';
import ViewEmail from './_components/viewEmail';
import SendMail from './_components/sendMail';
import ScheduleMail from './_components/scheduleMail';
import ManageCategories from './_components/manageCategories';
import ManageRecipients from './_components/manageRecipients';
import PageNotFound from './_components/pageNotFound';
import WelcomeComponent from './_components/welcome';

const Home = () => {
  const [selectedContent, setSelectedContent] = useState('welcome');

  const renderContent = () => {
    switch (selectedContent) {
      case 'welcome':
        return <WelcomeComponent />;
      case 'create-email':
        return <CreateEmail />;
      case 'view-email':
        return <ViewEmail />;
      case 'send-email':
        return <SendMail />;
      case 'schedule-email':
        return <ScheduleMail />;
      case 'manage-categories':
        return <ManageCategories />;
      case 'manage-recipients':
        return <ManageRecipients />;
      default:
        return <PageNotFound />;
    }
  };

  return (
    <div className={styles['main-section']}>
      <Sidebar setSelectedContent={setSelectedContent} />
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default Home;
