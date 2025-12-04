import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    // Format phone number based on length
    const formatPhone = (input: string) => {
      // Remove all non-digits
      const digits = input.replace(/\D/g, "");

      if (digits.length === 0) return "";

      // Apply mask based on length
      if (digits.length <= 2) {
        // Just area code
        return `(${digits}`;
      } else if (digits.length <= 6) {
        // Area code + first part
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      } else if (digits.length <= 10) {
        // 8-digit number: (xx) xxxx-xxxx
        const areaCode = digits.slice(0, 2);
        const firstPart = digits.slice(2, 6);
        const secondPart = digits.slice(6);
        return `(${areaCode}) ${firstPart}${
          secondPart ? `-${secondPart}` : ""
        }`;
      } else {
        // 9-digit number: (xx) xxxxx-xxxx
        const areaCode = digits.slice(0, 2);
        const firstPart = digits.slice(2, 7);
        const secondPart = digits.slice(7, 11);
        return `(${areaCode}) ${firstPart}${
          secondPart ? `-${secondPart}` : ""
        }`;
      }
    };

    // Update display value when prop value changes and ensure it's always formatted
    React.useEffect(() => {
      const newFormattedValue = formatPhone(value || "");
      setDisplayValue(newFormattedValue);
    }, [value]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      const formattedValue = formatPhone(inputValue);

      setDisplayValue(formattedValue);

      if (onChange) {
        // Create a new event with the formatted value
        const newEvent = {
          ...event,
          target: {
            ...event.target,
            value: formattedValue,
          },
        };
        onChange(newEvent);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleInputChange}
        placeholder="(00) 00000-0000"
        className={cn(className)}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
