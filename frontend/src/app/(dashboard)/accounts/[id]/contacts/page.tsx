"use client"

import { AppLayout } from "@/components/layout/app-layout"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, Tag, MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import api from "@/lib/api"
import toast from "react-hot-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import type { Contact } from "@/types"

export default function ContactsPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tagFilter, setTagFilter] = useState("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [tagInput, setTagInput] = useState("")

  const fetchContacts = async () => {
    try {
      const res = await api.get(`/accounts/${accountId}/contacts`)
      setContacts(res.data.contacts || res.data)
    } catch {
      toast.error("Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [accountId])

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      !search ||
      contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      contact.igScopedId.toLowerCase().includes(search.toLowerCase())
    const matchesTag =
      !tagFilter ||
      contact.tags.some((tag) =>
        tag.toLowerCase().includes(tagFilter.toLowerCase())
      )
    return matchesSearch && matchesTag
  })

  const allTags = Array.from(
    new Set(contacts.flatMap((c) => c.tags))
  )

  const openEditTags = (contact: Contact) => {
    setEditingContact(contact)
    setTagInput(contact.tags.join(", "))
    setEditDialogOpen(true)
  }

  const saveTags = async () => {
    if (!editingContact) return
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    try {
      await api.patch(`/accounts/${accountId}/contacts/${editingContact.id}`, {
        tags,
      })
      toast.success("Tags updated")
      setEditDialogOpen(false)
      fetchContacts()
    } catch {
      toast.error("Failed to update tags")
    }
  }

  return (
    <AppLayout
      title="Contacts"
      breadcrumbs={[
        { label: "Accounts", href: "/accounts" },
        { label: "Contacts" },
      ]}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/accounts")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {allTags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              {search || tagFilter
                ? "No contacts match your filters"
                : "No contacts yet"}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IG Scoped ID</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.name || "Unknown"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {contact.igScopedId}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">
                            No tags
                          </span>
                        ) : (
                          contact.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(contact.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditTags(contact)}
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/accounts/${accountId}/inbox`)
                          }
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tags</DialogTitle>
            <DialogDescription>
              Update tags for {editingContact?.name || "this contact"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g., vip, lead, customer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTags}>Save Tags</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
