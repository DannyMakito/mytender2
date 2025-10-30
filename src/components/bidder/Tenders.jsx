import React, { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { IconRefresh, IconLayoutGrid, IconTable, IconMapPin, IconTag, IconClock, IconCalendar } from "@tabler/icons-react"

const sampleTenders = [
  {
    tenderNo: "ERI/2025/TSS/07L",
    title: "LIST OF BIDDERS: SUPPLY AND DELIVERY OF FASTENERS",
    department: "ESKOM",
    province: "Gauteng",
    category: "Services: General",
    status: "OPEN",
    closingDate: "2025-10-17",
    publishedDate: "2025-10-02",
    type: "Participation",
  },
  {
    tenderNo: "RFQ00016",
    title: "SERVICE PROVIDER TO RESOLVE THE MQA'S CURRENT NON-COMPLIANCE STATUS",
    department: "Mining Qualifications Authority",
    province: "Gauteng",
    category: "Education",
    status: "OPEN",
    closingDate: "2025-10-09",
    publishedDate: "2025-10-02",
    type: "Request for Quotation",
  },
  {
    tenderNo: "GMQ072/25-26",
    title: "GMQ 072 OF 25-26 – APPOINTMENT OF A SERVICE PROVIDER",
    department: "George Municipality",
    province: "Western Cape",
    category: "Information Service Activities",
    status: "OPEN",
    closingDate: "2025-10-09",
    publishedDate: "2025-10-02",
    type: "Request for Quotation",
  },
]

function daysUntil(dateStr) {
  const today = new Date()
  const then = new Date(dateStr + "T00:00:00")
  const diff = Math.ceil((then - today) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Tenders() {
  const [view, setView] = useState("table") // "table" | "card"
  const [query, setQuery] = useState("")
  const [data, setData] = useState(sampleTenders)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter((t) => {
      return (
        t.tenderNo.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.province.toLowerCase().includes(q)
      )
    })
  }, [query, data])

  function handleRefresh() {
    // placeholder: in a real app you'd fetch new data
    setData((d) => [...d])
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tender Directory</h1>
          <p className="text-muted-foreground">Discover tender opportunities across South Africa</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mr-2">
            <IconRefresh />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button
            variant={view === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("card")}
            aria-pressed={view === "card"}
          >
            <IconLayoutGrid />
          </Button>
          <Button
            variant={view === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
            aria-pressed={view === "table"}
          >
            <IconTable />
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <Input
          placeholder="Search tenders, departments, or keywords..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <div className="ml-auto">
          <select className="rounded-md border px-3 py-2 text-sm">
            <option>Date Published (Newest)</option>
            <option>Date Published (Oldest)</option>
          </select>
        </div>
      </div>

      {view === "table" ? (
        <div>
          <Table className="border rounded-md">
            <TableHeader>
              <TableRow>
                <TableHead>Tender No.</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Closing Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.tenderNo}>
                  <TableCell className="font-medium">{t.tenderNo}</TableCell>
                  <TableCell className="max-w-sm truncate">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.department}</div>
                  </TableCell>
                  <TableCell className="flex items-center gap-2"><IconMapPin className="size-4 text-muted-foreground" />{t.province}</TableCell>
                  <TableCell className="flex items-center gap-2"><IconTag className="size-4 text-muted-foreground" />{t.category}</TableCell>
                  <TableCell className="text-green-600 font-medium">{t.status}</TableCell>
                  <TableCell className="flex items-center gap-2"><IconCalendar className="size-4 text-muted-foreground" />{t.closingDate}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((t) => {
            const days = daysUntil(t.closingDate)
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
                    <div className="text-orange-600 font-medium">{days > 0 ? `CLOSES in ${days} days` : days === 0 ? "CLOSES today" : "CLOSED"}</div>
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
      )}
    </div>
  )
}
