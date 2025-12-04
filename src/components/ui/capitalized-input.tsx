import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface CapitalizedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  capitalizationType?: "title" | "upper" | "sentence";
}

const CapitalizedInput = React.forwardRef<
  HTMLInputElement,
  CapitalizedInputProps
>(
  (
    { className, value = "", onChange, capitalizationType = "title", ...props },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState("");

    // Capitalization functions
    const capitalizeText = (text: string, type: string) => {
      if (!text) return "";

      switch (type) {
        case "title":
          // Title Case - capitaliza cada palavra
          return text.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
        case "upper":
          // Uppercase
          return text.toUpperCase();
        case "sentence":
          // Sentence case - apenas primeira letra
          return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        default:
          return text;
      }
    };

    // Update display value when prop value changes
    React.useEffect(() => {
      const newValue = value || "";
      setDisplayValue(newValue);
    }, [value]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;

      setDisplayValue(inputValue);

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

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (displayValue) {
        const capitalizedValue = capitalizeText(
          displayValue,
          capitalizationType
        );
        setDisplayValue(capitalizedValue);

        if (onChange) {
          const newEvent = {
            ...event,
            target: {
              ...event.target,
              value: capitalizedValue,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(newEvent);
        }
      }

      if (props.onBlur) {
        props.onBlur(event);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className={cn(className)}
      />
    );
  }
);

CapitalizedInput.displayName = "CapitalizedInput";

export { CapitalizedInput };
