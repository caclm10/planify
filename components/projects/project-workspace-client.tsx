"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MoreHorizontal, Plus, Calendar, File as FileIcon, Link as LinkIcon, Download, ExternalLink, Settings, Trash2, X } from "lucide-react";
import { format } from "date-fns";

export function ProjectWorkspaceClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Task state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState("todo");
  const [newTaskMilestone, setNewTaskMilestone] = useState("none");
  const [newTaskAssignee, setNewTaskAssignee] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Milestone state
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

  // Resource state
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceType, setNewResourceType] = useState("link");
  const [newResourceLink, setNewResourceLink] = useState("");
  const [newResourceFile, setNewResourceFile] = useState<File | null>(null);
  const [isSubmittingResource, setIsSubmittingResource] = useState(false);

  // Settings state
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDesc, setEditProjectDesc] = useState("");
  const [editProjectDate, setEditProjectDate] = useState("");
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Edit Task state
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDesc, setEditTaskDesc] = useState("");
  const [editTaskStatus, setEditTaskStatus] = useState("todo");
  const [editTaskMilestone, setEditTaskMilestone] = useState("none");
  const [editTaskAssignee, setEditTaskAssignee] = useState("none");
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  useEffect(() => {
    if (project) {
      setEditProjectName(project.name || "");
      setEditProjectDesc(project.description || "");
      setEditProjectDate(project.target_end_date ? project.target_end_date.substring(0, 10) : "");
    }
  }, [project]);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push("/login");
      return;
    }
    setUser(pb.authStore.model);
    loadProjectData();

    pb.collection('tasks').subscribe('*', () => loadTasks());
    pb.collection('milestones').subscribe('*', () => loadMilestones());
    pb.collection('resources').subscribe('*', () => loadResources());

    return () => {
      pb.collection('tasks').unsubscribe('*');
      pb.collection('milestones').unsubscribe('*');
      pb.collection('resources').unsubscribe('*');
    };
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const proj = await pb.collection('projects').getOne(projectId, { expand: 'members' });
      setProject(proj);
      await Promise.all([loadTasks(), loadMilestones(), loadResources()]);
    } catch (err) {
      toast.error("Failed to load project details");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    const records = await pb.collection('tasks').getFullList({
      filter: `project_id = "${projectId}"`,
      expand: 'assignee_id,milestone_id',
      sort: 'order,-created'
    });
    setTasks(records);
  };

  const loadMilestones = async () => {
    const records = await pb.collection('milestones').getFullList({
      filter: `project_id = "${projectId}"`,
      sort: 'due_date'
    });
    setMilestones(records);
  };

  const loadResources = async () => {
    const records = await pb.collection('resources').getFullList({
      filter: `project_id = "${projectId}"`,
      expand: 'uploaded_by',
      sort: '-created'
    });
    setResources(records);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const colTasks = tasks.filter(t => t.status === newStatus);
      const maxOrder = colTasks.length > 0 ? Math.max(...colTasks.map(t => t.order || 0)) : 0;
      await pb.collection('tasks').update(taskId, { status: newStatus, order: maxOrder + 1 });
      toast.success("Task updated");
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string, dropIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const draggedTaskId = e.dataTransfer.getData("taskId");
    if (!draggedTaskId) return;

    const sourceTask = tasks.find(t => t.id === draggedTaskId);
    if (!sourceTask) return;

    let targetColTasks = tasks.filter(t => t.status === targetStatus && t.id !== draggedTaskId);
    targetColTasks.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (dropIndex !== undefined) {
      targetColTasks.splice(dropIndex, 0, sourceTask);
    } else {
      targetColTasks.push(sourceTask);
    }

    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: targetStatus } : t));

    try {
      await Promise.all(targetColTasks.map((t, index) => {
        return pb.collection('tasks').update(t.id, { 
          status: targetStatus, 
          order: index 
        });
      }));
    } catch (err) {
      toast.error("Failed to reorder tasks");
      loadTasks();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const colTasks = tasks.filter(t => t.status === newTaskStatus);
      const maxOrder = colTasks.length > 0 ? Math.max(...colTasks.map(t => t.order || 0)) : 0;
      await pb.collection('tasks').create({
        project_id: projectId,
        title: newTaskTitle,
        description: newTaskDesc,
        status: newTaskStatus,
        order: maxOrder + 1,
        milestone_id: newTaskMilestone !== "none" ? newTaskMilestone : null,
        assignee_id: newTaskAssignee !== "none" ? newTaskAssignee : null
      });
      toast.success("Task created");
      setIsTaskDialogOpen(false);
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskAssignee("none");
    } catch (err) {
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditTaskDialog = (task: any) => {
    setEditingTask(task);
    setEditTaskTitle(task.title || "");
    setEditTaskDesc(task.description || "");
    setEditTaskStatus(task.status || "todo");
    setEditTaskMilestone(task.milestone_id || "none");
    setEditTaskAssignee(task.assignee_id || "none");
    setIsEditTaskDialogOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsUpdatingTask(true);
    try {
      await pb.collection('tasks').update(editingTask.id, {
        title: editTaskTitle,
        description: editTaskDesc,
        status: editTaskStatus,
        milestone_id: editTaskMilestone !== "none" ? editTaskMilestone : null,
        assignee_id: editTaskAssignee !== "none" ? editTaskAssignee : null
      });
      toast.success("Task updated");
      setIsEditTaskDialogOpen(false);
      setEditingTask(null);
    } catch (err) {
      toast.error("Failed to update task");
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await pb.collection('tasks').delete(taskId);
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      const users = await pb.collection('users').getList(1, 1, { filter: `email="${inviteEmail}"` });
      if (users.items.length === 0) throw new Error("User not found");
      const userId = users.items[0].id;
      
      const currentMembers = project.members || [];
      if (currentMembers.includes(userId)) throw new Error("User is already a member");
      
      await pb.collection('projects').update(projectId, { "members+": userId });
      toast.success("Member invited successfully!");
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      loadProjectData(); // refresh
    } catch (err: any) {
      toast.error(err.message || "Failed to invite member");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMilestone(true);
    try {
      await pb.collection('milestones').create({
        project_id: projectId,
        title: newMilestoneTitle,
        due_date: newMilestoneDate ? new Date(newMilestoneDate).toISOString() : null,
        is_completed: false
      });
      toast.success("Milestone created");
      setIsMilestoneDialogOpen(false);
      setNewMilestoneTitle("");
      setNewMilestoneDate("");
    } catch (err) {
      toast.error("Failed to create milestone");
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingResource(true);
    try {
      const formData = new FormData();
      formData.append('project_id', projectId);
      formData.append('name', newResourceName);
      formData.append('type', newResourceType);
      formData.append('uploaded_by', user.id);
      
      if (newResourceType === 'link') {
        formData.append('link_url', newResourceLink);
      } else if (newResourceType === 'file' && newResourceFile) {
        formData.append('file_attachment', newResourceFile);
      } else {
        throw new Error("Please provide a file or link");
      }

      await pb.collection('resources').create(formData);
      toast.success("Resource added");
      setIsResourceDialogOpen(false);
      setNewResourceName("");
      setNewResourceLink("");
      setNewResourceFile(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to add resource");
    } finally {
      setIsSubmittingResource(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProject(true);
    try {
      await pb.collection('projects').update(projectId, {
        name: editProjectName,
        description: editProjectDesc,
        target_end_date: editProjectDate ? new Date(editProjectDate).toISOString() : null
      });
      toast.success("Project updated successfully");
      setIsSettingsDialogOpen(false);
      loadProjectData();
    } catch (err) {
      toast.error("Failed to update project");
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    setIsDeletingProject(true);
    try {
      await pb.collection('projects').delete(projectId);
      toast.success("Project deleted");
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to delete project");
      setIsDeletingProject(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (project.members.length <= 1) {
      toast.error("Project must have at least one member");
      return;
    }
    try {
      await pb.collection('projects').update(projectId, { "members-": memberId });
      toast.success("Member removed");
      loadProjectData();
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  if (isLoading || !project) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  const columns = [
    { id: "todo", label: "To Do", bg: "bg-zinc-100 dark:bg-zinc-900", border: "border-zinc-200 dark:border-zinc-800" },
    { id: "in_progress", label: "In Progress", bg: "bg-blue-50/50 dark:bg-blue-950/20", border: "border-blue-100 dark:border-blue-900/50" },
    { id: "done", label: "Done", bg: "bg-green-50/50 dark:bg-green-950/20", border: "border-green-100 dark:border-green-900/50" }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-30">
        <div className="flex h-16 items-center px-4 md:px-8 max-w-[1600px] mx-auto w-full gap-4">
          <Button variant="ghost" size="icon" asChild className="-ml-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <h1 className="font-semibold text-lg leading-tight truncate">{project.name}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block truncate">{project.description}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex -space-x-2">
              {project.expand?.members?.map((m: any) => (
                <Avatar key={m.id} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="bg-primary/20 text-xs text-primary">
                    {m.name?.charAt(0) || m.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Plus className="mr-2 h-4 w-4" /> Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleInviteMember}>
                  <DialogHeader>
                     <DialogTitle>Invite Member</DialogTitle>
                     <DialogDescription>Enter the email address of the user you want to invite.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label>User Email</Label>
                      <Input type="email" required placeholder="user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Invite User
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Project Settings</DialogTitle>
                  <DialogDescription>Manage project details and members.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                  {/* Details form */}
                  <form onSubmit={handleUpdateProject} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input required value={editProjectName} onChange={e => setEditProjectName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={editProjectDesc} onChange={e => setEditProjectDesc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Date</Label>
                      <Input type="date" value={editProjectDate} onChange={e => setEditProjectDate(e.target.value)} />
                    </div>
                    <Button type="submit" disabled={isUpdatingProject} className="w-full">
                      {isUpdatingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </form>
                  
                  <div className="h-px bg-border" />
                  
                  {/* Members list */}
                  <div className="space-y-3">
                    <Label>Project Members</Label>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                      {project?.expand?.members?.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {m.name?.charAt(0) || m.email?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{m.name || m.email}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMember(m.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="h-px bg-border" />
                  
                  {/* Danger Zone */}
                  <div className="space-y-3">
                    <Label className="text-destructive">Danger Zone</Label>
                    <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-md flex items-center justify-between">
                      <div className="text-sm">
                        <p className="font-medium text-destructive">Delete Project</p>
                        <p className="text-muted-foreground text-xs mt-0.5">This action cannot be undone.</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={handleDeleteProject} disabled={isDeletingProject}>
                        {isDeletingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
        <Tabs defaultValue="kanban" className="w-full h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-muted/50 p-1 h-auto">
              <TabsTrigger value="kanban" className="px-6 py-2.5 rounded-md data-[state=active]:shadow-sm">Kanban Board</TabsTrigger>
              <TabsTrigger value="milestones" className="px-6 py-2.5 rounded-md data-[state=active]:shadow-sm">Milestones</TabsTrigger>
              <TabsTrigger value="resources" className="px-6 py-2.5 rounded-md data-[state=active]:shadow-sm">Resources</TabsTrigger>
            </TabsList>

            {/* Contextual Actions */}
            <div>
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreateTask}>
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                      <DialogDescription className="sr-only">Fill out the form below to add a new task.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input required value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={newTaskStatus} onValueChange={setNewTaskStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Milestone</Label>
                          <Select value={newTaskMilestone} onValueChange={setNewTaskMilestone}>
                            <SelectTrigger>
                              <SelectValue placeholder="No milestone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {milestones.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Assignee</Label>
                          <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {project?.expand?.members?.map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Task
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
                <DialogContent>
                  <form onSubmit={handleUpdateTask}>
                    <DialogHeader>
                      <DialogTitle>Edit Task</DialogTitle>
                      <DialogDescription className="sr-only">Modify task details below.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input required value={editTaskTitle} onChange={e => setEditTaskTitle(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input value={editTaskDesc} onChange={e => setEditTaskDesc(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={editTaskStatus} onValueChange={setEditTaskStatus}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Milestone</Label>
                          <Select value={editTaskMilestone} onValueChange={setEditTaskMilestone}>
                            <SelectTrigger><SelectValue placeholder="No milestone" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {milestones.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Assignee</Label>
                          <Select value={editTaskAssignee} onValueChange={setEditTaskAssignee}>
                            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {project?.expand?.members?.map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isUpdatingTask}>
                        {isUpdatingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="kanban" className="flex-1 mt-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
              {columns.map(col => (
                <div 
                  key={col.id} 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`rounded-xl border ${col.border} ${col.bg} p-4 flex flex-col min-h-[500px]`}
                >
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-semibold">{col.label}</h3>
                    <Badge variant="secondary" className="font-mono bg-background/50">
                      {tasks.filter(t => t.status === col.id).length}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {tasks.filter(t => t.status === col.id).sort((a, b) => (a.order || 0) - (b.order || 0)).map((task, index) => (
                      <Card 
                        key={task.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id, index)}
                        className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group border-border/50 bg-background/80 backdrop-blur-sm"
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex justify-between items-start gap-2">
                            <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditTaskDialog(task)}>Edit Task...</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'todo')}>Move to To Do</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'in_progress')}>Move to In Progress</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'done')}>Move to Done</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDeleteTask(task.id)}>Delete Task</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {task.description && (
                            <CardDescription className="text-xs line-clamp-2 mt-1">
                              {task.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center justify-between mt-2">
                            {task.expand?.milestone_id ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-primary bg-primary/5">
                                {task.expand.milestone_id.title}
                              </Badge>
                            ) : <div />}
                            
                            {task.expand?.assignee_id && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                                  {task.expand.assignee_id.name?.charAt(0) || task.expand.assignee_id.email?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {tasks.filter(t => t.status === col.id).length === 0 && (
                      <div className="h-24 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-sm text-muted-foreground/50">
                        Drop items here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Project Milestones</CardTitle>
                    <CardDescription>Track big phases and deadlines</CardDescription>
                  </div>
                  <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> New Milestone</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleCreateMilestone}>
                        <DialogHeader>
                          <DialogTitle>Create Milestone</DialogTitle>
                          <DialogDescription className="sr-only">Set a new milestone with a target date.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Milestone Title</Label>
                            <Input required placeholder="e.g. Beta Release" value={newMilestoneTitle} onChange={e => setNewMilestoneTitle(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Target Date (Optional)</Label>
                            <Input type="date" value={newMilestoneDate} onChange={e => setNewMilestoneDate(e.target.value)} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isSubmittingMilestone}>
                            {isSubmittingMilestone && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Milestone
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {milestones.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No milestones defined yet.</p>
                ) : (
                  milestones.map(m => {
                    const mTasks = tasks.filter(t => t.milestone_id === m.id);
                    const doneTasks = mTasks.filter(t => t.status === 'done');
                    const progress = mTasks.length ? Math.round((doneTasks.length / mTasks.length) * 100) : 0;
                    
                    return (
                      <div key={m.id} className="space-y-2 border rounded-lg p-5 bg-card/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{m.title}</h3>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Calendar className="mr-1.5 h-3.5 w-3.5" />
                              {m.due_date ? format(new Date(m.due_date), 'PPP') : 'No due date'}
                            </div>
                          </div>
                          <Badge variant={progress === 100 ? "default" : "secondary"} className={progress === 100 ? "bg-green-500 hover:bg-green-600" : ""}>
                            {progress}% Complete
                          </Badge>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mt-4">
                          <div 
                            className={`h-full transition-all duration-500 ease-in-out ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-right mt-1">
                          {doneTasks.length} of {mTasks.length} tasks completed
                        </p>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="mt-0">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Resource Drive</CardTitle>
                    <CardDescription>Files and external links for this project</CardDescription>
                  </div>
                  <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Resource</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleCreateResource}>
                        <DialogHeader>
                          <DialogTitle>Add Resource</DialogTitle>
                          <DialogDescription className="sr-only">Upload a file or add an external link.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Resource Name</Label>
                            <Input required placeholder="e.g. Figma UI Mockup" value={newResourceName} onChange={e => setNewResourceName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={newResourceType} onValueChange={setNewResourceType}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="link">External Link</SelectItem>
                                <SelectItem value="file">File Upload</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {newResourceType === 'link' ? (
                            <div className="space-y-2">
                              <Label>URL</Label>
                              <Input key="link-input" type="url" required placeholder="https://..." value={newResourceLink} onChange={e => setNewResourceLink(e.target.value)} />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label>File</Label>
                              <Input key="file-input" type="file" required onChange={e => setNewResourceFile(e.target.files?.[0] || null)} className="cursor-pointer file:text-primary file:bg-primary/10 file:border-0 file:rounded-md file:px-4 file:py-1 hover:file:bg-primary/20 transition-colors" />
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isSubmittingResource}>
                            {isSubmittingResource && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload Resource
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {resources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-card/30">
                    <FileIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="font-medium text-muted-foreground">No resources uploaded yet</h3>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {resources.map(res => (
                      <div key={res.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${res.type === 'file' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'}`}>
                            {res.type === 'file' ? <FileIcon className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
                          </div>
                          <div>
                            <h4 className="font-medium">{res.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Added by {res.expand?.uploaded_by?.name || 'User'} on {format(new Date(res.created), 'MMM d')}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          {res.type === 'file' ? (
                            <a href={pb.files.getURL(res, res.file_attachment)} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          ) : (
                            <a href={res.link_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
