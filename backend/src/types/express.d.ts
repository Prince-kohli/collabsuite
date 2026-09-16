import { TokenPayload } from '../utils/jwt.util';
import { IWorkspace, WorkspaceRole } from '../models/workspace.model';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      workspace?: IWorkspace;
      userWorkspaceRole?: WorkspaceRole;
    }
  }
}