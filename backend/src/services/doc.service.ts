import { DocModel, IDocument } from '../models/doc.model';
import { NotFoundError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface DocTreeNode {
  _id: string;
  title: string;
  icon?: string;
  parentDocId?: string | null;
  children: DocTreeNode[];
  createdAt: Date;
  updatedAt: Date;
}

export class DocService {
  /**
   * Create a new document or sub-document in a workspace.
   */
  public static async createDoc(
    workspaceId: string,
    authorId: string,
    title: string = 'Untitled',
    parentDocId?: string | null
  ): Promise<IDocument> {
    const doc = await DocModel.create({
      workspaceId,
      authorId,
      title,
      parentDocId: parentDocId || null
    });

    logger.info(`Document created: ${doc._id} in workspace ${workspaceId}`);
    return doc;
  }

  /**
   * Get workspace documents as a hierarchical tree (Notion sidebar structure).
   */
  public static async getWorkspaceDocsTree(workspaceId: string): Promise<DocTreeNode[]> {
    const docs = await DocModel.find({ workspaceId, isArchived: false })
      .select('_id title icon parentDocId createdAt updatedAt')
      .sort({ createdAt: 1 });

    return this.buildTree(docs);
  }

  /**
   * Helper algorithm to transform flat document array into a nested tree structure.
   */
  private static buildTree(docs: any[]): DocTreeNode[] {
    const docMap = new Map<string, DocTreeNode>();
    const tree: DocTreeNode[] = [];

    docs.forEach((doc) => {
      docMap.set(doc._id.toString(), {
        _id: doc._id.toString(),
        title: doc.title,
        icon: doc.icon,
        parentDocId: doc.parentDocId ? doc.parentDocId.toString() : null,
        children: [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      });
    });

    docMap.forEach((node) => {
      if (node.parentDocId && docMap.has(node.parentDocId)) {
        docMap.get(node.parentDocId)!.children.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  /**
   * Get document content by ID.
   */
  public static async getDocById(docId: string): Promise<IDocument> {
    const doc = await DocModel.findById(docId).populate('authorId', 'name email avatar');
    if (!doc || doc.isArchived) {
      throw new NotFoundError('Document not found');
    }
    return doc;
  }

  /**
   * Update document content (Used for auto-saving Notion editor).
   */
  public static async updateDoc(
    docId: string,
    updateData: { title?: string; content?: string; isPublic?: boolean; icon?: string; coverImage?: string }
  ): Promise<IDocument> {
    const doc = await DocModel.findByIdAndUpdate(docId, { $set: updateData }, { new: true, runValidators: true });
    if (!doc) {
      throw new NotFoundError('Document not found');
    }
    logger.info(`Document updated: ${docId}`);
    return doc;
  }

  /**
   * Archive / soft-delete a document.
   */
  public static async archiveDoc(docId: string): Promise<void> {
    const doc = await DocModel.findByIdAndUpdate(docId, { $set: { isArchived: true } });
    if (!doc) {
      throw new NotFoundError('Document not found');
    }
    logger.info(`Document archived: ${docId}`);
  }
}