"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import toast from "react-hot-toast"
import type { Account, BotConfig } from "@/types"

export default function AccountConfigPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string

  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    name: "",
    welcomeMessage: "",
    aiEnabled: true,
    aiPrompt: "",
    fallbackMessage: "",
    businessHours: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountRes, configRes] = await Promise.all([
          api.get(`/accounts/${accountId}`),
          api.get(`/accounts/${accountId}/config`).catch(() => ({ data: null })),
        ])
        setAccount(accountRes.data)
        const botConfig: BotConfig | null = configRes.data
        setConfig({
          name: accountRes.data.name || "",
          welcomeMessage: botConfig?.welcomeMessage || "",
          aiEnabled: botConfig?.aiEnabled ?? true,
          aiPrompt: botConfig?.aiPrompt || "",
          fallbackMessage: botConfig?.fallbackMessage || "",
          businessHours: botConfig?.businessHours
            ? JSON.stringify(botConfig.businessHours, null, 2)
            : "",
        })
      } catch {
        toast.error("Failed to load account data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [accountId])

  const handleSave = async () => {
    setSaving(true)
    try {
      let businessHours = undefined
      if (config.businessHours.trim()) {
        try {
          businessHours = JSON.parse(config.businessHours)
        } catch {
          toast.error("Invalid JSON in business hours")
          setSaving(false)
          return
        }
      }

      await api.patch(`/accounts/${accountId}`, {
        name: config.name,
      })

      await api.put(`/accounts/${accountId}/config`, {
        welcomeMessage: config.welcomeMessage,
        aiEnabled: config.aiEnabled,
        aiPrompt: config.aiPrompt,
        fallbackMessage: config.fallbackMessage,
        businessHours,
      })

      toast.success("Configuration saved")
    } catch {
      toast.error("Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout
        title="Account Configuration"
        breadcrumbs={[
          { label: "Accounts", href: "/accounts" },
          { label: "Configuration" },
        ]}
      >
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title="Account Configuration"
      breadcrumbs={[
        { label: "Accounts", href: "/accounts" },
        { label: account?.name || "Configuration" },
      ]}
    >
      <div className="space-y-6 max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/accounts")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic account configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) =>
                  setConfig({ ...config, name: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bot Configuration</CardTitle>
            <CardDescription>Configure how the bot behaves</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="welcome">Welcome Message</Label>
              <Textarea
                id="welcome"
                placeholder="Hello! Welcome to our page. How can we help you?"
                value={config.welcomeMessage}
                onChange={(e) =>
                  setConfig({ ...config, welcomeMessage: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>AI Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Use AI to automatically respond to messages
                </p>
              </div>
              <Switch
                checked={config.aiEnabled}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, aiEnabled: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt">AI Prompt</Label>
              <Textarea
                id="prompt"
                rows={4}
                placeholder="You are a helpful customer service agent for..."
                value={config.aiPrompt}
                onChange={(e) =>
                  setConfig({ ...config, aiPrompt: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fallback">Fallback Message</Label>
              <Textarea
                id="fallback"
                placeholder="Sorry, I couldn't understand that. Let me connect you with a human agent."
                value={config.fallbackMessage}
                onChange={(e) =>
                  setConfig({ ...config, fallbackMessage: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
            <CardDescription>
              JSON format for business hours configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={6}
              placeholder={`{\n  "monday": { "start": "09:00", "end": "17:00" },\n  "tuesday": { "start": "09:00", "end": "17:00" }\n}`}
              value={config.businessHours}
              onChange={(e) =>
                setConfig({ ...config, businessHours: e.target.value })
              }
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
