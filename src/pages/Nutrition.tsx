import React, { useState, useEffect, ChangeEvent } from 'react';
import NavBar from '@/components/NavBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { apiFetch } from '@/utils/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Added Tabs import
import NutritionHistoryCard, { NutritionLogEntry } from '@/components/NutritionHistoryCard';

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
  const [activeTab, setActiveTab] = useState("log"); // State for active tab
  const [nutritionHistory, setNutritionHistory] = useState<NutritionLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

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
      });
  }, []);

  const handleFoodNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFoodNameInput(value);
    if (value.length > 2) {
      const filteredSuggestions = ciqualData.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
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
      alert('Please select a food item from the suggestions.');
      return;
    }
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid positive weight.');
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
        .then(response => { // Renamed 'data' to 'response'
          if (!response.ok) { // Check for HTTP errors
            // You might want to try to parse error response from backend if available
            // For now, just throwing a generic error
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json(); // Parse the JSON body
        })
        .then(jsonData => { // This 'jsonData' is the actual array of NutritionLogEntry
          setNutritionHistory(jsonData as NutritionLogEntry[]);
        })
        .catch(error => {
          console.error('Error fetching or parsing nutrition history:', error);
          toast.error('Failed to fetch nutrition history: ' + error.message); // Include error message in toast
          setNutritionHistory([]); // Clear history on error
        })
        .finally(() => {
          setHistoryLoading(false);
        });
    }
  }, [activeTab]); // Dependency: activeTab

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
      glucides: totals.carbs,
    };
    try {
      await apiFetch('nutrition/log', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success('Daily log saved successfully!');
      setDailyLog([]);
      setFoodNameInput('');
      setSelectedFood(null);
      setSuggestions([]);
      setWeightInput('');
    } catch (error) {
      console.error('Failed to save daily log:', error);
      let errorMessage = 'Failed to save daily log. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };

  return (
    <div> {/* Root div */}
      <NavBar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Nutrition Tracker</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log">Menu</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="mt-4">
            <Card className="mb-6"> {/* Card for "Add Food Item" */}
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

            <Card className="mb-6"> {/* Card for "Today's Log" */}
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
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td className="px-3 py-2 text-left text-sm text-gray-900">Totals</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"></td> {/* Empty cell for weight column */}
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{totals.calories.toFixed(0)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{totals.protein.toFixed(1)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{totals.carbs.toFixed(1)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{totals.lipids.toFixed(1)}</td> {/* Corrected py_2 to py-2 */}
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{totals.fiber.toFixed(1)}</td>
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
              <p>Loading history...</p>
            ) : nutritionHistory.length === 0 ? (
              <p>No nutrition history found.</p>
            ) : (
              <div className="space-y-4 p-4"> {/* Added p-4 for padding */}
                {nutritionHistory.map((logEntry) => (
                  <NutritionHistoryCard key={logEntry.id} logEntry={logEntry} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div> {/* End of container div */}
    </div> // End of root div
  );
};

export default NutritionPage;
