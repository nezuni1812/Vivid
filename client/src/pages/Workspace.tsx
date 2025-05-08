"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import ScriptGenerator from "../components/script-generator";
import VoiceConfig from "../components/voice-config";
import ImageGenerator from "../components/image-generator";
import VideoEditor from "../components/video-editor";
import PublishOptions from "../components/publish-options";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import Resource from "./Resource";
import { FaFolder } from "react-icons/fa"

const steps = [
  { id: "content", label: "Nội dung" },
  { id: "publish", label: "Xuất bản" },
];

export default function CreateVideo() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<string>(""); // "content": create video, "generate": script + resource, "edit": editor

  const scriptRef = useRef<HTMLDivElement>(null);
  const voiceRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const { scriptId, workspaceId } = useWorkspace(); // Get scriptId from context
  const { id: workspace_id } = useParams();
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    // Lấy danh sách các scripts thuộc về workspace_id
    const fetchScripts = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/scripts?workspace_id=${workspace_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch scripts");
        }

        const scripts = await response.json();
        console.log("Fetched scripts:", scripts);

        if (scripts.length > 0) {
          setActiveStep("generate");
        } else {
          setActiveStep("content");
        }
      } catch (error) {
        console.error("Error fetching scripts:", error);
        setActiveStep("content"); // fallback, default to "content"
      }
    };

    if (workspaceId) {
      fetchScripts();
    }
  }, [workspaceId]);

  return (
    <div className="min-h-screen">
      {activeStep === "content" && (
        <main className="max-w-[45rem] container mx-auto py-6 px-4 md:px-6">
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100 mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button variant="ghost" onClick={() => navigate("/homepage")} className="mr-2 p-1">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <FaFolder className="text-purple-600" />
                        Tạo Video Mới
                      </CardTitle>
                      <CardDescription>Tạo kịch bản và cấu hình giọng nói cho video của bạn</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between gap-4 mt-2">
                  <Button variant="outline" className="w-full font-medium" onClick={() => scrollToSection(scriptRef)}>
                    Kịch bản
                  </Button>
                  <Button variant="outline" className="w-full font-medium" onClick={() => scrollToSection(voiceRef)}>
                    Giọng nói
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            {/* Navigation buttons for sections - Improved layout */}

                {/* Script Section */}
                <div ref={scriptRef}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Tạo kịch bản video khoa học</CardTitle>
                      <CardDescription>
                        Nhập chủ đề khoa học hoặc chọn từ danh sách gợi ý
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScriptGenerator workspace_id={workspace_id ?? ""} />
                    </CardContent>
                  </Card>
                </div>

                {/* Voice Section */}
                <div ref={voiceRef} className="mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cấu hình giọng nói</CardTitle>
                      <CardDescription>
                        Lựa chọn và tùy chỉnh giọng nói cho video của bạn
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <VoiceConfig workspace_id={workspace_id ?? ""}/>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end mt-8">
                  <Button
                    onClick={() => {
                      setActiveStep("generate");
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Tiếp tục
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
          </div>
        </main>
      )}

      {activeStep === "generate" && (
        <main className="container mx-auto py-6 px-4 md:px-6 lg:px-8 xl:px-10 max-w-[1200px] bg-white">
          <Resource workspace_id={workspace_id}></Resource>
        </main>
      )}
    </div>
  );
}
