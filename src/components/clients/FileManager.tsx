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
  Calendar,
  AlertCircle,
  MoreVertical,
  Plus,
  File,
  FileImage,
  FileCheck,
  Clock,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useFileManager } from "@/hooks/use-file-manager";
import { FileMetadata, ClientFileType } from "@/types/api";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [expirationDate, setExpirationDate] = useState<Date>();
  const [previewFileData, setPreviewFileData] = useState<{
    file: FileMetadata;
    url: string;
  } | null>(null);
  const [editingFile, setEditingFile] = useState<FileMetadata | null>(null);
  const [editForm, setEditForm] = useState({
    file_name: "",
    description: "",
  });

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

    // Validate expiration date for contracts
    if (selectedFileType === "contrato" && !expirationDate) {
      return;
    }

    try {
      await uploadFile(
        file,
        selectedFileType,
        uploadDescription,
        selectedFileType === "contrato" && expirationDate
          ? expirationDate.toISOString().split("T")[0]
          : undefined
      );

      // Reset form
      setIsUploadDialogOpen(false);
      setUploadDescription("");
      setSelectedFileType("cartao_cnpj");
      setExpirationDate(undefined);
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

  const getTypeLabel = (type: ClientFileType) => {
    return type === "contrato" ? "Contrato" : "Cartão CNPJ";
  };

  const getTypeBadgeVariant = (type: ClientFileType) => {
    return type === "contrato" ? "default" : "secondary";
  };

  const renderModernFileCard = (file: FileMetadata) => (
    <Card key={file.id} className="group hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          {/* File Info */}
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {file.mime_type === "application/pdf" ? (
                <File className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              ) : (
                <FileImage className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
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
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="flex-1 sm:flex-initial"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingFile(null)}
                      className="flex-1 sm:flex-initial"
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
                    {file.file_type === "contrato" && file.expiration_date && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            Válido até{" "}
                            {format(
                              new Date(file.expiration_date),
                              "dd/MM/yyyy"
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <Badge
                    variant={getTypeBadgeVariant(
                      file.file_type as ClientFileType
                    )}
                    className="w-fit text-xs"
                  >
                    {getTypeLabel(file.file_type as ClientFileType)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {editingFile?.id !== file.id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity h-8 w-8 p-0 shrink-0"
                >
                  <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => handlePreviewFile(file.id)}>
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-sm">Visualizar</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDownloadFile(file.id, file.file_name)}
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-sm">Download</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => startEditing(file)}>
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-sm">Editar</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteFile(file.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-sm">Excluir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
    <div className="space-y-4 sm:space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              Arquivos
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gerencie contratos e documentos do cliente
            </p>
          </div>

          <Dialog
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                className="flex items-center gap-2 w-full sm:w-auto"
                disabled={uploading}
              >
                <Plus className="h-4 w-4" />
                {uploading ? "Enviando..." : "Novo Arquivo"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
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
                  <div className="flex gap-2">
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
                        onClick={() => {
                          setSelectedFileType(option.value);
                          if (option.value !== "contrato") {
                            setExpirationDate(undefined);
                          }
                        }}
                        className="flex-1"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Expiration Date - Compact */}
                {selectedFileType === "contrato" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      <Label className="text-sm font-medium">
                        Data de Validade
                      </Label>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-full justify-start text-left",
                            !expirationDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-3 w-3" />
                          {expirationDate
                            ? format(expirationDate, "dd/MM/yyyy")
                            : "Selecionar data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={expirationDate}
                          onSelect={setExpirationDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

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
                      uploading && "opacity-50 cursor-not-allowed",
                      selectedFileType === "contrato" &&
                        !expirationDate &&
                        "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input
                      {...getInputProps()}
                      disabled={
                        uploading ||
                        (selectedFileType === "contrato" && !expirationDate)
                      }
                    />
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
        </div>

        {/* Files Tabs */}
        <Tabs defaultValue="contratos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="contratos"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <FileCheck className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">
                Contratos ({contratoFiles.length})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="cnpj"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <FileImage className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">CNPJ ({cnpjFiles.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contratos" className="mt-6">
            {contratoFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">Nenhum contrato encontrado</p>
                <p className="text-xs mt-1">
                  Faça o upload do primeiro contrato
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[50vh] sm:h-[40vh] pr-2 sm:pr-3">
                <div className="grid gap-3">
                  {contratoFiles.map((file) => renderModernFileCard(file))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="cnpj" className="mt-6">
            {cnpjFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileImage className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">Nenhum cartão CNPJ encontrado</p>
                <p className="text-xs mt-1">
                  Faça o upload do primeiro cartão CNPJ
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[50vh] sm:h-[40vh] pr-2 sm:pr-3">
                <div className="grid gap-3">
                  {cnpjFiles.map((file) => renderModernFileCard(file))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        {previewFileData && (
          <Dialog
            open={!!previewFileData}
            onOpenChange={() => setPreviewFileData(null)}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {previewFileData.file.file_name}
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 pt-0">
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
    </div>
  );
}
