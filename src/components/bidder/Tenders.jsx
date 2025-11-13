import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
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
import supabase from "../../../supabase-client.js"

function daysUntil(dateStr) {
  const today = new Date()
  const then = new Date(dateStr + "T00:00:00")
  const diff = Math.ceil((then - today) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Tenders() {
  const navigate = useNavigate()
  const [view, setView] = useState("table") // "table" | "card"
  const [query, setQuery] = useState("")
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchTenders()
  }, [])

  async function fetchTenders() {
    try {
      setLoading(true)
      setError("")
      const { data, error } = await supabase
        .from('tenders')
        .select('id,title,description,province,budget,status,closing_date,created_at,document_url,posted_by')
        .order('created_at', { ascending: false })

      if (error) throw error
      setData(data || [])
    } catch (err) {
      console.error('Error fetching tenders:', err)
      setError(err?.message || 'Failed to load tenders')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter((t) => {
      return (
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.province?.toLowerCase().includes(q) ||
        t.budget?.toString().toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q)
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
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mr-2" disabled={loading}>
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

      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="text-muted-foreground">Loading tenders...</div>
      ) : view === "table" ? (
        <div>
          <Table className="border rounded-md">
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Closing Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="max-w-sm truncate">
                    <div className="text-xs text-muted-foreground mt-1">Budget: {t.budget || 'N/A'}</div>
                    {t.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</div>
                    )}
                  </TableCell>
                  <TableCell className="flex items-center gap-2"><IconMapPin className="size-4 text-muted-foreground" />{t.province || '—'}</TableCell>
                  <TableCell className="text-green-600 font-medium capitalize">{t.status || 'open'}</TableCell>
                  <TableCell className="flex items-center gap-2"><IconCalendar className="size-4 text-muted-foreground" />{t.closing_date || '—'}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {t.document_url && (
                      <Button variant="ghost" size="sm" onClick={() => window.open(t.document_url, '_blank')}>Document</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/tenders/${t.id}`)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((t) => {
            const days = t.closing_date ? daysUntil(t.closing_date) : null
            return (
              <Card key={t.id} className="flex flex-col h-full border rounded-lg">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{t.title}</span>
                      <span className="text-xs text-muted-foreground">Budget: {t.budget || 'N/A'}</span>
                  
                    </div>
                   {/* <div className="flex items-center gap-2">
                      <span className="rounded-full bg-green-50 text-green-700 px-2 py-1 text-xs font-medium border border-green-100 capitalize">{t.status || 'closed'}</span>
                    </div>*/}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardTitle className="font-semibold mb-2">{t.description}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-4">
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="flex items-center gap-2 text-sm"><IconMapPin className="size-4 text-muted-foreground" />{t.province || '—'}</div>
                      {t.closing_date && (
                        <div className="flex items-center gap-2 text-sm"><IconClock className="size-4 text-muted-foreground" />{t.closing_date}</div>
                      )}
                    </div>
                    {days !== null && (
                      <div className="text-orange-600 font-medium">{days > 0 ? `CLOSES in ${days} days` : days === 0 ? "CLOSES today" : "CLOSED"}</div>
                    )}
                    {t.created_at && (
                      <div className="text-xs text-muted-foreground mt-2">Published {new Date(t.created_at).toISOString().slice(0,10)}</div>
                    )}
                  </CardDescription>
                </CardContent>
                <CardFooter className="mt-4">
                  <div className="w-full">
                    <Button className="w-full" onClick={() => navigate(`/tenders/${t.id}`)}>View Details</Button>
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
