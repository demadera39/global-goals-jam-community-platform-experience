import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FileText, Download, BookOpen, Lightbulb, Map, Users } from 'lucide-react';
import { generateHTMLTemplate, openHTMLInNewWindow } from '../lib/htmlTemplateGenerator';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  type: 'template' | 'framework' | 'tool' | 'article' | 'guide';
  description: string;
  url?: string;
}

interface ModuleResourcesProps {
  moduleNumber: number;
  resources: Resource[];
}

export const ModuleResources: React.FC<ModuleResourcesProps> = ({ moduleNumber, resources }) => {
  const handleResourceClick = (resource: Resource) => {
    if (resource.type === 'template') {
      const aliasMap: Record<string, string> = {
        'change-transformation-canvas': 'change-canvas',
        'systems-thinking-toolkit': 'systems-toolkit',
        'host-commitment': 'host-pledge'
      };
      const templateId = aliasMap[resource.id] || resource.id;
      const html = generateHTMLTemplate(templateId);
      openHTMLInNewWindow(html, resource.title);
      toast.success('Template opened in new window');
      return;
    }

    // Fallback URL mapping for known resources
    const fallbackUrls: Record<string, string> = {
      'systems-thinking-primer': 'https://thesystemsthinker.com/introduction-to-systems-thinking/',
      'iceberg-model': 'https://www.toolshero.com/change-management/iceberg-model/',
      'theory-of-change': 'https://www.theoryofchange.org/what-is-theory-of-change/',
      'stakeholder-mapping': 'https://www.mindtools.com/a3cpnr7/stakeholder-analysis',
      'sdg-interconnections': 'https://sdginterlinkages.iges.jp/visualizationtool.html',
      'leverage-points': 'https://donellameadows.org/archives/leverage-points-places-to-intervene-in-a-system/'
    };

    const targetUrl = resource.url && resource.url !== '#' ? resource.url : fallbackUrls[resource.id];
    if (!targetUrl) {
      toast.error('This resource does not have a URL yet.');
      return;
    }
    window.open(targetUrl, '_blank');
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'template':
        return <FileText className="w-5 h-5" />;
      case 'framework':
        return <Map className="w-5 h-5" />;
      case 'tool':
        return <Lightbulb className="w-5 h-5" />;
      case 'article':
        return <BookOpen className="w-5 h-5" />;
      case 'guide':
        return <Users className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'template':
        return 'bg-pastel-sky text-sky-800 border-sky-200';
      case 'framework':
        return 'bg-pastel-violet text-violet-800 border-violet-200';
      case 'tool':
        return 'bg-pastel-green text-primary/80 border-primary/20';
      case 'article':
        return 'bg-pastel-amber text-amber-800 border-amber-200';
      case 'guide':
        return 'bg-pastel-rose text-rose-800 border-rose-200';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Module Resources</h3>
        <p className="text-muted-foreground">
          Templates, frameworks, and tools to support your learning and jam preparation.
        </p>
      </div>

      {Object.entries(groupedResources).map(([type, typeResources]) => (
        <div key={type} className="space-y-3">
          <h4 className="font-semibold text-foreground capitalize flex items-center gap-2">
            {getResourceIcon(type)}
            {type === 'template' ? 'Interactive Templates' : 
             type === 'framework' ? 'Frameworks & Models' :
             type === 'tool' ? 'Tools & Methods' :
             type === 'article' ? 'Articles & Readings' :
             type === 'guide' ? 'Guides & Tutorials' : type}
          </h4>
          
          <div className="grid gap-3">
            {typeResources.map((resource) => (
              <Card 
                key={resource.id} 
                className={`overflow-hidden hover:shadow-soft transition-all cursor-pointer ${
                  getResourceColor(resource.type)
                }`}
                onClick={() => handleResourceClick(resource)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getResourceIcon(resource.type)}
                        <h5 className="font-medium text-foreground">{resource.title}</h5>
                        <Badge variant="outline" className="text-xs">
                          {resource.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground/80">
                        {resource.description}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResourceClick(resource);
                      }}
                    >
                      {resource.type === 'template' ? (
                        <><Download className="h-4 w-4 mr-1" /> Open</>
                      ) : (
                        <><BookOpen className="h-4 w-4 mr-1" /> View</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {resources.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No resources available for this module yet.</p>
        </Card>
      )}

      {moduleNumber === 2 && (
        <Card className="mt-6 bg-gradient-to-r from-pastel-violet to-pastel-rose border-violet-200">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-2 text-violet-900">🧠 Systems Thinking Resources</h4>
            <p className="text-sm text-violet-800 mb-4">
              These frameworks will help you understand and navigate complex challenges. 
              Use them to identify the right approach for your local context.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">Frameworks</Badge>
              <Badge variant="secondary">Case Studies</Badge>
              <Badge variant="secondary">Analysis Tools</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {moduleNumber === 1 && (
        <Card className="mt-6 bg-gradient-to-r from-pastel-green to-pastel-sky border-primary/20">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-2 text-primary">📚 Getting Started Resources</h4>
            <p className="text-sm text-primary/80 mb-4">
              These templates are designed to help you prepare for hosting your first Global Goals Jam. 
              Take your time to fill them out thoughtfully - they'll guide your journey as a host.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">Interactive</Badge>
              <Badge variant="secondary">Fillable PDF</Badge>
              <Badge variant="secondary">Print-friendly</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModuleResources;