import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import * as Tabs from "@radix-ui/react-tabs";
import { Button } from "../components/ui/button";
import ReactDOM from "react-dom/client";
import PublishOptionsDialog from "../components/publish-options-dialog";

export default function CesdkEditor({
  resourceList = null,
}: {
  resourceList?: string[] | null;
}) {
  const location = useLocation();

  const containerRef = useRef(null);
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

      let engine = cesdkInstance.engine;

      const track = engine.block.create("track");
      mainTrack = track;
      mainEngine = engine;
      const page = engine.scene.getCurrentPage();

      engine.block.setWidth(page, 1280);
      engine.block.setHeight(page, 720);

      // engine.block.setDuration(page, 20);

      engine.block.appendChild(page, track);
      for (const url of videoUrls) {
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
          // "https://videos.pexels.com/video-files/5125962/5125962-hd_1366_720_60fps.mp4"
          url
        );
        cesdkInstance.engine.block.setFill(video2, videoFill2);

        engine.block.appendChild(track, video2);
      }
      const audio = engine.block.create("audio");
      engine.block.appendChild(page, audio);
      engine.block.setString(
        audio,
        "audio/fileURI",
        "https://cdn.img.ly/assets/demo/v1/ly.img.audio/audios/far_from_home.m4a"
      );

      const track1 = engine.block.create("track");
      
      const text = engine.block.create("text");
      engine.block.appendChild(track1, text);
      engine.block.replaceText(text, "Hello World");
      engine.block.setWidth(text, 900);
      engine.block.setHeight(text, 100);
      engine.block.setPositionY(text, 600);
      // engine.block.alignHorizontally([text], "Right");
      
      engine.block.setTextFontSize(text, 12);
      engine.block.setTextColor(text, { r: 255, g: 255, b: 255, a: 1.0 });
      
      const text1 = engine.block.create("text");
      engine.block.appendChild(track1, text1);
      engine.block.replaceText(text1, "Hi");

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

  const ExportVid = async () => {
    const scene = mainEngine.scene.get();
    const page = mainEngine.scene.getCurrentPage();

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
    };
    const videoOptions = {
      h264Profile: 77,
      h264Level: 52,
      videoBitrate: 0,
      audioBitrate: 0,
      timeOffset: 0,
      duration: 10,
      framerate: 30,
      targetWidth: 1920,
      targetHeight: 1080,
    };
    const videoBlob = await mainEngine.block.exportVideo(
      page,
      "video/mp4",
      progressCallback,
      videoOptions
    );

    console.log("Video Blob:", videoBlob);

    const multipartForm = new FormData();
    multipartForm.append("file", videoBlob, "video.mp4");
    multipartForm.append("filename", "generated_video.mp4"); // Add a name for the file

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/creations/save`,
      {
        method: "POST",
        body: multipartForm,
      }
    );

    if (!response.ok) {
      console.error("Error uploading video:", response);
      return;
    }

    const data = await response.json();
    console.log("Video uploaded successfully:", data);

    return;

    // Create a link element
    const link = document.createElement("a");

    // Set the download attribute with the file name
    link.download = "test.mp4";

    // Create a URL for the Blob and set it as the href
    link.href = URL.createObjectURL(videoBlob);

    // Programmatically trigger the download
    link.click();
    console.log("Video exported successfully!");
  };

  return (
    <div className="flex gap-2 w-full">
      <div ref={containerRef} className="h-full flex-7" />

      <div className="new-resource flex-3 pr-2">
        {/* <button onClick={AddVideo}>Add videos</button> */}
        <Button
          variant="outline"
          size="icon"
          className="w-full p-2 my-2"
          onClick={ExportVid}
        >
          Export video
        </Button>
        <PublishOptionsDialog />
        <OpenImagePopup />
        <CreateTab />
      </div>
    </div>
  );
}

const CreateTab = () => {
  // choose the default tab to be opened
  const [activeTab, setActiveTab] = useState("tab1");
  const [prompt, setPrompt] = useState("");
  const [newImage, setNewImage] = useState("");
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
          negative_prompt: "bad, ugly, deformed, blurry",
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
    setNewImage(
      "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/e1587b7049c14ef7a878f5c2301ac3e1.png"
    );
  };

  return (
    <Tabs.Root
      className="w-full"
      defaultValue="tab1"
      value={activeTab}
      onValueChange={setActiveTab}
    >
      <Tabs.List className="rounded-lg bg-[#f4f4f5] p-1 flex gap-1 w-max">
        <Tabs.Trigger
          className={`TabsTrigger rounded-sm p-1 ${
            activeTab === "tab1" ? "bg-white shadow-sm" : "bg-[#f4f4f5]"
          }`}
          value="tab1"
        >
          Generate image
        </Tabs.Trigger>

        <Tabs.Trigger
          className={`TabsTrigger rounded-sm p-1 ${
            activeTab === "tab2" ? "bg-white shadow-sm" : "bg-[#f4f4f5]"
          }`}
          value="tab2"
        >
          Find video
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content className="TabsContent flex flex-col gap-2" value="tab1">
        <ImageGenTab
          prompt={prompt}
          setPrompt={setPrompt}
          generateImageOnUserPrompt={generateImageOnUserPrompt}
          newImage={newImage}
        />
      </Tabs.Content>

      <Tabs.Content className="TabsContent flex flex-col gap-2" value="tab2">
        <VideoGetTab />
      </Tabs.Content>
    </Tabs.Root>
  );
};

const OpenImagePopup = () => {
  const handleClick = () => {
    const popup = window.open(
      "",
      "CreateTabPopup",
      "width=800,height=600,resizable=yes,scrollbars=no,status=no"
    );

    if (popup) {
      popup.document.title = "Image Popup";

      const script = popup.document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"; // or your preferred version
      popup.document.head.appendChild(script);

      const rootDiv = popup.document.createElement("div");
      rootDiv.id = "react-popup-root";
      popup.document.body.appendChild(rootDiv);

      // Add some basic styling
      const style = popup.document.createElement("style");
      style.textContent = `
        body { margin: 0; font-family: sans-serif; padding: 1rem; }
      `;
      popup.document.head.appendChild(style);

      // Mount React component into popup
      const root = ReactDOM.createRoot(rootDiv);
      root.render(<CreateTab />);
    }
  };

  return <button onClick={handleClick}>Open Image window in Popup</button>;
};

const ImageGenTab = ({
  prompt,
  setPrompt,
  generateImageOnUserPrompt,
  newImage,
}: {
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  generateImageOnUserPrompt: (e: any) => {};
  newImage: string;
}) => {
  return (
    <>
      <h2 className="font-medium">Prompt</h2>
      <textarea
        name="promp"
        id=""
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
        }}
        placeholder="Mô tả hình ảnh tại đây"
        className="resize-none border rounded-sm p-1"
        rows={4}
      ></textarea>

      <Button onClick={() => generateImageOnUserPrompt(prompt)}>
        Tạo hình ảnh
      </Button>

      <h2 className="font-medium text-lg">Kết quả</h2>
      <p>Kéo vào timeline để sử dụng</p>
      {newImage ? (
        <div className="image-container">
          <div className="img-wrapper">
            <img src={newImage} alt="New generated image" draggable />
          </div>
        </div>
      ) : (
        <p className="text-sm font-medium">Chưa có hình ảnh nào được tạo</p>
      )}
    </>
  );
};

const VideoGetTab = () => {
  return (
    <>
      <h2 className="font-medium">Tìm kiếm video</h2>
      <input
        type="text"
        name="search"
        placeholder="Dùng từ khóa để kiếm hình ảnh"
        className="border rounded-sm p-1"
      />
      <Button>Tìm kiếm</Button>

      <h2 className="font-medium text-lg">Kết quả</h2>
      <p>Kéo vào timeline để sử dụng</p>
    </>
  );
};
