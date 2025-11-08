'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bin, BinMetrics } from '@/types/bin';
import { Play, Pause, RotateCcw, Edit, Save, X, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ActivityTab } from './ActivityTab';

interface BinCardProps {
  bin: Bin;
  metrics: BinMetrics;
  systemSettings: {
    tonsPerTrailer: number;
    tonsPerWagon: number;
  };
  onStartFilling: (binId: number) => void;
  onStopFilling: (binId: number) => void;
  onReset: (binId: number) => void;
  onManualFillUpdate: (binId: number, feet: number) => void;
  onAddTruckLoad: (binId: number, trailers: number) => void;
  onRemoveTrailerLoad: (binId: number, trailers: number) => void;
  onResetTrailerCount: (binId: number) => void;
  onUpdateGrainType: (binId: number, grainType: string) => void;
  onAddWagonLoad: (binId: number, wagons: number) => void;
  onRemoveWagonLoad: (binId: number, wagons: number) => void;
  onResetWagonCount: (binId: number) => void;
  onDeleteActivityLog?: (binId: number, logId: string) => void;
  onUndoLastActivity?: (binId: number) => void;
}

export function BinCard({
  bin,
  metrics,
  systemSettings,
  onStartFilling,
  onStopFilling,
  onReset,
  onManualFillUpdate,
  onAddTruckLoad,
  onRemoveTrailerLoad,
  onResetTrailerCount,
  onUpdateGrainType,
  onAddWagonLoad,
  onRemoveWagonLoad,
  onResetWagonCount,
  onDeleteActivityLog,
  onUndoLastActivity,
}: BinCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(metrics.remainingCapacityFeet.toString());
  const [isEditingGrainType, setIsEditingGrainType] = useState(false);
  const [grainTypeValue, setGrainTypeValue] = useState(bin.grainType);
  
  // Hold to press states
  const [isHoldingStart, setIsHoldingStart] = useState(false);
  const [isHoldingInload, setIsHoldingInload] = useState(false);
  const [isHoldingOutload, setIsHoldingOutload] = useState(false);
  const [isHoldingWagonInload, setIsHoldingWagonInload] = useState(false);
  const [isHoldingWagonOutload, setIsHoldingWagonOutload] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [holdTimer, setHoldTimer] = useState<NodeJS.Timeout | null>(null);

  // Update editValue when metrics change (but not during editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(metrics.remainingCapacityFeet.toString());
    }
  }, [metrics.remainingCapacityFeet, isEditing]);

  // Force re-render every second for elapsed time updates only when filling
  const [, forceUpdate] = useState({});
  useEffect(() => {
    if (!bin.isFilling) return;
    
    const interval = setInterval(() => {
      forceUpdate({});
    }, 1000);
    return () => clearInterval(interval);
  }, [bin.isFilling]);

  const handleEdit = () => {
    setEditValue(metrics.remainingCapacityFeet.toString());
    setIsEditing(true);
  };

  const handleSave = () => {
    console.log('Save clicked, editValue:', editValue);
    const remainingFeet = parseFloat(editValue);
    console.log('Parsed remainingFeet:', remainingFeet);
    console.log('Bin maxCapacityFeet:', bin.maxCapacityFeet);
    console.log('Current bin.currentFillFeet:', bin.currentFillFeet);
    console.log('Current bin.currentFillTons:', bin.currentFillTons);
    console.log('Current metrics.remainingCapacityTons:', metrics.remainingCapacityTons);
    console.log('Current metrics.remainingCapacityFeet:', metrics.remainingCapacityFeet);
    
    if (!isNaN(remainingFeet) && remainingFeet >= 0 && remainingFeet <= bin.maxCapacityFeet) {
      console.log('Calling onManualFillUpdate with binId:', bin.id, 'remainingFeet:', remainingFeet);
      
      onManualFillUpdate(bin.id, remainingFeet);
      setIsEditing(false);
      console.log('Save completed');
    } else {
      console.log('Validation failed - remainingFeet:', remainingFeet, 'maxCapacity:', bin.maxCapacityFeet);
      alert('Invalid value. Please enter a number between 0 and ' + bin.maxCapacityFeet);
    }
  };

  const handleCancel = () => {
    setEditValue(metrics.remainingCapacityFeet.toString());
    setIsEditing(false);
  };

  const handleManualFillChange = (value: string) => {
    const feet = parseFloat(value);
    if (!isNaN(feet) && feet >= 0 && feet <= bin.maxCapacityFeet) {
      onManualFillUpdate(bin.id, feet);
    }
  };

  const handleEditGrainType = () => {
    setGrainTypeValue(bin.grainType);
    setIsEditingGrainType(true);
  };

  const handleSaveGrainType = () => {
    if (grainTypeValue.trim()) {
      onUpdateGrainType(bin.id, grainTypeValue.trim());
      setIsEditingGrainType(false);
    }
  };

  const handleCancelGrainType = () => {
    setGrainTypeValue(bin.grainType);
    setIsEditingGrainType(false);
  };

  // Hold to press functions
  const startHold = (action: 'start' | 'inload' | 'outload' | 'wagonInload' | 'wagonOutload') => {
    console.log('=== START HOLD DEBUG ===');
    console.log('startHold called with action:', action, 'for bin:', bin.id);
    console.log('Current bin.isFilling:', bin.isFilling);
    console.log('Current metrics.fillPercentage:', metrics.fillPercentage);
    
    if (holdTimer) {
      console.log('Clearing existing hold timer');
      clearInterval(holdTimer);
    }
    
    setHoldProgress(0);
    const startTime = Date.now();
    
    if (action === 'start') {
      console.log('Setting isHoldingStart to true');
      setIsHoldingStart(true);
    } else if (action === 'inload') {
      setIsHoldingInload(true);
    } else if (action === 'outload') {
      setIsHoldingOutload(true);
    } else if (action === 'wagonInload') {
      setIsHoldingWagonInload(true);
    } else if (action === 'wagonOutload') {
      setIsHoldingWagonOutload(true);
    }
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 2000) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        console.log('=== HOLD COMPLETED ===');
        console.log('Hold completed for action:', action, 'executing...');
        clearInterval(timer);
        setHoldTimer(null);
        setHoldProgress(0);
        
        // Execute action
        if (action === 'start') {
          console.log('CALLING onStartFilling for bin:', bin.id);
          onStartFilling(bin.id);
          console.log('Called onStartFilling, setting isHoldingStart to false');
          setIsHoldingStart(false);
        } else if (action === 'inload') {
          onAddTruckLoad(bin.id, 1);
          setIsHoldingInload(false);
        } else if (action === 'outload') {
          onRemoveTrailerLoad(bin.id, 1);
          setIsHoldingOutload(false);
        } else if (action === 'wagonInload') {
          onAddWagonLoad(bin.id, 1);
          setIsHoldingWagonInload(false);
        } else if (action === 'wagonOutload') {
          onRemoveWagonLoad(bin.id, 1);
          setIsHoldingWagonOutload(false);
        }
      }
    }, 50);
    
    setHoldTimer(timer);
    console.log('Hold timer started for action:', action);
  };

  const cancelHold = () => {
    if (holdTimer) {
      clearInterval(holdTimer);
      setHoldTimer(null);
    }
    setHoldProgress(0);
    setIsHoldingStart(false);
    setIsHoldingInload(false);
    setIsHoldingOutload(false);
    setIsHoldingWagonInload(false);
    setIsHoldingWagonOutload(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimer) clearInterval(holdTimer);
    };
  }, [holdTimer]);

  const getStatusColor = () => {
    if (bin.isFilling) return 'bg-green-500';
    if (metrics.fillPercentage >= 90) return 'bg-red-500';
    if (metrics.fillPercentage >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (bin.isFilling) return 'Filling';
    if (metrics.fillPercentage >= 100) return 'Full';
    if (metrics.fillPercentage > 0) return 'Partially Filled';
    return 'Empty';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl font-bold truncate">{bin.name}</CardTitle>
            {isEditingGrainType ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="text"
                  value={grainTypeValue}
                  onChange={(e) => setGrainTypeValue(e.target.value)}
                  className="w-24 sm:w-32 h-7 text-sm"
                  disabled={bin.isFilling}
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveGrainType} disabled={bin.isFilling}>
                  <Save className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelGrainType}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">Grade: {bin.grainType}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEditGrainType}
                  disabled={bin.isFilling}
                  className="h-6 px-2 flex-shrink-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          <Badge className={`${getStatusColor()} text-white text-xs sm:text-sm flex-shrink-0`}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <hr />
      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-auto max-w-xs">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-3 sm:space-y-4 p-4 pt-2">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fill Level</span>
                <span>{metrics.fillPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.fillPercentage} className="h-3" />
            </div>

            {/* Time Information - Single Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-sm">
              {/* Remaining Capacity */}
              <div className="col-span-1">
                <p className="font-medium text-xs sm:text-sm">Remaining Capacity</p>
                {isEditing ? (
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        min="0"
                        max={bin.maxCapacityFeet}
                        step="0.1"
                        className="w-16 h-7 text-xs"
                        disabled={bin.isFilling}
                        autoFocus
                      />
                      <span className="text-xs text-gray-600">ft</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={handleSave} disabled={bin.isFilling} className="h-6 px-2 text-xs">
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} className="h-6 px-2 text-xs">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1">
                    {/* make button righ next to ft */}
                    <div className="flex items-center gap-1">
                      <p className="text-lg sm:text-xl font-bold text-orange-600">
                        {metrics.remainingCapacityFeet.toFixed(1)} ft
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEdit}
                        disabled={bin.isFilling}
                        className="h-6 px-2 flex-shrink-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">
                      {metrics.remainingCapacityTons.toFixed(0)} tons remaining
                    </p>
                  </div>
                )}
              </div>

              {/* Est. Time to Full */}
              <div className="col-span-1">
                <p className="font-medium text-xs sm:text-sm">Est. Time to Full</p>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">{metrics.estimatedTimeToFull}</p>
                <p className="text-xs text-blue-600 font-medium">
                  ~{metrics.estimatedTrailersToFull} trailers
                </p>
              </div>

               {/* Elapsed Time */}
              <div className="col-span-1">
                <p className="font-medium text-xs sm:text-sm">Elapsed Time</p>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">{metrics.elapsedTime}</p>
              </div>
            </div>

            <hr />

            {/* Load Controls */}
            <Tabs defaultValue="inload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mx-auto max-w-xs">
                <TabsTrigger value="inload">Inload</TabsTrigger>
                <TabsTrigger value="outload">Outload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="inload" className="space-y-3 mt-4">
                {/* Truck Load Inload */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <p className="text-sm font-medium">Trailer ({systemSettings.tonsPerTrailer} tons/trailer)</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">{bin.trailerCount}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResetTrailerCount(bin.id)}
                        disabled={bin.isFilling}
                        className="h-6 px-2 text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onMouseDown={() => startHold('inload')}
                      onMouseUp={cancelHold}
                      onMouseLeave={cancelHold}
                      onTouchStart={() => startHold('inload')}
                      onTouchEnd={cancelHold}
                      disabled={bin.isFilling || metrics.fillPercentage >= 100}
                      className={`text-xs w-full ${isHoldingInload ? 'bg-green-100 border-green-300' : ''}`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      1 Trailer Inload
                    </Button>
                    {isHoldingInload && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-10">
                        <Progress value={holdProgress} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Wagon Train Inload */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <p className="text-sm font-medium">Wagon Train ({systemSettings.tonsPerWagon} tons/wagon)</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-600">{bin.wagonCount}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResetWagonCount(bin.id)}
                        disabled={bin.isFilling}
                        className="h-6 px-2 text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onMouseDown={() => startHold('wagonInload')}
                      onMouseUp={cancelHold}
                      onMouseLeave={cancelHold}
                      onTouchStart={() => startHold('wagonInload')}
                      onTouchEnd={cancelHold}
                      disabled={bin.isFilling || metrics.fillPercentage >= 100}
                      className={`text-xs w-full ${isHoldingWagonInload ? 'bg-green-100 border-green-300' : ''}`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      1 Wagon Inload
                    </Button>
                    {isHoldingWagonInload && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-10">
                        <Progress value={holdProgress} className="h-1" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-green-600 font-medium mt-2">
                    ~{metrics.estimatedWagonsToFull} wagons to full
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="outload" className="space-y-3 mt-4">
                {/* Truck Load Outload */}
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <p className="text-sm font-medium">Trailer ({systemSettings.tonsPerTrailer} tons/trailer)</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-red-600">{bin.trailerCount}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResetTrailerCount(bin.id)}
                        disabled={bin.isFilling}
                        className="h-6 px-2 text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onMouseDown={() => startHold('outload')}
                      onMouseUp={cancelHold}
                      onMouseLeave={cancelHold}
                      onTouchStart={() => startHold('outload')}
                      onTouchEnd={cancelHold}
                      disabled={bin.isFilling || metrics.fillPercentage <= 0}
                      className={`text-xs w-full ${isHoldingOutload ? 'bg-red-100 border-red-300' : ''}`}
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      1 Trailer Outload
                    </Button>
                    {isHoldingOutload && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-10">
                        <Progress value={holdProgress} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Wagon Train Outload */}
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <p className="text-sm font-medium">Wagon Train ({systemSettings.tonsPerWagon} tons/wagon)</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-orange-600">{bin.wagonCount}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onResetWagonCount(bin.id)}
                        disabled={bin.isFilling}
                        className="h-6 px-2 text-xs"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onMouseDown={() => startHold('wagonOutload')}
                      onMouseUp={cancelHold}
                      onMouseLeave={cancelHold}
                      onTouchStart={() => startHold('wagonOutload')}
                      onTouchEnd={cancelHold}
                      disabled={bin.isFilling || metrics.fillPercentage <= 0}
                      className={`text-xs w-full ${isHoldingWagonOutload ? 'bg-red-100 border-red-300' : ''}`}
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      1 Wagon Outload
                    </Button>
                    {isHoldingWagonOutload && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-10">
                        <Progress value={holdProgress} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Control Buttons */}
            {!bin.isFilling ? (
              <div className="relative w-full">
                <Button
                  onMouseDown={() => startHold('start')}
                  onMouseUp={cancelHold}
                  onMouseLeave={cancelHold}
                  onTouchStart={() => startHold('start')}
                  onTouchEnd={cancelHold}
                  className={`w-full text-sm ${isHoldingStart ? 'bg-green-100 border-green-300' : ''}`}
                  disabled={metrics.fillPercentage >= 100}
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  Start Filling
                </Button>
                {isHoldingStart && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10">
                    <Progress value={holdProgress} className="h-1" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => onStopFilling(bin.id)}
                  variant="destructive"
                  className="flex-1 text-sm"
                >
                  <Pause className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  Stop Filling
                </Button>
                <Button
                  onClick={() => onReset(bin.id)}
                  variant="outline"
                  disabled={bin.isFilling}
                  className="px-2 sm:px-4"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="activity" className="p-4 pt-2">
            <ActivityTab 
              activityLogs={bin.activityLogs} 
              binId={bin.id}
              onDeleteActivityLog={onDeleteActivityLog}
              onUndoLastActivity={onUndoLastActivity}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
