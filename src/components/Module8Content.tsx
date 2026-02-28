import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Heart, MapPin, TrendingUp, Award, AlertCircle } from 'lucide-react';

const Module8Content = () => {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8">
        <Badge className="mb-4 bg-green-600">Module 8</Badge>
        <h1 className="text-4xl font-bold mb-4">Best Practices, Follow-Ups & Community</h1>
        <p className="text-xl text-gray-700">Build lasting impact through community engagement and systematic follow-up.</p>
      </div>

      {/* Important: Peer Review Policy */}
      <Card className="border-amber-300 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="h-5 w-5 text-amber-700" />
            Capstone Review: Peer-Reviewed (not by GGJ org)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800">
            Your capstone is reviewed by a peer (e.g., a fellow host or local mentor) that you select. The Global Goals Jam organization does not actively review or grade capstones. Please arrange a peer reviewer before you begin and include their feedback in your submission.
          </p>
        </CardContent>
      </Card>

      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-600" />
            Capstone Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>The capstone project is your opportunity to demonstrate mastery of the Global Goals Jam methodology by designing, facilitating, and documenting a complete jam experience.</p>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Planning Your Capstone Jam</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-green-800 mb-1">Choose Your Challenge</h5>
                <p className="text-green-700">Select a specific, local SDG-related challenge</p>
              </div>
              <div>
                <h5 className="font-medium text-green-800 mb-1">Recruit Participants</h5>
                <p className="text-green-700">Aim for 8-15 diverse participants</p>
              </div>
              <div>
                <h5 className="font-medium text-green-800 mb-1">Design Your Session</h5>
                <p className="text-green-700">Create a 3-4 hour session plan</p>
              </div>
              <div>
                <h5 className="font-medium text-green-800 mb-1">Prepare Documentation</h5>
                <p className="text-green-700">Set up systems to capture process and outcomes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certification Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Certification Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">🎯 Methodological Competence (30%)</h4>
                <ul className="text-sm space-y-1">
                  <li>• Appropriate method selection and adaptation</li>
                  <li>• Effective session design and flow</li>
                  <li>• Systems thinking integration</li>
                  <li>• Action-oriented outcomes</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">👥 Facilitation Skills (25%)</h4>
                <ul className="text-sm space-y-1">
                  <li>• Group engagement and participation</li>
                  <li>• Inclusive and safe environment creation</li>
                  <li>• Adaptive facilitation and problem-solving</li>
                  <li>• Clear communication and guidance</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">🌍 SDG Alignment (20%)</h4>
                <ul className="text-sm space-y-1">
                  <li>• Clear connection to SDG challenges</li>
                  <li>• Local relevance and context sensitivity</li>
                  <li>• Stakeholder engagement and authenticity</li>
                  <li>• Potential for real-world impact</li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">📝 Documentation Quality (15%)</h4>
                <ul className="text-sm space-y-1">
                  <li>• Comprehensive and well-organized</li>
                  <li>• Clear evidence of outcomes and impact</li>
                  <li>• Visual documentation and storytelling</li>
                  <li>• Useful for other hosts to learn from</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">🤔 Reflective Practice (10%)</h4>
                <ul className="text-sm space-y-1">
                  <li>• Honest self-assessment and learning</li>
                  <li>• Insights about methodology and context</li>
                  <li>• Growth mindset and improvement orientation</li>
                  <li>• Contribution to community knowledge</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Journey Forward */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Your Journey Forward
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Immediate Next Steps (First 30 Days)</h4>
              <ul className="text-sm space-y-1 text-purple-800">
                <li>• Join the Global Goals Jam Host Community</li>
                <li>• Schedule your first official jam within 60 days</li>
                <li>• Connect with other hosts in your region</li>
                <li>• Set up your host profile and share your capstone story</li>
                <li>• Begin planning your regular jam schedule</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Building Your Practice (First 6 Months)</h4>
              <ul className="text-sm space-y-1 text-blue-800">
                <li>• Host at least 3 jams with different audiences</li>
                <li>• Experiment with new methods and approaches</li>
                <li>• Build partnerships with local organizations</li>
                <li>• Document and share your learnings</li>
                <li>• Seek feedback and continuous improvement</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Growing Your Impact (First Year)</h4>
              <ul className="text-sm space-y-1 text-green-800">
                <li>• Develop a signature approach or specialization</li>
                <li>• Mentor new hosts in your community</li>
                <li>• Contribute to the global knowledge base</li>
                <li>• Explore advanced training opportunities</li>
                <li>• Consider train-the-trainer certification</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            Key Takeaways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>Choose an authentic challenge:</strong> Your capstone should address a real problem with genuine stakeholders.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>Demonstrate methodological mastery:</strong> Show that you can skillfully apply and adapt the jam methodology.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>Document comprehensively:</strong> Capture the full story from planning to impact for evaluation and learning.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>Reflect deeply:</strong> Show honest self-assessment and commitment to continuous improvement.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>Present confidently:</strong> Share your experience in a way that inspires and teaches others.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p className="text-sm"><strong>Embrace the journey:</strong> Certification is the beginning of your impact as a Global Goals Jam host.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Module8Content;
