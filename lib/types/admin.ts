export type ResourceFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'boolean'
  | 'date'
  | 'image'
  | 'email'
  | 'password'
  | 'readonly';

export type SelectOption = {
  label: string;
  value: string | number;
};

export interface ResourceField {
  name: string;
  label: string;
  type: ResourceFieldType | string;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: SelectOption[];
  autoSlugFrom?: string;
  preview?: boolean;
  readOnly?: boolean;
}

export type ResourceAction<T> = {
  label: string;
  tone?: 'primary' | 'secondary' | 'danger' | string;
  onClick: (item: T) => Promise<void> | void;
};

export type AdminResourceConfig<T extends Record<string, any>> = {
  title: string;
  singular: string;
  idKey?: keyof T | string;
  description?: string;
  list: () => Promise<T[]>;
  create?: (payload: any) => Promise<any>;
  update?: (id: any, payload: any) => Promise<any>;
  remove?: (id: any) => Promise<any>;
  actions?: ResourceAction<T>[];
  readOnly?: boolean;
  fields: ResourceField[];
  searchable?: boolean;
  pageSize?: number;
};