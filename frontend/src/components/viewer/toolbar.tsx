"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useViewerStore } from "@/hooks/use-viewer";
import {
  Maximize,
  Camera,
  RotateCcw,
  Sun,
  Download,
} from "lucide-react";

interface ToolbarProps {
  onScreenshot: () => void;
  onExport: () => void;
  onFullscreen: () => void;
}

export function Toolbar({ onScreenshot, onExport, onFullscreen }: ToolbarProps) {
  const autoRotate = useViewerStore((s) => s.autoRotate);
  const toggleAutoRotate = useViewerStore((s) => s.toggleAutoRotate);
  const environment = useViewerStore((s) => s.environment);
  const setEnvironment = useViewerStore((s) => s.setEnvironment);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 border shadow-lg">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={onFullscreen}>
            <Maximize className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fullscreen</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={onScreenshot}>
            <Camera className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Screenshot</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant={autoRotate ? "default" : "ghost"}
            onClick={toggleAutoRotate}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Auto-rotate</TooltipContent>
      </Tooltip>

      <Select value={environment} onValueChange={setEnvironment}>
        <SelectTrigger className="w-28 h-8">
          <Sun className="h-3 w-3 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apartment">Apartment</SelectItem>
          <SelectItem value="lobby">Lobby</SelectItem>
          <SelectItem value="studio">Studio</SelectItem>
          <SelectItem value="city">City</SelectItem>
          <SelectItem value="warehouse">Warehouse</SelectItem>
          <SelectItem value="sunset">Sunset</SelectItem>
          <SelectItem value="dawn">Dawn</SelectItem>
          <SelectItem value="night">Night</SelectItem>
        </SelectContent>
      </Select>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" onClick={onExport}>
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export</TooltipContent>
      </Tooltip>
    </div>
  );
}
