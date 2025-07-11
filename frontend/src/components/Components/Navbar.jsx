import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import logo from '../../assets/images/logo.png';

const Navbar = () => {
  const [userInitial, setUserInitial] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.displayName) {
        setUserInitial(user.displayName.charAt(0).toUpperCase());
      } else if (user && user.email) {
        setUserInitial(user.email.charAt(0).toUpperCase());
      } else {
        setUserInitial(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        setUserInitial(null);
        navigate('/signin'); 
      })
      .catch((error) => {
        console.error('Logout failed:', error.message);
      });
  };

  return (
    <header className="w-full bg-[#3B3030] text-[#FFF0D1] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
        </Link>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {userInitial ? (
            <>
              {/* Profile circle */}
              <div className="w-10 h-10 rounded-full bg-[#795757] text-[#FFF0D1] flex items-center justify-center font-bold text-lg">
                {userInitial}
              </div>

              {/* Logout button */}
              <Button
                onClick={handleLogout}
                className="bg-[#795757] hover:bg-[#6a4949] h-12 text-bold text-lg rounded-md px-8"
              >
                Logout
              </Button>
            </>
          ) : (
            <Link to="/signup">
              <Button className="bg-[#795757] hover:bg-[#6a4949] h-12 text-bold text-lg rounded-md px-8">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
