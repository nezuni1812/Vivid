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
    <>
      {activeStep === "content" && (
        <main className="max-w-[45rem] container mx-auto py-6 px-4 md:px-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                className="mr-2"
                onClick={() => navigate("/homepage")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold">Tạo Video Mới</h1>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Save className="mr-2 h-4 w-4" />
              Lưu dự thảo
            </Button>
          </div>

          <div className="mb-8">
            <Tabs value={activeStep} className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                {steps.map((step) => (
                  <TabsTrigger
                    key={step.id}
                    value={step.id}
                    onClick={() => setActiveStep(step.id)}
                  >
                    {step.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="content" className="space-y-8">
                {/* Navigation buttons for sections */}
                <div className="flex justify-between bg-gray-50 p-3 rounded-lg sticky top-0 z-10 border shadow-sm">
                  <Button
                    variant="outline"
                    onClick={() => scrollToSection(scriptRef)}
                  >
                    Kịch bản
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => scrollToSection(voiceRef)}
                  >
                    Giọng nói
                  </Button>
                </div>

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
                <div ref={voiceRef}>
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

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setActiveStep("generate");
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Tiếp tục đến xuất bản
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="publish">
                <Card>
                  <CardHeader>
                    <CardTitle>Xuất bản và quản lý nội dung</CardTitle>
                    <CardDescription>
                      Cấu hình xuất bản và chia sẻ video của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PublishOptions />
                  </CardContent>
                </Card>

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep("content")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại chỉnh sửa
                  </Button>

                  <Button className="bg-green-600 hover:bg-green-700">
                    Hoàn thành
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      )}
      
      {activeStep === "generate"&& (
        <Resource workspace_id={workspace_id}></Resource>
      )}
    </>
  );
}
