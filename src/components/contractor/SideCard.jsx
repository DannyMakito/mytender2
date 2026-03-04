import React, { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { FiFolder, FiBriefcase, FiCamera, FiCheckSquare, FiStar, FiFlag, FiDatabase, FiTarget } from 'react-icons/fi'
import { useState } from 'react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal } from '@/components/ui/dropdown-menu'
import { CheckIcon } from 'lucide-react'

export default function SideCard({ projects = [], selectedProjectId, setSelectedProjectId }) {
  const project = useMemo(() => {
    const found = projects.find((p) => p.id === selectedProjectId) || projects[0] || null
    return found ? { ...found, tasks: found.tasks || [] } : { name: '', tasks: [], icon: 'FiFolder' }
  }, [projects, selectedProjectId])

  const stats = useMemo(() => {
    const tasks = project.tasks || []
    const total = tasks.length
    const inProgress = tasks.filter((t) => t.status === 'inprogress').length
    const waiting = tasks.filter((t) => t.status === 'waiting').length
    const completed = tasks.filter((t) => t.status === 'done' || t.status === 'completed').length
    return { total, inProgress, waiting, completed }
  }, [project])

  const percent = useMemo(() => {
    const { total, completed, inProgress } = stats
    if (total === 0) return 0
    // Completed tasks count as 100%, in-progress tasks count as 30% progress
    const progressPoints = completed + (inProgress * 0.3)
    return Math.round((progressPoints / total) * 100)
  }, [stats])

  return (
    <div className="w-full">
      <Card className="rounded-xl border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                {(() => {
                  const iconKey = project.icon || 'FiFolder'
                  const map = { FiFolder, FiBriefcase, FiCamera, FiCheckSquare, FiStar, FiFlag, FiDatabase, FiTarget }
                  const Icon = map[iconKey] || FiFolder
                  return <Icon size={14} />
                })()}
              </div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Stats</CardTitle>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-background border rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors shadow-sm">
                  <span className="truncate max-w-[120px]">{project.name}</span>
                  <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground min-w-[20px] h-5 px-1 text-[10px] font-bold">
                    {project.tasks?.length || 0}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent className="w-64 p-2 shadow-xl border-2">
                  <div className="p-2">
                    <input type="search" placeholder="Quick find project..." className="w-full rounded-md border-muted px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" onChange={() => { }} />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-muted/50">
                    {projects.map((p) => {
                      const Icon = { FiFolder, FiBriefcase, FiCamera, FiCheckSquare, FiStar, FiFlag, FiDatabase, FiTarget }[p.icon] || FiFolder
                      return (
                        <DropdownMenuItem key={p.id} onClick={() => setSelectedProjectId?.(p.id)} className="flex items-center gap-3 px-3 py-3 cursor-pointer focus:bg-primary/5">
                          <div className="flex items-center justify-center rounded-lg bg-muted size-9 text-muted-foreground">
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{p.name}</div>
                            <div className="text-[11px] text-muted-foreground">{p.tasks?.length || 0} Total Tasks</div>
                          </div>
                          {selectedProjectId === p.id && (
                            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <CheckIcon className="size-3 text-primary" />
                            </div>
                          )}
                        </DropdownMenuItem>
                      )
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          <div className="flex flex-col items-center gap-8">
            <div className="relative" style={{ width: 140, height: 140 }}>
              <CircularProgressbar
                value={percent}
                text={`${percent}%`}
                styles={buildStyles({
                  textSize: '20px',
                  pathColor: '#f97316',
                  textColor: '#f97316',
                  trailColor: '#f1f5f9',
                  strokeLinecap: 'round'
                })}
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full border shadow-sm text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">
                Overall Progress
              </div>
            </div>

            <div className="w-full space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 hover:bg-muted/50 transition-colors rounded-xl p-4 border border-transparent hover:border-muted-foreground/10">
                  <div className="flex items-center gap-2 mb-1">
                    <FiDatabase className="size-3 text-orange-500" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Total</span>
                  </div>
                  <div className="text-xl font-bold">{stats.total}</div>
                </div>

                <div className="bg-muted/30 hover:bg-muted/50 transition-colors rounded-xl p-4 border border-transparent hover:border-muted-foreground/10">
                  <div className="flex items-center gap-2 mb-1">
                    <FiTarget className="size-3 text-orange-400" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Active</span>
                  </div>
                  <div className="text-xl font-bold text-orange-500">{stats.inProgress}</div>
                </div>

                <div className="bg-muted/30 hover:bg-muted/50 transition-colors rounded-xl p-4 border border-transparent hover:border-muted-foreground/10 col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <FiCheckSquare className="size-3 text-orange-600" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Completed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-orange-700">{stats.completed}</div>
                    <div className="text-[10px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                      {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
