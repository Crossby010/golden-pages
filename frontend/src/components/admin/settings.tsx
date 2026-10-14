import { useState } from 'react';
import {
  Save,
  Store,
  Bell,
  Lock,
  Palette,
  Globe,
  Check,
  RotateCcw,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import {
  FaFacebookF,
  FaXTwitter,
  FaInstagram,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  getStoreSettings,
  saveStoreSettings,
  resetStoreSettings,
} from '@/lib/admin-utils';
import type { StoreSettings } from '@/types/admin';
import { cn } from '@/lib/utils';

export function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings>(() =>
    getStoreSettings()
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveStoreSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults?')) {
      const defaults = resetStoreSettings();
      setSettings(defaults);
    }
  };

  const updateSocialLink = (
    key: keyof StoreSettings['socialLinks'],
    value: string
  ) => {
    setSettings({
      ...settings,
      socialLinks: { ...settings.socialLinks, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-700">
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store preferences. These settings control your footer
            and store info.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-gray-200 h-10"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            className={cn(
              'h-10 transition-colors',
              saved
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-brass-500 hover:bg-brass-600',
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
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Store Identity */}
      <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-brass-500" />
          <h2 className="text-lg font-serif font-bold text-navy-700">
            Store Identity
          </h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          This appears in the footer and site metadata
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={settings.storeName}
                onChange={(e) =>
                  setSettings({ ...settings, storeName: e.target.value })
                }
                placeholder="Golden Pages"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="storeTagline">Tagline</Label>
              <Input
                id="storeTagline"
                value={settings.storeTagline}
                onChange={(e) =>
                  setSettings({ ...settings, storeTagline: e.target.value })
                }
                placeholder="Your digital bookstore"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="storeDescription">Description</Label>
            <textarea
              id="storeDescription"
              value={settings.storeDescription}
              onChange={(e) =>
                setSettings({ ...settings, storeDescription: e.target.value })
              }
              rows={3}
              placeholder="Tell customers about your store..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-navy-700 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-brass-500" />
          <h2 className="text-lg font-serif font-bold text-navy-700">
            Contact Information
          </h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Displayed in the footer's "Get in Touch" section
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">
              <Mail className="w-3 h-3 inline mr-1" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) =>
                setSettings({ ...settings, email: e.target.value })
              }
              placeholder="hello@goldenpages.ph"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">
              <Phone className="w-3 h-3 inline mr-1" />
              Phone
            </Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) =>
                setSettings({ ...settings, phone: e.target.value })
              }
              placeholder="+63 2 1234 5678"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">
              <MapPin className="w-3 h-3 inline mr-1" />
              Address
            </Label>
            <Input
              id="address"
              value={settings.address}
              onChange={(e) =>
                setSettings({ ...settings, address: e.target.value })
              }
              placeholder="Manila, Philippines"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-brass-500" />
          <h2 className="text-lg font-serif font-bold text-navy-700">
            Social Media Links
          </h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          These icons appear in the footer
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="facebook" className="flex items-center gap-1.5">
              <FaFacebookF className="w-3.5 h-3.5 text-[#1877F2]" />
              Facebook
            </Label>
            <Input
              id="facebook"
              value={settings.socialLinks.facebook}
              onChange={(e) => updateSocialLink('facebook', e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="twitter" className="flex items-center gap-1.5">
              <FaXTwitter className="w-3.5 h-3.5" />
              X (Twitter)
            </Label>
            <Input
              id="twitter"
              value={settings.socialLinks.twitter}
              onChange={(e) => updateSocialLink('twitter', e.target.value)}
              placeholder="https://x.com/..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="instagram" className="flex items-center gap-1.5">
              <FaInstagram className="w-3.5 h-3.5 text-[#E4405F]" />
              Instagram
            </Label>
            <Input
              id="instagram"
              value={settings.socialLinks.instagram}
              onChange={(e) => updateSocialLink('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tiktok" className="flex items-center gap-1.5">
              <FaTiktok className="w-3.5 h-3.5" />
              TikTok
            </Label>
            <Input
              id="tiktok"
              value={settings.socialLinks.tiktok}
              onChange={(e) => updateSocialLink('tiktok', e.target.value)}
              placeholder="https://tiktok.com/@..."
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="youtube" className="flex items-center gap-1.5">
              <FaYoutube className="w-3.5 h-3.5 text-[#FF0000]" />
              YouTube
            </Label>
            <Input
              id="youtube"
              value={settings.socialLinks.youtube}
              onChange={(e) => updateSocialLink('youtube', e.target.value)}
              placeholder="https://youtube.com/@..."
            />
          </div>
        </div>
      </div>

      {/* Placeholder cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-brass-500" />
            <h3 className="text-base font-serif font-bold text-navy-700">
              Notifications
            </h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Email alerts for new orders
          </p>
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            Coming soon
          </span>
        </div>

        <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-brass-500" />
            <h3 className="text-base font-serif font-bold text-navy-700">
              Appearance
            </h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Theme colors and branding
          </p>
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            Coming soon
          </span>
        </div>

        <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-brass-500" />
            <h3 className="text-base font-serif font-bold text-navy-700">
              Security
            </h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            2FA and password rules
          </p>
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            Coming soon
          </span>
        </div>
      </div>

      {/* Save button (bottom) */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className={cn(
            'h-11 px-6 transition-colors',
            saved
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-brass-500 hover:bg-brass-600',
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
