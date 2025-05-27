
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Import Button
import { WorkoutHistory } from "@/types/workout";
import { Link } from 'react-router-dom';

interface WorkoutHistoryCardProps {
  workout: WorkoutHistory;
}

const WorkoutHistoryCard = ({ workout }: WorkoutHistoryCardProps) => {
  // Validate the structure based on the updated WorkoutHistory type
  if (!workout || !workout.workout_details || !workout.workout_details.exercises || !Array.isArray(workout.workout_details.exercises) || !workout.workout_details.name || !workout.workout_details.startedAt || !workout.workout_details.finishedAt || !workout.history_db_id) {
    console.error('Invalid workout data passed to WorkoutHistoryCard:', workout);
    return (
      <Card className="workout-card mb-4 border-red-500">
        <CardHeader>
          <CardTitle className="text-red-500">Données d'historique invalides</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            L'objet 'workout.workout_details' ou ses champs ('name', 'exercises', 'startedAt', 'finishedAt') sont manquants ou malformés.
          </p>
          <pre className="text-xs mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
            {JSON.stringify(workout, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  }

  const { name, exercises, startedAt, finishedAt } = workout.workout_details;

  // Calculate total volume (weight * reps)
  const totalVolume = exercises.reduce((sum, exercise) => {
    return sum + exercise.sets.reduce((setSum, set) => {
      return setSum + (set.completed ? set.weight * set.reps : 0);
    }, 0);
  }, 0);

  // Calculate duration in minutes
  const durationMinutes = Math.floor(
    (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) /
    (1000 * 60)
  );

  // Format date as "Day Month" (e.g., "15 Mai")
  const formattedDate = new Date(finishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <Card className="workout-card mb-4">
      <div className="workout-card-accent"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {formattedDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Exercices</p>
            <p className="font-medium">{exercises.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Durée</p>
            <p className="font-medium">{durationMinutes > 0 ? `${durationMinutes} min` : "< 1 min"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Volume</p>
            <p className="font-medium">{totalVolume} kg</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-4 w-full">
          <Link to={`/history/${workout.history_db_id}`}>
            Afficher les détails
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkoutHistoryCard;
