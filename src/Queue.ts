import {Message} from "./lib/Database";

export class Queue {
    private messages: Message[] = [];
    private pendingConfirmations = new Set<string>();
    private keyLocks = new Map<string, boolean>();
    private messageRegistry = new Map<string, string>(); // messageId -> key
    private globalLock = false;

    Enqueue = (message: Message) => {
        this.messages.push(message);
    };

    Dequeue = (workerId: number): Message | undefined => {
        while (this.globalLock) {
        }
        this.globalLock = true;
        try {
            for (let i = 0; i < this.messages.length; i++) {
                const msg = this.messages[i];

                if (this.pendingConfirmations.has(msg.id)) continue;
                if (this.keyLocks.get(msg.key)) continue;

                this.keyLocks.set(msg.key, true);
                this.messageRegistry.set(msg.id, msg.key);
                this.messages.splice(i, 1);
                return msg;
            }
            return undefined;
        } finally {
            this.globalLock = false;
        }
    };

    Confirm = (workerId: number, messageId: string) => {
        while (this.globalLock) {
        }
        this.globalLock = true;
        try {
            const key = this.messageRegistry.get(messageId);
            if (key) {
                this.keyLocks.delete(key);
                this.messageRegistry.delete(messageId);
            }
            this.pendingConfirmations.add(messageId);
            setTimeout(() => this.pendingConfirmations.delete(messageId), 150);
        } finally {
            this.globalLock = false;
        }
    };

    Size = () => this.messages.length;
}