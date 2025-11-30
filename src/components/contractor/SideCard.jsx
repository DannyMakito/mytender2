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
    const { total, completed } = stats
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }, [stats])

  return (
    <div className="px-4">
      <Card className="p-4 rounded-lg border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">PROJECT</CardTitle>
              {/* render icon for selected project */}
              <div className="text-muted-foreground">
                {(() => {
                  const iconKey = project.icon || 'FiFolder'
                  const map = { FiFolder, FiBriefcase, FiCamera, FiCheckSquare, FiStar, FiFlag, FiDatabase, FiTarget }
                  const Icon = map[iconKey] || FiFolder
                  return <Icon size={16} />
                })()}
              </div>
            </div>
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-md border px-2 py-1 text-sm flex items-center gap-2">
                    <span className="text-sm">{project.name}</span>
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-green-600 w-6 h-6 text-white text-xs">{project.tasks?.length || 0}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent className="w-64 p-2">
                    <div className="p-2">
                      <input type="search" placeholder="Search a project..." className="w-full rounded-md border px-3 py-2 text-sm" onChange={() => {}} />
                    </div>
                    <div className="divide-y">
                      {projects.map((p) => {
                        const Icon = { FiFolder, FiBriefcase, FiCamera, FiCheckSquare, FiStar, FiFlag, FiDatabase, FiTarget }[p.icon] || FiFolder
                        return (
                          <DropdownMenuItem key={p.id} onClick={() => setSelectedProjectId?.(p.id)} className="flex items-center gap-3 px-3 py-2">
                            <div className="inline-flex items-center justify-center rounded-md bg-muted w-9 h-9">
                              <Icon />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{p.name}</div>
                              <div className="text-xs text-muted-foreground">{p.tasks?.length || 0} Tasks</div>
                            </div>
                            {selectedProjectId === p.id ? <CheckIcon className="size-4 text-green-600" /> : null}
                          </DropdownMenuItem>
                        )
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-4">
            <div style={{ width: 120, height: 120 }}>
              <CircularProgressbar value={percent} text={`${percent}%`} styles={buildStyles({ textSize: '18px', pathColor: '#10B981', textColor: '#10B981', trailColor: '#E6EAEA' })} />
            </div>
            <div className="w-full">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-md p-3 text-sm">
                  <div className="text-xs text-muted-foreground">TOTAL</div>
                  <div className="font-semibold">{stats.total}</div>
                </div>
                <div className="bg-muted/50 rounded-md p-3 text-sm">
                  <div className="text-xs text-muted-foreground">IN PROGRESS</div>
                  <div className="font-semibold">{stats.inProgress}</div>
                </div>
            
                <div className="bg-muted/50 rounded-md p-3 text-sm">
                  <div className="text-xs text-muted-foreground">COMPLETED</div>
                  <div className="font-semibold">{stats.completed}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
