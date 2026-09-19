import swaggerJSDoc from 'swagger-jsdoc';

const bearer = [{ BearerAuth: [] }];

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CollabSuite SaaS Platform API Documentation',
      version: '1.0.0',
      description:
        'Full REST API reference for CollabSuite (Auth, Workspaces, Trello, Docs, Slack, Search, Notifications).'
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token. Format: Bearer <token>'
        }
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'number', example: 200 },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'number' },
            message: { type: 'string' }
          }
        }
      }
    },
    security: bearer,
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Workspaces' },
      { name: 'Trello' },
      { name: 'Docs' },
      { name: 'Slack' },
      { name: 'Search' },
      { name: 'Notifications' }
    ],
    paths: {
      // ===================== HEALTH =====================
      '/api/v1/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          security: [],
          responses: {
            '200': { description: 'Service operational', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } } } }
          }
        }
      },

      // ===================== AUTH =====================
      '/api/v1/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register user and send email OTP',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Registered; OTP sent' }, '409': { description: 'Email already exists' } }
        }
      },
      '/api/v1/auth/verify-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Verify registration OTP',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'otp'],
                  properties: {
                    email: { type: 'string' },
                    otp: { type: 'string', example: '123456' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Email verified' }, '400': { description: 'Invalid/expired OTP' } }
        }
      },
      '/api/v1/auth/resend-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Resend registration OTP',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string' } }
                }
              }
            }
          },
          responses: { '200': { description: 'OTP resent' } }
        }
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive access + refresh tokens',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Logged in' }, '401': { description: 'Invalid credentials' } }
        }
      },
      '/api/v1/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password-reset OTP',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string' } }
                }
              }
            }
          },
          responses: { '200': { description: 'Generic success (does not leak email existence)' } }
        }
      },
      '/api/v1/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password with OTP',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'otp', 'newPassword'],
                  properties: {
                    email: { type: 'string' },
                    otp: { type: 'string' },
                    newPassword: { type: 'string', minLength: 8 }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Password updated' }, '400': { description: 'Invalid OTP' } }
        }
      },
      '/api/v1/auth/refresh-token': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          security: [],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { refreshToken: { type: 'string' } }
                }
              }
            }
          },
          responses: { '200': { description: 'New access token' }, '401': { description: 'Invalid refresh token' } }
        }
      },
      '/api/v1/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout and revoke refresh session',
          security: bearer,
          responses: { '200': { description: 'Logged out' } }
        }
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          security: bearer,
          responses: { '200': { description: 'Profile' }, '401': { description: 'Unauthorized' } }
        }
      },

      // ===================== WORKSPACES =====================
      '/api/v1/workspaces': {
        get: {
          tags: ['Workspaces'],
          summary: 'List workspaces for current user',
          security: bearer,
          responses: { '200': { description: 'Workspace list' } }
        },
        post: {
          tags: ['Workspaces'],
          summary: 'Create workspace (creator becomes owner)',
          security: bearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Created' } }
        }
      },
      '/api/v1/workspaces/{id}': {
        get: {
          tags: ['Workspaces'],
          summary: 'Get workspace by id + currentUserRole',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Workspace detail' }, '403': { description: 'Not a member' } }
        },
        patch: {
          tags: ['Workspaces'],
          summary: 'Update workspace name/description (owner)',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Updated' }, '403': { description: 'Owner only' } }
        },
        delete: {
          tags: ['Workspaces'],
          summary: 'Delete workspace and cascade resources (owner)',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' }, '403': { description: 'Owner only' } }
        }
      },
      '/api/v1/workspaces/{id}/members': {
        post: {
          tags: ['Workspaces'],
          summary: 'Invite member by email (owner) — role member|viewer',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'role'],
                  properties: {
                    email: { type: 'string' },
                    role: { type: 'string', enum: ['member', 'viewer'] }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Member added' }, '404': { description: 'User/email not found' } }
        }
      },
      '/api/v1/workspaces/{id}/members/{memberId}': {
        patch: {
          tags: ['Workspaces'],
          summary: 'Update member role (owner) — owner|member|viewer',
          security: bearer,
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role'],
                  properties: {
                    role: { type: 'string', enum: ['owner', 'member', 'viewer'] }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Role updated' } }
        },
        delete: {
          tags: ['Workspaces'],
          summary: 'Remove member (owner)',
          security: bearer,
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Member removed' } }
        }
      },

      // ===================== TRELLO =====================
      '/api/v1/trello/boards': {
        get: {
          tags: ['Trello'],
          summary: 'List boards in workspace',
          security: bearer,
          parameters: [{ name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Boards' } }
        },
        post: {
          tags: ['Trello'],
          summary: 'Create board',
          security: bearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['workspaceId', 'title'],
                  properties: {
                    workspaceId: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Board created' } }
        }
      },
      '/api/v1/trello/boards/{id}': {
        get: {
          tags: ['Trello'],
          summary: 'Board details + lists + cards (Redis cached)',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Board payload' } }
        },
        patch: {
          tags: ['Trello'],
          summary: 'Update board title/description',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Updated' } }
        },
        delete: {
          tags: ['Trello'],
          summary: 'Delete board (lists/cards cascade)',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } }
        }
      },
      '/api/v1/trello/lists': {
        post: {
          tags: ['Trello'],
          summary: 'Create list on board',
          security: bearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['boardId', 'title'],
                  properties: {
                    boardId: { type: 'string' },
                    title: { type: 'string' },
                    position: { type: 'number' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'List created' } }
        }
      },
      '/api/v1/trello/lists/{id}': {
        patch: {
          tags: ['Trello'],
          summary: 'Rename list',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: { title: { type: 'string' } }
                }
              }
            }
          },
          responses: { '200': { description: 'Updated' } }
        },
        delete: {
          tags: ['Trello'],
          summary: 'Delete list and its cards',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } }
        }
      },
      '/api/v1/trello/cards': {
        post: {
          tags: ['Trello'],
          summary: 'Create card',
          security: bearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['listId', 'boardId', 'title'],
                  properties: {
                    listId: { type: 'string' },
                    boardId: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    assignees: { type: 'array', items: { type: 'string' } },
                    labels: { type: 'array', items: { type: 'string' } },
                    dueDate: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Card created' } }
        }
      },
      '/api/v1/trello/cards/{id}': {
        patch: {
          tags: ['Trello'],
          summary: 'Update card fields / assignees',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    labels: { type: 'array', items: { type: 'string' } },
                    dueDate: { type: 'string', nullable: true },
                    assignees: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Updated' } }
        },
        delete: {
          tags: ['Trello'],
          summary: 'Delete card',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } }
        }
      },
      '/api/v1/trello/cards/{id}/move': {
        patch: {
          tags: ['Trello'],
          summary: 'Move card (transactional position update)',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['targetListId', 'newPosition'],
                  properties: {
                    targetListId: { type: 'string' },
                    newPosition: { type: 'number' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Moved' } }
        }
      },
      '/api/v1/trello/cards/{id}/activities': {
        get: {
          tags: ['Trello'],
          summary: 'Card activity / audit trail',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Activities' } }
        }
      },
      '/api/v1/trello/cards/{cardId}/comments': {
        get: {
          tags: ['Trello'],
          summary: 'List comments on card',
          security: bearer,
          parameters: [{ name: 'cardId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Comments' } }
        },
        post: {
          tags: ['Trello'],
          summary: 'Add comment (optional mentions)',
          security: bearer,
          parameters: [{ name: 'cardId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: { type: 'string' },
                    mentionIds: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Comment created' } }
        }
      },
      '/api/v1/trello/comments/{commentId}': {
        delete: {
          tags: ['Trello'],
          summary: 'Delete own comment',
          security: bearer,
          parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } }
        }
      },
      '/api/v1/trello/cards/{cardId}/attachments': {
        post: {
          tags: ['Trello'],
          summary: 'Upload attachment (multipart file)',
          security: bearer,
          parameters: [{ name: 'cardId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Attachment added' } }
        }
      },
      '/api/v1/trello/cards/{cardId}/attachments/{attachmentId}': {
        delete: {
          tags: ['Trello'],
          summary: 'Remove attachment from card',
          security: bearer,
          parameters: [
            { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'attachmentId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Removed' } }
        }
      },

      // ===================== DOCS =====================
      '/api/v1/docs': {
        post: {
          tags: ['Docs'],
          summary: 'Create root or nested document',
          security: bearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['workspaceId'],
                  properties: {
                    workspaceId: { type: 'string' },
                    title: { type: 'string' },
                    parentDocId: { type: 'string', nullable: true },
                    icon: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Document created' } }
        }
      },
      '/api/v1/docs/workspace/{workspaceId}/tree': {
        get: {
          tags: ['Docs'],
          summary: 'Nested document tree for sidebar',
          security: bearer,
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Tree' } }
        }
      },
      '/api/v1/docs/{id}': {
        get: {
          tags: ['Docs'],
          summary: 'Get document by id',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Document' }, '404': { description: 'Not found / archived' } }
        },
        patch: {
          tags: ['Docs'],
          summary: 'Update title/content/icon/etc (auto-save)',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    icon: { type: 'string' },
                    coverImage: { type: 'string' },
                    isPublic: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Updated' } }
        },
        delete: {
          tags: ['Docs'],
          summary: 'Archive document (soft delete)',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Archived' } }
        }
      },

      // ===================== SLACK =====================
      '/api/v1/slack/channels': {
        post: {
          tags: ['Slack'],
          summary: 'Create channel',
          security: bearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['workspaceId', 'name'],
                  properties: {
                    workspaceId: { type: 'string' },
                    name: { type: 'string' },
                    topic: { type: 'string' },
                    isPrivate: { type: 'boolean' },
                    memberIds: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Channel created' } }
        }
      },
      '/api/v1/slack/dms': {
        post: {
          tags: ['Slack'],
          summary: 'Create or get DM thread',
          security: bearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['workspaceId', 'targetUserId'],
                  properties: {
                    workspaceId: { type: 'string' },
                    targetUserId: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'DM channel' } }
        }
      },
      '/api/v1/slack/workspace/{workspaceId}/channels': {
        get: {
          tags: ['Slack'],
          summary: 'List channels/DMs user can access',
          security: bearer,
          parameters: [{ name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Channels' } }
        }
      },
      '/api/v1/slack/messages': {
        post: {
          tags: ['Slack'],
          summary: 'Send message (socket broadcast + notifications)',
          security: bearer,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['channelId', 'content'],
                  properties: {
                    channelId: { type: 'string' },
                    content: { type: 'string' },
                    attachments: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          },
          responses: { '201': { description: 'Message sent' } }
        }
      },
      '/api/v1/slack/channels/{channelId}/messages': {
        get: {
          tags: ['Slack'],
          summary: 'Cursor-paginated messages',
          security: bearer,
          parameters: [
            { name: 'channelId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'cursor', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'number', default: 30 } }
          ],
          responses: { '200': { description: 'messages, nextCursor, hasMore' } }
        }
      },
      '/api/v1/slack/channels/{channelId}/members': {
        post: {
          tags: ['Slack'],
          summary: 'Add member to channel (owner/creator)',
          security: bearer,
          parameters: [{ name: 'channelId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['memberId'],
                  properties: { memberId: { type: 'string' } }
                }
              }
            }
          },
          responses: { '200': { description: 'Member added' } }
        }
      },
      '/api/v1/slack/channels/{channelId}/members/{memberId}': {
        delete: {
          tags: ['Slack'],
          summary: 'Remove member from channel',
          security: bearer,
          parameters: [
            { name: 'channelId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: { '200': { description: 'Member removed' } }
        }
      },
      '/api/v1/slack/channels/{channelId}': {
        delete: {
          tags: ['Slack'],
          summary: 'Delete channel (not DM)',
          security: bearer,
          parameters: [{ name: 'channelId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } }
        }
      },

      // ===================== SEARCH =====================
      '/api/v1/search/workspace/{workspaceId}': {
        get: {
          tags: ['Search'],
          summary: 'Global search (cards, docs, messages) via aggregations',
          security: bearer,
          parameters: [
            { name: 'workspaceId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Min 2 chars recommended' }
          ],
          responses: {
            '200': {
              description: 'cards, docs, messages, results[] with deep links'
            }
          }
        }
      },

      // ===================== NOTIFICATIONS =====================
      '/api/v1/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Paginated notifications for current user',
          security: bearer,
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } }
          ],
          responses: { '200': { description: 'notifications, unreadCount, total' } }
        }
      },
      '/api/v1/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark one notification read',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Marked read' } }
        }
      },
      '/api/v1/notifications/read-all': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark all notifications read',
          security: bearer,
          responses: { '200': { description: 'All read' } }
        }
      },
      '/api/v1/notifications/{id}': {
        delete: {
          tags: ['Notifications'],
          summary: 'Delete one notification',
          security: bearer,
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } }
        }
      }
    }
  },
 
  apis: []
};

export const swaggerSpec = swaggerJSDoc(options);