// Core type definitions for dustCMS

export interface SuperAdmin {
  email: string;
  password_hash: string;
}

export interface Tenant {
  slug: string;
  name: string;
  password: string; // plaintext for clients
  created_at: number;
}

export interface Session {
  token: string;
  email: string;
  created_at: number;
}

export type FieldType = 'text' | 'textarea' | 'markdown' | 'image' | 'date' | 'link';

export interface Field {
  name: string;
  type: FieldType;
  required?: boolean;
  label?: string;
}

export interface ContentModel {
  slug: string;
  name: string;
  type: 'collection' | 'singleton';
  fields: Field[];
}

export interface ContentItem {
  id?: number;
  [key: string]: any;
}

export interface Config {
  port: number;
  baseDomain: string;
  sessionSecret: string;
  dataDir: string;
  nodeEnv: string;
}

export interface LinkField {
  url: string;
  text?: string;
}
