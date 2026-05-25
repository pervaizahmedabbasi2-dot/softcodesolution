// File: src/app/scsbot-ai/scsbot-ai.component.ts

/*
====================================================
SCSBOOT AI ULTRA FRONTEND CORE
Angular 20+ Standalone + Tailwind v4
Smart Parsing + Live Scrolling + Auto Sync
====================================================
*/

import {
    Component,
    signal,
    computed,
    inject,
    ElementRef,
    ViewChild,
    AfterViewChecked,
    OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScsbotAiService } from './scsbot-ai.service';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
}

interface BackendMemoryMessage {
    role: string;
    content: string;
}

@Component({
    selector: 'app-scsbot-ai',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './scsbot-ai.component.html'
})
export class ScsbotAiComponent implements OnInit, AfterViewChecked {

    @ViewChild('chatContainer')
    private chatContainer!: ElementRef<HTMLElement>;

    private ai = inject(ScsbotAiService);

    sidebarOpen = signal(true);
    darkMode = signal(true);
    memoryNotice = signal('');
    importedChatActive = signal(false);
    lastImportedCount = signal(0);

    userInput = signal('');

    messages = signal<Message[]>([
        {
            role: 'assistant',
            content: `🚀 SCSBOOT-AI Ultra Core Online\n\nReady for:\n• Enterprise Systems\n• Angular + Tailwind\n• Go + Wails\n• AI Architecture\n• Premium UI/UX`,
            timestamp: new Date().toLocaleTimeString()
        }
    ]);

    isStreamingLocal = signal(false);

    isLoading = computed(() => this.ai.isTyping() || this.isStreamingLocal());

    models = signal(this.ai.getModels());
    selectedModel = signal(this.ai.activeModel());
    totalMessages = computed(() => this.messages().length);

    ngOnInit() {
        this.restoreLocalBackup();
    }

    // ==========================================
    // 1. SMART PARSER (Gemini Style Code Blocks)
    // ==========================================
    parseMessageContent(content: string): Array<{ type: 'text' | 'code', language?: string, content: string }> {
        const parts: Array<{ type: 'text' | 'code', language?: string, content: string }> = [];
        const regex = /```([\w-]+)?\n([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: content.slice(lastIndex, match.index)
                });
            }
            parts.push({
                type: 'code',
                language: match[1] || 'code',
                content: match[2].trim()
            });
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < content.length) {
            parts.push({
                type: 'text',
                content: content.slice(lastIndex)
            });
        }
        return parts;
    }

    copyMessage(content: string) {
        navigator.clipboard.writeText(content).then(() => {
            this.memoryNotice.set('📋 Copied successfully!');
            setTimeout(() => this.memoryNotice.set(''), 3000);
        }).catch(err => console.error('Copy failed', err));
    }

    // ==========================================
    // 2. LIVE SCROLLING & TYPEWRITER ENGINE
    // ==========================================
    private streamText(fullText: string): Promise<void> {
        return new Promise(resolve => {
            this.isStreamingLocal.set(true);
            let currentIndex = 0;
            const chunkSize = 5; // Speed setting
            const delay = 15;

            const interval = setInterval(() => {
                if (currentIndex < fullText.length) {
                    const chunk = fullText.slice(currentIndex, currentIndex + chunkSize);
                    currentIndex += chunkSize;

                    this.messages.update(msgs => {
                        const newMsgs = [...msgs];
                        const lastIndex = newMsgs.length - 1;
                        newMsgs[lastIndex] = {
                            ...newMsgs[lastIndex],
                            content: newMsgs[lastIndex].content + chunk
                        };
                        return newMsgs;
                    });

                    // LIVE SCROLL ENGINE: Type hote hue neeche drag karega
                    this.scrollToBottom();
                } else {
                    clearInterval(interval);
                    this.isStreamingLocal.set(false);
                    this.saveLocalBackup();
                    this.scrollToBottom();
                    resolve();
                }
            }, delay);
        });
    }

    async sendMessage() {
        const text = this.userInput().trim();

        if (!text || this.isLoading()) return;

        this.pushMessage({
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString()
        });

        this.userInput.set('');

        try {
            await this.setModel(this.selectedModel());

            const response = await this.ai.sendMessage(text);

            // ==========================================
            // 3. AUTO MODEL SYNC (Updates Dropdown)
            // ==========================================
            this.selectedModel.set(this.ai.activeModel());

            this.messages.update(msgs => [
                ...msgs,
                { role: 'assistant', content: '', timestamp: new Date().toLocaleTimeString() }
            ]);

            await this.streamText(response);

            this.memoryNotice.set('✅ Response saved in project memory.');
            setTimeout(() => this.memoryNotice.set(''), 3000);
        } catch (error) {
            console.error('SCSBOOT Error:', error);

            this.pushMessage({
                role: 'assistant',
                content: `❌ AI Engine Error\n\nYour chat is still saved locally.`,
                timestamp: new Date().toLocaleTimeString()
            });

            this.memoryNotice.set('⚠️ Network/API issue. Local backup safe hai.');
            setTimeout(() => this.memoryNotice.set(''), 3000);
        }
    }

    async setModel(model: string): Promise<void> {
        if (!model) return;
        this.selectedModel.set(model);
        try {
            await Promise.resolve(this.ai.setModel(model));
            this.memoryNotice.set(`✅ Active model set: ${model.split('/').pop()}`);
            setTimeout(() => this.memoryNotice.set(''), 3000);
        } catch (error) {
            console.error('Set model error:', error);
            this.memoryNotice.set('⚠️ Model set failed.');
        }
    }

    async clearChat() {
        try {
            await Promise.resolve(this.ai.clearMemory());
        } catch (error) {
            console.error('Clear memory error:', error);
        }

        this.messages.set([
            {
                role: 'assistant',
                content: '🧠 Memory Cleared Successfully',
                timestamp: new Date().toLocaleTimeString()
            }
        ]);

        this.importedChatActive.set(false);
        this.lastImportedCount.set(0);
        this.memoryNotice.set('🧠 Full memory cleared.');
        setTimeout(() => this.memoryNotice.set(''), 3000);
        this.saveLocalBackup();
    }

    async exportChat() {
        try {
            const backendData = await this.safeExportMemory();

            const finalData = this.isValidJsonArray(backendData)
                ? backendData
                : JSON.stringify(this.toBackendMemory(this.messages()), null, 2);

            this.downloadJson(finalData, 'scsbot-full-chat-memory.json');

            this.memoryNotice.set('📦 Full chat memory exported successfully.');
        } catch (error) {
            console.error('Export error:', error);

            const fallbackData = JSON.stringify(
                this.toBackendMemory(this.messages()),
                null,
                2
            );

            this.downloadJson(fallbackData, 'scsbot-local-chat-backup.json');

            this.memoryNotice.set('⚠️ Backend export failed. Local chat backup exported.');
        }
        setTimeout(() => this.memoryNotice.set(''), 3000);
    }

    async importChat(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        try {
            const raw = await file.text();
            const parsed = JSON.parse(raw);
            const importedMessages = this.normalizeImportedMessages(parsed);

            if (!importedMessages.length) {
                throw new Error('No valid messages found in imported file.');
            }

            const backendMemory = JSON.stringify(
                this.toBackendMemory(importedMessages),
                null,
                2
            );

            await this.safeImportMemory(backendMemory);

            this.messages.set(
                importedMessages.map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp || new Date().toLocaleTimeString()
                }))
            );

            this.importedChatActive.set(true);
            this.lastImportedCount.set(importedMessages.length);
            this.memoryNotice.set(`📥 Imported ${importedMessages.length} messages.`);
            setTimeout(() => this.memoryNotice.set(''), 3000);

            this.saveLocalBackup();
            await this.summarizeMemory(true);
        } catch (error) {
            console.error('Import error:', error);

            this.pushMessage({
                role: 'assistant',
                content: `❌ Import Failed\n\nJSON file valid nahi hai.`,
                timestamp: new Date().toLocaleTimeString()
            });

            this.memoryNotice.set('❌ Import failed.');
        } finally {
            input.value = '';
        }
    }

    async continueImportedChat() {
        const prompt = `Continue my project from the imported full chat memory.\n\nRespond in Roman Urdu + simple English like my style.`;
        await this.runProjectMemoryTask(prompt, '🔁 Continuing project...');
    }

    async summarizeMemory(silent = false) {
        const prompt = `Analyze the complete imported chat/project memory.\n\nKeep it concise but complete. Respond in Roman Urdu + simple English.`;

        if (!silent) {
            await this.runProjectMemoryTask(prompt, '🧩 Summarizing project...');
            return;
        }

        try {
            const response = await this.ai.sendMessage(prompt);
            this.messages.update(msgs => [
                ...msgs,
                { role: 'assistant', content: `🧩 Project Memory Adapted\n\n`, timestamp: new Date().toLocaleTimeString() }
            ]);
            await this.streamText(response);

            this.memoryNotice.set('🧩 Imported chat summarized.');
            setTimeout(() => this.memoryNotice.set(''), 3000);
        } catch (error) {
            this.memoryNotice.set('⚠️ Summary failed, continue later.');
        }
    }

    async quickPrompt(prompt: string) {
        this.userInput.set(prompt);
        await this.sendMessage();
    }

    private async runProjectMemoryTask(prompt: string, notice: string) {
        if (this.isLoading()) return;

        this.memoryNotice.set(notice);
        this.pushMessage({
            role: 'user',
            content: prompt,
            timestamp: new Date().toLocaleTimeString()
        });

        try {
            await this.setModel(this.selectedModel());
            const response = await this.ai.sendMessage(prompt);

            this.messages.update(msgs => [
                ...msgs,
                { role: 'assistant', content: '', timestamp: new Date().toLocaleTimeString() }
            ]);
            await this.streamText(response);

            this.memoryNotice.set('✅ Task completed.');
            setTimeout(() => this.memoryNotice.set(''), 3000);
        } catch (error) {
            this.pushMessage({
                role: 'assistant',
                content: '❌ Task failed. Chat backup safe hai.',
                timestamp: new Date().toLocaleTimeString()
            });
            this.memoryNotice.set('⚠️ Task failed.');
        }
    }

    private saveLocalBackup() {
        try {
            localStorage.setItem('scsbot-local-chat-backup', JSON.stringify(this.messages()));
        } catch { }
    }

    private restoreLocalBackup() {
        try {
            const raw = localStorage.getItem('scsbot-local-chat-backup');
            if (!raw) return;

            const parsed = JSON.parse(raw);
            const restored = this.normalizeImportedMessages(parsed);

            if (!restored.length) return;

            this.messages.set(restored);
            this.lastImportedCount.set(restored.length);
            this.memoryNotice.set('💾 Local backup restored.');
            setTimeout(() => this.memoryNotice.set(''), 3000);

            const backendMemory = JSON.stringify(this.toBackendMemory(restored), null, 2);
            this.safeImportMemory(backendMemory).catch(() => { });
        } catch { }
    }

    private async safeExportMemory(): Promise<string> {
        const service = this.ai as unknown as { exportMemory?: () => string | Promise<string>; };
        if (typeof service.exportMemory === 'function') {
            return await Promise.resolve(service.exportMemory());
        }
        return JSON.stringify(this.toBackendMemory(this.messages()), null, 2);
    }

    private async safeImportMemory(data: string): Promise<void> {
        const service = this.ai as unknown as { importMemory?: (data: string) => void | Promise<void>; };
        if (typeof service.importMemory === 'function') {
            await Promise.resolve(service.importMemory(data));
        }
    }

    private normalizeImportedMessages(parsed: unknown): Message[] {
        const source = Array.isArray(parsed) ? parsed : this.extractMessagesFromObject(parsed);
        return source.map((item: any) => {
            const role = this.normalizeRole(item?.role);
            const content = String(item?.content ?? item?.message ?? item?.text ?? '').trim();
            const timestamp = item?.timestamp ? String(item.timestamp) : new Date().toLocaleTimeString();
            return { role, content, timestamp } as Message;
        }).filter(msg => !!msg.content && (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system'));
    }

    private extractMessagesFromObject(parsed: unknown): any[] {
        if (parsed && typeof parsed === 'object') {
            const obj = parsed as any;
            if (Array.isArray(obj.memory)) return obj.memory;
            if (Array.isArray(obj.messages)) return obj.messages;
            if (Array.isArray(obj.chat)) return obj.chat;
            if (Array.isArray(obj.data)) return obj.data;
        }
        return [];
    }

    private normalizeRole(role: unknown): 'user' | 'assistant' | 'system' {
        const value = String(role || '').toLowerCase().trim();
        if (value === 'user') return 'user';
        if (value === 'system') return 'system';
        return 'assistant';
    }

    private toBackendMemory(messages: Message[]): BackendMemoryMessage[] {
        return messages.filter(msg => msg.content && msg.content.trim()).map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    private isValidJsonArray(value: string): boolean {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed);
        } catch { return false; }
    }

    private downloadJson(data: string, fileName: string) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    }

    toggleSidebar() {
        this.sidebarOpen.update(value => !value);
    }

    toggleDarkMode() {
        this.darkMode.update(value => !value);
        document.documentElement.classList.toggle('dark', this.darkMode());
    }

    ngAfterViewChecked() {
        // Keeps scrolling lock intact
        if (!this.isStreamingLocal()) {
            this.scrollToBottom();
        }
    }

    private scrollToBottom() {
        try {
            this.chatContainer.nativeElement.scrollTo({
                top: this.chatContainer.nativeElement.scrollHeight,
                behavior: 'smooth'
            });
        } catch { }
    }

    handleEnter(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    private pushMessage(message: Message) {
        this.messages.update(msgs => [...msgs, message]);
        this.saveLocalBackup();
    }
}