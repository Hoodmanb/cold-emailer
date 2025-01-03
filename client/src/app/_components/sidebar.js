import React from 'react';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>Cold Emailer</h2>
      <ul>
        <li>
          <Link href="/create-email">Create New Email</Link>
        </li>
        <li>
          <Link href="/add-recipient">Add New Recipient</Link>
        </li>
        <li>
          <Link href="/view-emails">View All Emails</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
