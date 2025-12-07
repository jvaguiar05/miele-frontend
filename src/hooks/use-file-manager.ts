import { useState, useCallback } from "react";
import { fileApi } from "@/lib/api";
import { FileMetadata, ClientFileType, PerdCompFileType } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

interface UseFileManagerOptions {
  entityId: string;
  entityType: "client" | "perdcomp";
}

export function useFileManager({
  entityId,
  entityType,
}: UseFileManagerOptions) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const loadFiles = useCallback(async () => {
    if (!entityId) return;

    setLoading(true);
    try {
      const fileList = await fileApi.listFiles(entityId);
      setFiles(fileList);
    } catch (error: any) {
      console.error("Error loading files:", error);
      toast({
        title: "Erro ao carregar arquivos",
        description:
          error.response?.status === 502
            ? "Serviço de armazenamento instável. Tente novamente."
            : "Não foi possível carregar os arquivos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [entityId, toast]);

  const uploadFile = async (
    file: File,
    fileType: ClientFileType | PerdCompFileType,
    description?: string
  ) => {
    if (!entityId) return;

    setUploading(true);
    try {
      const fileMetadata = await fileApi.uploadFile(
        entityId,
        file,
        fileType,
        description
      );
      setFiles((prev) => [...prev, fileMetadata]);

      toast({
        title: "Arquivo enviado com sucesso",
        description: `${file.name} foi adicionado aos arquivos.`,
      });

      return fileMetadata;
    } catch (error: any) {
      console.error("Error uploading file:", error);

      let errorMessage = "Não foi possível enviar o arquivo.";
      if (error.response?.status === 502) {
        errorMessage = "Serviço de armazenamento instável. Tente novamente.";
      } else if (error.response?.status === 400) {
        errorMessage = "Tipo de arquivo inválido ou dados incompletos.";
      }

      toast({
        title: "Erro ao enviar arquivo",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (
    fileId: string,
    fileName: string,
    mimeType?: string
  ) => {
    try {
      await fileApi.downloadFileWithName(fileId, fileName, mimeType);

      toast({
        title: "Download iniciado",
        description: `${fileName} será baixado em instantes.`,
      });
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast({
        title: "Erro ao baixar arquivo",
        description: "Não foi possível baixar o arquivo.",
        variant: "destructive",
      });
    }
  };

  const previewFile = async (fileId: string) => {
    try {
      const previewUrl = await fileApi.getPreviewUrl(fileId);
      return previewUrl;
    } catch (error: any) {
      console.error("Error previewing file:", error);
      toast({
        title: "Erro ao visualizar arquivo",
        description: "Não foi possível carregar a visualização.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateFile = async (
    fileId: string,
    updates: { file_name?: string; description?: string; file?: File }
  ) => {
    try {
      const updatedFile = await fileApi.updateFile(fileId, updates);
      setFiles((prev) => prev.map((f) => (f.id === fileId ? updatedFile : f)));

      toast({
        title: "Arquivo atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      return updatedFile;
    } catch (error: any) {
      console.error("Error updating file:", error);
      toast({
        title: "Erro ao atualizar arquivo",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteFile = async (fileId: string, fileName: string) => {
    try {
      await fileApi.deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));

      toast({
        title: "Arquivo removido",
        description: `${fileName} foi removido permanentemente.`,
      });
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast({
        title: "Erro ao remover arquivo",
        description: "Não foi possível remover o arquivo.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Validate file type and size
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Apenas arquivos PDF, JPG e PNG são aceitos.",
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "O arquivo deve ter no máximo 10MB.",
      };
    }

    return { isValid: true };
  };

  // Get file type options based on entity type
  const getFileTypeOptions = () => {
    if (entityType === "client") {
      return [
        { value: "contrato", label: "Contrato" },
        { value: "cartao_cnpj", label: "Cartão CNPJ" },
      ] as const;
    } else {
      return [
        { value: "perdcomp", label: "PER/DCOMP" },
        { value: "aviso_recebimento", label: "Aviso de Recebimento" },
        { value: "recibo", label: "Recibo" },
      ] as const;
    }
  };

  return {
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
  };
}
