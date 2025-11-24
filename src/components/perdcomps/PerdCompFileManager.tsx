import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Trash2, 
  Download, 
  Eye,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FileType = 'perdcomp' | 'aviso_recebimento' | 'recibo';

interface PerdCompFile {
  id: string;
  name: string;
  size: string;
  type: FileType;
  url: string;
  uploadDate: string;
}

interface PerdCompFileManagerProps {
  perdcompId?: string;
  onFilesChange?: (files: PerdCompFile[]) => void;
  readonly?: boolean;
}

const getTypeLabel = (type: FileType): string => {
  switch (type) {
    case 'perdcomp': return 'PERD/COMP';
    case 'aviso_recebimento': return 'Aviso Recebimento';
    case 'recibo': return 'Recibo';
    default: return type;
  }
};

const getTypeBadgeVariant = (type: FileType) => {
  switch (type) {
    case 'perdcomp': return 'default';
    case 'aviso_recebimento': return 'secondary';
    case 'recibo': return 'outline';
    default: return 'outline';
  }
};

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return <Image className="h-4 w-4" />;
  }
  if (['pdf'].includes(extension || '')) {
    return <FileText className="h-4 w-4" />;
  }
  return <File className="h-4 w-4" />;
};

export default function PerdCompFileManager({ perdcompId, onFilesChange, readonly = false }: PerdCompFileManagerProps) {
  const [files, setFiles] = useState<PerdCompFile[]>([]);
  const [selectedType, setSelectedType] = useState<FileType>('perdcomp');
  const [previewFile, setPreviewFile] = useState<PerdCompFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFileType, setUploadFileType] = useState<FileType>('perdcomp');
  const { toast } = useToast();

  // Mock file upload - in production, this would upload to Supabase storage
  const uploadFiles = async (acceptedFiles: File[], type: FileType) => {
    if (readonly) return;
    
    setIsUploading(true);
    
    try {
      const newFiles: PerdCompFile[] = acceptedFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type,
        url: URL.createObjectURL(file), // In production: upload to Supabase and get URL
        uploadDate: new Date().toISOString(),
      }));

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);

      toast({
        title: "Arquivos enviados",
        description: `${acceptedFiles.length} arquivo(s) enviado(s) com sucesso.`,
      });
      
      setIsUploadDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro ao enviar os arquivos.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDropUpload = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFiles(acceptedFiles, uploadFileType);
    }
  };

  const { getRootProps: getRootPropsUpload, getInputProps: getInputPropsUpload, isDragActive: isDragActiveUpload } = useDropzone({
    onDrop: onDropUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    disabled: isUploading || readonly
  });

  const deleteFile = (fileId: string) => {
    if (readonly) return;
    
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
    
    toast({
      title: "Arquivo removido",
      description: "O arquivo foi removido com sucesso.",
    });
  };

  const downloadFile = (file: PerdCompFile) => {
    // In production, this would download from Supabase storage
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilesByType = (type: FileType) => {
    return files.filter(file => file.type === type);
  };

  const FileDropzone = ({ type }: { type: FileType }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (acceptedFiles) => uploadFiles(acceptedFiles, type),
      multiple: true,
      disabled: isUploading || readonly,
    });

    if (readonly) {
      return null; // Don't show dropzone in readonly mode
    }

    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          {isDragActive
            ? `Solte os arquivos aqui para ${getTypeLabel(type)}`
            : `Arraste arquivos aqui ou clique para selecionar`}
        </p>
        <p className="text-xs text-muted-foreground">
          Tipos suportados: PDF, JPG, PNG, etc.
        </p>
      </div>
    );
  };

  const FileList = ({ type }: { type: FileType }) => {
    const typeFiles = getFilesByType(type);

    if (typeFiles.length === 0) {
      return (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Nenhum arquivo de {getTypeLabel(type)} foi enviado ainda.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-2">
        {typeFiles.map((file) => (
          <Card key={file.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={getTypeBadgeVariant(file.type)} className="text-xs">
                        {getTypeLabel(file.type)}
                      </Badge>
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewFile(file)}
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadFile(file)}
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!readonly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFile(file.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      {!readonly && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Arquivos do PERD/COMP</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie os documentos relacionados ao processo
            </p>
          </div>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary/80">
                <Upload className="mr-2 h-4 w-4" />
                Enviar Arquivo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Enviar Novo Arquivo</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione documentos ao processo de forma rápida e organizada
                </p>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="file-type" className="text-base">Tipo de Arquivo</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Escolha o tipo de documento que deseja enviar
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      variant={uploadFileType === 'perdcomp' ? 'default' : 'outline'}
                      onClick={() => setUploadFileType('perdcomp')}
                      className="justify-start h-auto py-3"
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold text-xs">PERD/COMP</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={uploadFileType === 'aviso_recebimento' ? 'default' : 'outline'}
                      onClick={() => setUploadFileType('aviso_recebimento')}
                      className="justify-start h-auto py-3"
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold text-xs">Aviso Recebimento</div>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant={uploadFileType === 'recibo' ? 'default' : 'outline'}
                      onClick={() => setUploadFileType('recibo')}
                      className="justify-start h-auto py-3"
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      <div className="text-left">
                        <div className="font-semibold text-xs">Recibo</div>
                      </div>
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-base">Selecionar Arquivo</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Arraste e solte ou clique para selecionar (múltiplos arquivos)
                  </p>
                  <div
                    {...getRootPropsUpload()}
                    className={cn(
                      "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200",
                      "cursor-pointer hover:border-primary/50 hover:bg-muted/50",
                      isDragActiveUpload && "border-primary bg-primary/5 scale-[1.02]",
                      isUploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input {...getInputPropsUpload()} />
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={cn(
                        "p-4 rounded-full transition-colors",
                        isDragActiveUpload ? "bg-primary/20" : "bg-muted"
                      )}>
                        <Upload className={cn(
                          "h-8 w-8 transition-colors",
                          isDragActiveUpload ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      {isDragActiveUpload ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-primary">
                            Solte os arquivos aqui
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Os arquivos serão enviados automaticamente
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            Arraste arquivos ou clique para selecionar
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG ou PNG até 10MB cada
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="font-normal">
                          PDF
                        </Badge>
                        <Badge variant="secondary" className="font-normal">
                          JPG
                        </Badge>
                        <Badge variant="secondary" className="font-normal">
                          PNG
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as FileType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perdcomp">
            PERD/COMP ({getFilesByType('perdcomp').length})
          </TabsTrigger>
          <TabsTrigger value="aviso_recebimento">
            Aviso Recebimento ({getFilesByType('aviso_recebimento').length})
          </TabsTrigger>
          <TabsTrigger value="recibo">
            Recibo ({getFilesByType('recibo').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perdcomp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arquivos PERD/COMP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileList type="perdcomp" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aviso_recebimento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avisos de Recebimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileList type="aviso_recebimento" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recibo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recibos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileList type="recibo" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div>
              <DialogTitle>{previewFile?.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getTypeBadgeVariant(previewFile?.type || 'perdcomp')}>
                  {getTypeLabel(previewFile?.type || 'perdcomp')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {previewFile?.size}
                </span>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewFile && (
              <div className="w-full h-[60vh] flex items-center justify-center bg-muted/50 rounded-lg">
                {previewFile.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Visualização não disponível para este tipo de arquivo
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => downloadFile(previewFile)}
                      className="mt-4"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Arquivo
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}