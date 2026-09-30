"use client"

import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Conversation } from "@/types"

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  bot: "default",
  human: "secondary",
  closed: "destructive",
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
  onSelect: (conversation: Conversation) => void
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No conversations found
          </p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              className={cn(
                "w-full rounded-lg p-3 text-left transition-colors hover:bg-accent",
                selectedId === conversation.id && "bg-accent"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">
                  {conversation.contact?.name || "Unknown"}
                </span>
                <Badge
                  variant={statusColors[conversation.status]}
                  className="ml-2 shrink-0 text-[10px]"
                >
                  {conversation.status}
                </Badge>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate flex-1">
                  {conversation.contact?.igScopedId || "No messages"}
                </p>
                <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                  {format(new Date(conversation.lastMessageAt), "MMM d, h:mm a")}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
