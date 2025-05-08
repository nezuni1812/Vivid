import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { Button } from "../components/ui/button";
import ReactDOM from "react-dom/client";
import PublishOptionsDialog from "../components/publish-options-dialog";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Video,
  Share2,
} from "lucide-react";

export const ExportVid = async (
  engine: any,
  workspaceId: string,
  height = "1080p",
  format = "mp4",
  fps = "30",
  updateProgress: (current: number, total: number) => void
) => {
  const scene = engine.scene.get();
  const page = engine.scene.getCurrentPage();

  if (!workspaceId) {
    console.error("No workspace ID provided for video export.");
    return;
  }

  console.log("Input: ", {
    height: height,
    fps: fps,
    format: format,
  });

  format = format.toLowerCase();
  if (format !== "mp4" && format !== "mov") {
    format = "mp4";
  }

  const test = parseInt(fps);
  if (isNaN(test)) {
    fps = "30";
  }
  if (parseInt(fps) < 24 || parseInt(fps) > 60) {
    fps = "30";
  }

  if (height === "4k") {
    height = "2160";
  } else if (height === "720p") {
    height = "720";
  } else if (height === "1080p") {
    height = "1080";
  } else {
    height = "720";
  }

  const width = Math.round((16 / 9) * parseInt(height)) + "";

  console.log("Exporting video with settings:", {
    height: height,
    width: width,
    fps: fps,
    format: format,
  });

  // Video Export
  const progressCallback = (
    renderedFrames: any,
    encodedFrames: any,
    totalFrames: any
  ) => {
    console.log(
      "Rendered",
      renderedFrames,
      "frames and encoded",
      encodedFrames,
      "frames out of",
      totalFrames
    );
    updateProgress(renderedFrames, totalFrames);
  };
  const videoOptions = {
    h264Profile: 77,
    h264Level: 52,
    videoBitrate: 0,
    audioBitrate: 0,
    timeOffset: 0,
    // duration: 10,
    framerate: fps,
    targetWidth: width,
    targetHeight: height,
  };
  const videoBlob = await engine.block.exportVideo(
    page,
    `video/${format}`,
    progressCallback,
    videoOptions
  );

  console.log("Video Blob:", videoBlob);

  const multipartForm = new FormData();
  multipartForm.append("file", videoBlob, `video.${format}`);
  multipartForm.append("filename", `${workspaceId}/generated_video.${format}`); // Add a name for the file

  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/creations/save`,
    {
      method: "POST",
      body: multipartForm,
    }
  );

  if (!response.ok) {
    console.error("Error uploading video:", response);
    return null;
  }

  const data = await response.json();
  console.log("Video uploaded successfully:", data);
  return data;
};

export default function CesdkEditor({
  resourceList = null,
}: {
  resourceList?: string[] | null;
}) {
  const location = useLocation();
  const workspaceId = location.state?.workspaceId ?? null;
  const containerRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("tab1");

  let cesdkInstance: any;
  let mainTrack: any;
  let mainEngine: any;

  useEffect(() => {
    const loadCesdk = async () => {
      const CreativeEditorSDK = await import(
        "https://cdn.img.ly/packages/imgly/cesdk-js/1.48.1/index.js"
      ).then((mod) => mod.default || mod);

      const config = {
        license: import.meta.env.VITE_EDITOR_API_KEY,
        userId: "guides-user",
        theme: "light",
        baseURL: "https://cdn.img.ly/packages/imgly/cesdk-js/1.48.1/assets",
        ui: {
          elements: {
            view: "default",
            panels: {
              settings: true,
            },
            navigation: {
              position: "top",
              action: {
                save: true,
                load: true,
                download: true,
                export: true,
              },
            },
          },
        },
        callbacks: {
          onUpload: "local",
          onSave: (scene: any) => {
            const element = document.createElement("a");
            const base64Data = btoa(unescape(encodeURIComponent(scene)));
            element.setAttribute(
              "href",
              `data:application/octet-stream;base64,${base64Data}`
            );
            element.setAttribute(
              "download",
              `cesdk-${new Date().toISOString()}.scene`
            );
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          },
          onLoad: "upload",
          onDownload: "download",
          onExport: "download",
        },
      };

      cesdkInstance = await CreativeEditorSDK.create(
        containerRef.current,
        config
      );
      cesdkInstance.addDefaultAssetSources();
      cesdkInstance.addDemoAssetSources({ sceneMode: "Video" });
      cesdkInstance.ui.setBackgroundTrackAssetLibraryEntries([
        "ly.img.image",
        "ly.img.video",
      ]);
      await cesdkInstance.createVideoScene();

      // Set default video timeline
      if (!resourceList) {
        console.log("No resource list provided, using default video URLs.");
      }

      var videoUrls = resourceList ?? [
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/836cb7493a764771821f719fd936d3bf.png",
        "https://videos.pexels.com/video-files/3139886/3139886-hd_720_1280_30fps.mp4",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/4326b0f984a544dfaec15b8fe5193365.png",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/7ab96f7e287843e2b2dcd015cf785139.png",
        // "https://videos.pexels.com/video-files/31801617/13549114_1920_1080_25fps.mp4",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/5a0379e1332d48f49fb0fe8016262a81.png",
        "https://videos.pexels.com/video-files/5465034/5465034-uhd_2160_3840_25fps.mp4",
        "https://videos.pexels.com/video-files/4990320/4990320-hd_1920_1080_30fps.mp4",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/b1d10f355ec647e29b24f58171adf5da.png",
        "https://videos.pexels.com/video-files/5847513/5847513-hd_1080_1920_24fps.mp4",
        "https://videos.pexels.com/video-files/7647252/7647252-uhd_2560_1440_24fps.mp4",
        "https://videos.pexels.com/video-files/7955159/7955159-hd_2048_1080_25fps.mp4",
        // "https://videos.pexels.com/video-files/25935014/11922020_720_1280_15fps.mp4",
      ];

      videoUrls = location.state?.resourceList ?? videoUrls;
      const timing = location.state?.timing;
      const audioUrl =
        location.state?.audioUrl ??
        "https://cdn.img.ly/assets/demo/v1/ly.img.audio/audios/far_from_home.m4a";

      let engine = cesdkInstance.engine;

      const track = engine.block.create("track");
      mainTrack = track;
      mainEngine = engine;
      const page = engine.scene.getCurrentPage();

      engine.block.setWidth(page, 1280);
      engine.block.setHeight(page, 720);

      // engine.block.setDuration(page, 20);

      console.log("All video URLs", videoUrls);
      engine.block.appendChild(page, track);
      for (let i = 0; i < videoUrls.length; i++) {
        const url = videoUrls[i];
        const video2 = cesdkInstance.engine.block.create("graphic");
        cesdkInstance.engine.block.setShape(
          video2,
          engine.block.createShape("rect")
        );
        const videoFill2 = cesdkInstance.engine.block.createFill(
          url.endsWith("mp4") ? "video" : "image"
        );
        cesdkInstance.engine.block.setString(
          videoFill2,
          url.endsWith("mp4")
            ? "fill/video/fileURI"
            : "fill/image/imageFileURI",
          url
        );
        cesdkInstance.engine.block.setFill(video2, videoFill2);
        // engine.block.setTimeOffset(video2, (i + 1) * 3);
        engine.block.setDuration(
          video2,
          timing[i].end_time - timing[i].start_time
        );
        // if (url.endsWith("mp4")) {
        //   engine.block.setMuted(video2, true);
        // }
        console.log(
          "Video",
          i,
          engine.block.getTimeOffset(video2),
          engine.block.supportsTimeOffset(video2)
        );
        const zoomAnimation = engine.block.createAnimation("zoom");
        const fadeOutAnimation = engine.block.createAnimation("fade");
        engine.block.setDuration(
          zoomAnimation,
          0.4 * (timing[i].end_time - timing[i].start_time)
        );
        engine.block.setInAnimation(video2, zoomAnimation);
        engine.block.setOutAnimation(video2, fadeOutAnimation);

        console.log(engine.block.supportsPlaybackControl(page));
        // engine.block.setMuted(page, true);
        engine.block.appendChild(track, video2);
      }
      const audio = engine.block.create("audio");
      engine.block.appendChild(page, audio);
      engine.block.setString(
        audio,
        "audio/fileURI",
        encodeURI(audioUrl)
        // "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/audios/6818bd3fc154edd026497deb/Recording.mp3"
      );
      console.log("Audio URL", audioUrl);

      const track1 = engine.block.create("track");

      engine.block.appendChild(page, track1);
      engine.block.fillParent(track);
    };

    loadCesdk();

    return () => {
      console.log("Cleaning up CESDK instance...");
      if (cesdkInstance) {
        console.log("Disposing CESDK instance...");
        cesdkInstance.dispose?.();
      }
    };
  }, []);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex gap-2 w-full">
      <div ref={containerRef} className="h-full flex-7" />

      <div
        className={`resource-sidebar transition-all duration-300 flex flex-col ${
          isExpanded ? "w-80" : "w-14"
        } bg-white border-l border-gray-200 shadow-sm`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="self-end mx-2"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>

        <div className="flex flex-col items-center gap-2 p-2">
          {isExpanded ? (
            <>
              <PublishOptionsDialog
                exportVid={(
                  quality: string,
                  format: string,
                  fps: string,
                  updateProgress: (current: number, total: number) => void
                ) =>
                  ExportVid(
                    mainEngine,
                    workspaceId ?? "",
                    quality,
                    format,
                    fps,
                    updateProgress
                  )
                }
                workspaceId={workspaceId ?? ""}
              />
              <div className="w-full mt-2">
                <Tabs.Root
                  className="w-full"
                  defaultValue="tab1"
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <Tabs.List className="rounded-md bg-gray-100 p-1 flex gap-2 w-full shadow-sm">
                    <Tabs.Trigger
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === "tab1"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                      value="tab1"
                    >
                      Tạo hình
                    </Tabs.Trigger>

                    <Tabs.Trigger
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === "tab2"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                      value="tab2"
                    >
                      Tìm video
                    </Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content
                    className="mt-2 p-4 bg-white rounded-md shadow-sm border border-gray-200"
                    value="tab1"
                  >
                    <ImageGenTab mainEngine={mainEngine} />
                  </Tabs.Content>

                  <Tabs.Content
                    className="mt-2 p-4 bg-white rounded-md shadow-sm border border-gray-200"
                    value="tab2"
                  >
                    <VideoGetTab />
                  </Tabs.Content>
                </Tabs.Root>
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-full"
                onClick={() => {
                  setIsExpanded(true);
                }}
                title="Share video"
              >
                <Share2 className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 rounded-full ${
                  activeTab === "tab1" ? "bg-gray-100" : ""
                }`}
                onClick={() => {
                  setActiveTab("tab1");
                  setIsExpanded(true);
                }}
                title="Generate image"
              >
                <ImageIcon className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`w-10 h-10 rounded-full ${
                  activeTab === "tab2" ? "bg-gray-100" : ""
                }`}
                onClick={() => {
                  setActiveTab("tab2");
                  setIsExpanded(true);
                }}
                title="Find video"
              >
                <Video className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const OpenImagePopup = (mediaUrl: string) => {
  const handleClick = () => {
    const popup = window.open(
      "",
      "CreateTabPopup",
      "width=800,height=600,resizable=yes,scrollbars=no,status=no"
    );

    if (popup) {
      popup.document.title = "Generated media";

      popup.document.head.innerHTML = "";
      popup.document.body.innerHTML = "";

      const style = popup.document.createElement("style");
      style.textContent = `
        body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f9f9f9; }
        img { max-width: 100%; max-height: 100%; }
      `;
      popup.document.head.appendChild(style);

      const isImage = mediaUrl.toLowerCase().endsWith(".png");

      if (isImage) {
        const img = popup.document.createElement("img");
        img.src = mediaUrl;
        img.alt = "Popup Image";
        popup.document.body.appendChild(img);
      } else {
        const video = popup.document.createElement("video");
        video.src = mediaUrl;
        video.controls = true;
        video.autoplay = true;
        video.draggable = true;

        video.addEventListener("dragstart", (e) => {
          e.dataTransfer?.setData("text/uri-list", mediaUrl); // For browsers and apps that support URI dragging
          e.dataTransfer?.setData("text/plain", mediaUrl); // Backup plain text
        });

        popup.document.body.appendChild(video);
      }
    }
  };

  handleClick();
};

const ImageGenTab = ({ mainEngine }: { mainEngine: any }) => {
  const [prompt, setPrompt] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newResourceLoading, setNewResourceLoading] = useState(false);

  const generateImageOnUserPrompt = async (prompt: string) => {
    console.log("Prompt:", prompt);
    const response = await fetch(
      `${new URL("creations/create-image", import.meta.env.VITE_BACKEND_URL)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          width: 512,
          height: 512,
          samples: 1,
          steps: 20,
          seed: null,
        }),
      }
    );

    if (!response.ok) {
      console.error("Error creating image:", response.statusText);
      return;
    }

    const data = await response.json();
    console.log("Image created:", data);
    setNewImage(data.content);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Tạo hình ảnh mới</h2>
      <textarea
        name="promp"
        id=""
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
        }}
        placeholder="Mô tả hình ảnh tại đây"
        className="resize-none border border-gray-300 rounded-md p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        rows={4}
      ></textarea>

      <Button
        onClick={() => generateImageOnUserPrompt(prompt)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
        disabled={newResourceLoading}
      >
        Tạo hình ảnh
      </Button>

      <h2 className="text-lg font-semibold text-gray-900">Kết quả</h2>
      <p className="text-sm text-gray-600">
        Click và kéo vào timeline để sử dụng
      </p>
      {newImage ? (
        <div
          className="image-container rounded-md overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => {
            OpenImagePopup(newImage);
          }}
        >
          <div className="img-wrapper">
            <img
              src={newImage || "/placeholder.svg"}
              alt="New generated image"
              draggable
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium text-gray-500">
          Chưa có hình ảnh nào được tạo
        </p>
      )}
    </div>
  );
};

const VideoGetTab = () => {
  const [newResourceLoading, setNewResourceLoading] = useState(false);
  const [newVideo, setNewVideo] = useState("");
  const [keyword, setKeyword] = useState("");

  const findVideoOnUserKeywords = async (keyword: string) => {
    setNewResourceLoading(true);
    console.log("Prompt:", keyword);
    const response = await fetch(
      `${new URL("creations/get-video", import.meta.env.VITE_BACKEND_URL)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
        }),
      }
    );

    if (!response.ok) {
      console.error("Error creating image:", response.statusText);
      return;
    }

    const data = await response.json();
    console.log("Image created:", data);
    setNewResourceLoading(false);
    setNewVideo(data.content);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Tìm kiếm video</h2>
      <input
        type="text"
        name="search"
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
        }}
        placeholder="Dùng từ khóa để kiếm hình ảnh"
        className="border border-gray-300 rounded-md p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
      />
      <Button
        onClick={() => findVideoOnUserKeywords(keyword)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
        disabled={newResourceLoading}
      >
        Tìm kiếm
      </Button>

      <h2 className="text-lg font-semibold text-gray-900">Kết quả</h2>
      <p className="text-sm text-gray-600">
        Click và kéo vào timeline để sử dụng
      </p>
      {!newVideo ? (
        <p className="text-sm font-medium text-gray-500">Chưa có kết quả nào</p>
      ) : (
        <div
          className="image-container rounded-md overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="img-wrapper">
            <video
              src={newVideo || "/placeholder.svg"}
              draggable
              className="w-full h-auto object-cover"
              controls
            />
          </div>
        </div>
      )}
    </div>
  );
};
