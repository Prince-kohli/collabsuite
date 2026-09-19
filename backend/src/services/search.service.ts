import mongoose from 'mongoose';
import { Card } from '../models/card.model';
import { DocModel } from '../models/doc.model';
import { Message } from '../models/message.model';

export interface SearchResultItem {
  id: string;
  title: string;
  type: 'card' | 'doc' | 'message';
  snippet?: string;
  url: string;
}

export interface SearchResults {
  cards: any[];
  docs: any[];
  messages: any[];
  results: SearchResultItem[];
}

export class SearchService {
  /**
   * Workspace-scoped global search across Cards, Docs, and Messages.
   * Uses MongoDB aggregation + $lookup so results never leak across workspaces.
   */
  public static async globalSearch(
    workspaceId: string,
    queryText: string,
    userId: string
  ): Promise<SearchResults> {
    const regex = new RegExp(queryText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const workspaceObjId = new mongoose.Types.ObjectId(workspaceId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // 1. Cards — join Board to enforce workspace boundary
    const cardsPipeline = Card.aggregate([
      {
        $match: {
          $or: [{ title: regex }, { description: regex }]
        }
      },
      {
        $lookup: {
          from: 'boards',
          localField: 'boardId',
          foreignField: '_id',
          as: 'board'
        }
      },
      { $unwind: '$board' },
      {
        $match: {
          'board.workspaceId': workspaceObjId,
          'board.isArchived': { $ne: true }
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

    // 2. Docs — already have workspaceId
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

    // 3. Messages — join Channel; only channels the user is a member of
    const messagesPipeline = Message.aggregate([
      {
        $match: {
          content: regex
        }
      },
      {
        $lookup: {
          from: 'channels',
          localField: 'channelId',
          foreignField: '_id',
          as: 'channel'
        }
      },
      { $unwind: '$channel' },
      {
        $match: {
          'channel.workspaceId': workspaceObjId,
          'channel.members': userObjId
        }
      },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          content: 1,
          channelId: 1,
          channelName: '$channel.name',
          channelType: '$channel.type',
          type: { $literal: 'message' }
        }
      }
    ]);

    const [cards, docs, messages] = await Promise.all([
      cardsPipeline,
      docsPipeline,
      messagesPipeline
    ]);

    // Flatten into UI-friendly results with deep links
    const cardResults: SearchResultItem[] = cards.map((c: any) => ({
      id: c._id.toString(),
      title: c.title || 'Untitled card',
      type: 'card' as const,
      snippet: c.description
        ? String(c.description).slice(0, 80)
        : undefined,
      url: `/workspaces/${workspaceId}/boards/${c.boardId}`
    }));

    const docResults: SearchResultItem[] = docs.map((d: any) => ({
      id: d._id.toString(),
      title: d.title || 'Untitled doc',
      type: 'doc' as const,
      snippet: undefined,
      url: `/workspaces/${workspaceId}/docs/${d._id}`
    }));

    const messageResults: SearchResultItem[] = messages.map((m: any) => ({
      id: m._id.toString(),
      title:
        m.channelType === 'dm'
          ? 'Direct Message'
          : `#${m.channelName || 'channel'}`,
      type: 'message' as const,
      snippet: m.content ? String(m.content).slice(0, 80) : undefined,
      url: `/workspaces/${workspaceId}/channels/${m.channelId}`
    }));

    return {
      cards,
      docs,
      messages,
      results: [...cardResults, ...docResults, ...messageResults]
    };
  }
}