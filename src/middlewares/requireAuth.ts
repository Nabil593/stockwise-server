import type {
  Request,
  Response,
  NextFunction,
} from "express";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    res.status(500).json({
      success: false,
      message: "FRONTEND_URL is not configured",
    });
    return;
  }

  const cookie = req.headers.cookie;

  if (!cookie) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const response = await fetch(
      `${frontendUrl.replace(/\/$/, "")}/api/auth/get-session`,
      {
        headers: {
          cookie,
          accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
      return;
    }

    const sessionData: unknown = await response.json();

    if (
      !sessionData ||
      typeof sessionData !== "object" ||
      !("user" in sessionData) ||
      !sessionData.user ||
      typeof sessionData.user !== "object" ||
      !("id" in sessionData.user) ||
      typeof sessionData.user.id !== "string"
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid session",
      });
      return;
    }

    req.user = {
      id: sessionData.user.id,
    };

    next();
  } catch {
    res.status(503).json({
      success: false,
      message: "Unable to verify authentication session",
    });
  }
}