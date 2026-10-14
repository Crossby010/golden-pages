import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  BookOpen,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
} from 'lucide-react';
import {
  FaFacebookF,
  FaXTwitter,
  FaInstagram,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa6';
import { getStoreSettings } from '@/lib/admin-utils';
import type { StoreSettings } from '@/types/admin';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<StoreSettings>(() => getStoreSettings());

  useEffect(() => {
    const handleFocus = () => setSettings(getStoreSettings());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const socialLinks = [
    { name: 'Facebook', icon: FaFacebookF, href: settings.socialLinks.facebook, color: 'hover:bg-[#1877F2]' },
    { name: 'X (Twitter)', icon: FaXTwitter, href: settings.socialLinks.twitter, color: 'hover:bg-black' },
    { name: 'Instagram', icon: FaInstagram, href: settings.socialLinks.instagram, color: 'hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF]' },
    { name: 'TikTok', icon: FaTiktok, href: settings.socialLinks.tiktok, color: 'hover:bg-black' },
    { name: 'YouTube', icon: FaYoutube, href: settings.socialLinks.youtube, color: 'hover:bg-[#FF0000]' },
  ].filter((s) => s.href); // only show filled-in links

  return (
    <footer className="bg-navy-700 text-cream mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-brass-500" />
              <span className="text-xl font-serif font-bold">
                {settings.storeName.split(' ')[0]}{' '}
                <span className="text-brass-500">
                  {settings.storeName.split(' ').slice(1).join(' ') || ''}
                </span>
              </span>
            </Link>
            <p className="text-sm text-cream/70 leading-relaxed mb-5">
              {settings.storeDescription}
            </p>

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      className={`w-9 h-9 rounded-full bg-cream/10 flex items-center justify-center transition-all duration-300 ${social.color} hover:scale-110`}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-brass-500">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', href: '/' },
                { label: 'All Books', href: '/books' },
                { label: 'Categories', href: '/categories' },
                { label: 'About Us', href: '/about' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/70 hover:text-navy-700 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-brass-500 transition-all duration-300"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-brass-500">
              Customer Service
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'My Library', href: '/my-library' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Terms & Conditions', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-cream/70 hover:text-navy-700 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-brass-500 transition-all duration-300"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-brass-500">
              Get in Touch
            </h3>
            <ul className="space-y-3 mb-5">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brass-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-cream/70">{settings.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-brass-500 flex-shrink-0 mt-0.5" />
                <a
                  href={`mailto:${settings.email}`}
                  className="text-sm text-cream/70 hover:text-navy-700 transition-colors"
                >
                  {settings.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-brass-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-cream/70">{settings.phone}</span>
              </li>
            </ul>

            <div className="mt-4">
              <p className="text-xs text-cream/60 mb-2">Subscribe to our newsletter</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 text-sm bg-cream/10 border border-cream/20 rounded-l-lg focus:outline-none focus:border-navy-700 text-cream placeholder:text-cream/40"
                />
                <button
                  className="px-3 py-2 bg-brass-500 hover:bg-brass-600 rounded-r-lg transition-colors"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cream/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-cream/60 text-center sm:text-left">
              © {currentYear} {settings.storeName}. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-sm text-cream/60 hover:text-navy-700 transition-colors">
                Terms
              </Link>
              <Link to="/privacy" className="text-sm text-cream/60 hover:text-navy-700 transition-colors">
                Privacy
              </Link>
              <Link to="/cookies" className="text-sm text-cream/60 hover:text-navy-700 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
