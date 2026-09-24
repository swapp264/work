import React, { useState, useRef } from 'react';
import { Claim, ClaimPart, ClaimPartImage } from '../domain';
import { 
  Package, Plus, Trash2, Camera, Eye, X, AlertCircle, 
  CheckCircle2, Image as ImageIcon, ZoomIn, Info 
} from 'lucide-react';

interface PartManagerProps {
  claim: Claim;
  parts: ClaimPart[];
  onChangeParts: (parts: ClaimPart[]) => void;
  onAddPartImage: (partId: string, image: ClaimPartImage) => Promise<void>;
  onDeletePartImage: (partId: string, imageId: string) => Promise<void>;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export function PartManager({
  claim,
  parts,
  onChangeParts,
  onAddPartImage,
  onDeletePartImage,
  errors = {},
  disabled = false
}: PartManagerProps) {
  const [activeLightboxImage, setActiveLightboxImage] = useState<ClaimPartImage | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Trigger file dialog specifically for the given partId
  const handleTriggerUpload = (partId: string) => {
    if (fileInputRefs.current[partId]) {
      fileInputRefs.current[partId]?.click();
    }
  };

  // Process file upload for a specific part
  const handleFileChange = async (partId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset file input value so same file can be re-selected if needed
    e.target.value = '';
    setUploadError(null);

    if (!file) return;

    // 1. Validation: Supported format (JPG, PNG, WEBP)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setUploadError(`Unsupported format "${file.name}". Please upload a JPG, PNG, or WEBP image.`);
      return;
    }

    // 2. Validation: File size limit (5 MB max)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(`File too large (${mbSize} MB). Maximum allowed image size is 5 MB.`);
      return;
    }

    // Find the part to get its current srNo and partNo
    const targetPart = parts.find(p => p.id === partId);
    const srNo = targetPart?.srNo || 1;
    const partNo = targetPart?.partNo || claim.partNo || 'PART';

    // Format human-readable file size
    const sizeStr = file.size < 1024 * 1024
      ? `${Math.round(file.size / 1024)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    // 3. Read image as Data URL
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const newImage: ClaimPartImage = {
          id: crypto.randomUUID(),
          claimId: claim.id,
          partId,
          srNo,
          partNo,
          fileName: file.name,
          fileUrl: dataUrl,
          fileSize: sizeStr,
          uploadedBy: 'Swapnil (Service Head)',
          uploadedAt: new Date().toISOString(),
          remarks: `Part evidence photo for Sr. No. ${srNo} (${partNo})`
        };

        await onAddPartImage(partId, newImage);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to read image file:', err);
      setUploadError('Failed to process image file. Please try again.');
    }
  };

  // Add a new empty part row
  const handleAddPart = () => {
    const nextSrNo = parts.length > 0 ? Math.max(...parts.map(p => p.srNo || 1)) + 1 : 1;
    const newPart: ClaimPart = {
      id: crypto.randomUUID(),
      srNo: nextSrNo,
      partNo: '',
      description: '',
      qty: 1,
      remarks: '',
      images: []
    };
    onChangeParts([...parts, newPart]);
  };

  // Remove a part row and clean up its associated images
  const handleRemovePart = (partId: string) => {
    if (parts.length <= 1) {
      alert('A claim must have at least one part/material row.');
      return;
    }
    const part = parts.find(p => p.id === partId);
    if (part?.images && part.images.length > 0) {
      const confirmDelete = window.confirm(
        `Sr. No. ${part.srNo} has ${part.images.length} attached image(s). Removing this part will also remove its evidence images. Proceed?`
      );
      if (!confirmDelete) return;
    }

    const filtered = parts.filter(p => p.id !== partId);
    // Renumber Sr. No. cleanly
    const renumbered = filtered.map((p, idx) => ({
      ...p,
      srNo: idx + 1,
      images: p.images?.map(img => ({ ...img, srNo: idx + 1 }))
    }));
    onChangeParts(renumbered);
  };

  // Update specific fields of a part
  const handleUpdatePart = (partId: string, field: keyof ClaimPart, val: any) => {
    const updated = parts.map(p => {
      if (p.id === partId) {
        const u = { ...p, [field]: val };
        // If partNo changed, keep image labels in sync
        if (field === 'partNo' && u.images) {
          u.images = u.images.map(img => ({ ...img, partNo: val }));
        }
        return u;
      }
      return p;
    });
    onChangeParts(updated);
  };

  return (
    <div className="part-manager-section">
      <div className="section-title-bar-row">
        <div>
          <span className="section-subtitle">ITEMIZED DEFECT AUDIT</span>
          <h4 className="part-manager-title">
            <Package size={18} className="title-icon" />
            PARTS & MATERIALS BREAKDOWN (SR. NO. MAPPING)
          </h4>
          <p className="part-manager-desc">
            Every defective component must have an individual Sr. No. and explicit part-wise photo evidence.
          </p>
        </div>
        {!disabled && (
          <button 
            type="button" 
            className="secondary-btn btn-add-part" 
            onClick={handleAddPart}
            title="Add another defective part/material row to this claim"
          >
            <Plus size={15} />
            <span>+ Add Part / Material</span>
          </button>
        )}
      </div>

      {uploadError && (
        <div className="upload-error-banner">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
          <button type="button" className="close-banner-btn" onClick={() => setUploadError(null)}>×</button>
        </div>
      )}

      {/* PARTS TABLE */}
      <div className="parts-table-container">
        <table className="parts-matrix-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Sr. No.</th>
              <th style={{ width: '180px' }}>Part No. / Code <strong className="req">*</strong></th>
              <th>Description / Defect Symptoms</th>
              <th style={{ width: '90px' }}>Qty <strong className="req">*</strong></th>
              <th style={{ minWidth: '280px' }}>Part-Wise Evidence Images</th>
              {!disabled && <th style={{ width: '60px', textAlign: 'center' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {parts.map((p, idx) => {
              const partImages = p.images || [];
              const partNoErr = errors[`part_${p.id}_partNo`];
              const qtyErr = errors[`part_${p.id}_qty`];

              return (
                <tr key={p.id} className="part-matrix-row">
                  {/* SR. NO. */}
                  <td className="td-srno">
                    <span className="sr-badge">#{p.srNo || idx + 1}</span>
                  </td>

                  {/* PART NO */}
                  <td className="td-partno">
                    <input
                      type="text"
                      className={`form-input part-input ${partNoErr ? 'input-error' : ''}`}
                      placeholder="e.g. OIL-TNK-01"
                      value={p.partNo}
                      onChange={e => handleUpdatePart(p.id, 'partNo', e.target.value)}
                      disabled={disabled}
                    />
                    {partNoErr && <small className="field-error">{partNoErr}</small>}
                  </td>

                  {/* DESCRIPTION */}
                  <td className="td-desc">
                    <input
                      type="text"
                      className="form-input desc-input"
                      placeholder="e.g. Oil Tank Assembly with stress crack"
                      value={p.description}
                      onChange={e => handleUpdatePart(p.id, 'description', e.target.value)}
                      disabled={disabled}
                    />
                  </td>

                  {/* QUANTITY */}
                  <td className="td-qty">
                    <input
                      type="number"
                      min="1"
                      className={`form-input qty-input ${qtyErr ? 'input-error' : ''}`}
                      value={p.qty}
                      onChange={e => handleUpdatePart(p.id, 'qty', Number(e.target.value))}
                      disabled={disabled}
                    />
                    {qtyErr && <small className="field-error">{qtyErr}</small>}
                  </td>

                  {/* PART-WISE EVIDENCE IMAGES */}
                  <td className="td-images">
                    <div className="part-images-cell">
                      {/* Hidden File Input specifically for this part row */}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        ref={el => { fileInputRefs.current[p.id] = el; }}
                        style={{ display: 'none' }}
                        onChange={e => handleFileChange(p.id, e)}
                        disabled={disabled}
                      />

                      {/* Attached Image Thumbnails */}
                      <div className="thumbnails-strip">
                        {partImages.map(img => (
                          <div 
                            key={img.id} 
                            className="part-thumb-wrapper"
                            title={`${img.fileName} (${img.fileSize || 'N/A'})\nClick to inspect image`}
                          >
                            <img 
                              src={img.fileUrl} 
                              alt={img.fileName} 
                              className="part-thumb-img" 
                              onClick={() => setActiveLightboxImage(img)}
                            />
                            <div className="thumb-overlay" onClick={() => setActiveLightboxImage(img)}>
                              <ZoomIn size={13} className="zoom-icon" />
                            </div>
                            {!disabled && (
                              <button
                                type="button"
                                className="thumb-delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeletePartImage(p.id, img.id);
                                }}
                                title="Remove this image"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Attach Image Button */}
                        {!disabled && (
                          <button
                            type="button"
                            className="btn-attach-image"
                            onClick={() => handleTriggerUpload(p.id)}
                            title={`Attach photo evidence for Sr. No. ${p.srNo || idx + 1} (${p.partNo || 'Part'})`}
                          >
                            <Camera size={14} />
                            <span>+ Attach Image</span>
                          </button>
                        )}
                      </div>

                      {/* Evidence Count Status */}
                      <div className="evidence-count-bar">
                        {partImages.length > 0 ? (
                          <span className="ev-tag ev-has-images">
                            <CheckCircle2 size={11} />
                            {partImages.length} image{partImages.length > 1 ? 's' : ''} mapped to Sr. #{p.srNo || idx + 1}
                          </span>
                        ) : (
                          <span className="ev-tag ev-no-images">
                            <Info size={11} />
                            No photo attached yet
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* REMOVE PART ACTION */}
                  {!disabled && (
                    <td className="td-action">
                      {parts.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-part"
                          onClick={() => handleRemovePart(p.id)}
                          title={`Remove Sr. No. ${p.srNo || idx + 1}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* IMAGE LIGHTBOX / INSPECTOR MODAL */}
      {activeLightboxImage && (
        <div className="image-lightbox-overlay" onClick={() => setActiveLightboxImage(null)}>
          <div className="image-lightbox-card" onClick={e => e.stopPropagation()}>
            <div className="lightbox-header">
              <div className="lightbox-title-left">
                <ImageIcon size={18} className="modal-icon" />
                <div>
                  <h4>Defect Evidence Inspection</h4>
                  <p className="lightbox-sub">
                    Sr. No. {activeLightboxImage.srNo} · Part: <strong>{activeLightboxImage.partNo || 'N/A'}</strong>
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="lightbox-close-btn" 
                onClick={() => setActiveLightboxImage(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="lightbox-body">
              <div className="lightbox-image-viewport">
                <img 
                  src={activeLightboxImage.fileUrl} 
                  alt={activeLightboxImage.fileName} 
                  className="lightbox-full-img" 
                />
              </div>

              <div className="lightbox-meta-panel">
                <div className="meta-row">
                  <span className="meta-label">File Name:</span>
                  <span className="meta-val">{activeLightboxImage.fileName}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">File Size:</span>
                  <span className="meta-val">{activeLightboxImage.fileSize || 'Standard'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Associated Part:</span>
                  <span className="meta-val">
                    <strong>Sr. No. {activeLightboxImage.srNo}</strong> ({activeLightboxImage.partNo || 'Unassigned'})
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Uploaded By:</span>
                  <span className="meta-val">{activeLightboxImage.uploadedBy}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Upload Timestamp:</span>
                  <span className="meta-val">
                    {new Date(activeLightboxImage.uploadedAt).toLocaleString()}
                  </span>
                </div>
                {activeLightboxImage.remarks && (
                  <div className="meta-row remarks-row">
                    <span className="meta-label">Technical Remarks:</span>
                    <p className="meta-remarks">{activeLightboxImage.remarks}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lightbox-footer">
              <span className="lightbox-compliance-stamp">
                ✓ Controlled ISO 9001:2015 Technical Evidence
              </span>
              <div className="lightbox-footer-actions">
                {!disabled && (
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => {
                      onDeletePartImage(activeLightboxImage.partId, activeLightboxImage.id);
                      setActiveLightboxImage(null);
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Image</span>
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setActiveLightboxImage(null)}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
