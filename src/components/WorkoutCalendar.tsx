import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkoutHistory } from '@/types/workout';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkoutCalendarProps {
  history: WorkoutHistory[];
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ history }) => {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const navigate = useNavigate();

  // Extraire toutes les dates uniques où il y a des séances
  const workoutDates = useMemo(() => {
    const dates = new Set<string>();
    history.forEach((workout) => {
      if (workout.logged_at) {
        // Convertir en date locale pour éviter les problèmes de fuseau horaire
        const date = new Date(workout.logged_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        dates.add(localDateStr);
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
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        counts.set(localDateStr, (counts.get(localDateStr) || 0) + 1);
      }
    });
    return counts;
  }, [history]);

  // Statistiques pour le mois sélectionné
  const monthStats = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    let totalWorkouts = 0;

    // Compter les jours uniques avec séances
    const uniqueDays = new Set<string>();
    history.forEach((workout) => {
      if (workout.logged_at) {
        const date = new Date(workout.logged_at);
        if (date.getFullYear() === year && date.getMonth() === month) {
          totalWorkouts++;
          const dateYear = date.getFullYear();
          const dateMonth = String(date.getMonth() + 1).padStart(2, '0');
          const dateDay = String(date.getDate()).padStart(2, '0');
          const localDateStr = `${dateYear}-${dateMonth}-${dateDay}`;
          uniqueDays.add(localDateStr);
        }
      }
    });

    return {
      daysWithWorkout: uniqueDays.size,
      totalWorkouts,
    };
  }, [selectedMonth, history]);

  // Fonction pour styliser les jours avec des séances
  const modifiers = useMemo(() => {
    const workoutDays: Date[] = [];
    workoutDates.forEach((dateStr) => {
      // dateStr est au format YYYY-MM-DD
      const [year, month, day] = dateStr.split('-').map(Number);
      // Créer une date locale (month - 1 car les mois commencent à 0 en JavaScript)
      workoutDays.push(new Date(year, month - 1, day));
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

  // Gestionnaire de clic sur un jour du calendrier
  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;

    // Formater la date cliquée en format local YYYY-MM-DD
    const clickedYear = day.getFullYear();
    const clickedMonth = String(day.getMonth() + 1).padStart(2, '0');
    const clickedDay = String(day.getDate()).padStart(2, '0');
    const clickedDateKey = `${clickedYear}-${clickedMonth}-${clickedDay}`;

    // Trouver toutes les séances pour ce jour
    const workoutsForDay = history.filter((workout) => {
      if (workout.logged_at) {
        const workoutDate = new Date(workout.logged_at);
        const year = workoutDate.getFullYear();
        const month = String(workoutDate.getMonth() + 1).padStart(2, '0');
        const day = String(workoutDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        return dateKey === clickedDateKey;
      }
      return false;
    });

    if (workoutsForDay.length === 0) {
      toast.info("Aucune séance enregistrée pour ce jour.");
      return;
    }

    // Si une ou plusieurs séances, naviguer vers la première
    // (on pourrait améliorer pour afficher un menu si plusieurs séances)
    if (workoutsForDay.length === 1) {
      navigate(`/history/${workoutsForDay[0].history_db_id}`);
    } else {
      // Plusieurs séances : naviguer vers la plus récente
      const sortedWorkouts = [...workoutsForDay].sort((a, b) => 
        new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
      );
      navigate(`/history/${sortedWorkouts[0].history_db_id}`);
      toast.info(`${workoutsForDay.length} séances trouvées. Affichage de la plus récente.`);
    }
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
              cursor: pointer !important;
            }
            .workout-day:hover {
              background-color: rgba(34, 197, 94, 0.4) !important;
              transform: scale(1.05);
              transition: all 0.2s ease-in-out;
            }
          `}
        </style>
        <Calendar
          mode="single"
          month={selectedMonth}
          onMonthChange={setSelectedMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          onDayClick={handleDayClick}
          className="rounded-md border"
        />
        <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-600 opacity-20"></div>
            <span>Jours avec séances (cliquez pour voir les détails)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutCalendar;
