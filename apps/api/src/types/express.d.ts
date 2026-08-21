export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        isSuperAdmin: boolean;
      };
      keyStore?: {
        id: string;
        userId: string;
        primaryKey: string;
        secondaryKey: string;
        status: boolean;
      };
      org?: {
        id: string;
        name: string;
        slug: string;
      };
      membership?: {
        id: string;
        role: string;
        organizationId: string;
        userId: string;
      };
    }
  }
}
