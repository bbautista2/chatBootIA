"use client"

import { useEffect, useState, useRef } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Send,
  Bot,
  User,
  Headphones,
  RefreshCw,
} from "lucide-react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import toast from "react-hot-toast"
import { format } from "date-fns"
import type { Conversation, Message } from "@/types"
import { cn } from "@/lib/utils"

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  bot: "default",
  human: "secondary",
  closed: "destructive",
}

export default function InboxPage() {
  const params = useParams()
  const accountId = params.id as string

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState("all")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = async () => {
    try {
      const res = await api.get(`/accounts/${accountId}/conversations`)
      setConversations(res.data.conversations || res.data)
    } catch {
      toast.error("Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [accountId])

  useEffect(() => {
    if (selectedConversation) {
      const fetchMessages = async () => {
        try {
          const res = await api.get(
            `/accounts/${accountId}/conversations/${selectedConversation.id}/messages`
          )
          setMessages(res.data.messages || res.data)
        } catch {
          toast.error("Failed to load messages")
        }
      }
      fetchMessages()
    }
  }, [accountId, selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!selectedConversation) return
    const interval = setInterval(() => {
      api
        .get(
          `/accounts/${accountId}/conversations/${selectedConversation.id}/messages`
        )
        .then((res) => {
          setMessages(res.data.messages || res.data)
        })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [accountId, selectedConversation])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    setSending(true)
    try {
      await api.post(
        `/accounts/${accountId}/conversations/${selectedConversation.id}/messages`,
        { content: newMessage }
      )
      setNewMessage("")
      const res = await api.get(
        `/accounts/${accountId}/conversations/${selectedConversation.id}/messages`
      )
      setMessages(res.data.messages || res.data)
    } catch {
      toast.error("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const takeControl = async () => {
    if (!selectedConversation) return
    try {
      await api.patch(
        `/accounts/${accountId}/conversations/${selectedConversation.id}`,
        { status: "human" }
      )
      toast.success("Switched to human mode")
      fetchConversations()
      setSelectedConversation((prev) =>
        prev ? { ...prev, status: "human" } : prev
      )
    } catch {
      toast.error("Failed to switch mode")
    }
  }

  const releaseToBot = async () => {
    if (!selectedConversation) return
    try {
      await api.patch(
        `/accounts/${accountId}/conversations/${selectedConversation.id}`,
        { status: "bot" }
      )
      toast.success("Released to bot")
      fetchConversations()
      setSelectedConversation((prev) =>
        prev ? { ...prev, status: "bot" } : prev
      )
    } catch {
      toast.error("Failed to switch mode")
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (filter === "all") return true
    return conv.status === filter
  })

  return (
    <AppLayout
      title="Inbox"
      breadcrumbs={[
        { label: "Accounts", href: "/accounts" },
        { label: "Inbox" },
      ]}
    >
      <div className="flex h-[calc(100vh-10rem)] gap-4">
        <div className="w-80 flex-col rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-semibold">Conversations</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchConversations()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="mx-3 mt-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="bot">Bot</TabsTrigger>
              <TabsTrigger value="human">Human</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-2">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No conversations found
                </p>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "w-full rounded-lg p-3 text-left transition-colors hover:bg-accent",
                      selectedConversation?.id === conv.id && "bg-accent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {conv.contact?.name || "Unknown"}
                      </span>
                      <Badge variant={statusColors[conv.status]} className="text-[10px]">
                        {conv.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {conv.contact?.igScopedId || "No messages"}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {format(new Date(conv.lastMessageAt), "MMM d, h:mm a")}
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex-col rounded-lg border bg-background">
          {!selectedConversation ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">
                Select a conversation to start chatting
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b p-3">
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.contact?.name || "Unknown"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.contact?.igScopedId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusColors[selectedConversation.status]}>
                    {selectedConversation.status === "bot" ? (
                      <Bot className="mr-1 h-3 w-3" />
                    ) : selectedConversation.status === "human" ? (
                      <User className="mr-1 h-3 w-3" />
                    ) : null}
                    {selectedConversation.status}
                  </Badge>
                  {selectedConversation.status === "bot" ? (
                    <Button size="sm" onClick={takeControl}>
                      <Headphones className="mr-1 h-4 w-4" />
                      Take Control
                    </Button>
                  ) : selectedConversation.status === "human" ? (
                    <Button size="sm" variant="outline" onClick={releaseToBot}>
                      <Bot className="mr-1 h-4 w-4" />
                      Release to Bot
                    </Button>
                  ) : null}
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.direction === "outgoing" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-4 py-2",
                          msg.direction === "outgoing"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
                            msg.direction === "outgoing"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {msg.senderName && (
                            <span className="mr-1">{msg.senderName}</span>
                          )}
                          {format(new Date(msg.createdAt), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              {selectedConversation.status !== "closed" && (
                <div className="border-t p-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      sendMessage()
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sending}
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
