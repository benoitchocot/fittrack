import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge"; // For displaying the date

// Define the structure of a nutrition log entry prop
// This should match the structure returned by the GET /nutrition/log endpoint
export interface NutritionLogEntry {
  id: number;
  date: string; // Should be YYYY-MM-DD
  protein: number;
  fiber: number;
  calories: number;
  lipids: number;
  glucides: number; // Changed from 'carbohydrates' to 'glucides' as per backend
}

interface NutritionHistoryCardProps {
  logEntry: NutritionLogEntry;
}

const NutritionHistoryCard: React.FC<NutritionHistoryCardProps> = ({ logEntry }) => {
  if (!logEntry) {
    return (
      <Card className="mb-4 border-red-500">
        <CardHeader><CardTitle className="text-red-500">Invalid Log Data</CardTitle></CardHeader>
        <CardContent><p>Log entry data is missing.</p></CardContent>
      </Card>
    );
  }

  // Format date for display (e.g., "15 Mai 2023")
  const formattedDate = new Date(logEntry.date + 'T00:00:00Z').toLocaleDateString('fr-FR', { // Added T00:00:00Z to ensure UTC parsing
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Specify UTC to avoid timezone shifts from YYYY-MM-DD
  });

  return (
    <Card className="mb-4">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={`item-${logEntry.id}`}>
          <AccordionTrigger>
            <div className="flex items-center justify-between w-full pr-4 m-5"> {/* Added pr-4 for spacing before chevron */}
              <div className="flex flex-col items-start">
                <CardTitle className="text-lg"></CardTitle>
                <Badge variant="outline" className="mt-1 text-xs">{formattedDate}</Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="font-medium">{logEntry.calories.toFixed(0)} kcal</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-4"> {/* Added padding to content */}
              <div>
                <p className="text-xs text-muted-foreground">Protéines</p>
                <p className="font-medium">{logEntry.protein.toFixed(1)} g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lipides</p>
                <p className="font-medium">{logEntry.lipids.toFixed(1)} g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Glucides</p>
                <p className="font-medium">{logEntry.glucides.toFixed(1)} g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fibres</p>
                <p className="font-medium">{logEntry.fiber.toFixed(1)} g</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default NutritionHistoryCard;
