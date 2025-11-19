// Core type definitions for dustCMS

export interface SuperAdmin {
  username: string;
  password_hash: string;
}

export interface Tenant {
  slug: string;
  name: string;
  password: string; // hashed password for authentication
  password_plaintext?: string; // plaintext for admin access only
  created_at: number;
}

export interface Session {
  token: string;
  username: string;
  created_at: number;
}

export type FieldType = 'text' | 'textarea' | 'markdown' | 'image' | 'date' | 'link' | 'badges';

export interface Field {
  name: string;
  type: FieldType;
  required?: boolean;
  label?: string;
  maxLength?: number; // for text fields
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
