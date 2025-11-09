import { ActivityLog } from '@/types/bin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, TrendingUp, TrendingDown, RotateCcw, Package, Truck, Train, Wheat, X, Undo } from 'lucide-react';

interface ActivityTabProps {
  activityLogs: ActivityLog[];
  binId: number;
  onDeleteActivityLog?: (binId: number, logId: string) => void;
  onUndoLastActivity?: (binId: number) => void;
}

const getActionIcon = (action: ActivityLog['action']) => {
  switch (action) {
    case 'start_filling':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'stop_filling':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    case 'reset':
      return <RotateCcw className="h-4 w-4 text-orange-500" />;
    case 'manual_fill':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'manual_inload':
      return <Package className="h-4 w-4 text-green-500" />;
    case 'manual_outload':
      return <Package className="h-4 w-4 text-red-500" />;
    case 'truck_load':
      return <Truck className="h-4 w-4 text-purple-500" />;
    case 'truck_remove':
      return <Truck className="h-4 w-4 text-pink-500" />;
    case 'trailer_reset':
      return <RotateCcw className="h-4 w-4 text-orange-600" />;
    case 'wagon_load':
      return <Train className="h-4 w-4 text-indigo-500" />;
    case 'wagon_remove':
      return <Train className="h-4 w-4 text-purple-500" />;
    case 'wagon_reset':
      return <RotateCcw className="h-4 w-4 text-orange-600" />;
    case 'grain_change':
      return <Wheat className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getActionBadgeVariant = (action: ActivityLog['action']) => {
  switch (action) {
    case 'start_filling':
      return 'default';
    case 'stop_filling':
      return 'destructive';
    case 'reset':
      return 'secondary';
    case 'manual_fill':
      return 'outline';
    case 'manual_inload':
      return 'default';
    case 'manual_outload':
      return 'destructive';
    case 'truck_load':
      return 'default';
    case 'truck_remove':
      return 'destructive';
    case 'trailer_reset':
      return 'secondary';
    case 'wagon_load':
      return 'default';
    case 'wagon_remove':
      return 'destructive';
    case 'wagon_reset':
      return 'secondary';
    case 'grain_change':
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
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp));
};

const formatActionText = (action: ActivityLog['action']) => {
  switch (action) {
    case 'start_filling':
      return 'Start Filling';
    case 'stop_filling':
      return 'Stop Filling';
    case 'reset':
      return 'Reset';
    case 'manual_fill':
      return 'Manual Fill';
    case 'manual_inload':
      return 'Manual Inload';
    case 'manual_outload':
      return 'Manual Outload';
    case 'truck_load':
      return 'Truck Load';
    case 'truck_remove':
      return 'Truck Remove';
    case 'trailer_reset':
      return 'Trailer Reset';
    case 'wagon_load':
      return 'Wagon Load';
    case 'wagon_remove':
      return 'Wagon Remove';
    case 'wagon_reset':
      return 'Wagon Reset';
    case 'grain_change':
      return 'Grain Change';
    default:
      return 'Unknown';
  }
};

export function ActivityTab({ activityLogs, binId, onDeleteActivityLog, onUndoLastActivity }: ActivityTabProps) {
  // Handle case where activityLogs might be undefined during loading
  const logs = activityLogs || [];
  
  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity recorded yet</p>
            <p className="text-sm">Start filling or make changes to see activity here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Log
          <div className="ml-auto flex items-center gap-2">
            {onUndoLastActivity && logs.length > 0 && (
              <button
                onClick={() => onUndoLastActivity(binId)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
                title="Undo last activity"
              >
                <Undo className="h-4 w-4" />
              </button>
            )}
            <Badge variant="outline">
              {logs.length} records
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                <div className="mt-0.5">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                      {formatActionText(log.action)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{log.details}</p>
                  {log.oldValue !== undefined && log.newValue !== undefined && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {log.oldValue} → {log.newValue}
                        {log.unit && ` ${log.unit}`}
                      </span>
                    </div>
                  )}
                </div>
                {onDeleteActivityLog && (
                  <button
                    onClick={() => onDeleteActivityLog(binId, log.id)}
                    className="p-1 hover:bg-destructive/10 rounded-md transition-colors"
                    title="Delete activity log"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
