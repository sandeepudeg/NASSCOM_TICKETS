import React, { useState, useRef, useEffect } from 'react';

export interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  showRequiredIndicator?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helpText,
  required = false,
  showRequiredIndicator = true,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  
  const inputClasses = [
    'form-control',
    'min-h-[44px]', // WCAG touch target size
    'transition-all duration-200',
    'focus:outline-none focus:ring-3 focus:ring-primary focus:ring-opacity-50',
    error ? 'is-invalid border-danger' : '',
    className
  ].filter(Boolean).join(' ');

  const describedBy = [
    error ? errorId : '',
    helpText ? helpId : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="mb-4">
      <label 
        htmlFor={inputId} 
        className={`form-label block mb-2 font-medium ${required && showRequiredIndicator ? 'required' : ''}`}
      >
        {label}
        {required && showRequiredIndicator && (
          <span className="text-danger ml-1" aria-label="required">*</span>
        )}
      </label>
      
      <input
        id={inputId}
        className={inputClasses}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      
      {helpText && (
        <div id={helpId} className="form-text text-sm text-muted mt-1">
          {helpText}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId} 
          className="invalid-feedback text-sm text-danger mt-1"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  error?: string;
  helpText?: string;
  required?: boolean;
  showRequiredIndicator?: boolean;
  placeholder?: string;
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  label,
  options,
  error,
  helpText,
  required = false,
  showRequiredIndicator = true,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${selectId}-error`;
  const helpId = `${selectId}-help`;
  
  const selectClasses = [
    'form-select',
    'min-h-[44px]', // WCAG touch target size
    'transition-all duration-200',
    'focus:outline-none focus:ring-3 focus:ring-primary focus:ring-opacity-50',
    error ? 'is-invalid border-danger' : '',
    className
  ].filter(Boolean).join(' ');

  const describedBy = [
    error ? errorId : '',
    helpText ? helpId : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="mb-4">
      <label 
        htmlFor={selectId} 
        className={`form-label block mb-2 font-medium ${required && showRequiredIndicator ? 'required' : ''}`}
      >
        {label}
        {required && showRequiredIndicator && (
          <span className="text-danger ml-1" aria-label="required">*</span>
        )}
      </label>
      
      <select
        id={selectId}
        className={selectClasses}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy || undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {helpText && (
        <div id={helpId} className="form-text text-sm text-muted mt-1">
          {helpText}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId} 
          className="invalid-feedback text-sm text-danger mt-1"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  showRequiredIndicator?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

export const AccessibleTextarea: React.FC<AccessibleTextareaProps> = ({
  label,
  error,
  helpText,
  required = false,
  showRequiredIndicator = true,
  maxLength,
  showCharCount = false,
  className = '',
  id,
  value,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${textareaId}-error`;
  const helpId = `${textareaId}-help`;
  const countId = `${textareaId}-count`;
  
  const currentLength = typeof value === 'string' ? value.length : 0;
  
  const textareaClasses = [
    'form-control',
    'min-h-[88px]', // Larger minimum height for textarea
    'transition-all duration-200',
    'focus:outline-none focus:ring-3 focus:ring-primary focus:ring-opacity-50',
    error ? 'is-invalid border-danger' : '',
    className
  ].filter(Boolean).join(' ');

  const describedBy = [
    error ? errorId : '',
    helpText ? helpId : '',
    showCharCount && maxLength ? countId : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="mb-4">
      <label 
        htmlFor={textareaId} 
        className={`form-label block mb-2 font-medium ${required && showRequiredIndicator ? 'required' : ''}`}
      >
        {label}
        {required && showRequiredIndicator && (
          <span className="text-danger ml-1" aria-label="required">*</span>
        )}
      </label>
      
      <textarea
        id={textareaId}
        className={textareaClasses}
        required={required}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy || undefined}
        value={value}
        {...props}
      />
      
      {showCharCount && maxLength && (
        <div 
          id={countId} 
          className="text-sm text-muted mt-1"
          aria-live="polite"
        >
          {currentLength} / {maxLength} characters
        </div>
      )}
      
      {helpText && (
        <div id={helpId} className="form-text text-sm text-muted mt-1">
          {helpText}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId} 
          className="invalid-feedback text-sm text-danger mt-1"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export interface AccessibleCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
  indeterminate?: boolean;
}

export const AccessibleCheckbox: React.FC<AccessibleCheckboxProps> = ({
  label,
  error,
  helpText,
  indeterminate = false,
  className = '',
  id,
  ...props
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${checkboxId}-error`;
  const helpId = `${checkboxId}-help`;
  
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);
  
  const checkboxClasses = [
    'form-check-input',
    'min-h-[20px] min-w-[20px]', // Ensure adequate size
    'transition-all duration-200',
    'focus:outline-none focus:ring-3 focus:ring-primary focus:ring-opacity-50',
    error ? 'is-invalid border-danger' : '',
    className
  ].filter(Boolean).join(' ');

  const describedBy = [
    error ? errorId : '',
    helpText ? helpId : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="form-check mb-3">
      <input
        ref={checkboxRef}
        type="checkbox"
        id={checkboxId}
        className={checkboxClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      
      <label htmlFor={checkboxId} className="form-check-label ml-2">
        {label}
      </label>
      
      {helpText && (
        <div id={helpId} className="form-text text-sm text-muted mt-1 ml-6">
          {helpText}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId} 
          className="invalid-feedback text-sm text-danger mt-1 ml-6"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};

export interface AccessibleRadioGroupProps {
  name: string;
  label: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  showRequiredIndicator?: boolean;
}

export const AccessibleRadioGroup: React.FC<AccessibleRadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  error,
  helpText,
  required = false,
  showRequiredIndicator = true
}) => {
  const groupId = `radiogroup-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${groupId}-error`;
  const helpId = `${groupId}-help`;
  
  const describedBy = [
    error ? errorId : '',
    helpText ? helpId : ''
  ].filter(Boolean).join(' ');

  return (
    <fieldset className="mb-4">
      <legend className={`form-label font-medium mb-3 ${required && showRequiredIndicator ? 'required' : ''}`}>
        {label}
        {required && showRequiredIndicator && (
          <span className="text-danger ml-1" aria-label="required">*</span>
        )}
      </legend>
      
      <div 
        role="radiogroup" 
        aria-labelledby={groupId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy || undefined}
      >
        {options.map((option, index) => {
          const radioId = `${name}-${option.value}`;
          return (
            <div key={option.value} className="form-check mb-2">
              <input
                type="radio"
                id={radioId}
                name={name}
                value={option.value}
                checked={value === option.value}
                disabled={option.disabled}
                onChange={(e) => onChange?.(e.target.value)}
                className="form-check-input min-h-[20px] min-w-[20px] focus:outline-none focus:ring-3 focus:ring-primary focus:ring-opacity-50"
                required={required}
              />
              <label htmlFor={radioId} className="form-check-label ml-2">
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      
      {helpText && (
        <div id={helpId} className="form-text text-sm text-muted mt-2">
          {helpText}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId} 
          className="invalid-feedback text-sm text-danger mt-2"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </fieldset>
  );
};

export interface AccessibleFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  errors?: Record<string, string>;
  successMessage?: string;
}

export const AccessibleForm: React.FC<AccessibleFormProps> = ({
  children,
  onSubmit,
  errors = {},
  successMessage,
  ...props
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorCount = Object.keys(errors).length;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit?.(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate {...props}>
      {/* Form status announcements */}
      <div aria-live="polite" className="sr-only">
        {isSubmitting && "Form is being submitted"}
        {successMessage && successMessage}
        {errorCount > 0 && `Form has ${errorCount} error${errorCount > 1 ? 's' : ''}`}
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="alert alert-success mb-4" role="alert">
          {successMessage}
        </div>
      )}
      
      {/* Error summary */}
      {errorCount > 0 && (
        <div className="alert alert-danger mb-4" role="alert">
          <h3 className="text-lg font-semibold mb-2">Please correct the following errors:</h3>
          <ul className="list-disc list-inside">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <a href={`#${field}`} className="text-danger underline">
                  {error}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {children}
    </form>
  );
};