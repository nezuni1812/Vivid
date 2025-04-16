// <DOCUMENT filename="TikTokStats.tsx">
import type React from "react";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

interface TikTokVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

type SortField = "publishedAt" | "viewCount" | "likeCount" | "commentCount";
type SortDirection = "asc" | "desc";

const TikTokStats = () => {
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("publishedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 10;

  const accessToken = localStorage.getItem("tiktok_access_token"); // Giả định lưu token

  // Tính toán tổng số liệu
  const totalVideos = videos.length;
  const totalViews = videos.reduce((acc, video) => acc + video.viewCount, 0);
  const totalLikes = videos.reduce((acc, video) => acc + video.likeCount, 0);
  const totalComments = videos.reduce((acc, video) => acc + video.commentCount, 0);

  // Dữ liệu cho biểu đồ
  const chartData = videos.map((video) => ({
    name: video.title.length > 20 ? video.title.substring(0, 20) + "..." : video.title,
    views: video.viewCount,
  }));

  // Tính toán phân trang
  const totalPages = Math.ceil(videos.length / videosPerPage);
  const currentVideos = videos
    .sort((a, b) => {
      if (sortField === "publishedAt") {
        return sortDirection === "desc"
          ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          : new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      } else {
        const aValue = a[sortField];
        const bValue = b[sortField];
        return sortDirection === "desc" ? bValue - aValue : aValue - bValue;
      }
    })
    .slice((currentPage - 1) * videosPerPage, currentPage * videosPerPage);

    useEffect(() => {
      const fetchTikTokVideos = async () => {
        if (!accessToken) {
          setError('Access token not found. Please login to TikTok.');
          setLoading(false);
          return;
        }
    
        try {
          const fields = [
            'id',
            'create_time',
            'title',
            'share_count',
            'view_count',
            'like_count',
            'comment_count',
          ].join(',');
    
          const response = await fetch(
            `https://open.tiktokapis.com/v2/video/list/?fields=${encodeURIComponent(fields)}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                max_count: 10, // Adjust as needed (max 20)
              }),
            }
          );
    
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
          }
    
          const data = await response.json();
          if (data.data && data.data.videos) {
            setVideos(
              data.data.videos.map((video: any) => ({
                id: video.id,
                title: video.title || 'No title',
                viewCount: video.view_count || 0,
                likeCount: video.like_count || 0,
                commentCount: video.comment_count || 0,
                shareCount: video.share_count || 0,
                publishedAt: new Date(video.create_time * 1000).toISOString(), // Convert Unix timestamp
              }))
            );
          } else {
            setError('No videos found');
          }
          setLoading(false);
        } catch (error) {
          console.error('Error fetching TikTok videos:', error);
          setLoading(false);
        }
      };
    
      fetchTikTokVideos();
    }, [location]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-[45rem] mx-auto">
      <h1 className="text-2xl font-bold mb-6">TikTok Video Statistics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="bg-blue-50 text-center">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Videos</p>
            <p className="text-xl font-bold">{totalVideos}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 text-center">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Views</p>
            <p className="text-xl font-bold">{totalViews.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 text-center">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Likes</p>
            <p className="text-xl font-bold">{totalLikes.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 text-center">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Comments</p>
            <p className="text-xl font-bold">{totalComments.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Video Views Bar Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Views by Video</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Video Analytics Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Video Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Video</th>
                  <th
                    className="p-3 text-left cursor-pointer"
                    onClick={() => handleSort("publishedAt")}
                  >
                    <div className="flex items-center">
                      Published
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                      {sortField === "publishedAt" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer"
                    onClick={() => handleSort("viewCount")}
                  >
                    <div className="flex items-center justify-end">
                      Views
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                      {sortField === "viewCount" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer"
                    onClick={() => handleSort("likeCount")}
                  >
                    <div className="flex items-center justify-end">
                      Likes
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                      {sortField === "likeCount" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 text-right cursor-pointer"
                    onClick={() => handleSort("commentCount")}
                  >
                    <div className="flex items-center justify-end">
                      Comments
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                      {sortField === "commentCount" && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentVideos.map((video) => (
                  <tr key={video.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-16 h-9 object-cover rounded"
                        />
                        <a
                          href={`https://www.tiktok.com/video/${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline line-clamp-2"
                        >
                          {video.title}
                        </a>
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      {new Date(video.publishedAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-right">
                      {video.viewCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      {video.likeCount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      {video.commentCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * videosPerPage + 1} to{" "}
                {Math.min(currentPage * videosPerPage, videos.length)} of{" "}
                {videos.length} videos
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="border rounded-lg shadow p-4 bg-white hover:shadow-lg transition"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="rounded mb-2 w-full h-48 object-cover"
                />
                <h2 className="text-lg font-semibold text-blue-600 line-clamp-2">
                  <a
                    href={`https://www.tiktok.com/video/${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {video.title}
                  </a>
                </h2>
                <p className="text-sm text-gray-500">
                  Views: {video.viewCount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Likes: {video.likeCount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Comments: {video.commentCount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">
                  Published:{" "}
                  {new Date(video.publishedAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TikTokStats;