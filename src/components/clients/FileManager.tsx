import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  X,
  Edit2,
  Save,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useFileManager } from "@/hooks/use-file-manager";
import { FileMetadata, ClientFileType } from "@/types/api";

interface FileManagerProps {
  clientId: string;
}

export default function FileManager({ clientId }: FileManagerProps) {
  const {
    files,
    loading,
    uploading,
    loadFiles,
    uploadFile,
    downloadFile,
    previewFile,
    updateFile,
    deleteFile,
    validateFile,
    getFileTypeOptions,
  } = useFileManager({ entityId: clientId, entityType: "client" });

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFileType, setSelectedFileType] =
    useState<ClientFileType>("cartao_cnpj");
  const [uploadDescription, setUploadDescription] = useState("");
  const [previewFileData, setPreviewFileData] = useState<{
    file: FileMetadata;
    url: string;
  } | null>(null);
  const [editingFile, setEditingFile] = useState<FileMetadata | null>(null);
  const [editForm, setEditForm] = useState({ file_name: "", description: "" });

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUpload = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const validation = validateFile(file);

    if (!validation.isValid) {
      // Error will be shown by the hook
      return;
    }

    try {
      await uploadFile(file, selectedFileType, uploadDescription);
      setIsUploadDialogOpen(false);
      setUploadDescription("");
    } catch (error) {
      // Error handled by hook
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleDeleteFile = async (file: FileMetadata) => {
    if (
      confirm(`Tem certeza que deseja excluir o arquivo "${file.file_name}"?`)
    ) {
      try {
        await deleteFile(file.id, file.file_name);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handlePreviewFile = async (file: FileMetadata) => {
    try {
      const url = await previewFile(file.id);
      setPreviewFileData({ file, url });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEditFile = (file: FileMetadata) => {
    setEditingFile(file);
    setEditForm({
      file_name: file.file_name,
      description: file.description || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;

    try {
      await updateFile(editingFile.id, {
        file_name: editForm.file_name,
        description: editForm.description,
      });
      setEditingFile(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getFileIcon = (file: FileMetadata) => {
    if (file.mime_type === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <FileText className="h-8 w-8 text-blue-500" />;
  };

  const getTypeLabel = (type: ClientFileType) => {
    return type === "contrato" ? "Contrato" : "Cartão CNPJ";
  };

  const getTypeBadgeVariant = (type: ClientFileType) => {
    return type === "contrato" ? "default" : "secondary";
  };

  const contratoFiles = files.filter((f) => f.file_type === "contrato");
  const cnpjFiles = files.filter((f) => f.file_type === "cartao_cnpj");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando arquivos...</div>
      </div>
    );
  }

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
            <Button
              className="bg-gradient-to-r from-primary to-primary/80"
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Enviando..." : "Enviar Arquivo"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar Novo Arquivo</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione documentos importantes do cliente de forma rápida e
                organizada
              </p>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="file-type" className="text-base">
                  Tipo de Arquivo
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Escolha o tipo de documento que deseja enviar
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {getFileTypeOptions().map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        selectedFileType === option.value
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setSelectedFileType(option.value)}
                      className="justify-start h-auto py-3"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-base">
                  Descrição (opcional)
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Adicione uma descrição para identificar o arquivo
                </p>
                <Textarea
                  id="description"
                  placeholder="Ex: Contrato assinado em dezembro 2025"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  rows={3}
                />
              </div>

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
                    uploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input {...getInputProps()} disabled={uploading} />
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div
                      className={cn(
                        "p-4 rounded-full transition-colors",
                        isDragActive ? "bg-primary/20" : "bg-muted"
                      )}
                    >
                      <Upload
                        className={cn(
                          "h-8 w-8 transition-colors",
                          isDragActive
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                    </div>
                    {uploading ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Enviando arquivo...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Aguarde enquanto o arquivo é processado
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
              <FileText className="h-5 w-5" />
              Contratos ({contratoFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contratoFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum contrato encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contratoFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        {editingFile?.id === file.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.file_name}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  file_name: e.target.value,
                                }))
                              }
                              className="text-sm"
                            />
                            <Input
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="Descrição"
                              className="text-sm"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium truncate">
                              {file.file_name}
                            </p>
                            {file.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {file.description}
                              </p>
                            )}
                          </>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{file.file_size_human}</span>
                          <span>•</span>
                          <span>
                            {new Date(file.created_at).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                          <Badge
                            variant={getTypeBadgeVariant(
                              file.file_type as ClientFileType
                            )}
                            className="text-xs"
                          >
                            {getTypeLabel(file.file_type as ClientFileType)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingFile?.id === file.id ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleSaveEdit}
                            className="h-8 w-8 text-green-600 hover:text-green-600"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingFile(null)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
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
                            onClick={() =>
                              downloadFile(
                                file.id,
                                file.file_name,
                                file.mime_type
                              )
                            }
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditFile(file)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteFile(file)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        {editingFile?.id === file.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.file_name}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  file_name: e.target.value,
                                }))
                              }
                              className="text-sm"
                            />
                            <Input
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="Descrição"
                              className="text-sm"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium truncate">
                              {file.file_name}
                            </p>
                            {file.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {file.description}
                              </p>
                            )}
                          </>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{file.file_size_human}</span>
                          <span>•</span>
                          <span>
                            {new Date(file.created_at).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                          <Badge
                            variant={getTypeBadgeVariant(
                              file.file_type as ClientFileType
                            )}
                            className="text-xs"
                          >
                            {getTypeLabel(file.file_type as ClientFileType)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {editingFile?.id === file.id ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleSaveEdit}
                            className="h-8 w-8 text-green-600 hover:text-green-600"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingFile(null)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
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
                            onClick={() =>
                              downloadFile(
                                file.id,
                                file.file_name,
                                file.mime_type
                              )
                            }
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditFile(file)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteFile(file)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      {previewFileData && (
        <Dialog
          open={!!previewFileData}
          onOpenChange={() => {
            if (previewFileData?.url) {
              URL.revokeObjectURL(previewFileData.url);
            }
            setPreviewFileData(null);
          }}
        >
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getFileIcon(previewFileData.file)}
                {previewFileData.file.file_name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {previewFileData.file.mime_type === "application/pdf" ? (
                <iframe
                  src={previewFileData.url}
                  className="w-full h-full border-0"
                  title={`Preview: ${previewFileData.file.file_name}`}
                />
              ) : (
                <img
                  src={previewFileData.url}
                  alt={previewFileData.file.file_name}
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
