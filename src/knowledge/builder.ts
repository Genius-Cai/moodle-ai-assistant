import fs from 'fs';
import path from 'path';

export interface KnowledgeEntry {
  content: string;
  author: string;
  role: string;
  source: string;
  timestamp: number;
  link?: string;
  course: string;
}

export class KnowledgeBuilder {
  private storePath: string;
  private store: KnowledgeEntry[] = [];

  constructor(storePath: string = path.join(__dirname, 'store.json')) {
    this.storePath = storePath;
    this.loadStore();
  }

  private loadStore() {
    try {
      if (fs.existsSync(this.storePath)) {
        const data = fs.readFileSync(this.storePath, 'utf8');
        this.store = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading knowledge store:', error);
      this.store = [];
    }
  }

  private saveStore() {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.store, null, 2));
    } catch (error) {
      console.error('Error saving knowledge store:', error);
    }
  }

  addEntry(entry: KnowledgeEntry) {
    // Check for duplicates based on content and timestamp
    const isDuplicate = this.store.some(
      e => e.content === entry.content && e.timestamp === entry.timestamp
    );

    if (!isDuplicate) {
      this.store.push(entry);
      this.saveStore();
    }
  }

  search(query: string): KnowledgeEntry[] {
    const normalizedQuery = query.toLowerCase();
    return this.store.filter(entry =>
      entry.content.toLowerCase().includes(normalizedQuery)
    );
  }

  getAll(): KnowledgeEntry[] {
    return [...this.store];
  }
}