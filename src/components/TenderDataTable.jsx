import * as React from "react"
import {
  IconChevronDown,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
  IconChevronRight,
  IconDotsVertical,
  IconCalendar,
  IconCurrencyDollar,
  IconMapPin
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import supabase from "../../supabase-client.js"
import { useAuth } from "@/context/AuthContext"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Create columns function
const createColumns = (navigate) => [
  {
    accessorKey: "title",
    header: "Tender Title",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.title}</span>
        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
          {row.original.description || 'No description'}
        </span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "location",
    header: "Province",
    cell: ({ row }) => (
      <div className="flex items-center gap-1 text-muted-foreground">
        <IconMapPin className="size-3.5" />
        <span>{row.original.province || 'N/A'}</span>
      </div>
    ),
  },
  {
    accessorKey: "budget",
    header: () => <div className="w-full text-right">Budget</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.original.budget
          ? `R${parseFloat(row.original.budget).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : 'N/A'}
      </div>
    ),
  },
  {
    accessorKey: "closing_date",
    header: "Closing Date",
    cell: ({ row }) => {
      const date = row.original.closing_date
      return (
        <div className="flex items-center gap-1">
          <IconCalendar className="size-3.5 text-muted-foreground" />
          <span>{date ? format(new Date(date), 'PP') : 'N/A'}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || 'open'
      const statusColors = {
        'open': 'bg-green-50 text-green-700 border-green-100',
        'closed': 'bg-red-50 text-red-700 border-red-100',
        'draft': 'bg-yellow-50 text-yellow-700 border-yellow-100',
      }
      return (
        <Badge
          variant="outline"
          className={`px-2 py-1 ${statusColors[status.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-100'}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/tender/${row.original.id}`)}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">View</span>
          <IconChevronRight className="h-4 w-4" />
        </Button>
      )
    },
  },
]

export function TenderDataTable() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  // Fetch tenders for the logged-in contractor
  React.useEffect(() => {
    if (user?.email) {
      fetchTenders()
    } else {
      setLoading(false)
    }
  }, [user?.email])

  async function fetchTenders() {
    try {
      setLoading(true)
      setError("")

      const { data: tendersData, error: tendersError } = await supabase
        .from('tenders')
        .select('*')
        .eq('posted_by', user?.email || '')
        .order('created_at', { ascending: false })

      if (tendersError) throw tendersError

      setData(tendersData || [])
    } catch (err) {
      console.error('Error fetching tenders:', err)
      setError(err?.message || 'Failed to load tenders')
    } finally {
      setLoading(false)
    }
  }

  const columns = React.useMemo(() => createColumns(navigate), [navigate])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [columnFilters, setColumnFilters] = React.useState([])
  const [sorting, setSorting] = React.useState([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const [query, setQuery] = React.useState("")
  const [pageIndexLocal, setPageIndexLocal] = React.useState(0)
  const [pageSizeLocal, setPageSizeLocal] = React.useState(10)

  const filteredData = React.useMemo(() => {
    if (!query) return data || []
    const q = query.toLowerCase()
    return (data || []).filter((r) => {
      return (
        (r.title && r.title.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q)) ||
        (r.province && r.province.toLowerCase().includes(q)) ||
        (r.budget && r.budget.toString().toLowerCase().includes(q))
      )
    })
  }, [data, query])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  React.useEffect(() => {
    setPageIndexLocal(0)
  }, [query, pageSizeLocal, filteredData.length])

  const totalRows = filteredData.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSizeLocal))
  const paged = filteredData.slice(pageIndexLocal * pageSizeLocal, (pageIndexLocal + 1) * pageSizeLocal)

  return (
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
          </SelectContent>
        </Select>
        <TabsList
          className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">All </TabsTrigger>
          <TabsTrigger value="open">
            Open <Badge variant="secondary">{data.filter(t => t.status === 'open').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed">
            Closed <Badge variant="secondary">{data.filter(t => t.status === 'closed').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft <Badge variant="secondary">{data.filter(t => t.status === 'draft').length}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) =>
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }>
                      {column.id === 'closing_date' ? 'Closing Date' : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => navigate('/create-tender')}>
            <IconPlus className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Create Tender</span>
          </Button>
        </div>
      </div>
      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenders, description, or keywords..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={`${pageSizeLocal}`} onValueChange={(v) => setPageSizeLocal(Number(v))}>
              <SelectTrigger size="sm" className="w-24">
                <SelectValue placeholder={`${pageSizeLocal}`} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 30].map((s) => <SelectItem key={s} value={`${s}`}>{s} per page</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                      Loading tenders...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-red-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                      No tenders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((rowData) => {
                    // Create a mock row object for rendering
                    const row = { original: rowData, id: rowData.id.toString() }
                    return (
                      <TableRow key={rowData.id} className="hover:bg-muted/50">
                        {columns.map((column) => (
                          <TableCell key={column.accessorKey || column.id}>
                            {column.cell ? column.cell({ row }) : rowData[column.accessorKey]}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="md:hidden p-3 space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading tenders...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">{error}</div>
            ) : paged.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tenders found.</div>
            ) : (
              paged.map((rowData) => {
                const status = rowData.status || 'open'
                const statusColors = {
                  'open': 'bg-green-50 text-green-700 border-green-100',
                  'closed': 'bg-red-50 text-red-700 border-red-100',
                  'draft': 'bg-yellow-50 text-yellow-700 border-yellow-100',
                }
                return (
                  <div key={rowData.id} className="rounded-md border p-3 bg-background">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{rowData.title || 'Untitled'}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {rowData.description || 'No description'}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`ml-2 ${statusColors[status.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-100'}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconMapPin className="size-3.5" />
                        {rowData.province || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1">
                        <IconCalendar className="size-3.5" />
                        {rowData.closing_date ? format(new Date(rowData.closing_date), 'PP') : 'N/A'}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">Budget:</span>
                        <div className="font-medium">
                          {rowData.budget
                            ? `R${parseFloat(rowData.budget).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'N/A'}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/tender/${rowData.id}`)}
                      >
                        Details
                        <IconChevronRight className="ml-1 size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {totalRows > 0 ? (pageIndexLocal * pageSizeLocal) + 1 : 0} - {Math.min((pageIndexLocal + 1) * pageSizeLocal, totalRows)} of {totalRows}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPageIndexLocal(0)} disabled={pageIndexLocal === 0}>First</Button>
            <Button variant="outline" size="sm" onClick={() => setPageIndexLocal((p) => Math.max(0, p - 1))} disabled={pageIndexLocal === 0}>Prev</Button>
            <div className="px-2">{pageIndexLocal + 1} / {totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => setPageIndexLocal((p) => Math.min(totalPages - 1, p + 1))} disabled={pageIndexLocal >= totalPages - 1}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => setPageIndexLocal(totalPages - 1)} disabled={pageIndexLocal >= totalPages - 1}>Last</Button>
          </div>
        </div>
      </TabsContent>
      {/* Other tabs can be implemented similarly or left as placeholders if needed, 
           for now we just mirror the structure but focus on 'outline' (All) content */}
      <TabsContent value="open" className="flex flex-col px-4 lg:px-6">
        <div className="text-muted-foreground text-center py-8">Filter functionality for tabs coming soon. Please use 'All' tab.</div>
      </TabsContent>
      <TabsContent value="closed" className="flex flex-col px-4 lg:px-6">
        <div className="text-muted-foreground text-center py-8">Filter functionality for tabs coming soon. Please use 'All' tab.</div>
      </TabsContent>
      <TabsContent value="draft" className="flex flex-col px-4 lg:px-6">
        <div className="text-muted-foreground text-center py-8">Filter functionality for tabs coming soon. Please use 'All' tab.</div>
      </TabsContent>
    </Tabs>
  );
}
