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
  MoreVertical,
  Plus,
  File,
  FileImage,
  FileCheck,
  Folder,
  Building,
  MapPin,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useFileManager } from "@/hooks/use-file-manager";
import { FileMetadata, PerdCompFileType } from "@/types/api";

interface PerdCompFileManagerProps {
  perdcompId: string;
  readonly?: boolean;
}

export default function PerdCompFileManager({
  perdcompId,
  readonly = false,
}: PerdCompFileManagerProps) {
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
  } = useFileManager({ entityId: perdcompId, entityType: "perdcomp" });

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFileType, setSelectedFileType] =
    useState<PerdCompFileType>("perdcomp");
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
      return;
    }

    try {
      await uploadFile(file, selectedFileType, uploadDescription, undefined);

      // Reset form
      setIsUploadDialogOpen(false);
      setUploadDescription("");
      setSelectedFileType("perdcomp");
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
    maxFiles: 1,
    multiple: false,
  });

  const startEditing = (file: FileMetadata) => {
    setEditingFile(file);
    setEditForm({
      file_name: file.file_name,
      description: file.description || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;

    try {
      await updateFile(editingFile.id, editForm);
      setEditingFile(null);
      setEditForm({ file_name: "", description: "" });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handlePreviewFile = async (fileId: string) => {
    try {
      const previewUrl = await previewFile(fileId);
      if (previewUrl && files) {
        const file = files.find((f) => f.id === fileId);
        if (file) {
          setPreviewFileData({ file, url: previewUrl });
        }
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      await downloadFile(fileId, fileName);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const file = files.find((f) => f.id === fileId);
      if (file) {
        await deleteFile(fileId, file.file_name);
      }
    } catch (error) {
      // Error handled by hook
    }
  };

  const getTypeLabel = (type: PerdCompFileType) => {
    const labels = {
      perdcomp: "PerdComp",
      aviso_recebimento: "Aviso de Recebimento",
      recibo: "Recibo",
    };
    return labels[type] || type;
  };

  const getTypeBadgeVariant = (
    type: PerdCompFileType
  ): "default" | "secondary" | "outline" => {
    const variants = {
      perdcomp: "default" as const,
      aviso_recebimento: "secondary" as const,
      recibo: "outline" as const,
    };
    return variants[type] || "secondary";
  };

  const getFileTypeIcon = (type: PerdCompFileType) => {
    const icons = {
      perdcomp: FileCheck,
      aviso_recebimento: FileText,
      recibo: Building,
    };
    return icons[type] || FileText;
  };

  const renderModernFileCard = (file: FileMetadata) => {
    const Icon = getFileTypeIcon(file.file_type as PerdCompFileType);

    return (
      <Card key={file.id} className="group hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* File Info */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {file.mime_type === "application/pdf" ? (
                  <File className="h-8 w-8 text-red-500" />
                ) : (
                  <FileImage className="h-8 w-8 text-blue-500" />
                )}
              </div>

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
                      className="h-8 text-sm"
                    />
                    <Textarea
                      className="resize-none min-h-[60px] text-sm"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Descrição do arquivo"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="h-3 w-3 mr-1" />
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingFile(null)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm leading-tight truncate">
                      {file.file_name}
                    </h4>
                    {file.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {file.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(file.created_at), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <Badge
                      variant={getTypeBadgeVariant(
                        file.file_type as PerdCompFileType
                      )}
                      className="w-fit text-xs"
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {getTypeLabel(file.file_type as PerdCompFileType)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {!readonly && editingFile?.id !== file.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handlePreviewFile(file.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDownloadFile(file.id, file.file_name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => startEditing(file)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Filter files by type
  const perdcompFiles = files.filter((f) => f.file_type === "perdcomp");
  const avisoFiles = files.filter((f) => f.file_type === "aviso_recebimento");
  const reciboFiles = files.filter((f) => f.file_type === "recibo");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando arquivos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6">
      {/* Modern Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Arquivos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie documentos da empresa
          </p>
        </div>

        {!readonly && (
          <Dialog
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" disabled={uploading}>
                <Plus className="h-4 w-4" />
                {uploading ? "Enviando..." : "Novo Arquivo"}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle>Enviar Arquivo</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Adicione um novo documento
                </p>
              </DialogHeader>

              <div className="space-y-4">
                {/* File Type Selection - Compact */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Arquivo</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {getFileTypeOptions().map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        size="sm"
                        variant={
                          selectedFileType === option.value
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setSelectedFileType(option.value as PerdCompFileType)
                        }
                        className="justify-start"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Description - Compact */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Descrição</Label>
                  <Textarea
                    placeholder="Descrição do arquivo (opcional)"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* File Upload - Compact */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Arquivo</Label>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                      isDragActive && "border-primary bg-primary/5",
                      uploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input {...getInputProps()} disabled={uploading} />
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      {uploading ? (
                        <p className="text-xs text-muted-foreground">
                          Enviando...
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Clique ou arraste para enviar
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Files Tabs */}
      <Tabs defaultValue="perdcomp" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="perdcomp"
            className="flex items-center gap-2 text-xs"
          >
            <FileCheck className="h-3 w-3" />
            PerdComp ({perdcompFiles.length})
          </TabsTrigger>
          <TabsTrigger
            value="aviso"
            className="flex items-center gap-2 text-xs"
          >
            <FileText className="h-3 w-3" />
            Aviso ({avisoFiles.length})
          </TabsTrigger>
          <TabsTrigger
            value="recibo"
            className="flex items-center gap-2 text-xs"
          >
            <Building className="h-3 w-3" />
            Recibo ({reciboFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perdcomp" className="space-y-4 mt-6">
          {perdcompFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Nenhum documento PerdComp encontrado</p>
              <p className="text-xs mt-1">
                Faça o upload do primeiro documento
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {perdcompFiles.map((file) => renderModernFileCard(file))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="aviso" className="space-y-4 mt-6">
          {avisoFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Nenhum aviso de recebimento encontrado</p>
              <p className="text-xs mt-1">Faça o upload do primeiro aviso</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {avisoFiles.map((file) => renderModernFileCard(file))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recibo" className="space-y-4 mt-6">
          {reciboFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Nenhum recibo encontrado</p>
              <p className="text-xs mt-1">Faça o upload do primeiro recibo</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {reciboFiles.map((file) => renderModernFileCard(file))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      {previewFileData && (
        <Dialog
          open={!!previewFileData}
          onOpenChange={() => setPreviewFileData(null)}
        >
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-4 sm:p-6 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {previewFileData.file.file_name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden p-4 sm:p-6 pt-0">
              {previewFileData.file.mime_type === "application/pdf" ? (
                <iframe
                  src={previewFileData.url}
                  className="w-full h-[70vh] border-0 rounded-md"
                  title={`Preview: ${previewFileData.file.file_name}`}
                />
              ) : (
                <img
                  src={previewFileData.url}
                  alt={previewFileData.file.file_name}
                  className="w-full h-[70vh] object-contain rounded-md"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
