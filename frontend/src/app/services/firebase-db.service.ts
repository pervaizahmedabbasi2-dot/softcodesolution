import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0477585150",
  appId: "1:327041716084:web:562bf6cd48152e60732621",
  apiKey: "AIzaSyBcwse5MyMwpvLLm8Dqn3xSbyPpARuTcG4",
  authDomain: "gen-lang-client-0477585150.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-softcodesolution-c56ff68f-4952-49f4-8e29-e87461d133f9",
  storageBucket: "gen-lang-client-0477585150.firebasestorage.app",
  messagingSenderId: "327041716084"
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseDbService {
  private db: Firestore | null = null;
  public isConnected: boolean = false;

  constructor() {
    this.initFirebase();
  }

  private initFirebase(): void {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      this.db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      this.isConnected = true;
    } catch (err) {
      console.warn('Firebase init fallback to local:', err);
      this.isConnected = false;
    }
  }

  async saveSchoolData(tenantId: string, data: any): Promise<boolean> {
    if (!this.db) return false;
    try {
      const schoolDocRef = doc(this.db, 'school_workspaces', tenantId || 'alhuda_academy');
      await setDoc(schoolDocRef, {
        ...data,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error('Firestore save failed:', err);
      return false;
    }
  }

  async loadSchoolData(tenantId: string): Promise<any | null> {
    if (!this.db) return null;
    try {
      const schoolDocRef = doc(this.db, 'school_workspaces', tenantId || 'alhuda_academy');
      const snap = await getDoc(schoolDocRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      console.warn('Firestore load failed, falling back:', err);
      return null;
    }
  }
}
