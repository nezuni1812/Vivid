import { useEffect, useState } from "react";
import { gapi } from "gapi-script";
import { useLocation } from "react-router-dom";


interface VideoItem {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    viewCount: string;
    commentCount: string;
}

const StatPage = () => {

    const location = useLocation();
    const accessToken = localStorage.getItem("accessToken");
    console.log("accessT: " + accessToken)
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {

                if (!accessToken) {
                    setError("Access token not found. Please login again.");
                    setLoading(false);
                    return;
                }

                // Lấy channelId của người dùng hiện tại
                const channelRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                const channelData = await channelRes.json();
                const channelId = channelData.items?.[0]?.id;

                if (!channelId) {
                    setError("Không tìm thấy kênh YouTube.");
                    setLoading(false);
                    return;
                }

                // Lấy playlistId của video uploads
                const uploadsListId =
                    channelData.items[0].contentDetails.relatedPlaylists.uploads;

                // Lấy danh sách video trong uploads playlist
                const playlistRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${uploadsListId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                const playlistData = await playlistRes.json();

                const videoIds = playlistData.items.map(
                    (item: any) => item.snippet.resourceId.videoId
                );

                // Lấy thông tin chi tiết video
                const videoStatsRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds.join(",")}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                const statsData = await videoStatsRes.json();

                const videoList: VideoItem[] = statsData.items.map((item: any) => ({
                    id: item.id,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    publishedAt: item.snippet.publishedAt,
                    viewCount: item.statistics.viewCount,
                    commentCount: item.statistics.commentCount || "0",
                }));

                setVideos(videoList);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Đã xảy ra lỗi khi lấy dữ liệu video.");
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    if (loading) return <div className="p-6 text-center">Loading...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Video Statistics</h1>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {videos.map((video) => (
                <div
                    key={video.id}
                    className="border rounded-lg shadow p-4 bg-white hover:shadow-lg transition w-full max-w-[360px] mx-auto"
                >
                    <img
                        src={video.thumbnail }
                        alt={video.title}
                        className="rounded mb-2 w-full"
                    />
                    <h2 className="text-lg font-semibold text-blue-600">
                        <a
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {video.title}
                        </a>
                    </h2>
                    <p className="text-sm text-gray-500">
                        Views: {video.viewCount}
                    </p>
                    <p className="text-sm text-gray-500">
                        Comments: {video.commentCount}
                    </p>
                    <p className="text-sm text-gray-400">
                        Published: {new Date(video.publishedAt).toLocaleDateString()}
                    </p>
                </div>
            ))}
            </div>
        </div>
    );
};

export default StatPage;
