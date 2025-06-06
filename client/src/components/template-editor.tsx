import React, { useState, useEffect } from 'react';
import { X, Save, TestTube, Calendar, Clock, Variable } from 'lucide-react';
import type { Template, InsertTemplate, RecurrenceConfig, TemplateContext } from '@shared/types/template';

interface TemplateEditorProps {
  template?: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: InsertTemplate) => Promise<void>;
}

interface ContextVariable {
  key: string;
  type: 'text' | 'number' | 'date' | 'client';
  label: string;
  defaultValue?: string;
}

export function TemplateEditor({ template, isOpen, onClose, onSave }: TemplateEditorProps) {
  const [formData, setFormData] = useState<InsertTemplate>({
    name: '',
    titleTemplate: '',
    descriptionTemplate: '',
    category: 'Generale',
    priority: 'media',
    estimatedTime: 30,
    recurrenceConfig: undefined,
    templateContext: {},
    isActive: false,
  });

  const [contextVariables, setContextVariables] = useState<ContextVariable[]>([]);
  const [previewContext, setPreviewContext] = useState<TemplateContext>({});
  const [loading, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Inizializza il form quando cambia il template
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        titleTemplate: template.titleTemplate,
        descriptionTemplate: template.descriptionTemplate || '',
        category: template.category,
        priority: template.priority,
        estimatedTime: template.estimatedTime,
        recurrenceConfig: template.recurrenceConfig,
        templateContext: template.templateContext || {},
        isActive: template.isActive,
      });
      
      // Estrai le variabili dal context
      const variables = Object.entries(template.templateContext || {}).map(([key, value]) => ({
        key,
        type: typeof value === 'number' ? 'number' : 'text',
        label: key.charAt(0).toUpperCase() + key.slice(1),
        defaultValue: String(value || ''),
      }));
      setContextVariables(variables);
    } else {
      // Reset per nuovo template
      setFormData({
        name: '',
        titleTemplate: '',
        descriptionTemplate: '',
        category: 'Generale',
        priority: 'media',
        estimatedTime: 30,
        recurrenceConfig: undefined,
        templateContext: {},
        isActive: false,
      });
      setContextVariables([]);
    }
    setPreviewContext({});
  }, [template, isOpen]);

  const handleInputChange = (field: keyof InsertTemplate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRecurrenceChange = (updates: Partial<RecurrenceConfig>) => {
    setFormData(prev => ({
      ...prev,
      recurrenceConfig: prev.recurrenceConfig 
        ? { ...prev.recurrenceConfig, ...updates }
        : { type: 'daily', time: '09:00', ...updates },
    }));
  };

  const addContextVariable = () => {
    const newVar: ContextVariable = {
      key: `variable${contextVariables.length + 1}`,
      type: 'text',
      label: 'Nuova Variabile',
      defaultValue: '',
    };
    setContextVariables(prev => [...prev, newVar]);
  };

  const updateContextVariable = (index: number, updates: Partial<ContextVariable>) => {
    setContextVariables(prev => 
      prev.map((variable, i) => 
        i === index ? { ...variable, ...updates } : variable
      )
    );
  };

  const removeContextVariable = (index: number) => {
    setContextVariables(prev => prev.filter((_, i) => i !== index));
  };

  const generateTemplateContext = (): TemplateContext => {
    const context: TemplateContext = {};
    contextVariables.forEach(variable => {
      if (variable.type === 'number') {
        context[variable.key] = Number(variable.defaultValue) || 0;
      } else {
        context[variable.key] = variable.defaultValue || '';
      }
    });
    return context;
  };

  const renderPreview = () => {
    const context = { ...generateTemplateContext(), ...previewContext };
    let title = formData.titleTemplate;
    let description = formData.descriptionTemplate;

    // Sostituisci le variabili Handlebars
    Object.entries(context).forEach(([key, value]) => {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      title = title.replace(pattern, String(value));
      description = description.replace(pattern, String(value));
    });

    return { title, description };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.titleTemplate.trim()) {
      alert('Nome e titolo template sono obbligatori');
      return;
    }

    setSaving(true);
    try {
      const templateContext = generateTemplateContext();
      await onSave({
        ...formData,
        templateContext,
      });
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Errore nel salvataggio del template');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const preview = renderPreview();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {template ? 'Modifica Template' : 'Nuovo Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informazioni Base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Template *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="es. Controllo mensile polizze"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Generale">Generale</option>
                <option value="Controlli">Controlli</option>
                <option value="Scadenze">Scadenze</option>
                <option value="Comunicazioni">Comunicazioni</option>
                <option value="Amministrativo">Amministrativo</option>
              </select>
            </div>
          </div>

          {/* Template del Titolo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template del Titolo *
            </label>
            <input
              type="text"
              value={formData.titleTemplate}
              onChange={(e) => handleInputChange('titleTemplate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="es. Controllo polizza {{client_name}} - {{tipo_polizza}}"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Usa {{variabile}} per inserire variabili dinamiche
            </p>
          </div>

          {/* Template della Descrizione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template della Descrizione
            </label>
            <textarea
              value={formData.descriptionTemplate}
              onChange={(e) => handleInputChange('descriptionTemplate', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="es. Verifica stato polizza per {{client_name}} e controllo scadenze"
            />
          </div>

          {/* Priorità e Tempo Stimato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorità
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="bassa">Bassa</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tempo Stimato (minuti)
              </label>
              <input
                type="number"
                value={formData.estimatedTime}
                onChange={(e) => handleInputChange('estimatedTime', Number(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Configurazione Ricorrenza */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="font-medium">Configurazione Ricorrenza</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo di Ricorrenza
                </label>
                <select
                  value={formData.recurrenceConfig?.type || 'none'}
                  onChange={(e) => {
                    if (e.target.value === 'none') {
                      handleInputChange('recurrenceConfig', undefined);
                    } else {
                      handleRecurrenceChange({ type: e.target.value as any });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">Nessuna ricorrenza</option>
                  <option value="daily">Giornaliera</option>
                  <option value="weekly">Settimanale</option>
                  <option value="monthly">Mensile</option>
                </select>
              </div>

              {formData.recurrenceConfig && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Orario di Esecuzione
                      </label>
                      <input
                        type="time"
                        value={formData.recurrenceConfig.time || '09:00'}
                        onChange={(e) => handleRecurrenceChange({ time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {formData.recurrenceConfig.type === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giorno della Settimana
                        </label>
                        <select
                          value={formData.recurrenceConfig.daysOfWeek?.[0] || 1}
                          onChange={(e) => handleRecurrenceChange({ 
                            daysOfWeek: [Number(e.target.value)] 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={1}>Lunedì</option>
                          <option value={2}>Martedì</option>
                          <option value={3}>Mercoledì</option>
                          <option value={4}>Giovedì</option>
                          <option value={5}>Venerdì</option>
                          <option value={6}>Sabato</option>
                          <option value={0}>Domenica</option>
                        </select>
                      </div>
                    )}

                    {formData.recurrenceConfig.type === 'monthly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giorno del Mese
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.recurrenceConfig.dayOfMonth || 1}
                          onChange={(e) => handleRecurrenceChange({ 
                            dayOfMonth: Number(e.target.value) 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Variabili Context */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Variable className="w-5 h-5 text-green-500" />
                <h3 className="font-medium">Variabili Template</h3>
              </div>
              <button
                type="button"
                onClick={addContextVariable}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Aggiungi Variabile
              </button>
            </div>

            <div className="space-y-3">
              {contextVariables.map((variable, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                  <input
                    type="text"
                    value={variable.key}
                    onChange={(e) => updateContextVariable(index, { key: e.target.value })}
                    placeholder="nome_variabile"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <select
                    value={variable.type}
                    onChange={(e) => updateContextVariable(index, { type: e.target.value as any })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="text">Testo</option>
                    <option value="number">Numero</option>
                    <option value="date">Data</option>
                    <option value="client">Cliente</option>
                  </select>
                  <input
                    type="text"
                    value={variable.defaultValue}
                    onChange={(e) => updateContextVariable(index, { defaultValue: e.target.value })}
                    placeholder="Valore default"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeContextVariable(index)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TestTube className="w-5 h-5 text-purple-500" />
                <h3 className="font-medium">Anteprima</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
              >
                {showPreview ? 'Nascondi' : 'Mostra'} Anteprima
              </button>
            </div>

            {showPreview && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titolo Generato:
                  </label>
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    {preview.title}
                  </div>
                </div>
                {preview.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrizione Generata:
                    </label>
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      {preview.description}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Template Status */}
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Template attivo</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvataggio...' : 'Salva Template'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
