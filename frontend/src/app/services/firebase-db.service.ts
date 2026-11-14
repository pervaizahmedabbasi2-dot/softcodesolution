import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, getDocFromServer, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0477585150",
  appId: "1:327041716084:web:562bf6cd48152e60732621",
  apiKey: "AIzaSyBcwse5MyMwpvLLm8Dqn3xSbyPpARuTcG4",
  authDomain: "gen-lang-client-0477585150.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-softcodesolution-c56ff68f-4952-49f4-8e29-e87461d133f9",
  storageBucket: "gen-lang-client-0477585150.firebasestorage.app",
  messagingSenderId: "327041716084"
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseDbService {
  private db: Firestore | null = null;
  public isConnected: boolean = false;
  public lastError: string | null = null;

  constructor() {
    this.initFirebase();
  }

  private initFirebase(): void {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      this.db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      this.isConnected = true;
      void this.testConnection();
    } catch (err) {
      console.warn('Firebase init fallback to local:', err);
      this.isConnected = false;
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.db) return;
    try {
      await getDocFromServer(doc(this.db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        this.isConnected = false;
        this.lastError = 'Firestore client offline';
      }
    }
  }

  private resolveActiveTenantId(tenantId?: string): string {
    if (tenantId && tenantId.trim() && tenantId !== 'alhuda_academy') {
      return tenantId.trim();
    }
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('user_data') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        const tid = parsed?.tenantId || parsed?.tenant_id;
        if (tid && String(tid).trim()) return String(tid).trim();
      }
    } catch {}
    return 'tenant-root-platform';
  }

  private handleFirestoreError(error: unknown, operationType: OperationType, path: string): void {
    const errMessage = error instanceof Error ? error.message : String(error);
    this.lastError = `${operationType} on ${path}: ${errMessage}`;
    console.warn('[Firestore Service]', this.lastError);
  }

  async saveSchoolData(tenantId: string, data: any): Promise<boolean> {
    const resolvedTenant = this.resolveActiveTenantId(tenantId);
    if (!this.db) return false;
    const path = `school_workspaces/${resolvedTenant}`;
    try {
      const schoolDocRef = doc(this.db, 'school_workspaces', resolvedTenant);
      await setDoc(schoolDocRef, {
        ...data,
        tenant_id: resolvedTenant,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      this.handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    }
  }

  async loadSchoolData(tenantId: string): Promise<any | null> {
    const resolvedTenant = this.resolveActiveTenantId(tenantId);
    if (!this.db) return null;
    const path = `school_workspaces/${resolvedTenant}`;
    try {
      const schoolDocRef = doc(this.db, 'school_workspaces', resolvedTenant);
      const snap = await getDoc(schoolDocRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      this.handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  }
}
