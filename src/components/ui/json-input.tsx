import * as React from "react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Check, X } from "lucide-react";
import { MaskedInput } from "./input-mask";
import { CapitalizedInput } from "./capitalized-input";

export interface JsonInputProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  jsonType: "atividades" | "quadro_societario";
}

interface AtividadeItem {
  cnae: string;
  descricao: string;
}

interface QuadroSocietarioItem {
  nome: string;
  cargo: string;
}

const JsonInput = React.forwardRef<HTMLTextAreaElement, JsonInputProps>(
  ({ className, value = "", onChange, jsonType, ...props }, ref) => {
    const [isSimpleMode, setIsSimpleMode] = React.useState(true);
    const [items, setItems] = React.useState<
      (AtividadeItem | QuadroSocietarioItem)[]
    >([]);
    const [isValidJson, setIsValidJson] = React.useState(true);

    // Initialize items from JSON value
    React.useEffect(() => {
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            setItems(parsed);
            setIsValidJson(true);
          } else {
            setIsValidJson(false);
          }
        } catch (error) {
          setIsValidJson(false);
          // Try to keep simple mode if JSON is invalid
        }
      } else {
        setItems([]);
        setIsValidJson(true);
      }
    }, [value]);

    const updateJsonValue = (
      newItems: (AtividadeItem | QuadroSocietarioItem)[]
    ) => {
      const jsonString = JSON.stringify(newItems);

      if (onChange) {
        // Create a fake event for the parent component
        const fakeEvent = {
          target: {
            value: jsonString,
          },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(fakeEvent);
      }
    };

    const addItem = () => {
      const newItem =
        jsonType === "atividades"
          ? ({ cnae: "", descricao: "" } as AtividadeItem)
          : ({ nome: "", cargo: "" } as QuadroSocietarioItem);

      const newItems = [...items, newItem];
      setItems(newItems);
      updateJsonValue(newItems);
    };

    const removeItem = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      updateJsonValue(newItems);
    };

    const updateItem = (index: number, field: string, newValue: string) => {
      const newItems = [...items];
      (newItems[index] as any)[field] = newValue;
      setItems(newItems);
      updateJsonValue(newItems);
    };

    const handleDirectJsonChange = (
      event: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const newValue = event.target.value;

      try {
        if (newValue.trim()) {
          const parsed = JSON.parse(newValue);
          if (Array.isArray(parsed)) {
            setItems(parsed);
            setIsValidJson(true);
          } else {
            setIsValidJson(false);
          }
        } else {
          setItems([]);
          setIsValidJson(true);
        }
      } catch (error) {
        setIsValidJson(false);
      }

      if (onChange) {
        onChange(event);
      }
    };

    const renderAtividadeItem = (item: AtividadeItem, index: number) => (
      <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
        <div className="flex-1 space-y-2">
          <div>
            <Label className="text-sm">CNAE</Label>
            <MaskedInput
              mask="9999-9/99"
              value={item.cnae}
              onChange={(e) => updateItem(index, "cnae", e.target.value)}
              placeholder="0000-0/00"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-sm">Descrição</Label>
            <Input
              value={item.descricao}
              onChange={(e) => updateItem(index, "descricao", e.target.value)}
              placeholder="Ex: Desenvolvimento de software"
              className="text-sm"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => removeItem(index)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );

    const renderQuadroSocietarioItem = (
      item: QuadroSocietarioItem,
      index: number
    ) => (
      <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
        <div className="flex-1 space-y-2">
          <div>
            <Label className="text-sm">Nome</Label>
            <CapitalizedInput
              value={item.nome}
              onChange={(e) => updateItem(index, "nome", e.target.value)}
              placeholder="Ex: João Silva"
              className="text-sm"
              capitalizationType="title"
            />
          </div>
          <div>
            <Label className="text-sm">Cargo</Label>
            <CapitalizedInput
              value={item.cargo}
              onChange={(e) => updateItem(index, "cargo", e.target.value)}
              placeholder="Ex: Administrador"
              className="text-sm"
              capitalizationType="title"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => removeItem(index)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );

    if (isSimpleMode) {
      return (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Modo Simplificado</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSimpleMode(false)}
              className="text-sm"
            >
              Editar JSON diretamente
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) =>
              jsonType === "atividades"
                ? renderAtividadeItem(item as AtividadeItem, index)
                : renderQuadroSocietarioItem(
                    item as QuadroSocietarioItem,
                    index
                  )
            )}

            {items.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500 text-sm">
                  {jsonType === "atividades"
                    ? "Nenhuma atividade adicionada"
                    : "Nenhum sócio adicionado"}
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {jsonType === "atividades"
                ? "Adicionar Atividade"
                : "Adicionar Sócio"}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isValidJson ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">JSON Válido</span>
              </>
            ) : (
              <>
                <X className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">JSON Inválido</span>
              </>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsSimpleMode(true)}
            className="text-sm"
          >
            Modo Simplificado
          </Button>
        </div>

        <Textarea
          {...props}
          ref={ref}
          value={value}
          onChange={handleDirectJsonChange}
          className={cn(
            className,
            !isValidJson && "border-red-300 focus:border-red-500"
          )}
        />
      </div>
    );
  }
);

JsonInput.displayName = "JsonInput";

export { JsonInput };
