
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

// Helper functions for time conversion
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
  if (parts.length === 3) { // hh:mm:ss
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) { // mm:ss
    totalSeconds = parts[0] * 60 + parts[1];
  } else {
    return null; // Invalid format
  }
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
  lastPerformanceData?: Array<{ weight: number | null; reps: number | null; duration?: number | null; setType?: 'reps' | 'timer' } | null> | null;
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

  // Ensure sets have setType initialized, default to 'reps' if not present (e.g. from older data)
   useEffect(() => {
    const setsNeedUpdate = exercise.sets.some(s => s.setType === undefined);
    if (setsNeedUpdate) {
      onUpdate({
        ...exercise,
        sets: exercise.sets.map(s => ({
          ...s,
          setType: s.setType || 'reps',
          duration: s.duration || null,
          reps: s.reps || null,
        })),
      });
    }
  }, [exercise.sets, exercise, onUpdate]);

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
      duration: null,
      setType: 'reps', // Default to reps
      completed: false,
    };
    onUpdate({ ...exercise, sets: [...exercise.sets, newSet] });
  };

  const updateSet = (index: number, field: keyof Set, value: any) => {
    const newSets = [...exercise.sets];
    let updatedSet = { ...newSets[index], [field]: value };

    // If setType changes, nullify the other value type and set sensible default for current
    if (field === 'setType') {
      if (value === 'reps') {
        updatedSet.duration = null;
        if(updatedSet.reps === null) updatedSet.reps = 0; // Default to 0 reps
      } else if (value === 'timer') {
        updatedSet.reps = null;
        if(updatedSet.duration === null) updatedSet.duration = 0; // Default to 0 seconds (00:00)
      }
    }

    // If value for time input changes, parse it to seconds
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
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          {/* Header row for larger screens */}
          <div className="hidden md:grid grid-cols-12 gap-x-2 gap-y-1 mb-2 text-xs font-medium text-muted-foreground items-center">
            <div className="md:col-span-1">#</div>
            <div className="md:col-span-3">KG</div>
            <div className="md:col-span-3">VALEUR</div>
            <div className="md:col-span-2">TYPE</div>
            {isActive && (
              <div className="md:col-span-2 text-center">FAIT</div>
            )}
            <div className="md:col-span-1 text-right">SUPPRIMER</div>
          </div>
          
          {exercise.sets.map((set, index) => (
            <div 
              key={set.id} 
              className="grid grid-cols-6 sm:grid-cols-12 gap-x-2 gap-y-2 mb-3 items-center p-2 border rounded-md md:border-0 md:p-0 md:mb-2"
            >
              {/* Set Number - Visible on all, takes less space on mobile */}
              <div className="col-span-1 sm:col-span-1 text-sm text-muted-foreground self-center">{index + 1}</div>

              {/* KG Input */}
              <div className="col-span-5 sm:col-span-3 md:col-span-3">
                <Label htmlFor={`weight-${set.id}`} className="text-xs font-medium md:hidden">KG</Label>
                <Input
                  type="number"
                  value={set.weight === 0 ? null : set.weight ?? ''}
                  onChange={(e) =>
                    updateSet(index, "weight", e.target.value === '' ? null : parseFloat(e.target.value))
                  }
                  className="h-9 w-full"
                  placeholder="0"
                  id={`weight-${set.id}`}
                />
                {lastPerformanceData && lastPerformanceData[index] && lastPerformanceData[index]?.weight !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dernier: {lastPerformanceData[index]?.weight}kg
                  </p>
                )}
              </div>

              {/* Value Input (Reps or Time) */}
              <div className="col-span-full sm:col-span-4 md:col-span-3">
                <Label htmlFor={`value-${set.id}`} className="text-xs font-medium md:hidden">
                  {set.setType === 'reps' ? 'RÉPÉTITIONS' : 'TEMPS'}
                </Label>
                {set.setType === 'reps' ? (
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    id={`value-${set.id}`}
                    value={set.reps ?? ''}
                    onChange={(e) =>
                      updateSet(index, "reps", e.target.value === '' ? null : parseInt(e.target.value, 10))
                    }
                    className="h-9 w-full"
                  />
                ) : (
                  <Input
                    type="time"
                    id={`value-${set.id}`}
                    value={secondsToTimeInput(set.duration)}
                    onChange={(e) =>
                       updateSet(index, "duration", e.target.value) 
                    }
                    className="h-9 w-full"
                    step="1" // Allow seconds input
                  />
                )}
                {lastPerformanceData && lastPerformanceData[index] && (
                  <>
                    {set.setType === 'reps' && lastPerformanceData[index]?.reps !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Dernier: {lastPerformanceData[index]?.reps} reps
                      </p>
                    )}
                    {set.setType === 'timer' && lastPerformanceData[index]?.duration !== null && (
                       <p className="text-xs text-muted-foreground mt-1">
                        Dernier: {secondsToTimeInput(lastPerformanceData[index]?.duration)}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Type Selector (RadioGroup) */}
              <div className="col-span-full sm:col-span-4 md:col-span-2">
                 <Label className="text-xs font-medium md:hidden">TYPE</Label>
                <RadioGroup
                  value={set.setType || 'reps'}
                  onValueChange={(value: 'reps' | 'timer') => updateSet(index, "setType", value)}
                  className="flex space-x-2 mt-1 md:mt-0 items-center h-9"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="reps" id={`reps-${set.id}`} className="h-4 w-4" />
                    <Label htmlFor={`reps-${set.id}`} className="text-xs font-normal cursor-pointer">REPS</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="timer" id={`timer-${set.id}`} className="h-4 w-4" />
                    <Label htmlFor={`timer-${set.id}`} className="text-xs font-normal cursor-pointer">TIMER</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Completed Button */}
              {isActive && (
                 <div className="col-span-3 sm:col-span-1 md:col-span-2 flex items-center justify-start sm:justify-center">
                  <Label className="text-xs font-medium md:hidden mr-2 sm:hidden">FAIT</Label> {/* Hidden on SM up if text clashes */}
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
              {/* Delete Set Button */}
              <div className={`flex items-center ${isActive ? 'col-span-2 sm:col-span-1' : 'col-span-6 sm:col-span-12'} justify-end md:col-span-1 md:justify-end`}>
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
