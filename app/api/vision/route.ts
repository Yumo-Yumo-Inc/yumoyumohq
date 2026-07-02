import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import { checkPipelineRateLimit } from "@/lib/auth/rate-limit";

// Allowed URL prefixes for imageUrl to prevent SSRF
const ALLOWED_URL_PREFIXES = [
  "https://public.blob.vercel-storage.com/",
  "https://storage.googleapis.com/",
];

function isAllowedImageUrl(url: string): boolean {
  return ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

/**
 * Google Vision API Route
 * Used to analyze receipt images
 *
 * POST /api/vision
 * Body: { image: base64 string or imageUrl: string }
 */
export async function POST(req: Request) {
  try {
    const username = await getSessionUsername();
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Direct Vision OCR spends the Google Vision quota on the server key. This
    // endpoint is outside the main receipt flow, so a burst-only cap is enough.
    const visionLimit = await checkPipelineRateLimit(username, "vision-direct", { dailyMax: 0 });
    if (!visionLimit.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const body = await req.json();
    const { image, imageUrl } = body;

    // Validate input
    if (!image && !imageUrl) {
      return NextResponse.json(
        { error: "Image or imageUrl is required" },
        { status: 400 }
      );
    }

    // SSRF protection: only fetch from known-safe storage domains
    if (imageUrl && !isAllowedImageUrl(imageUrl)) {
      return NextResponse.json(
        { error: "imageUrl must point to an allowed storage domain" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      console.error("[api/vision] GOOGLE_VISION_API_KEY not configured");
      return NextResponse.json(
        { error: "Vision API not configured" },
        { status: 500 }
      );
    }

    // Google Vision API endpoint
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate`;

    // Prepare request body
    let imageContent: string;
    if (image) {
      // Remove data URL prefix if present
      imageContent = image.replace(/^data:image\/[a-z]+;base64,/, "");
    } else if (imageUrl) {
      // Fetch image and convert to base64
      // redirect:"error" so an open redirect on an allowlisted storage host
      // can't bounce the fetch to an internal/metadata endpoint (SSRF).
      const imageResponse = await fetch(imageUrl, { redirect: "error" });
      const imageBuffer = await imageResponse.arrayBuffer();
      imageContent = Buffer.from(imageBuffer).toString("base64");
    } else {
      return NextResponse.json(
        { error: "Invalid image data" },
        { status: 400 }
      );
    }

    // Call Google Vision API
    const visionResponse = await fetch(visionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageContent,
            },
            features: [
              {
                type: "TEXT_DETECTION", // Receipt text extraction
                maxResults: 10,
              },
              {
                type: "DOCUMENT_TEXT_DETECTION", // Better for receipts
                maxResults: 10,
              },
            ],
          },
        ],
      }),
    });

    if (!visionResponse.ok) {
      const errorData = await visionResponse.text();
      console.error("[api/vision] Google Vision API error:", errorData);
      return NextResponse.json(
        {
          error: "Failed to process image with Vision API",
          details: errorData,
        },
        { status: visionResponse.status }
      );
    }

    const visionData = await visionResponse.json();
    
    // Extract text from response
    const textAnnotations = visionData.responses[0]?.textAnnotations || [];
    const fullText = textAnnotations[0]?.description || "";
    const detectedText = textAnnotations.slice(1).map((annotation: any) => ({
      text: annotation.description,
      boundingBox: annotation.boundingPoly,
    }));

    return NextResponse.json({
      success: true,
      fullText,
      detectedText,
      rawResponse: visionData,
    });
  } catch (error: any) {
    console.error("[api/vision] error:", error);
    return NextResponse.json(
      {
        error: "Failed to process image",
      },
      { status: 500 }
    );
  }
}






