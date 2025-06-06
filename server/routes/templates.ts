import { Router } from 'express';
import { templateService } from '../services/templateService';
import { cronService } from '../services/cronService';
import type { InsertTemplate } from '@shared/types/template';

const router = Router();

/**
 * GET /api/templates
 * Ottiene tutti i templates
 */
router.get('/', async (req, res) => {
  try {
    const templates = await templateService.getTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/templates/cron/status
 * Ottiene lo status dei job cron attivi
 */
router.get('/cron/status', async (req, res) => {
  try {
    const activeJobs = cronService.getActiveJobs();
    res.json({
      totalJobs: activeJobs.length,
      jobs: activeJobs
    });
  } catch (error) {
    console.error('Error fetching cron status:', error);
    res.status(500).json({ error: 'Failed to fetch cron status' });
  }
});

/**
 * GET /api/templates/active
 * Ottiene solo i templates attivi
 */
router.get('/active', async (req, res) => {
  try {
    const activeTemplates = await templateService.getActiveTemplates();
    res.json(activeTemplates);
  } catch (error) {
    console.error('Error fetching active templates:', error);
    res.status(500).json({ error: 'Failed to fetch active templates' });
  }
});

/**
 * GET /api/templates/:id
 * Ottiene un template specifico
 */
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

/**
 * POST /api/templates
 * Crea un nuovo template
 */
router.post('/', async (req, res) => {
  try {
    const templateData: InsertTemplate = req.body;
    
    // Validazione base
    if (!templateData.name || !templateData.titleTemplate || !templateData.category) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, titleTemplate, category' 
      });
    }

    const template = await templateService.createTemplate(templateData);
    
    // Se il template è attivo e ha una configurazione di ricorrenza, pianifica l'esecuzione
    if (template.isActive && template.recurrenceConfig) {
      await cronService.scheduleTemplate(template.id, template.recurrenceConfig);
    }
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * PUT /api/templates/:id
 * Aggiorna un template
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Partial<InsertTemplate> = req.body;
    
    const template = await templateService.updateTemplate(id, updates);
    
    // Rimuovi la pianificazione esistente
    await cronService.unscheduleTemplate(id);
    
    // Se il template è attivo e ha una configurazione di ricorrenza, ripianifica
    if (template.isActive && template.recurrenceConfig) {
      await cronService.scheduleTemplate(template.id, template.recurrenceConfig);
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * DELETE /api/templates/:id
 * Elimina un template
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Rimuovi la pianificazione se presente
    await cronService.unscheduleTemplate(id);
    
    await templateService.deleteTemplate(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

/**
 * PATCH /api/templates/:id/toggle
 * Attiva/disattiva un template
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }
    
    const template = await templateService.toggleTemplate(id, isActive);
    
    if (isActive && template.recurrenceConfig) {
      // Attiva la pianificazione
      await cronService.scheduleTemplate(template.id, template.recurrenceConfig);
    } else {
      // Disattiva la pianificazione
      await cronService.unscheduleTemplate(id);
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error toggling template:', error);
    res.status(500).json({ error: 'Failed to toggle template' });
  }
});

/**
 * POST /api/templates/:id/execute
 * Esegue manualmente un template
 */
router.post('/:id/execute', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const context = req.body.context || {};
    
    const result = await templateService.executeTemplate(id, context);
    res.json(result);
  } catch (error) {
    console.error('Error executing template:', error);
    res.status(500).json({ error: 'Failed to execute template' });
  }
});

/**
 * GET /api/templates/:id/instances
 * Ottiene le istanze di esecuzione di un template
 */
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