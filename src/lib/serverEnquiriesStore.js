import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'enquiries.json');
const TMP_DIR = path.join('/tmp', 'reelexpress_data');
const TMP_FILE_PATH = path.join(TMP_DIR, 'enquiries.json');

function safeWrite(content) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, content, 'utf-8');
    return true;
  } catch {
    try {
      if (!fs.existsSync(TMP_DIR)) {
        fs.mkdirSync(TMP_DIR, { recursive: true });
      }
      fs.writeFileSync(TMP_FILE_PATH, content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }
}

function safeRead() {
  try {
    if (fs.existsSync(FILE_PATH)) {
      return fs.readFileSync(FILE_PATH, 'utf-8');
    }
  } catch {}
  try {
    if (fs.existsSync(TMP_FILE_PATH)) {
      return fs.readFileSync(TMP_FILE_PATH, 'utf-8');
    }
  } catch {}
  return null;
}

export function readServerEnquiries() {
  try {
    const raw = safeRead();
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[ServerEnquiriesStore] Read error:', err.message);
    return [];
  }
}

export function writeServerEnquiries(list) {
  try {
    return safeWrite(JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('[ServerEnquiriesStore] Write error:', err.message);
    return false;
  }
}

export function saveServerEnquiry(enquiry) {
  const list = readServerEnquiries();
  const id = enquiry.id || `enq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const item = {
    ...enquiry,
    id,
    cloudSynced: Boolean(enquiry.cloudSynced),
    updatedAt: new Date().toISOString(),
  };

  const existingIdx = list.findIndex((e) => e.id === id);
  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...item };
  } else {
    list.unshift(item);
  }

  writeServerEnquiries(list);
  return item;
}

export function updateServerEnquiryStatus(id, newStatus, adminEmail = 'admin@reelxpress.com') {
  const list = readServerEnquiries();
  const idx = list.findIndex((e) => e.id === id);
  if (idx >= 0) {
    list[idx].status = newStatus;
    list[idx].updatedAt = new Date().toISOString();
    list[idx].updatedBy = adminEmail;
    writeServerEnquiries(list);
    return list[idx];
  }
  return null;
}

export function getServerEnquiryById(id) {
  const list = readServerEnquiries();
  return list.find((e) => e.id === id) || null;
}

export function updateServerEnquiryFields(id, updates = {}) {
  const list = readServerEnquiries();
  const idx = list.findIndex((e) => e.id === id);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeServerEnquiries(list);
    return list[idx];
  }
  return null;
}

export function deleteServerEnquiry(id) {
  const list = readServerEnquiries();
  const filtered = list.filter((e) => e.id !== id);
  writeServerEnquiries(filtered);
  return true;
}
