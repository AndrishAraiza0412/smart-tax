import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Pressable, View, Text, TextInput, FlatList, Modal, TouchableWithoutFeedback, Keyboard } from "react-native";
import { PressableComponent } from "./pressable";
import { Icon } from "./icon";
import { Label } from "./label";

type PressableInstance = React.ComponentProps<typeof Pressable>["ref"] extends React.RefObject<infer T> ? T : never;

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectBaseProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  searchable?: boolean;
  asyncOptions?: (query: string) => Promise<SelectOption[]>;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  id?: string;
}

// Backward compatibility with old Select API
interface SelectItemProps {
  value: string;
  label: string;
  children?: React.ReactNode;
}

export function SelectItem({ value, label, children }: SelectItemProps): React.JSX.Element {
  return <View />; // This is just for type compatibility, actual rendering is handled by Select
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Seleccionar",
  label,
  error,
  helperText,
  searchable = false,
  asyncOptions,
  disabled = false,
  required = false,
  className = "",
  containerClassName = "",
  labelClassName = "",
  id,
}: SelectBaseProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [asyncResults, setAsyncResults] = useState<SelectOption[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const flatListRef = useRef<FlatList<SelectOption>>(null);
  const inputRef = useRef<TextInput>(null);
  const triggerRef = useRef<PressableInstance>(null);

  const hasError = !!error;
  const displayValue = options.find((opt) => opt.value === value)?.label || placeholder;
  const isPlaceholder = !value;

  // `options` y `asyncOptions` suelen llegar como valores nuevos en cada render del padre:
  // nunca van en deps de un efecto que haga setState (provoca "Maximum update depth exceeded").
  const useAsync = !!asyncOptions && searchable;
  const asyncRef = useRef(asyncOptions);
  asyncRef.current = asyncOptions;
  const localFiltered = useMemo(
    () => options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()) && !opt.disabled),
    [options, searchQuery],
  );
  const filteredOptions = useAsync && asyncResults ? asyncResults : localFiltered;

  useEffect(() => {
    if (!useAsync) return;
    if (searchQuery.length === 0) {
      setAsyncResults(null);
      return;
    }
    const debounce = setTimeout(async () => {
      setIsLoading(true);
      try {
        setAsyncResults((await asyncRef.current?.(searchQuery)) ?? null);
      } catch (e) {
        console.error("Async options error:", e);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, useAsync]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [isOpen]);

  const handleSelect = (option: SelectOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
      setSearchQuery("");
      Keyboard.dismiss();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        event.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleSelect(filteredOptions[focusedIndex]);
        }
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        Keyboard.dismiss();
        break;
    }
  };

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchQuery("");
        setFocusedIndex(-1);
      }
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery("");
  };

  const renderOption = ({ item, index }: { item: SelectOption; index: number }) => (
    <PressableComponent
      key={item.value}
      variant="opacity"
      haptic="none"
      disabled={!!item.disabled}
      onPress={() => handleSelect(item)}
      className={`
        flex-row items-center justify-between px-4 py-3
        ${index === focusedIndex ? "bg-primary-muted dark:bg-primary-muted/30" : ""}
        ${item.disabled ? "opacity-50" : ""}
      `}
      accessibilityRole="menuitem"
      accessibilitySelected={item.value === value}
      accessibilityDisabled={!!item.disabled}
    >
      <Text className={`font-sans text-body-md ${item.value === value ? "text-primary font-semibold" : "text-ink dark:text-white"}`}>
        {item.label}
      </Text>
      {item.value === value && <Icon name="check" size={20} color="primary" />}
    </PressableComponent>
  );

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Label htmlFor={id ?? ""} required={required} className={labelClassName}>
          {label}
        </Label>
      )}
      <PressableComponent
        ref={triggerRef}
        variant="none"
        haptic="none"
        disabled={disabled}
        onPress={toggleOpen}
        className={`
          flex-row items-center justify-between
          h-12 px-4 rounded-xl border bg-canvas dark:bg-[#111827]
          transition-colors duration-fast ease-out
          ${hasError ? "border-error focus:border-error" : "border-border dark:border-stroke"}
          ${disabled ? "opacity-50 bg-muted/20" : ""}
          ${className}
        `}
        accessibilityRole="combobox"
        accessibilityExpanded={isOpen}
        accessibilityHasPopup="listbox"
        accessibilityRequired={required}
        accessibilityInvalid={hasError}
        accessibilityLabel={label ?? ""}
      >
        <Text className={`font-sans text-body-md flex-1 ${isPlaceholder ? "text-faint" : "text-ink dark:text-white"}`}>
          {displayValue}
        </Text>
        <Icon name="chevron-down" size={20} color="muted" className={isOpen ? "rotate-180 transition-transform duration-fast" : "transition-transform duration-fast"} />
      </PressableComponent>

      {isOpen && (
        <Modal
          transparent
          visible={true}
          onRequestClose={closeDropdown}
          animationType="fade"
        >
          <TouchableWithoutFeedback onPress={closeDropdown} accessible={false}>
            <View className="flex-1" />
          </TouchableWithoutFeedback>
          <View className="absolute bottom-0 left-0 right-0 bg-surface dark:bg-nightcard rounded-t-lg shadow-xl z-50 max-h-96">
            {searchable && (
              <View className="p-3 border-b border-border dark:border-stroke">
                <TextInput
                  ref={inputRef}
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="h-11 px-4 rounded-md border border-border bg-white dark:bg-nightcard dark:border-white/10 font-sans text-body-md text-ink dark:text-white"
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
            {isLoading ? (
              <View className="p-8 items-center justify-center">
                <Icon name="refresh-cw" size={24} color="primary" className="animate-spin" />
                <Text className="font-sans text-body-sm text-muted mt-2">Cargando...</Text>
              </View>
            ) : filteredOptions.length === 0 ? (
              <View className="p-8 items-center justify-center">
                <Text className="font-sans text-body-md text-muted">No hay opciones disponibles</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={filteredOptions}
                renderItem={renderOption}
                keyExtractor={(item) => item.value}
                contentContainerStyle={{ paddingBottom: 8 }}
              />
            )}
          </View>
        </Modal>
      )}

      {(hasError || helperText) && (
        <Text
          id={hasError ? `${id}-error` : `${id}-helper`}
          className={`font-sans text-caption mt-1.5 ${hasError ? "text-error" : "text-muted"}`}
        >
          {hasError ? error : helperText}
        </Text>
      )}
    </View>
  );
}

// Attach SelectItem for backward compatibility
Select.Item = SelectItem;