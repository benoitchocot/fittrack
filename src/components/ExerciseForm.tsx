
import React, { useState, useEffect, ChangeEvent } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Exercise, Set } from "@/types/workout";
import { Trash, Plus, Minus, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper functions for time conversion (can be moved to a utils file)
const secondsToTimeInput = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds == null || totalSeconds === 0) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const timeInputToSeconds = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  let totalSeconds = 0;
  if (parts.length === 3) totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) totalSeconds = parts[0] * 60 + parts[1];
  else return null;
  return totalSeconds;
};

interface ExerciseFormProps {
  exercise: Exercise;
  onUpdate: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
  isActive?: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  exerciseIndex: number;
  totalExercises: number;
  // lastPerformanceData structure might need to be adapted based on exerciseType
  lastPerformanceData?: Array<{ weight: number | null; reps: number | null; duration?: number | null; /* Removed setType from here as it's per exercise */ } | null> | null;
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
  // Ensure exercise has exerciseType initialized, default to 'reps'
  // This effect also handles cases where exercise prop might change from parent
  useEffect(() => {
    if (exercise && exercise.exerciseType === undefined) {
      onUpdate({ ...exercise, exerciseType: 'reps' });
    }
  }, [exercise, onUpdate]);

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
    // Also re-evaluate if exercise.exerciseType needs to be set,
    // though the above useEffect should handle the initial undefined case.
    if (exercise && exercise.exerciseType === undefined) {
      onUpdate({ ...exercise, exerciseType: 'reps' });
    }
  }, [exercise, exercise.name, onUpdate]);


  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExerciseNameInput(value);
    onUpdate({ ...exercise, name: value });
  };

  const handleExerciseTypeChange = (newType: 'reps' | 'timer') => {
    const updatedSets = exercise.sets.map(s => ({
      ...s,
      reps: newType === 'reps' ? s.reps : null, // Keep current reps if switching to reps, else nullify
      duration: newType === 'timer' ? s.duration : null, // Keep current duration if switching to timer, else nullify
    }));
    onUpdate({ ...exercise, exerciseType: newType, sets: updatedSets });
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
      reps: null, // Initialize to null, user will fill it based on exerciseType
      duration: null, // Initialize to null, user will fill it based on exerciseType
      completed: false,
    };
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] });
  };

  const updateSet = (index: number, field: keyof Set, value: any) => {
    const newSets = [...exercise.sets];
    let updatedSet = { ...newSets[index], [field]: value };

    if (field === 'duration' && typeof value === 'string') {
      updatedSet.duration = timeInputToSeconds(value);
    }
    
    newSets[index] = updatedSet;
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
                {suggestions.map((name, idx) => (
                  <li
                    key={idx}
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
        {/* Exercise Type Selector */}
        <div className="mt-2 mb-1">
          <RadioGroup
            value={exercise.exerciseType || 'reps'}
            onValueChange={handleExerciseTypeChange}
            className="flex space-x-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="reps" id={`ex-reps-${exercise.id}`} className="h-4 w-4" />
              <Label htmlFor={`ex-reps-${exercise.id}`} className="text-xs font-normal cursor-pointer">REPS</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="timer" id={`ex-timer-${exercise.id}`} className="h-4 w-4" />
              <Label htmlFor={`ex-timer-${exercise.id}`} className="text-xs font-normal cursor-pointer">TIMER</Label>
            </div>
          </RadioGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          {/* Unified Header Row */}
          <div className="grid grid-cols-12 gap-x-2 gap-y-1 mb-2 text-xs font-medium text-muted-foreground items-center">
            <div className="col-span-1">#</div>
            {/* Reduced KG column width */}
            <div className="col-span-3 sm:col-span-2">KG</div> 
            {/* Adjusted VALEUR column width to take remaining space */}
            <div className="col-span-5 sm:col-span-5">{exercise.exerciseType === 'reps' ? 'RÉPÉTITIONS' : 'TEMPS'}</div>
            {isActive && (
              <div className="col-span-2 sm:col-span-3 text-center">FAIT</div>
            )}
            <div className="col-span-1 sm:col-span-1 text-right">DEL</div>
          </div>
          
          {exercise.sets.map((set, index) => (
            <div key={set.id} className="grid grid-cols-12 gap-x-2 gap-y-1 mb-2 items-center">
              <div className="col-span-1 text-sm text-muted-foreground">{index + 1}</div>
              
              {/* Reduced KG column width */}
              <div className="col-span-3 sm:col-span-2">
                <Input
                  type="number"
                  value={set.weight === 0 ? null : set.weight ?? ''}
                  onChange={(e) =>
                    updateSet(index, "weight", e.target.value === '' ? null : parseFloat(e.target.value))
                  }
                  className="h-9"
                />
                {lastPerformanceData && lastPerformanceData[index] && lastPerformanceData[index]?.weight !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dernier: {lastPerformanceData[index]?.weight}kg
                  </p>
                )}
              </div>
              {/* Adjusted VALEUR column width */}
              <div className="col-span-5 sm:col-span-5">
                {exercise.exerciseType === 'reps' ? (
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={set.reps ?? ''}
                    onChange={(e) =>
                      updateSet(index, "reps", e.target.value === '' ? null : parseInt(e.target.value, 10))
                    }
                    className="h-9"
                  />
                ) : ( // exerciseType === 'timer'
                  <Input
                    type="time"
                    value={secondsToTimeInput(set.duration)}
                    onChange={(e) => updateSet(index, "duration", e.target.value)}
                    className="h-9"
                    step="1" // Allow seconds input
                  />
                )}
                {lastPerformanceData && lastPerformanceData[index] && lastPerformanceData[index]?.reps !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dernier: {lastPerformanceData[index]?.reps} reps
                  </p>
                )}
              </div>
              {isActive && (
                <div className="col-span-2 sm:col-span-3 flex justify-center">
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
              <div className="col-span-1 sm:col-span-1 flex justify-end">
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
