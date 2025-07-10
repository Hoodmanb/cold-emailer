import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '@/firebase/firebaseConfig'; 
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import mailImg from '../assets/images/heroimg.png';

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      await updateProfile(userCredential.user, {
        displayName: formData.username,
      });
      setSuccess('Signup successful! Redirecting to sign in...');
      navigate('/signin');
    } catch (error) {
      console.error('Signup error:', error.message);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please try another one.');
      } else {
        setError(error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0D1] flex items-center justify-center px-4 py-10 text-[#3B3030]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white max-w-5xl w-full shadow-lg rounded-2xl grid md:grid-cols-2 overflow-hidden"
      >
        {/* Image Section */}
        <div className="hidden md:block bg-[#FFF0D1] flex items-center justify-center p-6">
          <img src={mailImg} alt="Signup Visual" className="w-72 h-auto" />
        </div>

        {/* Form Section */}
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6">Please take your time to sign up</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="Your username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Your password"
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-[#795757] text-[#FFF0D1] hover:bg-[#6a4949]">
              Sign Up
            </Button>
          </form>

          <div className="mt-4 text-sm flex gap-2">
            <span>Already have an account?</span>
            <Link to="/signin" className="text-[#795757] underline">
              Sign In
            </Link>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-4 text-sm text-green-600">{success}</p>}
        </div>
      </motion.div>
    </div>
  );
}
