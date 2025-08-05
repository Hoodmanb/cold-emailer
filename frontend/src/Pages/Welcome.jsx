import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// COMPONENTS
import Sidebar from '../components/Components/Sidebar';
import CreateEmail from '../components/Components/createEmail';
import ViewEmail from '../components/Components/viewEmail';
import ScheduleMail from '../components/Components/scheduleMail';
import ManageCategories from '../components/Components/manageCategories';
import ManageRecipients from '../components/Components/manageRecipients';
import PageNotFound from '../components/Components/pageNotFound';
import WelcomeComponent from '../components/Components/welcome';
import AddRecipient from '../components/Components/addRecipient';
import ScheduledEmails from '../components/Components/scheduledEmails';

const Welcome = () => {
  const [selectedContent, setSelectedContent] = useState(() => {
    return localStorage.getItem('selectedContent') || 'welcome';
  });

  useEffect(() => {
    localStorage.setItem('selectedContent', selectedContent);
  }, [selectedContent]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const renderContent = () => {
    switch (selectedContent) {
      case 'welcome':
        return <WelcomeComponent setSelectedContent={setSelectedContent} />;
      case 'create-email':
        return <CreateEmail />;
      case 'view-email':
        return <ViewEmail />;
      case 'schedule-email':
        return <ScheduleMail />;
      case 'manage-categories':
        return <ManageCategories />;
      case 'add-recipient':
        return <AddRecipient />;
      case 'manage-recipients':
        return <ManageRecipients />;
      case 'scheduled-emails':
        return <ScheduledEmails />;
      default:
        return <PageNotFound />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0D1] text-[#3B3030] flex relative">
      {/* Hamburger Button (Mobile Only) */}
      <div className="md:hidden fixed top-29 bg-transparent left-6 z-50 p-2">
        <button onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay + Sidebar Drawer (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-transparent bg-opacity-40"
              onClick={closeSidebar}
            />

            {/* Sidebar Drawer */}
            <motion.aside
              className="relative w-64 bg-[#795757] text-[#FFF0D1] z-50 h-full shadow-lg"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <div className="flex justify-end p-4 md:hidden">
                <button onClick={closeSidebar}>
                  <X size={24} />
                </button>
              </div>
              <Sidebar
                setSelectedContent={(content) => {
                  setSelectedContent(content);
                  closeSidebar();
                }}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static Sidebar (Desktop) */}
      <aside className="hidden md:block w-64 bg-[#795757] text-[#FFF0D1] shadow-md z-10">
        <Sidebar setSelectedContent={setSelectedContent} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto rounded-2xl bg-white p-6 shadow-lg min-h-[85vh]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Welcome;
