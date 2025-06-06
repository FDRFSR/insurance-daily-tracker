import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, Pause, Clock, Copy } from 'lucide-react';
import type { Template, InsertTemplate } from '@shared/types/template';

interface TemplateManagerProps {
  onEditTemplate?: (template: Template) => void;
  onCreateTemplate?: () => void;
}

export function TemplateManager({ onEditTemplate, onCreateTemplate }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica i templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }
      const data = await response.json();
      setTemplates(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/templates/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle template');
      }

      const updatedTemplate = await response.json();
      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? updatedTemplate : template
        )
      );
    } catch (err) {
      console.error('Error toggling template:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle template');
    }
  };

  const executeTemplate = async (id: number) => {
    try {
      const response = await fetch(`/api/templates/${id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context: {} }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute template');
      }

      const result = await response.json();
      alert(`Template eseguito con successo! Task creato: ${result.task.title}`);
    } catch (err) {
      console.error('Error executing template:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute template');
    }
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      console.error('Error deleting template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const duplicateTemplate = async (template: Template) => {
    try {
      const duplicatedData: InsertTemplate = {
        name: `${template.name} (Copia)`,
        titleTemplate: template.titleTemplate,
        descriptionTemplate: template.descriptionTemplate || '',
        category: template.category,
        priority: template.priority,
        estimatedTime: template.estimatedTime,
        recurrenceConfig: template.recurrenceConfig,
        templateContext: template.templateContext,
        isActive: false, // Le copie iniziano disattive
      };

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate template');
      }

      const newTemplate = await response.json();
      setTemplates(prev => [...prev, newTemplate]);
    } catch (err) {
      console.error('Error duplicating template:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate template');
    }
  };

  const formatRecurrence = (config: any) => {
    if (!config) return 'Nessuna ricorrenza';
    
    const { type, time, daysOfWeek, dayOfMonth } = config;
    const timeStr = time || '09:00';
    
    switch (type) {
      case 'daily':
        return `Giornaliera alle ${timeStr}`;
      case 'weekly':
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        const dayName = daysOfWeek?.[0] ? dayNames[daysOfWeek[0]] : 'Lun';
        return `Settimanale ${dayName} alle ${timeStr}`;
      case 'monthly':
        return `Mensile giorno ${dayOfMonth || 1} alle ${timeStr}`;
      default:
        return 'Configurazione personalizzata';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Caricamento templates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-red-700">Errore: {error}</span>
        </div>
        <button
          onClick={loadTemplates}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Templates Attività Ricorrenti</h2>
        <button
          onClick={onCreateTemplate}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Template</span>
        </button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun template trovato</h3>
          <p className="text-gray-500 mb-4">Crea il tuo primo template per automatizzare attività ricorrenti.</p>
          <button
            onClick={onCreateTemplate}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Crea Template
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-4 border rounded-lg transition-all ${
                template.isActive
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{template.category}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {template.isActive && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
              </div>

              {/* Template Content Preview */}
              <div className="mb-3">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {template.titleTemplate}
                </p>
                {template.descriptionTemplate && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {template.descriptionTemplate}
                  </p>
                )}
              </div>

              {/* Recurrence Info */}
              <div className="mb-3 text-xs text-gray-600">
                <Clock className="w-3 h-3 inline mr-1" />
                {formatRecurrence(template.recurrenceConfig)}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <button
                    onClick={() => toggleTemplate(template.id, !template.isActive)}
                    className={`p-1.5 rounded ${
                      template.isActive
                        ? 'text-green-600 hover:bg-green-100'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={template.isActive ? 'Disattiva' : 'Attiva'}
                  >
                    {template.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => executeTemplate(template.id)}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                    title="Esegui ora"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => duplicateTemplate(template)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                    title="Duplica"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex space-x-1">
                  <button
                    onClick={() => onEditTemplate?.(template)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                    title="Modifica"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
