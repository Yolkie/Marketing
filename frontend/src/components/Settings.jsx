import React, { useState, useEffect } from 'react';
import { api } from '../api-config';
import { useTheme } from '../contexts/ThemeContext';
import { Settings as SettingsIcon, Save, X, Eye, EyeOff } from 'lucide-react';

const Settings = ({ user, onBack }) => {
  const { theme } = useTheme();
  const [settings, setSettings] = useState({
    google_drive_folder_id: '',
    google_drive_api_key: '',
    n8n_recaption_webhook_url: '',
    facebook_app_id: '',
    facebook_app_secret: '',
    facebook_access_token: '',
    facebook_page_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSettings();
      if (data.settings) {
        setSettings({
          google_drive_folder_id: data.settings.google_drive_folder_id?.value || '',
          google_drive_api_key: data.settings.google_drive_api_key?.value || '',
          n8n_recaption_webhook_url: data.settings.n8n_recaption_webhook_url?.value || '',
          facebook_app_id: data.settings.facebook_app_id?.value || '',
          facebook_app_secret: data.settings.facebook_app_secret?.value || '',
          facebook_access_token: data.settings.facebook_access_token?.value || '',
          facebook_page_id: data.settings.facebook_page_id?.value || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await api.updateSettings({
        google_drive_folder_id: settings.google_drive_folder_id,
        google_drive_api_key: settings.google_drive_api_key,
        n8n_recaption_webhook_url: settings.n8n_recaption_webhook_url,
        facebook_app_id: settings.facebook_app_id,
        facebook_app_secret: settings.facebook_app_secret,
        facebook_access_token: settings.facebook_access_token,
        facebook_page_id: settings.facebook_page_id,
      });

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brutal-light-bg dark:bg-brutal-dark-bg">
        <div className="text-center card-brutal p-8">
          <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-black dark:text-white font-bold text-lg">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-light-bg dark:bg-brutal-dark-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-black dark:text-white" />
            <h1 className="text-3xl font-bold text-black dark:text-white">Settings</h1>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="btn-brutal flex items-center gap-2 px-4 py-2"
            >
              <X className="w-5 h-5" />
              Back
            </button>
          )}
        </div>

        {/* Settings Form */}
        <div className="card-brutal p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Google Drive Folder ID */}
            <div>
              <label
                htmlFor="folder_id"
                className="block text-sm font-bold text-black dark:text-white mb-2"
              >
                Google Drive Folder ID
              </label>
              <input
                id="folder_id"
                type="text"
                value={settings.google_drive_folder_id}
                onChange={(e) => handleChange('google_drive_folder_id', e.target.value)}
                className="input-brutal w-full"
                placeholder="Enter Google Drive Folder ID"
              />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                The ID of the Google Drive folder to sync content from
              </p>
            </div>

            {/* Google Drive API Key */}
            <div>
              <label
                htmlFor="api_key"
                className="block text-sm font-bold text-black dark:text-white mb-2"
              >
                Google Drive API Key
              </label>
              <div className="relative">
                <input
                  id="api_key"
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.google_drive_api_key}
                  onChange={(e) => handleChange('google_drive_api_key', e.target.value)}
                  className="input-brutal w-full pr-12"
                  placeholder="Enter Google Drive API Key"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white hover:opacity-70"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Your Google Drive API key for authentication
              </p>
            </div>

            {/* n8n Re-caption Webhook URL */}
            <div>
              <label
                htmlFor="n8n_recaption_webhook_url"
                className="block text-sm font-bold text-black dark:text-white mb-2"
              >
                n8n Re-caption Webhook URL
              </label>
              <input
                id="n8n_recaption_webhook_url"
                type="url"
                value={settings.n8n_recaption_webhook_url}
                onChange={(e) => handleChange('n8n_recaption_webhook_url', e.target.value)}
                className="input-brutal w-full"
                placeholder="https://your-n8n-instance.com/webhook/recaption"
              />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                The n8n webhook URL for the re-caption workflow. This triggers AI caption generation when the Re-caption button is clicked.
              </p>
            </div>

            {/* Facebook API Settings Section */}
            <div className="border-t-4 border-black dark:border-white pt-6 mt-6">
              <h3 className="text-xl font-black text-black dark:text-white mb-4 uppercase">Facebook API Settings</h3>
              
              {/* Facebook App ID */}
              <div className="mb-6">
                <label
                  htmlFor="facebook_app_id"
                  className="block text-sm font-bold text-black dark:text-white mb-2"
                >
                  Facebook App ID
                </label>
                <input
                  id="facebook_app_id"
                  type="text"
                  value={settings.facebook_app_id}
                  onChange={(e) => handleChange('facebook_app_id', e.target.value)}
                  className="input-brutal w-full"
                  placeholder="Enter Facebook App ID"
                />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Your Facebook App ID from Facebook Developers Console
                </p>
              </div>

              {/* Facebook App Secret */}
              <div className="mb-6">
                <label
                  htmlFor="facebook_app_secret"
                  className="block text-sm font-bold text-black dark:text-white mb-2"
                >
                  Facebook App Secret
                </label>
                <div className="relative">
                  <input
                    id="facebook_app_secret"
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.facebook_app_secret}
                    onChange={(e) => handleChange('facebook_app_secret', e.target.value)}
                    className="input-brutal w-full pr-12"
                    placeholder="Enter Facebook App Secret"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white hover:opacity-70"
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Your Facebook App Secret from Facebook Developers Console
                </p>
              </div>

              {/* Facebook Access Token */}
              <div className="mb-6">
                <label
                  htmlFor="facebook_access_token"
                  className="block text-sm font-bold text-black dark:text-white mb-2"
                >
                  Facebook Access Token
                </label>
                <div className="relative">
                  <input
                    id="facebook_access_token"
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.facebook_access_token}
                    onChange={(e) => handleChange('facebook_access_token', e.target.value)}
                    className="input-brutal w-full pr-12"
                    placeholder="Enter Facebook Access Token"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white hover:opacity-70"
                  >
                    {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Facebook Access Token with pages_read_engagement and pages_read_user_content permissions
                </p>
              </div>

              {/* Facebook Page ID */}
              <div className="mb-6">
                <label
                  htmlFor="facebook_page_id"
                  className="block text-sm font-bold text-black dark:text-white mb-2"
                >
                  Facebook Page ID
                </label>
                <input
                  id="facebook_page_id"
                  type="text"
                  value={settings.facebook_page_id}
                  onChange={(e) => handleChange('facebook_page_id', e.target.value)}
                  className="input-brutal w-full"
                  placeholder="Enter Facebook Page ID"
                />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  The Facebook Page ID to monitor (optional, can be extracted from post ID)
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900 border-2 border-red-500 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-bold">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-100 dark:bg-green-900 border-2 border-green-500 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-bold">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-brutal flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="btn-brutal flex items-center gap-2 px-6 py-3"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;

