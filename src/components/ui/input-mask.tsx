import * as React from "react";
import InputMask from "react-input-mask";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface InputMaskProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maskChar?: string | null;
  alwaysShowMask?: boolean;
}

const MaskedInput = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ className, mask, maskChar = null, alwaysShowMask = false, ...props }, ref) => {
    return (
      <InputMask
        mask={mask}
        maskChar={maskChar}
        alwaysShowMask={alwaysShowMask}
        {...props}
      >
        {(inputProps: any) => (
          <Input
            {...inputProps}
            ref={ref}
            className={cn(className)}
          />
        )}
      </InputMask>
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
