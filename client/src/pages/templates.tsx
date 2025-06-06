import React, { useState } from 'react';
import { TemplateManager } from '../components/template-manager';
import { TemplateEditor } from '../components/template-editor';
import type { Template, InsertTemplate } from '@shared/types/template';

export function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsEditorOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedTemplate(null);
  };

  const handleSaveTemplate = async (templateData: InsertTemplate) => {
    try {
      const url = selectedTemplate 
        ? `/api/templates/${selectedTemplate.id}`
        : '/api/templates';
      
      const method = selectedTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      // Refresh the template list
      setRefreshKey(prev => prev + 1);
      setIsEditorOpen(false);
      setSelectedTemplate(null);
      
      alert(selectedTemplate ? 'Template aggiornato con successo!' : 'Template creato con successo!');
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Templates Attività Ricorrenti</h1>
            <p className="text-gray-600 mt-2">
              Gestisci i template per automatizzare la creazione di attività ricorrenti con pianificazione automatica.
            </p>
          </div>
        </div>
      </div>

      {/* Template Manager */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <TemplateManager
          key={refreshKey}
          onCreateTemplate={handleCreateTemplate}
          onEditTemplate={handleEditTemplate}
        />
      </div>

      {/* Template Editor Modal */}
      <TemplateEditor
        template={selectedTemplate}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
