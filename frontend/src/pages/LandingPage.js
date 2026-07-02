import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Books, ArrowsClockwise, TrendUp, Users, Barcode, CheckCircle } from '@phosphor-icons/react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Books,
      title: 'Smart Inventory',
      description: 'Organize books with custom bookshelves and track stock levels',
      color: 'bg-[#0055FF]',
    },
    {
      icon: ArrowsClockwise,
      title: 'Lending System',
      description: 'Issue books, track returns, and calculate late fees automatically',
      color: 'bg-[#FF007F]',
    },
    {
      icon: TrendUp,
      title: 'Analytics',
      description: 'View revenue trends and loan statistics with visual charts',
      color: 'bg-[#FFD600]',
    },
    {
      icon: Users,
      title: 'Member Management',
      description: 'Handle customer memberships and reservations effortlessly',
      color: 'bg-[#00E676]',
    },
    {
      icon: Barcode,
      title: 'Bulk Import',
      description: 'Import hundreds of books via CSV/Excel in seconds',
      color: 'bg-[#0055FF]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-[#0055FF] border-4 border-[#0A0A0A] hard-shadow-lg mb-8">
              <BookOpen size={64} weight="bold" color="white" />
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A] mb-6">
              Library Pro
            </h1>
            
            <p className="text-xl sm:text-2xl font-semibold text-[#52525B] mb-4 max-w-3xl mx-auto">
              Professional Library Management System
            </p>
            
            <p className="text-base sm:text-lg font-medium text-[#52525B] mb-12 max-w-2xl mx-auto">
              Streamline your library operations with modern inventory tracking, automated lending, and powerful analytics. Built for physical library stores.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/register')}
                data-testid="hero-register-button"
                className="px-8 py-4 bg-[#0055FF] text-white neo-brutal-btn text-lg font-bold"
              >
                Get Started Free
              </button>
              <button
                onClick={() => navigate('/login')}
                data-testid="hero-login-button"
                className="px-8 py-4 bg-white text-[#0A0A0A] neo-brutal-btn text-lg font-bold"
              >
                Login
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-[#52525B]">
              <CheckCircle size={20} weight="bold" color="#00E676" />
              <span>Demo credentials available on login page</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A] mb-4">
            Powerful Features
          </h2>
          <p className="text-lg font-medium text-[#52525B]">
            Everything you need to manage a modern library
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white border-2 border-[#0A0A0A] hard-shadow p-6 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
                data-testid={`feature-${index}`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.color} border-2 border-[#0A0A0A] mb-4`}>
                  <Icon size={32} weight="bold" color={feature.color.includes('FFD600') ? '#0A0A0A' : 'white'} />
                </div>
                <h3 className="text-xl font-bold font-outfit mb-2 text-[#0A0A0A]">
                  {feature.title}
                </h3>
                <p className="text-sm font-medium text-[#52525B]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-[#0A0A0A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl sm:text-6xl font-black font-outfit mb-2">100%</p>
              <p className="text-lg font-semibold uppercase tracking-widest">Free to Use</p>
            </div>
            <div>
              <p className="text-5xl sm:text-6xl font-black font-outfit mb-2">∞</p>
              <p className="text-lg font-semibold uppercase tracking-widest">Books Capacity</p>
            </div>
            <div>
              <p className="text-5xl sm:text-6xl font-black font-outfit mb-2">24/7</p>
              <p className="text-lg font-semibold uppercase tracking-widest">Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-[#FFD600] border-4 border-[#0A0A0A] hard-shadow-lg p-12 text-center">
          <h2 className="text-4xl sm:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A] mb-4">
            Ready to Transform Your Library?
          </h2>
          <p className="text-lg font-semibold text-[#0A0A0A] mb-8">
            Join modern libraries using Library Pro today
          </p>
          <button
            onClick={() => navigate('/register')}
            data-testid="cta-register-button"
            className="px-10 py-5 bg-[#0055FF] text-white neo-brutal-btn text-xl font-bold"
          >
            Start Managing Now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-[#0A0A0A] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#52525B]">
            © 2024 Library Pro. Built with Emergent AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
