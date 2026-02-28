import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Users, Megaphone, Brain, Heart, Sparkles, Timer, Wrench, Target, Lightbulb, CheckSquare } from 'lucide-react';

const Module4Content = () => {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-8">
        <Badge className="mb-4 bg-purple-600">Module 4</Badge>
        <h1 className="text-4xl font-bold mb-4">The Jamkit Toolkit</h1>
        <p className="text-xl text-gray-700">Master the complete toolkit of methods, materials, and approaches for running successful Global Goals Jams that create real impact.</p>
      </div>

      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-purple-600" />
            Your Complete Facilitation Toolkit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>The Jamkit isn't just a collection of methods—it's a carefully curated system of tools, techniques, and approaches designed to help you navigate the complexity of collaborative problem-solving around the SDGs.</p>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">The Jamkit Philosophy</h4>
            <p className="text-purple-800 text-sm">Every tool in your kit serves a purpose: to help participants move from individual perspectives to collective understanding, from problems to possibilities, and from ideas to action.</p>
          </div>
        </CardContent>
      </Card>

      {/* Method Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Four Categories of Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold mb-2 text-blue-900">🔍 Exploration Methods</h4>
                <p className="text-sm text-muted-foreground mb-2">Help participants understand the challenge space and each other's perspectives.</p>
                <ul className="text-sm space-y-1">
                  <li>• Stakeholder mapping</li>
                  <li>• Problem tree analysis</li>
                  <li>• Perspective taking exercises</li>
                  <li>• Systems mapping</li>
                  <li>• Challenge reframing</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold mb-2 text-green-900">💡 Ideation Methods</h4>
                <p className="text-sm text-muted-foreground mb-2">Generate creative solutions and breakthrough thinking.</p>
                <ul className="text-sm space-y-1">
                  <li>• Brainstorming variations</li>
                  <li>• SCAMPER technique</li>
                  <li>• Analogical thinking</li>
                  <li>• Constraint-based ideation</li>
                  <li>• Building on ideas</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold mb-2 text-orange-900">🎯 Convergence Methods</h4>
                <p className="text-sm text-muted-foreground mb-2">Help groups make decisions and prioritize solutions.</p>
                <ul className="text-sm space-y-1">
                  <li>• Dot voting and prioritization</li>
                  <li>• Impact/effort matrix</li>
                  <li>• Consensus building</li>
                  <li>• Solution clustering</li>
                  <li>• Feasibility assessment</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold mb-2 text-red-900">🚀 Action Methods</h4>
                <p className="text-sm text-muted-foreground mb-2">Transform ideas into concrete plans and commitments.</p>
                <ul className="text-sm space-y-1">
                  <li>• Action planning templates</li>
                  <li>• Resource mapping</li>
                  <li>• Timeline development</li>
                  <li>• Commitment ceremonies</li>
                  <li>• Next steps definition</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Method Selection Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Choosing the Right Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>The key to successful facilitation is selecting methods that match your context, participants, and objectives. Here's how to choose:</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Consider Your Participants</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Experience Level</h5>
                  <p className="text-blue-800">Beginners need more structure and guidance; experts can handle open-ended methods.</p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Group Size</h5>
                  <p className="text-blue-800">Small groups (5-8) can use intimate methods; large groups need structured breakouts.</p>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Cultural Context</h5>
                  <p className="text-blue-800">Some cultures prefer individual reflection before group sharing; others thrive on immediate collaboration.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Match Your Objectives</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">If you want to...</h5>
                  <ul className="space-y-1 text-green-800">
                    <li>• Build empathy → Use perspective-taking exercises</li>
                    <li>• Generate many ideas → Use divergent brainstorming</li>
                    <li>• Make decisions → Use convergent prioritization</li>
                    <li>• Create commitment → Use action planning</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Energy Management</h5>
                  <ul className="space-y-1 text-green-800">
                    <li>• High energy → Use movement and interaction</li>
                    <li>• Low energy → Use reflection and individual work</li>
                    <li>• Mixed energy → Alternate between active and calm</li>
                    <li>• Building energy → Start small, build to big</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Essential Materials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-green-600" />
            Your Materials Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Having the right materials ready makes all the difference. Here's your comprehensive checklist:</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-900">📝 Writing & Documentation</h4>
                <ul className="text-sm space-y-1">
                  <li>• Flip chart paper (lots!)</li>
                  <li>• Sticky notes (multiple colors)</li>
                  <li>• Markers (thick and thin)</li>
                  <li>• Pens for participants</li>
                  <li>• Name tags and labels</li>
                  <li>• Notebooks for reflection</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-900">🎯 Facilitation Tools</h4>
                <ul className="text-sm space-y-1">
                  <li>• Timer (visible to all)</li>
                  <li>• Bell or chime</li>
                  <li>• Masking tape</li>
                  <li>• Dot stickers for voting</li>
                  <li>• Index cards</li>
                  <li>• Scissors</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-900">💻 Digital Tools</h4>
                <ul className="text-sm space-y-1">
                  <li>• Laptop/tablet for documentation</li>
                  <li>• Camera for capturing outputs</li>
                  <li>• Projector or large screen</li>
                  <li>• Extension cords and adapters</li>
                  <li>• Backup internet connection</li>
                  <li>• Digital collaboration tools</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-900">🏠 Space & Comfort</h4>
                <ul className="text-sm space-y-1">
                  <li>• Moveable chairs and tables</li>
                  <li>• Wall space for posting</li>
                  <li>• Good lighting</li>
                  <li>• Snacks and water</li>
                  <li>• Background music playlist</li>
                  <li>• First aid kit</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Planning Framework */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-orange-600" />
            Session Planning Framework
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Use this framework to design sessions that flow naturally and achieve your objectives:</p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold mb-1">Opening (15-20 minutes)</h4>
                <p className="text-sm text-muted-foreground mb-2">Set the tone, build connection, and orient participants.</p>
                <ul className="text-sm space-y-1">
                  <li>• Welcome and introductions</li>
                  <li>• Purpose and agenda overview</li>
                  <li>• Ground rules and expectations</li>
                  <li>• Energizer or icebreaker</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold mb-1">Exploration (30-45 minutes)</h4>
                <p className="text-sm text-muted-foreground mb-2">Help participants understand the challenge and each other.</p>
                <ul className="text-sm space-y-1">
                  <li>• Challenge presentation and context</li>
                  <li>• Stakeholder mapping or systems thinking</li>
                  <li>• Perspective sharing exercises</li>
                  <li>• Problem reframing activities</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold mb-1">Ideation (45-60 minutes)</h4>
                <p className="text-sm text-muted-foreground mb-2">Generate creative solutions and possibilities.</p>
                <ul className="text-sm space-y-1">
                  <li>• Individual brainstorming first</li>
                  <li>• Group idea sharing and building</li>
                  <li>• Creative thinking techniques</li>
                  <li>• Idea clustering and themes</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h4 className="font-semibold mb-1">Convergence (30-40 minutes)</h4>
                <p className="text-sm text-muted-foreground mb-2">Make decisions and prioritize solutions.</p>
                <ul className="text-sm space-y-1">
                  <li>• Criteria setting for evaluation</li>
                  <li>• Prioritization and voting</li>
                  <li>• Feasibility assessment</li>
                  <li>• Solution refinement</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
              <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
              <div>
                <h4 className="font-semibold mb-1">Action Planning (20-30 minutes)</h4>
                <p className="text-sm text-muted-foreground mb-2">Transform ideas into concrete next steps.</p>
                <ul className="text-sm space-y-1">
                  <li>• Action step definition</li>
                  <li>• Resource and timeline mapping</li>
                  <li>• Responsibility assignment</li>
                  <li>• Commitment and accountability</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm font-bold">6</div>
              <div>
                <h4 className="font-semibold mb-1">Closing (10-15 minutes)</h4>
                <p className="text-sm text-muted-foreground mb-2">Reflect, celebrate, and connect to next steps.</p>
                <ul className="text-sm space-y-1">
                  <li>• Key insights and learnings</li>
                  <li>• Appreciation and celebration</li>
                  <li>• Next steps and follow-up</li>
                  <li>• Feedback and evaluation</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adaptation Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-600" />
            Adapting Methods to Your Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Every jam is unique. Here's how to adapt methods to fit your specific context:</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🌍 Cultural Adaptation</h4>
              <ul className="text-sm space-y-1">
                <li>• Respect local communication styles</li>
                <li>• Consider hierarchy and authority dynamics</li>
                <li>• Adapt to time and punctuality norms</li>
                <li>• Include local examples and references</li>
                <li>• Honor traditional decision-making processes</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">⏰ Time Constraints</h4>
              <ul className="text-sm space-y-1">
                <li>• Prioritize essential activities</li>
                <li>• Use rapid prototyping techniques</li>
                <li>• Combine similar activities</li>
                <li>• Prepare pre-work for participants</li>
                <li>• Focus on key decisions and actions</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">💻 Virtual Adaptations</h4>
              <ul className="text-sm space-y-1">
                <li>• Use breakout rooms for small groups</li>
                <li>• Leverage digital collaboration tools</li>
                <li>• Build in more frequent breaks</li>
                <li>• Use polls and reactions for engagement</li>
                <li>• Send materials in advance</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🎯 Objective Focus</h4>
              <ul className="text-sm space-y-1">
                <li>• Align every activity to your goals</li>
                <li>• Cut activities that don't serve the purpose</li>
                <li>• Modify methods to fit your outcomes</li>
                <li>• Add reflection moments for key insights</li>
                <li>• Design for your specific success metrics</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practical Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            Practical Tips for Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-pink-600 mt-0.5" />
              <p className="text-sm"><strong>Start small and build confidence:</strong> Master 2-3 methods well before expanding your toolkit. Quality over quantity.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-pink-600 mt-0.5" />
              <p className="text-sm"><strong>Prepare materials in advance:</strong> Set up your space and organize materials before participants arrive. Label everything clearly.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-pink-600 mt-0.5" />
              <p className="text-sm"><strong>Build in flexibility:</strong> Have backup activities ready and be prepared to adjust timing based on group energy and engagement.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-pink-600 mt-0.5" />
              <p className="text-sm"><strong>Practice active facilitation:</strong> Move around the room, check in with groups, and provide guidance without taking over.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-pink-600 mt-0.5" />
              <p className="text-sm"><strong>Document everything:</strong> Capture not just outputs but also process insights, participant feedback, and your own observations.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-pink-600 mt-0.5" />
              <p className="text-sm"><strong>Seek feedback and iterate:</strong> Ask participants what worked and what didn't. Use their insights to improve your next jam.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Module4Content;