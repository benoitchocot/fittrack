
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Exercise, Set } from "@/types/workout";
import { Trash, Plus, Minus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseFormProps {
  exercise: Exercise;
  onUpdate: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
  isActive?: boolean;
  dragHandleProps?: any;
}

const ExerciseForm = ({
  exercise,
  onUpdate,
  onDelete,
  isActive = false,
  dragHandleProps,
}: ExerciseFormProps) => {
  const [showComment, setShowComment] = useState(!!exercise.comment);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...exercise, name: e.target.value });
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...exercise, comment: e.target.value });
  };

  const addSet = () => {
    const newSet: Set = {
      id: Date.now().toString(),
      weight: 0,
      reps: 0,
      completed: false,
    };
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] });
  };

  const updateSet = (index: number, field: keyof Set, value: number | boolean) => {
    const newSets = [...exercise.sets];
    newSets[index] = { ...newSets[index], [field]: value };
    onUpdate({ ...exercise, sets: newSets });
  };

  const removeSet = (index: number) => {
    const newSets = exercise.sets.filter((_, i) => i !== index);
    onUpdate({ ...exercise, sets: newSets });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div {...dragHandleProps} className="drag-handle cursor-grab p-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 mx-2">
            <Input
              placeholder="Nom de l'exercice"
              value={exercise.name}
              onChange={handleNameChange}
              className="font-medium"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(exercise.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-muted-foreground">
            <div className="col-span-1">#</div>
            <div className="col-span-4 md:col-span-3">KG</div>
            <div className="col-span-4 md:col-span-3">REPS</div>
            {isActive && (
              <div className="col-span-2 md:col-span-4 text-center">FAIT</div>
            )}
            <div className="col-span-1"></div>
          </div>
          
          {exercise.sets.map((set, index) => (
            <div key={set.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
              <div className="col-span-1 text-sm text-muted-foreground">
                {index + 1}
              </div>
              <div className="col-span-4 md:col-span-3">
                <Input
                  type="number"
                  min="0"
                  value={set.weight}
                  onChange={(e) =>
                    updateSet(index, "weight", Number(e.target.value))
                  }
                  className="h-9"
                />
              </div>
              <div className="col-span-4 md:col-span-3">
                <Input
                  type="number"
                  min="0"
                  value={set.reps}
                  onChange={(e) =>
                    updateSet(index, "reps", Number(e.target.value))
                  }
                  className="h-9"
                />
              </div>
              {isActive && (
                <div className="col-span-2 md:col-span-4 flex justify-center">
                  <Button
                    type="button"
                    variant={set.completed ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-9 w-9",
                      set.completed && "bg-green-500 hover:bg-green-600"
                    )}
                    onClick={() =>
                      updateSet(index, "completed", !set.completed)
                    }
                  >
                    {set.completed ? "✓" : ""}
                  </Button>
                </div>
              )}
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => removeSet(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={addSet}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une série
          </Button>
        </div>
        
        {!showComment && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComment(true)}
            className="text-xs"
          >
            + Ajouter un commentaire
          </Button>
        )}
        
        {showComment && (
          <div className="mt-2">
            <Textarea
              placeholder="Commentaire"
              value={exercise.comment || ""}
              onChange={handleCommentChange}
              className="text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseForm;
