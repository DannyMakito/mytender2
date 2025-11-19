import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
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
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox"
import supabase from "../../supabase-client.js"
import { useAuth } from "@/context/AuthContext"
import { IconTrash } from "@tabler/icons-react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
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
import { Separator } from "@/components/ui/separator"
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

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

// Create a separate component for the drag handle
function DragHandle({
  id
}) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent">
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

// Create columns function that accepts onWithdraw callback
const createColumns = (onWithdraw) => [
  {
    accessorKey: "tender_title",
    header: "Tender Title",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.tender_title || 'N/A'}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "tender_description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[400px] truncate text-sm text-muted-foreground">
        {row.original.tender_description || 'No description'}
      </div>
    ),
  },
  {
    accessorKey: "bid_amount",
    header: () => <div className="w-full text-right">Bid Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        R{parseFloat(row.original.bid_amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || 'submitted'
      const statusColors = {
        'submitted': 'bg-blue-50 text-blue-700 border-blue-100',
        'approved': 'bg-green-50 text-green-700 border-green-100',
        'rejected': 'bg-red-50 text-red-700 border-red-100',
      }
      return (
        <Badge 
          variant="outline" 
          className={`px-2 py-1 ${statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-100'}`}
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
      const status = row.original.status || 'submitted'
      // Only allow withdrawal if status is 'submitted'
      if (status === 'submitted') {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWithdraw(row.original.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <IconTrash className="size-4" />
            Withdraw
          </Button>
        )
      }
      return (
        <span className="text-xs text-muted-foreground">Cannot withdraw</span>
      )
    },
  },
]

function DraggableRow({
  row
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function BidderDataTable() {
  const { user } = useAuth()
  const [data, setData] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  // Fetch bids for the logged-in bidder
  React.useEffect(() => {
    if (user?.email) {
      fetchBids()
    } else {
      setLoading(false)
    }
  }, [user?.email])

  async function fetchBids() {
    try {
      setLoading(true)
      setError("")
      
      // Fetch bids for the logged-in bidder
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('id, tender_id, bid_amount, status, submitted_at')
        .eq('bidder', user?.email || '')
        .order('submitted_at', { ascending: false })

      if (bidsError) throw bidsError

      if (!bidsData || bidsData.length === 0) {
        setData([])
        return
      }

      // Fetch tender details for all unique tender IDs
      const tenderIds = [...new Set(bidsData.map(bid => bid.tender_id))]
      const { data: tendersData, error: tendersError } = await supabase
        .from('tenders')
        .select('id, title, description')
        .in('id', tenderIds)

      if (tendersError) throw tendersError

      // Create a map of tender ID to tender data
      const tendersMap = new Map((tendersData || []).map(t => [t.id, t]))

      // Transform the data to flatten tender information
      const transformedData = bidsData.map(bid => {
        const tender = tendersMap.get(bid.tender_id)
        return {
          id: bid.id,
          tender_id: bid.tender_id,
          bid_amount: bid.bid_amount,
          status: bid.status,
          submitted_at: bid.submitted_at,
          tender_title: tender?.title || 'N/A',
          tender_description: tender?.description || '',
        }
      })

      setData(transformedData)
    } catch (err) {
      console.error('Error fetching bids:', err)
      setError(err?.message || 'Failed to load bids')
    } finally {
      setLoading(false)
    }
  }

  async function handleWithdraw(bidId) {
    if (!confirm('Are you sure you want to withdraw this bid? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('bids')
        .delete()
        .eq('id', bidId)
        .eq('bidder', user?.email || '')
        .eq('status', 'submitted') // Only allow withdrawal of submitted bids

      if (error) throw error

      // Refresh the bids list
      await fetchBids()
      toast.success('Bid withdrawn successfully')
    } catch (err) {
      console.error('Error withdrawing bid:', err)
      toast.error(err?.message || 'Failed to withdraw bid')
    }
  }

  const columns = React.useMemo(() => createColumns(handleWithdraw), [user?.email])

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
        (r.tender_title && r.tender_title.toLowerCase().includes(q)) ||
        (r.tender_description && r.tender_description.toLowerCase().includes(q)) ||
        (r.status && r.status.toLowerCase().includes(q)) ||
        (r.bid_amount && r.bid_amount.toString().toLowerCase().includes(q))
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
            <SelectItem value="past-performance"> Performance</SelectItem>
            <SelectItem value="key-personnel">Favorites</SelectItem>
            <SelectItem value="focus-documents">Draft Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList
          className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">All </TabsTrigger>
          <TabsTrigger value="past-performance">
            Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Favorites <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Draft Documents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
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
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="flex items-center justify-between gap-4">
          <Input placeholder="Search tenders, departments, or keywords..." className="flex-1" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="flex items-center gap-2">
            <Select value={`${pageSizeLocal}`} onValueChange={(v) => setPageSizeLocal(Number(v))}>
              <SelectTrigger size="sm" className="w-24">
                <SelectValue placeholder={`${pageSizeLocal}`} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5,10,20,30].map((s) => <SelectItem key={s} value={`${s}`}>{s} per page</SelectItem>)}
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
                      Loading bids...
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
                      No bids found. Start bidding on tenders to see them here.
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
              <div className="text-center py-8 text-muted-foreground">Loading bids...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">{error}</div>
            ) : paged.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bids found.</div>
            ) : (
              paged.map((rowData) => {
                const status = rowData.status || 'submitted'
                const statusColors = {
                  'submitted': 'bg-blue-50 text-blue-700 border-blue-100',
                  'approved': 'bg-green-50 text-green-700 border-green-100',
                  'rejected': 'bg-red-50 text-red-700 border-red-100',
                }
                return (
                  <div key={rowData.id} className="rounded-md border p-3 bg-background">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{rowData.tender_title || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {(rowData.tender_description || '').slice(0, 120)}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`ml-2 ${statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-100'}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">Bid Amount:</span>
                        <div className="font-medium">
                          R{parseFloat(rowData.bid_amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      {status === 'submitted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleWithdraw(rowData.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <IconTrash className="size-4" />
                          Withdraw
                        </Button>
                      )}
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
            <Button variant="outline" size="sm" onClick={() => setPageIndexLocal((p) => Math.max(0, p-1))} disabled={pageIndexLocal === 0}>Prev</Button>
            <div className="px-2">{pageIndexLocal+1} / {totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => setPageIndexLocal((p) => Math.min(totalPages-1, p+1))} disabled={pageIndexLocal >= totalPages-1}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => setPageIndexLocal(totalPages-1)} disabled={pageIndexLocal >= totalPages-1}>Last</Button>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="past-performance" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="focus-documents" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },

  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  }
}

function TableCellViewer({
  item
}) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>
            Showing total visitors for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a" />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a" />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Header</Label>
              <Input id="header" defaultValue={item.header} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={item.type}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Table of Contents">
                      Table of Contents
                    </SelectItem>
                    <SelectItem value="Executive Summary">
                      Executive Summary
                    </SelectItem>
                    <SelectItem value="Technical Approach">
                      Technical Approach
                    </SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Capabilities">Capabilities</SelectItem>
                    <SelectItem value="Focus Documents">
                      Focus Documents
                    </SelectItem>
                    <SelectItem value="Narrative">Narrative</SelectItem>
                    <SelectItem value="Cover Page">Cover Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Done</SelectItem>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="closed">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="target">Target</Label>
                <Input id="target" defaultValue={item.target} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">Limit</Label>
                <Input id="limit" defaultValue={item.limit} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Reviewer</Label>
              <Select defaultValue={item.reviewer}>
                <SelectTrigger id="reviewer" className="w-full">
                  <SelectValue placeholder="Select a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                  <SelectItem value="Jamik Tashpulatov">
                    Jamik Tashpulatov
                  </SelectItem>
                  <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
