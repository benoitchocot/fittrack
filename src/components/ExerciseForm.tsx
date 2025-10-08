
import React, { useState, useEffect, ChangeEvent } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  historicalRefs?: Map<string, { sets: Array<{ weight: number | null; reps: number | null } | null> | null; comment: string | null }>;
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
  historicalRefs,
}: ExerciseFormProps) => {
  const [showComment, setShowComment] = useState(!!exercise.comment);
  const historicalData = historicalRefs?.get(exercise.id);
  const lastPerformanceData = historicalData?.sets;
  const lastComment = historicalData?.comment;


  // Ensure exercise.exerciseType is always 'reps' as per updated types
  // This effect also handles cases where exercise prop might change from parent
  // and ensures it conforms to the new type structure.
  useEffect(() => {
    if (exercise && exercise.exerciseType !== 'reps') {
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
    // Ensure exerciseType is 'reps' if it changes from parent
    if (exercise && exercise.exerciseType !== 'reps') {
      onUpdate({ ...exercise, exerciseType: 'reps' });
    }
  }, [exercise, exercise.name, onUpdate]);


  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExerciseNameInput(value);
    if (value.length > 0) {
      const filteredSuggestions = allExercises
        .filter((ex) => ex.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
    onUpdate({ ...exercise, name: value, exerciseType: 'reps' }); // Ensure type is 'reps'
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
    onUpdate({ ...exercise, exerciseType: 'reps', sets: [...exercise.sets, newSet] });
  };

  const updateSet = (index: number, field: keyof Set, value: any) => {
    const newSets = [...exercise.sets];
    const updatedSet = { ...newSets[index], [field]: value };
    
    newSets[index] = updatedSet;
    onUpdate({ ...exercise, exerciseType: 'reps', sets: newSets });
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
        {/* Exercise Type Selector - REMOVED */}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          {/* Unified Header Row */}
          <div className="grid grid-cols-12 gap-x-2 gap-y-1 mb-2 text-xs font-medium text-muted-foreground items-center">
            <div className="col-span-1">#</div>
            {/* Reduced KG column width */}
            <div className="col-span-3 sm:col-span-2">KG</div> 
            {/* Adjusted VALEUR column width to take remaining space */}
            <div className="col-span-5 sm:col-span-5">RÉPÉTITIONS</div> {/* Always REPS now */}
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
                {lastPerformanceData && lastPerformanceData[index] && lastPerformanceData[index]?.reps !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dernier: {lastPerformanceData[index]?.reps} reps {/* Ensure this only shows reps */}
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
            {lastComment && (
              <p className="text-xs text-muted-foreground mt-1">
                Dernier commentaire: {lastComment}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseForm;
