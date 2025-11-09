import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ManualLoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tons: number, loadType: 'trailer' | 'wagon' | 'custom') => void;
  type: 'inload' | 'outload';
  binName: string;
  systemSettings: {
    tonsPerTrailer: number;
    tonsPerWagon: number;
  };
}

export function ManualLoadDialog({ isOpen, onClose, onConfirm, type, binName, systemSettings }: ManualLoadDialogProps) {
  const [tons, setTons] = useState<string>('');
  const [loadType, setLoadType] = useState<'trailer' | 'wagon' | 'custom'>('trailer');

  // Update tons when systemSettings change or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (loadType === 'trailer') {
        setTons(systemSettings.tonsPerTrailer.toString());
      } else if (loadType === 'wagon') {
        setTons(systemSettings.tonsPerWagon.toString());
      }
    }
  }, [systemSettings, isOpen, loadType]);

  // Update tons when load type changes
  const handleLoadTypeChange = (newLoadType: 'trailer' | 'wagon' | 'custom') => {
    setLoadType(newLoadType);
    if (newLoadType === 'trailer') {
      setTons(systemSettings.tonsPerTrailer.toString());
    } else if (newLoadType === 'wagon') {
      setTons(systemSettings.tonsPerWagon.toString());
    } else {
      setTons('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tonsValue = parseFloat(tons);
    if (!isNaN(tonsValue) && tonsValue > 0) {
      onConfirm(tonsValue, loadType);
      setTons('');
      setLoadType('trailer');
      onClose();
    }
  };

  const handleCancel = () => {
    setTons('');
    setLoadType('trailer');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'inload' ? (
              <>
                <TrendingUp className="h-5 w-5 text-green-500" />
                Manual Inload
              </>
            ) : (
              <>
                <TrendingDown className="h-5 w-5 text-red-500" />
                Manual Outload
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Load Type</Label>
            <Select value={loadType} onValueChange={handleLoadTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select load type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trailer">
                  Trailer ({systemSettings.tonsPerTrailer} tons)
                </SelectItem>
                <SelectItem value="wagon">
                  Wagon Train ({systemSettings.tonsPerWagon} tons)
                </SelectItem>
                <SelectItem value="custom">
                  Custom Amount
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tons">Amount (tons)</Label>
            <Input
              id="tons"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="Enter amount in tons"
              value={tons}
              onChange={(e) => setTons(e.target.value)}
              className="w-full"
              autoFocus
            />
            {loadType !== 'custom' && (
              <p className="text-xs text-muted-foreground">
                Default amount for {loadType}: {loadType === 'trailer' ? systemSettings.tonsPerTrailer : systemSettings.tonsPerWagon} tons (you can customize this value)
              </p>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {type === 'inload' 
              ? `This will add ${tons || '0'} tons to ${binName}`
              : `This will remove ${tons || '0'} tons from ${binName}`
            }
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!tons || parseFloat(tons) <= 0}
              className={type === 'inload' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {type === 'inload' ? 'Add' : 'Remove'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
