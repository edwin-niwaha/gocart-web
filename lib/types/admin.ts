export type ResourceFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'json'
  | 'date'
  | 'select'
  | 'image';

export type SelectOption = {
  label: string;
  value: string | number;
};

export type ResourceField = {
  name: string;
  label: string;
  type: ResourceFieldType;
  placeholder?: string;
  helpText?: string;
  readOnly?: boolean;
  required?: boolean;

  // for select fields
  options?: SelectOption[];

  // for slug auto-generation
  autoSlugFrom?: string;

  // preview helpers
  preview?: boolean;
};

export type ResourceAction<T> = {
  label: string;
  tone?: 'primary' | 'secondary' | 'danger';
  onClick: (item: T) => Promise<void> | void;
};

export type AdminResourceConfig<T extends Record<string, any>> = {
  title: string;
  singular: string;
  idKey?: keyof T | string;
  description?: string;
  list: () => Promise<T[]>;
  create?: (payload: Record<string, any>) => Promise<any>;
  update?: (id: string | number, payload: Record<string, any>) => Promise<any>;
  remove?: (id: string | number) => Promise<any>;
  actions?: ResourceAction<T>[];
  readOnly?: boolean;
  fields: ResourceField[];

  searchable?: boolean;
  pageSize?: number;
};