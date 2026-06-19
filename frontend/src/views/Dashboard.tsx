import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { DashboardSummary } from '../lib/api';
import { 
  Scale, 
  Activity, 
  Dumbbell, 
  Layers, 
  Loader2, 
  ArrowRight,
  Database,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface DashboardProps {
  onNavigateToImport: () => void;
}

export default function Dashboard({ onNavigateToImport }: DashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for toggling metrics in chart
  const [showWeight, setShowWeight] = useState(true);
  const [showBodyFat, setShowBodyFat] = useState(false);
  const [showMuscle, setShowMuscle] = useState(false);

  // States for unit toggling on cards & graphs
  const [bodyFatUnit, setBodyFatUnit] = useState<'pct' | 'kg'>(() => {
    return (localStorage.getItem('fitdays_body_fat_unit') as 'pct' | 'kg') || 'pct';
  });
  const [muscleUnit, setMuscleUnit] = useState<'kg' | 'pct'>(() => {
    return (localStorage.getItem('fitdays_muscle_unit') as 'kg' | 'pct') || 'kg';
  });

  const handleBodyFatUnitChange = (unit: 'pct' | 'kg') => {
    setBodyFatUnit(unit);
    localStorage.setItem('fitdays_body_fat_unit', unit);
  };

  const handleMuscleUnitChange = (unit: 'kg' | 'pct') => {
    setMuscleUnit(unit);
    localStorage.setItem('fitdays_muscle_unit', unit);
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const data = await api.getSummary();
        setSummary(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard summary');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your body composition summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="bg-destructive/10 border border-destructive/25 text-destructive p-4 rounded-xl flex items-center gap-3">
          <Activity className="h-5 w-5 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Error Loading Dashboard</h3>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasRecords = summary && summary.total_records > 0;

  if (!hasRecords) {
    return (
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col justify-center items-center text-center">
        <div className="max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
            <Database className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No data imported yet</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Welcome to FitdaysWeb! To start visualizing your body composition changes, please import your Fitdays CSV export file first.
          </p>
          <button
            onClick={onNavigateToImport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-all shadow-md shadow-primary/10 hover:shadow-lg cursor-pointer"
          >
            <span>Import CSV Data</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Format date ticks for XAxis
  const formattedChartData = summary!.weight_history.map(point => ({
    ...point,
    displayDate: new Date(point.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    }),
  }));

  const formatChange = (val: number | null, unit: string, lowerIsBetter: boolean) => {
    if (val === null || val === undefined) return '0';
    const sign = val > 0 ? '+' : '';
    const formatted = `${sign}${val.toFixed(2)}${unit}`;
    
    let colorClass = 'text-muted-foreground bg-muted';
    if (val !== 0) {
      const isGood = val < 0 ? lowerIsBetter : !lowerIsBetter;
      colorClass = isGood 
        ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/15'
        : 'text-rose-700 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colorClass}`}>
        {formatted}
      </span>
    );
  };

  const getLatestDateString = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground m-0">Progress Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Analyzing {summary?.total_records} measurements since{' '}
            {summary?.first_record_date ? new Date(summary.first_record_date).toLocaleDateString() : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground self-start sm:self-center">
          <Calendar className="h-4 w-4" />
          <span>Latest record: {getLatestDateString(summary!.latest_record_date)}</span>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card: Total Records */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Logs</p>
            <h3 className="text-3xl font-bold">{summary?.total_records}</h3>
            <p className="text-xs text-muted-foreground">Body scans imported</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        {/* Card: Weight */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weight</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">{summary?.current_weight} <span className="text-sm font-normal text-muted-foreground">kg</span></h3>
              {formatChange(summary!.weight_change, ' kg', true)}
            </div>
            <p className="text-xs text-muted-foreground">Started at {summary?.starting_weight} kg</p>
          </div>
          <div className="p-3 bg-violet-500/10 text-violet-500 dark:text-violet-400 rounded-lg">
            <Scale className="h-5 w-5" />
          </div>
        </div>

        {/* Card: Body Fat */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2 flex-1 mr-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Body Fat</p>
              <div className="flex bg-muted p-0.5 rounded-md border border-border text-[10px]">
                <button
                  onClick={() => handleBodyFatUnitChange('pct')}
                  className={`px-2 py-0.5 rounded-sm font-semibold transition-all cursor-pointer ${
                    bodyFatUnit === 'pct'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  %
                </button>
                <button
                  onClick={() => handleBodyFatUnitChange('kg')}
                  className={`px-2 py-0.5 rounded-sm font-semibold transition-all cursor-pointer ${
                    bodyFatUnit === 'kg'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  kg
                </button>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">
                {bodyFatUnit === 'pct' ? (
                  <>
                    {summary?.current_body_fat}{' '}
                    <span className="text-sm font-normal text-muted-foreground">%</span>
                  </>
                ) : (
                  <>
                    {summary?.current_body_fat_mass}{' '}
                    <span className="text-sm font-normal text-muted-foreground">kg</span>
                  </>
                )}
              </h3>
              {bodyFatUnit === 'pct'
                ? formatChange(summary!.body_fat_change, '%', true)
                : formatChange(summary!.body_fat_mass_change, ' kg', true)}
            </div>
            <p className="text-xs text-muted-foreground">
              Started at {bodyFatUnit === 'pct' ? `${summary?.starting_body_fat}%` : `${summary?.starting_body_fat_mass} kg`}
            </p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-lg shrink-0">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* Card: Skeletal Muscle */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-start justify-between">
          <div className="space-y-2 flex-1 mr-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skeletal Muscle</p>
              <div className="flex bg-muted p-0.5 rounded-md border border-border text-[10px]">
                <button
                  onClick={() => handleMuscleUnitChange('pct')}
                  className={`px-2 py-0.5 rounded-sm font-semibold transition-all cursor-pointer ${
                    muscleUnit === 'pct'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  %
                </button>
                <button
                  onClick={() => handleMuscleUnitChange('kg')}
                  className={`px-2 py-0.5 rounded-sm font-semibold transition-all cursor-pointer ${
                    muscleUnit === 'kg'
                      ? 'bg-card text-foreground shadow-xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  kg
                </button>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">
                {muscleUnit === 'kg' ? (
                  <>
                    {summary?.current_skeletal_muscle_mass}{' '}
                    <span className="text-sm font-normal text-muted-foreground">kg</span>
                  </>
                ) : (
                  <>
                    {summary?.current_skeletal_muscle_mass_pct}{' '}
                    <span className="text-sm font-normal text-muted-foreground">%</span>
                  </>
                )}
              </h3>
              {muscleUnit === 'kg'
                ? formatChange(summary!.skeletal_muscle_mass_change, ' kg', false)
                : formatChange(summary!.skeletal_muscle_mass_pct_change, '%', false)}
            </div>
            <p className="text-xs text-muted-foreground">
              Started at {muscleUnit === 'kg' ? `${summary?.starting_skeletal_muscle_mass} kg` : `${summary?.starting_skeletal_muscle_mass_pct}%`}
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-lg shrink-0">
            <Dumbbell className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Main Charts Widget */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
        
        {/* Chart Header + Toggles */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground">Body Composition History</h3>
            <p className="text-xs text-muted-foreground">Toggle layers to customize the history comparison chart</p>
          </div>
          
          {/* Interactive Multi-Select Toggles */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowWeight(!showWeight)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showWeight 
                  ? 'bg-violet-500/10 border-violet-500/40 text-violet-600 dark:text-violet-400 font-bold' 
                  : 'bg-background border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`h-2.5 w-2.5 rounded-full bg-violet-500 ${showWeight ? 'scale-100' : 'scale-50 opacity-40'} transition-transform`} />
              <span>Weight (kg)</span>
            </button>
            
            <button
              onClick={() => setShowBodyFat(!showBodyFat)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showBodyFat 
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold' 
                  : 'bg-background border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`h-2.5 w-2.5 rounded-full bg-rose-500 ${showBodyFat ? 'scale-100' : 'scale-50 opacity-40'} transition-transform`} />
              <span>Body Fat ({bodyFatUnit === 'pct' ? '%' : 'kg'})</span>
            </button>
            
            <button
              onClick={() => setShowMuscle(!showMuscle)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showMuscle 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold' 
                  : 'bg-background border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`h-2.5 w-2.5 rounded-full bg-emerald-500 ${showMuscle ? 'scale-100' : 'scale-50 opacity-40'} transition-transform`} />
              <span>Skeletal Muscle ({muscleUnit === 'kg' ? 'kg' : '%'})</span>
            </button>
          </div>
        </div>

        {/* The Chart Container */}
        <div className="h-[400px] w-full">
          {(!showWeight && !showBodyFat && !showMuscle) ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Please select at least one metric above to display the chart lines.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.6} />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="var(--color-muted-foreground)" 
                  fontSize={11}
                  tickLine={false}
                  dy={10}
                />
                
                {/* Single YAxis is fine as we can use custom domain labels or separate values inside tooltips */}
                <YAxis 
                  stroke="var(--color-muted-foreground)" 
                  fontSize={11}
                  tickLine={false}
                  dx={-5}
                  domain={['auto', 'auto']}
                />
                
                <Tooltip
                  formatter={(value: any, name?: any) => {
                    const valNum = typeof value === 'number' ? value.toFixed(1) : value;
                    const nameStr = name || '';
                    if (nameStr.includes('%')) return [`${valNum}%`, nameStr];
                    if (nameStr.includes('kg')) return [`${valNum} kg`, nameStr];
                    return [valNum, nameStr];
                  }}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '0.75rem',
                    color: 'var(--color-foreground)',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px' }}
                />

                {showWeight && (
                  <Line
                    name="Weight (kg)"
                    type="monotone"
                    dataKey="weight"
                    stroke="#8b5cf6" // Violet
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                )}

                {showBodyFat && (
                  <Line
                    name={`Body Fat (${bodyFatUnit === 'pct' ? '%' : 'kg'})`}
                    type="monotone"
                    dataKey={bodyFatUnit === 'pct' ? 'body_fat_pct' : 'body_fat_mass'}
                    stroke="#f43f5e" // Rose
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                )}

                {showMuscle && (
                  <Line
                    name={`Skeletal Muscle (${muscleUnit === 'kg' ? 'kg' : '%'})`}
                    type="monotone"
                    dataKey={muscleUnit === 'kg' ? 'skeletal_muscle_mass' : 'skeletal_muscle_mass_pct'}
                    stroke="#10b981" // Emerald
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
