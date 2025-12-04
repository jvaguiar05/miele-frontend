import * as React from "react";
import InputMask from "react-input-mask";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface InputMaskProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  mask: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maskChar?: string | null;
  alwaysShowMask?: boolean;
}

const MaskedInput = React.forwardRef<HTMLInputElement, InputMaskProps>(
  (
    {
      className,
      mask,
      maskChar = null,
      alwaysShowMask = false,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState("");

    // Update display value when prop value changes
    React.useEffect(() => {
      setDisplayValue(value || "");
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

    return (
      <InputMask
        mask={mask}
        maskChar={maskChar}
        alwaysShowMask={alwaysShowMask}
        value={displayValue}
        onChange={handleInputChange}
        {...props}
      >
        {(inputProps: any) => (
          <Input {...inputProps} ref={ref} className={cn(className)} />
        )}
      </InputMask>
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
