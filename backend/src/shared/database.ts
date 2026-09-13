import {
  Client,
  Databases,
  Storage,
  ID,
  Query,
  type Models,
} from "node-appwrite";
import { loadConfig } from "./config.js";

export interface Page<T> {
  items: T[];
  total: number;
}

export function createAppwrite() {
  const config = loadConfig();

  const client = new Client()
    .setEndpoint(config.appwrite.endpoint)
    .setProject(config.appwrite.projectId)
    .setKey(config.appwrite.apiKey);

  const databases = new Databases(client);
  const storage = new Storage(client);

  return { config, databases, storage };
}

export async function createDocument<T extends object>(
  collectionId: string,
  data: T,
  documentId = ID.unique(),
): Promise<Models.Document & T> {
  const { config, databases } = createAppwrite();

  return databases.createDocument(
    config.appwrite.databaseId,
    collectionId,
    documentId,
    data as Omit<Models.Document, keyof Models.Document>,
  ) as Promise<Models.Document & T>;
}

export async function getDocument<T extends object>(
  collectionId: string,
  documentId: string,
): Promise<Models.Document & T> {
  const { config, databases } = createAppwrite();

  return databases.getDocument(
    config.appwrite.databaseId,
    collectionId,
    documentId,
  ) as Promise<Models.Document & T>;
}

export async function updateDocument<T extends object>(
  collectionId: string,
  documentId: string,
  data: Partial<T>,
): Promise<Models.Document & T> {
  const { config, databases } = createAppwrite();

  return databases.updateDocument(
    config.appwrite.databaseId,
    collectionId,
    documentId,
    data as Omit<Models.Document, keyof Models.Document>,
  ) as Promise<Models.Document & T>;
}

export async function deleteDocument(
  collectionId: string,
  documentId: string,
): Promise<void> {
  const { config, databases } = createAppwrite();

  await databases.deleteDocument(
    config.appwrite.databaseId,
    collectionId,
    documentId,
  );
}

export async function listDocuments<T extends object>(
  collectionId: string,
  queries: string[] = [],
  limit = 25,
  offset = 0,
): Promise<Page<Models.Document & T>> {
  const { config, databases } = createAppwrite();

  const result = await databases.listDocuments(
    config.appwrite.databaseId,
    collectionId,
    [
      ...queries,
      Query.limit(Math.min(limit, 100)),
      Query.offset(Math.max(offset, 0)),
    ],
  );

  return {
    items: result.documents as Array<Models.Document & T>,
    total: result.total,
  };
}

export { ID, Query };
