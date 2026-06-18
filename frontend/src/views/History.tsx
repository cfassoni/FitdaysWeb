import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { FitdaysRecord } from '../lib/api';
import { 
  Loader2, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  X,
  Scale,
  Activity,
  Dumbbell,
  Heart,
  Droplet,
  UserCheck
} from 'lucide-react';

export default function History() {
  const [records, setRecords] = useState<FitdaysRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Table search and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof FitdaysRecord>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Drawer state
  const [selectedRecord, setSelectedRecord] = useState<FitdaysRecord | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true);
        const data = await api.getRecords();
        setRecords(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load records');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const handleSort = (field: keyof FitdaysRecord) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending
    }
  };

  const getSortedRecords = () => {
    return [...records]
      .filter(record => {
        const formattedDate = new Date(record.date).toLocaleDateString().toLowerCase();
        return formattedDate.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Handle date comparison
        if (sortField === 'date') {
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
        }

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  };

  const renderSortIcon = (field: keyof FitdaysRecord) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1 text-primary" />
    );
  };

  const formatSegmentValue = (value: number | null | undefined, unit: string = '') => {
    if (value === null || value === undefined) return '-';
    return `${value.toFixed(2)}${unit}`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your measurements history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="bg-destructive/10 border border-destructive/25 text-destructive p-4 rounded-xl flex items-center gap-3">
          <X className="h-5 w-5 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Error Loading History</h3>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedRecords = getSortedRecords();

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground m-0">Measurement History</h1>
        <p className="text-sm text-muted-foreground">
          View, search, and deep-dive into all recorded body composition logs
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-muted-foreground flex items-center pointer-events-none" />
          <input
            type="text"
            placeholder="Search by date (e.g. 18/06)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground transition-all"
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium self-end sm:self-center">
          Showing {sortedRecords.length} of {records.length} records
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {sortedRecords.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No measurements match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-foreground">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold text-xs tracking-wider uppercase">
                <tr>
                  <th 
                    onClick={() => handleSort('date')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    Date & Time {renderSortIcon('date')}
                  </th>
                  <th 
                    onClick={() => handleSort('weight')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    Weight (kg) {renderSortIcon('weight')}
                  </th>
                  <th 
                    onClick={() => handleSort('bmi')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    BMI {renderSortIcon('bmi')}
                  </th>
                  <th 
                    onClick={() => handleSort('body_fat_pct')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    Body Fat (%) {renderSortIcon('body_fat_pct')}
                  </th>
                  <th 
                    onClick={() => handleSort('muscle_mass')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    Muscle Mass (kg) {renderSortIcon('muscle_mass')}
                  </th>
                  <th 
                    onClick={() => handleSort('body_score')}
                    className="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  >
                    Body Score {renderSortIcon('body_score')}
                  </th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedRecords.map(record => (
                  <tr 
                    key={record.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      {new Date(record.date).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.weight.toFixed(1)} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.bmi.toFixed(1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.body_fat_pct.toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">{record.muscle_mass.toFixed(1)} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        record.body_score >= 80 
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      }`}>
                        {record.body_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Side Sheet/Drawer (Radix-like custom markup) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setSelectedRecord(null)}
          />

          {/* Sheet Body */}
          <div className="relative w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 z-10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h3 className="text-xl font-bold text-foreground">Body Composition Report</h3>
                <p className="text-xs text-muted-foreground">
                  Scan date:{' '}
                  <span className="font-semibold text-foreground">
                    {new Date(selectedRecord.date).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted border border-border"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Report Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Highlight Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/40 border border-border p-4 rounded-xl text-center space-y-1">
                  <div className="mx-auto h-7 w-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
                    <Scale className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">Weight</p>
                  <p className="text-lg font-bold">{selectedRecord.weight.toFixed(1)} kg</p>
                </div>
                
                <div className="bg-muted/40 border border-border p-4 rounded-xl text-center space-y-1">
                  <div className="mx-auto h-7 w-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Activity className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">Body Fat</p>
                  <p className="text-lg font-bold">{selectedRecord.body_fat_pct.toFixed(1)}%</p>
                </div>

                <div className="bg-muted/40 border border-border p-4 rounded-xl text-center space-y-1">
                  <div className="mx-auto h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">Muscle</p>
                  <p className="text-lg font-bold">{selectedRecord.muscle_mass.toFixed(1)} kg</p>
                </div>
              </div>

              {/* Core Health Indicators */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span>Core Indicators</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <span className="block text-xs text-muted-foreground">BMI</span>
                    <span className="text-sm font-semibold">{selectedRecord.bmi.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Body Score</span>
                    <span className="text-sm font-semibold">{selectedRecord.body_score} / 100</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Metabolic Age</span>
                    <span className="text-sm font-semibold">{selectedRecord.metabolic_age.toFixed(0)} yrs</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">BMR</span>
                    <span className="text-sm font-semibold">{selectedRecord.bmr.toFixed(0)} kcal</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Obesity Score</span>
                    <span className="text-sm font-semibold">{selectedRecord.obesity_score}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Fat Free Mass</span>
                    <span className="text-sm font-semibold">{selectedRecord.fat_free_mass.toFixed(1)} kg</span>
                  </div>
                </div>
              </div>

              {/* Fat & Fluids breakdown */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-sky-500" />
                  <span>Adiposity & Hydration</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <span className="block text-xs text-muted-foreground">Subcutaneous Fat</span>
                    <span className="text-sm font-semibold">{selectedRecord.subcutaneous_fat_pct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Visceral Fat Level</span>
                    <span className="text-sm font-semibold">{selectedRecord.visceral_fat}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Fat Mass</span>
                    <span className="text-sm font-semibold">{selectedRecord.fat_mass.toFixed(1)} kg</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Body Water %</span>
                    <span className="text-sm font-semibold">{selectedRecord.body_water_pct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Moisture Content</span>
                    <span className="text-sm font-semibold">{selectedRecord.moisture_content.toFixed(1)} kg</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Protein %</span>
                    <span className="text-sm font-semibold">{selectedRecord.protein_pct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Cardiovascular & Skeletal */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span>Cardiorespiratory & Skeletal</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                  <div>
                    <span className="block text-xs text-muted-foreground">Heart Rate</span>
                    <span className="text-sm font-semibold">{selectedRecord.heart_rate || '-'} bpm</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Heart Index</span>
                    <span className="text-sm font-semibold">{selectedRecord.heart_index || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Bone Mass</span>
                    <span className="text-sm font-semibold">{selectedRecord.bone_mass.toFixed(2)} kg</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Skeletal Muscle %</span>
                    <span className="text-sm font-semibold">{selectedRecord.skeletal_muscle_mass_pct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Skeletal Muscle Mass</span>
                    <span className="text-sm font-semibold">{selectedRecord.skeletal_muscle_mass.toFixed(1)} kg</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">SMI (Skeletal Muscle Index)</span>
                    <span className="text-sm font-semibold">{selectedRecord.smi || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Segmental Body Composition (Right Arm, Left Arm, Trunk, Right Leg, Left Leg) */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-foreground px-1">Segmental Body Composition</h4>
                
                <div className="space-y-3">
                  {[
                    { title: 'Right Arm', prefix: 'right_arm' },
                    { title: 'Left Arm', prefix: 'left_arm' },
                    { title: 'Trunk', prefix: 'trunk' },
                    { title: 'Right Leg', prefix: 'right_leg' },
                    { title: 'Left Leg', prefix: 'left_leg' }
                  ].map(segment => {
                    const fatMass = selectedRecord[`${segment.prefix}_fat_mass` as keyof FitdaysRecord] as number | null;
                    const fatPct = selectedRecord[`${segment.prefix}_fat_pct` as keyof FitdaysRecord] as number | null;
                    const fatLevel = selectedRecord[`${segment.prefix}_fat_level` as keyof FitdaysRecord] as string | null;
                    
                    const musMass = selectedRecord[`${segment.prefix}_muscle_mass` as keyof FitdaysRecord] as number | null;
                    const musPct = selectedRecord[`${segment.prefix}_muscle_pct` as keyof FitdaysRecord] as number | null;
                    const musLevel = selectedRecord[`${segment.prefix}_muscle_level` as keyof FitdaysRecord] as string | null;

                    const impHigh = selectedRecord[`${segment.prefix}_impedance_high` as keyof FitdaysRecord] as number | null;
                    const impLow = selectedRecord[`${segment.prefix}_impedance_low` as keyof FitdaysRecord] as number | null;

                    // Skip displaying segment if fatMass is completely missing (some hardware doesn't do 8-electrode segmental scan)
                    if (fatMass === null) return null;

                    return (
                      <div key={segment.prefix} className="bg-card border border-border rounded-xl p-4 space-y-3">
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider block">{segment.title}</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          
                          {/* Segment Fat */}
                          <div className="bg-muted/30 border border-border p-2 rounded-lg text-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Fat Mass</span>
                            <span className="text-xs font-bold text-rose-500">{formatSegmentValue(fatMass, ' kg')}</span>
                            <span className="block text-[9px] text-muted-foreground mt-0.5">{formatSegmentValue(fatPct, '%')} ({fatLevel || 'Normal'})</span>
                          </div>

                          {/* Segment Muscle */}
                          <div className="bg-muted/30 border border-border p-2 rounded-lg text-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Muscle Mass</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatSegmentValue(musMass, ' kg')}</span>
                            <span className="block text-[9px] text-muted-foreground mt-0.5">{formatSegmentValue(musPct, '%')} ({musLevel || 'Normal'})</span>
                          </div>

                          {/* Impedance High */}
                          <div className="bg-muted/30 border border-border p-2 rounded-lg text-center flex flex-col justify-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Impedance H</span>
                            <span className="text-xs font-bold">{formatSegmentValue(impHigh, ' Ω')}</span>
                          </div>

                          {/* Impedance Low */}
                          <div className="bg-muted/30 border border-border p-2 rounded-lg text-center flex flex-col justify-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Impedance L</span>
                            <span className="text-xs font-bold">{formatSegmentValue(impLow, ' Ω')}</span>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
