"use client"

import { Handle, Position } from "reactflow"
import { MessageSquare } from "lucide-react"

interface NodeProps {
  data: {
    label: string
  }
  selected?: boolean
}

export function MessageNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`rounded-lg border bg-white px-4 py-3 shadow-sm min-w-[150px] ${
        selected ? "border-primary ring-2 ring-primary/20" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-blue-500" />
        <span className="text-sm font-medium">Message</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
        {data.label}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  )
}

interface ButtonsNodeProps {
  data: {
    label: string
    buttons?: string[]
  }
  selected?: boolean
}

export function ButtonsNode({ data, selected }: ButtonsNodeProps) {
  const buttons = data.buttons || ["Button 1", "Button 2"]
  return (
    <div
      className={`rounded-lg border bg-white px-4 py-3 shadow-sm min-w-[180px] ${
        selected ? "border-primary ring-2 ring-primary/20" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">Buttons</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{data.label}</p>
      <div className="space-y-1">
        {buttons.map((button: string, index: number) => (
          <div key={index} className="relative">
            <div className="rounded border bg-blue-50 px-2 py-1 text-xs text-center text-blue-700">
              {button}
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={`button_${index}`}
              className="!bg-blue-500 !w-2 !h-2"
              style={{ top: "auto", bottom: "auto" }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

interface ConditionNodeProps {
  data: {
    label: string
    condition?: string
    trueLabel?: string
    falseLabel?: string
  }
  selected?: boolean
}

export function ConditionNode({ data, selected }: ConditionNodeProps) {
  return (
    <div
      className={`rounded-lg border bg-white px-4 py-3 shadow-sm min-w-[160px] ${
        selected ? "border-primary ring-2 ring-primary/20" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium">Condition</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {data.condition || data.label}
      </p>
      <div className="flex justify-between gap-2">
        <div className="flex items-center gap-1">
          <div className="rounded bg-green-100 px-2 py-0.5 text-[10px] text-green-700">
            {data.trueLabel || "Yes"}
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!bg-green-500 !w-2 !h-2"
          />
        </div>
        <div className="flex items-center gap-1">
          <div className="rounded bg-red-100 px-2 py-0.5 text-[10px] text-red-700">
            {data.falseLabel || "No"}
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!bg-red-500 !w-2 !h-2"
          />
        </div>
      </div>
    </div>
  )
}

interface HandoffNodeProps {
  data: {
    label: string
  }
  selected?: boolean
}

export function HandoffNode({ data, selected }: HandoffNodeProps) {
  return (
    <div
      className={`rounded-lg border bg-white px-4 py-3 shadow-sm min-w-[150px] ${
        selected ? "border-primary ring-2 ring-primary/20" : ""
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-orange-600">Handoff</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {data.label || "Transfer to human agent"}
      </p>
    </div>
  )
}
