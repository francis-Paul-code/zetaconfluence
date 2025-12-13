/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import {
  FaArrowRight,
  FaBolt,
  FaGlobe,
  FaPlay,
  FaShieldAlt,
  FaStar,
  FaUsers,
} from 'react-icons/fa';
import { useNavigate } from 'react-router';

import dark from '../../../public/logos/zetaconfluence_logo_clear_dark.svg';
import light from '../../../public/logos/zetaconfluence_logo_clear_light.svg';
import { Button } from '../../components/Button';
import { useTheme } from '../../hooks/useTheme';

const LandingPage = () => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState<any>({});
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const navigate = useNavigate();
  const stats = [
    { label: 'Total Volume', value: '$52.3M', change: '+23%' },
    { label: 'Active Loans', value: '1,247', change: '+15%' },
    { label: 'Users', value: '12.5K', change: '+31%' },
    { label: 'Networks', value: '8', change: '+2%' },
  ];

  const features = [
    {
      icon: FaGlobe,
      title: 'Omnichain Protocol',
      description:
        "Seamlessly lend and borrow across multiple blockchain networks with ZetaChain's infrastructure",
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FaShieldAlt,
      title: 'Secure Collateralization',
      description:
        'Over-collateralized loans with automated liquidation protection and real-time monitoring',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: FaBolt,
      title: 'Gas-Free Bidding',
      description:
        'Place funding bids without gas fees through our innovative protocol design',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: FaUsers,
      title: 'P2P Auctions',
      description:
        'Competitive lending marketplace where borrowers and lenders interact directly',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'DeFi Trader',
      content:
        'ZetaConfluence revolutionized my lending strategy. Cross-chain borrowing has never been this seamless.',
      avatar: '👩‍💼',
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Crypto Fund Manager',
      content:
        'The automated liquidation system gives me confidence to lend large amounts. Excellent risk management.',
      avatar: '👨‍💻',
    },
    {
      name: 'Elena Petrov',
      role: 'Yield Farmer',
      content:
        'Gas-free bidding is a game changer. I can optimize my capital efficiency without worrying about fees.',
      avatar: '👩‍🔬',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev: any) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background_light dark:bg-background_dark-tint text-gray-900 dark:text-gray-100 font-poppins">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background_light/80 dark:bg-background_dark-tint/80 backdrop-blur-lg border-b border-gray-200/20 dark:border-gray-700/20 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-auto h-[40px]">
              <img
                src={theme === 'dark' ? dark : light}
                className="h-full object-cover w-auto aspect-auto"
                alt="logo"
              />
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
            >
              How it Works
            </a>
            <a
              href="#stats"
              className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Stats
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Reviews
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Button
              icon={<FaArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/dashboard/home')}
              className="bg-primary hover:bg-primary/90 text-white transition-all duration-200"
            >
              Launch App
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <FaStar className="w-4 h-4" />
              Omnichain P2P Lending Protocol
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Lend & Borrow
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Across Chains
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed">
              The first omnichain P2P lending protocol built on ZetaChain.
              <br />
              Secure, efficient, and truly decentralized lending across multiple
              blockchain networks.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/dashboard/home')}
                className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold text-lg transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl"
              >
                Start Lending
                <FaArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full font-semibold text-lg transition-all duration-200 flex items-center gap-3">
                <FaPlay className="w-4 h-4" />
                Watch Demo
              </button>
            </div>
          </div>

          {/* Floating Cards */}
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.slice(0, 3).map((stat, index) => (
                <div
                  key={stat.label}
                  className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                    index === 1 ? 'transform translate-y-4' : ''
                  }`}
                  style={{
                    animationDelay: `${index * 200}ms`,
                    animation: 'fadeInUp 1s ease-out forwards',
                  }}
                >
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {stat.label}
                  </div>
                  <div className="text-xs text-green-500 font-medium">
                    {stat.change} this month
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-6 bg-gray-50 dark:bg-background_dark"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="text-primary">ZetaConfluence</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience the future of decentralized lending with our
              cutting-edge omnichain protocol
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                id={`feature-${index}`}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 group ${
                  isVisible[`feature-${index}`]
                    ? 'animate-fadeInUp'
                    : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-4 mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Simple steps to start lending or borrowing across multiple
              blockchain networks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Connect Wallet</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect your wallet and access our omnichain protocol across
                supported networks
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Choose Action</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Request a loan with collateral or browse available lending
                opportunities
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Earn & Repay</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Earn interest on your loans or repay with automated liquidation
                protection
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        id="stats"
        className="py-20 px-6 bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-primary/10 dark:to-purple-500/10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
                <div className="text-sm text-green-500 font-medium mt-1">
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {/* <section id="testimonials" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">
            Trusted by <span className="text-primary">Thousands</span>
          </h2>

          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="text-4xl mb-6">
                {testimonials[currentTestimonial].avatar}
              </div>
              <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                "{testimonials[currentTestimonial].content}"
              </p>
              <div>
                <div className="font-semibold text-lg text-gray-900 dark:text-white">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {testimonials[currentTestimonial].role}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentTestimonial
                      ? 'bg-primary scale-125'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Start?
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-90">
            Join thousands of users already lending and borrowing on
            ZetaConfluence
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="px-10 py-4 bg-white text-primary hover:bg-gray-100 rounded-full font-bold text-lg transition-all duration-200 flex items-center gap-3 shadow-lg hover:shadow-xl">
              Launch App
              <FaArrowRight className="w-5 h-5" />
            </button>
            <button className="px-10 py-4 border-2 border-white/30 hover:border-white/50 hover:bg-white/10 rounded-full font-bold text-lg transition-all duration-200">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-white dark:bg-black text-gray-700 dark:text-gray-300">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-auto h-[30px]">
                  <img
                    src={theme === 'dark' ? dark : light}
                    className="h-full object-cover w-auto aspect-auto"
                    alt="logo"
                  />
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                The future of omnichain P2P lending. Secure, efficient, and
                truly decentralized.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Lend
                </a>
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Borrow
                </a>
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Markets
                </a>
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Analytics
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Documentation
                </a>
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Whitepaper
                </a>
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Blog
                </a>
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Support
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Community</h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Discord
                </a>
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Twitter
                </a>
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  Telegram
                </a>
                <a
                  href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © 2025 ZetaConfluence. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a
                href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                  className="block text-gray-500 dark:text-gray-400 hover:dark:text-white hover:text-gray-800 transition-colors"
              >
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
