import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { CheckCircle2, Circle, Download, ExternalLink, BookOpen, Lightbulb, Target, Users, FileText } from 'lucide-react';
import { courseModules, courseResources } from '../data/courseContent';
import { getTemplate } from '../lib/allModuleTemplates';

interface ModuleExercisesEnhancedProps {
  moduleNumber: number;
  showResources?: boolean;
}

export function ModuleExercisesEnhanced({ moduleNumber, showResources = false }: ModuleExercisesEnhancedProps) {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [exerciseAnswers, setExerciseAnswers] = useState<{ [key: string]: string }>({});

  const module = courseModules.find(m => m.moduleNumber === moduleNumber);
  const resources = courseResources[moduleNumber as keyof typeof courseResources] || [];

  if (!module) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Module not found</p>
        </CardContent>
      </Card>
    );
  }

  const handleExerciseComplete = (exerciseId: string) => {
    setCompletedExercises(prev => new Set(prev).add(exerciseId));
  };

  const handleAnswerChange = (exerciseId: string, value: string) => {
    setExerciseAnswers(prev => ({ ...prev, [exerciseId]: value }));
  };

  const openTemplate = (templateId: string) => {
    const template = getTemplate(templateId);
    if (template) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(template.content);
        newWindow.document.close();
      }
    }
  };

  const getExerciseDetails = (exerciseId: string, exercise?: any) => {
    const details: { [key: string]: { steps: string[], tips: string[], checkQuestions: string[] } } = {
      'ex1-1': {
        steps: [
          'Open the Jamkit Inventory Checklist template',
          'Go through each category systematically',
          'Check off items you already have',
          'Note quantities needed for missing items',
          'Add any location-specific requirements',
          'Create a procurement plan for missing items',
          'Share with co-hosts for input'
        ],
        tips: [
          'Be realistic about what you can source locally',
          'Consider borrowing items from partners',
          'Digital tools can replace some physical materials'
        ],
        checkQuestions: [
          'Do you have all essential materials?',
          'Have you identified backup options?',
          'Is your budget allocated appropriately?'
        ]
      },
      'ex1-2': {
        steps: [
          'Open the Personal Intentions Canvas',
          'Reflect on your motivation for hosting',
          'Write your personal "why" statement',
          'Identify your unique strengths',
          'List your goals for the jam',
          'Acknowledge potential challenges',
          'Define your commitment to participants',
          'Map your support network'
        ],
        tips: [
          'Be honest about your motivations',
          'Connect your why to the SDGs',
          'Your vulnerability creates trust'
        ],
        checkQuestions: [
          'Is your why compelling and authentic?',
          'Have you identified concrete goals?',
          'Do you have adequate support?'
        ]
      },
      'ex1-3': {
        steps: [
          'Open the Overview Planning Worksheet',
          'List potential partner organizations',
          'Identify their strengths and resources',
          'Map connection points with SDGs',
          'Draft partnership value propositions',
          'Create outreach timeline',
          'Prepare partnership pitch'
        ],
        tips: [
          'Look for complementary strengths',
          'Consider non-traditional partners',
          'Start conversations early'
        ],
        checkQuestions: [
          'Have you identified 3-5 potential partners?',
          'Is the value exchange clear?',
          'Do you have a follow-up plan?'
        ]
      },
      'ex2-1': {
        steps: [
          'Open the Complex vs Complicated Matrix',
          'List current challenges in your context',
          'Categorize each as complex or complicated',
          'Identify appropriate solution approaches',
          'Note interconnections between challenges',
          'Find leverage points for intervention',
          'Document your insights'
        ],
        tips: [
          'Complex problems have no single solution',
          'Look for patterns, not just problems',
          'Embrace uncertainty in complex spaces'
        ],
        checkQuestions: [
          'Can you distinguish complex from complicated?',
          'Have you identified system patterns?',
          'Are your interventions appropriate?'
        ]
      },
      'ex2-2': {
        steps: [
          'Open the Change vs Transformation Canvas',
          'Define what needs to change incrementally',
          'Identify areas needing transformation',
          'Map the journey for each',
          'Consider timeline and resources',
          'Identify resistance points',
          'Create action steps for both'
        ],
        tips: [
          'Change improves; transformation reimagines',
          'Both are needed for SDG progress',
          'Start with change, aim for transformation'
        ],
        checkQuestions: [
          'Is your vision transformative enough?',
          'Are your first steps achievable?',
          'Have you balanced ambition with reality?'
        ]
      },
      'ex2-3': {
        steps: [
          'Open the Systems Thinking Toolkit',
          'Choose an SDG challenge to map',
          'Identify all system elements',
          'Draw connections and relationships',
          'Find feedback loops',
          'Identify leverage points',
          'Consider time delays',
          'Design intervention strategy'
        ],
        tips: [
          'Everything connects to everything else',
          'Small changes can have big impacts',
          'Time delays hide cause and effect'
        ],
        checkQuestions: [
          'Have you mapped key relationships?',
          'Did you find feedback loops?',
          'Are your leverage points strategic?'
        ]
      },
      'ex3-1': {
        steps: [
          'Open the Open Design Principles Framework',
          'Rate your current practices (1-5)',
          'Identify gaps in each principle',
          'Create improvement actions',
          'Set measurable goals',
          'Plan implementation timeline'
        ],
        tips: [
          'Transparency builds trust',
          'Documentation enables scaling',
          'Sharing multiplies impact'
        ],
        checkQuestions: [
          'Are you truly open in your approach?',
          'How will you measure openness?',
          'What will you contribute back?'
        ]
      },
      'ex3-2': {
        steps: [
          'Open the Knowledge Sharing Canvas',
          'Map what knowledge you have',
          'Identify knowledge gaps',
          'Plan capture methods',
          'Choose sharing channels',
          'Design knowledge products',
          'Define impact metrics'
        ],
        tips: [
          'Knowledge shared is knowledge multiplied',
          'Different formats reach different people',
          'Make it easy for others to use'
        ],
        checkQuestions: [
          'Will your knowledge be accessible?',
          'Have you planned diverse formats?',
          'How will you measure impact?'
        ]
      },
      'ex3-3': {
        steps: [
          'Open the Documentation Template',
          'Plan documentation timeline',
          'Assign documentation roles',
          'Prepare capture tools',
          'Create documentation checklist',
          'Design sharing strategy'
        ],
        tips: [
          'Document as you go, not after',
          'Photos tell powerful stories',
          'Include participant voices'
        ],
        checkQuestions: [
          'Is documentation built into your plan?',
          'Who is responsible for what?',
          'How will you share outcomes?'
        ]
      },
      'ex4-1': {
        steps: [
          'Open the Method Selection Guide',
          'Define your specific challenge',
          'Consider time and group size',
          'Match methods to outcomes',
          'Test method combinations',
          'Create backup options',
          'Document your choices'
        ],
        tips: [
          'Match energy to time of day',
          'Have backup methods ready',
          'Practice new methods beforehand'
        ],
        checkQuestions: [
          'Do methods match your objectives?',
          'Have you considered group dynamics?',
          'Are you prepared with alternatives?'
        ]
      },
      'ex4-2': {
        steps: [
          'Open the Session Planning Template',
          'Map out full timeline',
          'Assign methods to time blocks',
          'Plan transitions',
          'Include buffer time',
          'Prepare materials list',
          'Create facilitator notes',
          'Plan documentation moments'
        ],
        tips: [
          'Build in flexibility',
          'Energy management is crucial',
          'Transitions are as important as activities'
        ],
        checkQuestions: [
          'Is your timing realistic?',
          'Have you planned for different scenarios?',
          'Are materials ready for each section?'
        ]
      },
      'ex4-3': {
        steps: [
          'Open the Materials Checklist',
          'Review your session plan',
          'List all required materials',
          'Check quantities needed',
          'Identify sourcing options',
          'Create setup timeline',
          'Assign preparation tasks'
        ],
        tips: [
          'Always have 20% extra supplies',
          'Test all technology beforehand',
          'Create a setup checklist'
        ],
        checkQuestions: [
          'Do you have everything listed?',
          'Are backups in place?',
          'Is setup time allocated?'
        ]
      },
      'ex5-1': {
        steps: [
          'Open the Facilitation Plan',
          'Define session objectives',
          'Plan energy arc',
          'Design engagement strategies',
          'Prepare for difficult situations',
          'Create personal mantras',
          'Build confidence practices'
        ],
        tips: [
          'Your energy sets the room\'s energy',
          'Prepare for multiple scenarios',
          'Trust the process and the group'
        ],
        checkQuestions: [
          'Are you mentally prepared?',
          'Do you have strategies for challenges?',
          'How will you maintain energy?'
        ]
      },
      'ex5-2': {
        steps: [
          'Open the Engagement Techniques Toolkit',
          'Review all techniques',
          'Practice each technique',
          'Adapt to your style',
          'Create technique combinations',
          'Build your go-to toolkit',
          'Practice transitions'
        ],
        tips: [
          'Master 3-5 techniques deeply',
          'Practice makes natural',
          'Read the room and adapt'
        ],
        checkQuestions: [
          'Can you execute smoothly?',
          'Do you have variety in your toolkit?',
          'Can you adapt on the fly?'
        ]
      },
      'ex5-3': {
        steps: [
          'Open the Reflection Guide',
          'Schedule reflection time',
          'Gather feedback systematically',
          'Complete self-assessment',
          'Identify patterns',
          'Create improvement plan',
          'Share learnings with community'
        ],
        tips: [
          'Reflection accelerates growth',
          'Be honest but kind to yourself',
          'Share failures as learning'
        ],
        checkQuestions: [
          'Will you commit to regular reflection?',
          'How will you track progress?',
          'Who will you share learnings with?'
        ]
      }
    };

    return details[exerciseId] || { steps: exercise?.steps || [], tips: exercise?.tips || [], checkQuestions: exercise?.checkQuestions || [] };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Module {moduleNumber} Exercises
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {module.exercises.map((exercise, index) => {
            const details = getExerciseDetails(exercise.id, exercise);
            const isCompleted = completedExercises.has(exercise.id);
            const template = getTemplate(exercise.templateId);

            return (
              <Card key={exercise.id} className="border-l-4 border-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{exercise.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                      </div>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Access */}
                  {template && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">Template: {template.title}</span>
                        </div>
                        <Button
                          onClick={() => openTemplate(exercise.templateId)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Template
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Steps to Complete
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-6">
                      {details.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Pro Tips */}
                  {details.tips.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                        Pro Tips
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {details.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Check Questions */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Check Your Work
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {details.checkQuestions.map((question, i) => (
                        <li key={i}>✓ {question}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Response Area */}
                  <div className="space-y-2">
                    <label className="font-medium text-sm">Your Response</label>
                    <Textarea
                      placeholder="Document your work, insights, and reflections here..."
                      value={exerciseAnswers[exercise.id] || ''}
                      onChange={(e) => handleAnswerChange(exercise.id, e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleExerciseComplete(exercise.id)}
                      variant={isCompleted ? "default" : "outline"}
                      className="gap-2"
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Resources Section (optional; hidden to avoid duplication with Resources tab) */}
      {showResources && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Module Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{resource.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{resource.description}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs rounded">
                    {resource.type}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}