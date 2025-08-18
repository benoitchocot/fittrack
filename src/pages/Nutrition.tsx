import React, { useState, useEffect, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button'; // Standard Button, used for Add, Save, Delete
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { apiFetch } from '@/utils/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NutritionHistoryCard, { NutritionLogEntry, HistoricFoodItem } from '@/components/NutritionHistoryCard'; // Import HistoricFoodItem

// Define interfaces for our data structures
interface FoodItem {
  name: string;
  protein_100g: number;
  carbs_100g: number;
  lipids_100g: number;
  calories_kcal_100g: number;
  fiber_100g: number;
}

interface LoggedFood {
  name: string;
  weight: number;
  protein: number;
  carbs: number;
  lipids: number;
  calories: number;
  fiber: number;
}

interface NutrientTotals {
  protein: number;
  carbs: number;
  lipids: number;
  calories: number;
  fiber: number;
}

const NutritionPage: React.FC = () => {
  const [ciqualData, setCiqualData] = useState<FoodItem[]>([]);
  const [foodNameInput, setFoodNameInput] = useState('');
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [dailyLog, setDailyLog] = useState<LoggedFood[]>([]);
  const [totals, setTotals] = useState<NutrientTotals>({
    protein: 0, carbs: 0, lipids: 0, calories: 0, fiber: 0,
  });
  const [activeTab, setActiveTab] = useState("log");
  const [nutritionHistory, setNutritionHistory] = useState<NutritionLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [currentComment, setCurrentComment] = useState(''); // State for the comment

  useEffect(() => {
    fetch('/ciqual_data.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data: FoodItem[]) => {
        setCiqualData(data);
      })
      .catch((error) => {
        console.error('Error fetching CIQUAL data:', error);
        toast.error('Error fetching CIQUAL data: ' + error.message);
      });
  }, []);

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const handleFoodNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFoodNameInput(value);

    if (value.length > 2) {
      const normalizedQuery = normalizeText(value);
      const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);

      if (queryWords.length === 0) {
        setSuggestions([]);
        setSelectedFood(null);
        return;
      }

      const filteredSuggestions = ciqualData.filter(item => {
        const normalizedItemName = normalizeText(item.name);
        
        // Check if the item name starts with the first query word
        if (!normalizedItemName.startsWith(queryWords[0])) {
          return false;
        }

        // If there are more query words, check if all of them are included in the item name
        if (queryWords.length > 1) {
          for (let i = 1; i < queryWords.length; i++) {
            if (!normalizedItemName.includes(queryWords[i])) {
              return false;
            }
          }
        }
        return true;
      });
      setSuggestions(filteredSuggestions.slice(0, 10));
    } else {
      setSuggestions([]);
    }
    setSelectedFood(null);
  };

  const handleSuggestionClick = (food: FoodItem) => {
    setFoodNameInput(food.name);
    setSelectedFood(food);
    setSuggestions([]);
  };
  
  const handleAddFood = () => {
    if (!selectedFood) {
      toast.error('Please select a food item from the suggestions.');
      return;
    }
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Please enter a valid positive weight.');
      return;
    }

    const calculatedNutrients: LoggedFood = {
      name: selectedFood.name,
      weight: weight,
      protein: (selectedFood.protein_100g / 100) * weight,
      carbs: (selectedFood.carbs_100g / 100) * weight,
      lipids: (selectedFood.lipids_100g / 100) * weight,
      calories: (selectedFood.calories_kcal_100g / 100) * weight,
      fiber: (selectedFood.fiber_100g / 100) * weight,
    };

    setDailyLog(prevLog => [...prevLog, calculatedNutrients]);
    setFoodNameInput('');
    setSelectedFood(null);
    setSuggestions([]);
    setWeightInput('');
  };

  const handleDeleteFood = (indexToDelete: number) => {
    setDailyLog(prevLog => prevLog.filter((_, index) => index !== indexToDelete));
    toast.success('Aliment supprimé');
  };

  useEffect(() => {
    if (dailyLog.length === 0) {
      setTotals({ protein: 0, carbs: 0, lipids: 0, calories: 0, fiber: 0 });
      return;
    }
    const newTotals: NutrientTotals = dailyLog.reduce(
      (acc, currentFood) => {
        acc.protein += currentFood.protein;
        acc.carbs += currentFood.carbs;
        acc.lipids += currentFood.lipids;
        acc.calories += currentFood.calories;
        acc.fiber += currentFood.fiber;
        return acc;
      },
      { protein: 0, carbs: 0, lipids: 0, calories: 0, fiber: 0 }
    );
    setTotals(newTotals);
  }, [dailyLog]);

  useEffect(() => {
    if (activeTab === 'history') {
      setHistoryLoading(true);
      apiFetch('nutrition/log')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(jsonData => {
          setNutritionHistory(jsonData as NutritionLogEntry[]);
        })
        .catch(error => {
          console.error('Error fetching or parsing nutrition history:', error);
          toast.error('Failed to fetch nutrition history: ' + error.message);
          setNutritionHistory([]);
        })
        .finally(() => {
          setHistoryLoading(false);
        });
    }
  }, [activeTab]);

  const handleSaveLog = async () => {
    if (dailyLog.length === 0) {
      toast.info('Nothing to save. Add some food items first.');
      return;
    }
    const payload = {
      protein: totals.protein,
      fiber: totals.fiber,
      calories: totals.calories,
      lipids: totals.lipids,
      glucides: totals.carbs, // Ensure backend expects 'glucides'
      dailyLog: dailyLog, // Pass the individual items
      comment: currentComment, // Pass the comment
    };
    try {
      await apiFetch('nutrition/log', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success('Daily log saved successfully!');
      setDailyLog([]);
      // Reset other relevant states if needed
      setFoodNameInput('');
      setSelectedFood(null);
      setSuggestions([]);
      setWeightInput('');
      setCurrentComment(''); // Reset comment field
      setTotals({ protein: 0, carbs: 0, lipids: 0, calories: 0, fiber: 0 });


    } catch (error) {
      console.error('Failed to save daily log:', error);
      let errorMessage = 'Failed to save daily log. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };

  const handleReloadLog = (itemsToReload: HistoricFoodItem[], dateOfLog: string) => {
    const reloadedLogItems: LoggedFood[] = itemsToReload.map(item => ({
      name: item.name,
      weight: item.weight,
      protein: item.protein,
      carbs: item.carbs,
      lipids: item.lipids,
      calories: item.calories,
      fiber: item.fiber,
    }));
    setDailyLog(reloadedLogItems); // This will trigger the useEffect for totals
    setActiveTab("log"); // Switch to the Menu/Log tab
    
    // Format date for the toast message
    const formattedDate = new Date(dateOfLog + 'T00:00:00Z').toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
    });
    toast.success(`Journal rechargé avec les aliments du ${formattedDate}.`);
  };

  const handleItemDeletedFromHistory = async (logId: number, deletedItemId: number) => {
    console.log(`Attempting to refresh history after item ${deletedItemId} from log ${logId} was deleted.`);
    setHistoryLoading(true);
    try {
      const response = await apiFetch('nutrition/log');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      setNutritionHistory(jsonData as NutritionLogEntry[]);
      toast.info('Historique mis à jour.'); // Or a more subtle notification if preferred
    } catch (error) {
      console.error('Error fetching or parsing nutrition history after deletion:', error);
      let errorMessage = 'Failed to refresh nutrition history.';
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setNutritionHistory([]); // Optionally clear or leave stale data
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Nutrition Tracker</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">Menu</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="mt-4">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Ajouter un aliment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="foodName" className="block text-sm font-medium text-gray-700">Nom</label>
                  <Input
                    type="text"
                    id="foodName"
                    value={foodNameInput}
                    onChange={handleFoodNameChange}
                    placeholder="E.g., Poulet, blanc, ..."
                    className="mt-1 block w-full"
                  />
                  {suggestions.length > 0 && (
                    <ul className="border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                      {suggestions.map((item, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(item)}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {item.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Poids (g)</label>
                  <Input
                    type="number"
                    id="weight"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder="E.g., 150"
                    className="mt-1 block w-full"
                  />
                </div>
                <Button onClick={handleAddFood} className="mt-2">
                  Ajouter (+)
                </Button>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyLog.length === 0 ? (
                  <p>Aucun aliment ajouté actuellement</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poids (g)</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calories (kcal)</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protéines (g)</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Glucides (g)</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lipides (g)</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fibres (g)</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dailyLog.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.weight.toFixed(0)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.calories.toFixed(0)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.protein.toFixed(1)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.carbs.toFixed(1)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.lipids.toFixed(1)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.fiber.toFixed(1)}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteFood(index)}
                              >
                                Supprimer
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td className="px-3 py-2 text-left text-sm text-gray-900">Total</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"></td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{totals.calories.toFixed(0)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{totals.protein.toFixed(1)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{totals.carbs.toFixed(1)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{totals.lipids.toFixed(1)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{totals.fiber.toFixed(1)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"></td> {/* Empty cell for Actions column in footer */}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
              <CardFooter />
            </Card>

           

            <Button onClick={handleSaveLog} className="mt-4">
              Sauvegarder les aliments  
            </Button>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {historyLoading ? (
              <p>Chargement...</p>
            ) : nutritionHistory.length === 0 ? (
              <p>Pas d'historique !</p>
            ) : (
              <div className="space-y-4 p-4">
                {nutritionHistory.map((logEntry) => (
                  <NutritionHistoryCard
                    key={logEntry.id}
                    logEntry={logEntry}
                    onReloadLog={() => handleReloadLog(logEntry.items, logEntry.date)}
                    onItemDeleted={handleItemDeletedFromHistory} // Pass the new handler
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default NutritionPage;
