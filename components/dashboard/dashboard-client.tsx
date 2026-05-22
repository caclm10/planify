"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Plus, Calendar, LogOut, Users } from "lucide-react";
import { format } from "date-fns";

export function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create project form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectDate, setNewProjectDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      router.push("/login");
      return;
    }
    setUser(pb.authStore.model);
    loadProjects();

    // Subscribe to real-time changes on projects
    pb.collection('projects').subscribe('*', function (e) {
      loadProjects();
    });

    return () => {
      pb.collection('projects').unsubscribe('*');
    };
  }, [router]);

  const loadProjects = async () => {
    try {
      const records = await pb.collection('projects').getFullList({
        sort: '-created',
        expand: 'members'
      });
      setProjects(records);
    } catch (err: any) {
      console.error("Failed to load projects", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    router.push("/login");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const data = {
        name: newProjectName,
        description: newProjectDesc,
        target_end_date: newProjectDate ? new Date(newProjectDate).toISOString() : null,
        members: [user.id] // Automatically add creator as member
      };

      await pb.collection('projects').create(data);
      toast.success("Project created successfully!");
      setIsDialogOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      setNewProjectDate("");
      loadProjects();
    } catch (err: any) {
      toast.error(err.message || "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Planify Logo" className="h-10 w-10 rounded-xl object-cover border border-white/10 shadow-sm" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Workspace</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Planify - Collaborative Project Workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 mr-4">
            <Avatar>
              <AvatarImage src={user?.avatar ? pb.files.getURL(user, user.avatar) : ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {user?.name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.name || user?.email}</p>
              <p className="text-xs text-muted-foreground">Workspace Member</p>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateProject}>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Set up a new workspace for your team. You can invite members later.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Website Redesign" 
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input 
                      id="description" 
                      placeholder="Brief details about this project" 
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Target End Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={newProjectDate}
                      onChange={(e) => setNewProjectDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-card/50">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Plus className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first project to start organizing tasks, tracking milestones, and collaborating.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>Create Project</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 cursor-pointer group flex flex-col"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-3 flex-none">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <Badge variant="secondary" className="font-normal text-xs bg-secondary/50">
                      Active
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2 min-h-[40px]">
                    {project.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4 flex-grow flex flex-col justify-end">
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Calendar className="mr-2 h-4 w-4" />
                    {project.target_end_date 
                      ? `Due ${format(new Date(project.target_end_date), 'MMM d, yyyy')}`
                      : "No deadline"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex -space-x-2">
                      {project.expand?.members?.map((member: any) => (
                        <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                          <AvatarFallback className="bg-primary/20 text-xs text-primary">
                            {member.name?.charAt(0) || member.email?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
