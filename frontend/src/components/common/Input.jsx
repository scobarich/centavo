import React from 'react';

/**
 * Componente de Campo de Texto reutilizable del sistema de diseño.
 */
export function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  className = '',
  ...props
}) {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    width: '100%',
  };

  const labelStyle = {
    fontSize: 'var(--font-size-sm)',
    fontWeight: '500',
    color: 'var(--color-text-secondary)',
  };

  const inputStyle = {
    padding: '0.625rem 0.875rem',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
    fontSize: 'var(--font-size-base)',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s ease-in-out',
  };

  const errorStyle = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-danger)',
    marginTop: '2px',
  };

  return (
    <div style={containerStyle} className={`input-group ${className}`}>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={inputStyle}
        {...props}
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
}
