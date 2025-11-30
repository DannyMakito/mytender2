import React, { useMemo, useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import ProjectsArea from './ProjectsArea'
import SideCard from './SideCard'
import supabase from '../../../supabase-client.js'
import { useAuth } from '@/context/AuthContext'

const Projects = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch projects and tasks from Supabase
  useEffect(() => {
    if (user?.email) {
      fetchProjects()
    }
  }, [user?.email])

  async function fetchProjects() {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch projects where user is owner or winner
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (projectsError) throw projectsError
      
      // Fetch tasks for each project
      if (projectsData && projectsData.length > 0) {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .in('project_id', projectsData.map(p => p.id))
          .order('created_at', { ascending: false })
        
        if (tasksError) throw tasksError
        
        // Combine projects with their tasks
        const projectsWithTasks = projectsData.map(project => ({
          ...project,
          tasks: (tasksData || []).filter(task => task.project_id === project.id)
        }))
        
        setProjects(projectsWithTasks)
        
        // Set first project as selected if none selected
        if (!selectedProjectId && projectsWithTasks.length > 0) {
          setSelectedProjectId(projectsWithTasks[0].id)
        }
      } else {
        setProjects([])
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err?.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const selectedProject = useMemo(() => projects.find((p) => p.id === selectedProjectId), [projects, selectedProjectId])

  async function addTask(projectId, task) {
    try {
      // Insert task into Supabase
      const taskData = {
        project_id: projectId,
        title: task.title,
        description: task.description || task.desc || '',
        status: task.status || 'todo',
        priority_color: task.priorityColor || task.priority_color || '',
        start_date: task.startDate || task.start_date || null,
        end_date: task.endDate || task.end_date || null,
      }
      
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single()
      
      if (error) throw error
      
      // Update local state
      setProjects((prev) => prev.map((p) => 
        p.id === projectId 
          ? { ...p, tasks: [{ ...taskData, id: data.id }, ...p.tasks] }
          : p
      ))
    } catch (err) {
      console.error('Error adding task:', err)
      alert('Failed to add task: ' + (err?.message || 'Unknown error'))
    }
  }

  async function updateTask(projectId, updatedTask) {
    try {
      // Update task in Supabase
      const taskData = {
        title: updatedTask.title,
        description: updatedTask.description || updatedTask.desc || '',
        status: updatedTask.status || updatedTask.status,
        priority_color: updatedTask.priorityColor || updatedTask.priority_color || '',
        start_date: updatedTask.startDate || updatedTask.start_date || null,
        end_date: updatedTask.endDate || updatedTask.end_date || null,
      }
      
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', updatedTask.id)
      
      if (error) throw error
      
      // Update local state
      setProjects((prev) => prev.map((p) => {
        if (p.id !== projectId) return p
        return { 
          ...p, 
          tasks: p.tasks.map((t) => 
            t.id === updatedTask.id 
              ? { ...updatedTask, ...taskData, priorityColor: taskData.priority_color }
              : t
          )
        }
      }))
    } catch (err) {
      console.error('Error updating task:', err)
      alert('Failed to update task: ' + (err?.message || 'Unknown error'))
    }
  }

  async function addProject(project) {
    // Note: Projects are automatically created when bids are approved
    // This function is kept for compatibility but won't create projects in Supabase
    // You might want to remove the "Create Project" button from UI
    console.warn('Projects are automatically created when bids are approved. Manual project creation is not supported.')
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-muted-foreground'>Loading projects...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-red-600'>Error: {error}</div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <div className='text-muted-foreground mb-2'>No projects found</div>
          <div className='text-sm text-muted-foreground'>
            Projects are automatically created when a bid is approved on your tender.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className='grid grid-cols-[3fr_1fr] px-6 mt-8 poppins gap-4'>
        <ProjectsArea 
          project={selectedProject} 
          addTask={addTask} 
          updateTask={updateTask} 
          addProject={addProject} 
          projects={projects} 
          selectedProjectId={selectedProjectId}
          onRefresh={fetchProjects}
        />
        <SideCard 
          projects={projects} 
          selectedProjectId={selectedProjectId} 
          setSelectedProjectId={setSelectedProjectId} 
        />
      </div>
    </div>
  ) 
}

export default Projects
