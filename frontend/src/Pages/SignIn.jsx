import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import mailImg from '../assets/images/heroimg.png';
import { login } from '../firebase/authService';

const SignIn = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData.email, formData.password); // ✅ using helper
      navigate('/home');
    } catch (error) {
      console.error('Sign-in error:', error.message);
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0D1] flex items-center justify-center px-4 py-1 text-[#3B3030]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white max-w-5xl w-full shadow-lg rounded-2xl grid md:grid-cols-2 overflow-hidden"
      >
        {/* Form Section */}
        <div className="p-8">
          <h2 className="text-3xl font-semibold mb-6 py-6">Welcome Back! Please sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="mb-2">Email</Label>
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

            <div className="relative">
              <Label htmlFor="password" className="mb-2">Password</Label>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-[30px] right-3 text-[#3B3030]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#795757] text-[#FFF0D1] hover:bg-[#6a4949] py-6 mt-3 text-md"
            >
              Sign In
            </Button>

            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </form>

          <div className="mt-4 text-sm flex gap-2">
            <span>Don’t have an account?</span>
            <Link to="/signup" className="text-[#795757] underline hover:text-bold hover:text-[#6a4949]">
              Register
            </Link>
          </div>
        </div>

        {/* Image Section */}
        <div className="hidden md:flex bg-[#FFF0D1] items-center justify-center p-6">
          <img src={mailImg} alt="Sign In Visual" className="w-72 h-auto" />
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;
