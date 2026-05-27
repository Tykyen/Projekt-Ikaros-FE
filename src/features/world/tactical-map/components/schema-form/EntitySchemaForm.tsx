/**
 * 10.2d-prep-A C7 — generic form renderer pro SystemEntitySchema.
 *
 * Iteruje schema.sections → fields → per type vybírá field komponentu z C6.
 * Value je flat dot-path object (`{ 'health.max': 10, armor: 0, ... }`).
 * Konzument předává errors map (`{ 'health.max': 'required' }`) pro inline
 * validation feedback.
 *
 * Plán: docs/arch/phase-10/plan-10.2d-prep-A.md C7.
 */
import type { SchemaField, SystemEntitySchema } from '../../schemas/types';
import { NumberField } from './fields/NumberField';
import { TextField } from './fields/TextField';
import { EnumField } from './fields/EnumField';
import { BooleanField } from './fields/BooleanField';
import { ListField } from './fields/ListField';
import { ComputedField } from './fields/ComputedField';
import styles from './EntitySchemaForm.module.css';

interface Props {
  schema: SystemEntitySchema;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function EntitySchemaForm({
  schema,
  value,
  onChange,
  errors,
  disabled,
}: Props): React.ReactElement {
  const handleFieldChange = (key: string, fieldValue: unknown): void => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <div className={styles.form}>
      {schema.sections.map((section) => (
        <section key={section.key} className={styles.section}>
          {section.label && (
            <h4 className={styles.sectionTitle}>{section.label}</h4>
          )}
          <div
            className={styles.fieldsGrid}
            data-section-key={section.key}
            data-field-count={section.fields.length}
          >
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={value[field.key]}
                allValues={value}
                onChange={(v) => handleFieldChange(field.key, v)}
                error={errors?.[field.key]}
                disabled={disabled}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface FieldRendererProps {
  field: SchemaField;
  value: unknown;
  allValues: Record<string, unknown>;
  onChange: (next: unknown) => void;
  error?: string;
  disabled?: boolean;
}

function FieldRenderer({
  field,
  value,
  allValues,
  onChange,
  error,
  disabled,
}: FieldRendererProps): React.ReactElement | null {
  switch (field.type) {
    case 'number':
      return (
        <NumberField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'string':
      return (
        <TextField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'enum':
      return (
        <EnumField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          disabled={disabled}
        />
      );
    case 'boolean':
      return (
        <BooleanField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case 'list':
      return (
        <ListField
          field={field}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      );
    case 'computed':
      return <ComputedField field={field} context={allValues} />;
    default:
      return null;
  }
}
