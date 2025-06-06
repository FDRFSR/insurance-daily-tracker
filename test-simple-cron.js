// Simplified test version of cronService
console.log('cronService.ts is being loaded...');

export const cronService = {
  setTemplateService: (service: any) => {
    console.log('setTemplateService called');
  },
  initialize: async () => {
    console.log('initialize called');
  },
  scheduleTemplate: async (id: number, config: any) => {
    console.log('scheduleTemplate called');
  },
  unscheduleTemplate: async (id: number) => {
    console.log('unscheduleTemplate called');
  }
};

console.log('cronService exported');
