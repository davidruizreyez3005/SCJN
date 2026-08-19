import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  limit, 
  where,
  writeBatch,
  getCountFromServer
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { TesisData } from '../types';

/**
 * Extracts comprehensive, searchable lowercase tokens, prefixes, and synonyms from a tesis record
 */
function extractTokens(tesis: TesisData): string[] {
  const text = `${tesis.rubro || ''} ${tesis.materia || ''} ${tesis.epoca || ''} ${tesis.tipoTesis || ''} ${tesis.instancia || ''} ${tesis.organoJurisdiccional || ''} ${(tesis.temasClave || []).join(' ')} ${(tesis.materias || []).join(' ')} ${tesis.clave || ''} ${tesis.registroDigital || ''} ${tesis.precedentes || ''}`;
  
  const rawWords = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length >= 2);

  const tokens = new Set<string>();

  for (const w of rawWords) {
    tokens.add(w);
    // Add sub-prefixes for fast prefix search
    if (w.length >= 4) {
      tokens.add(w.slice(0, 4));
    }
    if (w.length >= 6) {
      tokens.add(w.slice(0, 5));
    }
  }

  // Add individual keywords from temasClave
  if (Array.isArray(tesis.temasClave)) {
    tesis.temasClave.forEach(tc => {
      const cleanTc = tc.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (cleanTc) tokens.add(cleanTc);
    });
  }

  // Add registro digital explicitly
  if (tesis.registroDigital) tokens.add(String(tesis.registroDigital).trim());
  if (tesis.id) tokens.add(String(tesis.id).trim());
  if (tesis.ius) tokens.add(String(tesis.ius).trim());

  return Array.from(tokens).slice(0, 300);
}

/**
 * Saves a single tesis criterion to Firestore with full metadata
 */
export async function saveTesisToCloud(tesis: TesisData): Promise<boolean> {
  try {
    const id = String(tesis.registroDigital || tesis.ius || tesis.id);
    if (!id) return false;
    const docRef = doc(db, 'tesis', id);
    const tokens = extractTokens(tesis);
    
    await setDoc(docRef, {
      ...tesis,
      id,
      ius: id,
      registroDigital: id,
      searchTokens: tokens,
      rubroLower: (tesis.rubro || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      fullTextSearch: `${tesis.rubro || ''} ${tesis.texto || ''} ${tesis.precedentes || ''}`.toLowerCase(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore single write error:', err);
    return false;
  }
}

/**
 * Fast bulk batch write into Firestore with all metadata (500 docs per chunk using writeBatch)
 */
export async function uploadEntireDatabaseToFirestore(
  tesisList: TesisData[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<number> {
  let totalUploaded = 0;
  const chunkSize = 250; // Balanced chunk size for Firestore

  for (let i = 0; i < tesisList.length; i += chunkSize) {
    const chunk = tesisList.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const tesis of chunk) {
      const id = String(tesis.registroDigital || tesis.ius || tesis.id);
      if (!id) continue;
      const docRef = doc(db, 'tesis', id);
      const tokens = extractTokens(tesis);

      batch.set(docRef, {
        ...tesis,
        id,
        ius: id,
        registroDigital: id,
        searchTokens: tokens,
        rubroLower: (tesis.rubro || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
        fullTextSearch: `${tesis.rubro || ''} ${tesis.texto || ''} ${tesis.precedentes || ''}`.toLowerCase(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    try {
      await batch.commit();
      totalUploaded += chunk.length;
      if (onProgress) {
        onProgress(totalUploaded, tesisList.length);
      }
    } catch (batchErr) {
      console.warn('Batch commit chunk error, falling back to individual writes:', batchErr);
      for (const item of chunk) {
        const ok = await saveTesisToCloud(item);
        if (ok) totalUploaded++;
      }
    }
  }

  return totalUploaded;
}

/**
 * Gets total count of tesis stored in Firestore
 */
export async function getFirestoreTesisCount(): Promise<number> {
  try {
    const coll = collection(db, 'tesis');
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
  } catch (err) {
    console.warn('Firestore count query error:', err);
    return 0;
  }
}

/**
 * Direct comprehensive search in Cloud Firestore across all metadata fields
 */
export async function searchFirestoreTesis(
  searchTerm: string,
  epoca?: string,
  materia?: string,
  instancia?: string,
  maxResults = 50
): Promise<TesisData[]> {
  try {
    const coll = collection(db, 'tesis');
    const cleanWord = searchTerm
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const words = cleanWord.split(/\s+/).filter(w => w.length >= 2);
    
    let list: TesisData[] = [];

    if (words.length > 0) {
      // 1. Try array-contains with first primary token
      const primaryWord = words[0];
      const q = query(
        coll, 
        where('searchTokens', 'array-contains', primaryWord),
        limit(maxResults)
      );

      const snap = await getDocs(q);
      snap.forEach((d) => {
        list.push(d.data() as TesisData);
      });
    }

    // If few results or no search term, fetch recent records
    if (list.length < 5) {
      const fallbackQuery = query(coll, limit(maxResults));
      const fallbackSnap = await getDocs(fallbackQuery);
      fallbackSnap.forEach((d) => {
        const data = d.data() as TesisData;
        const exists = list.some(item => String(item.registroDigital || item.id) === String(data.registroDigital || data.id));
        if (!exists) {
          list.push(data);
        }
      });
    }

    // Apply multi-field matching & filtering on full metadata in memory
    if (cleanWord) {
      list = list.filter(t => {
        const full = `${t.rubro || ''} ${t.texto || ''} ${t.precedentes || ''} ${t.materia || ''} ${(t.temasClave || []).join(' ')} ${t.clave || ''} ${t.registroDigital || ''}`
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        return words.every(w => full.includes(w)) || words.some(w => full.includes(w));
      });
    }

    if (epoca && epoca !== 'todas') {
      const epClean = epoca.toLowerCase();
      list = list.filter(t => (t.epoca || '').toLowerCase().includes(epClean));
    }
    if (materia && materia !== 'todas') {
      const matClean = materia.toLowerCase();
      list = list.filter(t => 
        (t.materia || '').toLowerCase().includes(matClean) || 
        (t.materias || []).some(m => m.toLowerCase().includes(matClean))
      );
    }
    if (instancia && instancia !== 'todas' && instancia !== 'all') {
      const instClean = instancia.toLowerCase();
      list = list.filter(t => 
        (t.instancia || '').toLowerCase().includes(instClean) ||
        (t.organoJurisdiccional || '').toLowerCase().includes(instClean)
      );
    }

    return list;
  } catch (err) {
    console.warn('Firestore search error:', err);
    return [];
  }
}

/**
 * Retrieves a tesis from Firestore by Registro Digital / IUS
 */
export async function getTesisFromCloud(id: string): Promise<TesisData | null> {
  try {
    const docRef = doc(db, 'tesis', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as TesisData;
    }
    return null;
  } catch (err) {
    console.warn('Firestore read error:', err);
    return null;
  }
}

/**
 * Saves a user dossier to Cloud
 */
export async function saveUserDossierToCloud(title: string, tesisList: TesisData[]): Promise<string | null> {
  try {
    const user = auth.currentUser;
    const uid = user ? user.uid : 'guest_device';
    const dossierId = 'dossier_' + Date.now();
    const docRef = doc(db, 'users', uid, 'dossiers', dossierId);
    
    await setDoc(docRef, {
      id: dossierId,
      title,
      userId: uid,
      tesisCount: tesisList.length,
      tesisIds: tesisList.map(t => String(t.registroDigital || t.id)),
      tesisSnapshot: tesisList,
      updatedAt: new Date().toISOString()
    });

    return dossierId;
  } catch (err) {
    console.warn('Save dossier to cloud error:', err);
    return null;
  }
}
