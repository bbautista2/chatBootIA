"use client"

import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Message } from "@/types"

interface ChatWindowProps {
  messages: Message[]
  className?: string
}

export function ChatWindow({ messages, className }: ChatWindowProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex",
            message.direction === "outgoing" ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "max-w-[70%] rounded-lg px-4 py-2",
              message.direction === "outgoing"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            {message.senderName && (
              <p className="mb-1 text-[10px] font-medium opacity-80">
                {message.senderName}
              </p>
            )}
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p
              className={cn(
                "mt-1 text-[10px]",
                message.direction === "outgoing"
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              )}
            >
              {format(new Date(message.createdAt), "h:mm a")}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
