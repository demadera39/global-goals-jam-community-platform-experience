import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Share2, TrendingUp, Camera, FileText, Users, Trophy, Rocket } from 'lucide-react';

const Module5Content = () => {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-8">
        <Badge className="mb-4 bg-orange-600">Module 5</Badge>
        <h1 className="text-4xl font-bold mb-4">After Your Jam</h1>
        <p className="text-xl text-gray-700">
          Transform jam outcomes into lasting impact and build momentum for future action
        </p>
      </div>

      {/* Learning Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-orange-600" />
            Learning Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              'Document and share jam outcomes effectively',
              'Support teams in implementing their solutions',
              'Measure and communicate impact',
              'Build a sustainable community of changemakers',
              'Plan follow-up activities and next jams'
            ].map((outcome, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-orange-600 mt-0.5" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="documentation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documenting Your Jam</CardTitle>
              <CardDescription>
                Capture and share the magic while it's fresh
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Documentation Checklist */}
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-orange-600" />
                  Documentation Checklist
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">During the Jam</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Photos of teams working</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Videos of presentations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Quotes from participants</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Photos of prototypes/outputs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Team names and members</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">After the Jam</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Solution summaries (1-pager each)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Participant feedback survey</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Impact metrics collected</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Thank you emails sent</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span>Social media posts created</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Results Template */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Jam Results Template
                </h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-700">1. Executive Summary</h4>
                      <p className="text-gray-600 ml-4">• Date, location, number of participants</p>
                      <p className="text-gray-600 ml-4">• SDG focus areas</p>
                      <p className="text-gray-600 ml-4">• Key outcomes (3-5 bullet points)</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">2. Challenge & Context</h4>
                      <p className="text-gray-600 ml-4">• Problem statement</p>
                      <p className="text-gray-600 ml-4">• Why this matters locally</p>
                      <p className="text-gray-600 ml-4">• Stakeholders involved</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">3. Solutions Developed</h4>
                      <p className="text-gray-600 ml-4">• Team name & solution title</p>
                      <p className="text-gray-600 ml-4">• Solution description (2-3 sentences)</p>
                      <p className="text-gray-600 ml-4">• Implementation potential</p>
                      <p className="text-gray-600 ml-4">• Visual/prototype image</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700">4. Next Steps</h4>
                      <p className="text-gray-600 ml-4">• Follow-up actions planned</p>
                      <p className="text-gray-600 ml-4">• Support needed</p>
                      <p className="text-gray-600 ml-4">• Timeline for implementation</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sharing Strategy */}
              <Alert>
                <Share2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sharing Strategy:</strong> Post results within 48 hours while enthusiasm is high. 
                  Share on social media with #GlobalGoalsJam, send to participants, and upload to the GGJ platform.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Actions</CardTitle>
              <CardDescription>
                Keep the momentum going after the jam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timeline of Follow-up */}
              <div className="space-y-4">
                <h3 className="font-semibold">Post-Jam Timeline</h3>
                
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="bg-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-sm">24h</div>
                      <div className="flex-1">
                        <h4 className="font-medium">Within 24 Hours</h4>
                        <ul className="text-sm text-gray-600 mt-1 space-y-1">
                          <li>• Send thank you message to all participants</li>
                          <li>• Share photos on social media</li>
                          <li>• Back up all documentation</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-sm">1wk</div>
                      <div className="flex-1">
                        <h4 className="font-medium">Within 1 Week</h4>
                        <ul className="text-sm text-gray-600 mt-1 space-y-1">
                          <li>• Send detailed results summary</li>
                          <li>• Share presentation slides/materials</li>
                          <li>• Connect teams with relevant stakeholders</li>
                          <li>• Upload results to GGJ platform</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-orange-400 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-sm">2wk</div>
                      <div className="flex-1">
                        <h4 className="font-medium">Within 2 Weeks</h4>
                        <ul className="text-sm text-gray-600 mt-1 space-y-1">
                          <li>• Schedule follow-up meetings with interested teams</li>
                          <li>• Send feedback survey results</li>
                          <li>• Plan implementation support</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-orange-300 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-sm">1mo</div>
                      <div className="flex-1">
                        <h4 className="font-medium">Within 1 Month</h4>
                        <ul className="text-sm text-gray-600 mt-1 space-y-1">
                          <li>• Check in on implementation progress</li>
                          <li>• Share success stories</li>
                          <li>• Plan next jam or follow-up event</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Templates */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Supporting Implementation</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded p-4">
                    <h4 className="font-medium mb-2">Mentorship Program</h4>
                    <p className="text-sm text-gray-600">
                      Connect teams with experts who can guide implementation
                    </p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Monthly check-ins</li>
                      <li>• Technical guidance</li>
                      <li>• Network connections</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded p-4">
                    <h4 className="font-medium mb-2">Resource Hub</h4>
                    <p className="text-sm text-gray-600">
                      Provide ongoing access to tools and templates
                    </p>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Funding opportunities</li>
                      <li>• Partnership templates</li>
                      <li>• Impact measurement tools</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Measuring Impact</CardTitle>
              <CardDescription>
                Track and communicate the difference you're making
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Impact Metrics */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Key Impact Metrics
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">Output</div>
                    <p className="text-sm text-gray-600 mt-2">Immediate Results</p>
                    <ul className="text-sm mt-3 space-y-1 text-left">
                      <li>• # of participants</li>
                      <li>• # of solutions created</li>
                      <li>• # of prototypes built</li>
                      <li>• # of partnerships formed</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">Outcome</div>
                    <p className="text-sm text-gray-600 mt-2">Short-term Changes</p>
                    <ul className="text-sm mt-3 space-y-1 text-left">
                      <li>• Solutions implemented</li>
                      <li>• People reached</li>
                      <li>• Behavior changes</li>
                      <li>• Resources mobilized</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">Impact</div>
                    <p className="text-sm text-gray-600 mt-2">Long-term Effects</p>
                    <ul className="text-sm mt-3 space-y-1 text-left">
                      <li>• SDG indicators improved</li>
                      <li>• Systems changed</li>
                      <li>• Lives improved</li>
                      <li>• Policies influenced</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Impact Story Template */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Impact Story Framework</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-medium">The Challenge</h4>
                      <p className="text-sm text-gray-600">What problem were we trying to solve?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-medium">The Solution</h4>
                      <p className="text-sm text-gray-600">What did the team create?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-medium">The Implementation</h4>
                      <p className="text-sm text-gray-600">How was it put into action?</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</div>
                    <div>
                      <h4 className="font-medium">The Results</h4>
                      <p className="text-sm text-gray-600">What changed? Include numbers!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">5</div>
                    <div>
                      <h4 className="font-medium">The Future</h4>
                      <p className="text-sm text-gray-600">What's next? How can others replicate?</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reporting Dashboard */}
              <Alert>
                <AlertDescription>
                  <strong>Pro Tip:</strong> Create a simple impact dashboard that you update quarterly. 
                  Visual progress keeps stakeholders engaged and attracts new supporters.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Building Community</CardTitle>
              <CardDescription>
                Create lasting connections beyond the jam
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Community Building Strategies */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Online Community
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">Slack/Discord Channel</h4>
                      <p className="text-sm text-gray-600">
                        Create dedicated channels for ongoing collaboration
                      </p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">Monthly Virtual Meetups</h4>
                      <p className="text-sm text-gray-600">
                        Share progress, challenges, and learnings
                      </p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium">Resource Library</h4>
                      <p className="text-sm text-gray-600">
                        Shared drive with templates, guides, and case studies
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Recognition Programs
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-medium">Impact Awards</h4>
                      <p className="text-sm text-gray-600">
                        Quarterly recognition for implemented solutions
                      </p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-medium">Ambassador Program</h4>
                      <p className="text-sm text-gray-600">
                        Empower champions to spread the movement
                      </p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-medium">Success Spotlights</h4>
                      <p className="text-sm text-gray-600">
                        Feature stories in newsletters and social media
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alumni Engagement */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Alumni Engagement Ideas</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="bg-purple-600 text-white rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                    <h4 className="font-medium text-sm">Mentorship</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Past participants mentor new jammers
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-600 text-white rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Share2 className="h-6 w-6" />
                    </div>
                    <h4 className="font-medium text-sm">Speaking</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Share experiences at future events
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-600 text-white rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <h4 className="font-medium text-sm">Judging</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Evaluate solutions at next jams
                    </p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Rocket className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Ready for Your Next Jam?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Use learnings from this jam to make the next one even better!
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline">Review Feedback</Button>
                  <Button>Plan Next Jam</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Module5Content;