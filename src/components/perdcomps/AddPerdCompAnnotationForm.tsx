import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  usePerdCompStore,
  type PerdCompAnnotation,
} from "@/stores/perdcompStore";

const annotationSchema = z.object({
  text: z.string().min(1, "O texto da anotação é obrigatório"),
  priority: z.enum(["baixa", "media", "alta"]).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type AnnotationFormData = z.infer<typeof annotationSchema>;

interface AddPerdCompAnnotationFormProps {
  perdcompId: string;
  entityName: string;
  editingAnnotation?: PerdCompAnnotation; // Optional annotation to edit
  onAnnotationAdded: () => void;
  onCancel?: () => void;
}

export default function AddPerdCompAnnotationForm({
  perdcompId,
  entityName,
  editingAnnotation,
  onAnnotationAdded,
  onCancel,
}: AddPerdCompAnnotationFormProps) {
  const { toast } = useToast();
  const { createAnnotation, updateAnnotation } = usePerdCompStore();
  const [currentTag, setCurrentTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AnnotationFormData>({
    resolver: zodResolver(annotationSchema),
    defaultValues: {
      tags: [],
    },
  });

  // Tag suggestions based on categories
  const tagSuggestions = {
    observacao: ["acompanhar", "revisar", "verificar", "monitorar", "observar"],
    pendencia: ["urgente", "prazo", "documento", "aguardando", "bloqueado"],
    comunicacao: ["contato", "reunião", "email", "telefone", "resposta"],
    importante: [
      "crítico",
      "prioritário",
      "atenção",
      "destacar",
      "fundamental",
    ],
    processo: [
      "transmissão",
      "análise",
      "deferimento",
      "indeferimento",
      "reconsideração",
      "protocolo",
    ],
    valores: [
      "correção",
      "verificação",
      "cálculo",
      "compensação",
      "restituição",
    ],
  };

  // General suggestions when no category is selected
  const generalSuggestions = [
    "importante",
    "urgente",
    "revisar",
    "acompanhar",
    "crítico",
    "atenção",
    "processo",
    "transmissão",
  ];

  const getCurrentSuggestions = () => {
    const category = watch("category");
    let suggestions: string[] = [];

    if (category && tagSuggestions[category as keyof typeof tagSuggestions]) {
      suggestions = tagSuggestions[category as keyof typeof tagSuggestions];
    } else {
      suggestions = generalSuggestions;
    }

    // Filter out already added tags and current input
    return suggestions
      .filter(
        (suggestion) =>
          !tags.includes(suggestion) &&
          suggestion.toLowerCase().includes(currentTag.toLowerCase())
      )
      .slice(0, 5);
  };

  // Load existing annotation data for editing
  useEffect(() => {
    if (editingAnnotation) {
      setValue("text", editingAnnotation.content.text);
      setValue("priority", editingAnnotation.content.priority as any);
      setValue("category", editingAnnotation.content.metadata?.category || "");
      setTags(editingAnnotation.content.tags || []);
      setValue("tags", editingAnnotation.content.tags || []);
    }
  }, [editingAnnotation, setValue]);

  // Update form tags when local tags state changes
  useEffect(() => {
    setValue("tags", tags);
  }, [tags, setValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const suggestions = getCurrentSuggestions();

      if (
        selectedSuggestionIndex >= 0 &&
        suggestions[selectedSuggestionIndex]
      ) {
        addTag(suggestions[selectedSuggestionIndex]);
      } else if (currentTag.trim()) {
        addTag(currentTag.trim());
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const suggestions = getCurrentSuggestions();
      setSelectedSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const suggestions = getCurrentSuggestions();
      setSelectedSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Escape") {
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags((prev) => [...prev, normalizedTag]);
    }
    setCurrentTag("");
    setShowTagSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const onSubmit = async (data: AnnotationFormData) => {
    setIsSubmitting(true);

    try {
      const annotationData = {
        content: {
          text: data.text,
          priority: data.priority,
          tags: tags,
          metadata: {
            category: data.category,
            created_by: "current_user", // This will be set by the backend
          },
        },
      };

      if (editingAnnotation) {
        await updateAnnotation(editingAnnotation.id, annotationData);
        toast({
          title: "Anotação atualizada",
          description: "A anotação foi atualizada com sucesso.",
        });
      } else {
        await createAnnotation(perdcompId, annotationData);
        toast({
          title: "Anotação criada",
          description: "A nova anotação foi adicionada com sucesso.",
        });
      }

      reset();
      setTags([]);
      setCurrentTag("");
      onAnnotationAdded();
    } catch (error: any) {
      console.error("Error submitting annotation:", error);
      toast({
        title: "Erro",
        description:
          error.response?.data?.message ||
          "Erro ao salvar anotação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestions = getCurrentSuggestions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingAnnotation ? "Editar Anotação" : "Nova Anotação"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Anotação</Label>
            <Textarea
              id="text"
              {...register("text")}
              placeholder="Descreva sua anotação sobre este PER/DCOMP..."
              className="min-h-[120px] resize-none"
            />
            {errors.text && (
              <p className="text-sm text-destructive">{errors.text.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                onValueChange={(value) => setValue("priority", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select onValueChange={(value) => setValue("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="observacao">Observação</SelectItem>
                  <SelectItem value="pendencia">Pendência</SelectItem>
                  <SelectItem value="comunicacao">Comunicação</SelectItem>
                  <SelectItem value="importante">Importante</SelectItem>
                  <SelectItem value="processo">Processo</SelectItem>
                  <SelectItem value="valores">Valores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="relative">
              <Input
                id="tags"
                value={currentTag}
                onChange={(e) => {
                  setCurrentTag(e.target.value);
                  setShowTagSuggestions(e.target.value.length > 0);
                  setSelectedSuggestionIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowTagSuggestions(currentTag.length > 0)}
                onBlur={() => {
                  // Delay hiding suggestions to allow for clicking
                  setTimeout(() => {
                    setShowTagSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                  }, 200);
                }}
                placeholder="Digite uma tag e pressione Enter para adicionar"
              />

              {showTagSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-40 overflow-y-auto bg-background border rounded-md shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                        index === selectedSuggestionIndex ? "bg-muted" : ""
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addTag(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Salvando..."
                : editingAnnotation
                ? "Atualizar Anotação"
                : "Adicionar Anotação"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
