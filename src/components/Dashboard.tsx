'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BinCard } from './BinCard';
import { useBinManager } from '@/hooks/useBinManager';
import { Factory, AlertTriangle, Edit, Check, X } from 'lucide-react';

export function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [isEditingElevatorSpeed, setIsEditingElevatorSpeed] = useState(false);
  const [tempElevatorSpeed, setTempElevatorSpeed] = useState('');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const {
    bins,
    systemSettings,
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
  } = useBinManager();

  const binMetrics = getAllBinMetrics();

  const handleEditElevatorSpeed = () => {
    setTempElevatorSpeed(systemSettings.elevatorSpeed.toString());
    setIsEditingElevatorSpeed(true);
  };

  const handleSaveElevatorSpeed = () => {
    const newSpeed = parseFloat(tempElevatorSpeed);
    if (!isNaN(newSpeed) && newSpeed > 0) {
      updateSystemSettings({ elevatorSpeed: newSpeed });
      setIsEditingElevatorSpeed(false);
    }
  };

  const handleCancelElevatorSpeed = () => {
    setIsEditingElevatorSpeed(false);
    setTempElevatorSpeed('');
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <Factory className="w-10 h-10 text-blue-600" />
              GrainCorp Silo Bin Measurer
            </h1>
            <p className="text-gray-600">Narrabri NSW Australia - Real-time Bin Monitoring System</p>
          </div>
          {/* Loading placeholder */}
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2 sm:gap-3">
            <Factory className="w-6 h-6 sm:w-10 sm:h-10 text-blue-600" />
            <span className="hidden sm:inline">GrainCorp Silo Bin Measurer</span>
            <span className="sm:hidden">Silo Bin Measurer</span>
          </h1>
          <p className="text-xs sm:text-base text-gray-600">Narrabri NSW Australia - Real-time Bin Monitoring System</p>
        </div>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
              <div>
                <p className="font-medium text-xs sm:text-sm">Elevator Speed</p>
                {isEditingElevatorSpeed ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={tempElevatorSpeed}
                      onChange={(e) => setTempElevatorSpeed(e.target.value)}
                      className="w-16 sm:w-20 px-2 py-1 border rounded text-xs sm:text-sm"
                      placeholder="tons/hr"
                    />
                    <button
                      onClick={handleSaveElevatorSpeed}
                      className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                      title="Save"
                    >
                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={handleCancelElevatorSpeed}
                      className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                      title="Cancel"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-600 text-xs sm:text-sm">{systemSettings.elevatorSpeed} tons/hr</p>
                    <button
                      onClick={handleEditElevatorSpeed}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      title="Edit"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-xs sm:text-sm">Conversion Rate</p>
                <p className="text-gray-600 text-xs sm:text-sm">1 foot = {systemSettings.tonsPerFoot} tons</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="font-medium text-xs sm:text-sm">Fill Rate</p>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {(systemSettings.elevatorSpeed / 60).toFixed(1)} t/min ({(systemSettings.elevatorSpeed / 60 / systemSettings.tonsPerFoot).toFixed(2)} ft/min)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bin Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {binMetrics.map(({ bin, metrics }) => (
        <BinCard
          key={bin.id}
          bin={bin}
          metrics={metrics}
          onStartFilling={startFilling}
          onStopFilling={stopFilling}
          onReset={resetBin}
          onManualFillUpdate={updateManualFill}
          onAddTruckLoad={addTruckLoad}
          onRemoveTruckLoad={removeTruckLoad}
          onResetTrailerCount={resetTrailerCount}
          onUpdateGrainType={updateGrainType}
        />
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>© 2025 Silo Bin Measurer v1.0 - Created by Yogi Pangestu</p>
          <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
