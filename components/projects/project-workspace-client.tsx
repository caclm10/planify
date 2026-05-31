"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { pb } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MoreHorizontal, Plus, Calendar, File as FileIcon, Link as LinkIcon, Download, ExternalLink, Settings, Trash2, X, MessageSquare, Check, RotateCcw, Sun, Moon } from "lucide-react";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  closestCorners
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableTaskCardProps {
  task: any;
  openEditTaskDialog: (task: any) => void;
  updateTaskStatus: (taskId: string, newStatus: string) => void;
  handleDeleteTask: (taskId: string) => void;
}

function SortableTaskCard({ task, openEditTaskDialog, updateTaskStatus, handleDeleteTask }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none select-none">
      <Card 
        className="shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group border-border/50 bg-background/80 backdrop-blur-sm"
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 text-muted-foreground opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[100]">
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
    </div>
  );
}

interface DroppableColumnProps {
  col: any;
  children: React.ReactNode;
  taskCount: number;
}

function DroppableColumn({ col, children, taskCount }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: col.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`rounded-xl border ${col.border} ${col.bg} p-4 flex flex-col min-h-[500px] transition-colors duration-200 ${isOver ? 'ring-2 ring-primary/20 bg-muted/40' : ''}`}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-semibold">{col.label}</h3>
        <Badge variant="secondary" className="font-mono bg-background/50">
          {taskCount}
        </Badge>
      </div>
      
      <div className="flex flex-col gap-3 min-h-[300px]">
        {children}
      </div>
    </div>
  );
}

export function ProjectWorkspaceClient({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    setThemeMounted(true);
  }, []);
  const [tasks, setTasks] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMobileColumn, setActiveMobileColumn] = useState<string>("todo");

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

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketCategory, setNewTicketCategory] = useState("bug");
  const [newTicketPriority, setNewTicketPriority] = useState("medium");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [convertingTicket, setConvertingTicket] = useState<any>(null);

  // Ticket comments state
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const expandedTicketIdRef = useRef<string | null>(null);
  const [ticketComments, setTicketComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    expandedTicketIdRef.current = expandedTicketId;
  }, [expandedTicketId]);

  // Alert Dialog state
  const [alertDialogProps, setAlertDialogProps] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, description: string, onConfirm: () => void) => {
    setAlertDialogProps({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        setAlertDialogProps(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

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
    pb.collection('tickets').subscribe('*', (e: any) => {
      loadTickets();
      if (e.action === 'create') {
        if (e.record.reporter_id !== pb.authStore.model?.id) {
          toast(`📢 New Ticket: "${e.record.title}"`, {
            description: e.record.description,
          });
        }
      }
    });
    pb.collection('ticket_comments').subscribe('*', (e: any) => {
      if (expandedTicketIdRef.current) {
        loadTicketComments(expandedTicketIdRef.current);
      }
      if (e.action === 'create') {
        if (e.record.user_id !== pb.authStore.model?.id) {
          toast("💬 New comment added in discussion", {
            description: e.record.content,
          });
        }
      }
    });
    pb.collection('ticket_activities').subscribe('*', (e: any) => {
      if (expandedTicketIdRef.current) {
        loadTicketComments(expandedTicketIdRef.current);
      }
      if (e.action === 'create') {
        if (e.record.user_id !== pb.authStore.model?.id) {
          if (e.record.action === 'resolved') {
            toast(`✓ Ticket marked as resolved`);
          } else if (e.record.action === 'reopened') {
            toast(`⟳ Ticket reopened`);
          }
        }
      }
    });

    return () => {
      pb.collection('tasks').unsubscribe('*');
      pb.collection('milestones').unsubscribe('*');
      pb.collection('resources').unsubscribe('*');
      pb.collection('tickets').unsubscribe('*');
      pb.collection('ticket_comments').unsubscribe('*');
      pb.collection('ticket_activities').unsubscribe('*');
    };
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const proj = await pb.collection('projects').getOne(projectId, { expand: 'members' });
      setProject(proj);
      await Promise.all([loadTasks(), loadMilestones(), loadResources(), loadTickets()]);
    } catch (err) {
      toast.error("Failed to load project details");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const records = await pb.collection('tickets').getFullList({
        filter: `project_id = "${projectId}"`,
        expand: 'reporter_id,assignee_id,task_id',
        sort: '-created'
      });
      setTickets(records);
    } catch (err) {
      console.error("Failed to load tickets", err);
    }
  };

  const syncTicketStatus = async (taskId: string, taskStatus: string) => {
    try {
      const records = await pb.collection('tickets').getFullList({
        filter: `project_id = "${projectId}" && task_id = "${taskId}"`
      });
      if (records.length > 0) {
        const linkedTicket = records[0];
        const newTicketStatus = taskStatus === "done" ? "resolved" : "open";
        if (linkedTicket.status !== newTicketStatus) {
          await pb.collection('tickets').update(linkedTicket.id, { status: newTicketStatus });
          loadTickets();
        }
      }
    } catch (err) {
      console.error("Failed to sync ticket status:", err);
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
      await syncTicketStatus(taskId, newStatus);
      toast.success("Task updated");
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedTask = tasks.find(t => t.id === activeId);
    if (!draggedTask) return;

    // Check if dropped over a column directly
    const isOverColumn = columns.some(col => col.id === overId);
    
    if (isOverColumn) {
      const targetStatus = overId;
      if (draggedTask.status === targetStatus) return; // No change needed

      let targetColTasks = tasks.filter(t => t.status === targetStatus);
      targetColTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const maxOrder = targetColTasks.length > 0 ? Math.max(...targetColTasks.map(t => t.order || 0)) : 0;
      const updatedDraggedTask = { ...draggedTask, status: targetStatus, order: maxOrder + 1 };
      targetColTasks.push(updatedDraggedTask);

      // Optimistic state update
      setTasks(prev => prev.map(t => t.id === activeId ? updatedDraggedTask : t));

      try {
        await pb.collection('tasks').update(activeId, { 
          status: targetStatus, 
          order: maxOrder + 1
        });
        await syncTicketStatus(activeId, targetStatus);
      } catch (err) {
        toast.error("Failed to update task");
        loadTasks();
      }
      return;
    }

    // Dropped over another task
    const overTask = tasks.find(t => t.id === overId);
    if (!overTask) return;

    const targetStatus = overTask.status;
    const isSameColumn = draggedTask.status === targetStatus;

    let targetColTasks = tasks.filter(t => t.status === targetStatus && t.id !== activeId);
    targetColTasks.sort((a, b) => (a.order || 0) - (b.order || 0));

    const overIndex = targetColTasks.findIndex(t => t.id === overId);
    
    if (overIndex !== -1) {
      targetColTasks.splice(overIndex, 0, draggedTask);
    } else {
      targetColTasks.push(draggedTask);
    }

    // Optimistic state update
    setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: targetStatus } : t));

    try {
      await Promise.all(targetColTasks.map((t, index) => {
        return pb.collection('tasks').update(t.id, { 
          status: targetStatus, 
          order: index 
        });
      }));
      await syncTicketStatus(activeId, targetStatus);
    } catch (err) {
      toast.error("Failed to reorder tasks");
      loadTasks();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const colTasks = tasks.filter(t => t.status === newTaskStatus);
      const maxOrder = colTasks.length > 0 ? Math.max(...colTasks.map(t => t.order || 0)) : 0;
      const createdTask = await pb.collection('tasks').create({
        project_id: projectId,
        title: newTaskTitle,
        description: newTaskDesc,
        status: newTaskStatus,
        order: maxOrder + 1,
        milestone_id: newTaskMilestone !== "none" ? newTaskMilestone : null,
        assignee_id: newTaskAssignee !== "none" ? newTaskAssignee : null
      });

      // Link ticket to this task if converting
      if (convertingTicket) {
        await pb.collection('tickets').update(convertingTicket.id, {
          task_id: createdTask.id,
          status: newTaskStatus === "done" ? "resolved" : "open"
        });
        toast.success("Ticket successfully converted to task!");
        // Log activity
        await logTicketActivity(convertingTicket.id, "converted_to_task", createdTask.title);
        setConvertingTicket(null);
        loadTickets();
      } else {
        toast.success("Task created");
      }

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

  const logTicketActivity = async (ticketId: string, action: string, details?: string) => {
    try {
      await pb.collection('ticket_activities').create({
        ticket_id: ticketId,
        user_id: user.id,
        action: action,
        details: details || ""
      });
    } catch (err) {
      console.error("Failed to log activity", err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTicket(true);
    try {
      const createdTicket = await pb.collection('tickets').create({
        project_id: projectId,
        title: newTicketTitle,
        description: newTicketDesc,
        status: "open",
        priority: newTicketPriority,
        category: newTicketCategory,
        reporter_id: user.id
      });
      toast.success("Ticket submitted successfully!");
      setIsTicketDialogOpen(false);
      setNewTicketTitle("");
      setNewTicketDesc("");
      setNewTicketCategory("bug");
      setNewTicketPriority("medium");
      loadTickets();
      // Log activity
      await logTicketActivity(createdTicket.id, "created", newTicketTitle);
    } catch (err) {
      toast.error("Failed to submit ticket");
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    triggerConfirm(
      "Are you sure you want to delete this ticket?",
      "This action cannot be undone. This will permanently delete the support ticket and remove its backlog status.",
      async () => {
        try {
          await pb.collection('tickets').delete(ticketId);
          toast.success("Ticket deleted");
          loadTickets();
        } catch (err) {
          toast.error("Failed to delete ticket");
        }
      }
    );
  };

  const handleConvertTicketToTask = (ticket: any) => {
    setConvertingTicket(ticket);
    const categoryLabel = {
      bug: "BUG",
      feature_request: "FEATURE",
      refactor: "REFACTOR",
      support: "SUPPORT"
    }[ticket.category as string] || "TICKET";

    setNewTaskTitle(`[${categoryLabel}] ${ticket.title}`);
    setNewTaskDesc(`Ticket Description:\n${ticket.description}\n\nSubmitted by ${ticket.expand?.reporter_id?.name || ticket.expand?.reporter_id?.email || 'User'}`);
    setNewTaskStatus("todo");
    setIsTaskDialogOpen(true);
  };

  const loadTicketComments = async (ticketId: string) => {
    try {
      const comments = await pb.collection('ticket_comments').getFullList({
        filter: `ticket_id = "${ticketId}"`,
        expand: 'user_id',
        sort: 'created'
      });

      let activities: any[] = [];
      try {
        activities = await pb.collection('ticket_activities').getFullList({
          filter: `ticket_id = "${ticketId}"`,
          expand: 'user_id',
          sort: 'created'
        });
      } catch (e) {
        console.error("Failed to load activities", e);
      }

      const commentsWithMarker = comments.map(c => ({ ...c, timelineType: 'comment' }));
      const activitiesWithMarker = activities.map(a => ({ ...a, timelineType: 'activity' }));

      const mergedTimeline = [...commentsWithMarker, ...activitiesWithMarker].sort((x, y) => {
        return new Date(x.created).getTime() - new Date(y.created).getTime();
      });

      setTicketComments(mergedTimeline);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  const handleCreateComment = async (e: React.FormEvent, ticketId: string) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      await pb.collection('ticket_comments').create({
        ticket_id: ticketId,
        user_id: user.id,
        content: newCommentText
      });
      const commentContent = newCommentText;
      setNewCommentText("");
      loadTicketComments(ticketId);
      // Log activity
      await logTicketActivity(ticketId, "commented", commentContent);
    } catch (err) {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
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
      await syncTicketStatus(editingTask.id, editTaskStatus);
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
    triggerConfirm(
      "Are you sure you want to delete this task?",
      "This action cannot be undone. This will permanently delete the task from the Kanban board.",
      async () => {
        try {
          await pb.collection('tasks').delete(taskId);
          toast.success("Task deleted");
        } catch (err) {
          toast.error("Failed to delete task");
        }
      }
    );
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

  const handleDeleteResource = async (resourceId: string) => {
    triggerConfirm(
      "Are you sure you want to delete this resource?",
      "This action cannot be undone. This will permanently delete the resource from the workspace.",
      async () => {
        try {
          await pb.collection('resources').delete(resourceId);
          toast.success("Resource deleted");
          loadResources();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete resource");
        }
      }
    );
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
    triggerConfirm(
      "Are you sure you want to delete this project?",
      "This action cannot be undone. This will permanently delete the project workspace, all tasks, milestones, and resource attachments.",
      async () => {
        setIsDeletingProject(true);
        try {
          await pb.collection('projects').delete(projectId);
          toast.success("Project deleted");
          router.push("/dashboard");
        } catch (err) {
          toast.error("Failed to delete project");
          setIsDeletingProject(false);
        }
      }
    );
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
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {themeMounted && resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

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
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
            <TabsList className="bg-muted/50 p-1 h-auto flex w-full sm:w-auto">
              <TabsTrigger value="kanban" className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-md data-[state=active]:shadow-sm">Kanban Board</TabsTrigger>
              <TabsTrigger value="milestones" className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-md data-[state=active]:shadow-sm">Milestones</TabsTrigger>
              <TabsTrigger value="tickets" className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-md data-[state=active]:shadow-sm gap-1.5 flex items-center justify-center">
                Tickets
                {tickets.filter((t: any) => t.status === 'open').length > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-100 bg-red-600 rounded-full animate-pulse">
                    {tickets.filter((t: any) => t.status === 'open').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm rounded-md data-[state=active]:shadow-sm">Resources</TabsTrigger>
            </TabsList>

            {/* Contextual Actions */}
            <div className="flex gap-2">
              <Dialog open={isTaskDialogOpen} onOpenChange={(open) => {
                setIsTaskDialogOpen(open);
                if (!open) {
                  setConvertingTicket(null);
                  setNewTaskTitle("");
                  setNewTaskDesc("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="shadow-sm w-full sm:w-auto">
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
            {/* Mobile Column Selector (hidden on md and up) */}
            <div className="flex md:hidden bg-muted/40 p-1 rounded-xl mb-4 gap-1.5 border border-border/50">
              {columns.map(col => {
                const isActive = activeMobileColumn === col.id;
                const count = tasks.filter(t => t.status === col.id).length;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setActiveMobileColumn(col.id)}
                    className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all ${
                      isActive 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {col.label} ({count})
                  </button>
                );
              })}
            </div>

            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCorners} 
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
                {columns.map(col => {
                  const colTasks = tasks
                    .filter(t => t.status === col.id)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                  return (
                    <div 
                      key={col.id}
                      className={activeMobileColumn === col.id ? 'block' : 'hidden md:block'}
                    >
                      <DroppableColumn 
                        col={col} 
                        taskCount={colTasks.length}
                      >
                        <SortableContext 
                          items={colTasks.map(t => t.id)} 
                          strategy={verticalListSortingStrategy}
                        >
                          {colTasks.map(task => (
                            <SortableTaskCard 
                              key={task.id} 
                              task={task} 
                              openEditTaskDialog={openEditTaskDialog}
                              updateTaskStatus={updateTaskStatus}
                              handleDeleteTask={handleDeleteTask}
                            />
                          ))}
                        </SortableContext>
                        
                        {colTasks.length === 0 && (
                          <div className="h-24 border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-sm text-muted-foreground/30">
                            Drop items here
                          </div>
                        )}
                      </DroppableColumn>
                    </div>
                  );
                })}
              </div>
            </DndContext>
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
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
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
                        <div className="flex items-center gap-2">
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => handleDeleteResource(res.id)}
                            aria-label="Delete resource"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="mt-0">
            <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Tickets Backlog</CardTitle>
                    <CardDescription>Issue inbox and suggestions for the team</CardDescription>
                  </div>
                  <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> New Ticket</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={handleCreateTicket}>
                        <DialogHeader>
                          <DialogTitle>Create Support Ticket</DialogTitle>
                          <DialogDescription className="sr-only">Submit a bug report or feature request.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Ticket Title</Label>
                            <Input required placeholder="e.g. Broken authentication on login page" value={newTicketTitle} onChange={e => setNewTicketTitle(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input required placeholder="Provide clear steps to reproduce or details" value={newTicketDesc} onChange={e => setNewTicketDesc(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <Select value={newTicketCategory} onValueChange={setNewTicketCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bug">Bug</SelectItem>
                                  <SelectItem value="feature_request">Feature Request</SelectItem>
                                  <SelectItem value="refactor">Refactor</SelectItem>
                                  <SelectItem value="support">Support</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Priority</Label>
                              <Select value={newTicketPriority} onValueChange={setNewTicketPriority}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isSubmittingTicket}>
                            {isSubmittingTicket && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Ticket
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-card/30">
                    <Loader2 className="h-12 w-12 text-muted-foreground/30 mb-4 animate-pulse" />
                    <h3 className="font-medium text-muted-foreground">No tickets submitted yet</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">Use tickets to log bugs, ideas, or refactors before scheduling them on the Kanban board.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map(ticket => {
                      const priorityColor = {
                        low: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
                        medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
                        high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
                        critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }[ticket.priority as string] || "bg-secondary text-secondary-foreground";

                      const categoryLabel = {
                        bug: "🐛 Bug",
                        feature_request: "✨ Feature",
                        refactor: "⚙️ Refactor",
                        support: "🤝 Support"
                      }[ticket.category as string] || ticket.category;

                      return (
                        <div key={ticket.id} className="relative group flex flex-col p-4 sm:p-5 border rounded-xl hover:bg-muted/30 transition-colors bg-background/50">
                          {/* Floating Delete Button (Top-Right) */}
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-lg sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTicket(ticket.id);
                              }}
                              aria-label="Delete ticket"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex flex-col gap-3">
                            {/* Title & Badges */}
                            <div className="space-y-1.5 pr-8 sm:pr-10">
                              <h4 className="font-semibold text-base leading-tight text-foreground">
                                {ticket.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge className={`text-[9px] sm:text-[10px] font-normal uppercase tracking-wider px-1.5 py-0.5 ${priorityColor}`}>
                                  {ticket.priority}
                                </Badge>
                                <Badge variant="outline" className="text-[9px] sm:text-[10px] font-normal px-1.5 py-0.5">
                                  {categoryLabel}
                                </Badge>
                                <Badge 
                                  variant={ticket.status === 'resolved' ? "outline" : "secondary"} 
                                  className={`text-[9px] sm:text-[10px] font-normal capitalize px-1.5 py-0.5 ${
                                    ticket.status === 'resolved' 
                                      ? "border-green-200 text-green-700 bg-green-50 dark:border-green-900/30 dark:text-green-400 dark:bg-green-950/20" 
                                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
                                  }`}
                                >
                                  Status: {ticket.status}
                                </Badge>
                                {ticket.task_id && (
                                  <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 dark:border-green-900/30 dark:text-green-400 dark:bg-green-950/20 text-[9px] sm:text-[10px] font-normal px-1.5 py-0.5">
                                    ✓ Converted
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {ticket.description}
                            </p>

                            {/* Divider & Footer Row (Reporter Info + Responsive Actions) */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 pt-3 border-t border-border/30 z-0">
                              <div className="text-[11px] sm:text-xs text-muted-foreground">
                                Reported by <span className="font-semibold text-foreground/80">{ticket.expand?.reporter_id?.name || ticket.expand?.reporter_id?.email || 'User'}</span> on {format(new Date(ticket.created), 'PPP')}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className={`text-xs justify-center col-span-2 sm:col-auto h-8 sm:h-9 ${
                                    expandedTicketId === ticket.id 
                                      ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                      : 'text-muted-foreground hover:text-foreground border border-border/20 sm:border-0'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (expandedTicketId === ticket.id) {
                                      setExpandedTicketId(null);
                                      setTicketComments([]);
                                    } else {
                                      setExpandedTicketId(ticket.id);
                                      loadTicketComments(ticket.id);
                                    }
                                  }}
                                >
                                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Discussion
                                </Button>

                                {!ticket.task_id && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-xs border-primary/20 text-primary hover:bg-primary/5 shadow-sm h-8 sm:h-9 justify-center"
                                      onClick={() => handleConvertTicketToTask(ticket)}
                                    >
                                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Convert
                                    </Button>

                                    {ticket.status === 'resolved' ? (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 shadow-sm h-8 sm:h-9 justify-center"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            await pb.collection('tickets').update(ticket.id, { status: 'open' });
                                            toast.success("Ticket reopened");
                                            loadTickets();
                                            await logTicketActivity(ticket.id, "reopened");
                                          } catch (err) {
                                            toast.error("Failed to reopen ticket");
                                          }
                                        }}
                                      >
                                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/20 border border-green-200 dark:border-green-900/30 shadow-sm h-8 sm:h-9 justify-center"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            await pb.collection('tickets').update(ticket.id, { status: 'resolved' });
                                            toast.success("Ticket marked as resolved");
                                            loadTickets();
                                            await logTicketActivity(ticket.id, "resolved");
                                          } catch (err) {
                                            toast.error("Failed to resolve ticket");
                                          }
                                        }}
                                      >
                                        <Check className="mr-1.5 h-3.5 w-3.5" /> Resolve
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Comments Thread */}
                          {expandedTicketId === ticket.id && (
                            <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discussion Thread</div>
                              
                              {/* Comments list */}
                              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                                {ticketComments.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic py-2">No comments yet. Start the discussion below!</p>
                                ) : (
                                  ticketComments.map(item => (
                                    item.timelineType === 'comment' ? (
                                      <div key={item.id} className="flex gap-2.5 items-start text-sm">
                                        <Avatar className="h-7 w-7 flex-none">
                                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                            {item.expand?.user_id?.name?.charAt(0) || item.expand?.user_id?.email?.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 bg-muted/40 p-2.5 rounded-xl border border-border/20">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold">{item.expand?.user_id?.name || item.expand?.user_id?.email || 'User'}</span>
                                            <span className="text-[10px] text-muted-foreground">{format(new Date(item.created), 'MMM d, h:mm a')}</span>
                                          </div>
                                          <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">{item.content}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground pl-9 py-1 relative">
                                        <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-border/40 -z-10" />
                                        <div className="h-2 w-2 rounded-full bg-border flex-none -ml-4 mr-2" />
                                        <span className="font-semibold text-foreground/80">{item.expand?.user_id?.name || item.expand?.user_id?.email || 'User'}</span>
                                        <span>
                                          {item.action === 'created' && `created this ticket`}
                                          {item.action === 'resolved' && `marked this ticket as resolved ✓`}
                                          {item.action === 'reopened' && `reopened this ticket ⟳`}
                                          {item.action === 'converted_to_task' && `converted this ticket to a Kanban task: "${item.details}"`}
                                          {item.action === 'commented' && `added a comment`}
                                        </span>
                                        <span className="text-[10px] ml-auto">{format(new Date(item.created), 'MMM d, h:mm a')}</span>
                                      </div>
                                    )
                                  ))
                                )}
                              </div>
                              
                              {/* New Comment Input */}
                              <form onSubmit={(e) => handleCreateComment(e, ticket.id)} className="flex gap-2 pt-2 items-end">
                                <div className="flex-1">
                                  <Input 
                                    placeholder="Type a message or technical note..." 
                                    value={newCommentText}
                                    onChange={e => setNewCommentText(e.target.value)}
                                    className="text-xs h-9 bg-background/50"
                                    disabled={isSubmittingComment}
                                  />
                                </div>
                                <Button type="submit" size="sm" className="h-9 px-4 text-xs flex-none" disabled={isSubmittingComment || !newCommentText.trim()}>
                                  {isSubmittingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send"}
                                </Button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog 
        open={alertDialogProps.isOpen} 
        onOpenChange={(open) => setAlertDialogProps(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialogProps.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialogProps.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive"
              onClick={alertDialogProps.onConfirm}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
