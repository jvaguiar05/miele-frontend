import { useState } from "react";
import { Upload, FileText, Calendar, Download, Trash2, Eye, X, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface FileItem {
  id: string;
  name: string;
  type: 'contrato' | 'cartao_cnpj';
  file: File;
  uploadDate: Date;
  expirationDate?: Date;
  size: string;
}

interface FileManagerProps {
  clientId: string;
}

export default function FileManager({ clientId }: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<'contrato' | 'cartao_cnpj'>('cartao_cnpj');
  const [expirationDate, setExpirationDate] = useState<Date>();
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateAndProcessFile = (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não permitido",
        description: "Apenas arquivos PDF, JPG e PNG são aceitos.",
        variant: "destructive",
      });
      return false;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return false;
    }

    // Validate expiration date for contracts
    if (selectedFileType === 'contrato' && !expirationDate) {
      toast({
        title: "Data de expiração obrigatória",
        description: "Para contratos, é necessário definir uma data de expiração.",
        variant: "destructive",
      });
      return false;
    }

    const newFile: FileItem = {
      id: Date.now().toString(),
      name: file.name,
      type: selectedFileType,
      file: file,
      uploadDate: new Date(),
      expirationDate: selectedFileType === 'contrato' ? expirationDate : undefined,
      size: formatFileSize(file.size),
    };

    setFiles(prev => [...prev, newFile]);
    setIsUploadDialogOpen(false);
    setExpirationDate(undefined);
    
    toast({
      title: "Arquivo enviado com sucesso",
      description: `${file.name} foi adicionado aos arquivos do cliente.`,
    });

    return true;
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      validateAndProcessFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    disabled: selectedFileType === 'contrato' && !expirationDate
  });

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    toast({
      title: "Arquivo removido",
      description: "O arquivo foi removido da lista.",
    });
  };

  const handlePreviewFile = (file: FileItem) => {
    setPreviewFile(file);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  const getTypeLabel = (type: 'contrato' | 'cartao_cnpj') => {
    return type === 'contrato' ? 'Contrato' : 'Cartão CNPJ';
  };

  const getTypeBadgeVariant = (type: 'contrato' | 'cartao_cnpj') => {
    return type === 'contrato' ? 'default' : 'secondary';
  };

  const isExpiringSoon = (expirationDate?: Date) => {
    if (!expirationDate) return false;
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expirationDate?: Date) => {
    if (!expirationDate) return false;
    const today = new Date();
    return expirationDate < today;
  };

  const contratoFiles = files.filter(f => f.type === 'contrato');
  const cnpjFiles = files.filter(f => f.type === 'cartao_cnpj');

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Arquivos do Cliente</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie contratos e cartões CNPJ do cliente
          </p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80">
              <Upload className="mr-2 h-4 w-4" />
              Enviar Arquivo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar Novo Arquivo</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione documentos importantes do cliente de forma rápida e organizada
              </p>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="file-type" className="text-base">Tipo de Arquivo</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Escolha o tipo de documento que deseja enviar
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={selectedFileType === 'contrato' ? 'default' : 'outline'}
                    onClick={() => setSelectedFileType('contrato')}
                    className="justify-start h-auto py-3"
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold">Contrato</div>
                      <div className="text-xs opacity-80">Com validade</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedFileType === 'cartao_cnpj' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedFileType('cartao_cnpj');
                      setExpirationDate(undefined);
                    }}
                    className="justify-start h-auto py-3"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold">Cartão CNPJ</div>
                      <div className="text-xs opacity-80">Sem prazo</div>
                    </div>
                  </Button>
                </div>
              </div>

              {selectedFileType === 'contrato' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Data de Expiração Obrigatória
                      </p>
                      <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
                        Para contratos, você deve definir uma data de validade
                      </p>
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background",
                          !expirationDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {expirationDate ? format(expirationDate, "dd/MM/yyyy") : "Selecionar data de expiração"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={expirationDate}
                        onSelect={setExpirationDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div>
                <Label className="text-base">Selecionar Arquivo</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Arraste e solte ou clique para selecionar
                </p>
                <div
                  {...getRootProps()}
                  className={cn(
                    "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200",
                    "cursor-pointer hover:border-primary/50 hover:bg-muted/50",
                    isDragActive && "border-primary bg-primary/5 scale-[1.02]",
                    selectedFileType === 'contrato' && !expirationDate && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={cn(
                      "p-4 rounded-full transition-colors",
                      isDragActive ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Upload className={cn(
                        "h-8 w-8 transition-colors",
                        isDragActive ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    {selectedFileType === 'contrato' && !expirationDate ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Defina a data de expiração primeiro
                        </p>
                        <p className="text-xs text-muted-foreground">
                          A data de expiração é obrigatória para contratos
                        </p>
                      </div>
                    ) : isDragActive ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-primary">
                          Solte o arquivo aqui
                        </p>
                        <p className="text-xs text-muted-foreground">
                          O arquivo será enviado automaticamente
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Arraste um arquivo ou clique para selecionar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG ou PNG até 10MB
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

      {/* Files Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contratos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Contratos ({contratoFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contratoFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum contrato encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contratoFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{format(file.uploadDate, "dd/MM/yyyy")}</span>
                          {file.expirationDate && (
                            <>
                              <span>•</span>
                              <span className={cn(
                                isExpired(file.expirationDate) && "text-destructive",
                                isExpiringSoon(file.expirationDate) && "text-orange-500"
                              )}>
                                Expira: {format(file.expirationDate, "dd/MM/yyyy")}
                              </span>
                            </>
                          )}
                        </div>
                        {file.expirationDate && (
                          <div className="mt-1">
                            <Badge 
                              variant={
                                isExpired(file.expirationDate) ? "destructive" : 
                                isExpiringSoon(file.expirationDate) ? "secondary" : 
                                "default"
                              }
                              className="text-xs"
                            >
                              {isExpired(file.expirationDate) ? "Expirado" :
                               isExpiringSoon(file.expirationDate) ? "Expira em breve" :
                               "Válido"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePreviewFile(file)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteFile(file.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cartões CNPJ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cartões CNPJ ({cnpjFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cnpjFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum cartão CNPJ encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cnpjFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{format(file.uploadDate, "dd/MM/yyyy")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePreviewFile(file)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteFile(file.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div>
              <DialogTitle>{previewFile?.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getTypeBadgeVariant(previewFile?.type || 'cartao_cnpj')}>
                  {getTypeLabel(previewFile?.type || 'cartao_cnpj')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {previewFile?.size}
                </span>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewFile && (
              <div className="w-full h-[70vh] bg-muted/30 rounded-lg flex items-center justify-center">
                {previewFile.file.type === 'application/pdf' ? (
                  <div className="text-center space-y-4">
                    <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Visualização de PDF</p>
                      <p className="text-sm text-muted-foreground">
                        O arquivo PDF será aberto quando conectado ao backend
                      </p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={URL.createObjectURL(previewFile.file)}
                    alt={previewFile.name}
                    className="max-w-full max-h-full object-contain"
                    onLoad={(e) => {
                      // Clean up object URL when image loads
                      const img = e.target as HTMLImageElement;
                      setTimeout(() => URL.revokeObjectURL(img.src), 1000);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}