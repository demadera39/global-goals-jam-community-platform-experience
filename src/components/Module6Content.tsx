import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Target, BarChart3, Users, TrendingUp, FileText, AlertCircle, Award, Lightbulb, MapPin } from 'lucide-react';

const Module6Content = () => {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-pastel-sky to-pastel-violet/70 rounded-lg p-8">
        <Badge className="mb-4 bg-sky-600">Module 6</Badge>
        <h1 className="text-4xl font-bold mb-4">Monitoring, Evaluation & Impact</h1>
        <p className="text-xl text-foreground/80">Learn to design monitoring frameworks, measure meaningful impact, and demonstrate the value of your Global Goals Jam to participants and stakeholders.</p>
      </div>

      {/* Video Section - Removed empty video */}
      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-600" />
            Why Monitoring & Evaluation Matters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Monitoring and evaluation (M&E) isn't just about proving impact—it's about improving impact. A good M&E framework helps you understand what's working, what isn't, and how to make your jams more effective over time.</p>
          
          <div className="bg-pastel-sky p-4 rounded-lg">
            <h4 className="font-semibold text-sky-900 mb-2">The Three Purposes of M&E</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-sky-800 mb-1">Learning</h5>
                <p className="text-sky-700">Understand what methods work best for different contexts and participants.</p>
              </div>
              <div>
                <h5 className="font-medium text-sky-800 mb-1">Improving</h5>
                <p className="text-sky-700">Use insights to continuously enhance your jam design and facilitation.</p>
              </div>
              <div>
                <h5 className="font-medium text-sky-800 mb-1">Demonstrating</h5>
                <p className="text-sky-700">Show stakeholders and funders the value and impact of your work.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defining Success */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Defining Success for Your Jam
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Before you can measure impact, you need to be clear about what success looks like. Different stakeholders may have different definitions of success.</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-pastel-green rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Participant Success Metrics</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Learning Outcomes</h5>
                  <ul className="space-y-1 text-primary/80">
                    <li>• Increased understanding of SDGs</li>
                    <li>• New skills in collaboration and problem-solving</li>
                    <li>• Systems thinking capabilities</li>
                    <li>• Design thinking competencies</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Behavioral Changes</h5>
                  <ul className="space-y-1 text-primary/80">
                    <li>• Taking action on SDG-related issues</li>
                    <li>• Joining or starting initiatives</li>
                    <li>• Changing personal practices</li>
                    <li>• Advocating for change in their organizations</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-pastel-violet rounded-lg">
              <h4 className="font-semibold text-violet-900 mb-2">Community Impact Metrics</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Network Effects</h5>
                  <ul className="space-y-1 text-violet-800">
                    <li>• New partnerships formed</li>
                    <li>• Cross-sector collaborations</li>
                    <li>• Knowledge sharing between organizations</li>
                    <li>• Collective action initiatives</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Solution Implementation</h5>
                  <ul className="space-y-1 text-violet-800">
                    <li>• Ideas turned into projects</li>
                    <li>• Funding secured for solutions</li>
                    <li>• Policy changes influenced</li>
                    <li>• Community problems addressed</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-pastel-amber/70 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">Organizational Success Metrics</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Capacity Building</h5>
                  <ul className="space-y-1 text-orange-800">
                    <li>• Enhanced facilitation skills</li>
                    <li>• Improved event management</li>
                    <li>• Stronger community connections</li>
                    <li>• Better understanding of local needs</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Sustainability</h5>
                  <ul className="space-y-1 text-orange-800">
                    <li>• Regular jam schedule established</li>
                    <li>• Local funding or support secured</li>
                    <li>• Host network developed</li>
                    <li>• Integration with existing programs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple M&E Framework */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-600" />
            A Simple M&E Framework
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>You don't need a complex system to track meaningful impact. Here's a simple framework that captures the most important information:</p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-pastel-violet/70 rounded-lg">
              <div className="w-8 h-8 bg-violet-500 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold mb-1">Pre-Jam Baseline</h4>
                <p className="text-sm text-muted-foreground mb-2">Understand where participants are starting from.</p>
                <ul className="text-sm space-y-1">
                  <li>• Knowledge of SDGs and local challenges</li>
                  <li>• Current involvement in sustainability initiatives</li>
                  <li>• Expectations and goals for the jam</li>
                  <li>• Confidence in problem-solving abilities</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-pastel-green rounded-lg">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold mb-1">During-Jam Observations</h4>
                <p className="text-sm text-muted-foreground mb-2">Track engagement and learning in real-time.</p>
                <ul className="text-sm space-y-1">
                  <li>• Participation levels and engagement quality</li>
                  <li>• Collaboration effectiveness</li>
                  <li>• Breakthrough moments and insights</li>
                  <li>• Challenges and how they were addressed</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-pastel-violet rounded-lg">
              <div className="w-8 h-8 bg-violet-500 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold mb-1">Post-Jam Immediate Feedback</h4>
                <p className="text-sm text-muted-foreground mb-2">Capture immediate reactions and commitments.</p>
                <ul className="text-sm space-y-1">
                  <li>• Overall satisfaction and experience rating</li>
                  <li>• Key learnings and insights gained</li>
                  <li>• Specific actions participants plan to take</li>
                  <li>• Likelihood to recommend to others</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 bg-pastel-amber/70 rounded-lg">
              <div className="w-8 h-8 bg-amber-500 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h4 className="font-semibold mb-1">Follow-up Impact Assessment</h4>
                <p className="text-sm text-muted-foreground mb-2">Track longer-term changes and actions taken.</p>
                <ul className="text-sm space-y-1">
                  <li>• Actions actually taken since the jam</li>
                  <li>• New partnerships or collaborations formed</li>
                  <li>• Changes in knowledge, skills, or attitudes</li>
                  <li>• Barriers encountered and how they were addressed</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Collection Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Data Collection Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Choose data collection methods that fit your context and provide meaningful insights without overwhelming participants:</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-teal-900">📋 Quantitative Methods</h4>
                <ul className="text-sm space-y-2">
                  <li><strong>Pre/Post Surveys:</strong> Track changes in knowledge, attitudes, and intentions</li>
                  <li><strong>Rating Scales:</strong> Measure satisfaction, confidence, and likelihood to act</li>
                  <li><strong>Participation Metrics:</strong> Count attendees, completion rates, engagement levels</li>
                  <li><strong>Follow-up Tracking:</strong> Monitor action completion and outcome achievement</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-teal-900">💬 Qualitative Methods</h4>
                <ul className="text-sm space-y-2">
                  <li><strong>Focus Groups:</strong> Deep dive into participant experiences and insights</li>
                  <li><strong>Individual Interviews:</strong> Understand personal transformation stories</li>
                  <li><strong>Observation Notes:</strong> Capture process insights and group dynamics</li>
                  <li><strong>Story Collection:</strong> Document meaningful moments and breakthrough insights</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-teal-900">🎯 Mixed Methods</h4>
                <ul className="text-sm space-y-2">
                  <li><strong>Exit Tickets:</strong> Quick quantitative ratings plus open-ended reflections</li>
                  <li><strong>Photo Documentation:</strong> Visual evidence of engagement and outputs</li>
                  <li><strong>Action Commitment Cards:</strong> Specific, measurable commitments from participants</li>
                  <li><strong>Network Mapping:</strong> Track new connections and collaboration potential</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-teal-900">📱 Digital Tools</h4>
                <ul className="text-sm space-y-2">
                  <li><strong>Online Surveys:</strong> Google Forms, Typeform, or SurveyMonkey</li>
                  <li><strong>Real-time Polling:</strong> Mentimeter, Slido, or Kahoot for live feedback</li>
                  <li><strong>Social Media Tracking:</strong> Monitor hashtags and mentions</li>
                  <li><strong>Follow-up Apps:</strong> WhatsApp groups or Slack channels for ongoing tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyzing and Using Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Analyzing and Using Your Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Data is only valuable if you analyze it and use it to improve. Here's how to make sense of your M&E data:</p>
          
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-lg">
              <h4 className="font-semibold text-emerald-900 mb-2">Simple Analysis Techniques</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Quantitative Analysis</h5>
                  <ul className="space-y-1 text-emerald-800">
                    <li>• Calculate averages and percentages</li>
                    <li>• Compare before/after scores</li>
                    <li>• Identify trends over multiple jams</li>
                    <li>• Look for correlations between variables</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Qualitative Analysis</h5>
                  <ul className="space-y-1 text-emerald-800">
                    <li>• Identify common themes in feedback</li>
                    <li>• Categorize types of insights and learnings</li>
                    <li>• Look for patterns in success stories</li>
                    <li>• Analyze barriers and challenges</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-pastel-amber rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">Key Questions to Ask</h4>
              <ul className="text-sm space-y-1 text-yellow-800">
                <li>• What worked best for different types of participants?</li>
                <li>• Which methods generated the most engagement and learning?</li>
                <li>• What barriers prevented participants from taking action?</li>
                <li>• How can we improve the experience for future jams?</li>
                <li>• What unexpected outcomes or insights emerged?</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reporting Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-violet-600" />
            Reporting Your Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Different audiences need different types of impact reports. Tailor your communication to your stakeholders:</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">📊 For Funders & Sponsors</h4>
                <ul className="text-sm space-y-1">
                  <li>• Clear metrics and quantitative results</li>
                  <li>• Return on investment calculations</li>
                  <li>• Alignment with their goals and values</li>
                  <li>• Professional presentation format</li>
                  <li>• Future funding recommendations</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">🏢 For Partner Organizations</h4>
                <ul className="text-sm space-y-1">
                  <li>• Benefits to their staff and mission</li>
                  <li>• Collaboration opportunities identified</li>
                  <li>• Capacity building outcomes</li>
                  <li>• Network expansion results</li>
                  <li>• Joint initiative possibilities</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">👥 For Participants</h4>
                <ul className="text-sm space-y-1">
                  <li>• Personal growth and learning highlights</li>
                  <li>• Community impact stories</li>
                  <li>• Action tracking and celebration</li>
                  <li>• Connection to broader movement</li>
                  <li>• Opportunities for continued engagement</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">🌍 For the Global Community</h4>
                <ul className="text-sm space-y-1">
                  <li>• Innovative methods and approaches</li>
                  <li>• Lessons learned and best practices</li>
                  <li>• Replicable models and frameworks</li>
                  <li>• Cultural adaptations and insights</li>
                  <li>• Contribution to global SDG progress</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Pitfalls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Common M&E Pitfalls to Avoid
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm"><strong>Over-measuring:</strong> Don't burden participants with excessive surveys. Focus on the most important metrics.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm"><strong>Measuring too early:</strong> Real impact often takes time to emerge. Plan for longer-term follow-up.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm"><strong>Ignoring negative feedback:</strong> Criticism and challenges are valuable learning opportunities.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm"><strong>Focusing only on outputs:</strong> Count participants and activities, but also measure outcomes and impact.</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm"><strong>Not using the data:</strong> Analysis is worthless if you don't use insights to improve future jams.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-sky-600" />
            Key Takeaways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-sky-600 mt-0.5" />
              <p className="text-sm"><strong>Start with clear success definitions:</strong> Know what you're trying to achieve before you start measuring.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-sky-600 mt-0.5" />
              <p className="text-sm"><strong>Keep it simple and focused:</strong> A few meaningful metrics are better than many superficial ones.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-sky-600 mt-0.5" />
              <p className="text-sm"><strong>Mix quantitative and qualitative data:</strong> Numbers tell you what happened; stories tell you why it matters.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-sky-600 mt-0.5" />
              <p className="text-sm"><strong>Plan for follow-up:</strong> Real impact often emerges weeks or months after your jam.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-sky-600 mt-0.5" />
              <p className="text-sm"><strong>Use insights to improve:</strong> M&E is most valuable when it helps you design better jams.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-sky-600 mt-0.5" />
              <p className="text-sm"><strong>Share your learnings:</strong> Help the global community by sharing what works and what doesn't.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Module6Content;