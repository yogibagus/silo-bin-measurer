'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bin, BinMetrics } from '@/types/bin';
import { Play, Pause, RotateCcw, Edit, Save, X, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BinCardProps {
  bin: Bin;
  metrics: BinMetrics;
  onStartFilling: (binId: number) => void;
  onStopFilling: (binId: number) => void;
  onReset: (binId: number) => void;
  onManualFillUpdate: (binId: number, feet: number) => void;
  onAddTruckLoad: (binId: number, trailers: number) => void;
  onRemoveTruckLoad: (binId: number, trailers: number) => void;
  onResetTrailerCount: (binId: number) => void;
  onUpdateGrainType: (binId: number, grainType: string) => void;
}

export function BinCard({
  bin,
  metrics,
  onStartFilling,
  onStopFilling,
  onReset,
  onManualFillUpdate,
  onAddTruckLoad,
  onRemoveTruckLoad,
  onResetTrailerCount,
  onUpdateGrainType,
}: BinCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(metrics.remainingCapacityFeet.toString());
  const [isEditingGrainType, setIsEditingGrainType] = useState(false);
  const [grainTypeValue, setGrainTypeValue] = useState(bin.grainType);

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
    
    if (!isNaN(remainingFeet) && remainingFeet >= 0 && remainingFeet <= bin.maxCapacityFeet) {
      const currentFeet = bin.maxCapacityFeet - remainingFeet;
      console.log('Calculated currentFeet:', currentFeet);
      console.log('Calling onManualFillUpdate with binId:', bin.id, 'currentFeet:', currentFeet);
      
      onManualFillUpdate(bin.id, currentFeet);
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
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg sm:text-xl font-bold">{bin.name}</CardTitle>
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
                <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">{bin.grainType}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEditGrainType}
                  disabled={bin.isFilling}
                  className="h-6 px-2"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          <Badge className={`${getStatusColor()} text-white text-xs sm:text-sm`}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fill Level</span>
            <span>{metrics.fillPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.fillPercentage} className="h-3" />
        </div>

        {/* Current Measurements */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Remaining Capacity</p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                min="0"
                max={bin.maxCapacityFeet}
                step="0.1"
                className="w-24 h-8 text-sm"
                disabled={bin.isFilling}
                autoFocus
              />
              <Button size="sm" onClick={handleSave} disabled={bin.isFilling}>
                <Save className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-orange-600">
                {metrics.remainingCapacityFeet.toFixed(1)} ft
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                disabled={bin.isFilling}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          )}
          <p className="text-sm text-gray-600">
            {metrics.remainingCapacityTons.toFixed(0)} tons remaining
          </p>
        </div>

        {/* Time Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Elapsed Time</p>
            <p className="text-gray-600">{metrics.elapsedTime}</p>
          </div>
          <div>
            <p className="font-medium">Est. Time to Full</p>
            <p className="text-gray-600">{metrics.estimatedTimeToFull}</p>
            <p className="text-xs text-blue-600 font-medium">
              ~{metrics.estimatedTrailersToFull} trailers
            </p>
          </div>
        </div>

        {/* Truck Load Controls */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <p className="text-sm font-medium">Trailer Inload (30 tons/trailer)</p>
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
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddTruckLoad(bin.id, 1)}
              disabled={bin.isFilling || metrics.fillPercentage >= 100}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Add 1 Trailer</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemoveTruckLoad(bin.id, 1)}
              disabled={bin.isFilling || metrics.fillPercentage <= 0}
              className="text-xs"
            >
              <Minus className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Remove 1 Trailer</span>
              <span className="sm:hidden">Remove</span>
            </Button>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!bin.isFilling ? (
            <Button
              onClick={() => onStartFilling(bin.id)}
              className="flex-1 text-sm"
              disabled={metrics.fillPercentage >= 100}
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Start Filling</span>
              <span className="sm:hidden">Start</span>
            </Button>
          ) : (
            <Button
              onClick={() => onStopFilling(bin.id)}
              variant="destructive"
              className="flex-1 text-sm"
            >
              <Pause className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Stop Filling</span>
              <span className="sm:hidden">Stop</span>
            </Button>
          )}
          <Button
            onClick={() => onReset(bin.id)}
            variant="outline"
            disabled={bin.isFilling}
            className="px-2 sm:px-4"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
