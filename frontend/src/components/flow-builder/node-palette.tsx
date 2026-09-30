"use client"

import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  MousePointerClick,
  GitBranch,
  Headphones,
} from "lucide-react"

const nodeTypes = [
  {
    type: "message",
    label: "Message",
    icon: MessageSquare,
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    type: "buttons",
    label: "Buttons",
    icon: MousePointerClick,
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
  {
    type: "condition",
    label: "Condition",
    icon: GitBranch,
    color: "bg-amber-50 text-amber-600 border-amber-200",
  },
  {
    type: "handoff",
    label: "Handoff",
    icon: Headphones,
    color: "bg-orange-50 text-orange-600 border-orange-200",
  },
]

interface NodePaletteProps {
  onAddNode: (type: string) => void
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="w-48 shrink-0 rounded-lg border bg-background p-4">
      <h3 className="mb-3 text-sm font-semibold">Node Palette</h3>
      <div className="space-y-2">
        {nodeTypes.map((nodeType) => (
          <Button
            key={nodeType.type}
            variant="outline"
            className={`w-full justify-start gap-2 ${nodeType.color}`}
            onClick={() => onAddNode(nodeType.type)}
          >
            <nodeType.icon className="h-4 w-4" />
            {nodeType.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
