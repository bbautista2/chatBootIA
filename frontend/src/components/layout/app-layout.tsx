"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import api from "@/lib/api"
import type { Account } from "@/types"

interface AppLayoutProps {
  children: React.ReactNode
  title: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function AppLayout({ children, title, breadcrumbs = [] }: AppLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      api
        .get("/accounts")
        .then((res) => {
          setAccounts(res.data.accounts || res.data)
          if (res.data.accounts?.length > 0) {
            setSelectedAccountId(res.data.accounts[0].id)
          } else if (Array.isArray(res.data) && res.data.length > 0) {
            setSelectedAccountId(res.data[0].id)
          }
        })
        .catch(() => {})
    }
  }, [status])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        accounts={accounts.map((a) => ({
          id: a.id,
          name: a.name,
          igUsername: a.igUsername,
        }))}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} breadcrumbs={breadcrumbs} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
