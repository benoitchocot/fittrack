import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkoutTemplate } from "@/types/workout";
import { Edit, MoreVertical, Play, Trash } from "lucide-react";

interface WorkoutCardProps {
  workout: WorkoutTemplate;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
}

const WorkoutCard = ({ workout, onDelete, onStart }: WorkoutCardProps) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <Card className="workout-card">
      <div className="workout-card-accent"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{workout.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link
                  to={`/templates/edit/${workout.id}`}
                  className="flex items-center"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Modifier</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center text-destructive focus:text-destructive"
                onClick={() => onDelete(workout.id)}
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Supprimer</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          {workout.exercises && Array.isArray(workout.exercises)
            ? workout.exercises.length
            : 0}{" "}
          exercice
          {(workout.exercises && Array.isArray(workout.exercises)
            ? workout.exercises.length
            : 0) !== 1
            ? "s"
            : ""}
        </div>
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {new Date(workout.updatedAt).toLocaleDateString("fr-FR")}
          </div>
          <Button
            size="sm"
            className="bg-workout-primary hover:bg-workout-dark"
            onClick={() => onStart(workout.id)}
          >
            <Play className="h-4 w-4 mr-2" />
            Démarrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutCard;
