import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { LampContainer } from '@/components/ui/lamp';
import { LoginPopoverModel } from '../components/lightswind/login-popover-model';

export default function Register() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/chatbot');
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden overflow-y-auto selection:bg-neutral-800 selection:text-white">
      {/* Back to Home Button - White/Gray/Black Theme */}
      <Link
        to="/"
        className="fixed top-5 left-5 sm:top-6 sm:left-6 z-50 inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-neutral-300 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 backdrop-blur-md transition-all duration-200 shadow-xl shadow-black/60 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-neutral-400 group-hover:text-white" />
        <span>Back to Home</span>
      </Link>

      <LampContainer
        lampColor="white"
        className="min-h-screen bg-black pt-16 md:pt-20 pb-20 overflow-visible"
        childrenClassName="-translate-y-10 md:-translate-y-16 w-full max-w-xl px-4 flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.6,
            ease: "easeOut",
          }}
          className="text-center mb-6"
        >
          <h1 className="text-white text-center text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-[0_2px_14px_rgba(255,255,255,0.3)] py-1">
            Join Study Assistant
          </h1>
          <p className="mt-1 text-xs sm:text-sm md:text-base text-neutral-400 max-w-sm mx-auto font-medium">
            Create your account to unlock AI memory & personal study tools
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.35,
            duration: 0.6,
            ease: "easeOut",
          }}
          className="w-full max-w-md"
        >
          <LoginPopoverModel
            inline={true}
            initialMode="register"
            onSuccess={handleSuccess}
            onClose={() => navigate('/')}
          />
        </motion.div>
      </LampContainer>
    </div>
  );
}
