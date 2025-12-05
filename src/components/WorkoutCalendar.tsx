import React, { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutHistory } from '@/types/workout';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WorkoutCalendarProps {
  history: WorkoutHistory[];
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ history }) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  // Extraire toutes les dates uniques où il y a des séances
  const workoutDates = useMemo(() => {
    const dates = new Set<string>();
    history.forEach((workout) => {
      if (workout.logged_at) {
        const date = new Date(workout.logged_at);
        // Normaliser la date au début de la journée
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        dates.add(normalizedDate.toISOString().split('T')[0]);
      }
    });
    return dates;
  }, [history]);

  // Compter le nombre de séances par jour
  const workoutCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach((workout) => {
      if (workout.logged_at) {
        const date = new Date(workout.logged_at);
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dateKey = normalizedDate.toISOString().split('T')[0];
        counts.set(dateKey, (counts.get(dateKey) || 0) + 1);
      }
    });
    return counts;
  }, [history]);

  // Statistiques pour le mois sélectionné
  const monthStats = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    let daysWithWorkout = 0;
    let totalWorkouts = 0;

    history.forEach((workout) => {
      if (workout.logged_at) {
        const date = new Date(workout.logged_at);
        if (date.getFullYear() === year && date.getMonth() === month) {
          totalWorkouts++;
          const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          const dateKey = normalizedDate.toISOString().split('T')[0];
          if (workoutCountByDate.get(dateKey) === 1) {
            daysWithWorkout++;
          }
        }
      }
    });

    // Compter les jours uniques avec séances
    const uniqueDays = new Set<string>();
    history.forEach((workout) => {
      if (workout.logged_at) {
        const date = new Date(workout.logged_at);
        if (date.getFullYear() === year && date.getMonth() === month) {
          const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
          uniqueDays.add(normalizedDate.toISOString().split('T')[0]);
        }
      }
    });

    return {
      daysWithWorkout: uniqueDays.size,
      totalWorkouts,
    };
  }, [selectedMonth, history, workoutCountByDate]);

  // Fonction pour styliser les jours avec des séances
  const modifiers = useMemo(() => {
    const workoutDays: Date[] = [];
    workoutDates.forEach((dateStr) => {
      workoutDays.push(new Date(dateStr + 'T00:00:00'));
    });
    return {
      workout: workoutDays,
    };
  }, [workoutDates]);

  const modifiersStyles = {
    workout: {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      color: 'rgb(22, 163, 74)',
      fontWeight: 'bold',
      borderRadius: '50%',
    },
  };

  const modifiersClassNames = {
    workout: 'workout-day',
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Vue d'ensemble des séances</span>
          <div className="flex gap-2">
            <Badge variant="default" className="text-sm bg-green-600">
              {monthStats.totalWorkouts} séance{monthStats.totalWorkouts > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <style>
          {`
            .workout-day {
              background-color: rgba(34, 197, 94, 0.2) !important;
              color: rgb(22, 163, 74) !important;
              font-weight: bold !important;
            }
            .workout-day:hover {
              background-color: rgba(34, 197, 94, 0.3) !important;
            }
          `}
        </style>
        <Calendar
          mode="single"
          month={selectedMonth}
          onMonthChange={setSelectedMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border"
        />
        <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-600 opacity-20"></div>
            <span>Jours avec séances</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutCalendar;
