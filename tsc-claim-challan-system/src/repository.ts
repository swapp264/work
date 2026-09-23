import { Claim, CAPA, Config, DEFAULT_CONFIG, ClaimEvent, ClaimDocument } from './domain';
import { demoClaims, demoCAPA, demoClaimEvents, demoClaimDocuments } from './seed';

export interface Repository {
  claims(): Promise<Claim[]>;
  saveClaim(c: Claim): Promise<void>;
  capas(): Promise<CAPA[]>;
  saveCAPA(c: CAPA): Promise<void>;
  config(): Promise<Config>;
  saveConfig(c: Config): Promise<void>;
  reset(): Promise<void>;

  // Claim Ledger & Documents Extensions
  getClaimEvents(claimId: string): Promise<ClaimEvent[]>;
  addClaimEvent(event: ClaimEvent): Promise<void>;
  getClaimDocuments(claimId: string): Promise<ClaimDocument[]>;
  addClaimDocument(doc: ClaimDocument): Promise<void>;
  getClaimDocument(documentId: string): Promise<ClaimDocument | null>;
}

const get = <T>(k: string, d: T): T => {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null') ?? d;
  } catch {
    return d;
  }
};

export class MockRepository implements Repository {
  async claims(): Promise<Claim[]> {
    const x = get<Claim[]>('tsc.claims', []);
    if (!x.length) {
      localStorage.setItem('tsc.claims', JSON.stringify(demoClaims));
      return demoClaims;
    }
    return x;
  }

  async saveClaim(c: Claim): Promise<void> {
    const a = await this.claims();
    const i = a.findIndex(x => x.id === c.id);
    if (i < 0) {
      a.push(c);
    } else {
      a[i] = c;
    }
    localStorage.setItem('tsc.claims', JSON.stringify(a));
  }

  async capas(): Promise<CAPA[]> {
    const x = get<CAPA[]>('tsc.capa', []);
    if (!x.length) {
      localStorage.setItem('tsc.capa', JSON.stringify(demoCAPA));
      return demoCAPA;
    }
    return x;
  }

  async saveCAPA(c: CAPA): Promise<void> {
    const a = await this.capas();
    const i = a.findIndex(x => x.id === c.id);
    if (i < 0) {
      a.push(c);
    } else {
      a[i] = c;
    }
    localStorage.setItem('tsc.capa', JSON.stringify(a));
  }

  async config(): Promise<Config> {
    return get<Config>('tsc.config', DEFAULT_CONFIG);
  }

  async saveConfig(c: Config): Promise<void> {
    localStorage.setItem('tsc.config', JSON.stringify(c));
  }

  async reset(): Promise<void> {
    ['tsc.claims', 'tsc.capa', 'tsc.config', 'tsc.claim_events', 'tsc.claim_documents'].forEach(k => {
      localStorage.removeItem(k);
    });
  }

  async getClaimEvents(claimId: string): Promise<ClaimEvent[]> {
    const all = get<ClaimEvent[]>('tsc.claim_events', []);
    if (!all.length) {
      localStorage.setItem('tsc.claim_events', JSON.stringify(demoClaimEvents));
      return demoClaimEvents.filter(e => e.claimId === claimId);
    }
    return all.filter(e => e.claimId === claimId);
  }

  async addClaimEvent(event: ClaimEvent): Promise<void> {
    const all = get<ClaimEvent[]>('tsc.claim_events', []);
    const list = !all.length ? [...demoClaimEvents] : all;
    const idx = list.findIndex(e => e.id === event.id);
    if (idx < 0) {
      list.push(event);
    } else {
      list[idx] = event;
    }
    localStorage.setItem('tsc.claim_events', JSON.stringify(list));
  }

  async getClaimDocuments(claimId: string): Promise<ClaimDocument[]> {
    const all = get<ClaimDocument[]>('tsc.claim_documents', []);
    if (!all.length) {
      localStorage.setItem('tsc.claim_documents', JSON.stringify(demoClaimDocuments));
      return demoClaimDocuments.filter(d => d.claimId === claimId);
    }
    return all.filter(d => d.claimId === claimId);
  }

  async addClaimDocument(doc: ClaimDocument): Promise<void> {
    const all = get<ClaimDocument[]>('tsc.claim_documents', []);
    const list = !all.length ? [...demoClaimDocuments] : all;
    const idx = list.findIndex(d => d.id === doc.id);
    if (idx < 0) {
      list.push(doc);
    } else {
      list[idx] = doc;
    }
    localStorage.setItem('tsc.claim_documents', JSON.stringify(list));
  }

  async getClaimDocument(documentId: string): Promise<ClaimDocument | null> {
    const all = get<ClaimDocument[]>('tsc.claim_documents', []);
    const list = !all.length ? demoClaimDocuments : all;
    return list.find(d => d.id === documentId) || null;
  }
}
