import { useState, useEffect } from 'react';
import { Note } from '@/types/bin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Plus, Edit, Trash2, Calendar } from 'lucide-react';

interface NoteTabProps {
  notes: Note[];
  binId: number;
  onAddNote?: (binId: number, title: string, content: string, priority: 'low' | 'medium' | 'high') => void;
  onUpdateNote?: (binId: number, noteId: string, title: string, content: string, priority: 'low' | 'medium' | 'high') => void;
  onDeleteNote?: (binId: number, noteId: string) => void;
}

const getPriorityColor = (priority: Note['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getPriorityBadgeVariant = (priority: Note['priority']) => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
};

const formatTimestamp = (timestamp: Date) => {
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
};

const formatRelativeTime = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

function NoteDialog({ 
  note, 
  isOpen, 
  onClose, 
  onSave, 
  binId 
}: { 
  note?: Note; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (title: string, content: string, priority: 'low' | 'medium' | 'high') => void; 
  binId: number;
}) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(note?.priority || 'medium');

  // Reset form when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setPriority(note.priority);
    } else {
      setTitle('');
      setContent('');
      setPriority('medium');
    }
  }, [note]);

  const handleSave = () => {
    if (title.trim() && content.trim()) {
      onSave(title.trim(), content.trim(), priority);
      onClose();
      // Reset form after saving
      setTitle('');
      setContent('');
      setPriority('medium');
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setTitle('');
    setContent('');
    setPriority('medium');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {note ? 'Edit Note' : 'Add New Note'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="col-span-3"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              placeholder="Enter note content..."
              className="col-span-3 min-h-[100px]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !content.trim()}>
            {note ? 'Update' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NoteTab({ 
  notes, 
  binId, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote
}: NoteTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>();

  // Handle case where notes might be undefined during loading
  const notesList = notes || [];

  const handleAddNote = (title: string, content: string, priority: 'low' | 'medium' | 'high') => {
    onAddNote?.(binId, title, content, priority);
  };

  const handleUpdateNote = (title: string, content: string, priority: 'low' | 'medium' | 'high') => {
    if (editingNote) {
      onUpdateNote?.(binId, editingNote.id, title, content, priority);
      setEditingNote(undefined);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingNote(undefined);
  };

  if (notesList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notes yet</p>
            <p className="text-sm">Add your first note to get started</p>
            <div className="mt-4">
              <NoteDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                onSave={handleAddNote}
                binId={binId}
              />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Notes
          <div className="ml-auto">
            <Badge variant="outline">
              {notesList.length} {notesList.length === 1 ? 'note' : 'notes'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <NoteDialog
            note={editingNote}
            isOpen={isDialogOpen}
            onClose={handleCloseDialog}
            onSave={editingNote ? handleUpdateNote : handleAddNote}
            binId={binId}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New Note
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
        
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-3">
            {notesList.map((note) => (
              <div
                key={note.id}
                className={`p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group border-l-4 border-l-blue-500`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(note.priority)}`} />
                      <Badge variant={getPriorityBadgeVariant(note.priority)} className="text-xs">
                        {note.priority}
                      </Badge>
                      <Badge variant="default" className="text-xs">
                        New
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(note.timestamp)}
                      </span>
                    </div>
                    <h3 className="font-medium text-sm mb-1">{note.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatTimestamp(note.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                      title="Edit note"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteNote?.(binId, note.id)}
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
