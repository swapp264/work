import { Claim, CAPA, Config, DEFAULT_CONFIG, ClaimEvent, ClaimDocument, ClaimPartImage } from './domain';
import { demoClaims, demoCAPA, demoClaimEvents, demoClaimDocuments, demoClaimPartImages } from './seed';

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

  // Part-wise Image Attachments
  getClaimPartImages(claimId: string, partId?: string): Promise<ClaimPartImage[]>;
  addClaimPartImage(image: ClaimPartImage): Promise<void>;
  deleteClaimPartImage(imageId: string): Promise<void>;
  deleteClaimPartImagesByPart(claimId: string, partId: string): Promise<void>;
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
    // Ensure part images from tsc.claim_part_images are populated in parts
    const partImages = await this.getClaimPartImages('');
    return x.map(c => {
      if (c.parts && c.parts.length > 0) {
        const claimImages = partImages.filter(img => img.claimId === c.id);
        const updatedParts = c.parts.map(p => {
          const imgsForPart = claimImages.filter(img => img.partId === p.id);
          if (imgsForPart.length > 0 && (!p.images || p.images.length === 0)) {
            return { ...p, images: imgsForPart };
          }
          return p;
        });
        return { ...c, parts: updatedParts };
      }
      return c;
    });
  }

  async saveClaim(c: Claim): Promise<void> {
    // Keep scalar fields in sync with primary part
    if (c.parts && c.parts.length > 0) {
      c.partNo = c.parts[0]?.partNo || c.partNo;
      c.description = c.parts[0]?.description || c.description;
      c.qty = c.parts.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);
    }

    const a = await this.claims();
    const i = a.findIndex(x => x.id === c.id);
    if (i < 0) {
      a.push(c);
    } else {
      a[i] = c;
    }
    localStorage.setItem('tsc.claims', JSON.stringify(a));

    // Also persist any images from c.parts
    if (c.parts) {
      for (const part of c.parts) {
        if (part.images && part.images.length > 0) {
          for (const img of part.images) {
            await this.addClaimPartImage(img);
          }
        }
      }
    }
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
    ['tsc.claims', 'tsc.capa', 'tsc.config', 'tsc.claim_events', 'tsc.claim_documents', 'tsc.claim_part_images'].forEach(k => {
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

  // Part-wise Image Attachment Repository Methods
  async getClaimPartImages(claimId: string, partId?: string): Promise<ClaimPartImage[]> {
    const all = get<ClaimPartImage[]>('tsc.claim_part_images', []);
    const list = !all.length ? demoClaimPartImages : all;
    if (!claimId) return list;
    return list.filter(img => img.claimId === claimId && (!partId || img.partId === partId));
  }

  async addClaimPartImage(image: ClaimPartImage): Promise<void> {
    const all = get<ClaimPartImage[]>('tsc.claim_part_images', []);
    const list = !all.length ? [...demoClaimPartImages] : all;
    const idx = list.findIndex(img => img.id === image.id);
    if (idx < 0) {
      list.push(image);
    } else {
      list[idx] = image;
    }
    localStorage.setItem('tsc.claim_part_images', JSON.stringify(list));

    // Also record in claim documents as a PART_IMAGE document item
    const docItem: ClaimDocument = {
      id: image.id,
      claimId: image.claimId,
      partId: image.partId,
      srNo: image.srNo,
      partNo: image.partNo,
      documentType: 'PART_IMAGE',
      documentNo: `IMG-P${image.srNo}-${image.partNo || 'PART'}`,
      documentDate: image.uploadedAt.substring(0, 10),
      fileName: image.fileName,
      fileUrl: image.fileUrl,
      uploadedBy: image.uploadedBy,
      uploadedAt: image.uploadedAt,
      fileSize: image.fileSize || '120 KB',
      remarks: image.remarks
    };
    await this.addClaimDocument(docItem);

    // Update in-memory / storage claims if present
    const claimsList = get<Claim[]>('tsc.claims', []);
    if (claimsList.length > 0) {
      const claim = claimsList.find(c => c.id === image.claimId);
      if (claim && claim.parts) {
        const part = claim.parts.find(p => p.id === image.partId);
        if (part) {
          if (!part.images) part.images = [];
          const imgIdx = part.images.findIndex(i => i.id === image.id);
          if (imgIdx < 0) {
            part.images.push(image);
          } else {
            part.images[imgIdx] = image;
          }
          localStorage.setItem('tsc.claims', JSON.stringify(claimsList));
        }
      }
    }
  }

  async deleteClaimPartImage(imageId: string): Promise<void> {
    const all = get<ClaimPartImage[]>('tsc.claim_part_images', []);
    const list = !all.length ? [...demoClaimPartImages] : all;
    const filtered = list.filter(img => img.id !== imageId);
    localStorage.setItem('tsc.claim_part_images', JSON.stringify(filtered));

    // Remove from claim documents
    const docs = get<ClaimDocument[]>('tsc.claim_documents', []);
    if (docs.length > 0) {
      const filteredDocs = docs.filter(d => d.id !== imageId);
      localStorage.setItem('tsc.claim_documents', JSON.stringify(filteredDocs));
    }

    // Remove from claim parts
    const claimsList = get<Claim[]>('tsc.claims', []);
    if (claimsList.length > 0) {
      let changed = false;
      claimsList.forEach(c => {
        if (c.parts) {
          c.parts.forEach(p => {
            if (p.images) {
              const prevLen = p.images.length;
              p.images = p.images.filter(i => i.id !== imageId);
              if (p.images.length !== prevLen) changed = true;
            }
          });
        }
      });
      if (changed) {
        localStorage.setItem('tsc.claims', JSON.stringify(claimsList));
      }
    }
  }

  async deleteClaimPartImagesByPart(claimId: string, partId: string): Promise<void> {
    const all = get<ClaimPartImage[]>('tsc.claim_part_images', []);
    const list = !all.length ? [...demoClaimPartImages] : all;
    const filtered = list.filter(img => !(img.claimId === claimId && img.partId === partId));
    localStorage.setItem('tsc.claim_part_images', JSON.stringify(filtered));

    // Remove from claim documents
    const docs = get<ClaimDocument[]>('tsc.claim_documents', []);
    if (docs.length > 0) {
      const filteredDocs = docs.filter(d => !(d.claimId === claimId && d.partId === partId));
      localStorage.setItem('tsc.claim_documents', JSON.stringify(filteredDocs));
    }
  }
}

