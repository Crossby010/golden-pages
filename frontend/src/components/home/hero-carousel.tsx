import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getHomepageSettings } from '@/lib/admin-utils';
import type { HeroSlide } from '@/types/admin';

export function HeroCarousel() {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<HeroSlide[]>(
    () => getHomepageSettings().heroSlides
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalSlides = slides.length;

  const goToSlide = (index: number) => setCurrentSlide(index);

  useEffect(() => {
    if (isPaused || totalSlides === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, totalSlides]);

  useEffect(() => {
    const handleFocus = () => {
      const newSettings = getHomepageSettings();
      setSlides(newSettings.heroSlides);
      setCurrentSlide(0);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (totalSlides === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cream to-navy-50 h-[280px] md:h-[320px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex flex-col transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateY(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="flex-shrink-0 h-[280px] md:h-[320px] flex items-center px-8 md:px-12"
          >
            <div>
              <div className="text-4xl md:text-5xl mb-3">{slide.icon}</div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-navy-700 max-w-lg">
                {slide.title}
              </h2>
              <p className="text-sm md:text-base text-gray-600 mt-2 max-w-md">
                {slide.description}
              </p>
              <Button
                onClick={() => navigate(slide.ctaLink || '/books')}
                className="mt-4 bg-navy-700 hover:bg-brass-500 text-white transition-colors"
              >
                {slide.cta}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'w-7 h-7 md:w-8 md:h-8 rounded-full text-xs md:text-sm font-bold transition-all duration-300 flex items-center justify-center cursor-pointer',
              index === currentSlide
                ? 'bg-brass-500 text-white scale-110 shadow-lg shadow-brass-500/30'
                : 'bg-white/60 text-gray-500 hover:bg-white/90 border border-gray-200'
            )}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
