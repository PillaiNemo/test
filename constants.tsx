
import React from 'react';
import { 
  Activity, 
  Book, 
  Zap, 
  Flame, 
  Wind, 
  Footprints,
  Calendar,
  LayoutDashboard,
  BarChart2,
  Settings as SettingsIcon
} from 'lucide-react';
import { Habit } from './types';

export const INITIAL_HABITS: Habit[] = [
  { id: '1', name: 'Exercise', icon: 'Activity', color: '#58a6ff' },
  { id: '2', name: 'Read', icon: 'Book', color: '#bc8cff' },
  { id: '3', name: 'Meditate', icon: 'Wind', color: '#7ee787' },
  { id: '4', name: '1000cal', icon: 'Zap', color: '#ffa657' },
  { id: '5', name: 'Run 10km', icon: 'Flame', color: '#ff7b72' },
];

// Added preset icons for the habit configuration UI
export const PRESET_ICONS = ['Activity', 'Book', 'Wind', 'Zap', 'Flame', 'Footprints', 'Calendar'];

// Added preset colors for the habit configuration UI
export const PRESET_COLORS = [
  '#58a6ff', // Blue
  '#bc8cff', // Purple
  '#7ee787', // Green
  '#ffa657', // Orange
  '#ff7b72', // Red
  '#3fb950', // Dark Green
  '#f85149', // Bright Red
  '#d29922', // Gold
  '#1f6feb'  // Royal Blue
];

export const getIcon = (name: string, size = 16, className = "") => {
  switch (name) {
    case 'Activity': return <Activity size={size} className={className} />;
    case 'Book': return <Book size={size} className={className} />;
    case 'Wind': return <Wind size={size} className={className} />;
    case 'Zap': return <Zap size={size} className={className} />;
    case 'Flame': return <Flame size={size} className={className} />;
    case 'Footprints': return <Footprints size={size} className={className} />;
    case 'Calendar': return <Calendar size={size} className={className} />;
    case 'Dashboard': return <LayoutDashboard size={size} className={className} />;
    case 'Summary': return <BarChart2 size={size} className={className} />;
    case 'Settings': return <SettingsIcon size={size} className={className} />;
    default: return null;
  }
};