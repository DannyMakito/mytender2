import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '@/context/AuthContext'
import { IconUser, IconDots, IconEdit, IconTrash } from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconPackage, IconChartBar, IconTimeline, IconPlus, IconLock } from '@tabler/icons-react'

const columns = [
  { id: 'todo', title: 'Yet To Start' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Completed' },
]

const ProjectsArea = ({ project, addTask, updateTask, deleteTask, addProject, projects, selectedProjectId, activeTab, setActiveTab }) => {
  const { user, role } = useAuth()
  const isClient = role === 'client'
  const isPro = role === 'pro'

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskStartDate, setTaskStartDate] = useState('')
  const [taskEndDate, setTaskEndDate] = useState('')
  const [taskColumn, setTaskColumn] = useState('todo')
  const [taskProjectId, setTaskProjectId] = useState(selectedProjectId || (project && project.id) || (projects && projects[0] && projects[0].id) || '')
  const [taskPriorityColor, setTaskPriorityColor] = useState('orange')
  const [isMilestone, setIsMilestone] = useState(false)
  const [supplierTenders, setSupplierTenders] = useState([])
  const [fetchingSuppliers, setFetchingSuppliers] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()

    if (!taskTitle.trim()) {
      alert('Please enter a task title')
      return
    }
    if (!taskProjectId) {
      alert('Please select a project')
      return
    }

    const newTask = {
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      status: taskColumn || 'todo',
      priorityColor: taskPriorityColor || '',
      startDate: taskStartDate || null,
      endDate: taskEndDate || null,
      is_milestone: isMilestone,
    }

    // call addTask with projectId and task
    const targetProjectId = taskProjectId || (project && project.id)
    await addTask?.(targetProjectId, newTask)

    resetForm()
    setSheetOpen(false)
  }

  function resetForm() {
    setTaskTitle('')
    setTaskDesc('')
    setTaskStartDate('')
    setTaskEndDate('')
    setTaskPriorityColor('orange')
    setTaskColumn('todo')
    setIsMilestone(false)
    setEditingTask(null)
  }

  function handleEditOpen(task) {
    setEditingTask(task)
    setTaskTitle(task.title || '')
    setTaskDesc(task.description || task.desc || '')
    setTaskStartDate(task.startDate || task.start_date || '')
    setTaskEndDate(task.endDate || task.end_date || '')
    setTaskColumn(task.status || 'todo')
    setTaskPriorityColor(task.priorityColor || task.priority_color || 'orange')
    setIsMilestone(task.is_milestone || false)
    setEditSheetOpen(true)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    if (!editingTask) return

    const updatedTask = {
      ...editingTask,
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      status: taskColumn,
      priorityColor: taskPriorityColor,
      startDate: taskStartDate || null,
      endDate: taskEndDate || null,
      is_milestone: isMilestone,
    }

    await updateTask?.(project.id, updatedTask)
    setEditSheetOpen(false)
    resetForm()
  }

  async function handleDelete(taskId) {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask?.(project.id, taskId)
    }
  }

  const grouped = {
    todo: project ? (project.tasks || []).filter((t) => t.status === 'todo' || t.status === 'waiting') : [],
    inprogress: project ? (project.tasks || []).filter((t) => t.status === 'inprogress') : [],
    done: project ? (project.tasks || []).filter((t) => t.status === 'done' || t.status === 'completed') : [],
  }

  function handleDragEnd(event) {
    // Only allow drag and drop for 'pro' role
    if (isClient) return

    const { active, over } = event
    if (!over) return
    const activeId = active.id
    const overId = over.id

    let targetStatus = null
    if (['todo', 'inprogress', 'done'].includes(overId)) {
      targetStatus = overId
    } else {
      const targetTask = project && (project.tasks || []).find((t) => t.id === overId)
      if (targetTask) targetStatus = targetTask.status
    }

    if (!targetStatus) return

    const task = project && (project.tasks || []).find((t) => t.id === activeId)

    // Only allow dragging tasks that the current user created
    if (task && task.created_by && task.created_by !== user?.email) {
      return // Silently prevent — the drag is disabled at the card level too
    }

    if (task && task.status !== targetStatus) {
      const updated = {
        ...task,
        status: targetStatus,
        priorityColor: task.priorityColor || task.priority_color || '',
        startDate: task.startDate || task.start_date || null,
        endDate: task.endDate || task.end_date || null,
      }
      if (typeof updateTask === 'function') updateTask(project.id, updated)
    }
  }

  // Fetch supplier tenders linked to this project
  React.useEffect(() => {
    if (project?.id) {
      fetchSupplierTenders()
    }
  }, [project?.id])

  // Redirect professionals away from restricted tabs
  React.useEffect(() => {
    if (isPro && (activeTab === 'supply-chain' || activeTab === 'financials')) {
      setActiveTab('board')
    }
  }, [isPro, activeTab])

  async function fetchSupplierTenders() {
    try {
      setFetchingSuppliers(true)
      const { data, error } = await supabase
        .from('tenders')
        .select(`
          *,
          bids(*)
        `)
        .eq('project_id', project.id)
        .eq('tender_type', 'supplier')

      if (error) throw error
      setSupplierTenders(data || [])
    } catch (err) {
      console.error('Error fetching supplier tenders:', err)
    } finally {
      setFetchingSuppliers(false)
    }
  }

  // Calculate financials
  const totalBudget = project?.total_budget || 0
  const actualSpend = supplierTenders.reduce((acc, t) => {
    const approvedBid = t.bids?.find(b => b.status === 'approved')
    return acc + (approvedBid ? parseFloat(approvedBid.bid_amount) : 0)
  }, 0) + (project?.tasks?.filter(t => t.status === 'done').length * 500) // Mock task cost for now


  // Droppable column wrapper
  function Column({ col, children }) {
    const { setNodeRef, isOver } = useDroppable({
      id: col.id,
      disabled: isClient
    })
    return (
      <div ref={setNodeRef} id={col.id} className={`bg-card rounded-lg border p-4 min-h-[300px] ${isOver && !isClient ? 'ring-2 ring-offset-1 ring-orange-200' : ''}`}>
        {children}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">{project?.name || 'Projects'}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {project?.owner_email === user?.email && !project?.is_locked && (
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={async () => {
                if (window.confirm('Are you sure you want to sign off and lock this project? This will freeze all tasks and financials.')) {
                  const { error } = await supabase.from('projects').update({ is_locked: true }).eq('id', project.id)
                  if (error) alert(error.message)
                  else window.location.reload()
                }
              }}
            >
              Final Sign-off
            </Button>
          )}
          {project?.is_locked && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1">
              <IconLock className="size-3" /> Locked
            </span>
          )}
          <div className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded ring-1 ring-inset ring-gray-200">A↕ Sort</div>
          {isPro && !project?.is_locked && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => setSheetOpen(true)}>Add New Task</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Create Task</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleCreate} className="p-4 space-y-4">
                  <input className="w-full rounded-md border px-3 py-2" placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                  <textarea rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Task description" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />

                  <div className="grid grid-cols-2 gap-2">
                    <select className="w-full rounded-md border px-3 py-2" value={taskProjectId} onChange={(e) => setTaskProjectId(e.target.value)}>
                      <option value="">Select Project</option>
                      {(projects || []).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    <select className="w-full rounded-md border px-3 py-2" value={taskPriorityColor} onChange={(e) => setTaskPriorityColor(e.target.value)}>

                      <option value="orange">low</option>
                      <option value="yellow">medium </option>
                      <option value="red">High </option>

                    </select>
                  </div>
                  <select className="w-full rounded-md border px-3 py-2" value={taskColumn} onChange={(e) => setTaskColumn(e.target.value)}>

                    <option value="todo">Yet To Start</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>

                  <div className="text-sm text-muted-foreground mb-2">Start and End Date</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" className="w-full rounded-md border px-3 py-2" value={taskStartDate} onChange={(e) => setTaskStartDate(e.target.value)} />
                    <input type="date" className="w-full rounded-md border px-3 py-2" value={taskEndDate} onChange={(e) => setTaskEndDate(e.target.value)} />
                  </div>

                  <div className="flex items-center space-x-2 py-2">
                    <input
                      type="checkbox"
                      id="isMilestone"
                      checked={isMilestone}
                      onChange={(e) => setIsMilestone(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="isMilestone" className="text-sm font-medium text-orange-700">This is a Project Milestone</label>
                  </div>

                  <SheetFooter>
                    <div className="flex gap-2"><Button type="submit" className="w-full">Create Task</Button></div>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          )}

          {/* Edit Task Sheet */}
          <Sheet open={editSheetOpen} onOpenChange={(open) => {
            setEditSheetOpen(open)
            if (!open) resetForm()
          }}>
            <SheetContent side="right" className="w-full sm:max-w-xl">
              <SheetHeader>
                <SheetTitle>Edit Task</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleUpdate} className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task Title</label>
                  <input className="w-full rounded-md border px-3 py-2" placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea rows={3} className="w-full rounded-md border px-3 py-2" placeholder="Task description" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <select className="w-full rounded-md border px-3 py-2" value={taskPriorityColor} onChange={(e) => setTaskPriorityColor(e.target.value)}>
                      <option value="orange">low</option>
                      <option value="yellow">medium</option>
                      <option value="red">High</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select className="w-full rounded-md border px-3 py-2" value={taskColumn} onChange={(e) => setTaskColumn(e.target.value)}>
                      <option value="todo">Yet To Start</option>
                      <option value="inprogress">In Progress</option>
                      <option value="done">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Start and End Date</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" className="w-full rounded-md border px-3 py-2" value={taskStartDate} onChange={(e) => setTaskStartDate(e.target.value)} />
                    <input type="date" className="w-full rounded-md border px-3 py-2" value={taskEndDate} onChange={(e) => setTaskEndDate(e.target.value)} />
                  </div>

                  <div className="flex items-center space-x-2 py-2">
                    <input
                      type="checkbox"
                      id="editIsMilestone"
                      checked={isMilestone}
                      onChange={(e) => setIsMilestone(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="editIsMilestone" className="text-sm font-medium text-orange-700">This is a Project Milestone</label>
                  </div>
                </div>

                <SheetFooter className="mt-6">
                  <Button type="submit" className="w-full">Update Task</Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-1 scrollbar-hide">
          <TabsList className="inline-flex w-auto min-w-full lg:min-w-0 p-1 bg-muted/50">
            <TabsTrigger value="board" className="px-4 py-2">Board</TabsTrigger>
            {isClient && (
              <>
                <TabsTrigger value="supply-chain" className="px-4 py-2">Supply Chain</TabsTrigger>
                <TabsTrigger value="financials" className="px-4 py-2">Financials</TabsTrigger>
              </>
            )}
            <TabsTrigger value="timeline" className="px-4 py-2">Timeline</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="board" className="mt-4">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {columns.map((col) => (
                <Column key={col.id} col={col}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="px-3 py-2 rounded-md bg-muted text-sm">{col.title}</div>
                    <div className="text-sm rounded-full bg-orange-50 px-2 py-1 text-orange-700">{grouped[col.id].length}</div>
                  </div>
                  <div className="space-y-3">
                    {grouped[col.id].length === 0 ? (
                      <Card className="rounded-lg border">
                        <CardHeader>
                          <CardTitle className="text-sm">No Tasks currently. Board is empty!</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="py-8 text-center text-muted-foreground">No Tasks currently. Board is empty!</div>
                        </CardContent>
                      </Card>
                    ) : (
                      <SortableContext items={grouped[col.id].map((t) => t.id)} strategy={verticalListSortingStrategy}>
                        {grouped[col.id].map((t) => {
                          const priorityColor = t.priorityColor || t.priority_color || ''
                          const badgeMap = {
                            yellow: { cls: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
                            red: { cls: 'bg-red-100 text-red-800', label: 'High' },
                            orange: { cls: 'bg-orange-100 text-orange-800', label: 'Low' },
                          }
                          const badge = badgeMap[priorityColor] || { cls: 'bg-gray-100 text-gray-800', label: 'None' }
                          const startDate = t.startDate || t.start_date
                          const endDate = t.endDate || t.end_date
                          const createdBy = t.created_by || null
                          const canDrag = isPro && (!createdBy || createdBy === user?.email)

                          function DraggableCard({ task }) {
                            const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
                              id: task.id,
                              disabled: isClient || !canDrag
                            })
                            const style = {
                              transform: CSS.Transform.toString(transform),
                              transition,
                              opacity: isDragging ? 0.8 : 1,
                              cursor: canDrag ? 'grab' : 'default',
                            }
                            const dragProps = (isClient || !canDrag) ? {} : { ...attributes, ...listeners }
                            return (
                              <div ref={setNodeRef} style={style} {...dragProps}>
                                <Card key={task.id} className="rounded-lg border relative overflow-hidden">
                                  <div className="absolute top-3 left-3">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md ${badge.cls}`}>
                                      <span className="text-xs">»</span>
                                      <span>{badge.label}</span>
                                    </span>
                                  </div>
                                  <div className="absolute top-3 right-3">
                                    {(createdBy === user?.email || project?.owner_email === user?.email) ? (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                                            <IconDots className="size-4" />
                                          </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleEditOpen(t)} className="cursor-pointer">
                                            <IconEdit className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleDelete(t.id)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                            <IconTrash className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    ) : (
                                      <button className="text-muted-foreground text-sm opacity-50 cursor-not-allowed">⋯</button>
                                    )}
                                  </div>
                                  <CardHeader className="pt-10 px-4">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-sm font-semibold">{task.title}</CardTitle>
                                      {task.is_milestone && (
                                        <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                          Milestone
                                        </span>
                                      )}
                                    </div>
                                  </CardHeader>
                                  <CardContent className="px-4 pb-4 text-sm text-muted-foreground">
                                    <div>{task.description || task.desc || 'No description.'}</div>
                                    {(startDate || endDate) && (
                                      <div className="text-sm bg-red-100 text-black px-2 py-1 rounded mt-2">
                                        {startDate ? new Date(startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : 'No start date'} - {endDate ? new Date(endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : 'No end date'}
                                      </div>
                                    )}
                                    {task.is_milestone && (
                                      <div className="mt-4 pt-4 border-t space-y-3">
                                        <div className="flex items-center justify-between text-[11px] font-bold uppercase">
                                          <span className={task.contractor_sign_off ? 'text-orange-600' : 'text-amber-600'}>
                                            Contractor: {task.contractor_sign_off ? 'SIGNED' : 'PENDING'}
                                          </span>
                                          <span className={task.client_sign_off ? 'text-orange-600' : 'text-amber-600'}>
                                            Client: {task.client_sign_off ? 'SIGNED' : 'PENDING'}
                                          </span>
                                        </div>
                                        <div className="flex gap-2">
                                          {isPro && !task.contractor_sign_off && createdBy === user?.email && (
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              className="h-7 text-[10px] flex-1"
                                              onClick={() => updateTask(project.id, { ...task, contractor_sign_off: true })}
                                            >
                                              Sign Off
                                            </Button>
                                          )}
                                          {isClient && !task.client_sign_off && project?.owner_email === user?.email && (
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              className="h-7 text-[10px] flex-1 bg-orange-100 text-orange-700 hover:bg-orange-200"
                                              onClick={() => updateTask(project.id, { ...task, client_sign_off: true })}
                                            >
                                              Client Sign Off
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {createdBy && (
                                      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground pt-2">
                                        <IconUser className="size-3" />
                                        <span>{createdBy.split('@')[0]}</span>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            )
                          }
                          return <DraggableCard key={t.id} task={{ ...t, priorityColor, startDate, endDate, created_by: createdBy }} />
                        })}
                      </SortableContext>
                    )}
                  </div>
                </Column>
              ))}
            </div>
          </DndContext>
        </TabsContent>

        <TabsContent value="supply-chain">
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Supply Chain & Materials</CardTitle>
                <CardDescription>Track material quotes and delivery status for this project</CardDescription>
              </div>
              {isPro && !project?.is_locked && (
                <Button size="sm" onClick={() => navigate(`/tender?projectId=${project.id}`)}>
                  <IconPlus className="size-4 mr-2" />
                  Request Quotes
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {fetchingSuppliers ? (
                <div className="py-8 text-center text-muted-foreground">Loading supplier data...</div>
              ) : supplierTenders.length === 0 ? (
                <div className="py-12 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                  <IconPackage className="size-12 mx-auto mb-3 opacity-20" />
                  <p>No material quotes linked to this project yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supplierTenders.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                          <IconPackage className="size-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{t.title}</p>
                          <p className="text-xs text-muted-foreground">Category: {t.category} • Status: {t.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {t.bids?.find(b => b.status === 'approved')?.bid_amount ? `R${parseFloat(t.bids.find(b => b.status === 'approved').bid_amount).toLocaleString()}` : 'Pending Selection'}
                          </p>
                          <p className={`text-[10px] uppercase font-bold ${t.status === 'closed' ? 'text-orange-600' : 'text-amber-600'}`}>
                            {t.status === 'closed' ? 'Ordered' : 'Awaiting Bids'}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/tender/${t.id}/bids`)}>Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R{totalBudget.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Allocated at project start</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Actual Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">R{actualSpend.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">Based on approved quotes & tasks</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Remaining</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">R{(totalBudget - actualSpend).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mt-1">{(100 - (actualSpend / totalBudget * 100)).toFixed(1)}% of budget left</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Spend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-end gap-2 justify-around border-b pb-1">
                <div className="w-full bg-orange-300 rounded-t" style={{ height: '80%' }}></div>
                <div className="w-full bg-orange-500 rounded-t" style={{ height: `${(actualSpend / totalBudget) * 100}%` }}></div>
              </div>
              <div className="flex justify-around mt-2 text-xs font-medium text-muted-foreground">
                <span>Budget</span>
                <span>Actual</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Integrated Project Timeline</CardTitle>
              <CardDescription>Gantt-style view of all project tasks and material deliveries</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="min-w-[800px] py-4">
                {project?.tasks?.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No tasks to display in timeline.</div>
                ) : (
                  <div className="space-y-6">
                    {project.tasks.map(t => {
                      const start = t.start_date || t.startDate
                      const end = t.end_date || t.endDate
                      if (!start || !end) return null

                      const startDays = Math.floor((new Date(start) - new Date()) / (1000 * 60 * 60 * 24))
                      const duration = Math.floor((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1

                      return (
                        <div key={t.id} className="relative h-12">
                          <div className="absolute left-0 top-0 w-48 truncate text-sm font-medium">{t.title}</div>
                          <div className="ml-52 relative h-6 bg-gray-100 rounded-full group cursor-pointer hover:bg-gray-200 transition-colors">
                            <div
                              className={`absolute h-full rounded-full ${t.status === 'done' ? 'bg-orange-500' : 'bg-orange-200 shadow-sm'}`}
                              style={{
                                left: `${Math.max(0, startDays * 2)}%`,
                                width: `${Math.max(5, duration * 2)}%`
                              }}
                            >
                              <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md z-10 whitespace-nowrap">
                                {new Date(start).toLocaleDateString()} - {new Date(end).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  )
}

export default ProjectsArea
