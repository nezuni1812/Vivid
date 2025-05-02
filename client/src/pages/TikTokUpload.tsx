import React, { useState } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";

const TikTokUpload: React.FC = () => {
  const [sourceType, setSourceType] = useState<'FILE_UPLOAD' | 'PULL_FROM_URL'>('FILE_UPLOAD');
  const [publishType, setPublishType] = useState<'UPLOAD_CONTENT' | 'DIRECT_POST'>('UPLOAD_CONTENT');
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('PUBLIC_TO_EVERYONE');
  const [disableDuet, setDisableDuet] = useState(false);
  const [disableComment, setDisableComment] = useState(false);
  const [disableStitch, setDisableStitch] = useState(false);
  const [videoCoverTimestampMs, setVideoCoverTimestampMs] = useState('1000');
  const [isAigc, setIsAigc] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const accessToken = localStorage.getItem('tiktok_access_token');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions
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
    formData.append('publish_type', publishType);
    formData.append('title', title); // Empty title is allowed
    formData.append('privacy_level', privacyLevel);
    formData.append('disable_duet', disableDuet.toString());
    formData.append('disable_comment', disableComment.toString());
    formData.append('disable_stitch', disableStitch.toString());
    formData.append('video_cover_timestamp_ms', videoCoverTimestampMs);
    formData.append('is_aigc', isAigc.toString());

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
      const response = await fetch('http://localhost:5000/upload-tiktok-video/', {
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
        setError(data.error || 'Failed to upload video. Details: ' + JSON.stringify(data.details));
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
              <Label>Upload Method</Label>
              <Select value={sourceType} onValueChange={(value) => setSourceType(value as 'FILE_UPLOAD' | 'PULL_FROM_URL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FILE_UPLOAD">Upload from File</SelectItem>
                  <SelectItem value="PULL_FROM_URL">Pull from URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Publish Type</Label>
              <Select value={publishType} onValueChange={(value) => setPublishType(value as 'UPLOAD_CONTENT' | 'DIRECT_POST')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPLOAD_CONTENT">Upload as Draft (Inbox)</SelectItem>
                  <SelectItem value="DIRECT_POST">Direct Post (Profile)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title (Optional, up to 2200 characters)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video caption with #hashtags or @mentions"
                maxLength={2200}
              />
              <p className="text-sm text-gray-500 mt-1">
                Add hashtags (#) or mentions (@) for discoverability. Leave empty for no caption.
              </p>
            </div>

            <div>
              <Label>Privacy Level</Label>
              <Select value={privacyLevel} onValueChange={setPrivacyLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC_TO_EVERYONE">Public</SelectItem>
                  <SelectItem value="MUTUAL_FOLLOW_FRIENDS">Mutual Friends</SelectItem>
                  <SelectItem value="SELF_ONLY">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={disableDuet}
                  onCheckedChange={(checked) => setDisableDuet(checked as boolean)}
                />
                <Label>Disable Duet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={disableComment}
                  onCheckedChange={(checked) => setDisableComment(checked as boolean)}
                />
                <Label>Disable Comments</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={disableStitch}
                  onCheckedChange={(checked) => setDisableStitch(checked as boolean)}
                />
                <Label>Disable Stitch</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isAigc}
                  onCheckedChange={(checked) => setIsAigc(checked as boolean)}
                />
                <Label>Mark as AI-Generated Content</Label>
              </div>
            </div>

            <div>
              <Label>Video Cover Timestamp (ms)</Label>
              <Input
                type="number"
                value={videoCoverTimestampMs}
                onChange={(e) => setVideoCoverTimestampMs(e.target.value)}
                placeholder="1000"
                min="0"
              />
            </div>

            {sourceType === 'FILE_UPLOAD' && (
              <div>
                <Label>Video File</Label>
                <Input
                  type="file"
                  accept="video/mp4"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            {sourceType === 'PULL_FROM_URL' && (
              <div>
                <Label>Video URL</Label>
                <Input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
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