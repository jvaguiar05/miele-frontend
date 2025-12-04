import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

export interface EmailInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const [isValid, setIsValid] = React.useState<boolean | null>(null);
    const [displayValue, setDisplayValue] = React.useState("");

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Update display value when prop value changes
    React.useEffect(() => {
      const newValue = (value || "").toLowerCase();
      setDisplayValue(newValue);
      setIsValid(newValue ? emailRegex.test(newValue) : null);
    }, [value]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value.toLowerCase().trim();

      setDisplayValue(inputValue);
      setIsValid(inputValue ? emailRegex.test(inputValue) : null);

      if (onChange) {
        const newEvent = {
          ...event,
          target: {
            ...event.target,
            value: inputValue,
          },
        };
        onChange(newEvent);
      }
    };

    const getValidationIcon = () => {
      if (isValid === null || displayValue === "") return null;

      return isValid ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      );
    };

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type="email"
          value={displayValue}
          onChange={handleInputChange}
          className={cn(
            "pr-8",
            isValid === false &&
              displayValue &&
              "border-red-300 focus:border-red-500",
            isValid === true && "border-green-300 focus:border-green-500",
            className
          )}
        />
        {displayValue && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
        )}
      </div>
    );
  }
);

EmailInput.displayName = "EmailInput";

export { EmailInput };
