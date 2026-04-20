// src/pages/shared/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  User, Building, Bell, Moon, Sun, Save, Loader2,
  Mail, Phone, MapPin, Globe, Lock, Key, DollarSign,
  Shield, Type, CheckCircle, AlertCircle, Eye, EyeOff,
  ChevronDown, Monitor, X
} from 'lucide-react';

// ----------------------------------------------------------------------
// Constants – full country list and currency mapping
// ----------------------------------------------------------------------
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
  "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi",
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova",
  "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka",
  "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
].sort();

const currencies = [
  "USD", "EUR", "GBP", "KES", "NGN", "ZAR", "UGX", "TZS", "GHS", "EGP",
  "INR", "CNY", "JPY", "AUD", "CAD", "CHF", "NZD", "ZMW", "MAD", "ETB"
];

const countryCurrencyMap = {
  "United States": "USD", "Canada": "CAD", "United Kingdom": "GBP", "Kenya": "KES",
  "Nigeria": "NGN", "South Africa": "ZAR", "Uganda": "UGX", "Tanzania": "TZS",
  "Ghana": "GHS", "Egypt": "EGP", "India": "INR", "China": "CNY", "Japan": "JPY",
  "Australia": "AUD", "Germany": "EUR", "France": "EUR", "Italy": "EUR", "Spain": "EUR",
  "Switzerland": "CHF", "New Zealand": "NZD", "Zambia": "ZMW", "Morocco": "MAD",
  "Ethiopia": "ETB", "Pakistan": "PKR", "Bangladesh": "BDT", "Russia": "RUB",
  "Brazil": "BRL", "Mexico": "MXN", "Turkey": "TRY", "Thailand": "THB",
  "Vietnam": "VND", "Indonesia": "IDR", "Philippines": "PHP", "Malaysia": "MYR",
  "Singapore": "SGD", "Hong Kong": "HKD", "Saudi Arabia": "SAR", "United Arab Emirates": "AED",
  "Qatar": "QAR", "Kuwait": "KWD", "Bahrain": "BHD", "Oman": "OMR", "Jordan": "JOD",
  "Lebanon": "LBP", "Iraq": "IQD", "Iran": "IRR", "Afghanistan": "AFN", "Nepal": "NPR",
  "Sri Lanka": "LKR", "Myanmar": "MMK", "Cambodia": "KHR", "Laos": "LAK",
  "Mongolia": "MNT", "Kazakhstan": "KZT", "Uzbekistan": "UZS", "Turkmenistan": "TMT",
  "Azerbaijan": "AZN", "Georgia": "GEL", "Armenia": "AMD", "Moldova": "MDL",
  "Belarus": "BYN", "Ukraine": "UAH", "Poland": "PLN", "Czech Republic": "CZK",
  "Slovakia": "EUR", "Hungary": "HUF", "Romania": "RON", "Bulgaria": "BGN",
  "Serbia": "RSD", "Croatia": "EUR", "Bosnia and Herzegovina": "BAM", "Albania": "ALL",
  "North Macedonia": "MKD", "Greece": "EUR", "Cyprus": "EUR", "Malta": "EUR",
  "Iceland": "ISK", "Norway": "NOK", "Sweden": "SEK", "Denmark": "DKK",
  "Finland": "EUR", "Estonia": "EUR", "Latvia": "EUR", "Lithuania": "EUR",
  "Ireland": "EUR", "Portugal": "EUR", "Netherlands": "EUR", "Belgium": "EUR",
  "Luxembourg": "EUR", "Austria": "EUR", "Slovenia": "EUR", "Montenegro": "EUR",
  "Israel": "ILS", "Palestine": "ILS", "Syria": "SYP", "Yemen": "YER",
  "Libya": "LYD", "Tunisia": "TND", "Algeria": "DZD", "Mauritania": "MRU",
  "Senegal": "XOF", "Gambia": "GMD", "Guinea": "GNF", "Sierra Leone": "SLL",
  "Liberia": "LRD", "Côte d'Ivoire": "XOF", "Burkina Faso": "XOF", "Benin": "XOF",
  "Niger": "XOF", "Togo": "XOF", "Mali": "XOF", "Chad": "XAF", "Central African Republic": "XAF",
  "Cameroon": "XAF", "Congo": "XAF", "Gabon": "XAF", "Equatorial Guinea": "XAF",
  "Rwanda": "RWF", "Burundi": "BIF", "Djibouti": "DJF", "Eritrea": "ERN",
  "Somalia": "SOS", "South Sudan": "SSP", "Sudan": "SDG", "Angola": "AOA",
  "Botswana": "BWP", "Lesotho": "LSL", "Malawi": "MWK", "Mozambique": "MZN",
  "Namibia": "NAD", "Eswatini": "SZL", "Zimbabwe": "ZWL", "Madagascar": "MGA",
  "Comoros": "KMF", "Mauritius": "MUR", "Seychelles": "SCR", "Cabo Verde": "CVE",
  "Sao Tome and Principe": "STN", "Korea, South": "KRW", "Korea, North": "KPW",
  "Taiwan": "TWD", "Timor-Leste": "USD", "Vatican City": "EUR", "Monaco": "EUR",
  "Liechtenstein": "CHF", "San Marino": "EUR", "Andorra": "EUR", "Kiribati": "AUD",
  "Tuvalu": "AUD", "Nauru": "AUD", "Palau": "USD", "Marshall Islands": "USD",
  "Micronesia": "USD", "Samoa": "WST", "Tonga": "TOP", "Vanuatu": "VUV",
  "Solomon Islands": "SBD", "Fiji": "FJD", "Papua New Guinea": "PGK",
};

const tabs = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Your personal information' },
  { id: 'farm', label: 'Farm', icon: Building, description: 'Farm details & location' },
  { id: 'security', label: 'Security', icon: Lock, description: 'Password & access' },
  { id: 'preferences', label: 'Preferences', icon: Globe, description: 'Currency & regional' },
  { id: 'notifications', label: 'Alerts', icon: Bell, description: 'Notification settings' },
  { id: 'appearance', label: 'Appearance', icon: Moon, description: 'Theme & font size' },
];

// Password strength checker
const getPasswordStrength = (password) => {
  let score = 0;
  if (!password) return { score: 0, label: '', color: '' };
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const strength = {
    0: { label: 'Very Weak', color: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
    1: { label: 'Weak', color: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
    2: { label: 'Fair', color: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
    3: { label: 'Good', color: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
    4: { label: 'Strong', color: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
    5: { label: 'Very Strong', color: 'bg-green-600', text: 'text-green-700 dark:text-green-500' },
  };
  const idx = Math.min(score, 5);
  return { score: idx, label: strength[idx].label, color: strength[idx].color, textColor: strength[idx].text };
};

// Helper Components
const SkeletonField = () => (
  <div className="animate-pulse space-y-2">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
  </div>
);

const Tooltip = ({ children, text }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
      {text}
    </div>
  </div>
);

// Main Component
export default function Settings() {
  const { user, setUser, isLoading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalMode, setPasswordModalMode] = useState('change');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '', textColor: '' });

  const [fontSize, setFontSize] = useState(() => localStorage.getItem('app_font_size') || 'medium');
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (fontSize === 'small') root.classList.add('text-sm');
    else if (fontSize === 'large') root.classList.add('text-lg');
    else root.classList.add('text-base');
    localStorage.setItem('app_font_size', fontSize);
  }, [fontSize]);

  const isGoogleUser = user?.provider === 'google' || !user?.has_password;

  // Profile Form
  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors, isDirty: isProfileDirty }, reset: resetProfile } = useForm({
    defaultValues: { full_name: user?.full_name || '', email: user?.email || '', contact: user?.contact || '' }
  });

  // Farm Form
  const { register: registerFarm, handleSubmit: handleFarmSubmit, formState: { errors: farmErrors, isDirty: isFarmDirty }, setValue: setFarmValue, watch: watchFarm } = useForm({
    defaultValues: { farm_name: user?.farm?.name || '', address: user?.address || '', city: user?.city || '', country: user?.country || '' }
  });
  const selectedCountry = watchFarm('country');
  const [currency, setCurrency] = useState(() => localStorage.getItem('app_currency') || 'USD');

  useEffect(() => {
    if (selectedCountry && countryCurrencyMap[selectedCountry]) {
      const suggested = countryCurrencyMap[selectedCountry];
      if (suggested !== currency) {
        setCurrency(suggested);
        localStorage.setItem('app_currency', suggested);
        toast.success(`Currency set to ${suggested} for ${selectedCountry}`, { icon: '🌍' });
      }
    }
  }, [selectedCountry, currency]);

  // Notifications
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    const saved = localStorage.getItem('notificationPrefs');
    return saved ? JSON.parse(saved) : {
      emailAlerts: true, pushNotifications: true, productionUpdates: true,
      inventoryAlerts: true, mortalityWarnings: true, weeklyReport: false,
    };
  });

  // Password form
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }, reset: resetPassword, watch: watchPassword } = useForm({
    defaultValues: { current_password: '', new_password: '', confirm_password: '' }
  });
  const newPasswordValue = watchPassword('new_password');
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(newPasswordValue));
  }, [newPasswordValue]);

  // Dirty form guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProfileDirty || isFarmDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProfileDirty, isFarmDirty]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && showPasswordModal) setShowPasswordModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showPasswordModal]);

  const onProfileSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const updated = await authService.updateProfile(data);
      setUser(updated);
      resetProfile(data);
      toast.success('Profile saved successfully');
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFarmSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await authService.updateFarmDetails(data);
      setUser(prev => ({ ...prev, farm: { ...prev.farm, name: data.farm_name }, address: data.address, city: data.city, country: data.country }));
      toast.success('Farm details updated');
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to update farm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      if (passwordModalMode === 'set') {
        await authService.setPassword({ new_password: data.new_password });
        toast.success('Password set! You can now log in with email and password.');
      } else {
        await authService.changePassword({ current_password: data.current_password, new_password: data.new_password });
        toast.success('Password changed successfully');
      }
      setShowPasswordModal(false);
      resetPassword();
      const refreshed = await authService.getProfile();
      setUser(refreshed);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to update password');
    }
  };

  const handleNotificationToggle = (key) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveNotificationPrefs = () => {
    localStorage.setItem('notificationPrefs', JSON.stringify(notificationPrefs));
    toast.success('Notification preferences saved');
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    toast.success(`${newTheme === 'dark' ? 'Dark' : newTheme === 'light' ? 'Light' : 'System'} mode enabled`);
  };

  const handleCountryChange = (countryCode) => {
    setFarmValue('country', countryCode);
    const newCurrency = countryCurrencyMap[countryCode] || 'USD';
    setCurrency(newCurrency);
    localStorage.setItem('app_currency', newCurrency);
    toast.success(`${countryCode} → ${newCurrency}`);
  };

  const openPasswordModal = (mode) => {
    setPasswordModalMode(mode);
    setShowPasswordModal(true);
  };

  const MobileTabSelect = () => (
    <div className="sm:hidden relative">
      <select
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value)}
        className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 pr-8"
      >
        {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
    </div>
  );

  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-2">
          Customise your account, farm, and application preferences
        </p>
      </div>

      <div className="relative">
        <div className="hidden sm:block border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-1 sm:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isActive
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
                </button>
              );
            })}
          </nav>
        </div>
        <MobileTabSelect />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <User size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Profile Information</h2>
                  <p className="text-sm text-gray-500">Update your personal details</p>
                </div>
              </div>
              {authLoading ? (
                <div className="space-y-4"><SkeletonField /><SkeletonField /><SkeletonField /></div>
              ) : (
                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                      <input {...registerProfile('full_name', { required: 'Full name is required' })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 transition"
                      />
                      {profileErrors.full_name && <p className="text-red-500 text-xs mt-1">{profileErrors.full_name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="email" {...registerProfile('email', { required: 'Email is required' })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700"
                        />
                      </div>
                      {profileErrors.email && <p className="text-red-500 text-xs mt-1">{profileErrors.email.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input {...registerProfile('contact')} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Tooltip text={!isProfileDirty ? 'No changes to save' : 'Save your profile changes'}>
                      <button type="submit" disabled={isSubmitting || !isProfileDirty}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </Tooltip>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {activeTab === 'farm' && (
            <motion.div
              key="farm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Building size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Farm Information</h2>
                  <p className="text-sm text-gray-500">Manage your farm location and currency</p>
                </div>
              </div>
              <form onSubmit={handleFarmSubmit(onFarmSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Farm Name *</label>
                    <input {...registerFarm('farm_name', { required: 'Farm name is required' })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700"
                    />
                    {farmErrors.farm_name && <p className="text-red-500 text-xs mt-1">{farmErrors.farm_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input {...registerFarm('address')} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                    <input {...registerFarm('city')} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country & Currency</label>
                    <select value={selectedCountry} onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500">
                      <option value="">Select country</option>
                      {countries.map(c => <option key={c} value={c}>{c} {countryCurrencyMap[c] ? `(${countryCurrencyMap[c]})` : ''}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><DollarSign size={12} /> Currency: <span className="font-semibold">{currency}</span> (auto-set)</p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Tooltip text={!isFarmDirty ? 'No changes to save' : 'Save farm details'}>
                    <button type="submit" disabled={isSubmitting || !isFarmDirty}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition shadow-md disabled:opacity-50">
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      Save Farm
                    </button>
                  </Tooltip>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Shield size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Security</h2>
                  <p className="text-sm text-gray-500">Manage your password and account security</p>
                </div>
              </div>
              <div className={`rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4 transition ${isGoogleUser ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200' : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200'}`}>
                <div className="flex-1">
                  <p className="font-semibold flex items-center gap-2"><Key size={18} />{isGoogleUser ? 'Set a Password' : 'Change Password'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{isGoogleUser ? 'You signed in with Google. Set a password to enable email login.' : 'Update your password regularly for better security'}</p>
                </div>
                <button onClick={() => openPasswordModal(isGoogleUser ? 'set' : 'change')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition shadow-md">
                  <Shield size={16} />{isGoogleUser ? 'Set Password' : 'Change Password'}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              key="preferences"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Globe size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Preferences</h2>
                  <p className="text-sm text-gray-500">Currency and regional settings</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <div>
                  <p className="font-medium flex items-center gap-2"><DollarSign size={16} /> Currency</p>
                  <p className="text-sm text-gray-500">Currently using <strong>{currency}</strong> (auto-detected from farm country)</p>
                </div>
                <select value={currency} onChange={(e) => { setCurrency(e.target.value); localStorage.setItem('app_currency', e.target.value); toast.success(`Currency changed to ${e.target.value}`); }}
                  className="mt-3 sm:mt-0 border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700 shadow-sm">
                  {currencies.map(code => <option key={code} value={code}>{code}</option>)}
                </select>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <Bell size={24} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Notifications</h2>
                  <p className="text-sm text-gray-500">Choose what alerts you receive</p>
                </div>
              </div>
              <div className="space-y-4">
                {Object.entries({
                  emailAlerts: 'Email Alerts', pushNotifications: 'Push Notifications', productionUpdates: 'Production Updates',
                  inventoryAlerts: 'Inventory Alerts', mortalityWarnings: 'Mortality Warnings', weeklyReport: 'Weekly Reports'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{label}</p>
                      <p className="text-xs text-gray-500">
                        {key === 'emailAlerts' && 'Receive notifications via email'}
                        {key === 'pushNotifications' && 'In‑app notifications'}
                        {key === 'productionUpdates' && 'Daily production summaries'}
                        {key === 'inventoryAlerts' && 'Low stock reminders'}
                        {key === 'mortalityWarnings' && 'Unusual mortality alerts'}
                        {key === 'weeklyReport' && 'Weekly performance summary'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={notificationPrefs[key]} onChange={() => handleNotificationToggle(key)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
                <div className="flex justify-end pt-3">
                  <button onClick={saveNotificationPrefs} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition shadow-md">
                    <Save size={18} /> Save Preferences
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <Moon size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Appearance</h2>
                  <p className="text-sm text-gray-500">Customise the look and feel</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm text-gray-500">Light, dark, or follow system</p>
                  </div>
                  <div className="flex gap-3">
                    {['light', 'dark', 'system'].map(mode => (
                      <button key={mode} onClick={() => handleThemeChange(mode)}
                        className={`px-5 py-2 rounded-xl flex items-center gap-2 transition shadow-sm capitalize ${
                          theme === mode ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                        }`}>
                        {mode === 'light' ? <Sun size={18} /> : mode === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div>
                    <p className="font-medium flex items-center gap-2"><Type size={16} /> Font Size</p>
                    <p className="text-sm text-gray-500">Adjust text size globally</p>
                  </div>
                  <div className="flex gap-2">
                    {['small', 'medium', 'large'].map(size => (
                      <button key={size} onClick={() => setFontSize(size)}
                        className={`px-5 py-2 rounded-xl capitalize transition shadow-sm ${
                          fontSize === size ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                        }`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPasswordModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Lock size={20} className="text-blue-600" />
                  {passwordModalMode === 'set' ? 'Set Password' : 'Change Password'}
                </h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition" aria-label="Close">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="p-5 space-y-4">
                {passwordModalMode === 'change' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Password</label>
                    <div className="relative">
                      <input type={showCurrentPassword ? 'text' : 'password'} {...registerPassword('current_password', { required: 'Current password is required' })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 pr-10" />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {passwordErrors.current_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.current_password.message}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <div className="relative">
                    <input type={showNewPassword ? 'text' : 'password'} {...registerPassword('new_password', { required: 'New password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 pr-10" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {newPasswordValue && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }} />
                        </div>
                        <span className={`text-xs ${passwordStrength.textColor}`}>{passwordStrength.label}</span>
                      </div>
                    </div>
                  )}
                  {passwordErrors.new_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.new_password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} {...registerPassword('confirm_password', { required: 'Please confirm', validate: value => value === watchPassword('new_password') || 'Passwords do not match' })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-700 pr-10" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordErrors.confirm_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.confirm_password.message}</p>}
                </div>
                <div className="flex justify-end gap-3 pt-3">
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPasswordSubmitting} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition shadow-md">
                    {isPasswordSubmitting && <Loader2 className="animate-spin" size={16} />}
                    {passwordModalMode === 'set' ? 'Set Password' : 'Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}