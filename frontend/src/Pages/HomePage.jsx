import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import heroImage from '../assets/images/heroimg.png'

const HomePage = () => {
  return (
    <main className="bg-[#FFFFF8] text-[#3B3030] flex items-center justify-center px-6">
      <div className="grid md:grid-cols-2 gap-12 max-w-6xl items-center">
        {/* Text Section */}
        <motion.section
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Supercharge Your Outreach
          </h1>
          <p className="text-lg md:text-xl text-[#3B3030]/80">
            Automate personalized cold emails that convert, scale your campaigns, and grow your business effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link to="/signup">
              <Button className="bg-[#795757] text-[#FFF0D1] hover:bg-[#6a4949]">
                Create Account
              </Button>
            </Link>
            <Link to="/signin">
              <Button
                variant="outline"
                className="border-[#3B3030] text-[#3B3030] hover:bg-[#3B3030]/10"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Image Section */}
        <motion.section
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center"
        >
          <img
            src={heroImage}
            alt="Cold Email Automation"
            className="max-w-sm w-full rounded-xl shadow-xl"
          />
        </motion.section>
      </div>
    </main>
  );
}

export default HomePage;