import { Router } from 'express';
import { templateService } from '../services/templateService.js';
import { insertTemplateSchema, templateExecuteSchema } from '@shared/types/template';
import { z } from 'zod';

const router = Router();

// GET /api/templates - Ottiene tutti i templates
router.get('/', async (req, res) => {
  try {
    const templates = await templateService.getTemplates();
    
    // Aggiungi statistiche per ogni template
    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        const instances = await templateService.getTemplateInstances(template.id);
        return {
          ...template,
          instanceCount: instances.length,
          lastExecuted: instances.length > 0 ? instances[0].executedAt : null
        };
      })
    );
    
    res.json(templatesWithStats);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id - Ottiene un template specifico
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const template = await templateService.getTemplate(id);
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(404).json({ error: 'Template not found' });
  }
});

// POST /api/templates - Crea un nuovo template
router.post('/', async (req, res) => {
  try {
    const validation = insertTemplateSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid template data', 
        details: validation.error.issues 
      });
    }

    const template = await templateService.createTemplate(validation.data);
    
    // Se il template è attivo e ha ricorrenza, registra il cron job
    if (template.isActive && template.recurrenceConfig) {
      try {
        const { cronService } = await import('../services/cronService.js');
        await cronService.scheduleTemplate(template.id, template.recurrenceConfig);
      } catch (cronError) {
        console.error('Failed to schedule template job:', cronError);
      }
    }
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /api/templates/:id - Aggiorna un template
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validation = insertTemplateSchema.partial().safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid template data', 
        details: validation.error.issues 
      });
    }

    const template = await templateService.updateTemplate(id, validation.data);
    
    // Aggiorna il cron job se necessario
    if (validation.data.recurrenceConfig !== undefined || validation.data.isActive !== undefined) {
      try {
        const { cronService } = await import('../services/cronService.js');
        if (template.isActive && template.recurrenceConfig) {
          await cronService.scheduleTemplate(template.id, template.recurrenceConfig);
        } else {
          await cronService.unscheduleTemplate(template.id);
        }
      } catch (cronError) {
        console.error('Failed to update template job:', cronError);
      }
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/templates/:id - Elimina un template
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Rimuovi il cron job se presente
    try {
      const { cronService } = await import('../services/cronService.js');
      await cronService.unscheduleTemplate(id);
    } catch (cronError) {
      console.error('Failed to unschedule template job:', cronError);
    }
    
    await templateService.deleteTemplate(id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// PATCH /api/templates/:id/toggle - Attiva/disattiva un template
router.patch('/:id/toggle', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    
    const template = await templateService.toggleTemplate(id, isActive);
    
    // Aggiorna il cron job
    try {
      const { cronService } = await import('../services/cronService.js');
      if (template.isActive && template.recurrenceConfig) {
        await cronService.scheduleTemplate(template.id, template.recurrenceConfig);
      } else {
        await cronService.unscheduleTemplate(template.id);
      }
    } catch (cronError) {
      console.error('Failed to update template job:', cronError);
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error toggling template:', error);
    res.status(500).json({ error: 'Failed to toggle template' });
  }
});

// POST /api/templates/:id/execute - Esegue un template manualmente
router.post('/:id/execute', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validation = templateExecuteSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid execution context', 
        details: validation.error.issues 
      });
    }

    const result = await templateService.executeTemplate(id, validation.data);
    res.json(result);
  } catch (error) {
    console.error('Error executing template:', error);
    res.status(500).json({ error: 'Failed to execute template' });
  }
});

// GET /api/templates/:id/instances - Ottiene le istanze di un template
router.get('/:id/instances', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const instances = await templateService.getTemplateInstances(id);
    res.json(instances);
  } catch (error) {
    console.error('Error fetching template instances:', error);
    res.status(500).json({ error: 'Failed to fetch template instances' });
  }
});

export default router;
