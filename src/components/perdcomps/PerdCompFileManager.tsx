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
  File,
  Image,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
    if (acceptedFiles.length === 0 || readonly) return;

    const file = acceptedFiles[0];
    const validation = validateFile(file);

    if (!validation.isValid) {
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
    disabled: readonly || uploading,
  });

  const handleDeleteFile = async (file: FileMetadata) => {
    if (readonly) return;

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
    if (readonly) return;

    setEditingFile(file);
    setEditForm({
      file_name: file.file_name,
      description: file.description || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingFile || readonly) return;

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

  const getFileIcon = (fileName: string, mimeType: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <Image className="h-8 w-8 text-blue-500" />;
    }
    if (mimeType === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const getTypeLabel = (type: PerdCompFileType): string => {
    switch (type) {
      case "perdcomp":
        return "PER/DCOMP";
      case "aviso_recebimento":
        return "Aviso de Recebimento";
      case "recibo":
        return "Recibo";
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: PerdCompFileType) => {
    switch (type) {
      case "perdcomp":
        return "default" as const;
      case "aviso_recebimento":
        return "secondary" as const;
      case "recibo":
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

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
    <div className="space-y-6">
      {/* Header with Upload Button */}
      {!readonly && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Arquivos do PER/DCOMP</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie documentos relacionados ao PER/DCOMP
            </p>
          </div>

          <Dialog
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
          >
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
                  Adicione documentos relacionados ao PER/DCOMP
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
                  <div className="grid grid-cols-1 gap-3">
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
                    placeholder="Ex: PER/DCOMP protocolado em dezembro 2025"
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
                      isDragActive &&
                        "border-primary bg-primary/5 scale-[1.02]",
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
      )}

      {/* Files by Type */}
      <Tabs defaultValue="perdcomp" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perdcomp">
            PER/DCOMP ({perdcompFiles.length})
          </TabsTrigger>
          <TabsTrigger value="aviso">
            Aviso Recebimento ({avisoFiles.length})
          </TabsTrigger>
          <TabsTrigger value="recibo">
            Recibos ({reciboFiles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perdcomp" className="space-y-4">
          {perdcompFiles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum arquivo PER/DCOMP encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {perdcompFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  editingFile={editingFile}
                  editForm={editForm}
                  readonly={readonly}
                  onEdit={handleEditFile}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingFile(null)}
                  onPreview={handlePreviewFile}
                  onDownload={downloadFile}
                  onDelete={handleDeleteFile}
                  onFormChange={setEditForm}
                  getFileIcon={getFileIcon}
                  getTypeLabel={getTypeLabel}
                  getTypeBadgeVariant={getTypeBadgeVariant}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="aviso" className="space-y-4">
          {avisoFiles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum aviso de recebimento encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {avisoFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  editingFile={editingFile}
                  editForm={editForm}
                  readonly={readonly}
                  onEdit={handleEditFile}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingFile(null)}
                  onPreview={handlePreviewFile}
                  onDownload={downloadFile}
                  onDelete={handleDeleteFile}
                  onFormChange={setEditForm}
                  getFileIcon={getFileIcon}
                  getTypeLabel={getTypeLabel}
                  getTypeBadgeVariant={getTypeBadgeVariant}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recibo" className="space-y-4">
          {reciboFiles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum recibo encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reciboFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  editingFile={editingFile}
                  editForm={editForm}
                  readonly={readonly}
                  onEdit={handleEditFile}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingFile(null)}
                  onPreview={handlePreviewFile}
                  onDownload={downloadFile}
                  onDelete={handleDeleteFile}
                  onFormChange={setEditForm}
                  getFileIcon={getFileIcon}
                  getTypeLabel={getTypeLabel}
                  getTypeBadgeVariant={getTypeBadgeVariant}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
                {getFileIcon(
                  previewFileData.file.file_name,
                  previewFileData.file.mime_type
                )}
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

// Separate FileCard component for reusability
interface FileCardProps {
  file: FileMetadata;
  editingFile: FileMetadata | null;
  editForm: { file_name: string; description: string };
  readonly: boolean;
  onEdit: (file: FileMetadata) => void;
  onSave: () => void;
  onCancel: () => void;
  onPreview: (file: FileMetadata) => void;
  onDownload: (fileId: string, fileName: string, mimeType?: string) => void;
  onDelete: (file: FileMetadata) => void;
  onFormChange: (form: { file_name: string; description: string }) => void;
  getFileIcon: (fileName: string, mimeType: string) => JSX.Element;
  getTypeLabel: (type: PerdCompFileType) => string;
  getTypeBadgeVariant: (
    type: PerdCompFileType
  ) => "default" | "secondary" | "outline";
}

function FileCard({
  file,
  editingFile,
  editForm,
  readonly,
  onEdit,
  onSave,
  onCancel,
  onPreview,
  onDownload,
  onDelete,
  onFormChange,
  getFileIcon,
  getTypeLabel,
  getTypeBadgeVariant,
}: FileCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {getFileIcon(file.file_name, file.mime_type)}
            <div className="flex-1 min-w-0">
              {editingFile?.id === file.id ? (
                <div className="space-y-2">
                  <Input
                    value={editForm.file_name}
                    onChange={(e) =>
                      onFormChange({ ...editForm, file_name: e.target.value })
                    }
                    className="text-sm"
                  />
                  <Input
                    value={editForm.description}
                    onChange={(e) =>
                      onFormChange({ ...editForm, description: e.target.value })
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
                  {new Date(file.created_at).toLocaleDateString("pt-BR")}
                </span>
                <Badge
                  variant={getTypeBadgeVariant(
                    file.file_type as PerdCompFileType
                  )}
                  className="text-xs"
                >
                  {getTypeLabel(file.file_type as PerdCompFileType)}
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
                  onClick={onSave}
                  className="h-8 w-8 text-green-600 hover:text-green-600"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onCancel}
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
                  onClick={() => onPreview(file)}
                  className="h-8 w-8"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    onDownload(file.id, file.file_name, file.mime_type)
                  }
                  className="h-8 w-8"
                >
                  <Download className="h-4 w-4" />
                </Button>
                {!readonly && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(file)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(file)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
