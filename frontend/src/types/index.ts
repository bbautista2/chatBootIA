export interface User {
  id: string
  email: string
  name?: string
  role: "admin" | "superadmin"
  createdAt: string
  updatedAt: string
}

export interface Account {
  id: string
  name: string
  igUserId: string
  igUsername?: string
  status: "active" | "inactive" | "error"
  accessToken?: string
  userId: string
  createdAt: string
  updatedAt: string
  config?: BotConfig
  _count?: {
    flows: number
    contacts: number
    conversations: number
  }
}

export interface BotConfig {
  id: string
  accountId: string
  welcomeMessage?: string
  businessHours?: BusinessHours
  aiEnabled: boolean
  aiPrompt?: string
  fallbackMessage?: string
  updatedAt: string
}

export interface BusinessHours {
  monday?: { start: string; end: string }
  tuesday?: { start: string; end: string }
  wednesday?: { start: string; end: string }
  thursday?: { start: string; end: string }
  friday?: { start: string; end: string }
  saturday?: { start: string; end: string }
  sunday?: { start: string; end: string }
}

export interface Flow {
  id: string
  name: string
  accountId: string
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  triggers?: Trigger[]
  steps?: FlowStep[]
  _count?: {
    triggers: number
    steps: number
  }
}

export interface Trigger {
  id: string
  flowId: string
  type: "keyword" | "regex" | "postback" | "start"
  value: string
  createdAt: string
}

export interface FlowStep {
  id: string
  flowId: string
  type: "message" | "buttons" | "condition" | "handoff"
  content: string
  position: { x: number; y: number }
  config?: Record<string, unknown>
  connections?: FlowStepConnection[]
  createdAt: string
}

export interface FlowStepConnection {
  id: string
  sourceStepId: string
  targetStepId: string
  label?: string
  sourceHandle?: string
}

export interface Contact {
  id: string
  igScopedId: string
  name?: string
  profilePic?: string
  tags: string[]
  accountId: string
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  contactId: string
  accountId: string
  status: "bot" | "human" | "closed"
  lastMessageAt: string
  createdAt: string
  contact?: Contact
  account?: Account
  _count?: {
    messages: number
  }
}

export interface Message {
  id: string
  conversationId: string
  direction: "incoming" | "outgoing"
  content: string
  senderType: "bot" | "human" | "system"
  senderName?: string
  createdAt: string
}

export interface DashboardStats {
  totalMessages: number
  activeAccounts: number
  openConversations: number
  totalContacts: number
}

export interface MessagesByDay {
  date: string
  count: number
}

export interface MessagesByAccount {
  accountName: string
  count: number
}

export interface ConversationsByStatus {
  status: string
  count: number
}

export interface FlowGraph {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export interface FlowNode {
  id: string
  type: string
  data: Record<string, unknown>
  position: { x: number; y: number }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  label?: string
}
