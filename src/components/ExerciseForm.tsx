
import React, { useState, useEffect, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Exercise, Set } from "@/types/workout";
import { Trash, Plus, Minus, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseFormProps {
  exercise: Exercise;
  onUpdate: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
  isActive?: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  exerciseIndex: number;
  totalExercises: number;
  lastPerformanceData?: Array<{ weight: number | null; reps: number | null } | null> | null;
}

const ExerciseForm = ({
  exercise,
  onUpdate,
  onDelete,
  isActive = false,
  onMoveUp,
  onMoveDown,
  exerciseIndex,
  totalExercises,
  lastPerformanceData,
}: ExerciseFormProps) => {
  const [showComment, setShowComment] = useState(!!exercise.comment);
  const [exerciseNameInput, setExerciseNameInput] = useState(exercise.name);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allExercises, setAllExercises] = useState<string[]>([]);

  useEffect(() => {
    fetch("/exercices.json")
      .then((response) => response.json())
      .then((data: { name: string }[]) => {
        setAllExercises(data.map(item => item.name));
      })
      .catch((error) => {
        console.error("Error fetching exercises.json:", error);
        // Handle error appropriately, maybe a toast message
      });
  }, []);

  useEffect(() => {
    // Update internal state if exercise prop changes from parent
    setExerciseNameInput(exercise.name);
  }, [exercise.name]);


  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExerciseNameInput(value);
    onUpdate({ ...exercise, name: value }); // Update parent immediately or on blur/selection

    if (value.length > 1) { // Start suggesting after 2 characters
      const normalizedQuery = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const filtered = allExercises.filter(exName => 
        exName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(normalizedQuery)
      );
      setSuggestions(filtered.slice(0, 10)); // Show top 10 suggestions
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestionName: string) => {
    setExerciseNameInput(suggestionName);
    onUpdate({ ...exercise, name: suggestionName });
    setSuggestions([]);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...exercise, comment: e.target.value });
  };

  const addSet = () => {
    const newSet: Set = {
      id: Date.now().toString(),
      weight: null,
      reps: null,
      completed: false,
    };
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] });
  };

  const updateSet = (index: number, field: keyof Set, value: number | boolean | null) => {
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
           <div className="flex-1 mr-2 relative"> {/* Added relative positioning here */}
            <Input
              placeholder="Nom de l'exercice"
              value={exerciseNameInput}
              onChange={handleNameChange}
              onBlur={() => setTimeout(() => setSuggestions([]), 100)} // Hide suggestions on blur with a small delay
              className="font-medium"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {suggestions.map((name, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(name)}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveUp(exercise.id)}
              disabled={exerciseIndex === 0}
              className="p-1"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveDown(exercise.id)}
              disabled={exerciseIndex === totalExercises - 1}
              className="p-1"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(exercise.id)}
              className="ml-2 p-1"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
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
                  value={set.weight === 0 ? null : set.weight ?? ''}
                  onChange={(e) =>
                    updateSet(index, "weight", e.target.value === '' ? null : parseFloat(e.target.value))
                  }
                  className="h-9"
                />
                {/* Display historical data for THIS set's weight input, if available and completed */}
                {lastPerformanceData && lastPerformanceData[index] && lastPerformanceData[index]?.weight !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dernier: {lastPerformanceData[index]?.weight}kg
                  </p>
                )}
              </div>
              <div className="col-span-4 md:col-span-3">
                <Input
                  type="number"
                  min="0"
                  value={set.reps === 0 ? null : set.reps ?? ''}
                  onChange={(e) =>
                    updateSet(index, "reps", e.target.value === '' ? null : parseInt(e.target.value, 10))
                  }
                  className="h-9"
                />
                {/* Display historical data for THIS set's reps input, if available and completed */}
                {lastPerformanceData && lastPerformanceData[index] && lastPerformanceData[index]?.reps !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dernier: {lastPerformanceData[index]?.reps} reps
                  </p>
                )}
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
