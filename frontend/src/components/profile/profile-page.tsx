import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Save,
  Loader2,
  Check,
  LogOut,
  Library,
  ShoppingBag,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/order-utils';

type Tab = 'profile' | 'security';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { success, info } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-serif font-bold text-navy-700 mb-4">
          Not signed in
        </h1>
        <Link to="/login">
          <Button className="bg-brass-500 hover:bg-brass-600 text-white">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  const userInitial = user.name?.charAt(0).toUpperCase() || 'U';

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Simulate save (update backend later)
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    setSaved(true);
    success('Profile updated successfully');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      info('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      info('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      info('Password must be at least 8 characters');
      return;
    }
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    success('Password change feature coming soon!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header card */}
      <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brass-100 to-brass-200 flex items-center justify-center text-3xl font-serif font-bold text-brass-600 flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-serif font-bold text-navy-700">
              {user.name}
            </h1>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
              {user.role === 'admin' ? (
                <Badge className="bg-brass-100 text-brass-700 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Administrator
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  Customer
                </Badge>
              )}
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {formatDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link
          to="/my-library"
          className="flex items-center gap-3 p-4 bg-cream rounded-xl border border-gray-100 shadow-sm hover:border-navy-300 hover:bg-navy-50 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-brass-100 text-brass-600 flex items-center justify-center">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-navy-700 text-sm">My Library</p>
            <p className="text-xs text-gray-500">Access your books</p>
          </div>
        </Link>

        <Link
          to="/orders"
          className="flex items-center gap-3 p-4 bg-cream rounded-xl border border-gray-100 shadow-sm hover:border-navy-300 hover:bg-navy-50 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-navy-700 text-sm">Order History</p>
            <p className="text-xs text-gray-500">View past orders</p>
          </div>
        </Link>

        {user.role === 'admin' && (
          <Link
            to="/admin"
            className="flex items-center gap-3 p-4 bg-cream rounded-xl border border-gray-100 shadow-sm hover:border-navy-300 hover:bg-navy-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-navy-700 text-sm">Admin Panel</p>
              <p className="text-xs text-gray-500">Manage store</p>
            </div>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'profile'
                ? 'border-navy-700 text-brass-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'security'
                ? 'border-navy-700 text-brass-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Security
          </button>
        </div>
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-serif font-bold text-navy-700 mb-4">
            Account Information
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">
                <Mail className="w-3 h-3 inline mr-1" />
                Email Address
              </Label>
              <Input
                id="email"
                value={email}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-200 text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>

              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !name.trim()}
                className={`bg-brass-500 hover:bg-brass-600 text-white transition-colors ${
                  saved ? 'bg-green-500 hover:bg-green-600' : ''
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
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
        </div>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <div className="bg-cream rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-serif font-bold text-navy-700 mb-4">
            Change Password
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={isSaving}
              className="bg-brass-500 hover:bg-brass-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
