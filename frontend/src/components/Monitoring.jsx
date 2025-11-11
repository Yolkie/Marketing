import React, { useState, useEffect } from 'react';
import { api } from '../api-config';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart3, RefreshCw, Facebook, TrendingUp, Eye, Heart, MessageCircle, Share2, MousePointerClick, Video, Link as LinkIcon, AlertCircle, Loader, X } from 'lucide-react';

const Monitoring = ({ user, onBack }) => {
  const { theme } = useTheme();
  const [publishedContent, setPublishedContent] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [postIdInputs, setPostIdInputs] = useState({});

  useEffect(() => {
    loadPublishedContent();
    loadMetrics();
  }, []);

  const loadPublishedContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getContent('published');
      if (data.content) {
        setPublishedContent(data.content);
      }
    } catch (err) {
      setError(err.message || 'Failed to load published content');
      console.error('Error loading published content:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await api.getAllFacebookMetrics();
      if (data.metrics) {
        const metricsMap = {};
        data.metrics.forEach(metric => {
          metricsMap[metric.content_item_id] = metric;
        });
        setMetrics(metricsMap);
      }
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  };

  const handleSyncMetrics = async (contentItemId) => {
    const postId = (postIdInputs[contentItemId] || '').trim();
    if (!postId) {
      setError('Please enter a Facebook post ID');
      return;
    }

    try {
      setSyncing(prev => ({ ...prev, [contentItemId]: true }));
      setError(null);
      setSuccess(null);

      const result = await api.syncFacebookMetrics(contentItemId, postId);
      
      if (result.metrics) {
        setMetrics(prev => ({
          ...prev,
          [contentItemId]: result.metrics
        }));
        setSuccess(`Metrics synced successfully for ${result.metrics.post_id}`);
        setPostIdInputs(prev => ({ ...prev, [contentItemId]: '' }));
        setSelectedItem(null);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to sync metrics');
      console.error('Error syncing metrics:', err);
    } finally {
      setSyncing(prev => ({ ...prev, [contentItemId]: false }));
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brutal-light-bg dark:bg-brutal-dark-bg">
        <div className="text-center card-brutal p-8">
          <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-black dark:text-white font-bold text-lg">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-light-bg dark:bg-brutal-dark-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-black dark:text-white" />
            <h1 className="text-3xl font-bold text-black dark:text-white">Monitoring</h1>
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

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border-2 border-red-500 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-800 dark:text-red-200 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-200 font-bold">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm underline text-red-800 dark:text-red-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border-2 border-green-500 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-bold">{success}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 rounded-lg">
          <div className="flex items-start gap-3">
            <Facebook className="w-5 h-5 text-blue-800 dark:text-blue-200 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-bold mb-1">Connect Facebook API</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Configure your Facebook API credentials in Settings to start tracking engagement metrics for published ads.
              </p>
            </div>
          </div>
        </div>

        {/* Published Content List */}
        {publishedContent.length === 0 ? (
          <div className="card-brutal p-8 text-center">
            <BarChart3 className="w-16 h-16 text-black dark:text-white mx-auto mb-4 opacity-50" />
            <p className="text-black dark:text-white font-bold text-lg mb-2">No Published Content</p>
            <p className="text-gray-600 dark:text-gray-400">
              Content that has been approved and published will appear here for monitoring.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {publishedContent.map((item) => {
              const itemMetrics = metrics[item.id];
              const isSyncing = syncing[item.id];

              return (
                <div
                  key={item.id}
                  className="card-brutal p-6 hover:shadow-brutal-lg transition-all"
                >
                  {/* Content Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.filename}
                        className="w-20 h-20 object-cover border-2 border-black dark:border-white"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-black dark:text-white truncate mb-1">
                        {item.filename}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.fileType === 'video' ? 'Video' : 'Image'}
                      </p>
                      {itemMetrics && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Post ID: {itemMetrics.post_id}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metrics Display */}
                  {itemMetrics ? (
                    <div className="space-y-4">
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Eye className="w-4 h-4 text-black dark:text-white" />
                            <span className="text-xs font-bold text-black dark:text-white uppercase">Reach</span>
                          </div>
                          <p className="text-xl font-black text-black dark:text-white">
                            {formatNumber(itemMetrics.reach)}
                          </p>
                        </div>
                        <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-black dark:text-white" />
                            <span className="text-xs font-bold text-black dark:text-white uppercase">Impressions</span>
                          </div>
                          <p className="text-xl font-black text-black dark:text-white">
                            {formatNumber(itemMetrics.impressions)}
                          </p>
                        </div>
                        <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Heart className="w-4 h-4 text-black dark:text-white" />
                            <span className="text-xs font-bold text-black dark:text-white uppercase">Engagements</span>
                          </div>
                          <p className="text-xl font-black text-black dark:text-white">
                            {formatNumber(itemMetrics.engagements)}
                          </p>
                        </div>
                        <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <MousePointerClick className="w-4 h-4 text-black dark:text-white" />
                            <span className="text-xs font-bold text-black dark:text-white uppercase">Clicks</span>
                          </div>
                          <p className="text-xl font-black text-black dark:text-white">
                            {formatNumber(itemMetrics.clicks)}
                          </p>
                        </div>
                      </div>

                      {/* Detailed Metrics */}
                      <div className="border-2 border-black dark:border-white bg-white dark:bg-black p-4">
                        <h4 className="font-bold text-black dark:text-white mb-3 uppercase text-sm">Detailed Metrics</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-black dark:text-white" />
                            <span className="text-black dark:text-white">Likes:</span>
                            <span className="font-bold text-black dark:text-white">{formatNumber(itemMetrics.likes)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-black dark:text-white" />
                            <span className="text-black dark:text-white">Comments:</span>
                            <span className="font-bold text-black dark:text-white">{formatNumber(itemMetrics.comments)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-black dark:text-white" />
                            <span className="text-black dark:text-white">Shares:</span>
                            <span className="font-bold text-black dark:text-white">{formatNumber(itemMetrics.shares)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-black dark:text-white" />
                            <span className="text-black dark:text-white">Reactions:</span>
                            <span className="font-bold text-black dark:text-white">{formatNumber(itemMetrics.reactions)}</span>
                          </div>
                          {item.fileType === 'video' && itemMetrics.video_views > 0 && (
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4 text-black dark:text-white" />
                              <span className="text-black dark:text-white">Video Views:</span>
                              <span className="font-bold text-black dark:text-white">{formatNumber(itemMetrics.video_views)}</span>
                            </div>
                          )}
                          {itemMetrics.link_clicks > 0 && (
                            <div className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-black dark:text-white" />
                              <span className="text-black dark:text-white">Link Clicks:</span>
                              <span className="font-bold text-black dark:text-white">{formatNumber(itemMetrics.link_clicks)}</span>
                            </div>
                          )}
                        </div>
                        {itemMetrics.last_synced_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                            Last synced: {formatDate(itemMetrics.last_synced_at)}
                          </p>
                        )}
                      </div>

                      {/* Refresh Button */}
                      <button
                        onClick={() => {
                          setSelectedItem(item.id);
                          setPostIdInputs(prev => ({ ...prev, [item.id]: itemMetrics.post_id || '' }));
                        }}
                        disabled={isSyncing}
                        className="btn-brutal w-full flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSyncing ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Refresh Metrics
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No metrics available. Connect this content to a Facebook post to start tracking.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedItem(item.id);
                          setPostIdInputs(prev => ({ ...prev, [item.id]: '' }));
                        }}
                        className="btn-brutal-primary w-full flex items-center justify-center gap-2"
                      >
                        <Facebook className="w-4 h-4" />
                        Connect Facebook Post
                      </button>
                    </div>
                  )}

                  {/* Post ID Input Modal */}
                  {selectedItem === item.id && (
                    <div className="mt-4 border-4 border-black dark:border-white bg-white dark:bg-black p-4">
                      <h4 className="font-bold text-black dark:text-white mb-3 uppercase text-sm">
                        {itemMetrics ? 'Update' : 'Connect'} Facebook Post
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-bold text-black dark:text-white mb-2">
                            Facebook Post ID
                          </label>
                          <input
                            type="text"
                            value={postIdInputs[item.id] || ''}
                            onChange={(e) => setPostIdInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="e.g., 123456789_987654321"
                            className="input-brutal w-full"
                          />
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            Find the post ID in the Facebook post URL or from Facebook Business Manager
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSyncMetrics(item.id)}
                            disabled={isSyncing || !(postIdInputs[item.id] || '').trim()}
                            className="btn-brutal-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isSyncing ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                {itemMetrics ? 'Update' : 'Connect'}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(null);
                              setPostIdInputs(prev => ({ ...prev, [item.id]: '' }));
                            }}
                            className="btn-brutal px-4"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitoring;

