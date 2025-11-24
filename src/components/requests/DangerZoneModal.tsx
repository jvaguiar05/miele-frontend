import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DangerZoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmationText: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function DangerZoneModal({
  open,
  onOpenChange,
  title,
  description,
  confirmationText,
  onConfirm,
  isLoading = false,
}: DangerZoneModalProps) {
  const [inputValue, setInputValue] = useState("");
  
  const isConfirmDisabled = inputValue !== confirmationText || isLoading;

  const handleConfirm = () => {
    if (!isConfirmDisabled) {
      onConfirm();
      setInputValue("");
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setInputValue("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-red-700 dark:text-red-400">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            Esta ação é irreversível e não pode ser desfeita.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="confirmation" className="text-sm font-medium">
            Digite <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">{confirmationText}</span> para confirmar:
          </Label>
          <Input
            id="confirmation"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={confirmationText}
            className="font-mono"
          />
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Processando..." : "Confirmar Ação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}