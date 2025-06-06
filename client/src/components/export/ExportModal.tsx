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
import { Download, FileText, Table, Eye, Calendar, User, Tag, Filter, BarChart3, Sparkles } from 'lucide-react';

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
        <DialogHeader className="pb-6 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Download className="h-5 w-5 text-white" />
            </div>
            Esporta Report Dati
          </DialogTitle>
          <p className="text-gray-600 text-sm mt-2">
            Configura i parametri di esportazione e genera il tuo report personalizzato
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
          {/* Pannello Configurazione - 2 colonne */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formato Export */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Formato Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={format === 'pdf' ? 'default' : 'outline'}
                    onClick={() => setFormat('pdf')}
                    className={`h-20 flex flex-col items-center gap-2 transition-all duration-200 ${
                      format === 'pdf' 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200' 
                        : 'border-2 border-dashed border-gray-300 hover:border-red-400 hover:bg-red-50'
                    }`}
                  >
                    <FileText className={`h-6 w-6 ${format === 'pdf' ? 'text-white' : 'text-red-500'}`} />
                    <span className={`font-medium ${format === 'pdf' ? 'text-white' : 'text-red-600'}`}>
                      PDF Report
                    </span>
                  </Button>
                  <Button
                    variant={format === 'excel' ? 'default' : 'outline'}
                    onClick={() => setFormat('excel')}
                    className={`h-20 flex flex-col items-center gap-2 transition-all duration-200 ${
                      format === 'excel' 
                        ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-200' 
                        : 'border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    <Table className={`h-6 w-6 ${format === 'excel' ? 'text-white' : 'text-green-500'}`} />
                    <span className={`font-medium ${format === 'excel' ? 'text-white' : 'text-green-600'}`}>
                      Excel Foglio
                    </span>
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Titolo Report
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Inserisci titolo personalizzato"
                    className="border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl bg-white/80"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                  <Checkbox
                    id="includeStats"
                    checked={includeStats}
                    onCheckedChange={(checked) => setIncludeStats(checked === true)}
                    className="border-blue-300 data-[state=checked]:bg-blue-600"
                  />
                  <Label htmlFor="includeStats" className="font-medium text-gray-700 cursor-pointer">
                    Includi statistiche e grafici nel report
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Filtri */}
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                  <Filter className="h-5 w-5 text-purple-500" />
                  Filtri Avanzati
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      Data Inizio
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => updateFilter('startDate', e.target.value)}
                      className="border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl bg-white/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      Data Fine
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => updateFilter('endDate', e.target.value)}
                      className="border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl bg-white/80"
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Tag className="h-4 w-4 text-green-500" />
                    Categoria
                  </Label>
                  <Select value={filters.category || ''} onValueChange={(value) => updateFilter('category', value || undefined)}>
                    <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl bg-white/80">
                      <SelectValue placeholder="Tutte le categorie" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200">
                      <SelectItem value="">Tutte le categorie</SelectItem>
                      <SelectItem value="calls">📞 Chiamate</SelectItem>
                      <SelectItem value="quotes">💰 Preventivi</SelectItem>
                      <SelectItem value="claims">📋 Sinistri</SelectItem>
                      <SelectItem value="documents">📄 Documenti</SelectItem>
                      <SelectItem value="appointments">📅 Appuntamenti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stato e Priorità */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Stato</Label>
                    <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value || undefined)}>
                      <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl bg-white/80">
                        <SelectValue placeholder="Tutti gli stati" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-200">
                        <SelectItem value="">Tutti gli stati</SelectItem>
                        <SelectItem value="pending">⏳ In Attesa</SelectItem>
                        <SelectItem value="completed">✅ Completata</SelectItem>
                        <SelectItem value="overdue">⚠️ In Ritardo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Priorità</Label>
                    <Select value={filters.priority || ''} onValueChange={(value) => updateFilter('priority', value || undefined)}>
                      <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl bg-white/80">
                        <SelectValue placeholder="Tutte le priorità" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-200">
                        <SelectItem value="">Tutte le priorità</SelectItem>
                        <SelectItem value="low">🟢 Bassa</SelectItem>
                        <SelectItem value="medium">🟡 Media</SelectItem>
                        <SelectItem value="high">🔴 Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cliente */}
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4 text-orange-500" />
                    Nome Cliente
                  </Label>
                  <Input
                    id="clientName"
                    value={filters.clientName || ''}
                    onChange={(e) => updateFilter('clientName', e.target.value)}
                    placeholder="Cerca per nome cliente"
                    className="border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl bg-white/80"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pannello Anteprima - 1 colonna */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 backdrop-blur-sm sticky top-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                  <Eye className="h-5 w-5 text-indigo-500" />
                  Anteprima Live
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                      <BarChart3 className="h-6 w-6 text-blue-600 absolute top-3 left-1/2 transform -translate-x-1/2" />
                    </div>
                    <p className="text-sm text-gray-600 mt-4 font-medium">Caricamento anteprima...</p>
                  </div>
                ) : preview ? (
                  <div className="space-y-6">
                    {/* Counter principale */}
                    <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <div className="text-4xl font-bold mb-2">{preview.tasksCount}</div>
                      <div className="text-blue-100 font-medium">Attività da esportare</div>
                    </div>

                    {includeStats && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                          <div className="text-2xl font-bold text-green-600 mb-1">{preview.stats.completedTasks}</div>
                          <div className="text-green-700 text-sm font-medium">Completate</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
                          <div className="text-2xl font-bold text-red-600 mb-1">{preview.stats.overdueTasks}</div>
                          <div className="text-red-700 text-sm font-medium">In Ritardo</div>
                        </div>
                      </div>
                    )}

                    {preview.sampleTasks.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <div className="text-sm font-semibold mb-3 text-gray-700">
                          Anteprima Attività ({preview.sampleTasks.length})
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2" style={{scrollbarWidth: 'thin'}}>
                          {preview.sampleTasks.map((task, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                              <div className="font-medium text-gray-800 text-sm mb-1">{task.title}</div>
                              <div className="text-gray-500 text-xs">
                                {task.clientName || 'Cliente non specificato'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Eye className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Nessun dato disponibile</p>
                    <p className="text-gray-400 text-xs mt-1">Modifica i filtri per vedere l'anteprima</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer con bottoni */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="text-sm text-gray-500">
            {preview?.tasksCount ? `${preview.tasksCount} attività selezionate` : 'Configura i filtri per iniziare'}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-gray-300 hover:bg-gray-50 rounded-xl px-6"
            >
              Annulla
            </Button>
            <Button
              onClick={handleExport}
              disabled={loading || !preview?.tasksCount}
              className={`flex items-center gap-2 rounded-xl px-8 py-2 font-semibold transition-all duration-200 ${
                format === 'pdf' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-200'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <Download className="h-5 w-5" />
              )}
              Esporta {format.toUpperCase()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
