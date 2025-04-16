import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const TikTokUpload: React.FC = () => {
  const [sourceType, setSourceType] = useState<'FILE_UPLOAD' | 'PULL_FROM_URL'>('FILE_UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const accessToken = localStorage.getItem('tiktok_access_token');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (!accessToken) {
      setError('Please login to TikTok first.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('source_type', sourceType);
    if (sourceType === 'FILE_UPLOAD' && file) {
      formData.append('video_file', file);
    } else if (sourceType === 'PULL_FROM_URL') {
      formData.append('video_url', videoUrl);
    } else {
      setError('Please provide a video file or URL.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/upload-video/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
      } else {
        setError(data.error || 'Failed to upload video.');
      }
    } catch (err) {
      setError('Error uploading video: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[45rem] mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Upload Video to TikTok</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload Method
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as 'FILE_UPLOAD' | 'PULL_FROM_URL')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="FILE_UPLOAD">Upload from File</option>
                <option value="PULL_FROM_URL">Pull from URL</option>
              </select>
            </div>

            {sourceType === 'FILE_UPLOAD' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Video File
                </label>
                <input
                  type="file"
                  accept="video/mp4"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            )}

            {sourceType === 'PULL_FROM_URL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Video URL
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </form>

          {message && (
            <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TikTokUpload;