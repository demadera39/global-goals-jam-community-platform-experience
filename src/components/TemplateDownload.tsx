import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { generateTemplate, TemplateData } from '@/lib/templateGenerator';
import { useToast } from '@/hooks/use-toast';
import { blink } from '@/lib/blink';

interface TemplateDownloadProps {
  templateName: string;
  templateType: string;
  moduleNumber: number;
  className?: string;
}

export function TemplateDownload({ templateName, templateType, moduleNumber, className }: TemplateDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      // Get current user
      const user = await blink.auth.me();
      
      // Generate template data
      const templateData: TemplateData = {
        title: templateName,
        subtitle: `Module ${moduleNumber} - Global Goals Jam Host Certification`,
        userName: user?.displayName || user?.email || 'Host',
        date: new Date().toLocaleDateString(),
        content: {},
        templateType: templateType
      };
      
      // Generate PDF
      const pdfBlob = await generateTemplate(templateData);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${templateType}-module${moduleNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Template Downloaded',
        description: `${templateName} has been downloaded successfully.`,
      });
      
      // Track download in database
      try {
        await blink.db.user_achievements.create({
          id: `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user?.id || 'anonymous',
          achievement_type: 'template_download',
          achievement_name: templateName,
          description: `Downloaded template from Module ${moduleNumber}`,
          points: 5
        });
      } catch (error) {
        console.log('Could not track download:', error);
      }
      
    } catch (error) {
      console.error('Error generating template:', error);
      toast({
        title: 'Download Failed',
        description: 'There was an error generating the template. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </>
      )}
    </Button>
  );
}

export function TemplateCard({ 
  title, 
  description, 
  templateType, 
  moduleNumber 
}: { 
  title: string; 
  description: string; 
  templateType: string; 
  moduleNumber: number;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <FileText className="h-5 w-5 text-primary mt-1" />
        <TemplateDownload
          templateName={title}
          templateType={templateType}
          moduleNumber={moduleNumber}
          className="ml-2"
        />
      </div>
      <div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}