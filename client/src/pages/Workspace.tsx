import { useState } from "react";
import { useParams } from "react-router-dom";

const Workspace = () => {
  const { id } = useParams();

  const [materials, setMaterials] = useState([
    "/images/c8f37c3e16754d78b75b538e8efa46d4.png",
    "https://videos.pexels.com/video-files/10755265/10755265-hd_3840_2160_30fps.mp4",
    "https://videos.pexels.com/video-files/4990231/4990231-hd_1920_1080_30fps.mp4",
    "https://videos.pexels.com/video-files/15392342/15392342-uhd_2560_1440_24fps.mp4",
    "/images/c21aa3c1569b43d5b9f2ef56b53fa037.png",
    "/images/dd7084c401e746ad858704f85e75d57f.png",
    "https://videos.pexels.com/video-files/5465034/5465034-uhd_2160_3840_25fps.mp4",
    "https://videos.pexels.com/video-files/7606424/7606424-hd_720_1280_30fps.mp4",
    "https://videos.pexels.com/video-files/3806673/3806673-hd_1920_1080_24fps.mp4",
    "/images/23eaeecacd3a4a13b1613446988c156a.png",
    "/images/9b3fe30c9dab40b5a91eed9587c2437a.png",
    "/images/6fb975630892443abc944f1119fa49b8.png",
    "https://videos.pexels.com/video-files/25744127/11904065_1920_1080_15fps.mp4",
  ]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      {materials.map((material, index) => {
        const isImage =
          material.endsWith(".png") ||
          material.endsWith(".jpg") ||
          material.endsWith(".jpeg");
        const isVideo = material.endsWith(".mp4") || material.endsWith(".mov");

        return (
          <div key={index} className="mb-4">
            {isImage && (
              <img
                src={material.startsWith("/") ? `${import.meta.env.VITE_BACKEND_URL}${material}` : material}
                alt={`Material ${index}`}
                className="max-w-full h-auto"
              />
            )}
            {isVideo && (
              <video controls className="max-w-full h-auto">
                <source src={material} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Workspace;
