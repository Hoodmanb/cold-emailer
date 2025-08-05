import React, { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

const Sidebar = ({ setSelectedContent }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dropdowns, setDropdowns] = useState({
    emails: false,
    categories: false,
    recipients: false,
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const toggleDropdown = (key) => {
    setDropdowns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      {/* Hamburger Icon */}
      <div className="md:hidden p-4" onClick={toggleSidebar}>
        {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
      </div>

      {/* Sidebar */}
      <aside
        className={`bg-[#795757] text-[#FFF0D1] w-64 p-6 space-y-6 md:block transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div
          className="text-2xl font-bold cursor-pointer mb-4"
          onClick={() => setSelectedContent('welcome')}
        >
          Cold Emailer
        </div>

        <nav className="space-y-4">
          {/* Emails Section */}
          <div>
            <div
              onClick={() => toggleDropdown('emails')}
              className="flex items-center justify-between cursor-pointer font-medium"
            >
              <span>Emails</span>
              <ChevronDown
                className={`transform transition-transform ${
                  dropdowns.emails ? 'rotate-180' : ''
                }`}
                size={18}
              />
            </div>
            <AnimatePresence>
              {dropdowns.emails && (
                <motion.ul
                  className="ml-4 mt-2 space-y-1"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <li className="cursor-pointer hover:underline" onClick={() => setSelectedContent('create-email')}>
                    Create New Email
                  </li>
                  <li className="cursor-pointer hover:underline" onClick={() => setSelectedContent('view-email')}>
                    View All Emails
                  </li>
                  <li className="cursor-pointer hover:underline" onClick={() => setSelectedContent('schedule-email')}>
                    Schedule Email
                  </li>
                  <li className="cursor-pointer hover:underline" onClick={() => setSelectedContent('scheduled-emails')}>
                    Scheduled Emails
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Categories Section */}
          <div>
            <div
              onClick={() => toggleDropdown('categories')}
              className="flex items-center justify-between cursor-pointer font-medium"
            >
              <span>Categories</span>
              <ChevronDown
                className={`transform transition-transform ${
                  dropdowns.categories ? 'rotate-180' : ''
                }`}
                size={18}
              />
            </div>
            <AnimatePresence>
              {dropdowns.categories && (
                <motion.ul
                  className="ml-4 mt-2 space-y-1"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <li className="cursor-pointer hover:underline" onClick={() => setSelectedContent('manage-categories')}>
                    Manage Categories
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Recipients Section */}
          <div>
            <div
              onClick={() => toggleDropdown('recipients')}
              className="flex items-center justify-between cursor-pointer font-medium"
            >
              <span>Recipients</span>
              <ChevronDown
                className={`transform transition-transform ${
                  dropdowns.recipients ? 'rotate-180' : ''
                }`}
                size={18}
              />
            </div>
            <AnimatePresence>
              {dropdowns.recipients && (
                <motion.ul
                  className="ml-4 mt-2 space-y-1"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <li className="cursor-pointer hover:underline" onClick={() => setSelectedContent('add-recipient')}>
                    Add Recipients
                  </li>
                  <li className="cursor-pointer hover:underline" onClick={() => setSelectedContent('manage-recipients')}>
                    Manage Recipients
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
