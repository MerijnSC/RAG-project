"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './components/LoginForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-indigo-100 flex items-center justify-center">
      <LoginForm />
    </div>
  );
}