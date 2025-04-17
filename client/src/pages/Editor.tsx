// CesdkEditor.jsx
import { useEffect, useRef } from "react";
import { Button } from "../components/ui/button";

export default function CesdkEditor() {
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
          onSave: (scene) => {
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
      const videoUrls = [
        "https://videos.pexels.com/video-files/5125962/5125962-uhd_2732_1440_30fps.mp4",
        "https://videos.pexels.com/video-files/6976105/6976105-hd_960_720_25fps.mp4",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/temp_images/c5c18475a432489ba61dc6d8c0f0a037.png",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/temp_images/b388e30ea40445edadece16e0ef846a7.png",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/temp_images/07d3290668134cc2a21d55dbaa9f76b7.png",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/temp_images/d5d87d9faf2a421f918cabc1840f23bc.png",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/temp_images/7e21dd47f3b848e49e050d5fb46ce76c.png",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/temp_images/ceb5f4361e8b4e73afb9c212ed9c5641.png",
        "https://pub-678b8517ce85460f91e69a5c322f3ea7.r2.dev/temp_images/aaad8326507d48d38a6ff8c6e4a91f5a.png",
        // "https://cdn.img.ly/assets/demo/v2.mp4",
      ];

      let engine = cesdkInstance.engine;

      const track = engine.block.create("track");
      mainTrack = track;
      mainEngine = engine;
      const page = engine.scene.getCurrentPage();

      engine.block.setWidth(page, 1280);
      engine.block.setHeight(page, 720);

      engine.block.setDuration(page, 20);

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
      engine.block.fillParent(track);
    };

    loadCesdk();

    return () => {
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
      // duration: 10,
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
    // Create a link element
    const link = document.createElement('a');

    // Set the download attribute with the file name
    link.download = 'test.mp4';

    // Create a URL for the Blob and set it as the href
    link.href = URL.createObjectURL(videoBlob);

    // Programmatically trigger the download
    link.click();
    console.log("Video exported successfully!");
  };

  const AddVideo = () => {
    console.log("AddVideo called");
    if (!cesdkInstance) {
      console.error("CESDK instance is not initialized yet.");
      return;
    }
    const videoUrls = [
      // "https://videos.pexels.com/video-files/5125962/5125962-uhd_2732_1440_30fps.mp4",
      "https://videos.pexels.com/video-files/5125962/5125962-hd_2048_1080_30fps.mp4",
      // "https://videos.pexels.com/video-files/5125962/5125962-hd_1366_720_60fps.mp4",
      // "https://cdn.img.ly/assets/demo/v2.mp4",
    ];

    if (!mainEngine) {
      console.error("Engine is not initialized yet.");
      return;
    }

    const page = mainEngine.scene.getCurrentPage();
    if (!page) {
      console.error("Current page is not available.");
      return;
    }
    // console.log("Track created:", track);
    mainEngine.block.appendChild(page, mainTrack);
    console.log("Before adding video:");
    for (const url of videoUrls) {
      const video2 = mainEngine.block.create("graphic");
      mainEngine.block.setShape(video2, mainEngine.block.createShape("rect"));
      const videoFill2 = mainEngine.block.createFill("video");
      mainEngine.block.setString(videoFill2, "fill/video/fileURI", url);
      mainEngine.block.setFill(video2, videoFill2);
      mainEngine.block.appendChild(mainTrack, video2);
      console.log("Video added:", video2);
    }
    mainEngine.block.fillParent(mainTrack);
    console.log("Added all videos");
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
        className="relative left-[50%] translate-x-[-50%]"
      />
      {/* <button onClick={AddVideo}>Add videos</button> */}
      <Button
        variant="outline"
        size="icon"
        className="mr-2"
        onClick={ExportVid}
      >
        <p>Export video</p>
      </Button>
    </>
  );
}
