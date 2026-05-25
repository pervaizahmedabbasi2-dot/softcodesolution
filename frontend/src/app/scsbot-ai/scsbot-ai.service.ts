// File: src/app/scsbot-ai/scsbot-ai.service.ts

/*
====================================================
SCSBOOT AI SERVICE
Angular + Wails Bridge
Enterprise Secure + Auto Sync Mode
====================================================
*/

import { Injectable, signal } from '@angular/core';

import {
    AskSCSBOT,
    SetModel,
    GetModels,
    ClearMemory,
    ExportMemory,
    ImportMemory
} from '../../../wailsjs/go/main/App';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

@Injectable({
    providedIn: 'root'
})
export class ScsbotAiService {

    isTyping = signal(false);

    // Default brain setting
    activeModel = signal('deepseek/deepseek-chat');

    private modelsCache: string[] = [
        'deepseek/deepseek-chat',
        'qwen/qwen-2.5-72b-instruct',
        'meta-llama/llama-3.3-70b-instruct',
        'google/gemini-2.0-flash-exp:free'
    ];

    constructor() {
        this.refreshModels();
    }

    // ==========================================
    // 1. ENTERPRISE CORE SENDER
    // ==========================================
    async sendMessage(prompt: string): Promise<string> {
        const cleanPrompt = prompt.trim();

        if (!cleanPrompt) {
            return '⚠️ Please type a command.';
        }

        this.isTyping.set(true);

        try {
            if (typeof AskSCSBOT !== 'function') {
                throw new Error(
                    'AskSCSBOT binding not found. Ensure Wails bindings are generated properly.'
                );
            }

            // Sync model before asking to ensure OpenRouter logic is aligned
            await this.syncCurrentModel();

            // Calling Go Backend
            const rawResponse = await AskSCSBOT(cleanPrompt);

            if (!rawResponse) {
                return '⚠️ Core returned an empty response. Check backend logs.';
            }

            // Apply Security Protocol (Sanitization)
            const secureResponse = this.sanitizeResponse(rawResponse);

            return secureResponse;

        } catch (error) {
            const detail = this.formatError(error);
            console.error('SCSBOT Wails Bridge Error:', error);

            return `❌ Core Engine Execution Error\n\nWails bridge failed to communicate with Go Backend.\n\nDETAIL:\n${detail}\n\nFIX:\n1. Stop 'wails dev'\n2. Run 'go mod tidy'\n3. Restart 'wails dev'\n\nMemory is preserved locally.`;
        } finally {
            this.isTyping.set(false);
        }
    }

    // ==========================================
    // 2. MODEL MANAGEMENT & AUTO SYNC
    // ==========================================
    getModels(): string[] {
        return [...this.modelsCache];
    }

    async refreshModels(): Promise<void> {
        try {
            if (typeof GetModels !== 'function') return;

            const models = await GetModels();

            if (Array.isArray(models) && models.length > 0) {
                this.modelsCache = models.filter(Boolean);

                if (!this.modelsCache.includes(this.activeModel())) {
                    this.activeModel.set(this.modelsCache[0]);
                }
            }
        } catch (error) {
            console.warn('GetModels failed. Utilizing fallback local cache.', error);
        }
    }

    async setModel(model: string): Promise<void> {
        const cleanModel = model.trim();

        if (!cleanModel) return;

        this.activeModel.set(cleanModel);

        try {
            if (typeof SetModel === 'function') {
                await SetModel(cleanModel);
            }
        } catch (error) {
            console.error('SetModel protocol failed:', error);
        }
    }

    // This ensures UI knows what model backend actually used if auto-switched
    private async syncCurrentModel() {
        try {
            // Note: If you ever implement GetActiveModel in Wails, it will hook here perfectly
            const winApp = (window as any).go?.main?.App;
            if (winApp && typeof winApp.GetActiveModel === 'function') {
                const currentFromBackend = await winApp.GetActiveModel();
                if (currentFromBackend && this.modelsCache.includes(currentFromBackend)) {
                    this.activeModel.set(currentFromBackend);
                }
            }
        } catch (err) {
            // Silent catch to prevent breaking execution
        }
    }

    // ==========================================
    // 3. MEMORY OPERATIONS
    // ==========================================
    async clearMemory(): Promise<void> {
        try {
            if (typeof ClearMemory === 'function') {
                await ClearMemory();
            }
        } catch (error) {
            console.error('ClearMemory execution failed:', error);
        }
    }

    async exportMemory(): Promise<string> {
        try {
            if (typeof ExportMemory === 'function') {
                const data = await ExportMemory();
                return data || '[]';
            }
            return '[]';
        } catch (error) {
            console.error('ExportMemory execution failed:', error);
            return '[]';
        }
    }

    async importMemory(memory: string | ChatMessage[]): Promise<void> {
        try {
            const data =
                typeof memory === 'string'
                    ? memory
                    : JSON.stringify(memory, null, 2);

            if (typeof ImportMemory === 'function') {
                await ImportMemory(data);
            }
        } catch (error) {
            console.error('ImportMemory execution failed:', error);
            throw error;
        }
    }

    // ==========================================
    // 4. SECURITY & UTILITIES
    // ==========================================

    // Prevents rogue scripts from breaking Angular parsing
    private sanitizeResponse(text: string): string {
        if (!text) return '';
        // Basic escaping of raw <script> tags if mistakenly generated by AI
        return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            '\n[Security: Malicious Script Blocked by SCS-Core]\n');
    }

    private formatError(error: unknown): string {
        if (!error) return 'Unknown architectural error';
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;

        try {
            return JSON.stringify(error, null, 2);
        } catch {
            return String(error);
        }
    }
}