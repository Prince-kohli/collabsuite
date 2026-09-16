import mongoose from 'mongoose';
import { Card } from '../models/card.model';
import { DocModel } from '../models/doc.model';
import { Message } from '../models/message.model';

export interface SearchResults {
  cards: any[];
  docs: any[];
  messages: any[];
}

export class SearchService {
  /**
   * Executes unified global search across Cards, Docs, and Messages using MongoDB Aggregations.
   */
  public static async globalSearch(workspaceId: string, queryText: string): Promise<SearchResults> {
    const regex = new RegExp(queryText, 'i');
    const workspaceObjId = new mongoose.Types.ObjectId(workspaceId);

    // 1. Cards Search Pipeline
    const cardsPipeline = Card.aggregate([
      {
        $match: {
          boardId: { $exists: true },
          $or: [{ title: regex }, { description: regex }]
        }
      },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          boardId: 1,
          listId: 1,
          type: { $literal: 'card' }
        }
      }
    ]);

    // 2. Docs Search Pipeline
    const docsPipeline = DocModel.aggregate([
      {
        $match: {
          workspaceId: workspaceObjId,
          isArchived: false,
          $or: [{ title: regex }, { content: regex }]
        }
      },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          title: 1,
          workspaceId: 1,
          type: { $literal: 'doc' }
        }
      }
    ]);

    // 3. Messages Search Pipeline
    const messagesPipeline = Message.aggregate([
      {
        $match: {
          content: regex
        }
      },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          content: 1,
          channelId: 1,
          type: { $literal: 'message' }
        }
      }
    ]);

    const [cards, docs, messages] = await Promise.all([
      cardsPipeline,
      docsPipeline,
      messagesPipeline
    ]);

    return { cards, docs, messages };
  }
}