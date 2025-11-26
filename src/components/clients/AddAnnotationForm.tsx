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
import { useClientStore, type ClientAnnotation } from "@/stores/clientStore";

const annotationSchema = z.object({
  text: z.string().min(1, "O texto da anotação é obrigatório"),
  priority: z.enum(["baixa", "media", "alta"]).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type AnnotationFormData = z.infer<typeof annotationSchema>;

interface AddAnnotationFormProps {
  clientId: string;
  entityName: string;
  editingAnnotation?: ClientAnnotation; // Optional annotation to edit
  onAnnotationAdded: () => void;
  onCancel?: () => void;
}

export default function AddAnnotationForm({
  clientId,
  entityName,
  editingAnnotation,
  onAnnotationAdded,
  onCancel,
}: AddAnnotationFormProps) {
  const { toast } = useToast();
  const { createAnnotation, updateAnnotation } = useClientStore();
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
  };

  // General suggestions when no category is selected
  const generalSuggestions = [
    "importante",
    "urgente",
    "revisar",
    "acompanhar",
    "crítico",
    "atenção",
  ];

  const getCurrentSuggestions = () => {
    const category = watch("category");
    let suggestions: string[] = [];

    if (category && tagSuggestions[category as keyof typeof tagSuggestions]) {
      suggestions = tagSuggestions[category as keyof typeof tagSuggestions];
    } else {
      suggestions = generalSuggestions;
    }

    return suggestions.filter(
      (suggestion) =>
        suggestion.toLowerCase().includes(currentTag.toLowerCase()) &&
        !tags.includes(suggestion)
    );
  };

  // Populate form when editing an existing annotation
  useEffect(() => {
    if (editingAnnotation) {
      // Convert English to Portuguese for form display
      const convertPriorityToPortuguese = (priority: string) => {
        switch (priority) {
          case "high":
            return "alta";
          case "medium":
            return "media";
          case "low":
            return "baixa";
          default:
            return priority; // Already in Portuguese or other value
        }
      };

      const formData = {
        text: editingAnnotation.content.text || "",
        priority: convertPriorityToPortuguese(
          editingAnnotation.content.priority
        ) as "baixa" | "media" | "alta" | undefined,
        category: editingAnnotation.content.metadata?.category || "",
        tags: editingAnnotation.content.tags || [],
      };

      reset(formData);
      setTags(editingAnnotation.content.tags || []);
    } else {
      reset({ tags: [] });
      setTags([]);
    }
  }, [editingAnnotation, reset]);

  const addTag = (tagText?: string) => {
    const tagToAdd = tagText || currentTag.trim();
    if (tagToAdd && !tags.includes(tagToAdd)) {
      const newTags = [...tags, tagToAdd];
      setTags(newTags);
      setValue("tags", newTags);
      setCurrentTag("");
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    setValue("tags", newTags);
  };

  const onSubmit = async (data: AnnotationFormData) => {
    setIsSubmitting(true);
    try {
      const annotationData = {
        entity_name: entityName,
        content: {
          text: data.text,
          tags: data.tags || [],
          priority: data.priority || "media",
          metadata: {
            category: data.category || "observacao",
          },
        },
      };

      if (editingAnnotation) {
        // Update existing annotation
        await updateAnnotation(editingAnnotation.id, annotationData);
        toast({
          title: "Anotação atualizada",
          description: "A anotação foi atualizada com sucesso.",
        });
      } else {
        // Create new annotation
        await createAnnotation(clientId, annotationData);
        toast({
          title: "Anotação criada",
          description: "A anotação foi adicionada com sucesso.",
        });
      }

      // Reset form
      reset();
      setTags([]);
      setCurrentTag("");

      // Notify parent to refresh annotations
      onAnnotationAdded();
    } catch (error: any) {
      console.error("Error saving annotation:", error);
      toast({
        title: "Erro",
        description: error?.message || "Ocorreu um erro ao salvar a anotação.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {editingAnnotation ? "Editar Anotação" : "Nova Anotação"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Texto da Anotação *</Label>
            <Textarea
              id="text"
              {...register("text")}
              placeholder="Descreva a anotação..."
              rows={4}
              className={errors.text ? "border-destructive" : ""}
            />
            {errors.text && (
              <p className="text-sm text-destructive">{errors.text.message}</p>
            )}
          </div>

          {!editingAnnotation && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={watch("priority") || ""}
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
                <Select
                  value={watch("category") || ""}
                  onValueChange={(value) => setValue("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="observacao">Observação</SelectItem>
                    <SelectItem value="pendencia">Pendência</SelectItem>
                    <SelectItem value="comunicacao">Comunicação</SelectItem>
                    <SelectItem value="importante">Importante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!editingAnnotation && (
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={currentTag}
                    onChange={(e) => {
                      setCurrentTag(e.target.value);
                      setShowTagSuggestions(e.target.value.length > 0);
                      setSelectedSuggestionIndex(-1);
                    }}
                    onFocus={() => {
                      if (currentTag.length > 0) {
                        setShowTagSuggestions(true);
                        setSelectedSuggestionIndex(-1);
                      }
                    }}
                    onBlur={() =>
                      setTimeout(() => setShowTagSuggestions(false), 200)
                    }
                    placeholder="Digite uma tag..."
                    onKeyDown={(e) => {
                      const suggestions = getCurrentSuggestions();

                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedSuggestionIndex((prev) =>
                          prev < suggestions.length - 1 ? prev + 1 : 0
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedSuggestionIndex((prev) =>
                          prev > 0 ? prev - 1 : suggestions.length - 1
                        );
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        if (
                          selectedSuggestionIndex >= 0 &&
                          suggestions[selectedSuggestionIndex]
                        ) {
                          addTag(suggestions[selectedSuggestionIndex]);
                        } else {
                          addTag();
                        }
                      } else if (e.key === "Escape") {
                        setShowTagSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      } else if (
                        e.key === "Tab" &&
                        selectedSuggestionIndex >= 0 &&
                        suggestions[selectedSuggestionIndex]
                      ) {
                        e.preventDefault();
                        setCurrentTag(suggestions[selectedSuggestionIndex]);
                        setShowTagSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => addTag()}
                    size="icon"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tag Suggestions */}
                {showTagSuggestions && getCurrentSuggestions().length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-32 overflow-y-auto">
                    {getCurrentSuggestions().map((suggestion, index) => (
                      <button
                        key={suggestion}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          index === selectedSuggestionIndex
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addTag(suggestion);
                        }}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
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
                : "Criar Anotação"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
