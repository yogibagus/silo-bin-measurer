'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BinCard } from './BinCard';
import { useBinManager } from '@/hooks/useBinManager';
import { Factory, AlertTriangle, Edit, Check, X } from 'lucide-react';

export function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [isEditingSystem, setIsEditingSystem] = useState(false);
  const [tempElevatorSpeed, setTempElevatorSpeed] = useState('');
  const [tempTrailerCapacity, setTempTrailerCapacity] = useState('');
  const [tempWagonCapacity, setTempWagonCapacity] = useState('');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const {
    bins,
    systemSettings,
    isLoading,
    startFilling,
    stopFilling,
    resetBin,
    updateManualFill,
    getAllBinMetrics,
    updateSystemSettings,
    addTruckLoad,
    removeTruckLoad,
    resetTrailerCount,
    updateGrainType,
    addWagonLoad,
    removeWagonLoad,
    resetWagonCount,
    deleteActivityLog,
    undoLastActivity,
  } = useBinManager();

  const binMetrics = getAllBinMetrics();
  
  // Debug logging
  useEffect(() => {
    console.log('Dashboard systemSettings:', systemSettings);
    console.log('Dashboard bins:', bins);
  }, [systemSettings, bins]);

  const handleEditSystem = () => {
    setTempElevatorSpeed(systemSettings.elevatorSpeed.toString());
    setTempTrailerCapacity(systemSettings.tonsPerTrailer.toString());
    setTempWagonCapacity(systemSettings.tonsPerWagon.toString());
    setIsEditingSystem(true);
  };

  const handleSaveSystem = () => {
    const newSpeed = parseFloat(tempElevatorSpeed);
    const newTrailerCapacity = parseFloat(tempTrailerCapacity);
    const newWagonCapacity = parseFloat(tempWagonCapacity);
    
    if (!isNaN(newSpeed) && newSpeed > 0 && 
        !isNaN(newTrailerCapacity) && newTrailerCapacity > 0 && 
        !isNaN(newWagonCapacity) && newWagonCapacity > 0) {
      updateSystemSettings({ 
        elevatorSpeed: newSpeed,
        tonsPerTrailer: newTrailerCapacity,
        tonsPerWagon: newWagonCapacity
      });
      setIsEditingSystem(false);
    }
  };

  const handleCancelSystem = () => {
    setIsEditingSystem(false);
    setTempElevatorSpeed('');
    setTempTrailerCapacity('');
    setTempWagonCapacity('');
  };

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-2">
              <img 
                src="https://grains.graincorp.com.au/wp-content/uploads/2023/07/graincorp-logo-colour-rgb-2000px@72ppi.png" 
                alt="GrainCorp Logo" 
                className="h-10 w-auto"
              />
              <h1 className="text-4xl font-bold text-gray-900">
                Silo Bin Measurer
              </h1>
            </div>
            <p className="text-gray-600">Real-time Bin Monitoring System</p>
          </div>
          {/* Loading placeholder */}
          <div className="text-center py-8">
            <p className="text-gray-500">
              {isLoading ? 'Loading data from MongoDB...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img 
              src="https://grains.graincorp.com.au/wp-content/uploads/2023/07/graincorp-logo-colour-rgb-2000px@72ppi.png" 
              alt="GrainCorp Logo" 
              className="h-8 sm:h-10 w-auto"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Silo Bin Measurer
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Narrabri Sub - Real-time Bin Monitoring System
          </p>
        </div>

        {/* Important Notice */}
        <Card className="border-2 border-amber-200 bg-amber-50 mb-8">
          <CardContent className="pt-0">
            <p className="text-sm text-amber-700 leading-relaxed">
              This application is an <strong>assistive tool only</strong>. Always verify grain levels manually 
              through physical measurements and visual inspections. The calculations provided are estimates 
              and should not replace proper manual verification procedures.
            </p>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                System Information
              </div>
              {!isEditingSystem && (
                <button
                  onClick={handleEditSystem}
                  className="p-1 bg-white hover:bg-gray-100 rounded-md transition-colors"
                  title="Edit System Settings"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingSystem ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Elevator Speed</p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={tempElevatorSpeed}
                        onChange={(e) => setTempElevatorSpeed(e.target.value)}
                        className="w-20 sm:w-24 px-2 py-1 border rounded text-xs sm:text-sm"
                        placeholder="tons/hr"
                      />
                      <span className="text-xs text-gray-600">tons/hr</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Trailer Capacity</p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={tempTrailerCapacity}
                        onChange={(e) => setTempTrailerCapacity(e.target.value)}
                        className="w-20 sm:w-24 px-2 py-1 border rounded text-xs sm:text-sm"
                        placeholder="tons"
                      />
                      <span className="text-xs text-gray-600">tons</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Wagon Train Capacity</p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={tempWagonCapacity}
                        onChange={(e) => setTempWagonCapacity(e.target.value)}
                        className="w-20 sm:w-24 px-2 py-1 border rounded text-xs sm:text-sm"
                        placeholder="tons"
                      />
                      <span className="text-xs text-gray-600">tons</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">Conversion Rate</p>
                    <p className="text-gray-600 text-xs sm:text-sm">1 ft = {systemSettings.tonsPerFoot} tons</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2">
                    <p className="font-medium text-xs sm:text-sm">Fill Rate</p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {(systemSettings.elevatorSpeed / 60).toFixed(1)} t/min ({(systemSettings.elevatorSpeed / 60 / systemSettings.tonsPerFoot).toFixed(2)} ft/min)
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={handleSaveSystem}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelSystem}
                    className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                <div>
                  <p className="font-medium text-xs sm:text-sm">Elevator Speed</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{systemSettings.elevatorSpeed} tons/hr</p>
                </div>
                <div>
                  <p className="font-medium text-xs sm:text-sm">Trailer Capacity</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{systemSettings.tonsPerTrailer} tons</p>
                </div>
                <div>
                  <p className="font-medium text-xs sm:text-sm">Wagon Train Capacity</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{systemSettings.tonsPerWagon} tons</p>
                </div>
                <div>
                  <p className="font-medium text-xs sm:text-sm">Conversion Rate</p>
                  <p className="text-gray-600 text-xs sm:text-sm">1 ft = {systemSettings.tonsPerFoot} tons</p>
                </div>
                <div>
                  <p className="font-medium text-xs sm:text-sm">Fill Rate</p>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {(systemSettings.elevatorSpeed / 60).toFixed(1)} t/min ({(systemSettings.elevatorSpeed / 60 / systemSettings.tonsPerFoot).toFixed(2)} ft/min)
                  </p>
                </div>
                <div>
                  <p className="font-medium text-xs sm:text-sm">Last Updated</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{new Date().toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bin Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {binMetrics.map(({ bin, metrics }) => (
        <BinCard
          key={bin.id}
          bin={bin}
          metrics={metrics}
          systemSettings={{
            tonsPerTrailer: systemSettings.tonsPerTrailer,
            tonsPerWagon: systemSettings.tonsPerWagon,
          }}
          onStartFilling={startFilling}
          onStopFilling={stopFilling}
          onReset={resetBin}
          onManualFillUpdate={updateManualFill}
          onAddTruckLoad={addTruckLoad}
          onRemoveTrailerLoad={removeTruckLoad}
          onResetTrailerCount={resetTrailerCount}
          onUpdateGrainType={updateGrainType}
          onAddWagonLoad={addWagonLoad}
          onRemoveWagonLoad={removeWagonLoad}
          onResetWagonCount={resetWagonCount}
          onDeleteActivityLog={deleteActivityLog}
          onUndoLastActivity={undoLastActivity}
        />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>© 2025 Silo Bin Measurer v1.0</p>
          <p>Created by Yogi Pangestu</p>
        </div>
      </div>
    </div>
  );
}
