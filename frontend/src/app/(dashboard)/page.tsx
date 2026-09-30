"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { StatsCard } from "@/components/stats-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MessageSquare, Users, UserCheck, MessagesSquare } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  DashboardStats,
  MessagesByDay,
  MessagesByAccount,
  ConversationsByStatus,
} from "@/types"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [messagesByDay, setMessagesByDay] = useState<MessagesByDay[]>([])
  const [messagesByAccount, setMessagesByAccount] = useState<MessagesByAccount[]>([])
  const [conversationsByStatus, setConversationsByStatus] = useState<ConversationsByStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, dayRes, accountRes, statusRes] = await Promise.all([
          api.get("/dashboard/stats").catch(() => ({ data: { totalMessages: 0, activeAccounts: 0, openConversations: 0, totalContacts: 0 } })),
          api.get("/dashboard/messages-by-day").catch(() => ({ data: [] })),
          api.get("/dashboard/messages-by-account").catch(() => ({ data: [] })),
          api.get("/dashboard/conversations-by-status").catch(() => ({ data: [] })),
        ])
        setStats(statsRes.data)
        setMessagesByDay(dayRes.data)
        setMessagesByAccount(accountRes.data)
        setConversationsByStatus(statusRes.data)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Messages"
              value={stats?.totalMessages || 0}
              icon={MessageSquare}
            />
            <StatsCard
              title="Active Accounts"
              value={stats?.activeAccounts || 0}
              icon={UserCheck}
            />
            <StatsCard
              title="Open Conversations"
              value={stats?.openConversations || 0}
              icon={MessagesSquare}
            />
            <StatsCard
              title="Total Contacts"
              value={stats?.totalContacts || 0}
              icon={Users}
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Messages by Day</CardTitle>
              <CardDescription>Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={messagesByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0088FE"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messages by Account</CardTitle>
              <CardDescription>Distribution across accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={messagesByAccount}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ accountName, percent }) =>
                        `${accountName} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {messagesByAccount.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Conversations by Status</CardTitle>
            <CardDescription>Current conversation status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversationsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" fontSize={12} tickLine={false} />
                  <YAxis fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0088FE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
