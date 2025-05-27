import { openDB } from "idb";

const dbPromise = openDB("phishingAnalysisDB", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("analysis")) {
      db.createObjectStore("analysis", { keyPath: "domain" }); 
    }
  },
});

export const createAnalysis = async (domain, data) => {
  const db = await dbPromise;
  data.timestamp = new Date().toISOString();

  const transaction = db.transaction("analysis", "readwrite");
  const store = transaction.objectStore("analysis");

  try {
    await store.put({ domain, ...data }); // 'put' adiciona ou substitui automaticamente
  } catch (error) {
    console.error("Erro ao salvar registro no IndexedDB:", error);
  }
};


export const getAnalysis = async (domain) => {
  const db = await dbPromise;
  return await db.get("analysis", domain);
};

export const getAllAnalyses = async () => {
  const db = await dbPromise;
  return await db.getAll("analysis");
};
