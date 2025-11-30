import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '@/context/AuthContext'

const columns = [
  { id: 'todo', title: 'Yet To Start' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Completed' },
]

const ProjectsArea = ({ project, addTask, updateTask, addProject, projects, selectedProjectId }) => {
  const { role } = useAuth()
  const isClient = role === 'client'
  const isPro = role === 'pro'
  
  const [sheetOpen, setSheetOpen] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskStartDate, setTaskStartDate] = useState('')
  const [taskEndDate, setTaskEndDate] = useState('')  
  const [taskColumn, setTaskColumn] = useState('todo')
  const [taskProjectId, setTaskProjectId] = useState(selectedProjectId || (project && project.id) || (projects && projects[0] && projects[0].id) || '')
  const [taskPriorityColor, setTaskPriorityColor] = useState('blue')

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
      endDate: taskEndDate || null 
    }
    
    // call addTask with projectId and task
    const targetProjectId = taskProjectId || (project && project.id)
    await addTask?.(targetProjectId, newTask)
    
    setTaskTitle('')
    setTaskDesc('')
    setTaskStartDate('')
    setTaskEndDate('')
    setTaskPriorityColor('')
    setTaskColumn('todo')
    setSheetOpen(false)
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
    const overId = over.id // will be column id like 'todo', 'inprogress', 'done' or a task id depending on structure
    // determine target status: if dropped on a column, that's the status; if dropped on a task, use that task's status
    let targetStatus = null
    if (['todo', 'inprogress', 'done'].includes(overId)) {
      targetStatus = overId
    } else {
      // overId may be a task id; find that task to get its current status
      const targetTask = project && (project.tasks || []).find((t) => t.id === overId)
      if (targetTask) targetStatus = targetTask.status
    }

    if (!targetStatus) return

    const task = project && (project.tasks || []).find((t) => t.id === activeId)
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

  // Droppable column wrapper so columns accept drops and produce a column id as `over.id`
  // Columns are still droppable even for clients (visual only, drag is disabled)
  function Column({ col, children }) {
    const { setNodeRef, isOver } = useDroppable({ 
      id: col.id,
      disabled: isClient // Disable drop zones for client role
    })
    return (
      <div ref={setNodeRef} id={col.id} className={`bg-card rounded-lg border p-4 min-h-[300px] ${isOver && !isClient ? 'ring-2 ring-offset-1 ring-green-200' : ''}`}>
        {children}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects</h2>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">A↕ Sort</div>
          {/* Note: Projects are automatically created when bids are approved */}
          {/* Only show "Add New Task" button for 'pro' role */}
          {isPro && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => setSheetOpen(true)}>Add New Task</Button>
              </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-3/4 sm:max-w-sm">
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
                
                    <option value="blue">low</option>
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
                
                <SheetFooter>
                  <div className="flex gap-2"><Button type="submit" className="w-full">Create Task</Button></div>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
          )}
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {columns.map((col) => (
          <Column key={col.id} col={col}>
            <div className="flex items-center justify-between mb-4">
              <div className="px-3 py-2 rounded-md bg-muted text-sm">{col.title}</div>
              <div className="text-sm rounded-full bg-green-50 px-2 py-1 text-green-700">{grouped[col.id].length}</div>
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
                    blue: { cls: 'bg-blue-100 text-blue-800', label: 'Low' },
                  }
                  const badge = badgeMap[priorityColor] || { cls: 'bg-gray-100 text-gray-800', label: 'None' }
                  const startDate = t.startDate || t.start_date
                  const endDate = t.endDate || t.end_date

                  // make each card draggable via useSortable (only for 'pro' role)
                  function DraggableCard({ task }) {
                    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
                      id: task.id,
                      disabled: isClient // Disable drag for client role
                    })
                    const style = {
                      transform: CSS.Transform.toString(transform),
                      transition,
                      opacity: isDragging ? 0.8 : 1,
                      cursor: isClient ? 'default' : 'grab',
                    }
                    // Only apply drag listeners for 'pro' role
                    const dragProps = isClient ? {} : { ...attributes, ...listeners }
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
                            <button className="text-muted-foreground text-sm">⋯</button>
                          </div>
                          <CardHeader className="pt-10 px-4">
                            <CardTitle className="text-sm font-semibold">{task.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 pb-4 text-sm text-muted-foreground">
                            <div>{task.description || task.desc || 'No description.'}</div>
                            {(startDate || endDate) && (
                              <div className="text-sm bg-red-100 text-black px-2 py-1 rounded mt-2">
                                {startDate 
                                  ? new Date(startDate).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                    })
                                  : 'No start date'}{" "}
                                -{" "}
                                {endDate 
                                  ? new Date(endDate).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                    })
                                  : 'No end date'}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )
                  }

                  return <DraggableCard key={t.id} task={{ ...t, priorityColor, startDate, endDate }} />
                })}
                </SortableContext>
              )}
            </div>
          </Column>
        ))}
      </div>
      </DndContext>
    </div>
  )
}

export default ProjectsArea
