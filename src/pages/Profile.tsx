import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/utils/api';

const ProfilePage: React.FC = () => {
    const { toast } = useToast();
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        try {
            const response = await apiFetch('data/export');
            if (!response.ok) {
                throw new Error('Échec de l’exportation des données.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'export_donnees_seances.json');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Nettoyage
            toast({
                title: "Exportation réussie",
                description: "Vos données ont été téléchargées.",
            });
        } catch (error) {
            console.error("Échec de l’exportation :", error);
            toast({
                title: "Échec de l’exportation",
                description: "Impossible d’exporter vos données. Veuillez réessayer.",
                variant: "destructive",
            });
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') {
                    throw new Error("Impossible de lire le contenu du fichier.");
                }
                const jsonData = JSON.parse(content);
                
                const response = await apiFetch('data/import', {
                    method: 'POST',
                    body: JSON.stringify(jsonData),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Une erreur inconnue est survenue.' }));
                    throw new Error(errorData.message || 'Échec de l’importation.');
                }

                toast({
                    title: "Importation réussie",
                    description: "Vos données ont été restaurées. La page va se recharger.",
                });
                
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } catch (error) {
                console.error("Échec de l’importation :", error);
                const errorMessage = error instanceof Error ? error.message : "Le fichier sélectionné est invalide ou corrompu.";
                toast({
                    title: "Échec de l’importation",
                    description: errorMessage,
                    variant: "destructive",
                });
            } finally {
                setIsImporting(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Profil et gestion des données</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Exportation des données</CardTitle>
                    <CardDescription>
                        Téléchargez toutes vos données personnelles, y compris les modèles d’entraînement et l’historique, dans un seul fichier JSON.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleExport}>Exporter mes données</Button>
                </CardContent>
            </Card>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Importation des données</CardTitle>
                    <CardDescription>
                        Importez vos données à partir d’un fichier exporté précédemment. Cela écrasera toutes les données existantes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleImportClick} disabled={isImporting}>
                        {isImporting ? 'Importation en cours...' : 'Importer des données depuis un fichier'}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".json"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                        <strong>Attention :</strong> L’importation supprimera toutes les données actuelles avant de restaurer la sauvegarde.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePage;
