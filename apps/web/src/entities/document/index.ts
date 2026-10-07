export type { Document, DocumentComment, DocumentProperties, DocumentTreeNode } from "./model/types";
export { buildDocumentTree, getAncestorIds } from "./model/build-tree";
export {
  addDocumentComment,
  getAllDocuments,
  getDocument,
  getDocumentComments,
  getDocumentContent,
  getRecentDocuments,
  getTeamDocuments,
  saveDocumentContent,
} from "./api/document-api";
