"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../components/ui/button"
import { Dialog, DialogContent } from "../components/ui/dialog"
import { Share2 } from "lucide-react"
import PublishOptions from "./publish-options"

interface PublishOptionsDialogProps {
  trigger?: React.ReactNode
  workspaceId: string
  exportVid?: (quality: string, format: string, fps: string, updateProgress: (current: number, total: number) => void) => Promise<any>;
}

export default function PublishOptionsDialog({ trigger, workspaceId, exportVid }: PublishOptionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger || (
        <Button className="bg-blue-600 hover:bg-blue-700 w-full" onClick={() => setIsOpen(true)}>
          <Share2 className="mr-2 h-4 w-4" />
          Chia sẻ video
        </Button>
      )}
      <DialogContent className="max-w-5xl w-[90vw] [&>button]:hidden">
        <PublishOptions isOpen={isOpen} onClose={() => setIsOpen(false)} exportVid={exportVid} workspaceId={workspaceId}/>
      </DialogContent>
    </Dialog>
  )
}
