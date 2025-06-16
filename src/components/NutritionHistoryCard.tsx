import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge"; // For displaying the date

// Define the structure of a nutrition log entry prop
// This should match the structure returned by the GET /nutrition/log endpoint

// New interface for individual food items logged historically
export interface HistoricFoodItem {
  name: string;
  weight: number;
  protein: number;
  carbs: number; // Matches backend 'logged_food_items' table and frontend LoggedFood interface
  lipids: number;
  calories: number;
  fiber: number;
}

export interface NutritionLogEntry {
  date: string;
  total_protein: number;
  total_fiber: number;  
  total_calories: number;
  total_lipids: number;  
  total_glucides: number;
  comment: string | null; 
  items: HistoricFoodItem[];
}

interface NutritionHistoryCardProps {
  logEntry: NutritionLogEntry;
  onReloadLog: (itemsToReload: HistoricFoodItem[]) => void;
}

const NutritionHistoryCard: React.FC<NutritionHistoryCardProps> = ({ logEntry, onReloadLog }) => {
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
            <div className="p-4"> {/* Outer padding for the whole content area */}
              {/* Existing totals section */}
              <h4 className="text-md font-semibold mb-2 text-gray-800">Résumé journalier des totaux</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6">
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

              {/* New section for individual items */}
              <h4 className="text-md font-semibold mb-3 pt-4 border-t text-gray-800">Aliments consommés ce jour-là</h4>
              {logEntry.items && logEntry.items.length > 0 ? (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poids (g)</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calories (kcal)</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protéines (g)</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Glucides (g)</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lipides (g)</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fibres (g)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logEntry.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.weight.toFixed(0)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.calories.toFixed(0)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.protein.toFixed(1)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.carbs.toFixed(1)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.lipids.toFixed(1)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-900">{item.fiber.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">Aucun détail d'aliment disponible pour ce jour.</p>
              )}
              {logEntry.items && logEntry.items.length > 0 && (
                <div className="mt-4 text-right">
                  <button
                    onClick={() => onReloadLog(logEntry.items)}
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Recharger ce journal
                  </button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default NutritionHistoryCard;
