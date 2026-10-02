export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  created_at?: string;
}

export interface Device {
  id: string;
  user_id: string;
  device_name: string;
  platform: string;
  last_seen: string;
  created_at: string;
}

export interface DocumentStructuredFields {
  title: string;
  status: 'draft' | 'in_review' | 'approved' | 'archived';
  description: string;
  content: string;
}

export interface DocumentRecord extends DocumentStructuredFields {
  id: string;
  owner_id: string;
  name: string;
  current_version: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  is_starred?: number;
}

export interface DocumentVersion extends DocumentStructuredFields {
  id: string;
  document_id: string;
  version_number: number;
  parent_version: number;
  device_id: string;
  change_id: string;
  created_by: string;
  created_at: string;
  merge_type?: 'direct' | 'auto_merged' | 'manual_resolution';
}

export interface ChangeRecord {
  change_id: string;
  document_id: string;
  device_id: string;
  base_version: number;
  payload_json: string;
  status: 'accepted' | 'conflict' | 'rejected';
  result_version?: number;
  processed_at: string;
}

export interface ConflictRecord {
  id: string;
  document_id: string;
  incoming_change_id: string;
  base_version: number;
  server_version: number;
  conflicting_fields: (keyof DocumentStructuredFields)[];
  server_state: DocumentStructuredFields;
  incoming_state: DocumentStructuredFields;
  base_state: DocumentStructuredFields;
  status: 'open' | 'resolved';
  resolution_version?: number;
  created_at: string;
}

export interface SubmitChangeRequest {
  changeId: string;
  deviceId: string;
  baseVersion: number;
  payload: Partial<DocumentStructuredFields>;
}

export interface SubmitChangeResponse {
  status: 'accepted' | 'conflict' | 'already_processed';
  documentId: string;
  version?: number;
  merged?: boolean;
  conflict?: ConflictRecord;
  document?: DocumentRecord;
  message?: string;
}

export interface ResolveConflictRequest {
  conflictId: string;
  resolvedFields: DocumentStructuredFields;
  deviceId: string;
}
