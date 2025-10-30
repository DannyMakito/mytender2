import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { IconMapPin, IconTag, IconClock, IconSearch } from "@tabler/icons-react"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"

function daysUntil(dateStr) {
  const today = new Date()
  const then = new Date(dateStr + "T00:00:00")
  const diff = Math.ceil((then - today) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Tender() {
  const [tenders, setTenders] = useState([])
  const [sheetOpen, setSheetOpen] = useState(false)

  const [form, setForm] = useState({
    tenderNo: "",
    title: "",
    description: "",
    department: "",
    province: "",
    category: "",
    type: "",
    closingDate: "",
  })

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleCreate(e) {
    e.preventDefault()
    if (!form.tenderNo.trim() || !form.title.trim()) {
      return alert("Please provide at least Tender No and Title")
    }

    const newTender = {
      tenderNo: form.tenderNo.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      department: form.department.trim() || "",
      province: form.province.trim() || "",
      category: form.category.trim() || "",
      type: form.type.trim() || "",
      status: "OPEN",
      closingDate: form.closingDate || "",
      publishedDate: new Date().toISOString().slice(0, 10),
    }

    setTenders((t) => [newTender, ...t])
    setForm({
      tenderNo: "",
      title: "",
      description: "",
      department: "",
      province: "",
      category: "",
      type: "",
      closingDate: "",
    })
    // close sheet/modal after successful creation
    setSheetOpen(false)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Tender</h1>
        <p className="text-muted-foreground">Create a new tender — the card will appear below after creation.</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground"><IconSearch className="size-4" /></span>
            <Input placeholder="Search tenders, departments, or keywords..." value={form.title} onChange={(e) => update("title", e.target.value)} className="pl-10" />
          </div>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => setSheetOpen(true)}>Create Tender</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-3/4 sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Create Tender</SheetTitle>
              <SheetDescription>Fill out the form to create a new tender. The tender will appear below after creation.</SheetDescription>
            </SheetHeader>

            <form onSubmit={(e) => { handleCreate(e); }} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Tender No" value={form.tenderNo} onChange={(e) => update("tenderNo", e.target.value)} />
                <Input placeholder="Department" value={form.department} onChange={(e) => update("department", e.target.value)} />
              </div>

              <Input placeholder="Title" value={form.title} onChange={(e) => update("title", e.target.value)} />

              <textarea
                className="w-full rounded-md border p-3 text-sm"
                rows={6}
                placeholder="Description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input placeholder="Province" value={form.province} onChange={(e) => update("province", e.target.value)} />
                <Input placeholder="Category" value={form.category} onChange={(e) => update("category", e.target.value)} />
                <Input placeholder="Type (e.g. Request for Quotation)" value={form.type} onChange={(e) => update("type", e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Closing Date</label>
                <input
                  type="date"
                  value={form.closingDate}
                  onChange={(e) => update("closingDate", e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <SheetFooter>
                <div className="flex gap-2">
                  <Button type="submit" className="w-full">Create Tender</Button>
                </div>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tenders.map((t) => {
          const days = t.closingDate ? daysUntil(t.closingDate) : null
          return (
            <Card key={t.tenderNo} className="flex flex-col h-full border rounded-lg">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{t.tenderNo}</span>
                    <span className="text-sm font-semibold">{t.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-green-50 text-green-700 px-2 py-1 text-xs font-medium border border-green-100">{t.status}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardTitle className="font-semibold mb-2">{t.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mb-4">
                  <div className="flex flex-col gap-1 mb-2">
                    <div className="flex items-center gap-2 text-sm"><IconMapPin className="size-4 text-muted-foreground" />{t.province}</div>
                    <div className="flex items-center gap-2 text-sm"><IconTag className="size-4 text-muted-foreground" />{t.category}</div>
                    <div className="flex items-center gap-2 text-sm"><IconClock className="size-4 text-muted-foreground" />{t.type}</div>
                  </div>
                  <div className="text-orange-600 font-medium">{days !== null ? (days > 0 ? `CLOSES in ${days} days` : days === 0 ? "CLOSES today" : "CLOSED") : ""}</div>
                  <div className="text-xs text-muted-foreground mt-2">Published {t.publishedDate}</div>
                </CardDescription>
              </CardContent>
              <CardFooter className="mt-4">
                <div className="w-full">
                  <Button className="w-full">View Details</Button>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
