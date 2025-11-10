import { useState, useEffect } from 'react';
import { FileVideo, Clock, CheckCircle, Edit3, Loader, Eye, ThumbsUp, AlertCircle, Settings, Moon, Sun, LogOut, RefreshCw, Users } from 'lucide-react';
import { useTheme } from './src/contexts/ThemeContext.jsx';
import { api } from './src/api-config.js';

const ContentReviewDashboard = ({ user, onLogout, onSettingsClick, onUsersClick, isAdmin = false }) => {
  const { theme, toggleTheme } = useTheme();
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingCaption, setEditingCaption] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [error, setError] = useState(null);

  // Google Drive API helper functions
  const getDriveFileUrl = (fileId) => {
    return `https://drive.google.com/file/d/${fileId}/view`;
  };

  const getDriveThumbnailUrl = (fileId, isVideo = false) => {
    if (isVideo) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  };

  const getDriveEmbedUrl = (fileId, isVideo = false) => {
    if (isVideo) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  };

  // Fetch files from Google Drive folder
  const fetchDriveFiles = async (folderId, apiKey) => {
    if (!folderId || !apiKey) {
      throw new Error('Google Drive Folder ID and API Key are required');
    }

    if (!folderId.trim()) {
      throw new Error('Folder ID cannot be empty');
    }
    if (!apiKey.trim()) {
      throw new Error('API Key cannot be empty');
    }

    try {
      const query = `'${folderId}' in parents and (mimeType contains 'video/' or mimeType contains 'image/')`;
      const fields = 'files(id,name,mimeType,createdTime,thumbnailLink,webViewLink)';
      
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('q', query);
      url.searchParams.set('fields', fields);
      url.searchParams.set('key', apiKey.trim());

      const folderResponse = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!folderResponse.ok) {
        let errorMessage = 'Failed to fetch files from Google Drive';
        try {
          const errorData = await folderResponse.json();
          if (errorData.error) {
            errorMessage = errorData.error.message || errorMessage;
          }
        } catch (parseError) {
          errorMessage = `HTTP ${folderResponse.status}: ${folderResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const folderData = await folderResponse.json();
      const files = folderData.files || [];

      const transformedFiles = files.map((file) => {
        const isVideo = file.mimeType?.startsWith('video/') || false;
        const isImage = file.mimeType?.startsWith('image/') || false;
        
        if (!isVideo && !isImage) return null;

        return {
          id: file.id,
          filename: file.name,
          fileType: isVideo ? 'video' : 'image',
          uploadedAt: file.createdTime || new Date().toISOString(),
          status: 'pending_review',
          driveUrl: getDriveFileUrl(file.id),
          thumbnailUrl: file.thumbnailLink || getDriveThumbnailUrl(file.id, isVideo),
          embedUrl: getDriveEmbedUrl(file.id, isVideo),
          mimeType: file.mimeType,
          captions: generateCaptions(file.name, isVideo)
        };
      }).filter(Boolean);

      return transformedFiles;
    } catch (err) {
      throw err;
    }
  };

  // Load content from database (includes captions from database)
  const loadVideos = async () => {
    setLoading(true);
    setError(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      try {
        // Fetch content from database - this includes captions loaded from database
        const response = await fetch(`${API_BASE_URL}/content`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText}\n\n${errorText}`);
          }
          
          let errorMessage = errorData.error || errorData.message || 'Failed to fetch content from database';
          throw new Error(errorMessage);
        }

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          throw new Error('Failed to parse backend response: ' + parseError.message);
        }
        
        // Content items from database already include captions loaded via LEFT JOIN
        const contentItems = data.content || [];
        
        // Transform to match expected format (captions are already included from database)
        const formattedContent = contentItems.map(item => {
          // Extract drive_file_id from driveUrl if not provided
          let driveFileId = item.driveFileId;
          if (!driveFileId && item.driveUrl) {
            const match = item.driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match) driveFileId = match[1];
          }
          
          // Generate thumbnail URL from drive_file_id if missing
          let thumbnailUrl = item.thumbnailUrl;
          if (!thumbnailUrl && driveFileId) {
            thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`;
          }
          
          // Generate embed URL if missing
          let embedUrl = item.embedUrl;
          if (!embedUrl && driveFileId) {
            embedUrl = item.fileType === 'video'
              ? `https://drive.google.com/file/d/${driveFileId}/preview`
              : `https://drive.google.com/uc?export=view&id=${driveFileId}`;
          }
          
          return {
            id: item.id,
            filename: item.filename,
            fileType: item.fileType,
            uploadedAt: item.uploadedAt,
            status: item.status,
            driveUrl: item.driveUrl,
            thumbnailUrl: thumbnailUrl,
            embedUrl: embedUrl,
            mimeType: item.mimeType,
            driveFileId: driveFileId, // Store for fallback
            // Captions are already loaded from database via content_item_id
            captions: item.captions || []
          };
        });
        
        setVideos(formattedContent);
        return;
      } catch (backendError) {
        if (backendError.message.includes('Failed to fetch') || 
            backendError.message.includes('NetworkError') ||
            backendError.message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error(
            '❌ Cannot connect to backend server!\n\n' +
            'Please make sure:\n' +
            '1. Backend server is running: `cd backend && npm run dev`\n' +
            '2. Backend is running on http://localhost:3001\n' +
            `Tried to connect to: ${API_BASE_URL}/content`
          );
        }
        throw backendError;
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load content from database';
      setError(errorMessage);
      console.error('Error loading content:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load files from Google Drive on dashboard startup
  useEffect(() => {
    loadVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for caption updates when a content item is selected
  useEffect(() => {
    if (!selectedVideo) return;

    const contentItemId = selectedVideo.id;

    // Poll every 3 seconds for updates when viewing a content item
    const pollInterval = setInterval(async () => {
      try {
        const data = await api.getContentItem(contentItemId);
        if (data.content) {
          const newCaptions = data.content.captions || [];
          
          // Update state using functional updates to always get latest state
          setSelectedVideo(prev => {
            if (!prev || prev.id !== contentItemId) return prev;
            
            // Check if captions have actually changed
            const captionsChanged = JSON.stringify(prev.captions) !== JSON.stringify(newCaptions);
            
            if (captionsChanged) {
              return { ...prev, captions: newCaptions };
            }
            return prev;
          });
          
          // Also update it in the videos list
          setVideos(prevVideos => 
            prevVideos.map(v => {
              if (v.id === contentItemId) {
                const captionsChanged = JSON.stringify(v.captions) !== JSON.stringify(newCaptions);
                return captionsChanged ? { ...v, captions: newCaptions } : v;
              }
              return v;
            })
          );
        }
      } catch (err) {
        // Silently fail polling errors - don't spam console
        console.debug('Polling error (non-critical):', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [selectedVideo?.id]); // Re-run when selected video changes

  const filteredVideos = videos.filter(v => {
    if (filter === 'pending') return v.status === 'pending_review';
    if (filter === 'approved') return v.status === 'approved';
    if (filter === 'published') return v.status === 'published';
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleSelectVideo = (video) => {
    setSelectedVideo(video);
    setEditingCaption(null);
  };

  const handleEditCaption = (caption) => {
    setEditingCaption(caption.id);
    setEditedText(caption.content);
  };

  const handleSaveEdit = async (captionId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call API to update caption (backend will handle version increment)
      const response = await api.updateCaption(captionId, editedText);
      
      // Update local state with the response from backend
      const updatedVideos = videos.map(v => {
        if (v.id === selectedVideo.id) {
          return {
            ...v,
            captions: v.captions.map(c => {
              if (c.id === captionId) {
                // Use the version from backend response (ensures it's a number)
                return { 
                  ...c, 
                  content: response.caption.content, 
                  version: Number(response.caption.version) || 1 
                };
              }
              return c;
            })
          };
        }
        return v;
      });
      
      setVideos(updatedVideos);
      setSelectedVideo(updatedVideos.find(v => v.id === selectedVideo.id));
      setEditingCaption(null);
    } catch (err) {
      console.error('Error saving caption:', err);
      setError(err.message || 'Failed to save caption');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCaption = async (captionId) => {
    setLoading(true);
    
    setTimeout(() => {
      const updatedVideos = videos.map(v => {
        if (v.id === selectedVideo.id) {
          return {
            ...v,
            status: 'approved',
            captions: v.captions.map(c => {
              if (c.id === captionId) {
                return { 
                  ...c, 
                  status: 'approved',
                  approvedBy: user?.name || 'Current User',
                  approvedAt: new Date().toISOString()
                };
              }
              return c;
            })
          };
        }
        return v;
      });
      
      setVideos(updatedVideos);
      setSelectedVideo(null);
      setLoading(false);
    }, 1000);
  };

  const handleRecaption = async () => {
    if (!selectedVideo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.recaption(selectedVideo.id);
      console.log('Re-caption triggered:', response);
      
      // Show success message
      alert('Re-caption request sent! New captions will be generated and appear automatically.');
      
      // Polling will automatically pick up the new captions, no need to manually refresh
      // The polling effect will detect changes and update the UI
    } catch (err) {
      console.error('Re-caption error:', err);
      setError(err.message || 'Failed to trigger re-caption');
    } finally {
      setLoading(false);
    }
  };

  const getToneColor = (tone) => {
    const colors = {
      'Professional': 'bg-blue-500 text-white border-blue-600',
      'Casual': 'bg-green-500 text-white border-green-600',
      'Engaging': 'bg-purple-500 text-white border-purple-600'
    };
    return colors[tone] || 'bg-gray-500 text-white border-gray-600';
  };

  return (
    <div className="min-h-screen bg-brutal-light-bg dark:bg-brutal-dark-bg grid-brutal">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b-4 border-black dark:border-white bg-white dark:bg-black shadow-brutal-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="border-4 border-black dark:border-white bg-black dark:bg-white p-3 shadow-brutal">
                <FileVideo className="w-8 h-8 text-white dark:text-black" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white uppercase tracking-tight">
                  Content Review
                </h1>
                <p className="text-sm font-bold text-black dark:text-white opacity-70 uppercase tracking-wider mt-1">
                  AI-Generated Captions
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={toggleTheme}
                className="btn-brutal p-3"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              {isAdmin && onSettingsClick && (
                <button
                  onClick={onSettingsClick}
                  className="btn-brutal px-4 py-2 text-sm font-black uppercase tracking-wider"
                  title="Admin Settings"
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Settings
                </button>
              )}
              {isAdmin && onUsersClick && (
                <button
                  onClick={onUsersClick}
                  className="btn-brutal px-4 py-2 text-sm font-black uppercase tracking-wider"
                  title="User Management"
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Users
                </button>
              )}
              <button
                onClick={loadVideos}
                disabled={loading}
                className="btn-brutal px-4 py-2 text-sm font-black uppercase tracking-wider disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={onLogout}
                className="btn-brutal px-4 py-2 text-sm font-black uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4 inline mr-2" />
                Logout
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-3 mt-4 flex-wrap">
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-3 text-sm font-black uppercase tracking-wider border-4 transition-all ${
                filter === 'pending'
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-brutal'
                  : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white shadow-brutal-sm hover:shadow-brutal'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Pending ({videos.filter(v => v.status === 'pending_review').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-6 py-3 text-sm font-black uppercase tracking-wider border-4 transition-all ${
                filter === 'approved'
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-brutal'
                  : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white shadow-brutal-sm hover:shadow-brutal'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Approved ({videos.filter(v => v.status === 'approved').length})
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="border-4 border-red-500 bg-red-500 p-6 shadow-brutal">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-black text-white mb-2 uppercase">Error</h4>
                <p className="text-sm font-bold text-white whitespace-pre-line">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 btn-brutal text-sm font-black uppercase"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-tight mb-4">
              Content Assets
            </h2>
            
            {loading && filteredVideos.length === 0 ? (
              <div className="card-brutal p-8 text-center">
                <Loader className="w-8 h-8 text-black dark:text-white animate-spin mx-auto mb-4" />
                <p className="font-bold text-black dark:text-white">Loading...</p>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="card-brutal p-8 text-center">
                <AlertCircle className="w-12 h-12 text-black dark:text-white mx-auto mb-4" />
                <p className="font-bold text-black dark:text-white mb-4">No content found</p>
                <button
                  onClick={loadVideos}
                  className="btn-brutal-primary px-6 py-3 uppercase tracking-wider"
                >
                  Refresh
                </button>
              </div>
            ) : (
              filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleSelectVideo(video)}
                  className={`card-brutal p-4 cursor-pointer transition-all ${
                    selectedVideo?.id === video.id
                      ? 'border-4 border-black dark:border-white shadow-brutal-lg'
                      : 'hover:shadow-brutal-lg'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative border-2 border-black dark:border-white">
                      <img 
                        src={video.thumbnailUrl || (video.driveFileId ? `https://drive.google.com/thumbnail?id=${video.driveFileId}&sz=w400` : '')} 
                        alt={video.filename}
                        className={`w-20 object-cover ${video.fileType === 'video' ? 'h-14' : 'h-20'}`}
                        onError={(e) => {
                          // Fallback: generate thumbnail from driveFileId if image fails to load
                          if (video.driveFileId && e.target.src !== `https://drive.google.com/thumbnail?id=${video.driveFileId}&sz=w400`) {
                            e.target.src = `https://drive.google.com/thumbnail?id=${video.driveFileId}&sz=w400`;
                          } else if (!video.driveFileId && video.driveUrl) {
                            // Extract drive_file_id from driveUrl as last resort
                            const match = video.driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                            if (match) {
                              e.target.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
                            }
                          }
                        }}
                      />
                      <span className={`absolute -top-2 -right-2 border-2 border-black dark:border-white px-2 py-1 text-xs font-black ${
                        video.fileType === 'video' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-purple-500 text-white'
                      }`}>
                        {video.fileType === 'video' ? '▶' : '🖼'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm text-black dark:text-white truncate uppercase">
                        {video.filename}
                      </h3>
                      <p className="text-xs font-bold text-black dark:text-white opacity-70 mt-1">
                        {formatDate(video.uploadedAt)}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {video.status === 'pending_review' && (
                          <span className="border-2 border-black dark:border-white bg-yellow-500 text-black dark:text-white px-2 py-1 text-xs font-black uppercase">
                            Pending
                          </span>
                        )}
                        {video.status === 'approved' && (
                          <span className="border-2 border-black dark:border-white bg-green-500 text-black dark:text-white px-2 py-1 text-xs font-black uppercase">
                            Approved
                          </span>
                        )}
                        <span className="text-xs font-bold text-black dark:text-white opacity-70">
                          {video.captions.length} captions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Caption Review Panel */}
          <div className="lg:col-span-2">
            {!selectedVideo ? (
              <div className="card-brutal p-12 text-center">
                <Eye className="w-16 h-16 text-black dark:text-white mx-auto mb-4" />
                <h3 className="text-2xl font-black text-black dark:text-white uppercase mb-2">
                  Select Content
                </h3>
                <p className="text-sm font-bold text-black dark:text-white opacity-70 uppercase">
                  Choose a video or image to review captions
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Content Preview */}
                <div className="card-brutal p-6">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">
                          {selectedVideo.filename}
                        </h2>
                        <span className={`border-2 border-black dark:border-white px-3 py-1 text-xs font-black uppercase ${getToneColor(selectedVideo.fileType === 'video' ? 'Professional' : 'Casual')}`}>
                          {selectedVideo.fileType === 'video' ? 'Video' : 'Image'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-black dark:text-white opacity-70 uppercase">
                        Uploaded {formatDate(selectedVideo.uploadedAt)}
                      </p>
                    </div>
                    <a
                      href={selectedVideo.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-brutal px-4 py-2 text-sm font-black uppercase tracking-wider"
                    >
                      <Eye className="w-4 h-4 inline mr-2" />
                      View in Drive
                    </a>
                  </div>
                  
                  {selectedVideo.fileType === 'video' ? (
                    <div className="border-4 border-black dark:border-white bg-gray-100 dark:bg-gray-900 min-h-[400px] flex items-center justify-center">
                      {(() => {
                        // Generate preview URL with fallbacks
                        let previewUrl = selectedVideo.embedUrl;
                        if (!previewUrl && selectedVideo.driveFileId) {
                          previewUrl = `https://drive.google.com/file/d/${selectedVideo.driveFileId}/preview`;
                        } else if (!previewUrl && selectedVideo.driveUrl) {
                          previewUrl = selectedVideo.driveUrl.replace('/view', '/preview');
                        }
                        
                        return previewUrl ? (
                          <iframe
                            key={previewUrl}
                            src={previewUrl}
                            className="w-full h-96"
                            allow="autoplay; fullscreen"
                            title={selectedVideo.filename}
                            style={{ minHeight: '400px' }}
                          />
                        ) : (
                          <div className="text-center p-8">
                            <p className="text-black dark:text-white font-bold mb-4">Preview not available</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                              Unable to generate preview URL. The file may not be publicly accessible.
                            </p>
                            {selectedVideo.driveUrl && (
                              <a
                                href={selectedVideo.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-brutal px-4 py-2 text-sm font-black uppercase tracking-wider inline-block"
                              >
                                <Eye className="w-4 h-4 inline mr-2" />
                                Open in Google Drive
                              </a>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="border-4 border-black dark:border-white bg-gray-100 dark:bg-gray-900 min-h-[400px] flex items-center justify-center">
                      {(() => {
                        // Generate image URL with fallbacks
                        let imageUrl = selectedVideo.embedUrl || selectedVideo.thumbnailUrl;
                        if (!imageUrl && selectedVideo.driveFileId) {
                          imageUrl = `https://drive.google.com/uc?export=view&id=${selectedVideo.driveFileId}`;
                        }
                        
                        return imageUrl ? (
                          <img 
                            key={imageUrl}
                            src={imageUrl}
                            alt={selectedVideo.filename}
                            className="w-full object-contain h-auto max-h-96"
                            onError={(e) => {
                              // Try thumbnail first
                              if (selectedVideo.thumbnailUrl && e.target.src !== selectedVideo.thumbnailUrl) {
                                e.target.src = selectedVideo.thumbnailUrl;
                              } 
                              // Then try generating from driveFileId with different formats
                              else if (selectedVideo.driveFileId) {
                                const currentSrc = e.target.src;
                                // Try alternative URL format
                                if (!currentSrc.includes('thumbnail')) {
                                  e.target.src = `https://drive.google.com/thumbnail?id=${selectedVideo.driveFileId}&sz=w1000`;
                                } else if (!currentSrc.includes('uc?export')) {
                                  e.target.src = `https://drive.google.com/uc?export=view&id=${selectedVideo.driveFileId}`;
                                } else {
                                  // All fallbacks failed, show placeholder
                                  e.target.style.display = 'none';
                                  const parent = e.target.parentElement;
                                  if (parent && !parent.querySelector('.preview-error')) {
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'preview-error text-center p-8';
                                    errorDiv.innerHTML = `
                                      <p class="text-black dark:text-white font-bold mb-4">Preview not available</p>
                                      <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                        Unable to load image preview. The file may not be publicly accessible.
                                      </p>
                                      ${selectedVideo.driveUrl ? `<a href="${selectedVideo.driveUrl}" target="_blank" rel="noopener noreferrer" class="btn-brutal px-4 py-2 text-sm font-black uppercase tracking-wider inline-block">
                                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        Open in Google Drive
                                      </a>` : ''}
                                    `;
                                    parent.appendChild(errorDiv);
                                  }
                                }
                              }
                              // Last resort: extract from driveUrl
                              else if (selectedVideo.driveUrl) {
                                const match = selectedVideo.driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
                                if (match) {
                                  const driveId = match[1];
                                  e.target.src = `https://drive.google.com/uc?export=view&id=${driveId}`;
                                }
                              }
                            }}
                          />
                        ) : (
                          <div className="text-center p-8">
                            <p className="text-black dark:text-white font-bold mb-4">Preview not available</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                              Unable to generate preview URL. The file may not be publicly accessible.
                            </p>
                            {selectedVideo.driveUrl && (
                              <a
                                href={selectedVideo.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-brutal px-4 py-2 text-sm font-black uppercase tracking-wider inline-block"
                              >
                                <Eye className="w-4 h-4 inline mr-2" />
                                Open in Google Drive
                              </a>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Caption Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">
                      AI-Generated Captions
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={handleRecaption}
                        disabled={loading}
                        className="btn-brutal px-4 py-2 uppercase tracking-wider text-sm disabled:opacity-50 flex items-center gap-2"
                        title="Generate new AI captions for this content"
                      >
                        {loading ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Re-caption
                      </button>
                      <span className="text-sm font-bold text-black dark:text-white opacity-70 uppercase">
                        Select one to approve or edit
                      </span>
                    </div>
                  </div>

                  {selectedVideo.captions.map((caption) => (
                    <div
                      key={caption.id}
                      className="card-brutal p-6"
                    >
                      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`border-2 border-black dark:border-white px-3 py-1 text-xs font-black uppercase ${getToneColor(caption.tone)}`}>
                            {caption.tone}
                          </span>
                          {Number(caption.version) > 1 && (
                            <span className="border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-2 py-1 text-xs font-black uppercase">
                              v{Number(caption.version)}
                            </span>
                          )}
                          {caption.status === 'approved' && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        
                        {caption.status === 'approved' && (
                          <div className="text-xs font-bold text-black dark:text-white opacity-70 uppercase">
                            Approved by {caption.approvedBy}
                          </div>
                        )}
                      </div>

                      {editingCaption === caption.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="input-brutal w-full px-4 py-3 text-lg resize-none"
                            rows={4}
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSaveEdit(caption.id)}
                              className="btn-brutal-primary px-6 py-3 uppercase tracking-wider"
                            >
                              <CheckCircle className="w-4 h-4 inline mr-2" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCaption(null)}
                              className="btn-brutal px-6 py-3 uppercase tracking-wider"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-black dark:text-white mb-4 leading-relaxed font-medium">
                            {caption.content}
                          </p>
                          
                          {caption.status !== 'approved' && (
                            <div className="flex gap-3 flex-wrap">
                              <button
                                onClick={() => handleEditCaption(caption)}
                                className="btn-brutal px-6 py-3 uppercase tracking-wider text-sm"
                              >
                                <Edit3 className="w-4 h-4 inline mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleApproveCaption(caption.id)}
                                disabled={loading}
                                className="btn-brutal-primary px-6 py-3 uppercase tracking-wider text-sm disabled:opacity-50"
                              >
                                {loading ? (
                                  <Loader className="w-4 h-4 inline mr-2 animate-spin" />
                                ) : (
                                  <ThumbsUp className="w-4 h-4 inline mr-2" />
                                )}
                                Approve & Publish
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Integration Info */}
                <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-6">
                  <h4 className="font-black text-black dark:text-white mb-3 uppercase tracking-tight flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    How It Works
                  </h4>
                  <ul className="text-sm font-bold text-black dark:text-white space-y-2 uppercase">
                    <li>• Videos/images trigger AI caption generation</li>
                    <li>• Review and edit captions to match brand voice</li>
                    <li>• Approved captions publish to social platforms</li>
                    <li>• Full audit trail maintained</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentReviewDashboard;
