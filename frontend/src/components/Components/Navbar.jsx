import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logo from '../../../assets/images/logo.png';

export default function Navbar() {
  return (
    <header className="w-full bg-[#3B3030] text-[#3B3030] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img
            src={logo}
            alt="Logo"
            className="h-10 w-auto"
          />
        </Link>

        {/* Get Started Button */}
        <Link to="/signup">
          <Button className="bg-[#795757] text-[#FFF0D1] hover:bg-[#6a4949] h-12 text-bold text-xl rounded-md">
            Get Started
          </Button>
        </Link>
      </div>
    </header>
  );
}
