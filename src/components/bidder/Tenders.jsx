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
import { useAuth } from "@/context/AuthContext"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

function daysUntil(dateStr) {
  const today = new Date()
  const then = new Date(dateStr + "T00:00:00")
  const diff = Math.ceil((then - today) / (1000 * 60 * 60 * 24))
  return diff
}

export default function Tenders() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [view, setView] = useState("table") // "table" | "card"
  const [query, setQuery] = useState("")
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Filtering State
  const [filterMode, setFilterMode] = useState("all") // "all" | "recommended"
  const [userInterests, setUserInterests] = useState([])

  useEffect(() => {
    fetchTenders()
    if (user?.id) {
      fetchUserProfile()
    }
  }, [user?.id])

  async function fetchUserProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tender_categories')
        .eq('id', user.id)
        .single()

      if (data && data.tender_categories) {
        setUserInterests(data.tender_categories)
        // If user has interests, default to recommended
        if (data.tender_categories.length > 0) {
          setFilterMode("recommended")
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user profile interests', err)
    }
  }

  async function fetchTenders() {
    try {
      setLoading(true)
      setError("")
      const { data, error } = await supabase
        .from('tenders')
        .select('id,title,description,province,budget,status,closing_date,created_at,document_url,posted_by,category')
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
    let result = data;

    // 1. Filter by Recommendation
    if (filterMode === "recommended" && userInterests.length > 0) {
      result = result.filter(t => t.category && userInterests.includes(t.category))
    }

    // 2. Filter by Search Query
    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter((t) => {
        return (
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.province?.toLowerCase().includes(q) ||
          t.budget?.toString().toLowerCase().includes(q) ||
          t.status?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
        )
      })
    }

    return result
  }, [query, data, filterMode, userInterests])

  function handleRefresh() {
    fetchTenders()
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
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

      {/* Category Tabs */}
      <div className="mb-6">
        <Tabs value={filterMode} onValueChange={setFilterMode} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Tenders</TabsTrigger>
            <TabsTrigger value="recommended" disabled={userInterests.length === 0}>
              Recommended for You
              {userInterests.length > 0 && <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Match</span>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {filterMode === "recommended" && userInterests.length === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            Complete your profile interests to see recommended tenders.
          </p>
        )}
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
                <TableHead>Category</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Closing Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tenders found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>
                      {t.category ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {t.category}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No tenders found matching your criteria.
            </div>
          ) : (
            filtered.map((t) => {
              const days = t.closing_date ? daysUntil(t.closing_date) : null
              return (
                <Card key={t.id} className="flex flex-col h-full border rounded-lg hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        {t.category && (
                          <span className="w-fit inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground mb-1">
                            {t.category}
                          </span>
                        )}
                        <span className="text-sm font-semibold line-clamp-2">{t.title}</span>
                        <span className="text-xs text-muted-foreground">Budget: {t.budget || 'N/A'}</span>

                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {/*<CardDescription className="text-sm text-muted-foreground mb-4">*/}
                    <div className="flex flex-col gap-2 mb-2 text-sm text-muted-foreground">
                      {t.description && <p className="line-clamp-2 mb-2">{t.description}</p>}

                      <div className="flex items-center gap-2"><IconMapPin className="size-4" />{t.province || '—'}</div>
                      {t.closing_date && (
                        <div className="flex items-center gap-2"><IconClock className="size-4" />{t.closing_date}</div>
                      )}
                    </div>
                    {days !== null && (
                      <div className="text-orange-600 font-medium text-sm mt-auto pt-2">{days > 0 ? `CLOSES in ${days} days` : days === 0 ? "CLOSES today" : "CLOSED"}</div>
                    )}
                    {t.created_at && (
                      <div className="text-xs text-muted-foreground mt-2">Published {new Date(t.created_at).toISOString().slice(0, 10)}</div>
                    )}
                    {/*</CardDescription>*/}
                  </CardContent>
                  <CardFooter className="mt-4 pt-0">
                    <div className="w-full">
                      <Button className="w-full" onClick={() => navigate(`/tenders/${t.id}`)}>View Details</Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
