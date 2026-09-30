"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Trash2 } from "lucide-react"
import type { Node } from "reactflow"

interface NodeEditorProps {
  node: Node
  onUpdate: (data: Record<string, unknown>) => void
  onDelete: () => void
  onClose: () => void
}

export function NodeEditor({ node, onUpdate, onDelete, onClose }: NodeEditorProps) {
  const renderContent = () => {
    switch (node.type) {
      case "message":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Message Text</Label>
              <Textarea
                value={(node.data.label as string) || ""}
                onChange={(e) => onUpdate({ label: e.target.value })}
                rows={4}
                placeholder="Enter message text..."
              />
            </div>
          </div>
        )

      case "buttons":
        const buttons = (node.data.buttons as string[]) || ["Button 1", "Button 2"]
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Message Text</Label>
              <Textarea
                value={(node.data.label as string) || ""}
                onChange={(e) => onUpdate({ label: e.target.value })}
                rows={2}
                placeholder="Message above buttons..."
              />
            </div>
            <div className="space-y-2">
              <Label>Buttons</Label>
              {buttons.map((button: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={button}
                    onChange={(e) => {
                      const newButtons = [...buttons]
                      newButtons[index] = e.target.value
                      onUpdate({ buttons: newButtons })
                    }}
                    placeholder={`Button ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newButtons = buttons.filter((_: string, i: number) => i !== index)
                      onUpdate({ buttons: newButtons })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdate({ buttons: [...buttons, `Button ${buttons.length + 1}`] })}
              >
                Add Button
              </Button>
            </div>
          </div>
        )

      case "condition":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Condition</Label>
              <Input
                value={(node.data.condition as string) || ""}
                onChange={(e) => onUpdate({ condition: e.target.value })}
                placeholder="e.g., contains_keyword, equals..."
              />
            </div>
            <div className="space-y-2">
              <Label>True Label</Label>
              <Input
                value={(node.data.trueLabel as string) || "Yes"}
                onChange={(e) => onUpdate({ trueLabel: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>False Label</Label>
              <Input
                value={(node.data.falseLabel as string) || "No"}
                onChange={(e) => onUpdate({ falseLabel: e.target.value })}
              />
            </div>
          </div>
        )

      case "handoff":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Handoff Message</Label>
              <Textarea
                value={(node.data.label as string) || ""}
                onChange={(e) => onUpdate({ label: e.target.value })}
                rows={3}
                placeholder="Message shown when handing off to human..."
              />
            </div>
          </div>
        )

      default:
        return <p className="text-sm text-muted-foreground">No editor available for this node type.</p>
    }
  }

  return (
    <div className="w-72 shrink-0 rounded-lg border bg-background p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold capitalize">{node.type} Node</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {renderContent()}
      <div className="mt-6">
        <Button variant="destructive" size="sm" className="w-full" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Node
        </Button>
      </div>
    </div>
  )
}
