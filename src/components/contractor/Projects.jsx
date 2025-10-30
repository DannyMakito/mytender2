import React, { useMemo, useState } from 'react'
import { Input } from "@/components/ui/input"
import ProjectsArea from './ProjectsArea'
import SideCard from './SideCard'

const sampleProjects = [
  {
    id: 'p1',
    name: 'new',
    icon: 'FiFolder',
    tasks: [
      { id: 't1', title: 'Task A', status: 'todo' },
      { id: 't2', title: 'Task B', status: 'inprogress' },
      { id: 't3', title: 'Task C', status: 'done' },
    ],
  },
]

const Projects = () => {
  const [projects, setProjects] = useState(sampleProjects)
  const [selectedProjectId, setSelectedProjectId] = useState(sampleProjects[0].id)

  const selectedProject = useMemo(() => projects.find((p) => p.id === selectedProjectId), [projects, selectedProjectId])

  function addTask(projectId, task) {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, tasks: [task, ...p.tasks] } : p))
  }

  function updateTask(projectId, updatedTask) {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projectId) return p
      return { ...p, tasks: p.tasks.map((t) => t.id === updatedTask.id ? { ...t, ...updatedTask } : t) }
    }))
  }

  function addProject(project) {
    setProjects((prev) => [project, ...prev])
    setSelectedProjectId(project.id)
  }

  return (
    <div>

  

      <div className='grid grid-cols-[3fr_1fr] px-6 mt-8 poppins gap-4'>
  <ProjectsArea project={selectedProject} addTask={addTask} updateTask={updateTask} addProject={addProject} projects={projects} selectedProjectId={selectedProjectId} />
        <SideCard projects={projects} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} />
      </div>
    </div>
  ) 
}

export default Projects
