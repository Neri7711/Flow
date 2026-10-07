export type { Document, DocumentComment, DocumentProperties, DocumentTreeNode } from "./model/types";
export { buildDocumentTree, getAncestorIds } from "./model/build-tree";
export { UNTITLED_DOCUMENT } from "./model/untitled";
export {
  addDocumentComment,
  createDocument,
  deleteDocument,
  getAllDocuments,
  getDocument,
  getDocumentComments,
  getDocumentContent,
  getRecentDocuments,
  getTeamDocuments,
  renameDocument,
  saveDocumentContent,
} from "./api/document-api";
