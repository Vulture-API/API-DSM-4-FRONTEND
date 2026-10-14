"use client";

import { useId, useMemo, useSyncExternalStore, type ReactNode } from "react";
import Select, { type SingleValue, type StylesConfig } from "react-select";
import { cn } from "@/lib/cn";

export type ReactSelectOption<T = string | number> = {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: ReactNode;
};

export type ReactSelectProps<T = string | number> = {
  id?: string;
  name?: string;
  label?: string;
  value?: T;
  onChange: (value: T) => void;
  options: ReactSelectOption<T>[];
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  className?: string;
  variant?: "default" | "glass";
  "aria-label"?: string;
};

const emptySubscribe = () => () => {};

export function ReactSelect<T extends string | number>({
  id: explicitId,
  name,
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione uma opção...",
  isDisabled = false,
  isClearable = false,
  isSearchable = true,
  className,
  variant = "default",
  "aria-label": ariaLabel,
}: ReactSelectProps<T>) {
  const autoId = useId();
  const id = explicitId ?? autoId;
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value],
  );

  const customStyles: StylesConfig<ReactSelectOption<T>, false> = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: "36px",
        height: "36px",
        borderRadius: "8px",
        backgroundColor: variant === "glass" ? "rgba(255, 255, 255, 0.1)" : "var(--color-surface, #ffffff)",
        borderColor: state.isFocused
          ? "var(--color-brand-500, #2f8050)"
          : variant === "glass"
            ? "rgba(255, 255, 255, 0.2)"
            : "var(--color-line, #e4e2d9)",
        boxShadow: state.isFocused
          ? "0 0 0 2px rgba(47, 128, 80, 0.18)"
          : "0 1px 2px rgb(24 32 26 / 0.04)",
        fontSize: "12px",
        fontWeight: 500,
        color: variant === "glass" ? "#ffffff" : "var(--color-ink, #18201a)",
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 140ms ease-out",
        "&:hover": {
          borderColor: state.isFocused
            ? "var(--color-brand-500, #2f8050)"
            : variant === "glass"
              ? "rgba(255, 255, 255, 0.3)"
              : "var(--color-line-strong, #cfccc0)",
        },
      }),
      valueContainer: (base) => ({
        ...base,
        padding: "0 10px",
        fontSize: "12px",
      }),
      singleValue: (base) => ({
        ...base,
        color: variant === "glass" ? "#ffffff" : "var(--color-ink, #18201a)",
        fontSize: "12px",
        fontWeight: 500,
      }),
      placeholder: (base) => ({
        ...base,
        color: variant === "glass" ? "rgba(255, 255, 255, 0.6)" : "var(--color-faint, #636a64)",
        fontSize: "12px",
      }),
      input: (base) => ({
        ...base,
        color: variant === "glass" ? "#ffffff" : "var(--color-ink, #18201a)",
        fontSize: "12px",
        margin: 0,
        padding: 0,
      }),
      indicatorsContainer: (base) => ({
        ...base,
        height: "36px",
      }),
      dropdownIndicator: (base, state) => ({
        ...base,
        padding: "4px 8px",
        color: state.isFocused
          ? "var(--color-brand-600, #226339)"
          : variant === "glass"
            ? "#d5ecdc"
            : "var(--color-faint, #636a64)",
        "&:hover": {
          color: variant === "glass" ? "#ffffff" : "var(--color-ink, #18201a)",
        },
        svg: {
          width: "16px",
          height: "16px",
        },
      }),
      indicatorSeparator: () => ({
        display: "none",
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: "var(--color-surface, #ffffff)",
        border: "1px solid var(--color-line, #e4e2d9)",
        borderRadius: "10px",
        boxShadow: "0 12px 30px -6px rgb(24 32 26 / 0.16), 0 2px 6px rgb(24 32 26 / 0.06)",
        marginTop: "4px",
        zIndex: 9999,
        padding: "4px",
        overflow: "hidden",
      }),
      menuList: (base) => ({
        ...base,
        padding: "2px",
        maxHeight: "240px",
      }),
      option: (base, state) => ({
        ...base,
        borderRadius: "6px",
        fontSize: "12px",
        padding: "7px 10px",
        cursor: "pointer",
        backgroundColor: state.isSelected
          ? "var(--color-brand-50, #ecf6ef)"
          : state.isFocused
            ? "var(--color-subtle, #efeee7)"
            : "transparent",
        color: state.isSelected
          ? "var(--color-brand-900, #133622)"
          : "var(--color-ink, #18201a)",
        fontWeight: state.isSelected ? 600 : 400,
        "&:active": {
          backgroundColor: "var(--color-brand-100, #d5ecdc)",
        },
      }),
    }),
    [isDisabled, variant],
  );

  return (
    <div className={cn("relative w-full", className)}>
      {/* Select HTML acessível para leitores de tela e testes automatizados */}
      <select
        id={id}
        name={name}
        aria-label={ariaLabel ?? label}
        value={value !== undefined ? String(value) : ""}
        disabled={isDisabled}
        onChange={(e) => {
          const val = e.target.value;
          const matched = options.find((opt) => String(opt.value) === val);
          if (matched) {
            onChange(matched.value);
          } else {
            onChange(val as unknown as T);
          }
        }}
        tabIndex={-1}
        className="sr-only absolute h-0 w-0 opacity-0 pointer-events-none"
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Interface rica renderizada com react-select */}
      {isClient ? (
        <Select<ReactSelectOption<T>, false>
          instanceId={id}
          value={selectedOption}
          onChange={(newVal: SingleValue<ReactSelectOption<T>>) => {
            if (newVal) {
              onChange(newVal.value);
            }
          }}
          options={options}
          placeholder={placeholder}
          isDisabled={isDisabled}
          isClearable={isClearable}
          isSearchable={isSearchable}
          styles={customStyles}
          formatOptionLabel={(option) => (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {option.icon}
                <span className="truncate">{option.label}</span>
              </div>
              {option.badge && (
                <span className="shrink-0 rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-[10px] font-medium text-brand-700">
                  {option.badge}
                </span>
              )}
              {option.sublabel && !option.badge && (
                <span className="shrink-0 text-[11px] text-muted truncate">
                  {option.sublabel}
                </span>
              )}
            </div>
          )}
          noOptionsMessage={() => "Nenhuma opção encontrada"}
          menuPlacement="auto"
        />
      ) : (
        <div className="h-9 w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted">
          {selectedOption ? selectedOption.label : placeholder}
        </div>
      )}
    </div>
  );
}
