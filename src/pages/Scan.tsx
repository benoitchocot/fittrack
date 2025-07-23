import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { apiFetch } from '@/utils/api';

interface Product {
  code: string;
  product_name: string;
  nutriments: {
    'energy-kcal_100g': number;
    proteins_100g: number;
    carbohydrates_100g: number;
    fat_100g: number;
    fiber_100g: number;
  };
  image_url: string;
}

interface ScanHistoryItem {
  id: number;
  barcode: string;
  product_name: string;
  image_url: string;
  scanned_at: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
}

const ScanPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("scanner");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [showScanner, setShowScanner] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'scanner' && showScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdgePercentage = 0.7;
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
                width: qrboxSize,
                height: qrboxSize,
            };
          },
          formatsToSupport: Object.values(Html5QrcodeSupportedFormats),
        },
        false
      );

      const onScanSuccess = (decodedText: string) => {
        setScanResult(decodedText);
        toast.success(`Code-barres détecté : ${decodedText}`);
        fetchProductInfo(decodedText);
        setShowScanner(false);
        scanner.clear();
      };

      const onScanError = (error: any) => {
        // console.error("Scan Error:", error);
      };

      scanner.render(onScanSuccess, onScanError);

      return () => {
        if (scanner) {
          scanner.clear().catch(error => {
            console.error("Failed to clear scanner", error)
          });
        }
      };
    }
  }, [activeTab, showScanner]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchScanHistory();
    }
    // Reset scan state when switching away from the scanner tab
    if (activeTab !== 'scanner') {
      setScanResult(null);
      setProductInfo(null);
    }
  }, [activeTab]);

  const fetchProductInfo = async (barcode: string) => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      if (data.status === 1) {
        setProductInfo(data.product as Product);
        setIsDialogOpen(true);
      } else {
        toast.error("Produit non trouvé.");
        setScanResult(null); // Reset for another scan
      }
    } catch (error) {
      toast.error("Erreur lors de la récupération des informations du produit.");
      setScanResult(null); // Reset for another scan
    }
  };

  const fetchScanHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await apiFetch('scan/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setScanHistory(data);
    } catch (error) {
      toast.error('Erreur lors de la récupération de l\'historique.');
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const handleSaveScan = async () => {
    if (!productInfo) return;

    const payload = {
      barcode: productInfo.code,
      product_name: productInfo.product_name,
      image_url: productInfo.image_url,
      calories: productInfo.nutriments['energy-kcal_100g'],
      protein: productInfo.nutriments.proteins_100g,
      carbohydrates: productInfo.nutriments.carbohydrates_100g,
      fat: productInfo.nutriments.fat_100g,
      fiber: productInfo.nutriments.fiber_100g,
    };

    try {
      await apiFetch('scan/history', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success('Produit sauvegardé dans l\'historique.');
      setIsDialogOpen(false);
      setScanResult(null);
      setProductInfo(null);
      if (activeTab === 'history') {
        fetchScanHistory();
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du produit.');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const html5QrCode = new Html5Qrcode("reader");
      try {
        const decodedText = await html5QrCode.scanFile(file, false);
        setScanResult(decodedText);
        toast.success(`Code-barres détecté : ${decodedText}`);
        fetchProductInfo(decodedText);
      } catch (err) {
        toast.error(`Erreur lors du scan de l'image: ${err}`);
      }
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setScanResult(null);
      setProductInfo(null);
    }
  };

  return (
    <div>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Scanner un produit</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Scanner un code-barres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  {showScanner ? (
                    <div id="reader" style={{ width: '100%' }}></div>
                  ) : (
                    <Button onClick={() => setShowScanner(true)}>Démarrer le scan par caméra</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des scans</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <p>Chargement de l'historique...</p>
                ) : scanHistory.length === 0 ? (
                  <p>Aucun produit dans l'historique.</p>
                ) : (
                  <div className="space-y-4">
                    {scanHistory.map((item) => (
                      <Card key={item.id}>
                        <CardHeader>
                          <CardTitle>{item.product_name}</CardTitle>
                          <p className="text-sm text-gray-500">{new Date(item.scanned_at).toLocaleString()}</p>
                        </CardHeader>
                        <CardContent className="flex items-center space-x-4">
                          <img src={item.image_url} alt={item.product_name} className="w-24 h-24 object-cover rounded" />
                          <div>
                            <p>Pour 100g: </p>
                            <p>Calories: {item.calories} kcal</p>
                            <p>Protéines: {item.protein} g</p>
                            <p>Glucides: {item.carbohydrates} g</p>
                            <p>Lipides: {item.fat} g</p>
                            <p>Fibres: {item.fiber} g</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{productInfo?.product_name}</DialogTitle>
            </DialogHeader>
            {productInfo && (
              <div>
                <img src={productInfo.image_url} alt={productInfo.product_name} className="w-full h-auto" />
                <DialogDescription asChild>
                  <div>
                    <div>Pour 100g: </div>
                    <div>Calories: {productInfo.nutriments['energy-kcal_100g']} kcal</div>
                    <div>Protéines: {productInfo.nutriments.proteins_100g} g</div>
                    <div>Glucides: {productInfo.nutriments.carbohydrates_100g} g</div>
                    <div>Lipides: {productInfo.nutriments.fat_100g} g</div>
                    <div>Fibres: {productInfo.nutriments.fiber_100g} g</div>
                  </div>
                </DialogDescription>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Fermer</Button>
              <Button onClick={handleSaveScan}>Sauvegarder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ScanPage;
