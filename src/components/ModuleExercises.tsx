import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { FileText, Download, ExternalLink, CheckCircle2, ChevronRight, Send } from 'lucide-react';
import { generateHTMLTemplate, openHTMLInNewWindow } from '../lib/htmlTemplateGenerator';
import { toast } from 'sonner';

interface Exercise {
  id: string;
  title: string;
  description: string;
  steps?: string[];
  template?: string;
  tips?: string[];
  resources?: { title: string; url?: string; description?: string }[];
  checkQuestion?: string;
}

interface ModuleExercisesProps {
  moduleNumber: number;
  exercises: Exercise[];
  onExerciseComplete?: (exerciseId: string, answer: string) => void;
  completedExercises?: Set<string>;
}

export const ModuleExercises: React.FC<ModuleExercisesProps> = ({ 
  moduleNumber, 
  exercises,
  onExerciseComplete,
  completedExercises = new Set()
}) => {
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const handleTemplateDownload = (templateType: string, title: string) => {
    const html = generateHTMLTemplate(templateType);
    openHTMLInNewWindow(html, title);
    toast.success('Template opened in new window');
  };

  const handleExerciseSubmit = async (exerciseId: string) => {
    const answer = exerciseAnswers[exerciseId];
    if (!answer?.trim()) {
      toast.error('Please provide an answer before submitting');
      return;
    }

    setSubmitting({ ...submitting, [exerciseId]: true });
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onExerciseComplete) {
      onExerciseComplete(exerciseId, answer);
    }
    
    toast.success('Exercise completed successfully!');
    setSubmitting({ ...submitting, [exerciseId]: false });
  };

  const getExerciseDetails = (exercise: Exercise) => {
    // Enhanced exercise details based on module and exercise type
    const exerciseGuides: Record<string, any> = {
      // Module 1 Exercises
      'jamkit-checklist': {
        steps: [
          'Review the complete Jamkit materials list provided in the resources',
          'Create a checklist of all materials you currently have access to',
          'Identify which materials you need to source or create',
          'For each missing item, note potential alternatives or local adaptations',
          'Plan your procurement timeline and budget',
          'Consider digital vs. physical materials based on your context'
        ],
        tips: [
          'Start with essential materials - you don\'t need everything for your first jam',
          'Many materials can be created digitally and shared via screen',
          'Partner with local organizations who might have materials to share',
          'The Global Goals Jam community can provide templates and resources'
        ],
        resources: [
          {
            title: 'Complete Jamkit Inventory',
            description: 'Full list of materials, tools, and resources for hosting a jam'
          },
          {
            title: 'Digital Jamkit Resources',
            description: 'Downloadable templates, presentations, and digital tools'
          },
          {
            title: 'Budget Planning Template',
            description: 'Calculate costs and identify funding sources'
          }
        ],
        checkQuestion: 'What are the top 3 materials you need to source, and how will you obtain them?'
      },
      'why-statement': {
        steps: [
          'Reflect on your personal motivation for hosting a Global Goals Jam',
          'Consider the specific change you want to see in your community',
          'Think about how this connects to the broader SDG mission',
          'Write a first draft focusing on authenticity over perfection',
          'Read it aloud to ensure it feels genuine and inspiring',
          'Refine to one powerful paragraph (3-5 sentences)'
        ],
        tips: [
          'Start with "I believe..." or "I am hosting a Global Goals Jam because..."',
          'Be specific about your community and its challenges',
          'Connect personal experience to global goals',
          'Make it memorable - this will inspire your participants'
        ],
        resources: [
          {
            title: 'Why Statement Examples',
            description: 'Inspiring examples from other Global Goals Jam hosts'
          },
          {
            title: 'Storytelling for Impact',
            description: 'How to craft a compelling narrative for change'
          }
        ],
        checkQuestion: 'Share your Why statement (one paragraph):'
      },
      'partner-mapping': {
        steps: [
          'List all potential stakeholder categories (government, business, NGO, education, etc.)',
          'Identify specific organizations in each category in your area',
          'Research their missions and current initiatives',
          'Map connections to relevant SDGs for each organization',
          'Identify key contact persons and their roles',
          'Prioritize based on alignment, influence, and accessibility',
          'Create an outreach plan with personalized value propositions'
        ],
        tips: [
          'Think beyond the obvious - unexpected partners can bring fresh perspectives',
          'Consider both resource partners and participant partners',
          'Look for organizations already working on SDG-related initiatives',
          'Don\'t forget grassroots organizations and community groups'
        ],
        resources: [
          {
            title: 'Stakeholder Mapping Canvas',
            description: 'Visual tool for mapping and prioritizing partners'
          },
          {
            title: 'Partnership Pitch Template',
            description: 'How to approach potential partners effectively'
          },
          {
            title: 'Local SDG Networks',
            description: 'Find existing SDG initiatives in your region'
          }
        ],
        checkQuestion: 'List your top 5 potential partners and why they\'re important for your jam:'
      },

      // Module 2 Exercises
      'map-complex-challenge': {
        steps: [
          'Download and print the Complex vs Complicated Matrix template',
          'Identify a specific challenge in your community (e.g., youth unemployment, food waste, housing)',
          'List all the factors that contribute to this challenge in the matrix',
          'For each factor, determine if it\'s Complex (interconnected, unpredictable) or Complicated (technical, solvable)',
          'Place each factor in the appropriate quadrant of the matrix',
          'Identify the relationships between factors using arrows or lines',
          'Highlight 2-3 leverage points where intervention could create systemic change'
        ],
        tips: [
          'Complex challenges have multiple stakeholders with different perspectives',
          'Complicated problems have known solutions that just need resources',
          'Look for feedback loops - where solving one issue affects others',
          'Consider both visible symptoms and root causes'
        ],
        resources: [
          {
            title: 'Systems Thinking Primer',
            description: 'Learn the basics of systems thinking and complexity'
          },
          {
            title: 'Iceberg Model',
            description: 'Understand visible events vs. underlying patterns and structures'
          }
        ],
        checkQuestion: 'What type of challenge is yours (complex/complicated) and what approach will you take?'
      },
      'identify-transformation': {
        steps: [
          'Use the Change vs Transformation Canvas to map opportunities',
          'Walk through your community and observe with fresh eyes',
          'Talk to at least 5 different stakeholders about their challenges',
          'List 10 potential areas for improvement',
          'For each area, ask: "Would this be incremental change or systemic transformation?"',
          'Select the top 3 that could create transformation (not just change)',
          'For each transformation opportunity, identify: Who benefits? What shifts? What becomes possible?'
        ],
        tips: [
          'Transformation changes the rules of the game, not just the score',
          'Look for opportunities that address root causes, not symptoms',
          'Consider how technology, policy, and culture intersect',
          'Think about second and third-order effects of interventions'
        ],
        resources: [
          {
            title: 'Theory of Change Guide',
            description: 'Framework for planning transformational initiatives'
          },
          {
            title: 'Stakeholder Mapping Tool',
            description: 'Identify and engage key actors in your system'
          }
        ],
        checkQuestion: 'Describe one transformation opportunity you\'ve identified and its potential impact:'
      },
      'complexity-assessment': {
        steps: [
          'Choose your Global Goals Jam theme based on local needs',
          'Use the Systems Thinking Toolkit to analyze the theme',
          'Map out all the SDGs that connect to your theme',
          'Identify the key stakeholders involved (use stakeholder mapping)',
          'Determine the system boundaries - what\'s included/excluded',
          'Find the feedback loops - reinforcing and balancing',
          'Locate potential intervention points using the Leverage Points framework',
          'Create a one-page visual summary of your complexity assessment'
        ],
        tips: [
          'Every SDG connects to others - find these connections',
          'Include diverse voices in your assessment',
          'Consider timeframes - short vs long-term impacts',
          'Document assumptions you\'re making about the system'
        ],
        resources: [
          {
            title: 'SDG Interconnections Map',
            description: 'Visual guide showing how all 17 SDGs relate to each other'
          },
          {
            title: 'Leverage Points by Donella Meadows',
            description: 'Places to intervene in a system for maximum impact'
          }
        ],
        checkQuestion: 'What are the top 3 leverage points in your system and why?'
      }
    };

    return exerciseGuides[exercise.id] || {
      steps: exercise.steps || [],
      tips: exercise.tips || [],
      resources: exercise.resources || [],
      checkQuestion: exercise.checkQuestion || 'What did you learn from this exercise?'
    };
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Module Exercises</h3>
        <p className="text-gray-600 mt-2">
          Complete these exercises to apply what you've learned and prepare for hosting your Global Goals Jam.
        </p>
      </div>
      
      {exercises.map((exercise, index) => {
        const details = getExerciseDetails(exercise);
        const isCompleted = completedExercises.has(exercise.id);
        const answer = exerciseAnswers[exercise.id] || '';
        const isSubmitting = submitting[exercise.id] || false;
        
        return (
          <Card key={exercise.id} className={`p-6 border-2 transition-all ${
            isCompleted 
              ? 'bg-green-50 border-green-300' 
              : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
          }`}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {exercise.title}
                    </h4>
                    {isCompleted && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-gray-700 ml-11">{exercise.description}</p>
                </div>
                {exercise.template && (
                  <Button
                    onClick={() => handleTemplateDownload(exercise.template, exercise.title)}
                    variant="outline"
                    size="sm"
                    className="ml-4"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Open Template
                  </Button>
                )}
              </div>

              {details.steps && details.steps.length > 0 && (
                <div className="bg-white rounded-lg p-4 ml-11">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <ChevronRight className="w-4 h-4 mr-1" />
                    Step-by-Step Instructions:
                  </h5>
                  <ol className="space-y-2">
                    {details.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {stepIndex + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {details.tips && details.tips.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 ml-11">
                  <h5 className="font-semibold text-gray-900 mb-2">💡 Pro Tips:</h5>
                  <ul className="space-y-1">
                    {details.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="text-gray-700 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {details.resources && details.resources.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 ml-11">
                  <h5 className="font-semibold text-gray-900 mb-3">📚 Helpful Resources:</h5>
                  <div className="space-y-2">
                    {details.resources.map((resource, resourceIndex) => (
                      <div key={resourceIndex} className="flex items-start">
                        <ExternalLink className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-blue-900">{resource.title}</span>
                          {resource.description && (
                            <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exercise Submission Section */}
              <div className="bg-gray-50 rounded-lg p-4 ml-11 mt-4">
                <h5 className="font-semibold text-gray-900 mb-3">✍️ Your Response:</h5>
                <p className="text-sm text-gray-600 mb-3">
                  {details.checkQuestion || 'Complete this exercise and share your findings:'}
                </p>
                <Textarea
                  value={answer}
                  onChange={(e) => setExerciseAnswers({ 
                    ...exerciseAnswers, 
                    [exercise.id]: e.target.value 
                  })}
                  placeholder="Type your answer here..."
                  className="min-h-[120px] bg-white"
                  disabled={isCompleted}
                />
                {!isCompleted && (
                  <Button
                    onClick={() => handleExerciseSubmit(exercise.id)}
                    disabled={isSubmitting || !answer.trim()}
                    className="mt-3 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Exercise
                      </>
                    )}
                  </Button>
                )}
                {isCompleted && (
                  <div className="mt-3 text-green-700 font-medium flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Exercise completed successfully!
                  </div>
                )}
              </div>

              {exercise.template && (
                <div className="flex items-center justify-between pt-4 border-t border-orange-200 ml-11">
                  <p className="text-sm text-gray-600">
                    Use the template to guide your work and document your findings
                  </p>
                  <Button
                    onClick={() => handleTemplateDownload(exercise.template, exercise.title)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Work on Template
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {exercises.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No exercises available for this module yet.</p>
        </Card>
      )}
    </div>
  );
};