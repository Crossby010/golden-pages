import { useState, useEffect } from 'react';
import { HeroCarousel } from './hero-carousel';
import { Categories } from './categories';
import { FeaturedBooks } from './featured-books';
import { PopularBooks } from './popular-books';
import { NewArrivals } from './new-arrivals';
import { FeaturedAuthors } from './featured-authors';
import { getHomepageSettings } from '@/lib/admin-utils';
import type { HomepageSettings } from '@/types/admin';

export function Homepage() {
  const [settings] = useState<HomepageSettings>(() => getHomepageSettings());

  // Re-read on window focus (so admin changes appear without full reload)
  const [currentSettings, setCurrentSettings] = useState(settings);

  useEffect(() => {
    const handleFocus = () => {
      setCurrentSettings(getHomepageSettings());
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <HeroCarousel />

      {currentSettings.showCategories && (
        <div className="mt-6">
          <Categories />
        </div>
      )}

      {/* Featured Books + Authors side by side */}
      {(currentSettings.showFeaturedBooks || currentSettings.showFeaturedAuthors) && (
        <div className="mt-8 flex gap-6">
          {currentSettings.showFeaturedBooks && (
            <div className="flex-1 min-w-0">
              <FeaturedBooks />
            </div>
          )}
          {currentSettings.showFeaturedAuthors && <FeaturedAuthors />}
        </div>
      )}

      {currentSettings.showPopularBooks && (
        <div className="mt-8">
          <PopularBooks />
        </div>
      )}

      {currentSettings.showNewArrivals && (
        <div className="mt-8">
          <NewArrivals />
        </div>
      )}
    </div>
  );
}