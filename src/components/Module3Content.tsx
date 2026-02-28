import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Target, Calendar, Lightbulb, MapPin, Clock, Share2, FileText, Users, Globe } from 'lucide-react';

const Module3Content = () => {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8">
        <Badge className="mb-4 bg-green-600">Module 3</Badge>
        <h1 className="text-4xl font-bold mb-4">Open Design & Knowledge Sharing</h1>
        <p className="text-xl text-gray-700">Learn how to design your jam for maximum knowledge sharing and community impact through open design principles.</p>
      </div>

      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-green-600" />
            Why Open Design Matters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Open design isn't just about sharing your final outputs—it's about designing your entire jam process to generate knowledge that can be easily shared, adapted, and built upon by others in the Global Goals Jam community.</p>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">The Open Design Mindset</h4>
            <p className="text-green-800 text-sm">Every decision you make as a host—from how you frame challenges to how you document outcomes—should consider: "How can this help other hosts learn and improve their own jams?"</p>
          </div>
        </CardContent>
      </Card>

      {/* Core Principles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Five Principles of Open Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold mb-2">1. Design for Transparency</h4>
              <p className="text-sm text-muted-foreground mb-2">Make your process visible from start to finish. Share not just what worked, but what didn't and why.</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Document your planning decisions and rationale</li>
                <li>• Share failed experiments alongside successes</li>
                <li>• Make your methods and materials openly available</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold mb-2">2. Design for Adaptation</h4>
              <p className="text-sm text-muted-foreground mb-2">Create resources that others can easily modify for their local context.</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Use modular session designs that can be mixed and matched</li>
                <li>• Provide templates with clear customization guidance</li>
                <li>• Document the 'why' behind your choices, not just the 'what'</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold mb-2">3. Design for Learning</h4>
              <p className="text-sm text-muted-foreground mb-2">Structure your jam to generate insights that benefit the broader community.</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Build in reflection moments throughout your jam</li>
                <li>• Capture participant insights about the process itself</li>
                <li>• Test new methods and share your learnings</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold mb-2">4. Design for Connection</h4>
              <p className="text-sm text-muted-foreground mb-2">Create opportunities for your participants to connect with the global community.</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Share participant stories and insights globally</li>
                <li>• Connect local solutions to global challenges</li>
                <li>• Facilitate peer learning between jams</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold mb-2">5. Design for Impact</h4>
              <p className="text-sm text-muted-foreground mb-2">Ensure your open sharing contributes to real-world change.</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Focus on actionable insights and practical solutions</li>
                <li>• Connect outputs to ongoing initiatives and movements</li>
                <li>• Measure and share the impact of knowledge sharing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentation Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Your Documentation Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Effective documentation is the backbone of open design. Here's a simple framework to capture and share knowledge from your jam:</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-900">Before Your Jam</h4>
              <ul className="text-sm space-y-1">
                <li>• Challenge framing and context</li>
                <li>• Method selection rationale</li>
                <li>• Participant recruitment strategy</li>
                <li>• Expected outcomes and success metrics</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 text-green-900">During Your Jam</h4>
              <ul className="text-sm space-y-1">
                <li>• Real-time observations and adjustments</li>
                <li>• Participant feedback and reactions</li>
                <li>• Unexpected insights and discoveries</li>
                <li>• Photos and videos of the process</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 text-purple-900">After Your Jam</h4>
              <ul className="text-sm space-y-1">
                <li>• Final outputs and solutions</li>
                <li>• Participant reflections and learnings</li>
                <li>• What worked well and what didn't</li>
                <li>• Recommendations for future hosts</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 text-orange-900">Follow-up Impact</h4>
              <ul className="text-sm space-y-1">
                <li>• Actions taken by participants</li>
                <li>• Connections made and partnerships formed</li>
                <li>• Long-term outcomes and changes</li>
                <li>• Lessons for the broader community</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Sharing Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Building Your Knowledge Sharing Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Create a simple, repeatable process for capturing and sharing knowledge:</p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold mb-1">Set Up Your Documentation System</h4>
                <p className="text-sm text-muted-foreground">Choose tools that work for your team—shared documents, photo albums, video recordings, or simple note-taking apps.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold mb-1">Assign Documentation Roles</h4>
                <p className="text-sm text-muted-foreground">Designate team members to capture different aspects—one for photos, one for participant quotes, one for process observations.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold mb-1">Create Sharing Templates</h4>
                <p className="text-sm text-muted-foreground">Develop simple formats for sharing different types of content—method summaries, participant stories, outcome reports.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h4 className="font-semibold mb-1">Schedule Regular Sharing</h4>
                <p className="text-sm text-muted-foreground">Set up a rhythm for sharing—weekly updates during planning, daily posts during your jam, and comprehensive reports afterward.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licensing and Legal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-600" />
            Making It Legal: Licensing Your Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>To truly enable open sharing, you need to be clear about how others can use your work:</p>
          
          <div className="bg-emerald-50 p-4 rounded-lg">
            <h4 className="font-semibold text-emerald-900 mb-2">Recommended: Creative Commons Attribution (CC BY)</h4>
            <p className="text-emerald-800 text-sm mb-2">This license allows others to distribute, remix, adapt, and build upon your work, even commercially, as long as they credit you for the original creation.</p>
            <p className="text-emerald-700 text-xs">Perfect for jam methods, templates, and documentation that you want to see widely adopted and adapted.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 border rounded">
              <h5 className="font-medium mb-1">For Methods & Templates</h5>
              <p className="text-xs text-muted-foreground">Use CC BY to encourage adaptation and improvement by other hosts.</p>
            </div>
            
            <div className="p-3 border rounded">
              <h5 className="font-medium mb-1">For Participant Stories</h5>
              <p className="text-xs text-muted-foreground">Always get explicit permission before sharing personal stories or photos.</p>
            </div>
            
            <div className="p-3 border rounded">
              <h5 className="font-medium mb-1">For Solutions & Ideas</h5>
              <p className="text-xs text-muted-foreground">Consider CC BY-SA (ShareAlike) to ensure improvements remain open.</p>
            </div>
            
            <div className="p-3 border rounded">
              <h5 className="font-medium mb-1">For Branding Materials</h5>
              <p className="text-xs text-muted-foreground">Keep Global Goals Jam branding under standard copyright protection.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Key Takeaways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>Design with sharing in mind:</strong> Every aspect of your jam should consider how it can benefit other hosts and the broader community.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>Document the journey, not just the destination:</strong> Process insights are often more valuable than final outputs for other hosts.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>Create systems, not just content:</strong> Build repeatable workflows for capturing and sharing knowledge from every jam.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>License for impact:</strong> Use open licenses to ensure your work can be freely adapted and improved by others.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>Connect locally and globally:</strong> Help participants see how their local work contributes to global change.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Module3Content;