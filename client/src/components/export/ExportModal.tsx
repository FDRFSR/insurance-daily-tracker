import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ExportService, ExportPreview } from '../../services/exportService';
import { ExportRequest, ExportFilters } from '../../types/export';
import { toast } from '../../hooks/use-toast';
import { Download, FileText, Table, Eye, Calendar, User, Tag } from 'lucide-react';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [filters, setFilters] = useState<ExportFilters>({});
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [title, setTitle] = useState('Report Attività InsuraTask');
  const [includeStats, setIncludeStats] = useState(true);

  // Genera anteprima quando cambiano i filtri
  useEffect(() => {
    if (open) {
      loadPreview();
    }
  }, [open, filters]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      const previewData = await ExportService.getExportPreview(filters);
      setPreview(previewData);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare l'anteprima",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      
      const exportRequest: ExportRequest = {
        format,
        filters,
        includeStats,
        title,
      };

      await ExportService.exportData(exportRequest);
      
      toast({
        title: "Successo",
        description: `Report ${format.toUpperCase()} scaricato con successo`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'esportazione",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof ExportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Esporta Dati
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pannello Configurazione */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Formato Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={format === 'pdf' ? 'default' : 'outline'}
                    onClick={() => setFormat('pdf')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant={format === 'excel' ? 'default' : 'outline'}
                    onClick={() => setFormat('excel')}
                    className="flex items-center gap-2"
                  >
                    <Table className="h-4 w-4" />
                    Excel
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Titolo Report</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Inserisci titolo personalizzato"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeStats"
                    checked={includeStats}
                    onCheckedChange={(checked) => setIncludeStats(checked === true)}
                  />
                  <Label htmlFor="includeStats">Includi statistiche</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔍 Filtri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Data Inizio
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => updateFilter('startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Data Fine
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => updateFilter('endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Categoria
                  </Label>
                  <Select value={filters.category || ''} onValueChange={(value) => updateFilter('category', value || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutte le categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutte le categorie</SelectItem>
                      <SelectItem value="call">📞 Chiamata</SelectItem>
                      <SelectItem value="quote">💰 Preventivo</SelectItem>
                      <SelectItem value="claim">📋 Sinistro</SelectItem>
                      <SelectItem value="document">📄 Documento</SelectItem>
                      <SelectItem value="appointment">📅 Appuntamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value || undefined)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tutti gli stati" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tutti gli stati</SelectItem>
                        <SelectItem value="pending">⏳ In Attesa</SelectItem>
                        <SelectItem value="completed">✅ Completata</SelectItem>
                        <SelectItem value="overdue">⚠️ In Ritardo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priorità</Label>
                    <Select value={filters.priority || ''} onValueChange={(value) => updateFilter('priority', value || undefined)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tutte le priorità" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tutte le priorità</SelectItem>
                        <SelectItem value="low">🟢 Bassa</SelectItem>
                        <SelectItem value="medium">🟡 Media</SelectItem>
                        <SelectItem value="high">🔴 Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientName" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Nome Cliente
                  </Label>
                  <Input
                    id="clientName"
                    value={filters.clientName || ''}
                    onChange={(e) => updateFilter('clientName', e.target.value)}
                    placeholder="Cerca per nome cliente"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pannello Anteprima */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Anteprima Dati
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Caricamento anteprima...</p>
                  </div>
                ) : preview ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{preview.tasksCount}</div>
                      <div className="text-sm text-gray-500">Attività da esportare</div>
                    </div>

                    {includeStats && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{preview.stats.completedTasks}</div>
                          <div className="text-gray-500">Completate</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{preview.stats.overdueTasks}</div>
                          <div className="text-gray-500">In Ritardo</div>
                        </div>
                      </div>
                    )}

                    {preview.sampleTasks.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="text-sm font-medium mb-2">Prime {preview.sampleTasks.length} attività:</div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {preview.sampleTasks.map((task, index) => (
                            <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                              <div className="font-medium">{task.title}</div>
                              <div className="text-gray-500">{task.clientName || 'Cliente non specificato'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Nessun dato disponibile
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annulla
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading || !preview?.tasksCount}
            className="flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="h-4 w-4" />
            )}
            Esporta {format.toUpperCase()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
