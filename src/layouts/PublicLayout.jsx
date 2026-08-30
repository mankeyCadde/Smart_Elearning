import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavbar } from '../components/navigation/TopNavbar';
import { Footer } from '../components/navigation/Footer';
import './PublicLayout.css';

export const PublicLayout = () => {
  return (
    <div className="public-layout">
      <TopNavbar />
      <main className="public-layout-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
