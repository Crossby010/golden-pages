import { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  BookOpen,
  Star,
  Sparkles,
  Users,
  Layout,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  getHomepageSettings,
  saveHomepageSettings,
  resetHomepageSettings,
} from '@/lib/admin-utils';
import { bookService } from '@/services/book-service';
import type { HomepageSettings } from '@/types/admin';
import type { Book } from '@/types/book';
import { cn } from '@/lib/utils';

export function HomepageSettingsPage() {
  const [settings, setSettings] = useState<HomepageSettings>(() =>
    getHomepageSettings()
  );
  const [books, setBooks] = useState<Book[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await bookService.list({ limit: 50 });
        if (!cancelled) setBooks(res.books);
      } catch (err) {
        console.error('Failed to load books:', err);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = () => {
    saveHomepageSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset homepage settings to defaults?')) {
      const defaults = resetHomepageSettings();
      setSettings(defaults);
    }
  };

  const toggleSection = (
    key: keyof Pick<
      HomepageSettings,
      | 'showCategories'
      | 'showFeaturedBooks'
      | 'showPopularBooks'
      | 'showNewArrivals'
      | 'showFeaturedAuthors'
    >
  ) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const toggleBookInList = (
    key: 'featuredBookIds' | 'popularBookIds' | 'newArrivalBookIds',
    bookId: string
  ) => {
    const current = settings[key];
    const updated = current.includes(bookId)
      ? current.filter((id) => id !== bookId)
      : [...current, bookId];
    setSettings({ ...settings, [key]: updated });
  };

  const sections = [
    { key: 'showCategories' as const, name: 'Categories Row', description: 'Quick category filter buttons' },
    { key: 'showFeaturedBooks' as const, name: 'Featured Books Section', description: 'Main carousel of curated books' },
    { key: 'showPopularBooks' as const, name: 'Popular This Month', description: 'Trending books section' },
    { key: 'showNewArrivals' as const, name: 'New Arrivals', description: 'Recently added books' },
    { key: 'showFeaturedAuthors' as const, name: 'Featured Authors Sidebar', description: 'Sidebar with author list' },
  ];

  const bookLists = [
    { key: 'featuredBookIds' as const, name: 'Featured Books', icon: BookOpen, description: 'These books appear in the Featured section' },
    { key: 'popularBookIds' as const, name: 'Popular Books', icon: Star, description: 'These books appear in Popular This Month' },
    { key: 'newArrivalBookIds' as const, name: 'New Arrivals', icon: Sparkles, description: 'These books appear in New Arrivals' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-700">Homepage Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Control what appears on your main homepage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="border-gray-200 h-10">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Link to="/" target="_blank">
            <Button variant="outline" className="border-gray-200 h-10">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            className={cn(
              'h-10 transition-colors',
              saved ? 'bg-green-500 hover:bg-green-600' : 'bg-brass-500 hover:bg-brass-600',
              'text-white'
            )}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layout className="w-5 h-5 text-brass-500" />
          <h2 className="text-lg font-serif font-bold text-navy-700">Section Visibility</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">Toggle which sections appear on the homepage</p>

        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => toggleSection(section.key)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                settings[section.key]
                  ? 'border-navy-700 bg-brass-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                  settings[section.key] ? 'bg-brass-500 text-white' : 'bg-gray-100 text-gray-400'
                )}
              >
                {settings[section.key] ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-navy-700 text-sm">{section.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
              </div>
              <div
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative flex-shrink-0',
                  settings[section.key] ? 'bg-brass-500' : 'bg-gray-300'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                    settings[section.key] ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-brass-500" />
          <h2 className="text-lg font-serif font-bold text-navy-700">Homepage Book Lists</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">Select which books appear in each section</p>

        <div className="space-y-6">
          {bookLists.map((list) => {
            const Icon = list.icon;
            const selectedIds = settings[list.key];
            return (
              <div key={list.key}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-brass-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-navy-700">{list.name}</h3>
                    <p className="text-xs text-gray-500">{list.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400">{selectedIds.length} selected</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {books.map((book) => {
                    const isSelected = selectedIds.includes(book.id);
                    return (
                      <button
                        key={book.id}
                        onClick={() => toggleBookInList(list.key, book.id)}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-left',
                          isSelected
                            ? 'border-navy-700 bg-brass-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        )}
                      >
                        <div className="w-8 h-10 flex-shrink-0 bg-gradient-to-br from-brass-100 to-brass-200 rounded flex items-center justify-center text-base">
                          {book.coverEmoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-navy-700 line-clamp-1">
                            {book.title}
                          </p>
                          <p className="text-[10px] text-gray-500 line-clamp-1">
                            {book.author}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-brass-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-brass-500" />
          <h2 className="text-lg font-serif font-bold text-navy-700">Spotlight Section</h2>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="spotlightTitle">Spotlight Title</Label>
            <Input
              id="spotlightTitle"
              value={settings.spotlightTitle}
              onChange={(e) => setSettings({ ...settings, spotlightTitle: e.target.value })}
              placeholder="Discover Filipino Literature"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="spotlightSubtitle">Spotlight Subtitle</Label>
            <Input
              id="spotlightSubtitle"
              value={settings.spotlightSubtitle}
              onChange={(e) => setSettings({ ...settings, spotlightSubtitle: e.target.value })}
              placeholder="Celebrating our literary heritage"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className={cn(
            'h-11 px-6 transition-colors',
            saved ? 'bg-green-500 hover:bg-green-600' : 'bg-brass-500 hover:bg-brass-600',
            'text-white'
          )}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
