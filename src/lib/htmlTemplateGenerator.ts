// HTML Template Generator for Global Goals Jam Host Certification Course

import { htmlTemplateGenerators } from './htmlTemplates';
import { moduleTemplateGenerators } from './moduleTemplates';
import { getTemplate } from './allModuleTemplates';

// Combine all template generators
const allTemplateGenerators = {
  ...htmlTemplateGenerators,
  ...moduleTemplateGenerators
};

export const generateHTMLTemplate = (templateType: string): string => {
  // First try to get from the new allModuleTemplates
  const template = getTemplate(templateType);
  if (template) {
    return template.content;
  }
  
  // Fallback to old generators
  const generator = allTemplateGenerators[templateType];
  
  if (!generator) {
    console.error(`Template type "${templateType}" not found`);
    return '<html><body><h1>Template not found</h1></body></html>';
  }
  
  // Call the generator function with default data
  const templateData = {
    title: getTemplateTitle(templateType),
    subtitle: getTemplateSubtitle(templateType),
    userName: '',
    date: new Date().toLocaleDateString(),
    moduleNumber: getModuleNumber(templateType),
    templateType: templateType
  };
  
  return generator(templateData);
};

const getTemplateTitle = (templateType: string): string => {
  const titles: Record<string, string> = {
    // Module 1
    'overview-worksheet': 'Host Goals & Outcomes Worksheet',
    'intentions-canvas': 'Personal Intentions Canvas',
    'host-pledge': 'Global Goals Jam Host Pledge',
    
    // Module 2
    'complex-matrix': 'Complexity Assessment Matrix',
    'change-canvas': 'Change vs Transformation Canvas',
    'systems-toolkit': 'Systems Thinking Toolkit',
    
    // Module 3
    'open-design-principles': 'Open Design Principles Worksheet',
    'knowledge-sharing-canvas': 'Knowledge Sharing Canvas',
    
    // Module 4
    'jamkit-checklist': 'Jamkit Preparation Checklist',
    'method-selection-guide': 'Method Selection Guide',
    
    // Module 5
    'facilitation-plan': 'Facilitation Plan',
    'engagement-techniques': 'Engagement Techniques Toolkit'
  };
  
  return titles[templateType] || 'Global Goals Jam Template';
};

const getTemplateSubtitle = (templateType: string): string => {
  const subtitles: Record<string, string> = {
    // Module 1
    'overview-worksheet': 'Define your hosting goals and measurable outcomes',
    'intentions-canvas': 'Map your motivations and alignment with the SDGs',
    'host-pledge': 'Your commitment to the Global Goals Jam movement',
    
    // Module 2
    'complex-matrix': 'Categorize challenges to apply the right approach',
    'change-canvas': 'Compare incremental change vs systemic transformation',
    'systems-toolkit': 'Apply the Iceberg Model and identify leverage points',
    
    // Module 3
    'open-design-principles': 'Apply open design thinking to your jam',
    'knowledge-sharing-canvas': 'Plan your documentation and dissemination strategy',
    
    // Module 4
    'jamkit-checklist': 'Ensure you have everything ready for your jam',
    'method-selection-guide': 'Choose the right methods for each sprint phase',
    
    // Module 5
    'facilitation-plan': 'Design your facilitation approach and techniques',
    'engagement-techniques': 'Build your repertoire of engagement methods'
  };
  
  return subtitles[templateType] || '';
};

const getModuleNumber = (templateType: string): number => {
  const moduleMap: Record<string, number> = {
    // Module 1
    'overview-worksheet': 1,
    'intentions-canvas': 1,
    'host-pledge': 1,
    
    // Module 2
    'complex-matrix': 2,
    'change-canvas': 2,
    'systems-toolkit': 2,
    
    // Module 3
    'open-design-principles': 3,
    'knowledge-sharing-canvas': 3,
    
    // Module 4
    'jamkit-checklist': 4,
    'method-selection-guide': 4,
    
    // Module 5
    'facilitation-plan': 5,
    'engagement-techniques': 5
  };
  
  return moduleMap[templateType] || 1;
};

export const openHTMLInNewWindow = (html: string, title: string) => {
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
    newWindow.document.title = title;
  }
};