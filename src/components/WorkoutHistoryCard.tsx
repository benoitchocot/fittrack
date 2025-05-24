
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkoutHistory } from "@/types/workout";

interface WorkoutHistoryCardProps {
  workout: WorkoutHistory;
}

const WorkoutHistoryCard = ({ workout }: WorkoutHistoryCardProps) => {
  if (!workout || !workout.exercises || !Array.isArray(workout.exercises)) {
    console.error('Invalid workout data passed to WorkoutHistoryCard:', workout);
    return (
      <Card className="workout-card mb-4 border-red-500">
        <CardHeader>
          <CardTitle className="text-red-500">Données d'historique invalides</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            L'objet 'workout' ou son champ 'exercises' est manquant ou malformé.
          </p>
          <pre className="text-xs mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
            {JSON.stringify(workout, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  }

  // Calculate total volume (weight * reps)
  const totalVolume = workout.exercises.reduce((sum, exercise) => {
    return sum + exercise.sets.reduce((setSum, set) => {
      return setSum + (set.completed ? set.weight * set.reps : 0);
    }, 0);
  }, 0);

  // Calculate duration in minutes
  const durationMinutes = Math.floor(
    (new Date(workout.finishedAt).getTime() - new Date(workout.startedAt).getTime()) / 
    (1000 * 60)
  );

  // Format date as "Day Month" (e.g., "15 Mai")
  // Use finishedAt as the primary display date, since both startedAt and finishedAt are derived from logged_at
  const formattedDate = new Date(workout.finishedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <Card className="workout-card mb-4">
      <div className="workout-card-accent"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{workout.name}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {formattedDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Exercices</p>
            <p className="font-medium">{workout.exercises.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Durée</p>
            <p className="font-medium">{durationMinutes} min</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Volume</p>
            <p className="font-medium">{totalVolume} kg</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutHistoryCard;
