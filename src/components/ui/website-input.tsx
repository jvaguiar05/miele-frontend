import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export interface WebsiteInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const WebsiteInput = React.forwardRef<HTMLInputElement, WebsiteInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");
    const [isValid, setIsValid] = React.useState<boolean | null>(null);

    // URL validation regex
    const urlRegex = /^https?:\/\/.+\..+/;

    // Format URL to include protocol
    const formatURL = (input: string) => {
      if (!input) return "";

      const trimmed = input.trim().toLowerCase();

      // If already has protocol, return as is
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }

      // Add https:// if it looks like a domain
      if (trimmed.includes(".") && !trimmed.includes(" ")) {
        return `https://${trimmed}`;
      }

      return trimmed;
    };

    // Update display value when prop value changes
    React.useEffect(() => {
      const newValue = value || "";
      setDisplayValue(newValue);
      setIsValid(newValue ? urlRegex.test(formatURL(newValue)) : null);
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
        const formattedURL = formatURL(displayValue);
        setDisplayValue(formattedURL);
        setIsValid(urlRegex.test(formattedURL));

        if (onChange) {
          const newEvent = {
            ...event,
            target: {
              ...event.target,
              value: formattedURL,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(newEvent);
        }
      } else {
        setIsValid(null);
      }

      if (props.onBlur) {
        props.onBlur(event);
      }
    };

    const openWebsite = () => {
      if (isValid && displayValue) {
        window.open(displayValue, "_blank", "noopener,noreferrer");
      }
    };

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type="url"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="exemplo.com.br"
          className={cn(
            "pr-8",
            isValid === false &&
              displayValue &&
              "border-red-300 focus:border-red-500",
            isValid === true && "border-green-300 focus:border-green-500",
            className
          )}
        />
        {isValid && displayValue && (
          <button
            type="button"
            onClick={openWebsite}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
            title="Abrir website"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

WebsiteInput.displayName = "WebsiteInput";

export { WebsiteInput };
